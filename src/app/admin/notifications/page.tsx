"use client";

import { useState } from "react";
import { 
  Bell, 
  Plus,
  Search,
  Send,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  ShoppingBag,
  CreditCard,
  BookOpen,
  Settings,
  Edit3,
  Trash2,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const notificationTemplates = [
  {
    id: '1',
    name: 'Class Reminder - 24 Hours',
    type: 'automated',
    channel: 'email',
    trigger: 'class_booking',
    timing: '24 hours before',
    status: 'active',
    sent: 1245,
  },
  {
    id: '2',
    name: 'Class Reminder - 1 Hour',
    type: 'automated',
    channel: 'push',
    trigger: 'class_booking',
    timing: '1 hour before',
    status: 'active',
    sent: 1180,
  },
  {
    id: '3',
    name: 'Booking Confirmation',
    type: 'automated',
    channel: 'email',
    trigger: 'booking_created',
    timing: 'Immediately',
    status: 'active',
    sent: 3420,
  },
  {
    id: '4',
    name: 'Payment Receipt',
    type: 'automated',
    channel: 'email',
    trigger: 'payment_success',
    timing: 'Immediately',
    status: 'active',
    sent: 2890,
  },
  {
    id: '5',
    name: 'Membership Expiring',
    type: 'automated',
    channel: 'email',
    trigger: 'membership_expiring',
    timing: '7 days before',
    status: 'active',
    sent: 156,
  },
  {
    id: '6',
    name: 'Kitchen Rental Reminder',
    type: 'automated',
    channel: 'sms',
    trigger: 'rental_booking',
    timing: '2 hours before',
    status: 'active',
    sent: 456,
  },
];

const recentNotifications = [
  { id: '1', recipient: 'Sarah Al Maktoum', template: 'Class Reminder - 24 Hours', channel: 'email', status: 'delivered', sentAt: '2024-12-05T14:30:00' },
  { id: '2', recipient: 'Ahmed Hassan', template: 'Booking Confirmation', channel: 'email', status: 'delivered', sentAt: '2024-12-05T14:15:00' },
  { id: '3', recipient: 'Maria Santos', template: 'Class Reminder - 1 Hour', channel: 'push', status: 'delivered', sentAt: '2024-12-05T13:00:00' },
  { id: '4', recipient: 'John Peterson', template: 'Payment Receipt', channel: 'email', status: 'failed', sentAt: '2024-12-05T12:45:00' },
  { id: '5', recipient: 'Fatima Khalid', template: 'Kitchen Rental Reminder', channel: 'sms', status: 'delivered', sentAt: '2024-12-05T12:00:00' },
];

const stats = [
  { label: 'Sent Today', value: '234', icon: Send, color: 'from-violet-500 to-purple-600' },
  { label: 'Delivery Rate', value: '98.5%', icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
  { label: 'Active Templates', value: '12', icon: Bell, color: 'from-amber-500 to-orange-600' },
  { label: 'Scheduled', value: '8', icon: Clock, color: 'from-cyan-500 to-blue-600' },
];

export default function NotificationsPage() {
  const [tab, setTab] = useState<'templates' | 'history' | 'compose'>('templates');

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Smartphone className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-100 text-blue-700';
      case 'sms': return 'bg-green-100 text-green-700';
      case 'push': return 'bg-purple-100 text-purple-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-amber-100 text-amber-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Notifications</h1>
          <p className="text-stone-500 mt-1">Manage automated and manual notifications</p>
        </div>
        <Button onClick={() => setTab('compose')}>
          <Plus className="h-4 w-4 mr-2" />
          Send Notification
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
        {['templates', 'history', 'compose'].map((t) => (
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

      {tab === 'templates' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notification Templates</CardTitle>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Template</Button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Template</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Channel</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Trigger</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Timing</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Sent</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Status</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {notificationTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-stone-50 group">
                    <td className="px-6 py-4">
                      <p className="font-medium text-stone-900">{template.name}</p>
                      <p className="text-xs text-stone-500">{template.type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getChannelBadge(template.channel)} flex items-center gap-1 w-fit`}>
                        {getChannelIcon(template.channel)}
                        {template.channel.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-700">{template.trigger.replace('_', ' ')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-700">{template.timing}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-stone-900">{template.sent.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusBadge(template.status)}>
                        {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm"><Edit3 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Recipient</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Template</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Channel</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Sent At</th>
                  <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentNotifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-stone-900">{notification.recipient}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-700">{notification.template}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getChannelBadge(notification.channel)} flex items-center gap-1 w-fit`}>
                        {getChannelIcon(notification.channel)}
                        {notification.channel.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-700">{formatDate(notification.sentAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusBadge(notification.status)}>
                        {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Channel</label>
                <div className="flex gap-3">
                  {['email', 'sms', 'push'].map((channel) => (
                    <button
                      key={channel}
                      className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors"
                    >
                      {getChannelIcon(channel)}
                      {channel.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Recipients</label>
                <select className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm">
                  <option>All Users</option>
                  <option>All Members</option>
                  <option>Students with upcoming classes</option>
                  <option>Kitchen Renters</option>
                  <option>Custom Segment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="Enter subject line..."
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Message</label>
                <textarea
                  placeholder="Type your message..."
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm h-40 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-stone-50 rounded-xl border border-dashed border-stone-300 text-center">
                <Bell className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">Your notification preview will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
