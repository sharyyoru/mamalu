"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  FileText,
  Receipt,
  Clock,
  TrendingUp,
  UserCheck,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  lead_type: string | null;
  source: string;
  status: string;
  interests: string[] | null;
  budget_range: string | null;
  notes: string | null;
  assigned_to: string | null;
  assigned_user?: { id: string; full_name: string; email: string } | null;
  last_contacted_at: string | null;
  created_at: string;
  total_revenue: number;
  commission_rate: number;
}

interface LeadBooking {
  id: string;
  booking_type: string;
  description: string | null;
  event_date: string | null;
  amount: number;
  payment_status: string;
  notes: string | null;
  created_at: string;
}

interface ServiceBooking {
  id: string;
  booking_number: string;
  service_type: string;
  service_name: string;
  event_date: string;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  created_at: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
}

const leadStatuses = [
  { id: "new", name: "New", color: "bg-blue-100 text-blue-700" },
  { id: "contacted", name: "Contacted", color: "bg-purple-100 text-purple-700" },
  { id: "qualified", name: "Qualified", color: "bg-indigo-100 text-indigo-700" },
  { id: "proposal", name: "Proposal", color: "bg-amber-100 text-amber-700" },
  { id: "negotiation", name: "Negotiation", color: "bg-orange-100 text-orange-700" },
  { id: "won", name: "Won", color: "bg-green-100 text-green-700" },
  { id: "sold_hot", name: "Sold - Hot", color: "bg-red-100 text-red-700" },
  { id: "sold_cold", name: "Sold - Cold", color: "bg-cyan-100 text-cyan-700" },
  { id: "lost", name: "Lost", color: "bg-stone-100 text-stone-700" },
];

