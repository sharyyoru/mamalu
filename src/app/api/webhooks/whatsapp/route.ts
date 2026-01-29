import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeMessage } from "@/lib/whatsapp/ai-flagging";
import { processWhatsAppMessage, sendWhatsAppMessage } from "@/lib/whatsapp/bot";

/**
 * WhatsApp Webhook Endpoint
 * Receives messages from WhatsApp Business API
 */

// GET: Webhook verification (required by WhatsApp)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verify token matches the one set in WhatsApp Business API
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "mamalu_whatsapp_2024";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// POST: Receive WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("WhatsApp webhook received:", JSON.stringify(body, null, 2));

    // Verify webhook signature (optional but recommended)
    // const signature = request.headers.get("x-hub-signature-256");
    // if (!verifySignature(signature, body)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Process webhook payload
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            await processMessages(change.value, supabase);
          }
        }
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Process incoming WhatsApp messages
 */
async function processMessages(value: any, supabase: any) {
  const messages = value.messages || [];
  const contacts = value.contacts || [];
  const metadata = value.metadata || {};

  // Find the WhatsApp account in our database
  const phoneNumberId = metadata.phone_number_id;
  const { data: account } = await supabase
    .from("whatsapp_accounts")
    .select("id, super_admin_id, access_token, bot_enabled")
    .eq("business_account_id", phoneNumberId)
    .single();

  if (!account) {
    console.log("WhatsApp account not found for phone_number_id:", phoneNumberId);
    return;
  }

  for (const message of messages) {
    try {
      // Extract message data
      const messageId = message.id;
      const fromNumber = message.from;
      const timestamp = new Date(parseInt(message.timestamp) * 1000);
      const messageType = message.type;

      // Get contact name
      const contact = contacts.find((c: any) => c.wa_id === fromNumber);
      const contactName = contact?.profile?.name || null;

      // Extract message text based on type
      let messageText = "";
      let mediaUrl = null;
      let mediaMimeType = null;
      let interactiveResponse = null;

      switch (messageType) {
        case "text":
          messageText = message.text?.body || "";
          break;
        case "interactive":
          // Handle button/list responses
          if (message.interactive?.type === "button_reply") {
            interactiveResponse = message.interactive.button_reply?.id;
            messageText = message.interactive.button_reply?.title || "";
          } else if (message.interactive?.type === "list_reply") {
            interactiveResponse = message.interactive.list_reply?.id;
            messageText = message.interactive.list_reply?.title || "";
          }
          break;
        case "image":
          messageText = message.image?.caption || "";
          mediaUrl = message.image?.id;
          mediaMimeType = message.image?.mime_type;
          break;
        case "video":
          messageText = message.video?.caption || "";
          mediaUrl = message.video?.id;
          mediaMimeType = message.video?.mime_type;
          break;
        case "audio":
          mediaUrl = message.audio?.id;
          mediaMimeType = message.audio?.mime_type;
          break;
        case "document":
          messageText = message.document?.caption || message.document?.filename || "";
          mediaUrl = message.document?.id;
          mediaMimeType = message.document?.mime_type;
          break;
        case "location":
          messageText = `Location: ${message.location?.latitude}, ${message.location?.longitude}`;
          break;
        default:
          messageText = `[${messageType} message]`;
      }

      // Store message in database
      const { data: storedMessage, error: insertError } = await supabase
        .from("whatsapp_messages")
        .insert({
          account_id: account.id,
          message_id: messageId,
          from_number: fromNumber,
          to_number: metadata.display_phone_number,
          contact_name: contactName,
          message_text: messageText,
          message_type: messageType,
          media_url: mediaUrl,
          media_mime_type: mediaMimeType,
          direction: "inbound",
          status: "received",
          timestamp: timestamp.toISOString(),
          context_message_id: message.context?.id || null,
          metadata: message,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error storing message:", insertError);
        continue;
      }

      // Analyze message for cash mentions
      if (messageText && messageText.length > 0) {
        const flagResult = analyzeMessage(messageText);

        if (flagResult.isFlagged) {
          // Store flagged message
          await supabase.from("flagged_messages").insert({
            message_id: storedMessage.id,
            account_id: account.id,
            flag_type: flagResult.flagType,
            confidence_score: flagResult.confidence,
            matched_keywords: flagResult.matchedKeywords,
            context_snippet: flagResult.contextSnippet,
            review_status: "pending",
          });

          console.log(`Message flagged: ${messageId} - ${flagResult.flagType} (${flagResult.confidence})`);
        }
      }

      // Process bot response if bot is enabled
      if (account.bot_enabled !== false && account.access_token) {
        try {
          const botInput = interactiveResponse || messageText;
          const botMessageType = interactiveResponse ? "interactive" : messageType;
          
          const botResponse = await processWhatsAppMessage(
            fromNumber,
            botInput,
            botMessageType
          );

          // Send bot response
          await sendWhatsAppMessage(
            phoneNumberId,
            account.access_token,
            fromNumber,
            botResponse
          );

          // Store outbound message
          await supabase.from("whatsapp_messages").insert({
            account_id: account.id,
            message_id: `bot_${Date.now()}`,
            from_number: metadata.display_phone_number,
            to_number: fromNumber,
            message_text: botResponse.message,
            message_type: botResponse.buttons ? "interactive" : "text",
            direction: "outbound",
            status: "sent",
            timestamp: new Date().toISOString(),
            metadata: { bot_response: true, buttons: botResponse.buttons },
          });
        } catch (botError) {
          console.error("Bot response error:", botError);
        }
      }

      // Mark message as read (optional)
      // await markMessageAsRead(messageId, phoneNumberId);

    } catch (error) {
      console.error("Error processing message:", error);
    }
  }

  // Update last sync time
  await supabase
    .from("whatsapp_accounts")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("id", account.id);
}

/**
 * Verify webhook signature from WhatsApp
 */
function verifySignature(signature: string | null, body: any): boolean {
  if (!signature) return false;

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true; // Skip verification if no secret configured

  // Implementation would use crypto.createHmac to verify signature
  // const expectedSignature = crypto
  //   .createHmac("sha256", appSecret)
  //   .update(JSON.stringify(body))
  //   .digest("hex");
  
  // return signature === `sha256=${expectedSignature}`;
  return true;
}
