"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Mail,
  Phone,
  Send,
  ExternalLink,
  AlertCircle,
  Plus,
  Copy,
  Cake,
  ChefHat,
  Building2,
  X,
  LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

// Mamalu Schedule Time Slots
const MAMALU_TIME_SLOTS = [
  { start: "10:00", end: "12:30", label: "10:00 AM - 12:30 PM", days: [0, 1, 2, 3, 4, 5, 6] },
  { start: "13:30", end: "15:00", label: "1:30 PM - 3:00 PM", days: [0, 1, 2, 3, 4, 5, 6] },
  { start: "16:00", end: "17:30", label: "4:00 PM - 5:30 PM", days: [0, 1, 2, 3, 4, 5, 6] },
  { start: "18:30", end: "20:00", label: "6:30 PM - 8:00 PM", days: [0, 1, 2, 3, 4, 5, 6] },
  { start: "21:00", end: "22:30", label: "9:00 PM - 10:30 PM", days: [4, 5] },
];

interface ServiceBooking {
  id: string;
  booking_number: string;
  service_id: string | null;
  service_name: string;
  service_type: string | null;
  package_id: string | null;
  package_name: string | null;
  menu_id: string | null;
  menu_name: string | null;
  menu_price: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  company_name: string | null;
  event_date: string | null;
  event_time: string | null;
  guest_count: number;
  extras: any[];
  base_amount: number;
  extras_amount: number;
  total_amount: number;
  is_deposit_payment: boolean;
  deposit_amount: number | null;
  balance_amount: number | null;
  deposit_paid: boolean;
  balance_paid: boolean;
  payment_status: string;
  paid_at: string | null;
  special_requests: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  created_by: string | null;
  payment_link_id: string | null;
  creator: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  payment_link: {
    id: string;
    link_code: string;
    stripe_payment_link_url: string | null;
    status: string;
  } | null;
}

interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  completed: number;
  cancelled: number;
  fullyPaid: number;
  depositPending: number;
  balancePending: number;
  totalRevenue: number;
  collectedRevenue: number;
}

interface Creator {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  service_type: string;
  base_price: number;
  packages: any[];
}

interface Extra {
  id: string;
  name: string;
  price: number;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (paymentFilter !== "all") params.set("payment_status", paymentFilter);
      if (serviceTypeFilter !== "all") params.set("service_type", serviceTypeFilter);
      if (creatorFilter !== "all") params.set("created_by", creatorFilter);
      
