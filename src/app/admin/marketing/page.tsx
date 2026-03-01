"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Megaphone,
  Mail,
  MessageSquare,
  Gift,
  Users,
  DollarSign,
  Edit3,
  Play,
  Pause,
  BarChart3,
  Send,
  Target,
  X,
  Copy,
  Check,
  Trash2,
  Calendar,
  Filter,
  Sparkles,
  Eye,
  ChevronDown,
  Cake,
  ShoppingBag,
  Clock,
  UserPlus,
  Share2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import dynamic from "next/dynamic";

const EmailBuilder = dynamic(() => import("@/components/email-editor/EmailBuilder"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8">
      <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto" />
      <p className="text-stone-600 mt-4">Loading Email Builder...</p>
    </div>
  </div>
});

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  subject?: string;
  html_content?: string;
  audience_name?: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_conversions: number;
  total_revenue: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

interface Discount {
  id: string;
  code: string;
  type: string;
  value: number;
  usage_limit?: number;
  total_used: number;
  status: string;
  valid_until?: string;
  description?: string;
  min_order_amount?: number;
  max_discount_amount?: number;
  first_order_only: boolean;
}

interface CustomerVariable {
  name: string;
  label: string;
  example: string;
}

interface Customer {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  total_spend: number;
  total_classes_attended: number;
  total_orders: number;
  referral_code?: string;
}

interface ReferralProgram {
  is_active: boolean;
  referrer_reward_type: string;
  referrer_reward_value: number;
  referee_reward_type: string;
  referee_reward_value: number;
  referrer_reward_description: string;
  referee_reward_description: string;
  min_purchase_amount?: number;
  reward_expires_days: number;
}

interface TopReferrer {
  id: string;
  name: string;
  referrals: number;
  earned: number;
  revenue: number;
}

const CUSTOMER_VARIABLES: CustomerVariable[] = [
  { name: "first_name", label: "First Name", example: "John" },
  { name: "full_name", label: "Full Name", example: "John Smith" },
  { name: "email", label: "Email", example: "john@example.com" },
  { name: "total_spend", label: "Total Spend", example: "AED 2,500" },
  { name: "total_classes", label: "Classes Attended", example: "12" },
  { name: "referral_code", label: "Referral Code", example: "JOHN1234" },
];

const AUDIENCE_PRESETS = [
  { id: "all", name: "All Customers", icon: Users, filters: {} },
  { id: "birthday-month", name: "Birthday This Month", icon: Cake, filters: { birthdayThisMonth: true } },
  { id: "vip", name: "VIP Customers (5K+ spend)", icon: Sparkles, filters: { spendingTier: "vip" } },
  { id: "premium", name: "Premium (2-5K spend)", icon: DollarSign, filters: { spendingTier: "premium" } },
  { id: "frequent", name: "Frequent Buyers (10+ orders)", icon: ShoppingBag, filters: { frequencyTier: "frequent" } },
  { id: "inactive-30", name: "Inactive 30+ Days", icon: Clock, filters: { inactiveDays: "30" } },
  { id: "inactive-60", name: "Inactive 60+ Days", icon: Clock, filters: { inactiveDays: "60" } },
  { id: "first-time", name: "First-Time Buyers", icon: UserPlus, filters: { frequencyTier: "first-time" } },
  { id: "never-purchased", name: "Never Purchased", icon: AlertCircle, filters: { frequencyTier: "never" } },
];


