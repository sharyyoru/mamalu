"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  ExternalLink,
  RefreshCw,
  Calendar,
  Users,
  DollarSign,
  Mail,
  Copy,
  Check,
} from "lucide-react";

interface ServiceBooking {
  id: string;
  booking_number: string;
  service_name: string;
  menu_name: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  company_name: string | null;
  event_date: string | null;
  guest_count: number;
  total_amount: number;
  deposit_amount: number | null;
  balance_amount: number | null;
  deposit_paid: boolean;
  balance_paid: boolean;
  payment_status: string;
  balance_payment_link: string | null;
  balance_due_date: string | null;
  balance_reminder_sent: boolean;
  created_at: string;
}

export default function PaymentTrackingPage() {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/admin/payment-tracking");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateBalanceLink = async (bookingId: string) => {
    setGeneratingLink(bookingId);
    try {
      const res = await fetch("/api/admin/payment-tracking/generate-balance-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      
      if (res.ok) {
        await fetchBookings();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to generate link");
      }
    } catch (error) {
      console.error("Error generating link:", error);
      alert("Failed to generate link");
    } finally {
      setGeneratingLink(null);
    }
  };

  const sendBalanceReminder = async (bookingId: string) => {
    try {
      const res = await fetch("/api/admin/payment-tracking/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      
      if (res.ok) {
        await fetchBookings();
        alert("Reminder sent successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to send reminder");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Failed to send reminder");
    }
  };

  const copyToClipboard = (link: string, bookingId: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(bookingId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getStatusBadge = (booking: ServiceBooking) => {
    if (booking.balance_paid && booking.deposit_paid) {
      return <Badge className="bg-green-100 text-green-700">Fully Paid</Badge>;
    }
    if (booking.deposit_paid && !booking.balance_paid) {
      return <Badge className="bg-amber-100 text-amber-700">Balance Pending</Badge>;
    }
    if (!booking.deposit_paid) {
      return <Badge className="bg-red-100 text-red-700">Deposit Pending</Badge>;
    }
    return <Badge className="bg-stone-100 text-stone-700">Unknown</Badge>;
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "deposit_pending") return !b.deposit_paid;
    if (filter === "balance_pending") return b.deposit_paid && !b.balance_paid;
    if (filter === "fully_paid") return b.deposit_paid && b.balance_paid;
    return true;
  });

  // Stats
  const stats = {
    total: bookings.length,
    depositPending: bookings.filter((b) => !b.deposit_paid).length,
    balancePending: bookings.filter((b) => b.deposit_paid && !b.balance_paid).length,
    fullyPaid: bookings.filter((b) => b.deposit_paid && b.balance_paid).length,
    pendingAmount: bookings
      .filter((b) => b.deposit_paid && !b.balance_paid)
      .reduce((sum, b) => sum + (b.balance_amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Payment Tracking</h1>
          <p className="text-stone-500">Track deposits and balance payments for service bookings</p>
        </div>
        <Button onClick={fetchBookings} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-stone-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-stone-500">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.depositPending}</p>
                <p className="text-sm text-stone-500">Deposit Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.balancePending}</p>
                <p className="text-sm text-stone-500">Balance Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">AED {stats.pendingAmount.toLocaleString()}</p>
                <p className="text-sm text-stone-500">Pending Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "All" },
          { key: "deposit_pending", label: "Deposit Pending" },
          { key: "balance_pending", label: "Balance Pending" },
          { key: "fully_paid", label: "Fully Paid" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-stone-500">
              No bookings found for this filter.
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-stone-900">{booking.booking_number}</h3>
                      {getStatusBadge(booking)}
                    </div>
                    <p className="text-stone-600 font-medium">
                      {booking.service_name} {booking.menu_name && `- ${booking.menu_name}`}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {booking.customer_name} {booking.company_name && `(${booking.company_name})`}
                      </span>
                      <span>{booking.customer_email}</span>
                      {booking.event_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(booking.event_date).toLocaleDateString()}
                        </span>
                      )}
                      <span>{booking.guest_count} guests</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-stone-900">
                      AED {booking.total_amount?.toLocaleString()}
                    </p>
                    <p className="text-sm text-stone-500">Total</p>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-stone-500 uppercase">Deposit</p>
                      <p className="font-medium">
                        AED {booking.deposit_amount?.toLocaleString() || 0}
                      </p>
                      <Badge className={booking.deposit_paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {booking.deposit_paid ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 uppercase">Balance</p>
                      <p className="font-medium">
                        AED {booking.balance_amount?.toLocaleString() || 0}
                      </p>
                      <Badge className={booking.balance_paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                        {booking.balance_paid ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 uppercase">Balance Due</p>
                      <p className="font-medium">
                        {booking.balance_due_date 
                          ? new Date(booking.balance_due_date).toLocaleDateString()
                          : "48h before event"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 uppercase">Reminder</p>
                      <Badge className={booking.balance_reminder_sent ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-700"}>
                        {booking.balance_reminder_sent ? "Sent" : "Not Sent"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions for balance pending */}
                {booking.deposit_paid && !booking.balance_paid && (
                  <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-3">
                    {!booking.balance_payment_link ? (
                      <Button
                        onClick={() => generateBalanceLink(booking.id)}
                        disabled={generatingLink === booking.id}
                        className="bg-stone-900 hover:bg-stone-800"
                      >
                        {generatingLink === booking.id ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4 mr-2" />
                        )}
                        Generate Balance Payment Link
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(booking.balance_payment_link!, booking.id)}
                        >
                          {copiedLink === booking.id ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Payment Link
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                        >
                          <a href={booking.balance_payment_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Link
                          </a>
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => sendBalanceReminder(booking.id)}
                      disabled={!booking.balance_payment_link}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {booking.balance_reminder_sent ? "Resend Reminder" : "Send Reminder Email"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