      const res = await fetch(`/api/admin/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setStats(data.stats);
        setCreators(data.creators || []);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, paymentFilter, serviceTypeFilter, creatorFilter]);

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.booking_number?.toLowerCase().includes(query) ||
      booking.customer_name?.toLowerCase().includes(query) ||
      booking.customer_email?.toLowerCase().includes(query) ||
      booking.service_name?.toLowerCase().includes(query) ||
      booking.company_name?.toLowerCase().includes(query)
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

  const copyPaymentLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
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

  const getPaymentStatusBadge = (booking: ServiceBooking) => {
    if (booking.paid_at || (booking.is_deposit_payment && booking.deposit_paid && booking.balance_paid)) {
      return { className: "bg-green-100 text-green-700", label: "Paid" };
    }
    if (booking.is_deposit_payment) {
      if (booking.deposit_paid && !booking.balance_paid) {
        return { className: "bg-blue-100 text-blue-700", label: "Balance Due" };
      }
      if (!booking.deposit_paid) {
        return { className: "bg-amber-100 text-amber-700", label: "Deposit Pending" };
      }
    }
    return { className: "bg-stone-100 text-stone-600", label: "Unpaid" };
  };

  const getServiceTypeIcon = (type: string | null) => {
    switch (type) {
      case "birthday_deck":
        return <Cake className="h-4 w-4" />;
      case "corporate_deck":
        return <Building2 className="h-4 w-4" />;
      case "nanny_class":
        return <ChefHat className="h-4 w-4" />;
      default:
        return <ChefHat className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Bookings</h1>
          <p className="text-stone-500 mt-1">Manage all service bookings and payments</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchBookings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Booking
          </Button>
        </div>
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
              <p className="text-2xl font-bold text-stone-900">{stats?.fullyPaid || 0}</p>
              <p className="text-sm text-stone-500">Fully Paid</p>
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
            <div className="p-3 rounded-xl bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats?.balancePending || 0}</p>
              <p className="text-sm text-stone-500">Balance Due</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{formatPrice(stats?.collectedRevenue || 0)}</p>
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
              <option value="unpaid">Unpaid</option>
              <option value="deposit_pending">Deposit Pending</option>
              <option value="deposit_paid">Balance Due</option>
              <option value="paid">Fully Paid</option>
            </select>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="px-4 py-2 border border-stone-200 rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="birthday_deck">Birthday</option>
              <option value="corporate_deck">Corporate</option>
              <option value="nanny_class">Nanny Class</option>
            </select>
            {creators.length > 0 && (
              <select
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="px-4 py-2 border border-stone-200 rounded-lg"
              >
                <option value="all">All Staff</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || c.email}
                  </option>
                ))}
              </select>
            )}
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
              <p className="text-stone-500 mb-4">Try adjusting your filters or create a new booking</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Booking
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Booking</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Service</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Event</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Payment</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Created By</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredBookings.map((booking) => {
                    const paymentStatus = getPaymentStatusBadge(booking);
                    return (
                      <tr key={booking.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-stone-900">{booking.booking_number}</div>
                          <div className="text-xs text-stone-500">{formatDate(booking.created_at)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-stone-900">{booking.customer_name}</div>
                          <div className="text-sm text-stone-500">{booking.customer_email}</div>
                          {booking.company_name && (
                            <div className="text-xs text-stone-400">{booking.company_name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getServiceTypeIcon(booking.service_type)}
                            <div>
                              <div className="text-stone-900">{booking.service_name}</div>
                              {booking.menu_name && (
                                <div className="text-xs text-stone-500">{booking.menu_name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {booking.event_date ? (
                            <div>
                              <div className="text-stone-900">{formatDate(booking.event_date)}</div>
                              <div className="text-xs text-stone-500">{booking.event_time || ""} • {booking.guest_count} guests</div>
                            </div>
                          ) : (
                            <span className="text-stone-400">Not scheduled</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-stone-900">{formatPrice(booking.total_amount)}</div>
                          {booking.is_deposit_payment && (
                            <div className="text-xs text-stone-500">
                              Deposit: {formatPrice(booking.deposit_amount || 0)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={paymentStatus.className}>
                            {paymentStatus.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusBadge(booking.status)}>
                            {booking.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {booking.creator ? (
                            <span className="text-sm text-stone-600">
                              {booking.creator.full_name || booking.creator.email}
                            </span>
                          ) : (
                            <span className="text-sm text-stone-400">Customer</span>
                          )}
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
                            {booking.payment_link?.stripe_payment_link_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyPaymentLink(booking.payment_link!.stripe_payment_link_url!, booking.id)}
                                title="Copy Payment Link"
                              >
                                {copiedLink === booking.id ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                  <X className="h-6 w-6" />
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
                  <p className="text-sm text-stone-500">Total Amount</p>
                  <p className="font-medium text-lg">{formatPrice(selectedBooking.total_amount)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Customer</h3>
                <div className="space-y-2">
                  <p className="font-medium">{selectedBooking.customer_name}</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-stone-400" />
                    <span>{selectedBooking.customer_email}</span>
                  </div>
                  {selectedBooking.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-stone-400" />
                      <span>{selectedBooking.customer_phone}</span>
                    </div>
                  )}
                  {selectedBooking.company_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-stone-400" />
                      <span>{selectedBooking.company_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Service Details</h3>
                <div className="space-y-2">
                  <p className="text-stone-900">{selectedBooking.service_name}</p>
                  {selectedBooking.menu_name && (
                    <p className="text-sm text-stone-600">Menu: {selectedBooking.menu_name}</p>
                  )}
                  <p className="text-sm text-stone-500">
                    {selectedBooking.guest_count} guest(s)
                    {selectedBooking.event_date && ` • ${formatDate(selectedBooking.event_date)}`}
                    {selectedBooking.event_time && ` at ${selectedBooking.event_time}`}
                  </p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Payment</h3>
                <div className="space-y-2">
                  {(() => {
                    const paymentStatus = getPaymentStatusBadge(selectedBooking);
                    return (
                      <Badge className={paymentStatus.className}>
                        {paymentStatus.label}
                      </Badge>
                    );
                  })()}
                  {selectedBooking.is_deposit_payment && (
                    <div className="bg-stone-50 p-3 rounded-lg text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Deposit (50%):</span>
                        <span className={selectedBooking.deposit_paid ? "text-green-600" : ""}>
                          {formatPrice(selectedBooking.deposit_amount || 0)} {selectedBooking.deposit_paid && "✓"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Balance:</span>
                        <span className={selectedBooking.balance_paid ? "text-green-600" : ""}>
                          {formatPrice(selectedBooking.balance_amount || 0)} {selectedBooking.balance_paid && "✓"}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedBooking.payment_link?.stripe_payment_link_url && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-stone-400" />
                      <a
                        href={selectedBooking.payment_link.stripe_payment_link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Payment Link <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyPaymentLink(selectedBooking.payment_link!.stripe_payment_link_url!, selectedBooking.id)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Extras */}
              {selectedBooking.extras && selectedBooking.extras.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Extras</h3>
                  <div className="space-y-1">
                    {selectedBooking.extras.map((extra: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{extra.name} × {extra.quantity || 1}</span>
                        <span>{formatPrice(extra.price * (extra.quantity || 1))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Special Requests</h3>
                  <p className="text-sm text-stone-600">{selectedBooking.special_requests}</p>
                </div>
              )}

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-stone-600">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Created By */}
              {selectedBooking.creator && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Created By</h3>
                  <p className="text-sm text-stone-600">
                    {selectedBooking.creator.full_name || selectedBooking.creator.email}
                  </p>
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
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateModal && (
        <CreateBookingModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchBookings();
          }}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

// Create Booking Modal Component
interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId: string | null;
}

function CreateBookingModal({ isOpen, onClose, onSuccess, currentUserId }: CreateBookingModalProps) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [availableExtras, setAvailableExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);
  const [guestCount, setGuestCount] = useState(6);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  const [generatePaymentLink, setGeneratePaymentLink] = useState(true);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Menus
  const corporateMenus = [
    { id: "spirit_of_thailand", name: "Spirit of Thailand", price: 300 },
    { id: "la_cucina_italiana", name: "La Cucina Italiana", price: 425 },
    { id: "the_mexican_table", name: "The Mexican Table", price: 450 },
    { id: "the_art_of_sushi", name: "The Art Of Sushi", price: 450 },
    { id: "pan_asian_feast", name: "Pan Asian Feast", price: 475 },
    { id: "le_petit_menu", name: "Le Petit Menu", price: 500 },
    { id: "umami_house", name: "Umami House", price: 550 },
    { id: "mystery_box", name: "Mystery Box Challenge", price: 550 },
  ];

  const birthdayMenus = [
    { id: "texas_roadhouse", name: "Texas Roadhouse", price: 275 },
    { id: "little_italy", name: "Little Italy", price: 250 },
    { id: "funtastic", name: "Funtastic", price: 180 },
    { id: "kung_fu_panda", name: "Kung Fu Panda", price: 275 },
    { id: "cupcake_masterclass", name: "Cupcake Masterclass", price: 275 },
    { id: "dream_diner", name: "Dream Diner", price: 200 },
    { id: "hola_amigos", name: "Hola Amigos", price: 250 },
    { id: "healthylicious", name: "Healthylicious", price: 225 },
  ];

  // Service extras
  const serviceExtrasMap: Record<string, Extra[]> = {
    birthday_deck: [
      { id: "custom_apron", name: "Custom Apron", price: 80 },
      { id: "custom_chef_hat", name: "Custom Chef Hat", price: 60 },
      { id: "custom_cake_10", name: "Birthday Cake (10 people)", price: 575 },
      { id: "custom_cake_20", name: "Birthday Cake (20 people)", price: 700 },
      { id: "balloons", name: "Balloon Bundle", price: 260 },
      { id: "table_setting_10", name: "Table Setting (10 people)", price: 300 },
      { id: "cupcake_goodie_bag", name: "Cupcake Goodie Bag", price: 80 },
      { id: "mini_pizzas", name: "Mini Pizzas (12 pcs)", price: 50 },
      { id: "chicken_tenders", name: "Chicken Tenders (12 pcs)", price: 60 },
      { id: "soft_drinks", name: "Soft Drinks (per piece)", price: 15 },
    ],
    corporate_deck: [
      { id: "custom_apron", name: "Custom Apron", price: 80 },
      { id: "custom_chef_hat", name: "Custom Chef Hat", price: 60 },
      { id: "custom_cake_20", name: "Custom Cake (20 people)", price: 700 },
      { id: "balloons", name: "Balloon Bundle", price: 260 },
      { id: "mini_pizzas", name: "Mini Pizzas (12 pcs)", price: 50 },
      { id: "chicken_tenders", name: "Chicken Tenders (12 pcs)", price: 60 },
      { id: "soft_drinks", name: "Soft Drinks (per piece)", price: 15 },
    ],
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      setAvailableExtras(serviceExtrasMap[selectedService.service_type] || []);
    }
  }, [selectedService]);

  useEffect(() => {
    if (eventDate) {
      fetchAvailability();
    }
  }, [eventDate]);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        const allServices = [
          ...(data.kids || []),
          ...(data.adults || []),
          ...(data.walkin || []),
        ];
        setServices(allServices);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  const fetchAvailability = async () => {
    if (!eventDate) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/services/availability?date=${eventDate}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableTimeSlots(data.availableSlots || []);
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isCorporate = selectedService?.service_type === "corporate_deck";
  const isBirthday = selectedService?.service_type === "birthday_deck";
  const hasMenuSelection = isCorporate || isBirthday;
  const menus = isCorporate ? corporateMenus : isBirthday ? birthdayMenus : [];

  const extrasTotal = Object.entries(selectedExtras).reduce((sum, [id, qty]) => {
    const extra = availableExtras.find(e => e.id === id);
    return sum + (extra ? extra.price * qty : 0);
  }, 0);

  const baseAmount = selectedMenu 
    ? selectedMenu.price * guestCount 
    : (selectedService?.base_price || 0) * guestCount;
  
  const totalAmount = baseAmount + extrasTotal;
  const isDepositPayment = isCorporate;
  const depositAmount = isDepositPayment ? Math.ceil(totalAmount * 0.5) : totalAmount;

  const handleSubmit = async () => {
    if (!selectedService || !customerName || !customerEmail) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          serviceType: selectedService.service_type,
          menuId: selectedMenu?.id || null,
          menuName: selectedMenu?.name || null,
          menuPrice: selectedMenu?.price || null,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          companyName: companyName || null,
          eventDate: eventDate || null,
          eventTime: eventTime || null,
          guestCount,
          extras: Object.entries(selectedExtras)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => {
              const extra = availableExtras.find(e => e.id === id);
              return { id, name: extra?.name, price: extra?.price, quantity: qty };
            }),
          baseAmount,
          extrasAmount: extrasTotal,
          totalAmount,
          isDepositPayment,
          depositAmount: isDepositPayment ? depositAmount : null,
          balanceAmount: isDepositPayment ? totalAmount - depositAmount : null,
          specialRequests: specialRequests || null,
          notes: notes || null,
          createdBy: currentUserId,
          generatePaymentLink,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.paymentLink?.stripeUrl) {
          navigator.clipboard.writeText(data.paymentLink.stripeUrl);
          alert(`Booking created! Payment link copied to clipboard:\n\n${data.paymentLink.stripeUrl}`);
        } else {
          alert("Booking created successfully!");
        }
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Failed to create booking:", error);
      alert("Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-900">Create New Booking</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${step >= s ? "bg-amber-500" : "bg-stone-200"}`}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900">Select Service</h3>
              <div className="grid gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setSelectedMenu(null);
                      setSelectedExtras({});
                    }}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      selectedService?.id === service.id
                        ? "border-amber-500 bg-amber-50"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {service.service_type === "birthday_deck" && <Cake className="h-5 w-5 text-pink-500" />}
                      {service.service_type === "corporate_deck" && <Building2 className="h-5 w-5 text-blue-500" />}
                      {service.service_type === "nanny_class" && <ChefHat className="h-5 w-5 text-amber-500" />}
                      <div>
                        <p className="font-medium text-stone-900">{service.name}</p>
                        <p className="text-sm text-stone-500">{service.category}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {hasMenuSelection && selectedService && (
                <div className="mt-6">
                  <h3 className="font-semibold text-stone-900 mb-3">Select Menu</h3>
                  <div className="grid gap-2">
                    {menus.map((menu) => (
                      <button
                        key={menu.id}
                        onClick={() => setSelectedMenu(menu)}
                        className={`p-3 border rounded-lg text-left flex justify-between items-center ${
                          selectedMenu?.id === menu.id
                            ? "border-amber-500 bg-amber-50"
                            : "border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <span>{menu.name}</span>
                        <span className="text-stone-600">AED {menu.price}/person</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Event Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900">Event Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => {
                      setEventDate(e.target.value);
                      setEventTime("");
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Number of Guests</label>
                  <input
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={40}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              {eventDate && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Time Slot</label>
                  {loadingSlots ? (
                    <p className="text-stone-500">Loading available slots...</p>
                  ) : availableTimeSlots.length === 0 ? (
                    <p className="text-amber-600">No slots available for this date</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableTimeSlots.map((slot) => (
                        <button
                          key={slot.start}
                          onClick={() => setEventTime(slot.start)}
                          className={`p-3 border rounded-lg text-sm ${
                            eventTime === slot.start
                              ? "border-amber-500 bg-amber-50"
                              : "border-stone-200 hover:border-stone-300"
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {availableExtras.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-stone-900 mb-3">Add Extras</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableExtras.map((extra) => (
                      <div key={extra.id} className="flex items-center justify-between p-2 border border-stone-200 rounded-lg">
                        <div>
                          <span className="text-stone-900">{extra.name}</span>
                          <span className="text-stone-500 ml-2">AED {extra.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedExtras(prev => ({
                              ...prev,
                              [extra.id]: Math.max(0, (prev[extra.id] || 0) - 1)
                            }))}
                            className="p-1 border rounded"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{selectedExtras[extra.id] || 0}</span>
                          <button
                            onClick={() => setSelectedExtras(prev => ({
                              ...prev,
                              [extra.id]: (prev[extra.id] || 0) + 1
                            }))}
                            className="p-1 border rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Customer Details */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900">Customer Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                  placeholder="Full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                  placeholder="+971 XX XXX XXXX"
                />
              </div>

              {isCorporate && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                    placeholder="Company name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Special Requests</label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                  rows={2}
                  placeholder="Any special requests or dietary requirements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                  rows={2}
                  placeholder="Notes for internal reference..."
                />
              </div>

              {/* Order Summary */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-stone-900 mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{selectedService?.name}</span>
                    <span>AED {baseAmount.toFixed(2)}</span>
                  </div>
                  {selectedMenu && (
                    <div className="flex justify-between text-stone-600">
                      <span>Menu: {selectedMenu.name} × {guestCount}</span>
                    </div>
                  )}
                  {extrasTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Extras</span>
                      <span>AED {extrasTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t border-amber-300">
                    <span>Total</span>
                    <span>AED {totalAmount.toFixed(2)}</span>
                  </div>
                  {isDepositPayment && (
                    <div className="text-amber-700 pt-2">
                      <p>50% Deposit: AED {depositAmount.toFixed(2)}</p>
                      <p className="text-xs">Balance due 48 hours before event</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="generatePaymentLink"
                  checked={generatePaymentLink}
                  onChange={(e) => setGeneratePaymentLink(e.target.checked)}
                  className="rounded border-stone-300"
                />
                <label htmlFor="generatePaymentLink" className="text-sm text-stone-700">
                  Generate payment link
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-stone-50 flex justify-between">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
          >
            {step > 1 ? "Back" : "Cancel"}
          </Button>
          
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !selectedService}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !customerName || !customerEmail}
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Booking
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
