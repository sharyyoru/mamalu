import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get campaign analytics
    if (campaignId) {
      // Single campaign detailed analytics
      const { data: campaign } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }

      // Get clicks
      let clicksQuery = supabase
        .from("campaign_clicks")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("clicked_at", { ascending: false });

      const { data: clicks } = await clicksQuery;

      // Get attributed bookings
      let bookingsQuery = supabase
        .from("class_bookings")
        .select("id, total_amount, created_at, status, attendee_name")
        .eq("campaign_id", campaignId)
        .in("status", ["confirmed", "completed"]);

      const { data: bookings } = await bookingsQuery;

      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const conversionRate = campaign.total_sent > 0 
        ? ((bookings?.length || 0) / campaign.total_sent * 100).toFixed(2)
        : 0;

      return NextResponse.json({
        campaign: {
          ...campaign,
          tracked_clicks: clicks?.length || 0,
          conversions: bookings?.length || 0,
          attributed_revenue: totalRevenue,
          conversion_rate: conversionRate,
        },
        clicks: clicks || [],
        bookings: bookings || [],
      });
    }

    // Get overview analytics for all campaigns
    let campaignsQuery = supabase
      .from("marketing_campaigns")
      .select("id, name, status, total_sent, total_opened, total_clicked, short_code, created_at")
      .order("created_at", { ascending: false });

    if (startDate) {
      campaignsQuery = campaignsQuery.gte("created_at", startDate);
    }
    if (endDate) {
      campaignsQuery = campaignsQuery.lte("created_at", endDate + "T23:59:59");
    }

    const { data: campaigns } = await campaignsQuery;

    // Get aggregated stats for each campaign
    const campaignIds = campaigns?.map(c => c.id) || [];
    
    // Get click counts per campaign
    const { data: clickCounts } = await supabase
      .from("campaign_clicks")
      .select("campaign_id")
      .in("campaign_id", campaignIds);

    const clicksByCampaign: Record<string, number> = {};
    clickCounts?.forEach(c => {
      clicksByCampaign[c.campaign_id] = (clicksByCampaign[c.campaign_id] || 0) + 1;
    });

    // Get booking/revenue per campaign
    const { data: bookingStats } = await supabase
      .from("class_bookings")
      .select("campaign_id, total_amount, status")
      .in("campaign_id", campaignIds)
      .in("status", ["confirmed", "completed"]);

    const revenueByCampaign: Record<string, { count: number; revenue: number }> = {};
    bookingStats?.forEach(b => {
      if (!revenueByCampaign[b.campaign_id]) {
        revenueByCampaign[b.campaign_id] = { count: 0, revenue: 0 };
      }
      revenueByCampaign[b.campaign_id].count++;
      revenueByCampaign[b.campaign_id].revenue += b.total_amount || 0;
    });

    // Combine data
    const analyticsData = campaigns?.map(c => ({
      ...c,
      tracked_clicks: clicksByCampaign[c.id] || 0,
      conversions: revenueByCampaign[c.id]?.count || 0,
      attributed_revenue: revenueByCampaign[c.id]?.revenue || 0,
      conversion_rate: c.total_sent > 0 
        ? ((revenueByCampaign[c.id]?.count || 0) / c.total_sent * 100).toFixed(2)
        : "0.00",
    })) || [];

    // Calculate totals
    const totals = {
      total_campaigns: campaigns?.length || 0,
      total_sent: campaigns?.reduce((sum, c) => sum + (c.total_sent || 0), 0) || 0,
      total_clicks: Object.values(clicksByCampaign).reduce((sum: number, c: number) => sum + c, 0),
      total_conversions: Object.values(revenueByCampaign).reduce((sum: number, c) => sum + c.count, 0),
      total_revenue: Object.values(revenueByCampaign).reduce((sum: number, c) => sum + c.revenue, 0),
    };

    return NextResponse.json({
      campaigns: analyticsData,
      totals,
    });
  } catch (error: any) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
