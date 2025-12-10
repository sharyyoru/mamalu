"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  RefreshCw,
  Plus,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Link as LinkIcon,
  ExternalLink,
  Search,
  Trash2,
  Eye,
  Download,
  Calendar,
  FileText,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

interface PaymentLink {
  id: string;
  link_code: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  stripe_payment_link_url: string | null;
  status: string;
  single_use: boolean;
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  creator: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function AdminPaymentLinksPage() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [exportEndDate, setExportEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [exportLoading, setExportLoading] = useState(false);

  // Get current user on mount
  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setCurrentUserId(data.user.id);
        }
      });
    }
  }, []);

  // New payment link form
  const [newLink, setNewLink] = useState({
    title: "",
    description: "",
    amount: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    singleUse: true,
    notes: "",
  });

  const fetchPaymentLinks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/payment-links?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPaymentLinks(data.paymentLinks || []);
      }
    } catch (error) {
      console.error("Failed to fetch payment links:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentLinks();
  }, [statusFilter]);

  const filteredLinks = paymentLinks.filter((link) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      link.link_code.toLowerCase().includes(query) ||
      link.title.toLowerCase().includes(query) ||
      link.customer_name?.toLowerCase().includes(query) ||
      link.customer_email?.toLowerCase().includes(query)
    );
  });

  const createPaymentLink = async () => {
    if (!newLink.title || !newLink.amount) {
      alert("Please fill in required fields");
      return;
    }

    setActionLoading("create");
    try {
      const res = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newLink.title,
          description: newLink.description || null,
          amount: parseFloat(newLink.amount),
          customerName: newLink.customerName || null,
          customerEmail: newLink.customerEmail || null,
          customerPhone: newLink.customerPhone || null,
          singleUse: newLink.singleUse,
          notes: newLink.notes || null,
          createdBy: currentUserId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        setNewLink({
          title: "",
          description: "",
          amount: "",
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          singleUse: true,
          notes: "",
        });
        fetchPaymentLinks();
        
        // Copy new link to clipboard
        if (data.stripeUrl) {
          navigator.clipboard.writeText(data.stripeUrl);
          alert(`Payment link created and copied to clipboard!\n\n${data.stripeUrl}`);
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create payment link");
      }
    } catch (error) {
      console.error("Failed to create payment link:", error);
      alert("Failed to create payment link");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelPaymentLink = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this payment link?")) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/payment-links/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPaymentLinks();
      }
    } catch (error) {
      console.error("Failed to cancel payment link:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const markAsPaid = async (id: string, amount: number) => {
    if (!confirm("Mark this payment link as manually paid?")) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/payment-links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paidAmount: amount }),
      });
      if (res.ok) {
        fetchPaymentLinks();
      }
    } catch (error) {
      console.error("Failed to mark as paid:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "active":
        return "bg-blue-100 text-blue-700";
      case "expired":
        return "bg-orange-100 text-orange-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-stone-100 text-stone-700";
    }
  };

  // Export transactions to PDF
  const exportToPDF = (links: PaymentLink[], title: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(41, 37, 36); // stone-800
    doc.text("Mamalu Kitchen", 14, 20);
    
    doc.setFontSize(14);
    doc.text(title, 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(120, 113, 108); // stone-500
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

    // Summary stats
    const paidLinks = links.filter(l => l.status === "paid");
    const totalCollected = paidLinks.reduce((sum, l) => sum + (l.paid_amount || l.amount), 0);
    
    doc.setFontSize(11);
    doc.setTextColor(41, 37, 36);
    doc.text(`Total Transactions: ${links.length}`, 14, 50);
    doc.text(`Paid: ${paidLinks.length}`, 14, 57);
    doc.text(`Total Collected: AED ${totalCollected.toLocaleString()}`, 14, 64);

    // Table
    const tableData = links.map(link => [
      link.link_code,
      link.title,
      link.customer_name || "-",
      `AED ${link.amount.toLocaleString()}`,
      link.status.toUpperCase(),
      link.paid_at ? new Date(link.paid_at).toLocaleDateString() : "-",
      link.creator?.full_name || link.creator?.email || "-"
    ]);

    autoTable(doc, {
      startY: 72,
      head: [["Code", "Title", "Customer", "Amount", "Status", "Paid Date", "Created By"]],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [217, 119, 6], textColor: 255 }, // amber-600
      alternateRowStyles: { fillColor: [250, 250, 249] }, // stone-50
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18 },
        5: { cellWidth: 22 },
        6: { cellWidth: 28 },
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120, 113, 108);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    return doc;
  };

  const exportToday = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayLinks = paymentLinks.filter(link => {
      const createdDate = link.created_at.split("T")[0];
      const paidDate = link.paid_at?.split("T")[0];
      return createdDate === today || paidDate === today;
    });

    if (todayLinks.length === 0) {
      alert("No transactions found for today.");
      return;
    }

    const doc = exportToPDF(todayLinks, `Daily Report - ${new Date().toLocaleDateString()}`);
    doc.save(`payment-links-${today}.pdf`);
  };

  const exportDateRange = async () => {
    setExportLoading(true);
    try {
      const startDate = new Date(exportStartDate);
      const endDate = new Date(exportEndDate);
      endDate.setHours(23, 59, 59, 999);

      const filteredLinks = paymentLinks.filter(link => {
        const createdDate = new Date(link.created_at);
        const paidDate = link.paid_at ? new Date(link.paid_at) : null;
        return (
          (createdDate >= startDate && createdDate <= endDate) ||
          (paidDate && paidDate >= startDate && paidDate <= endDate)
        );
      });

      if (filteredLinks.length === 0) {
        alert("No transactions found for the selected date range.");
        return;
      }

      const doc = exportToPDF(
        filteredLinks,
        `Report: ${new Date(exportStartDate).toLocaleDateString()} - ${new Date(exportEndDate).toLocaleDateString()}`
      );
      doc.save(`payment-links-${exportStartDate}-to-${exportEndDate}.pdf`);
      setShowExportModal(false);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export report.");
    } finally {
      setExportLoading(false);
    }
  };

  const stats = {
    total: paymentLinks.length,
    active: paymentLinks.filter((l) => l.status === "active").length,
    paid: paymentLinks.filter((l) => l.status === "paid").length,
    totalCollected: paymentLinks
      .filter((l) => l.status === "paid")
      .reduce((sum, l) => sum + (l.paid_amount || l.amount), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Payment Links</h1>
          <p className="text-stone-500 mt-1">
            Create and manage custom payment links
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToday} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Today
          </Button>
          <Button onClick={() => setShowExportModal(true)} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button onClick={fetchPaymentLinks} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Payment Link
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-100">
              <LinkIcon className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.total}</p>
              <p className="text-sm text-stone-500">Total Links</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.active}</p>
              <p className="text-sm text-stone-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.paid}</p>
              <p className="text-sm text-stone-500">Paid</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">
                {formatPrice(stats.totalCollected)}
              </p>
              <p className="text-sm text-stone-500">Collected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search payment links..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-stone-200 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paid">Paid</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Links Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="p-8 text-center">
              <LinkIcon className="h-12 w-12 text-stone-300 mx-auto mb-4" />
              <h3 className="font-semibold text-stone-900 mb-2">
                No payment links found
              </h3>
              <p className="text-stone-500">Create your first payment link to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">
                      Link
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">
                      Created By
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm font-medium text-stone-900">
                          {link.link_code}
                        </div>
                        <div className="text-sm text-stone-700">{link.title}</div>
                        {link.description && (
                          <div className="text-xs text-stone-500 truncate max-w-[200px]">
                            {link.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {link.customer_name ? (
                          <>
                            <div className="font-medium text-stone-900">
                              {link.customer_name}
                            </div>
                            <div className="text-sm text-stone-500">
                              {link.customer_email}
                            </div>
                          </>
                        ) : (
                          <span className="text-stone-400 text-sm">Not specified</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">
                          {formatPrice(link.amount)}
                        </div>
                        {link.paid_amount && link.paid_amount !== link.amount && (
                          <div className="text-xs text-green-600">
                            Paid: {formatPrice(link.paid_amount)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadge(link.status)}>
                          {link.status}
                        </Badge>
                        {link.single_use && (
                          <div className="text-xs text-stone-400 mt-1">Single use</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-stone-900">
                          {formatDate(link.created_at)}
                        </div>
                        {link.paid_at && (
                          <div className="text-xs text-green-600">
                            Paid: {formatDate(link.paid_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {link.creator ? (
                          <div className="text-sm text-stone-900">
                            {link.creator.full_name || link.creator.email || "Unknown"}
                          </div>
                        ) : (
                          <span className="text-stone-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {link.stripe_payment_link_url && link.status === "active" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  copyLink(link.stripe_payment_link_url!, link.id)
                                }
                                title="Copy payment link"
                              >
                                {copiedLink === link.id ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <a
                                href={link.stripe_payment_link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="ghost" title="Open payment link">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            </>
                          )}
                          {link.status === "active" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsPaid(link.id, link.amount)}
                                disabled={actionLoading === link.id}
                                title="Mark as paid manually"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelPaymentLink(link.id)}
                                disabled={actionLoading === link.id}
                                title="Cancel payment link"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payment Link Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-900">
                  Create Payment Link
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newLink.title}
                  onChange={(e) =>
                    setNewLink({ ...newLink, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., Private Cooking Session"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Amount (AED) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newLink.amount}
                  onChange={(e) =>
                    setNewLink({ ...newLink, amount: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newLink.description}
                  onChange={(e) =>
                    setNewLink({ ...newLink, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={2}
                  placeholder="Payment description..."
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-stone-700 mb-3">
                  Customer Info (Optional)
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newLink.customerName}
                    onChange={(e) =>
                      setNewLink({ ...newLink, customerName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Customer name"
                  />
                  <input
                    type="email"
                    value={newLink.customerEmail}
                    onChange={(e) =>
                      setNewLink({ ...newLink, customerEmail: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="customer@email.com"
                  />
                  <input
                    type="tel"
                    value={newLink.customerPhone}
                    onChange={(e) =>
                      setNewLink({ ...newLink, customerPhone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="+971 XX XXX XXXX"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="singleUse"
                  checked={newLink.singleUse}
                  onChange={(e) =>
                    setNewLink({ ...newLink, singleUse: e.target.checked })
                  }
                  className="rounded border-stone-300"
                />
                <label htmlFor="singleUse" className="text-sm text-stone-700">
                  Single use (deactivate after one payment)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={newLink.notes}
                  onChange={(e) =>
                    setNewLink({ ...newLink, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={2}
                  placeholder="Notes for internal reference..."
                />
              </div>
            </div>

            <div className="p-6 border-t bg-stone-50 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={createPaymentLink}
                disabled={actionLoading === "create"}
              >
                {actionLoading === "create" ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create & Copy Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Export Date Range Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Export Report</h2>
                  <p className="text-sm text-stone-500">Select date range for PDF export</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="bg-stone-50 rounded-lg p-4">
                <p className="text-sm text-stone-600">
                  This will export all payment links created or paid within the selected date range.
                </p>
              </div>
            </div>

            <div className="p-6 border-t bg-stone-50 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowExportModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={exportDateRange}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
