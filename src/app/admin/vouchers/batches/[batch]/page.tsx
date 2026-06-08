"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  DollarSign,
  Edit3,
  Loader2,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Voucher {
  id: string;
  code: string;
  description: string | null;
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

interface VoucherPurchase {
  id: string;
  voucher_id: string | null;
  voucher_code: string | null;
  status: string;
  paid_at: string | null;
  created_at: string | null;
}

type VoucherStatusKey = "claimed" | "paid_unused" | "expired" | "unused" | "inactive";

function formatCreatedAt(date: string) {
  return new Date(date).toLocaleString("en-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function VoucherBatchPage() {
  const params = useParams<{ batch: string }>();
  const batchKey = decodeURIComponent(params.batch);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [purchases, setPurchases] = useState<VoucherPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchKey]);

  const fetchBatch = async () => {
    setLoading(true);
    try {
      const [voucherRes, purchaseRes] = await Promise.all([
        fetch("/api/admin/vouchers"),
        fetch("/api/admin/voucher-purchases?status=all"),
      ]);

      if (voucherRes.ok) {
        const data = await voucherRes.json();
        setVouchers((data.vouchers || []).filter((voucher: Voucher) => voucher.created_at === batchKey));
      }

      if (purchaseRes.ok) {
        const data = await purchaseRes.json();
        setPurchases(data.purchases || []);
      }
    } catch (error) {
      console.error("Error fetching voucher batch:", error);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (voucher: Voucher) => voucher.valid_until && new Date(voucher.valid_until) < new Date();
  const isExhausted = (voucher: Voucher) => voucher.uses_count >= (voucher.max_uses ?? 1);

  const paidPurchases = useMemo(
    () => purchases.filter((purchase) => purchase.status === "paid" || Boolean(purchase.paid_at)),
    [purchases]
  );

  const paidPurchaseByVoucherId = useMemo(
    () => new Map(
      paidPurchases
        .filter((purchase) => Boolean(purchase.voucher_id))
        .map((purchase) => [purchase.voucher_id as string, purchase])
    ),
    [paidPurchases]
  );

  const paidPurchaseByVoucherCode = useMemo(
    () => new Map(
      paidPurchases
        .filter((purchase) => Boolean(purchase.voucher_code))
        .map((purchase) => [(purchase.voucher_code as string).toUpperCase(), purchase])
    ),
    [paidPurchases]
  );

  const getPaidPurchase = (voucher: Voucher) =>
    paidPurchaseByVoucherId.get(voucher.id) || paidPurchaseByVoucherCode.get(voucher.code.toUpperCase()) || null;

  const isPurchaseExpired = (purchase: VoucherPurchase | null) => {
    const paidDate = purchase?.paid_at || purchase?.created_at;
    if (!paidDate) return false;
    const expiresAt = new Date(paidDate);
    expiresAt.setMonth(expiresAt.getMonth() + 6);
    return expiresAt.getTime() < Date.now();
  };

  const getVoucherStatusKey = (voucher: Voucher): VoucherStatusKey => {
    const purchase = getPaidPurchase(voucher);
    if (isExhausted(voucher)) return "claimed";
    if (isExpired(voucher) || isPurchaseExpired(purchase)) return "expired";
    if (!voucher.is_active) return "inactive";
    if (purchase) return "paid_unused";
    return "unused";
  };

  const getVoucherStatusBadge = (voucher: Voucher) => {
    const status = getVoucherStatusKey(voucher);
    if (status === "claimed") return { label: "Claimed", className: "bg-purple-100 text-purple-700" };
    if (status === "paid_unused") return { label: "Paid, unused", className: "bg-blue-100 text-blue-700" };
    if (status === "expired") return { label: "Expired", className: "bg-red-100 text-red-600" };
    if (status === "inactive") return { label: "Inactive", className: "bg-stone-100 text-stone-500" };
    return { label: "Unused", className: "bg-green-100 text-green-700" };
  };

  const summary = vouchers.reduce(
    (counts, voucher) => {
      const status = getVoucherStatusKey(voucher);
      if (status === "claimed") counts.claimed++;
      if (status === "paid_unused") counts.paidUnused++;
      if (status === "expired") counts.expired++;
      if (status === "unused") counts.unused++;
      if (status === "inactive") counts.inactive++;
      return counts;
    },
    { claimed: 0, paidUnused: 0, expired: 0, unused: 0, inactive: 0 }
  );

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleToggleActive = async (voucher: Voucher) => {
    try {
      const res = await fetch(`/api/admin/vouchers/${voucher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !voucher.is_active }),
      });
      if (res.ok) {
        setVouchers((prev) => prev.map((item) => item.id === voucher.id ? { ...item, is_active: !voucher.is_active } : item));
      }
    } catch {
      alert("Failed to update voucher");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this voucher? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
      if (res.ok) setVouchers((prev) => prev.filter((voucher) => voucher.id !== id));
      else alert("Failed to delete voucher");
    } catch {
      alert("Failed to delete voucher");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  const amount = vouchers[0]?.discount_value || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/vouchers" className="mb-4 inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900">
            <ArrowLeft className="h-4 w-4" />
            Back to vouchers
          </Link>
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2">
            <Tag className="h-8 w-8" />
            Gift Card Batch
          </h1>
          <p className="text-stone-500 mt-1">{formatCreatedAt(batchKey)}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-2">
          <DollarSign className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-stone-900">AED {amount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        {[
          { label: "Total Codes", value: vouchers.length, className: "bg-stone-900 text-white" },
          { label: "Claimed", value: summary.claimed, className: "bg-purple-100 text-purple-700" },
          { label: "Unused", value: summary.unused, className: "bg-green-100 text-green-700" },
          { label: "Paid Unused", value: summary.paidUnused, className: "bg-blue-100 text-blue-700" },
          { label: "Expired", value: summary.expired, className: "bg-red-100 text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg p-4 ${stat.className}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">Code</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">Usage</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">Validity</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-stone-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {vouchers.map((voucher) => {
              const badge = getVoucherStatusBadge(voucher);
              return (
                <tr key={voucher.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900 tracking-wider">{voucher.code}</span>
                      <button
                        onClick={() => copyCode(voucher.id, voucher.code)}
                        className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                        title="Copy code"
                      >
                        {copiedId === voucher.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={badge.className} variant="outline">
                      {badge.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-stone-900">
                      {voucher.uses_count || 0}
                      {voucher.max_uses !== null && (
                        <span className="text-stone-400 font-normal"> / {voucher.max_uses}</span>
                      )}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {voucher.valid_from || voucher.valid_until ? (
                      <div className="text-xs text-stone-600 space-y-0.5">
                        {voucher.valid_from && <p>From: {formatDate(voucher.valid_from)}</p>}
                        {voucher.valid_until && <p>Until: {formatDate(voucher.valid_until)}</p>}
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400">No expiry</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleActive(voucher)}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                        title={voucher.is_active ? "Deactivate" : "Activate"}
                      >
                        {voucher.is_active
                          ? <ToggleRight className="h-4 w-4 text-green-500" />
                          : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-stone-300 cursor-not-allowed"
                        title="Edit from the main vouchers list"
                        disabled
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(voucher.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                        title="Delete code"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-stone-500">
                  <Tag className="h-10 w-10 mx-auto mb-3 text-stone-300" />
                  <p className="font-medium">No vouchers found for this batch</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
