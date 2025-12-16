import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";

/**
 * GET: Fetch WhatsApp reports for super admin
 */
export async function GET(request: NextRequest) {
  // Verify user is super admin
  const authResult = await requireAuth(request, ["super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id");
    const reportType = searchParams.get("report_type") || "daily";
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Verify account belongs to this super admin if specified
    if (accountId) {
      const { data: account } = await supabase
        .from("whatsapp_accounts")
        .select("id")
        .eq("id", accountId)
        .eq("super_admin_id", user.id)
        .single();

      if (!account) {
        return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
      }
    }

    // Build query
    let query = supabase
      .from("whatsapp_reports")
      .select(`
        *,
        account:whatsapp_accounts(id, phone_number, display_name)
      `)
      .eq("report_type", reportType)
      .order("report_date", { ascending: false });

    // Filter by account
    if (accountId) {
      query = query.eq("account_id", accountId);
    } else {
      // Get all accounts for this super admin
      const { data: accounts } = await supabase
        .from("whatsapp_accounts")
        .select("id")
        .eq("super_admin_id", user.id);

      if (accounts && accounts.length > 0) {
        const accountIds = accounts.map(a => a.id);
        query = query.in("account_id", accountIds);
      } else {
        return NextResponse.json({ reports: [] });
      }
    }

    // Filter by date range
    if (startDate) {
      query = query.gte("report_date", startDate);
    }
    if (endDate) {
      query = query.lte("report_date", endDate);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error("Fetch reports error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports: reports || [] });
  } catch (error: any) {
    console.error("Get reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

/**
 * POST: Generate a new report
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
    const { accountId, reportDate, reportType = "daily" } = body;

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

    // Use the Supabase function to generate report
    const { data: reportId, error } = await supabase.rpc("generate_daily_whatsapp_report", {
      account_uuid: accountId,
      report_date: reportDate || new Date().toISOString().split("T")[0],
    });

    if (error) {
      console.error("Generate report error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch the generated report
    const { data: report } = await supabase
      .from("whatsapp_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("Generate report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

/**
 * GET: Get flagged messages summary
 */
export async function PATCH(request: NextRequest) {
  // Verify user is super admin
  const authResult = await requireAuth(request, ["super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id");
    const daysBack = parseInt(searchParams.get("days_back") || "7");

    if (!accountId) {
      return NextResponse.json({ error: "account_id is required" }, { status: 400 });
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

    // Use the helper function to get stats
    const { data: stats, error } = await supabase.rpc("get_flagged_message_stats", {
      account_uuid: accountId,
      days_back: daysBack,
    });

    if (error) {
      console.error("Get stats error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stats: stats?.[0] || {} });
  } catch (error: any) {
    console.error("Get flagged stats error:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
