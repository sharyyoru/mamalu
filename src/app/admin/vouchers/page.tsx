"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Plus,
  Save,
  X,
  Search,
  Loader2,
  Tag,
  DollarSign,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Voucher {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number | null;
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

interface VoucherBatch {
  key: string;
  vouchers: Voucher[];
  created_at: string;
  amount: number;
  total: number;
  claimed: number;
  paidUnused: number;
  expired: number;
  unused: number;
  inactive: number;
}

const emptyForm = {
  code: "",
  discount_type: "fixed" as "percentage" | "fixed",
  discount_value: 0,
  is_active: true,
  quantity: 1,
};

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function formatCreatedAt(date: string) {
  return new Date(date).toLocaleString("en-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [purchases, setPurchases] = useState<VoucherPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<typeof emptyForm & { id?: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const [voucherRes, purchaseRes] = await Promise.all([
        fetch("/api/admin/vouchers"),
        fetch("/api/admin/voucher-purchases?status=all"),
      ]);

      if (voucherRes.ok) {
        const data = await voucherRes.json();
        setVouchers(data.vouchers || []);
      }

      if (purchaseRes.ok) {
        const data = await purchaseRes.json();
        setPurchases(data.purchases || []);
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing({ ...emptyForm, code: generateCode() });
    setIsCreating(true);
  };

  const closeModal = () => {
    setEditing(null);
    setIsCreating(false);
  };

  const handleSave = async () => {
    const quantity = Math.max(1, Math.floor(Number(editing?.quantity) || 1));
    if (!editing?.discount_value || (quantity === 1 && !editing.code)) return;
    setSaving(true);
    try {
      const url = isCreating ? "/api/admin/vouchers" : `/api/admin/vouchers/${editing.id}`;
      const method = isCreating ? "POST" : "PUT";

      const payload = {
        ...editing,
        discount_type: "fixed",
        discount_value: Number(editing.discount_value),
        min_order_value: null,
        max_uses: 1,
        quantity: isCreating ? quantity : 1,
        valid_from: null,
        valid_until: null,
        description: null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchVouchers();
        closeModal();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save");
      }
    } catch {
      alert("Failed to save voucher");
    } finally {
      setSaving(false);
    }
  };

  const isExpired = (v: Voucher) => v.valid_until && new Date(v.valid_until) < new Date();
  const isExhausted = (v: Voucher) => v.uses_count >= (v.max_uses ?? 1);
  const paidPurchases = purchases.filter((purchase) => purchase.status === "paid" || Boolean(purchase.paid_at));
  const paidPurchaseByVoucherId = new Map(
    paidPurchases
      .filter((purchase) => Boolean(purchase.voucher_id))
      .map((purchase) => [purchase.voucher_id as string, purchase])
  );
  const paidPurchaseByVoucherCode = new Map(
    paidPurchases
      .filter((purchase) => Boolean(purchase.voucher_code))
      .map((purchase) => [(purchase.voucher_code as string).toUpperCase(), purchase])
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

  const stats = {
    total: vouchers.length,
    active: vouchers.filter((v) => v.is_active && !isExpired(v) && !isExhausted(v)).length,
    totalUses: vouchers.reduce((sum, v) => sum + (v.uses_count || 0), 0),
  };

  const voucherBatches = vouchers.reduce<VoucherBatch[]>((groups, voucher) => {
    const key = voucher.created_at;
    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.vouchers.push(voucher);
    } else {
      groups.push({
        key,
        created_at: voucher.created_at,
        amount: voucher.discount_value,
        vouchers: [voucher],
        total: 0,
        claimed: 0,
        paidUnused: 0,
        expired: 0,
        unused: 0,
        inactive: 0,
      });
    }
    return groups;
  }, []).map((batch) => {
    const summary = batch.vouchers.reduce(
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

    return {
      ...batch,
      total: batch.vouchers.length,
      ...summary,
    };
  });

  const filteredBatches = voucherBatches.filter((batch) => {
    const normalizedSearch = search.toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      formatCreatedAt(batch.created_at).toLowerCase().includes(normalizedSearch) ||
      String(batch.amount).includes(normalizedSearch) ||
      batch.vouchers.some((voucher) =>
        voucher.code.toLowerCase().includes(normalizedSearch) ||
        (voucher.description || "").toLowerCase().includes(normalizedSearch)
      );
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && batch.vouchers.some((voucher) => voucher.is_active)) ||
      (filterStatus === "inactive" && batch.vouchers.every((voucher) => !voucher.is_active));
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2">
            <Tag className="h-8 w-8" />
            Vouchers
          </h1>
          <p className="text-stone-500 mt-1">Create and manage gift card vouchers</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Voucher
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Vouchers", value: stats.total, color: "from-violet-500 to-purple-600" },
          { label: "Currently Active", value: stats.active, color: "from-green-500 to-emerald-600" },
          { label: "Total Redemptions", value: stats.totalUses, color: "from-[#FF8C6B] to-[#ff7a54]" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} p-5 text-white`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm opacity-80 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or description..."
            className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left text-xs font-semibold text-stone-600 uppercase tracking-wider px-6 py-4">Batch</th>
              <th className="text-left text-xs font-semibold text-stone-600 uppercase tracking-wider px-6 py-4">Amount</th>
              <th className="text-left text-xs font-semibold text-stone-600 uppercase tracking-wider px-6 py-4">Codes</th>
              <th className="text-left text-xs font-semibold text-stone-600 uppercase tracking-wider px-6 py-4">Breakdown</th>
              <th className="text-left text-xs font-semibold text-stone-600 uppercase tracking-wider px-6 py-4">Created</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredBatches.map((batch) => {
              return (
                <tr key={batch.key} className="hover:bg-stone-50 group transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-stone-900">Gift card batch</p>
                      <p className="text-xs text-stone-400">{batch.key}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <span className="font-semibold text-stone-900">AED {batch.amount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-stone-900">{batch.total}</p>
                    <p className="text-xs text-stone-400">voucher codes</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className="bg-purple-100 text-purple-700" variant="outline">{batch.claimed} claimed</Badge>
                      <Badge className="bg-green-100 text-green-700" variant="outline">{batch.unused} unused</Badge>
                      <Badge className="bg-blue-100 text-blue-700" variant="outline">{batch.paidUnused} paid unused</Badge>
                      <Badge className="bg-red-100 text-red-600" variant="outline">{batch.expired} expired</Badge>
                      {batch.inactive > 0 && (
                        <Badge className="bg-stone-100 text-stone-500" variant="outline">{batch.inactive} inactive</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-stone-600">{formatCreatedAt(batch.created_at)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <Link
                        href={`/admin/vouchers/batches/${encodeURIComponent(batch.key)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                        title="View voucher codes"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredBatches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-stone-500">
                  <Tag className="h-10 w-10 mx-auto mb-3 text-stone-300" />
                  <p className="font-medium">No vouchers found</p>
                  <p className="text-sm mt-1">
                    {search || filterStatus !== "all"
                      ? "Try adjusting your filters"
                      : 'Click "Add Voucher" to create your first gift card'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-stone-900">
                {isCreating ? "Create Gift Card" : "Edit Gift Card"}
              </h2>
              <button onClick={closeModal}>
                <X className="h-5 w-5 text-stone-400 hover:text-stone-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editing.code}
                    onChange={(e) => setEditing((p) => p ? { ...p, code: e.target.value.toUpperCase() } : p)}
                    placeholder="e.g. GIFT2025"
                    disabled={isCreating && editing.quantity > 1}
                    className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 font-mono uppercase"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing((p) => p ? { ...p, code: generateCode() } : p)}
                    type="button"
                    disabled={isCreating && editing.quantity > 1}
                  >
                    Generate
                  </Button>
                </div>
                {isCreating && editing.quantity > 1 && (
                  <p className="mt-1 text-xs text-stone-500">
                    Codes will be generated automatically on save.
                  </p>
                )}
              </div>

              {isCreating && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Number of codes <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="1"
                    value={editing.quantity}
                    onChange={(e) => setEditing((p) => p ? { ...p, quantity: parseInt(e.target.value, 10) || 1 } : p)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Amount (AED) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">AED</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editing.discount_value || ""}
                    onChange={(e) => setEditing((p) => p ? { ...p, discount_value: parseFloat(e.target.value) || 0 } : p)}
                    placeholder="0"
                    className="w-full pl-14 pr-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing((p) => p ? { ...p, is_active: e.target.checked } : p)}
                  className="rounded"
                />
                <span className="text-sm text-stone-700">Active</span>
              </label>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={saving || !editing.discount_value || (editing.quantity <= 1 && !editing.code)}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {isCreating && editing.quantity > 1 ? `Create ${editing.quantity} Codes` : isCreating ? "Create Gift Card" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
