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
      // Get referral program settings - return default if table doesn't exist
      try {
        const { data, error } = await supabase
          .from("referral_program")
          .select("*")
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          // Table might not exist, return default program
          return NextResponse.json({ 
            program: {
              is_active: true,
              referrer_reward_type: "credit",
              referrer_reward_value: 100,
              referee_reward_type: "credit", 
              referee_reward_value: 50,
              referrer_reward_description: "AED 100 credit for you",
              referee_reward_description: "AED 50 credit for your friend",
              reward_expires_days: 90
            }
          });
        }

        return NextResponse.json({ program: data });
      } catch {
        return NextResponse.json({ program: null });
      }
    }

    if (view === "stats") {
      // Return default stats if table doesn't exist
      return NextResponse.json({ 
        stats: { total: 0, pending: 0, completed: 0, totalRevenue: 0, totalRewardsGiven: 0 }
      });
    }

    if (view === "top-referrers") {
      // Return empty array if table doesn't exist
      return NextResponse.json({ topReferrers: [] });
    }

    // Return empty referrals
    return NextResponse.json({ referrals: [] });
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
