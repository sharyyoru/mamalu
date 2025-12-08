"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  Search,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Reply,
  Archive,
  Star,
  StarOff,
  Trash2,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const mockInquiries = [
  {
    id: '1',
    name: 'Sarah Al Maktoum',
    email: 'sarah@email.com',
    phone: '+971 50 123 4567',
    subject: 'Corporate Cooking Event Inquiry',
    message: 'Hi, I\'m interested in organizing a team building cooking event for my company. We have about 30 employees and would like to know about your corporate packages. What dates do you have available in January?',
    status: 'new',
    priority: 'high',
    starred: true,
    source: 'website',
    createdAt: '2024-12-05T14:30:00',
    assignedTo: null,
  },
  {
    id: '2',
    name: 'Ahmed Hassan',
    email: 'ahmed@company.ae',
    phone: '+971 55 987 6543',
    subject: 'Kitchen Rental Pricing',
    message: 'Could you please send me the full pricing list for your kitchen rental services? I\'m starting a cloud kitchen and need a space for about 20 hours per week.',
    status: 'in_progress',
    priority: 'medium',
    starred: false,
    source: 'phone',
    createdAt: '2024-12-05T10:15:00',
    assignedTo: 'Wilson',
  },
  {
    id: '3',
    name: 'Maria Santos',
    email: 'maria@gmail.com',
    phone: '+971 52 456 7890',
    subject: 'Private Baking Class',
    message: 'I would like to book a private baking class for my daughter\'s birthday. There will be 8 kids aged 10-12. Do you offer kids\' programs?',
    status: 'resolved',
    priority: 'low',
    starred: false,
    source: 'email',
    createdAt: '2024-12-04T16:45:00',
    assignedTo: 'Carlo',
  },
  {
    id: '4',
    name: 'John Peterson',
    email: 'john@hotel.com',
    phone: '+971 54 321 0987',
    subject: 'Partnership Opportunity',
    message: 'We\'re a 5-star hotel looking to partner with cooking schools for our guests\' experiences. Would you be interested in discussing a partnership?',
    status: 'new',
    priority: 'high',
    starred: true,
    source: 'website',
    createdAt: '2024-12-05T09:00:00',
    assignedTo: null,
  },
  {
    id: '5',
    name: 'Fatima Khalid',
    email: 'fatima@startup.io',
    phone: '+971 56 789 0123',
    subject: 'Gift Cards',
    message: 'Do you sell gift cards? I want to purchase cooking class vouchers as corporate gifts for my clients.',
    status: 'in_progress',
    priority: 'medium',
    starred: false,
    source: 'whatsapp',
    createdAt: '2024-12-04T11:30:00',
    assignedTo: 'Wilson',
  },
];

const stats = [
  { label: 'New', value: 12, color: 'bg-blue-500' },
  { label: 'In Progress', value: 8, color: 'bg-amber-500' },
  { label: 'Resolved', value: 45, color: 'bg-green-500' },
  { label: 'Avg Response', value: '2.4h', color: 'bg-violet-500' },
];

export default function InquiriesPage() {
  const [selectedInquiry, setSelectedInquiry] = useState<string | null>(mockInquiries[0].id);
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-stone-100 text-stone-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const selected = mockInquiries.find(i => i.id === selectedInquiry);
  const filteredInquiries = statusFilter === 'all' 
    ? mockInquiries 
    : mockInquiries.filter(i => i.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Inquiries</h1>
          <p className="text-stone-500 mt-1">Manage customer questions and requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center text-white font-bold text-lg`}>
                {typeof stat.value === 'number' ? stat.value : stat.value}
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
                <p className="text-sm text-stone-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inbox List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search inquiries..."
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg text-sm"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm"
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                onClick={() => setSelectedInquiry(inquiry.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedInquiry === inquiry.id 
                    ? 'bg-amber-50 border-2 border-amber-200' 
                    : 'bg-white border border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-medium text-sm">
                      {inquiry.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-stone-900 text-sm">{inquiry.name}</p>
                      <p className="text-xs text-stone-500">{formatDate(inquiry.createdAt)}</p>
                    </div>
                  </div>
                  {inquiry.starred && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                </div>
                <p className="font-medium text-stone-800 text-sm mb-1">{inquiry.subject}</p>
                <p className="text-xs text-stone-500 line-clamp-2">{inquiry.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${getStatusBadge(inquiry.status)} text-xs`}>
                    {inquiry.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={`${getPriorityBadge(inquiry.priority)} text-xs`}>
                    {inquiry.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail View */}
        <Card className="lg:col-span-2">
          {selected ? (
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">{selected.subject}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-stone-500">
                    <span className="flex items-center gap-1"><User className="h-4 w-4" /> {selected.name}</span>
                    <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {selected.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {selected.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    {selected.starred ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <StarOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm"><Archive className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <Badge className={getStatusBadge(selected.status)}>
                  {selected.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityBadge(selected.priority)}>
                  {selected.priority} priority
                </Badge>
                <span className="text-sm text-stone-500">
                  via {selected.source} • {formatDate(selected.createdAt)}
                </span>
                {selected.assignedTo && (
                  <span className="text-sm text-stone-500">• Assigned to {selected.assignedTo}</span>
                )}
              </div>

              <div className="p-4 bg-stone-50 rounded-xl mb-6">
                <p className="text-stone-700 leading-relaxed">{selected.message}</p>
              </div>

              <div className="border-t border-stone-200 pt-6">
                <h3 className="font-medium text-stone-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply via Email
                  </Button>
                  <Button variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Customer
                  </Button>
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <select className="px-4 py-2 border border-stone-200 rounded-lg text-sm">
                    <option>Change Status</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <select className="px-4 py-2 border border-stone-200 rounded-lg text-sm">
                    <option>Assign To</option>
                    <option value="wilson">Wilson</option>
                    <option value="carlo">Carlo</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-6 mt-6">
                <h3 className="font-medium text-stone-900 mb-4">Reply</h3>
                <textarea
                  placeholder="Type your reply..."
                  className="w-full p-4 border border-stone-200 rounded-xl text-sm resize-none h-32"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline">Save Draft</Button>
                  <Button>Send Reply</Button>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">Select an inquiry to view details</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
