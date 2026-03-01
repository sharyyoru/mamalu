import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Track campaign link clicks and redirect to destination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignCode = searchParams.get("c") || searchParams.get("utm_campaign");
  const destination = searchParams.get("url") || searchParams.get("redirect") || "/";
  const utm_source = searchParams.get("utm_source") || "email";
  const utm_medium = searchParams.get("utm_medium") || "campaign";
  const utm_content = searchParams.get("utm_content");

  const supabase = createServiceClient();

  if (campaignCode && supabase) {
    try {
      // Find campaign by short_code or utm_campaign
      const { data: campaign } = await supabase
        .from("marketing_campaigns")
        .select("id, short_code")
        .or(`short_code.eq.${campaignCode},utm_campaign.eq.${campaignCode}`)
        .single();

      if (campaign) {
        // Generate session ID for tracking
        const sessionId = crypto.randomUUID();

        // Record the click
        await supabase.from("campaign_clicks").insert({
          campaign_id: campaign.id,
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          user_agent: request.headers.get("user-agent"),
          referrer: request.headers.get("referer"),
          landing_page: destination,
          session_id: sessionId,
        });

        // Update campaign click count
        try {
          await supabase
            .from("marketing_campaigns")
            .update({ total_clicked: (campaign as any).total_clicked ? (campaign as any).total_clicked + 1 : 1 })
            .eq("id", campaign.id);
        } catch (e) {
          console.error("Error updating click count:", e);
        }

        // Set tracking cookie for attribution (30 day expiry)
        const cookieStore = await cookies();
        cookieStore.set("campaign_tracking", JSON.stringify({
          campaign_id: campaign.id,
          session_id: sessionId,
          utm_source,
          utm_medium,
          utm_campaign: campaignCode,
          utm_content,
          clicked_at: new Date().toISOString(),
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        });
      }
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  }

  // Build redirect URL with UTM params preserved
  const redirectUrl = new URL(destination, request.url);
  if (utm_source) redirectUrl.searchParams.set("utm_source", utm_source);
  if (utm_medium) redirectUrl.searchParams.set("utm_medium", utm_medium);
  if (campaignCode) redirectUrl.searchParams.set("utm_campaign", campaignCode);
  if (utm_content) redirectUrl.searchParams.set("utm_content", utm_content);

  return NextResponse.redirect(redirectUrl);
}
