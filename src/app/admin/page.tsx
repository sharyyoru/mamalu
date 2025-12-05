import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  CalendarDays,
  Warehouse,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  UserPlus,
  AlertCircle,
} from "lucide-react";

async function getDashboardStats() {
  const supabase = await createClient();
  if (!supabase) return null;

  const today = new Date().toISOString().split('T')[0];

  const [
    { count: totalUsers },
    { count: todayBookings },
    { count: activeRentals },
    { count: pendingOrders },
    { count: newLeads },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("class_bookings").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("rental_bookings").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return {
    totalUsers: totalUsers || 0,
    todayBookings: todayBookings || 0,
    activeRentals: activeRentals || 0,
    pendingOrders: pendingOrders || 0,
    newLeads: newLeads || 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Today's Bookings", value: stats?.todayBookings || 0, icon: CalendarDays, color: "text-green-600", bg: "bg-green-100" },
    { title: "Active Rentals", value: stats?.activeRentals || 0, icon: Warehouse, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Pending Orders", value: stats?.pendingOrders || 0, icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "New Leads", value: stats?.newLeads || 0, icon: UserPlus, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-stone-600">Welcome to Mamalu Kitchen Admin Portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/admin/classes/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium text-stone-900">Schedule a Class</div>
                <div className="text-sm text-stone-500">Add a new class session</div>
              </div>
            </a>
            <a href="/admin/users/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-stone-900">Add User</div>
                <div className="text-sm text-stone-500">Create a new user account</div>
              </div>
            </a>
            <a href="/admin/orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-stone-900">Process Orders</div>
                <div className="text-sm text-stone-500">View and fulfill pending orders</div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-800">Supabase Connected</span>
              </div>
              <span className="text-xs text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-800">Sanity CMS</span>
              </div>
              <span className="text-xs text-green-600">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm font-medium text-yellow-800">Stripe Payments</span>
              </div>
              <span className="text-xs text-yellow-600">Test Mode</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
