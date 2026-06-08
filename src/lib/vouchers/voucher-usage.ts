import type { SupabaseClient } from "@supabase/supabase-js";
import { validateVoucherPurchaseWindow } from "@/lib/vouchers/validate-voucher-purchase";

export type RedeemableVoucher = {
  id: string;
  code: string;
  discount_value: number;
  uses_count: number;
  max_uses: number;
  expiresAt: string;
};

type VoucherRow = {
  id: string;
  code: string | null;
  discount_value: number | string | null;
  is_active: boolean | null;
  uses_count: number | null;
  max_uses: number | null;
};

export async function getRedeemableVoucherByCode(
  supabase: SupabaseClient,
  code: string
): Promise<{ voucher: RedeemableVoucher | null; error?: string }> {
  const normalizedCode = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from("vouchers")
    .select("id, code, discount_value, is_active, uses_count, max_uses")
    .eq("code", normalizedCode)
    .maybeSingle();

  const voucher = data as VoucherRow | null;
  if (error || !voucher?.code) {
    return { voucher: null, error: "Invalid or expired voucher code" };
  }

  const usesCount = Number(voucher.uses_count || 0);
  const maxUses = Number(voucher.max_uses || 1);
  if (!voucher.is_active || usesCount >= maxUses) {
    return { voucher: null, error: "This voucher has already been used" };
  }

  const validity = await validateVoucherPurchaseWindow(supabase, voucher.code);
  if (!validity.valid) {
    return { voucher: null, error: validity.error };
  }

  return {
    voucher: {
      id: voucher.id,
      code: voucher.code,
      discount_value: Number(voucher.discount_value) || 0,
      uses_count: usesCount,
      max_uses: maxUses,
      expiresAt: validity.expiresAt,
    },
  };
}

export async function consumeVoucherUse(
  supabase: SupabaseClient,
  voucherId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from("vouchers")
    .select("id, is_active, uses_count, max_uses")
    .eq("id", voucherId)
    .maybeSingle();

  const voucher = data as Pick<VoucherRow, "id" | "is_active" | "uses_count" | "max_uses"> | null;
  if (error || !voucher) {
    return { success: false, error: "Invalid or expired voucher code" };
  }

  const usesCount = Number(voucher.uses_count || 0);
  const maxUses = Number(voucher.max_uses || 1);
  if (!voucher.is_active || usesCount >= maxUses) {
    return { success: false, error: "This voucher has already been used" };
  }

  const nextUsesCount = usesCount + 1;
  const { error: updateError } = await supabase
    .from("vouchers")
    .update({
      uses_count: nextUsesCount,
      is_active: nextUsesCount < maxUses,
    })
    .eq("id", voucherId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
