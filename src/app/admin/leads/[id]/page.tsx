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
  Link as LinkIcon,
  Ticket,
  RefreshCw,
  Copy,
  CheckCircle,
  ExternalLink,
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

  // Payment Link Modal State
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [creatingPaymentLink, setCreatingPaymentLink] = useState(false);
  const [newPaymentLink, setNewPaymentLink] = useState({
    title: "",
    amount: "",
    numberOfPeople: 1,
    description: "",
    notes: "",
  });
  const [createdPaymentLinkUrl, setCreatedPaymentLinkUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Create Booking Modal State
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    serviceType: "birthday_deck",
    serviceName: "Birthday Deck",
    menuId: "",
    menuName: "",
    menuPrice: 0,
    guestCount: 10,
    eventDate: "",
    eventTime: "",
    specialRequests: "",
    notes: "",
    generatePaymentLink: true,
  });
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  const [createdBookingPaymentLink, setCreatedBookingPaymentLink] = useState<string | null>(null);
  const [copiedBookingLink, setCopiedBookingLink] = useState(false);

  // Menu options
  const birthdayMenus = [
    { id: "pizza_party", name: "Pizza Party", price: 250 },
    { id: "mini_chefs", name: "Mini Chefs", price: 275 },
    { id: "baking_stars", name: "Baking Stars", price: 275 },
    { id: "sushi_kids", name: "Sushi Kids", price: 250 },
    { id: "pasta_makers", name: "Pasta Makers", price: 275 },
  ];

  const corporateMenus = [
    { id: "team_building", name: "Team Building", price: 200 },
    { id: "pasta_perfection", name: "Pasta Perfection", price: 225 },
    { id: "sushi_experience", name: "Sushi Experience", price: 250 },
    { id: "kung_fu_panda", name: "Kung Fu Panda", price: 275 },
    { id: "cupcake_masterclass", name: "Cupcake Masterclass", price: 275 },
    { id: "dream_diner", name: "Dream Diner", price: 200 },
    { id: "hola_amigos", name: "Hola Amigos", price: 250 },
    { id: "healthylicious", name: "Healthylicious", price: 225 },
  ];

  // Service extras
  const serviceExtrasMap: Record<string, { id: string; name: string; price: number }[]> = {
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

  const availableExtras = serviceExtrasMap[bookingForm.serviceType] || [];
  const availableMenus = bookingForm.serviceType === "birthday_deck" ? birthdayMenus : 
                         bookingForm.serviceType === "corporate_deck" ? corporateMenus : [];
  
  const extrasTotal = Object.entries(selectedExtras).reduce((sum, [id, qty]) => {
    const extra = availableExtras.find(e => e.id === id);
    return sum + (extra ? extra.price * qty : 0);
  }, 0);

  const baseAmount = bookingForm.menuPrice > 0 
    ? bookingForm.menuPrice * bookingForm.guestCount 
    : (bookingForm.serviceType === "corporate_deck" ? 200 : 250) * bookingForm.guestCount;
  
  const bookingTotalAmount = baseAmount + extrasTotal;
  const isDepositPayment = bookingForm.serviceType === "corporate_deck";
  const depositAmount = isDepositPayment ? Math.ceil(bookingTotalAmount * 0.5) : bookingTotalAmount;

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

  // Create Payment Link for this lead
  const handleCreatePaymentLink = async () => {
    if (!newPaymentLink.title || !newPaymentLink.amount) {
      alert("Please fill in required fields");
      return;
    }

    setCreatingPaymentLink(true);
    try {
      const totalAmount = parseFloat(newPaymentLink.amount) * newPaymentLink.numberOfPeople;
      const res = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPaymentLink.title,
          description: newPaymentLink.description || null,
          amount: totalAmount,
          pricePerPerson: parseFloat(newPaymentLink.amount),
          numberOfPeople: newPaymentLink.numberOfPeople,
          customerName: lead?.name || null,
          customerEmail: lead?.email || null,
          customerPhone: lead?.phone || null,
          notes: newPaymentLink.notes || null,
          singleUse: true,
          leadId: leadId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedPaymentLinkUrl(data.stripeUrl);
        setNewPaymentLink({
          title: "",
          amount: "",
          numberOfPeople: 1,
          description: "",
          notes: "",
        });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create payment link");
      }
    } catch (error) {
      console.error("Failed to create payment link:", error);
      alert("Failed to create payment link");
    } finally {
      setCreatingPaymentLink(false);
    }
  };

  const copyPaymentLink = () => {
    if (createdPaymentLinkUrl) {
      navigator.clipboard.writeText(createdPaymentLinkUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Create Booking for this lead
  const handleCreateBooking = async () => {
    if (!bookingForm.eventDate) {
      alert("Please select an event date");
      return;
    }

    setCreatingBooking(true);
    try {
      // Build extras array
      const extrasArray = Object.entries(selectedExtras)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const extra = availableExtras.find(e => e.id === id);
          return { id, name: extra?.name, price: extra?.price, quantity: qty };
        });

      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: bookingForm.serviceName,
          serviceType: bookingForm.serviceType,
          menuId: bookingForm.menuId || null,
          menuName: bookingForm.menuName || null,
          menuPrice: bookingForm.menuPrice || null,
          customerName: lead?.name || "",
          customerEmail: lead?.email || "",
          customerPhone: lead?.phone || null,
          companyName: lead?.company || null,
          eventDate: bookingForm.eventDate || null,
          eventTime: bookingForm.eventTime || null,
          guestCount: bookingForm.guestCount,
          extras: extrasArray,
          baseAmount,
          extrasAmount: extrasTotal,
          totalAmount: bookingTotalAmount,
          isDepositPayment,
          depositAmount: isDepositPayment ? depositAmount : null,
          balanceAmount: isDepositPayment ? bookingTotalAmount - depositAmount : null,
          specialRequests: bookingForm.specialRequests || null,
          notes: bookingForm.notes || null,
          generatePaymentLink: bookingForm.generatePaymentLink,
          leadId: leadId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.paymentLink?.stripeUrl) {
          setCreatedBookingPaymentLink(data.paymentLink.stripeUrl);
        } else {
          alert("Booking created successfully!");
          resetBookingForm();
          setShowCreateBookingModal(false);
          fetchLead();
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Failed to create booking:", error);
      alert("Failed to create booking");
    } finally {
      setCreatingBooking(false);
    }
  };

  const resetBookingForm = () => {
    setBookingForm({
      serviceType: "birthday_deck",
      serviceName: "Birthday Deck",
      menuId: "",
      menuName: "",
      menuPrice: 0,
      guestCount: 10,
      eventDate: "",
      eventTime: "",
      specialRequests: "",
      notes: "",
      generatePaymentLink: true,
    });
    setSelectedExtras({});
    setCreatedBookingPaymentLink(null);
    setCopiedBookingLink(false);
  };

  const copyBookingPaymentLink = () => {
    if (createdBookingPaymentLink) {
      navigator.clipboard.writeText(createdBookingPaymentLink);
      setCopiedBookingLink(true);
      setTimeout(() => setCopiedBookingLink(false), 2000);
    }
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
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPaymentLinkModal(true);
                  setCreatedPaymentLinkUrl(null);
                }}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <LinkIcon className="h-4 w-4 mr-2" /> Generate Payment Link
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowCreateBookingModal(true)}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Ticket className="h-4 w-4 mr-2" /> Create Booking
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" /> Edit Lead
              </Button>
            </>
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

      {/* Generate Payment Link Modal */}
      {showPaymentLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-amber-500 to-orange-500">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h2 className="text-xl font-bold">Generate Payment Link</h2>
                  <p className="text-amber-100 text-sm mt-1">For {lead?.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentLinkModal(false);
                    setCreatedPaymentLinkUrl(null);
                  }}
                  className="text-white/80 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {createdPaymentLinkUrl ? (
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900">Payment Link Created!</h3>
                  <p className="text-stone-500 text-sm mt-1">Share this link with your customer</p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                  <p className="text-sm text-stone-600 font-mono break-all">{createdPaymentLinkUrl}</p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={copyPaymentLink} className="flex-1">
                    {copiedLink ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </Button>
                  <a href={createdPaymentLinkUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentLinkModal(false);
                    setCreatedPaymentLinkUrl(null);
                  }}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newPaymentLink.title}
                      onChange={(e) => setNewPaymentLink({ ...newPaymentLink, title: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g., Birthday Party Booking"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Price Per Person (AED) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPaymentLink.amount}
                      onChange={(e) => setNewPaymentLink({ ...newPaymentLink, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="250.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Number of People
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={newPaymentLink.numberOfPeople}
                      onChange={(e) => setNewPaymentLink({ ...newPaymentLink, numberOfPeople: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newPaymentLink.description}
                      onChange={(e) => setNewPaymentLink({ ...newPaymentLink, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Additional details..."
                    />
                  </div>

                  {newPaymentLink.amount && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-800">Total Amount:</span>
                        <span className="font-bold text-amber-900">
                          AED {(parseFloat(newPaymentLink.amount || "0") * newPaymentLink.numberOfPeople).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-stone-50 rounded-lg p-3">
                    <p className="text-xs text-stone-600">
                      Customer: <span className="font-medium">{lead?.name}</span>
                      {lead?.email && <> • {lead.email}</>}
                    </p>
                  </div>
                </div>

                <div className="p-6 border-t bg-stone-50 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowPaymentLinkModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePaymentLink}
                    disabled={creatingPaymentLink || !newPaymentLink.title || !newPaymentLink.amount}
                    className="bg-gradient-to-r from-amber-500 to-orange-500"
                  >
                    {creatingPaymentLink ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <LinkIcon className="h-4 w-4 mr-2" />
                    )}
                    {creatingPaymentLink ? "Creating..." : "Create Payment Link"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-green-500 to-emerald-500">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h2 className="text-xl font-bold">Create Booking</h2>
                  <p className="text-green-100 text-sm mt-1">For {lead?.name}</p>
                </div>
                <button
                  onClick={() => {
                    resetBookingForm();
                    setShowCreateBookingModal(false);
                  }}
                  className="text-white/80 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {createdBookingPaymentLink ? (
              /* Success View with Payment Link */
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900">Booking Created!</h3>
                  <p className="text-stone-500 text-sm mt-1">Share this payment link with your client</p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                  <p className="text-sm text-stone-600 font-mono break-all">{createdBookingPaymentLink}</p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={copyBookingPaymentLink} className="flex-1 bg-green-600 hover:bg-green-700">
                    {copiedBookingLink ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedBookingLink ? "Copied!" : "Copy Payment Link"}
                  </Button>
                  <a href={createdBookingPaymentLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <p className="text-green-800">
                    <strong>What happens next?</strong>
                  </p>
                  <ul className="text-green-700 mt-1 space-y-1">
                    <li>• Send this link to your client to collect payment</li>
                    <li>• Payment status will update automatically when paid</li>
                    <li>• An invoice has been created for this booking</li>
                  </ul>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    resetBookingForm();
                    setShowCreateBookingModal(false);
                    fetchLead();
                  }}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              /* Booking Form */
              <>
                <div className="p-6 space-y-4">
                  {/* Service Type */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Service Type *
                    </label>
                    <select
                      value={bookingForm.serviceType}
                      onChange={(e) => {
                        const type = e.target.value;
                        const name = type === "birthday_deck" ? "Birthday Deck" : type === "corporate_deck" ? "Corporate Deck" : "Nanny Class";
                        setBookingForm({ ...bookingForm, serviceType: type, serviceName: name, menuId: "", menuName: "", menuPrice: 0 });
                        setSelectedExtras({});
                      }}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="birthday_deck">Birthday Deck</option>
                      <option value="corporate_deck">Corporate Deck</option>
                      <option value="nanny_class">Nanny Class</option>
                    </select>
                  </div>

                  {/* Menu Selection */}
                  {availableMenus.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Select Menu *
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {availableMenus.map((menu) => (
                          <button
                            key={menu.id}
                            type="button"
                            onClick={() => setBookingForm({ 
                              ...bookingForm, 
                              menuId: menu.id, 
                              menuName: menu.name, 
                              menuPrice: menu.price 
                            })}
                            className={`p-3 border rounded-lg text-left transition-all ${
                              bookingForm.menuId === menu.id
                                ? "border-green-500 bg-green-50 ring-1 ring-green-500"
                                : "border-stone-200 hover:border-green-300"
                            }`}
                          >
                            <span className="block font-medium text-stone-900 text-sm">{menu.name}</span>
                            <span className="text-xs text-stone-500">AED {menu.price}/person</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        value={bookingForm.eventDate}
                        onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Event Time
                      </label>
                      <select
                        value={bookingForm.eventTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, eventTime: e.target.value })}
                        className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select time</option>
                        <option value="10:00">10:00 AM - 12:30 PM</option>
                        <option value="13:30">1:30 PM - 3:00 PM</option>
                        <option value="16:00">4:00 PM - 5:30 PM</option>
                        <option value="18:30">6:30 PM - 8:00 PM</option>
                        <option value="21:00">9:00 PM - 10:30 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={bookingForm.guestCount}
                      onChange={(e) => setBookingForm({ ...bookingForm, guestCount: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Extras Selection */}
                  {availableExtras.length > 0 && (
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Add Extras (Optional)
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-2">
                        {availableExtras.map((extra) => (
                          <div key={extra.id} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                            <div>
                              <span className="text-sm text-stone-900">{extra.name}</span>
                              <span className="text-xs text-stone-500 ml-2">AED {extra.price}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedExtras(prev => ({
                                  ...prev,
                                  [extra.id]: Math.max(0, (prev[extra.id] || 0) - 1)
                                }))}
                                className="w-7 h-7 flex items-center justify-center border border-stone-300 rounded bg-white hover:bg-stone-100 text-stone-700"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm font-medium">{selectedExtras[extra.id] || 0}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedExtras(prev => ({
                                  ...prev,
                                  [extra.id]: (prev[extra.id] || 0) + 1
                                }))}
                                className="w-7 h-7 flex items-center justify-center border border-stone-300 rounded bg-white hover:bg-stone-100 text-stone-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Special Requests
                    </label>
                    <textarea
                      value={bookingForm.specialRequests}
                      onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Any special requests or dietary requirements..."
                    />
                  </div>

                  {/* Payment Link Checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="generatePaymentLinkBooking"
                      checked={bookingForm.generatePaymentLink}
                      onChange={(e) => setBookingForm({ ...bookingForm, generatePaymentLink: e.target.checked })}
                      className="h-4 w-4 text-green-600 rounded"
                    />
                    <label htmlFor="generatePaymentLinkBooking" className="text-sm text-stone-700">
                      Generate payment link for client
                    </label>
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Booking Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Service:</span>
                        <span className="font-medium text-green-900">{bookingForm.serviceName}</span>
                      </div>
                      {bookingForm.menuName && (
                        <div className="flex justify-between">
                          <span className="text-green-700">Menu:</span>
                          <span className="font-medium text-green-900">{bookingForm.menuName}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-green-700">Guests:</span>
                        <span className="font-medium text-green-900">{bookingForm.guestCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Base ({bookingForm.guestCount} × AED {bookingForm.menuPrice || (bookingForm.serviceType === "corporate_deck" ? 200 : 250)}):</span>
                        <span className="font-medium text-green-900">AED {baseAmount.toLocaleString()}</span>
                      </div>
                      {extrasTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700">Extras:</span>
                          <span className="font-medium text-green-900">AED {extrasTotal.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-green-200 pt-2 mt-2">
                        <div className="flex justify-between font-bold text-base">
                          <span className="text-green-800">Total:</span>
                          <span className="text-green-900">AED {bookingTotalAmount.toLocaleString()}</span>
                        </div>
                        {isDepositPayment && (
                          <div className="flex justify-between text-xs text-green-600 mt-1">
                            <span>50% Deposit Required:</span>
                            <span>AED {depositAmount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-stone-50 rounded-lg p-3">
                    <p className="text-xs text-stone-600">
                      Customer: <span className="font-medium">{lead?.name}</span>
                      {lead?.email && <> • {lead.email}</>}
                      {lead?.company && <> • {lead.company}</>}
                    </p>
                  </div>
                </div>

                <div className="p-6 border-t bg-stone-50 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => {
                    resetBookingForm();
                    setShowCreateBookingModal(false);
                  }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBooking}
                    disabled={creatingBooking || !bookingForm.eventDate}
                    className="bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    {creatingBooking ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Ticket className="h-4 w-4 mr-2" />
                    )}
                    {creatingBooking ? "Creating..." : "Create Booking"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
