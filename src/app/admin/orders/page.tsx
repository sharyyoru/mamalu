"use client";

import { useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  Filter,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  DollarSign,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

const mockOrders = [
  {
    id: 'ORD-001234',
    customer: 'Sarah Al Maktoum',
    email: 'sarah@email.com',
    items: [
      { name: 'Premium Spice Box', qty: 2, price: 180 },
      { name: 'Cooking Class Gift Card', qty: 1, price: 450 },
    ],
    total: 810,
    status: 'processing',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    date: '2024-12-05',
    shippingAddress: 'Dubai Marina, Dubai',
  },
  {
    id: 'ORD-001233',
    customer: 'Ahmed Hassan',
    email: 'ahmed@company.ae',
    items: [
      { name: 'Cast Iron Skillet', qty: 1, price: 350 },
    ],
    total: 350,
    status: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    date: '2024-12-04',
    shippingAddress: 'JBR, Dubai',
  },
  {
    id: 'ORD-001232',
    customer: 'Maria Santos',
    email: 'maria@gmail.com',
    items: [
      { name: 'Baking Essentials Kit', qty: 1, price: 280 },
      { name: 'Recipe Book - Middle Eastern', qty: 1, price: 120 },
    ],
    total: 400,
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    date: '2024-12-03',
    shippingAddress: 'Downtown Dubai',
  },
  {
    id: 'ORD-001231',
    customer: 'John Peterson',
    email: 'john@hotel.com',
    items: [
      { name: 'Professional Knife Set', qty: 3, price: 650 },
    ],
    total: 1950,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'invoice',
    date: '2024-12-05',
    shippingAddress: 'Business Bay, Dubai',
  },
  {
    id: 'ORD-001230',
    customer: 'Fatima Khalid',
    email: 'fatima@startup.io',
    items: [
      { name: 'Spice Collection - Premium', qty: 1, price: 450 },
    ],
    total: 450,
    status: 'cancelled',
    paymentStatus: 'refunded',
    paymentMethod: 'card',
    date: '2024-12-02',
    shippingAddress: 'Al Barsha, Dubai',
  },
];

const stats = [
  { label: 'Total Orders', value: '156', change: '+12%', icon: ShoppingBag, color: 'from-violet-500 to-purple-600' },
  { label: 'Revenue', value: 'AED 52,400', change: '+18%', icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
  { label: 'Avg Order Value', value: 'AED 336', change: '+5%', icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
  { label: 'New Customers', value: '34', change: '+8%', icon: Users, color: 'from-cyan-500 to-blue-600' },
];

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'refunded': return 'bg-stone-100 text-stone-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? mockOrders 
    : mockOrders.filter(o => o.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Orders</h1>
          <p className="text-stone-500 mt-1">Manage product orders and fulfillment</p>
        </div>
        <Button>
          <ShoppingBag className="h-4 w-4 mr-2" />
          Create Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-2xl bg-gradient-to-br ${stat.color} p-5 text-white`}>
              <div className="flex items-center justify-between mb-3">
                <Icon className="h-6 w-6 opacity-80" />
                <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm opacity-80">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by order ID, customer..."
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg text-sm"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-stone-200 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="px-4 py-2 border border-stone-200 rounded-lg text-sm">
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Order</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Customer</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Items</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Total</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Payment</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50 group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-stone-900">{order.id}</p>
                      <p className="text-sm text-stone-500">{formatDate(order.date)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-stone-900">{order.customer}</p>
                      <p className="text-sm text-stone-500">{order.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-stone-700">
                      {order.items.slice(0, 2).map((item, i) => (
                        <div key={i}>{item.qty}x {item.name}</div>
                      ))}
                      {order.items.length > 2 && (
                        <span className="text-stone-400">+{order.items.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-stone-900">{formatPrice(order.total)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${getStatusBadge(order.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Badge className={getPaymentBadge(order.paymentStatus)}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                      <span className="text-xs text-stone-400">{order.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
