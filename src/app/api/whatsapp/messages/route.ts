import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";

/**
 * GET: Fetch WhatsApp messages for super admin
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const flaggedOnly = searchParams.get("flagged_only") === "true";
    const fromNumber = searchParams.get("from_number");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Verify account belongs to this super admin
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
      .from("whatsapp_messages")
      .select(`
        *,
        account:whatsapp_accounts(id, phone_number, display_name),
        flagged:flagged_messages(id, flag_type, confidence_score, review_status)
      `, { count: "exact" })
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by account if specified
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
        return NextResponse.json({ messages: [], total: 0 });
      }
    }

    // Filter by from_number
    if (fromNumber) {
      query = query.eq("from_number", fromNumber);
    }

    // Filter by date range
    if (startDate) {
      query = query.gte("timestamp", startDate);
    }
    if (endDate) {
      query = query.lte("timestamp", endDate);
    }

    const { data: messages, error, count } = await query;

    if (error) {
      console.error("Fetch messages error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter flagged messages if requested
    let filteredMessages = messages || [];
    if (flaggedOnly) {
      filteredMessages = filteredMessages.filter(m => m.flagged && m.flagged.length > 0);
    }

    return NextResponse.json({
      messages: filteredMessages,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
