"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Tags, 
  Plus, 
  Search,
  Megaphone,
  Mail,
  MessageSquare,
  Gift,
  Users,
  TrendingUp,
  DollarSign,
  Eye,
  Edit3,
  Play,
  Pause,
  BarChart3,
  Send,
  Target,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

const campaigns = [
  {
    id: '1',
    name: 'Holiday Special - 20% Off Classes',
    type: 'email',
    status: 'active',
    audience: 'All Subscribers',
    sent: 2450,
    opened: 1230,
    clicked: 456,
    conversions: 34,
    revenue: 15300,
    startDate: '2024-12-01',
    endDate: '2024-12-31',
  },
  {
    id: '2',
    name: 'Win-back Campaign',
    type: 'email',
    status: 'active',
    audience: 'Inactive 60+ days',
    sent: 380,
    opened: 142,
    clicked: 45,
    conversions: 8,
    revenue: 3600,
    startDate: '2024-11-15',
    endDate: '2024-12-15',
  },
  {
    id: '3',
    name: 'New Year Promo',
    type: 'sms',
    status: 'scheduled',
    audience: 'All Customers',
    sent: 0,
    opened: 0,
    clicked: 0,
    conversions: 0,
    revenue: 0,
    startDate: '2024-12-28',
    endDate: '2025-01-05',
  },
  {
    id: '4',
    name: 'Black Friday Flash Sale',
    type: 'push',
    status: 'completed',
    audience: 'App Users',
    sent: 1850,
    opened: 920,
    clicked: 380,
    conversions: 67,
    revenue: 28450,
    startDate: '2024-11-24',
    endDate: '2024-11-27',
  },
];

const discounts = [
  { id: '1', code: 'HOLIDAY20', type: 'percent', value: 20, usageLimit: 100, used: 34, status: 'active', expires: '2024-12-31' },
  { id: '2', code: 'WELCOME50', type: 'fixed', value: 50, usageLimit: null, used: 156, status: 'active', expires: null },
  { id: '3', code: 'VIP25', type: 'percent', value: 25, usageLimit: 50, used: 50, status: 'exhausted', expires: '2024-12-31' },
  { id: '4', code: 'FRIEND100', type: 'fixed', value: 100, usageLimit: 200, used: 89, status: 'active', expires: '2025-01-31' },
];

const stats = [
  { label: 'Active Campaigns', value: '4', icon: Megaphone, color: 'from-violet-500 to-purple-600' },
  { label: 'Total Reach', value: '12.4K', icon: Users, color: 'from-emerald-500 to-teal-600' },
  { label: 'Conversion Rate', value: '2.8%', icon: Target, color: 'from-amber-500 to-orange-600' },
  { label: 'Campaign Revenue', value: 'AED 47,350', icon: DollarSign, color: 'from-cyan-500 to-blue-600' },
];

export default function MarketingPage() {
  const [tab, setTab] = useState<'campaigns' | 'discounts' | 'referrals'>('campaigns');

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
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Marketing</h1>
          <p className="text-stone-500 mt-1">Campaigns, discounts, and referral programs</p>
        </div>
        <Button>
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
                        {campaign.audience} • {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'active' ? (
                      <Button variant="outline" size="sm"><Pause className="h-4 w-4 mr-1" /> Pause</Button>
                    ) : campaign.status === 'scheduled' ? (
                      <Button variant="outline" size="sm"><Play className="h-4 w-4 mr-1" /> Start</Button>
                    ) : null}
                    <Button variant="ghost" size="sm"><BarChart3 className="h-4 w-4" /></Button>
                  </div>
                </div>

                {campaign.sent > 0 && (
                  <div className="grid grid-cols-5 gap-4 mt-6 pt-4 border-t border-stone-100">
                    <div>
                      <p className="text-2xl font-bold text-stone-900">{campaign.sent.toLocaleString()}</p>
                      <p className="text-sm text-stone-500">Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-stone-900">{campaign.opened.toLocaleString()}</p>
                      <p className="text-sm text-stone-500">Opened ({Math.round((campaign.opened / campaign.sent) * 100)}%)</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-stone-900">{campaign.clicked.toLocaleString()}</p>
                      <p className="text-sm text-stone-500">Clicked ({Math.round((campaign.clicked / campaign.sent) * 100)}%)</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{campaign.conversions}</p>
                      <p className="text-sm text-stone-500">Conversions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{formatPrice(campaign.revenue)}</p>
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
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Code</Button>
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
                        <span className="text-sm">{discount.used}</span>
                        {discount.usageLimit && (
                          <>
                            <span className="text-stone-400">/</span>
                            <span className="text-sm text-stone-500">{discount.usageLimit}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-600">{discount.expires ? formatDate(discount.expires) : 'Never'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusBadge(discount.status)}>
                        {discount.status.charAt(0).toUpperCase() + discount.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <Edit3 className="h-4 w-4" />
                      </Button>
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
                <p className="text-2xl font-bold text-amber-600 mt-1">AED 100 credit</p>
                <p className="text-sm text-stone-500 mt-1">For both referrer and referee</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 rounded-xl">
                  <p className="text-sm text-stone-500">Total Referrals</p>
                  <p className="text-2xl font-bold text-stone-900">234</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-xl">
                  <p className="text-sm text-stone-500">Revenue Generated</p>
                  <p className="text-2xl font-bold text-emerald-600">AED 45,600</p>
                </div>
              </div>
              <Button className="w-full">Edit Program</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Referrers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Sarah Al Maktoum', referrals: 12, earned: 1200 },
                  { name: 'Ahmed Hassan', referrals: 8, earned: 800 },
                  { name: 'Maria Santos', referrals: 6, earned: 600 },
                  { name: 'John Peterson', referrals: 5, earned: 500 },
                ].map((referrer, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
