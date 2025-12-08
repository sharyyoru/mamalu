"use client";

import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingBag,
  CalendarDays,
  Warehouse,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PieChart,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const revenueData = {
  total: 156800,
  change: 18.5,
  breakdown: [
    { name: 'Classes', value: 78400, percentage: 50, color: 'bg-violet-500' },
    { name: 'Kitchen Rental', value: 47040, percentage: 30, color: 'bg-emerald-500' },
    { name: 'Products', value: 23520, percentage: 15, color: 'bg-amber-500' },
    { name: 'Memberships', value: 7840, percentage: 5, color: 'bg-cyan-500' },
  ],
};

const monthlyRevenue = [
  { month: 'Jan', value: 45000 },
  { month: 'Feb', value: 52000 },
  { month: 'Mar', value: 48000 },
  { month: 'Apr', value: 61000 },
  { month: 'May', value: 55000 },
  { month: 'Jun', value: 67000 },
  { month: 'Jul', value: 72000 },
  { month: 'Aug', value: 69000 },
  { month: 'Sep', value: 78000 },
  { month: 'Oct', value: 84000 },
  { month: 'Nov', value: 92000 },
  { month: 'Dec', value: 156800 },
];

const topClasses = [
  { name: 'Middle Eastern Essentials', bookings: 145, revenue: 65250, rating: 4.9 },
  { name: 'Artisan Bread Masterclass', bookings: 98, revenue: 53900, rating: 4.8 },
  { name: 'Sushi & Japanese Cuisine', bookings: 87, revenue: 56550, rating: 4.9 },
  { name: 'French Pastry Basics', bookings: 76, revenue: 57000, rating: 4.7 },
  { name: 'Kids Cooking Adventure', bookings: 124, revenue: 31000, rating: 4.8 },
];

const stats = [
  { label: 'Total Revenue', value: 'AED 156,800', change: '+18.5%', positive: true, icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
  { label: 'New Customers', value: '234', change: '+12%', positive: true, icon: Users, color: 'from-violet-500 to-purple-600' },
  { label: 'Class Bookings', value: '456', change: '+8%', positive: true, icon: CalendarDays, color: 'from-amber-500 to-orange-600' },
  { label: 'Rental Hours', value: '892', change: '-3%', positive: false, icon: Warehouse, color: 'from-cyan-500 to-blue-600' },
];

const kpis = [
  { label: 'Customer Retention', value: 78, target: 80, unit: '%' },
  { label: 'Class Fill Rate', value: 82, target: 85, unit: '%' },
  { label: 'Avg Order Value', value: 342, target: 400, unit: 'AED' },
  { label: 'NPS Score', value: 72, target: 70, unit: '' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('month');
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Analytics</h1>
          <p className="text-stone-500 mt-1">Business performance and insights</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'quarter', 'year'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-2xl bg-gradient-to-br ${stat.color} p-5 text-white`}>
              <div className="flex items-center justify-between mb-3">
                <Icon className="h-6 w-6 opacity-80" />
                <span className={`flex items-center text-sm ${stat.positive ? 'text-green-200' : 'text-red-200'}`}>
                  {stat.positive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm opacity-80">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-500" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-64">
              {monthlyRevenue.map((month, i) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className={`w-full rounded-t-lg transition-all hover:opacity-80 ${
                      i === monthlyRevenue.length - 1 
                        ? 'bg-gradient-to-t from-amber-500 to-orange-400' 
                        : 'bg-gradient-to-t from-stone-300 to-stone-200'
                    }`}
                    style={{ height: `${(month.value / maxRevenue) * 100}%` }}
                    title={formatPrice(month.value)}
                  />
                  <span className="text-xs text-stone-500">{month.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-amber-500" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-stone-900">{formatPrice(revenueData.total)}</p>
              <p className="text-sm text-emerald-600 flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4" />
                +{revenueData.change}% vs last period
              </p>
            </div>
            
            {/* Simple donut representation */}
            <div className="flex h-4 rounded-full overflow-hidden mb-6">
              {revenueData.breakdown.map((item) => (
                <div
                  key={item.name}
                  className={`${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                />
              ))}
            </div>

            <div className="space-y-3">
              {revenueData.breakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-sm text-stone-600">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-stone-900">{formatPrice(item.value)}</p>
                    <p className="text-xs text-stone-500">{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClasses.map((cls, i) => (
                <div key={cls.name} className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-stone-900">{cls.name}</p>
                    <p className="text-sm text-stone-500">{cls.bookings} bookings • ⭐ {cls.rating}</p>
                  </div>
                  <p className="font-semibold text-stone-900">{formatPrice(cls.revenue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              Key Performance Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {kpis.map((kpi) => {
                const percentage = (kpi.value / kpi.target) * 100;
                const isAchieved = kpi.value >= kpi.target;
                return (
                  <div key={kpi.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-stone-600">{kpi.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">
                          {kpi.unit === 'AED' ? formatPrice(kpi.value) : `${kpi.value}${kpi.unit}`}
                        </span>
                        <span className="text-xs text-stone-400">
                          / {kpi.unit === 'AED' ? formatPrice(kpi.target) : `${kpi.target}${kpi.unit}`}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isAchieved ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <TrendingUp className="h-6 w-6 text-emerald-600 mb-2" />
              <p className="font-medium text-stone-900">Strong Month</p>
              <p className="text-sm text-stone-600 mt-1">Revenue is up 18.5% compared to last month. Keep up the momentum!</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <CalendarDays className="h-6 w-6 text-amber-600 mb-2" />
              <p className="font-medium text-stone-900">Class Demand</p>
              <p className="text-sm text-stone-600 mt-1">Middle Eastern classes are your best performers. Consider adding more sessions.</p>
            </div>
            <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
              <Users className="h-6 w-6 text-violet-600 mb-2" />
              <p className="font-medium text-stone-900">Customer Growth</p>
              <p className="text-sm text-stone-600 mt-1">234 new customers this month. Referral program contributing 35%.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
