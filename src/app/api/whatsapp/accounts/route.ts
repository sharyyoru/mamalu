import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-auth";

/**
 * GET: List WhatsApp accounts for super admin
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

    // Get all WhatsApp accounts for this super admin
    const { data: accounts, error } = await supabase
      .from("whatsapp_accounts")
      .select("*")
      .eq("super_admin_id", user.id)
      .order("connected_at", { ascending: false });

    if (error) {
      console.error("Fetch accounts error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get message counts for each account
    const accountsWithStats = await Promise.all(
      (accounts || []).map(async (account) => {
        const { count: totalMessages } = await supabase
          .from("whatsapp_messages")
          .select("*", { count: "exact", head: true })
          .eq("account_id", account.id);

        const { count: flaggedMessages } = await supabase
          .from("flagged_messages")
          .select("*", { count: "exact", head: true })
          .eq("account_id", account.id)
          .eq("review_status", "pending");

        return {
          ...account,
          stats: {
            total_messages: totalMessages || 0,
            pending_flags: flaggedMessages || 0,
          },
        };
      })
    );

    return NextResponse.json({ accounts: accountsWithStats });
  } catch (error: any) {
    console.error("Get accounts error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

/**
 * DELETE: Disconnect WhatsApp account
 */
export async function DELETE(request: NextRequest) {
  // Verify user is super admin
  const authResult = await requireAuth(request, ["super_admin"]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account_id");

    if (!accountId) {
      return NextResponse.json({ error: "account_id is required" }, { status: 400 });
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

    // Delete account (cascade will handle related records)
    const { error } = await supabase
      .from("whatsapp_accounts")
      .delete()
      .eq("id", accountId);

    if (error) {
      console.error("Delete account error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
