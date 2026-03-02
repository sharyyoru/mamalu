"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  TrendingUp,
  DollarSign,
  Users,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface AnalyticsData {
  period: { from: string; to: string };
  stats: {
    totalRevenue: number;
    revenueChange: number;
    totalBookings: number;
    bookingsChange: number;
    totalGuests: number;
    guestsChange: number;
    newCustomers: number;
    customerChange: number;
  };
  revenueBreakdown: Array<{ name: string; value: number; percentage: number; color: string }>;
  monthlyRevenue: Array<{ month: string; value: number }>;
  topPerformers: Array<{ name: string; bookings: number; revenue: number }>;
  kpis: {
    avgOrderValue: number;
    prevAvgOrderValue: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/admin/analytics?period=${period}`;
      if (startDate && endDate) {
        url = `/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportToPDF = async () => {
    if (!reportRef.current || !data) return;
    
    // Dynamic import for PDF generation
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`Analytics-Report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const maxRevenue = data?.monthlyRevenue ? Math.max(...data.monthlyRevenue.map(m => m.value), 1) : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Analytics</h1>
          <p className="text-stone-500 mt-1">Business performance and insights</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button 
            variant={period === "today" ? "default" : "outline"} 
            size="sm"
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              setStartDate(today);
              setEndDate(today);
              setPeriod("today");
            }}
          >
            Today
          </Button>
          {["week", "month", "quarter", "year"].map((p) => (
            <Button
              key={p}
              variant={period === p && !startDate ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPeriod(p);
                setStartDate("");
                setEndDate("");
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-stone-600">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-stone-600">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <Button onClick={fetchAnalytics} disabled={!startDate || !endDate}>
          Apply Date Range
        </Button>
        {(startDate || endDate) && (
          <Button variant="ghost" onClick={() => { setStartDate(""); setEndDate(""); setPeriod("month"); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-6 bg-white p-4 rounded-xl">
        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="h-6 w-6 opacity-80" />
              <span className={`flex items-center text-sm ${(data?.stats.revenueChange || 0) >= 0 ? "text-green-200" : "text-red-200"}`}>
                {(data?.stats.revenueChange || 0) >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {(data?.stats.revenueChange || 0) >= 0 ? "+" : ""}{data?.stats.revenueChange || 0}%
              </span>
            </div>
            <p className="text-2xl font-bold">{formatPrice(data?.stats.totalRevenue || 0)}</p>
            <p className="text-sm opacity-80">Total Revenue</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <Users className="h-6 w-6 opacity-80" />
              <span className={`flex items-center text-sm ${(data?.stats.customerChange || 0) >= 0 ? "text-green-200" : "text-red-200"}`}>
                {(data?.stats.customerChange || 0) >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {(data?.stats.customerChange || 0) >= 0 ? "+" : ""}{data?.stats.customerChange || 0}%
              </span>
            </div>
            <p className="text-2xl font-bold">{data?.stats.newCustomers || 0}</p>
            <p className="text-sm opacity-80">New Customers</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <CalendarDays className="h-6 w-6 opacity-80" />
              <span className={`flex items-center text-sm ${(data?.stats.bookingsChange || 0) >= 0 ? "text-green-200" : "text-red-200"}`}>
                {(data?.stats.bookingsChange || 0) >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {(data?.stats.bookingsChange || 0) >= 0 ? "+" : ""}{data?.stats.bookingsChange || 0}%
              </span>
            </div>
            <p className="text-2xl font-bold">{data?.stats.totalBookings || 0}</p>
            <p className="text-sm opacity-80">Total Bookings</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <Ticket className="h-6 w-6 opacity-80" />
              <span className={`flex items-center text-sm ${(data?.stats.guestsChange || 0) >= 0 ? "text-green-200" : "text-red-200"}`}>
                {(data?.stats.guestsChange || 0) >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {(data?.stats.guestsChange || 0) >= 0 ? "+" : ""}{data?.stats.guestsChange || 0}%
              </span>
            </div>
            <p className="text-2xl font-bold">{data?.stats.totalGuests || 0}</p>
            <p className="text-sm opacity-80">Total Guests</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-500" />
                Revenue Trend (Last 12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-64">
                {data?.monthlyRevenue?.map((month, i) => (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className={`w-full rounded-t-lg transition-all hover:opacity-80 ${
                        i === (data?.monthlyRevenue?.length || 0) - 1 
                          ? "bg-gradient-to-t from-amber-500 to-orange-400" 
                          : "bg-gradient-to-t from-stone-300 to-stone-200"
                      }`}
                      style={{ height: `${(month.value / maxRevenue) * 100}%`, minHeight: month.value > 0 ? "4px" : "0" }}
                      title={formatPrice(month.value)}
                    />
                    <span className="text-xs text-stone-500">{month.month}</span>
                  </div>
                ))}
                {(!data?.monthlyRevenue || data.monthlyRevenue.length === 0) && (
                  <div className="flex-1 flex items-center justify-center text-stone-400">
                    No data available
                  </div>
                )}
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
                <p className="text-3xl font-bold text-stone-900">{formatPrice(data?.stats.totalRevenue || 0)}</p>
                <p className="text-sm text-emerald-600 flex items-center justify-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4" />
                  {(data?.stats.revenueChange || 0) >= 0 ? "+" : ""}{data?.stats.revenueChange || 0}% vs last period
                </p>
              </div>
              
              {data?.revenueBreakdown && data.revenueBreakdown.length > 0 && (
                <div className="flex h-4 rounded-full overflow-hidden mb-6">
                  {data.revenueBreakdown.map((item) => (
                    <div
                      key={item.name}
                      className={item.color}
                      style={{ width: `${item.percentage}%` }}
                    />
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {data?.revenueBreakdown?.map((item) => (
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
                {(!data?.revenueBreakdown || data.revenueBreakdown.length === 0) && (
                  <p className="text-stone-400 text-center">No revenue data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topPerformers?.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{item.name}</p>
                      <p className="text-sm text-stone-500">{item.bookings} bookings</p>
                    </div>
                    <p className="font-semibold text-stone-900">{formatPrice(item.revenue)}</p>
                  </div>
                ))}
                {(!data?.topPerformers || data.topPerformers.length === 0) && (
                  <p className="text-stone-400 text-center py-4">No data available</p>
                )}
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
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-stone-600">Average Order Value</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">
                        {formatPrice(data?.kpis.avgOrderValue || 0)}
                      </span>
                      {data?.kpis.prevAvgOrderValue && data.kpis.prevAvgOrderValue > 0 && (
                        <span className={`text-xs ${(data?.kpis.avgOrderValue || 0) >= data.kpis.prevAvgOrderValue ? "text-emerald-600" : "text-red-600"}`}>
                          {(data?.kpis.avgOrderValue || 0) >= data.kpis.prevAvgOrderValue ? "↑" : "↓"}
                          {Math.abs(Math.round(((data?.kpis.avgOrderValue || 0) - data.kpis.prevAvgOrderValue) / data.kpis.prevAvgOrderValue * 100))}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, (data?.kpis.avgOrderValue || 0) / 5)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-stone-600">Bookings This Period</span>
                    <span className="font-semibold text-stone-900">{data?.stats.totalBookings || 0}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${Math.min(100, (data?.stats.totalBookings || 0))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-stone-600">New Customers</span>
                    <span className="font-semibold text-stone-900">{data?.stats.newCustomers || 0}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, (data?.stats.newCustomers || 0))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-stone-600">Total Guests</span>
                    <span className="font-semibold text-stone-900">{data?.stats.totalGuests || 0}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${Math.min(100, (data?.stats.totalGuests || 0) / 2)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Period Info */}
        <div className="text-center text-sm text-stone-400 mt-4">
          Report Period: {data?.period?.from ? new Date(data.period.from).toLocaleDateString() : "-"} to {data?.period?.to ? new Date(data.period.to).toLocaleDateString() : "-"}
        </div>
      </div>
    </div>
  );
}
