"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Send,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  ExternalLink,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

interface Invoice {
  id: string;
  invoice_number: string;
  booking_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  payment_link: string | null;
  due_date: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  booking?: {
    booking_number: string;
    class_title: string;
  };
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // New invoice form
  const [newInvoice, setNewInvoice] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    amount: "",
    description: "",
    dueDate: "",
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(query) ||
      invoice.customer_name.toLowerCase().includes(query) ||
      invoice.customer_email.toLowerCase().includes(query)
    );
  });

  const createInvoice = async () => {
    if (!newInvoice.customerName || !newInvoice.customerEmail || !newInvoice.amount) {
      alert("Please fill in required fields");
      return;
    }

    setActionLoading("create");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: newInvoice.customerName,
          customerEmail: newInvoice.customerEmail,
          customerPhone: newInvoice.customerPhone || null,
          amount: parseFloat(newInvoice.amount),
          description: newInvoice.description || null,
          dueDate: newInvoice.dueDate || null,
          sendImmediately: false,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewInvoice({
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          amount: "",
          description: "",
          dueDate: "",
        });
        fetchInvoices();
      }
    } catch (error) {
      console.error("Failed to create invoice:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const sendInvoice = async (invoiceId: string) => {
    setActionLoading(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
      });
      if (res.ok) {
        fetchInvoices();
      }
    } catch (error) {
      console.error("Failed to send invoice:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    setActionLoading(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchInvoices();
      }
    } catch (error) {
      console.error("Failed to update invoice:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const copyPaymentLink = (link: string, invoiceId: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(invoiceId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "draft":
        return "bg-stone-100 text-stone-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "overdue":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-stone-100 text-stone-700";
    }
  };

  const stats = {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    sent: invoices.filter((i) => i.status === "sent").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
    paidAmount: invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Invoices</h1>
          <p className="text-stone-500 mt-1">
            Create and manage payment invoices
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchInvoices} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-100">
              <FileText className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.total}</p>
              <p className="text-sm text-stone-500">Total Invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-stone-100">
              <Clock className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.draft}</p>
              <p className="text-sm text-stone-500">Drafts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.sent}</p>
              <p className="text-sm text-stone-500">Sent</p>
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
                {formatPrice(stats.paidAmount)}
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
                  placeholder="Search invoices..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-stone-300 mx-auto mb-4" />
              <h3 className="font-semibold text-stone-900 mb-2">
                No invoices found
              </h3>
              <p className="text-stone-500">Create your first invoice to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">
                      Invoice
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
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">
                          {invoice.invoice_number}
                        </div>
                        {invoice.description && (
                          <div className="text-xs text-stone-500 truncate max-w-[200px]">
                            {invoice.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">
                          {invoice.customer_name}
                        </div>
                        <div className="text-sm text-stone-500">
                          {invoice.customer_email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">
                          {formatPrice(invoice.amount)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-stone-900">
                          {formatDate(invoice.created_at)}
                        </div>
                        {invoice.sent_at && (
                          <div className="text-xs text-stone-500">
                            Sent: {formatDate(invoice.sent_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {invoice.payment_link && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyPaymentLink(invoice.payment_link!, invoice.id)
                              }
                              title="Copy payment link"
                            >
                              {copiedLink === invoice.id ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {invoice.payment_link && (
                            <a
                              href={invoice.payment_link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="ghost" title="Open payment link">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                          {invoice.status === "draft" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => sendInvoice(invoice.id)}
                              disabled={actionLoading === invoice.id}
                              title="Send invoice"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === "sent" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateInvoiceStatus(invoice.id, "paid")}
                              disabled={actionLoading === invoice.id}
                              title="Mark as paid"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
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

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-900">
                  Create Invoice
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
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={newInvoice.customerName}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, customerName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Customer Email *
                </label>
                <input
                  type="email"
                  value={newInvoice.customerEmail}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, customerEmail: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="customer@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newInvoice.customerPhone}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, customerPhone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="+971 XX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Amount (AED) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newInvoice.amount}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, amount: e.target.value })
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
                  value={newInvoice.description}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  placeholder="Invoice description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, dueDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-stone-50 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={createInvoice}
                disabled={actionLoading === "create"}
              >
                {actionLoading === "create" ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Invoice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