export default function MarketingPage() {
  const [tab, setTab] = useState<'campaigns' | 'discounts' | 'referrals'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState(AUDIENCE_PRESETS[0]);
  const [audienceCount, setAudienceCount] = useState(0);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHtml, setEmailHtml] = useState("");
  const [emailDesign, setEmailDesign] = useState<object | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [referralProgram, setReferralProgram] = useState<ReferralProgram | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [referralStats, setReferralStats] = useState({ total: 0, completed: 0, totalRevenue: 0 });
  const [discountForm, setDiscountForm] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: 10,
    description: "",
    usage_limit: null as number | null,
    min_order_amount: null as number | null,
    max_discount_amount: null as number | null,
    valid_until: "",
    first_order_only: false,
  });
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [successModal, setSuccessModal] = useState<{ show: boolean; title: string; message: string }>({ show: false, title: "", message: "" });
  const [sendModal, setSendModal] = useState<{ show: boolean; campaign: Campaign | null }>({ show: false, campaign: null });
  const [sendingCampaign, setSendingCampaign] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/marketing/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  }, []);

  const fetchDiscounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/marketing/discounts");
      const data = await res.json();
      setDiscounts(data.discounts || []);
    } catch (error) {
      console.error("Error fetching discounts:", error);
    }
  }, []);

  const fetchReferralData = useCallback(async () => {
    try {
      const [programRes, referrersRes, statsRes] = await Promise.all([
        fetch("/api/admin/marketing/referrals?view=program"),
        fetch("/api/admin/marketing/referrals?view=top-referrers"),
        fetch("/api/admin/marketing/referrals?view=stats"),
      ]);
      const [programData, referrersData, statsData] = await Promise.all([
        programRes.json(),
        referrersRes.json(),
        statsRes.json(),
      ]);
      setReferralProgram(programData.program);
      setTopReferrers(referrersData.topReferrers || []);
      setReferralStats(statsData.stats || { total: 0, completed: 0, totalRevenue: 0 });
    } catch (error) {
      console.error("Error fetching referral data:", error);
    }
  }, []);

  const fetchAudienceCount = useCallback(async (filters: Record<string, any>) => {
    try {
      const res = await fetch("/api/admin/marketing/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      });
      const data = await res.json();
      setAudienceCount(data.count || 0);
    } catch (error) {
      console.error("Error fetching audience:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCampaigns(), fetchDiscounts(), fetchReferralData()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCampaigns, fetchDiscounts, fetchReferralData]);

  useEffect(() => {
    fetchAudienceCount(selectedAudience.filters);
  }, [selectedAudience, fetchAudienceCount]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Send className="h-4 w-4" />;
      default: return <Megaphone className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-stone-100 text-stone-700';
      case 'paused': return 'bg-amber-100 text-amber-700';
      case 'exhausted': return 'bg-red-100 text-red-700';
      case 'draft': return 'bg-violet-100 text-violet-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: "test",
          testEmail,
          sendTest: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Test email sent to ${testEmail}`);
      } else {
        alert(data.error || "Failed to send test email");
      }
    } catch (error) {
      console.error("Error sending test:", error);
      alert("Failed to send test email");
    }
    setSending(false);
  };

  const handleSaveEmailBuilder = async (design: object, html: string) => {
    if (!campaignName || !emailSubject) {
      alert("Please enter a campaign name and subject");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          type: "email",
          subject: emailSubject,
          html_content: html,
          email_design: design,
          audience_filter: selectedAudience.filters,
          audience_name: selectedAudience.name,
        }),
      });
      const data = await res.json();
      if (data.campaign) {
        await fetchCampaigns();
        setShowCampaignModal(false);
        setCampaignName("");
        setEmailSubject("");
        setEmailDesign(null);
        setSuccessModal({ show: true, title: "Campaign Saved!", message: "Your campaign has been saved as a draft. You can now send it from the campaigns list." });
      } else {
        setSuccessModal({ show: true, title: "Error", message: data.error || "Failed to create campaign" });
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      setSuccessModal({ show: true, title: "Error", message: "Failed to create campaign" });
    }
    setSending(false);
  };

  const handleCreateDiscount = async () => {
    if (!discountForm.code || !discountForm.value) return;
    setSending(true);
    try {
      const endpoint = editingDiscount 
        ? "/api/admin/marketing/discounts" 
        : "/api/admin/marketing/discounts";
      const method = editingDiscount ? "PUT" : "POST";
      const body = editingDiscount 
        ? { id: editingDiscount.id, ...discountForm }
        : discountForm;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.discount) {
        await fetchDiscounts();
        setShowDiscountModal(false);
        setEditingDiscount(null);
        setDiscountForm({
          code: "",
          type: "percent",
          value: 10,
          description: "",
          usage_limit: null,
          min_order_amount: null,
          max_discount_amount: null,
          valid_until: "",
          first_order_only: false,
        });
      }
    } catch (error) {
      console.error("Error saving discount:", error);
    }
    setSending(false);
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm("Delete this discount code?")) return;
    try {
      await fetch(`/api/admin/marketing/discounts?id=${id}`, { method: "DELETE" });
      await fetchDiscounts();
    } catch (error) {
      console.error("Error deleting discount:", error);
    }
  };

  const handleUpdateReferralProgram = async () => {
    if (!referralProgram) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/marketing/referrals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "program", ...referralProgram }),
      });
      const data = await res.json();
      if (data.program) {
        setReferralProgram(data.program);
        setShowReferralModal(false);
        alert("Referral program updated!");
      }
    } catch (error) {
      console.error("Error updating program:", error);
    }
    setSending(false);
  };

  const handleSendCampaign = async (campaignId: string, sendToAll: boolean) => {
    setSendingCampaign(true);
    try {
      const res = await fetch("/api/admin/marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, sendToAll }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCampaigns();
        setSendModal({ show: false, campaign: null });
        setSuccessModal({ 
          show: true, 
          title: "Campaign Sent!", 
          message: `Successfully sent to ${data.sent} recipients. ${data.failed > 0 ? `${data.failed} failed.` : ''}` 
        });
      } else {
        setSuccessModal({ show: true, title: "Error", message: data.error || "Failed to send campaign" });
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      setSuccessModal({ show: true, title: "Error", message: "Failed to send campaign" });
    }
    setSendingCampaign(false);
  };

  const handleTestSendCampaign = async (campaignId: string, email: string) => {
    setSendingCampaign(true);
    try {
      const res = await fetch("/api/admin/marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, testEmail: email, sendTest: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessModal({ show: true, title: "Test Sent!", message: `Test email sent to ${email}` });
      } else {
        setSuccessModal({ show: true, title: "Error", message: data.error || "Failed to send test" });
      }
    } catch (error) {
      setSuccessModal({ show: true, title: "Error", message: "Failed to send test email" });
    }
    setSendingCampaign(false);
  };

  const stats = [
    { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'active').length.toString(), icon: Megaphone, color: 'from-violet-500 to-purple-600' },
    { label: 'Total Reach', value: campaigns.reduce((sum, c) => sum + c.total_sent, 0).toLocaleString(), icon: Users, color: 'from-emerald-500 to-teal-600' },
    { label: 'Active Discounts', value: discounts.filter(d => d.status === 'active').length.toString(), icon: Target, color: 'from-amber-500 to-orange-600' },
    { label: 'Campaign Revenue', value: formatPrice(campaigns.reduce((sum, c) => sum + c.total_revenue, 0)), icon: DollarSign, color: 'from-cyan-500 to-blue-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Marketing</h1>
          <p className="text-stone-500 mt-1">Campaigns, discounts, and referral programs</p>
        </div>
        <Button onClick={() => setShowCampaignModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-2xl bg-gradient-to-br ${stat.color} p-5 text-white`}>
              <Icon className="h-6 w-6 opacity-80 mb-3" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm opacity-80">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-200">
        {['campaigns', 'discounts', 'referrals'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-500'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-amber-100">
                      {getTypeIcon(campaign.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-stone-900">{campaign.name}</h3>
                        <Badge className={getStatusBadge(campaign.status)}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-stone-500 mt-1">
                        {campaign.audience_name || 'All Customers'} • {campaign.start_date ? formatDate(campaign.start_date) : 'No date'} - {campaign.end_date ? formatDate(campaign.end_date) : 'Ongoing'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <Button size="sm" onClick={() => setSendModal({ show: true, campaign })}>
                        <Send className="h-4 w-4 mr-1" /> Send
                      </Button>
                    )}
                    {campaign.status === 'completed' && (
                      <Badge className="bg-green-100 text-green-700">Sent</Badge>
                    )}
                    <Button variant="ghost" size="sm"><BarChart3 className="h-4 w-4" /></Button>
                  </div>
                </div>

                {campaign.total_sent > 0 && (
                  <div className="grid grid-cols-5 gap-4 mt-6 pt-4 border-t border-stone-100">
                    <div>
                      <p className="text-2xl font-bold text-stone-900">{campaign.total_sent.toLocaleString()}</p>
                      <p className="text-sm text-stone-500">Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-stone-900">{campaign.total_opened.toLocaleString()}</p>
                      <p className="text-sm text-stone-500">Opened ({campaign.total_sent > 0 ? Math.round((campaign.total_opened / campaign.total_sent) * 100) : 0}%)</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-stone-900">{campaign.total_clicked.toLocaleString()}</p>
                      <p className="text-sm text-stone-500">Clicked ({campaign.total_sent > 0 ? Math.round((campaign.total_clicked / campaign.total_sent) * 100) : 0}%)</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{campaign.total_conversions}</p>
                      <p className="text-sm text-stone-500">Conversions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{formatPrice(campaign.total_revenue)}</p>
                      <p className="text-sm text-stone-500">Revenue</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'discounts' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Discount Codes</CardTitle>
            <Button size="sm" onClick={() => setShowDiscountModal(true)}><Plus className="h-4 w-4 mr-1" /> Add Code</Button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Code</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Discount</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Usage</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Expires</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Status</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-stone-50 group">
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-stone-100 rounded text-sm font-mono">{discount.code}</code>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-stone-900">
                        {discount.type === 'percent' ? `${discount.value}%` : formatPrice(discount.value)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{discount.total_used}</span>
                        {discount.usage_limit && (
                          <>
                            <span className="text-stone-400">/</span>
                            <span className="text-sm text-stone-500">{discount.usage_limit}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-600">{discount.valid_until ? formatDate(discount.valid_until) : 'Never'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusBadge(discount.status)}>
                        {discount.status.charAt(0).toUpperCase() + discount.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingDiscount(discount);
                          setDiscountForm({
                            code: discount.code,
                            type: discount.type as "percent" | "fixed",
                            value: discount.value,
                            description: discount.description || "",
                            usage_limit: discount.usage_limit || null,
                            min_order_amount: discount.min_order_amount || null,
                            max_discount_amount: discount.max_discount_amount || null,
                            valid_until: discount.valid_until || "",
                            first_order_only: discount.first_order_only,
                          });
                          setShowDiscountModal(true);
                        }}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDiscount(discount.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === 'referrals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-amber-500" />
                Referral Program
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="font-medium text-stone-900">Current Offer</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {referralProgram ? `AED ${referralProgram.referrer_reward_value}` : 'AED 100'} credit
                </p>
                <p className="text-sm text-stone-500 mt-1">
                  {referralProgram?.referrer_reward_description || 'For both referrer and referee'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 rounded-xl">
                  <p className="text-sm text-stone-500">Total Referrals</p>
                  <p className="text-2xl font-bold text-stone-900">{referralStats.total}</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-xl">
                  <p className="text-sm text-stone-500">Revenue Generated</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatPrice(referralStats.totalRevenue)}</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => setShowReferralModal(true)}>Edit Program</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Referrers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topReferrers.length > 0 ? topReferrers.map((referrer, i) => (
                  <div key={referrer.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-stone-900">{referrer.name}</p>
                        <p className="text-sm text-stone-500">{referrer.referrals} referrals</p>
                      </div>
                    </div>
                    <p className="font-semibold text-emerald-600">{formatPrice(referrer.earned)}</p>
                  </div>
                )) : (
                  <p className="text-center text-stone-500 py-8">No referrals yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Builder Modal */}
      {showCampaignModal && (
        <EmailBuilder
          onSave={handleSaveEmailBuilder}
          onClose={() => setShowCampaignModal(false)}
          initialDesign={emailDesign || undefined}
          campaignName={campaignName}
          onCampaignNameChange={setCampaignName}
          subject={emailSubject}
          onSubjectChange={setEmailSubject}
        />
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-stone-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-900">
                {editingDiscount ? 'Edit Discount Code' : 'Create Discount Code'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => { setShowDiscountModal(false); setEditingDiscount(null); }}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Discount Code</label>
                <input
                  type="text"
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE20"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Type</label>
                  <select
                    value={discountForm.type}
                    onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value as "percent" | "fixed" })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (AED)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Value</label>
                  <input
                    type="number"
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={discountForm.description}
                  onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                  placeholder="e.g., Holiday special discount"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Usage Limit</label>
                  <input
                    type="number"
                    value={discountForm.usage_limit || ""}
                    onChange={(e) => setDiscountForm({ ...discountForm, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Min Order (AED)</label>
                  <input
                    type="number"
                    value={discountForm.min_order_amount || ""}
                    onChange={(e) => setDiscountForm({ ...discountForm, min_order_amount: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="None"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Expires On</label>
                <input
                  type="date"
                  value={discountForm.valid_until}
                  onChange={(e) => setDiscountForm({ ...discountForm, valid_until: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={discountForm.first_order_only}
                  onChange={(e) => setDiscountForm({ ...discountForm, first_order_only: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-stone-700">First order only</span>
              </label>
            </div>

            <div className="border-t border-stone-200 p-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowDiscountModal(false); setEditingDiscount(null); }}>Cancel</Button>
              <Button onClick={handleCreateDiscount} disabled={sending || !discountForm.code || !discountForm.value}>
                {sending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {editingDiscount ? 'Update Discount' : 'Create Discount'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Program Modal */}
      {showReferralModal && referralProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-stone-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-900">Edit Referral Program</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowReferralModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={referralProgram.is_active}
                  onChange={(e) => setReferralProgram({ ...referralProgram, is_active: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-stone-700">Program Active</span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Referrer Reward (AED)</label>
                  <input
                    type="number"
                    value={referralProgram.referrer_reward_value}
                    onChange={(e) => setReferralProgram({ ...referralProgram, referrer_reward_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Referee Reward (AED)</label>
                  <input
                    type="number"
                    value={referralProgram.referee_reward_value}
                    onChange={(e) => setReferralProgram({ ...referralProgram, referee_reward_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Referrer Reward Description</label>
                <input
                  type="text"
                  value={referralProgram.referrer_reward_description}
                  onChange={(e) => setReferralProgram({ ...referralProgram, referrer_reward_description: e.target.value })}
                  placeholder="e.g., AED 100 credit for each friend"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Referee Reward Description</label>
                <input
                  type="text"
                  value={referralProgram.referee_reward_description}
                  onChange={(e) => setReferralProgram({ ...referralProgram, referee_reward_description: e.target.value })}
                  placeholder="e.g., AED 100 off your first order"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Min Purchase (AED)</label>
                  <input
                    type="number"
                    value={referralProgram.min_purchase_amount || ""}
                    onChange={(e) => setReferralProgram({ ...referralProgram, min_purchase_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="None"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Reward Expires (days)</label>
                  <input
                    type="number"
                    value={referralProgram.reward_expires_days}
                    onChange={(e) => setReferralProgram({ ...referralProgram, reward_expires_days: parseInt(e.target.value) || 90 })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-stone-200 p-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowReferralModal(false)}>Cancel</Button>
              <Button onClick={handleUpdateReferralProgram} disabled={sending}>
                {sending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${successModal.title.includes('Error') ? 'bg-red-100' : 'bg-green-100'}`}>
              {successModal.title.includes('Error') ? (
                <X className="h-8 w-8 text-red-600" />
              ) : (
                <Check className="h-8 w-8 text-green-600" />
              )}
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">{successModal.title}</h2>
            <p className="text-stone-600 mb-6">{successModal.message}</p>
            <Button onClick={() => setSuccessModal({ show: false, title: "", message: "" })} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Send Campaign Modal */}
      {sendModal.show && sendModal.campaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-stone-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-900">Send Campaign</h2>
              <Button variant="ghost" size="sm" onClick={() => setSendModal({ show: false, campaign: null })}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="font-medium text-stone-900">{sendModal.campaign.name}</p>
                <p className="text-sm text-stone-500 mt-1">Subject: {sendModal.campaign.subject}</p>
              </div>

              <div>
                <h3 className="font-medium text-stone-900 mb-3">Send Test Email</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter test email address"
                    className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => handleTestSendCampaign(sendModal.campaign!.id, testEmail)}
                    disabled={!testEmail || sendingCampaign}
                  >
                    {sendingCampaign ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-6">
                <h3 className="font-medium text-stone-900 mb-3">Send to All Contacts</h3>
                <p className="text-sm text-stone-500 mb-4">
                  This will send the campaign to all subscribed contacts in your CRM ({audienceCount.toLocaleString()} contacts).
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => handleSendCampaign(sendModal.campaign!.id, true)}
                  disabled={sendingCampaign}
                >
                  {sendingCampaign ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Send to All Contacts</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
