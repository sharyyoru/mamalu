"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Mail,
  Phone,
  Receipt,
  Send,
  CreditCard,
  Banknote,
  FileText,
  ExternalLink,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

interface Booking {
  id: string;
  booking_number: string;
  class_id: string;
  class_title: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  status: string;
  payment_type: string;
  payment_method: string;
  sessions_booked: number;
  total_amount: number;
  paid_at: string | null;
  receipt_url: string | null;
  receipt_verified: boolean;
  receipt_uploaded_at: string | null;
  invoice_number: string | null;
  payment_link: string | null;
  created_at: string;
  notes: string | null;
}

interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  pendingReceipts: number;
  revenue: number;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (paymentFilter !== "all") params.set("payment_method", paymentFilter);
      
      const res = await fetch(`/api/admin/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, paymentFilter]);

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.booking_number.toLowerCase().includes(query) ||
      booking.attendee_name.toLowerCase().includes(query) ||
      booking.attendee_email.toLowerCase().includes(query) ||
      booking.class_title.toLowerCase().includes(query)
    );
  });

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchBookings();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const verifyReceipt = async (bookingId: string, verified: boolean) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch("/api/payments/verify-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, verified }),
      });
      if (res.ok) {
        fetchBookings();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Failed to verify receipt:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const sendInvoice = async (booking: Booking) => {
    setActionLoading(booking.id);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          customerName: booking.attendee_name,
          customerEmail: booking.attendee_email,
          customerPhone: booking.attendee_phone,
          amount: booking.total_amount,
          description: `Booking: ${booking.class_title}`,
          sendImmediately: true,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Invoice created! Payment link: ${data.paymentLink}`);
        fetchBookings();
      }
    } catch (error) {
      console.error("Failed to send invoice:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-stone-100 text-stone-700";
    }
  };

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case "stripe":
        return "bg-violet-100 text-violet-700";
      case "cash":
        return "bg-green-100 text-green-700";
      case "invoice":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-stone-100 text-stone-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Bookings</h1>
          <p className="text-stone-500 mt-1">Manage all class bookings and payments</p>
        </div>
        <Button onClick={fetchBookings} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-100">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats?.total || 0}</p>
              <p className="text-sm text-stone-500">Total Bookings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats?.confirmed || 0}</p>
              <p className="text-sm text-stone-500">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats?.pending || 0}</p>
              <p className="text-sm text-stone-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-100">
              <Receipt className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats?.pendingReceipts || 0}</p>
              <p className="text-sm text-stone-500">Pending Receipts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{formatPrice(stats?.revenue || 0)}</p>
              <p className="text-sm text-stone-500">Revenue</p>
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
                  placeholder="Search bookings..."
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 border border-stone-200 rounded-lg"
            >
              <option value="all">All Payments</option>
              <option value="stripe">Stripe</option>
              <option value="cash">Cash</option>
              <option value="invoice">Invoice</option>
              <option value="pending">Unpaid</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-stone-300 mx-auto mb-4" />
              <h3 className="font-semibold text-stone-900 mb-2">No bookings found</h3>
              <p className="text-stone-500">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Booking</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Class</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Payment</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">{booking.booking_number}</div>
                        <div className="text-xs text-stone-500">{formatDate(booking.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">{booking.attendee_name}</div>
                        <div className="text-sm text-stone-500">{booking.attendee_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-stone-900">{booking.class_title}</div>
                        <div className="text-xs text-stone-500">
                          {booking.sessions_booked} session(s)
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">{formatPrice(booking.total_amount)}</div>
                        {booking.paid_at && (
                          <div className="text-xs text-green-600">Paid</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getPaymentBadge(booking.payment_method)}>
                          {booking.payment_method || "pending"}
                        </Badge>
                        {booking.payment_method === "cash" && booking.receipt_url && !booking.receipt_verified && (
                          <Badge className="ml-1 bg-orange-100 text-orange-700">
                            Receipt Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadge(booking.status)}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!booking.paid_at && booking.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => sendInvoice(booking)}
                              disabled={actionLoading === booking.id}
                              title="Send Payment Link"
                            >
                              <Send className="h-4 w-4" />
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

      {/* Booking Detail Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-900">
                  Booking Details
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Booking Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500">Booking Number</p>
                  <p className="font-medium">{selectedBooking.booking_number}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Status</p>
                  <Badge className={getStatusBadge(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Created</p>
                  <p className="font-medium">{formatDate(selectedBooking.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Amount</p>
                  <p className="font-medium text-lg">{formatPrice(selectedBooking.total_amount)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Customer</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-stone-400" />
                    <span>{selectedBooking.attendee_email}</span>
                  </div>
                  {selectedBooking.attendee_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-stone-400" />
                      <span>{selectedBooking.attendee_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Class Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Class</h3>
                <p className="text-stone-900">{selectedBooking.class_title}</p>
                <p className="text-sm text-stone-500">
                  {selectedBooking.sessions_booked} session(s) • {selectedBooking.payment_type}
                </p>
              </div>

              {/* Payment Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Payment</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-500">Method:</span>
                    <Badge className={getPaymentBadge(selectedBooking.payment_method)}>
                      {selectedBooking.payment_method || "pending"}
                    </Badge>
                  </div>
                  {selectedBooking.paid_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Paid on {formatDate(selectedBooking.paid_at)}</span>
                    </div>
                  )}
                  {selectedBooking.payment_link && (
                    <div>
                      <a
                        href={selectedBooking.payment_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Payment Link <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Section for Cash Payments */}
              {selectedBooking.payment_method === "cash" && selectedBooking.receipt_url && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Cash Receipt</h3>
                  <div className="space-y-3">
                    <a
                      href={selectedBooking.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="border rounded-lg p-4 hover:bg-stone-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-8 w-8 text-amber-500" />
                          <div>
                            <p className="font-medium">View Receipt</p>
                            <p className="text-xs text-stone-500">
                              Uploaded {selectedBooking.receipt_uploaded_at && formatDate(selectedBooking.receipt_uploaded_at)}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 ml-auto text-stone-400" />
                        </div>
                      </div>
                    </a>
                    
                    {!selectedBooking.receipt_verified && (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => verifyReceipt(selectedBooking.id, true)}
                          disabled={actionLoading === selectedBooking.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify & Confirm Payment
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200"
                          onClick={() => verifyReceipt(selectedBooking.id, false)}
                          disabled={actionLoading === selectedBooking.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {selectedBooking.receipt_verified && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Receipt Verified
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-stone-600">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t bg-stone-50 flex gap-2 justify-end">
              {selectedBooking.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                    disabled={actionLoading === selectedBooking.id}
                  >
                    Cancel Booking
                  </Button>
                  <Button
                    onClick={() => updateBookingStatus(selectedBooking.id, "confirmed")}
                    disabled={actionLoading === selectedBooking.id}
                  >
                    Confirm Booking
                  </Button>
                </>
              )}
              {selectedBooking.status === "confirmed" && (
                <Button
                  onClick={() => updateBookingStatus(selectedBooking.id, "completed")}
                  disabled={actionLoading === selectedBooking.id}
                >
                  Mark as Completed
                </Button>
              )}
              {!selectedBooking.paid_at && selectedBooking.status !== "cancelled" && (
                <Button
                  variant="outline"
                  onClick={() => sendInvoice(selectedBooking)}
                  disabled={actionLoading === selectedBooking.id}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Payment Link
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
