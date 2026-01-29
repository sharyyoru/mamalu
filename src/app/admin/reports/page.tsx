"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
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
  UserCheck,
  UserPlus,
  Crown,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface ReportData {
  period: { from: string; to: string };
  summary?: {
    totalBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    totalGuests: number;
    newCustomers: number;
    averageBookingValue: number;
    conversionRate: number;
  };
  comparison?: {
    bookingsChange: number;
    revenueChange: number;
  };
  paymentMethods?: Record<string, number>;
  customerTypes?: Record<string, number>;
  topClients?: Array<{
    name: string;
    email: string;
    totalBookings: number;
    totalSpent: number;
    customerType: string;
  }>;
  topClasses?: Array<{
    title: string;
    type: string;
    totalBookings: number;
    totalRevenue: number;
    totalGuests: number;
  }>;
  classTypes?: Record<string, { bookings: number; revenue: number; guests: number }>;
  dailyRevenue?: Array<{ date: string; amount: number }>;
  monthlyRevenue?: Array<{ month: string; amount: number }>;
  statusBreakdown?: Record<string, number>;
  allClients?: Array<{
    name: string;
    email: string;
    phone: string;
    totalBookings: number;
    totalSpent: number;
    customerType: string;
    lastBooking: string;
  }>;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");
  const [reportType, setReportType] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports?type=${reportType}&period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period, reportType]);

  const exportReport = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${reportType}-${period}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Error loading report</h3>
        <p className="text-stone-500 mb-4">{error}</p>
        <Button onClick={fetchReport}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Reports</h1>
          <p className="text-stone-500 mt-1">Business analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReport}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period & Report Type Selectors */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {["week", "month", "quarter", "year"].map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 border-l pl-4">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "clients", label: "Clients", icon: Users },
            { id: "classes", label: "Classes", icon: CalendarDays },
            { id: "revenue", label: "Revenue", icon: DollarSign },
          ].map((report) => {
            const Icon = report.icon;
            return (
              <Button
                key={report.id}
                variant={reportType === report.id ? "default" : "outline"}
                size="sm"
                onClick={() => setReportType(report.id)}
              >
                <Icon className="h-4 w-4 mr-1" />
                {report.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Report Date Range */}
      {data?.period && (
        <div className="text-sm text-stone-500">
          Showing data from {new Date(data.period.from).toLocaleDateString()} to {new Date(data.period.to).toLocaleDateString()}
        </div>
      )}

      {/* Overview Report */}
      {reportType === "overview" && data?.summary && (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Revenue"
              value={formatPrice(data.summary.totalRevenue)}
              change={data.comparison?.revenueChange}
              icon={DollarSign}
              color="from-emerald-500 to-teal-600"
            />
            <StatCard
              label="Total Bookings"
              value={data.summary.totalBookings.toString()}
              change={data.comparison?.bookingsChange}
              icon={CalendarDays}
              color="from-violet-500 to-purple-600"
            />
            <StatCard
              label="New Customers"
              value={data.summary.newCustomers.toString()}
              icon={UserPlus}
              color="from-amber-500 to-orange-600"
            />
            <StatCard
              label="Total Guests"
              value={data.summary.totalGuests.toString()}
              icon={Users}
              color="from-cyan-500 to-blue-600"
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">Conversion Rate</p>
                    <p className="text-2xl font-bold">{data.summary.conversionRate.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">Avg Booking Value</p>
                    <p className="text-2xl font-bold">{formatPrice(data.summary.averageBookingValue)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-100">
                    <Target className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">Pending Bookings</p>
                    <p className="text-2xl font-bold">{data.summary.pendingBookings}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-100">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          {data.paymentMethods && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(data.paymentMethods).map(([method, count]) => (
                    <div key={method} className="p-4 bg-stone-50 rounded-xl">
                      <p className="text-sm text-stone-500 capitalize">{method}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Clients Report */}
      {reportType === "clients" && data && (
        <>
          {/* Customer Type Distribution */}
          {data.customerTypes && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CustomerTypeCard
                type="VIP"
                count={data.customerTypes.vip || 0}
                icon={Crown}
                color="bg-amber-100 text-amber-600"
              />
              <CustomerTypeCard
                type="Returning"
                count={data.customerTypes.returning || 0}
                icon={UserCheck}
                color="bg-green-100 text-green-600"
              />
              <CustomerTypeCard
                type="New"
                count={data.customerTypes.new || 0}
                icon={UserPlus}
                color="bg-blue-100 text-blue-600"
              />
              <CustomerTypeCard
                type="Inactive"
                count={data.customerTypes.inactive || 0}
                icon={Clock}
                color="bg-stone-100 text-stone-600"
              />
            </div>
          )}

          {/* Top Clients */}
          {data.topClients && data.topClients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Clients by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topClients.map((client, i) => (
                    <div key={client.email} className="flex items-center gap-4 p-3 bg-stone-50 rounded-xl">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-stone-900">{client.name}</p>
                        <p className="text-sm text-stone-500">{client.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-stone-900">{formatPrice(client.totalSpent)}</p>
                        <p className="text-xs text-stone-500">{client.totalBookings} bookings</p>
                      </div>
                      <Badge className={getCustomerTypeBadge(client.customerType)}>
                        {client.customerType}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Clients Table */}
          {data.allClients && data.allClients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>All Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-stone-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Contact</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Bookings</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Total Spent</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-stone-500">Last Booking</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {data.allClients.slice(0, 50).map((client) => (
                        <tr key={client.email} className="hover:bg-stone-50">
                          <td className="px-4 py-3 font-medium">{client.name}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm">{client.email}</div>
                            {client.phone && <div className="text-xs text-stone-500">{client.phone}</div>}
                          </td>
                          <td className="px-4 py-3">{client.totalBookings}</td>
                          <td className="px-4 py-3 font-medium">{formatPrice(client.totalSpent)}</td>
                          <td className="px-4 py-3">
                            <Badge className={getCustomerTypeBadge(client.customerType)}>
                              {client.customerType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-stone-500">
                            {new Date(client.lastBooking).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Classes Report */}
      {reportType === "classes" && data && (
        <>
          {/* Class Type Breakdown */}
          {data.classTypes && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.classTypes).map(([type, stats]) => (
                <Card key={type}>
                  <CardContent className="p-4">
                    <p className="text-sm text-stone-500 capitalize mb-2">{type} Classes</p>
                    <p className="text-2xl font-bold">{stats.bookings}</p>
                    <p className="text-sm text-stone-500">bookings</p>
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm">
                        <span className="font-medium">{formatPrice(stats.revenue)}</span> revenue
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">{stats.guests}</span> guests
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Top Classes */}
          {data.topClasses && data.topClasses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topClasses.map((cls, i) => (
                    <div key={cls.title} className="flex items-center gap-4 p-3 bg-stone-50 rounded-xl">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-stone-900">{cls.title}</p>
                        <p className="text-sm text-stone-500 capitalize">{cls.type || "General"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-stone-900">{formatPrice(cls.totalRevenue)}</p>
                        <p className="text-xs text-stone-500">
                          {cls.totalBookings} bookings • {cls.totalGuests} guests
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Revenue Report */}
      {reportType === "revenue" && data && (
        <>
          {/* Revenue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-stone-500">Total Revenue</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatPrice((data as any).totalRevenue || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-stone-500">Total Transactions</p>
                <p className="text-3xl font-bold">{(data as any).totalTransactions || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-stone-500">Avg Transaction Value</p>
                <p className="text-3xl font-bold">
                  {formatPrice((data as any).averageTransactionValue || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Class Type */}
          {(data as any).revenueByClassType && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Class Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries((data as any).revenueByClassType).map(([type, amount]) => {
                    const total = (data as any).totalRevenue || 1;
                    const percentage = ((amount as number) / total) * 100;
                    return (
                      <div key={type}>
                        <div className="flex justify-between mb-1">
                          <span className="capitalize">{type}</span>
                          <span className="font-medium">{formatPrice(amount as number)}</span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Revenue Chart */}
          {data.monthlyRevenue && data.monthlyRevenue.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-64">
                  {data.monthlyRevenue.map((item, i) => {
                    const maxRevenue = Math.max(...data.monthlyRevenue!.map(m => m.amount));
                    const height = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;
                    return (
                      <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-orange-400 transition-all hover:opacity-80"
                          style={{ height: `${height}%`, minHeight: item.amount > 0 ? "8px" : "0" }}
                          title={formatPrice(item.amount)}
                        />
                        <span className="text-xs text-stone-500">
                          {new Date(item.month + "-01").toLocaleDateString("en-US", { month: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Data State */}
      {!data?.summary && !data?.topClients && !data?.topClasses && !(data as any)?.totalRevenue && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No data available</h3>
            <p className="text-stone-500">
              No bookings found for the selected period. Try selecting a different time range.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  change, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: string; 
  change?: number; 
  icon: any; 
  color: string;
}) {
  const isPositive = change === undefined || change >= 0;
  
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${color} p-5 text-white`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-6 w-6 opacity-80" />
        {change !== undefined && (
          <span className={`flex items-center text-sm ${isPositive ? "text-green-200" : "text-red-200"}`}>
            {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}

function CustomerTypeCard({
  type,
  count,
  icon: Icon,
  color,
}: {
  type: string;
  count: number;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm text-stone-500">{type}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getCustomerTypeBadge(type: string): string {
  switch (type) {
    case "vip":
      return "bg-amber-100 text-amber-700";
    case "returning":
      return "bg-green-100 text-green-700";
    case "new":
      return "bg-blue-100 text-blue-700";
    case "inactive":
      return "bg-stone-100 text-stone-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}