const bookingTypes = [
  { id: "birthday", name: "Birthday Party" },
  { id: "corporate", name: "Corporate Event" },
  { id: "nanny", name: "Nanny Class" },
  { id: "camp", name: "Camp" },
  { id: "class", name: "Cooking Class" },
  { id: "other", name: "Other" },
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [leadBookings, setLeadBookings] = useState<LeadBooking[]>([]);
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, totalInvoices: 0 });
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "invoices">("overview");
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    booking_type: "birthday",
    description: "",
    event_date: "",
    amount: "",
    payment_status: "paid",
    notes: "",
  });

  useEffect(() => {
    fetchLead();
    fetchStaffMembers();
  }, [leadId]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leads/${leadId}`);
      if (res.ok) {
        const data = await res.json();
        setLead(data.lead);
        setLeadBookings(data.leadBookings || []);
        setServiceBookings(data.serviceBookings || []);
        setInvoices(data.invoices || []);
        setStats(data.stats || { totalRevenue: 0, totalBookings: 0, totalInvoices: 0 });
        setEditForm(data.lead);
      }
    } catch (error) {
      console.error("Error fetching lead:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const res = await fetch("/api/admin/users?limit=100");
      if (res.ok) {
        const data = await res.json();
        // Filter to staff and admin roles
        const staff = (data.users || []).filter((u: any) => 
          u.role === 'staff' || u.role === 'admin' || u.role === 'super_admin'
        );
        setStaffMembers(staff);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const data = await res.json();
        setLead({ ...lead, ...data.lead });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving lead:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBooking = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newBooking,
          amount: parseFloat(newBooking.amount) || 0,
        }),
      });
      if (res.ok) {
        setShowAddBooking(false);
        setNewBooking({
          booking_type: "birthday",
          description: "",
          event_date: "",
          amount: "",
          payment_status: "paid",
          notes: "",
        });
        fetchLead();
      }
    } catch (error) {
      console.error("Error adding booking:", error);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      const res = await fetch(`/api/leads/${leadId}/bookings?bookingId=${bookingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchLead();
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-AE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const s = leadStatuses.find((ls) => ls.id === status);
    return s?.color || "bg-stone-100 text-stone-700";
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8">
        <p className="text-stone-500">Lead not found</p>
        <Button onClick={() => router.push("/admin/leads")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/admin/leads")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{lead.name}</h1>
            <p className="text-stone-500">{lead.company || lead.lead_type || "Lead"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" /> Edit Lead
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Total Revenue</p>
                <p className="text-xl font-bold text-stone-900">{formatPrice(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Total Bookings</p>
                <p className="text-xl font-bold text-stone-900">{stats.totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Receipt className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Invoices</p>
                <p className="text-xl font-bold text-stone-900">{stats.totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Status</p>
                <Badge className={getStatusBadge(lead.status)}>
                  {leadStatuses.find((s) => s.id === lead.status)?.name || lead.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lead Details */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-sm text-stone-500">Name</label>
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-stone-500">Email</label>
                    <input
                      type="email"
                      value={editForm.email || ""}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-stone-500">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone || ""}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-stone-500">Company</label>
                    <input
                      type="text"
                      value={editForm.company || ""}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-stone-500">Status</label>
                    <select
                      value={editForm.status || "new"}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    >
                      {leadStatuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-stone-500">Assigned To</label>
                    <select
                      value={editForm.assigned_to || ""}
                      onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value || null })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    >
                      <option value="">Unassigned</option>
                      {staffMembers.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.full_name || staff.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-stone-500">Notes</label>
                    <textarea
                      value={editForm.notes || ""}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-stone-400" />
                    <span>{lead.name}</span>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-stone-400" />
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-stone-400" />
                      <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-stone-400" />
                      <span>{lead.company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 text-stone-400" />
                    <span>
                      {lead.assigned_user?.full_name || lead.assigned_user?.email || "Unassigned"}
                    </span>
                  </div>
                  {lead.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-stone-500">Notes</p>
                      <p className="mt-1 text-stone-700">{lead.notes}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-stone-500">Source</p>
                    <Badge className="mt-1">{lead.source}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Created</p>
                    <p className="mt-1">{formatDate(lead.created_at)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === "overview" ? "default" : "outline"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === "bookings" ? "default" : "outline"}
              onClick={() => setActiveTab("bookings")}
            >
              Bookings ({leadBookings.length + serviceBookings.length})
            </Button>
            <Button
              variant={activeTab === "invoices" ? "default" : "outline"}
              onClick={() => setActiveTab("invoices")}
            >
              Invoices ({invoices.length})
            </Button>
          </div>

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Bookings & Revenue History</CardTitle>
                <Button size="sm" onClick={() => setShowAddBooking(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Booking
                </Button>
              </CardHeader>
              <CardContent>
                {showAddBooking && (
                  <div className="mb-6 p-4 border rounded-lg bg-stone-50 space-y-4">
                    <h4 className="font-medium">Add Historical Booking</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-stone-500">Type</label>
                        <select
                          value={newBooking.booking_type}
                          onChange={(e) => setNewBooking({ ...newBooking, booking_type: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border rounded-lg"
                        >
                          {bookingTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-stone-500">Event Date</label>
                        <input
                          type="date"
                          value={newBooking.event_date}
                          onChange={(e) => setNewBooking({ ...newBooking, event_date: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-stone-500">Amount (AED)</label>
                        <input
                          type="number"
                          value={newBooking.amount}
                          onChange={(e) => setNewBooking({ ...newBooking, amount: e.target.value })}
                          placeholder="0.00"
                          className="w-full mt-1 px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-stone-500">Payment Status</label>
                        <select
                          value={newBooking.payment_status}
                          onChange={(e) => setNewBooking({ ...newBooking, payment_status: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border rounded-lg"
                        >
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="partial">Partial</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-stone-500">Description</label>
                      <input
                        type="text"
                        value={newBooking.description}
                        onChange={(e) => setNewBooking({ ...newBooking, description: e.target.value })}
                        placeholder="e.g., Birthday party for 15 kids"
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-stone-500">Notes</label>
                      <textarea
                        value={newBooking.notes}
                        onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                        rows={2}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddBooking}>Save Booking</Button>
                      <Button variant="outline" onClick={() => setShowAddBooking(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Manual Bookings List */}
                {leadBookings.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-stone-500 mb-3">Manual Entries</h4>
                    <div className="space-y-2">
                      {leadBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-stone-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <Calendar className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {bookingTypes.find((t) => t.id === booking.booking_type)?.name || booking.booking_type}
                              </p>
                              <p className="text-sm text-stone-500">
                                {booking.description || "No description"}
                                {booking.event_date && ` • ${formatDate(booking.event_date)}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(booking.amount)}</p>
                              <Badge
                                className={
                                  booking.payment_status === "paid"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }
                              >
                                {booking.payment_status}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBooking(booking.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Bookings List */}
                {serviceBookings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-stone-500 mb-3">System Bookings</h4>
                    <div className="space-y-2">
                      {serviceBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-stone-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{booking.service_name}</p>
                              <p className="text-sm text-stone-500">
                                {booking.booking_number} • {formatDate(booking.event_date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(booking.total_amount)}</p>
                            <Badge
                              className={
                                booking.payment_status === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }
                            >
                              {booking.payment_status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {leadBookings.length === 0 && serviceBookings.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-500">No bookings yet</p>
                    <p className="text-sm text-stone-400">Add historical bookings to track revenue</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length > 0 ? (
                  <div className="space-y-2">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-stone-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Receipt className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{invoice.invoice_number}</p>
                            <p className="text-sm text-stone-500">{formatDate(invoice.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(invoice.amount)}</p>
                          <Badge
                            className={
                              invoice.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-500">No invoices yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...leadBookings, ...serviceBookings]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map((item, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="p-2 bg-stone-100 rounded-full">
                          <Clock className="h-4 w-4 text-stone-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {"booking_type" in item
                              ? bookingTypes.find((t) => t.id === item.booking_type)?.name
                              : item.service_name}
                          </p>
                          <p className="text-sm text-stone-500">
                            {"amount" in item ? formatPrice(item.amount) : formatPrice(item.total_amount)} •{" "}
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  {leadBookings.length === 0 && serviceBookings.length === 0 && (
                    <p className="text-stone-500 text-center py-4">No activity yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
