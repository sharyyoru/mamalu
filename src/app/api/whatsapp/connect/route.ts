import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";

/**
 * POST: Connect a WhatsApp Business account
 */
export async function POST(request: NextRequest) {
  // Verify user is super admin
  const authResult = await requireAuth(request, ["super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const body = await request.json();
    const {
      phoneNumber,
      businessAccountId,
      whatsappBusinessAccountId,
      accessToken,
      displayName,
      profilePictureUrl,
    } = body;

    if (!phoneNumber || !businessAccountId) {
      return NextResponse.json(
        { error: "phoneNumber and businessAccountId are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Generate webhook verify token
    const webhookVerifyToken = `mamalu_${user.id}_${Date.now()}`;

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from("whatsapp_accounts")
      .select("id")
      .eq("phone_number", phoneNumber)
      .single();

    if (existingAccount) {
      return NextResponse.json(
        { error: "This WhatsApp account is already connected" },
        { status: 409 }
      );
    }

    // Create new WhatsApp account
    const { data: account, error } = await supabase
      .from("whatsapp_accounts")
      .insert({
        super_admin_id: user.id,
        phone_number: phoneNumber,
        business_account_id: businessAccountId,
        whatsapp_business_account_id: whatsappBusinessAccountId || null,
        access_token: accessToken || null,
        webhook_verify_token: webhookVerifyToken,
        display_name: displayName || null,
        profile_picture_url: profilePictureUrl || null,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Create account error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      account,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"}/api/webhooks/whatsapp`,
      webhookVerifyToken,
    });
  } catch (error: any) {
    console.error("Connect account error:", error);
    return NextResponse.json({ error: "Failed to connect account" }, { status: 500 });
  }
}

/**
 * PATCH: Update WhatsApp account settings
 */
export async function PATCH(request: NextRequest) {
  // Verify user is super admin
  const authResult = await requireAuth(request, ["super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const body = await request.json();
    const { accountId, status, displayName, accessToken } = body;

    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Verify account belongs to this super admin
    const { data: account } = await supabase
      .from("whatsapp_accounts")
      .select("id")
      .eq("id", accountId)
      .eq("super_admin_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
    }

    // Update account
    const updateData: any = {};
    if (status) updateData.status = status;
    if (displayName) updateData.display_name = displayName;
    if (accessToken) updateData.access_token = accessToken;

    const { data: updatedAccount, error } = await supabase
      .from("whatsapp_accounts")
      .update(updateData)
      .eq("id", accountId)
      .select()
      .single();

    if (error) {
      console.error("Update account error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, account: updatedAccount });
  } catch (error: any) {
    console.error("Update account error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
