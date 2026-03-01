import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "referrals";

    if (view === "program") {
      // Get referral program settings
      const { data, error } = await supabase
        .from("referral_program")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return NextResponse.json({ program: data });
    }

    if (view === "stats") {
      // Get referral stats
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("*");

      if (error) throw error;

      const stats = {
        total: referrals?.length || 0,
        pending: referrals?.filter(r => r.status === "pending").length || 0,
        completed: referrals?.filter(r => r.status === "completed").length || 0,
        totalRevenue: referrals?.reduce((sum, r) => sum + (r.conversion_value || 0), 0) || 0,
        totalRewardsGiven: referrals?.reduce((sum, r) => sum + (r.referrer_reward || 0) + (r.referee_reward || 0), 0) || 0,
      };

      return NextResponse.json({ stats });
    }

    if (view === "top-referrers") {
      // Get top referrers with their stats
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          referrer_id,
          referrer:profiles!referrals_referrer_id_fkey(id, full_name, email),
          status,
          referrer_reward,
          conversion_value
        `)
        .eq("status", "completed");

      if (error) throw error;

      // Aggregate by referrer
      const referrerMap = new Map();
      data?.forEach((r: any) => {
        if (!r.referrer_id) return;
        const referrerData = Array.isArray(r.referrer) ? r.referrer[0] : r.referrer;
        const existing = referrerMap.get(r.referrer_id) || {
          id: r.referrer_id,
          name: referrerData?.full_name || referrerData?.email || "Unknown",
          referrals: 0,
          earned: 0,
          revenue: 0,
        };
        existing.referrals += 1;
        existing.earned += r.referrer_reward || 0;
        existing.revenue += r.conversion_value || 0;
        referrerMap.set(r.referrer_id, existing);
      });

      const topReferrers = Array.from(referrerMap.values())
        .sort((a, b) => b.referrals - a.referrals)
        .slice(0, 10);

      return NextResponse.json({ topReferrers });
    }

    // Get all referrals
    const { data, error } = await supabase
      .from("referrals")
      .select(`
        *,
        referrer:profiles!referrals_referrer_id_fkey(id, full_name, email),
        referee:profiles!referrals_referee_id_fkey(id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ referrals: data || [] });
  } catch (error: any) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (type === "program") {
      // Update referral program settings
      const { data: existing } = await supabase
        .from("referral_program")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        const { data: updated, error } = await supabase
          .from("referral_program")
          .update(data)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ program: updated });
      } else {
        const { data: created, error } = await supabase
          .from("referral_program")
          .insert(data)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ program: created });
      }
    }

    // Update referral status
    const { id, ...updates } = data;
    if (!id) {
      return NextResponse.json({ error: "Referral ID required" }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("referrals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ referral: updated });
  } catch (error: any) {
    console.error("Error updating referral:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
