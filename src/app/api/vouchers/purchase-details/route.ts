import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PurchaseDetails {
  customer_name: string;
  customer_email: string;
  is_gift: boolean;
  recipient_name: string | null;
  recipient_email: string | null;
  amount: number;
  voucher_code: string | null;
  paid_at: string | null;
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("voucher_purchases")
    .select(
      "customer_name, customer_email, is_gift, recipient_name, recipient_email, amount, voucher_code, paid_at",
    )
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  return NextResponse.json(data as PurchaseDetails);
}
