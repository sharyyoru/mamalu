import type { SupabaseClient } from "@supabase/supabase-js";

type Voucher = {
  id: string;
  code: string | null;
};

type UsedVoucher = {
  voucher_id: string | null;
  voucher_code: string | null;
};

export type AssignedVoucher = {
  id: string;
  code: string;
};

async function getPaidVoucherAssignments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("voucher_purchases")
    .select("voucher_id, voucher_code")
    .eq("status", "paid");

  if (error) throw error;

  const usedVouchers = (data || []) as UsedVoucher[];
  return {
    usedIds: new Set(
      usedVouchers.map((voucher) => voucher.voucher_id).filter((id): id is string => Boolean(id))
    ),
    usedCodes: new Set(
      usedVouchers.map((voucher) => voucher.voucher_code).filter((code): code is string => Boolean(code))
    ),
  };
}

export async function listAvailableVouchersForAmount(
  supabase: SupabaseClient,
  amount: number
): Promise<AssignedVoucher[]> {
  const { data: voucherData, error: voucherError } = await supabase
    .from("vouchers")
    .select("id, code")
    .eq("discount_value", amount)
    .eq("is_active", true);

  if (voucherError) throw voucherError;

  const { usedIds, usedCodes } = await getPaidVoucherAssignments(supabase);

  const vouchers = (voucherData || []) as Voucher[];
  return vouchers
    .filter((candidate) => {
      if (!candidate.code) return false;
      if (usedIds.has(candidate.id)) return false;
      if (usedCodes.has(candidate.code)) return false;
      return true;
    })
    .map((voucher) => ({ id: voucher.id, code: voucher.code as string }));
}

export async function countAvailableVouchersForAmount(
  supabase: SupabaseClient,
  amount: number
): Promise<number> {
  const vouchers = await listAvailableVouchersForAmount(supabase, amount);
  return vouchers.length;
}

export async function findAvailableVoucherForAmount(
  supabase: SupabaseClient,
  amount: number
): Promise<AssignedVoucher | null> {
  const vouchers = await listAvailableVouchersForAmount(supabase, amount);
  return vouchers[0] || null;
}

export async function assignVoucherToPaidPurchase(
  supabase: SupabaseClient,
  purchase: { id: string; amount: number; voucher_code: string | null }
): Promise<AssignedVoucher | null> {
  if (purchase.voucher_code) {
    return null;
  }

  const assigned = await findAvailableVoucherForAmount(supabase, Number(purchase.amount));
  if (!assigned) {
    return null;
  }

  const { error } = await supabase
    .from("voucher_purchases")
    .update({
      voucher_id: assigned.id,
      voucher_code: assigned.code,
    })
    .eq("id", purchase.id)
    .is("voucher_code", null);

  if (error) throw error;

  return assigned;
}
