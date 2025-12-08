"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  UserPlus,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Instagram,
  Facebook,
  Globe,
  MessageCircle,
  PhoneCall,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  BarChart3,
  PieChart,
  Sparkles,
  ChevronDown,
  Eye,
  Edit3,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

// Lead sources with icons
const leadSources = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-500' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-500 to-blue-600' },
  { id: 'website', name: 'Website', icon: Globe, color: 'from-emerald-500 to-teal-500' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'from-green-500 to-green-600' },
  { id: 'phone', name: 'Phone Call', icon: PhoneCall, color: 'from-amber-500 to-orange-500' },
  { id: 'walkin', name: 'Walk-in', icon: MapPin, color: 'from-violet-500 to-purple-500' },
  { id: 'referral', name: 'Referral', icon: Users, color: 'from-cyan-500 to-blue-500' },
];

// Lead statuses
const leadStatuses = [
  { id: 'new', name: 'New', color: 'bg-blue-500', bgLight: 'bg-blue-100 text-blue-700' },
  { id: 'contacted', name: 'Contacted', color: 'bg-amber-500', bgLight: 'bg-amber-100 text-amber-700' },
  { id: 'qualified', name: 'Qualified', color: 'bg-purple-500', bgLight: 'bg-purple-100 text-purple-700' },
  { id: 'proposal', name: 'Proposal', color: 'bg-cyan-500', bgLight: 'bg-cyan-100 text-cyan-700' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-500', bgLight: 'bg-orange-100 text-orange-700' },
  { id: 'won', name: 'Won', color: 'bg-green-500', bgLight: 'bg-green-100 text-green-700' },
  { id: 'lost', name: 'Lost', color: 'bg-red-500', bgLight: 'bg-red-100 text-red-700' },
];

// Mock leads data
const mockLeads = [
  { 
    id: '1', 
    name: 'Sarah Al Maktoum', 
    email: 'sarah@email.com', 
    phone: '+971 50 123 4567',
    source: 'instagram',
    status: 'qualified',
    value: 12500,
    interest: 'Corporate cooking class',
    assignedTo: 'Wilson',
    createdAt: '2024-12-05',
    lastContact: '2024-12-05',
    notes: 'Interested in team building event for 30 people'
  },
  { 
    id: '2', 
    name: 'Ahmed Hassan', 
    email: 'ahmed@company.ae', 
    phone: '+971 55 987 6543',
    source: 'website',
    status: 'proposal',
    value: 8500,
    interest: 'Kitchen rental - Monthly',
    assignedTo: 'Carlo',
    createdAt: '2024-12-04',
    lastContact: '2024-12-05',
    notes: 'Food truck business, needs regular kitchen access'
  },
  { 
    id: '3', 
    name: 'Maria Santos', 
    email: 'maria@gmail.com', 
    phone: '+971 52 456 7890',
    source: 'facebook',
    status: 'new',
    value: 2800,
    interest: 'Baking masterclass',
    assignedTo: null,
    createdAt: '2024-12-05',
    lastContact: null,
    notes: ''
  },
  { 
    id: '4', 
    name: 'John Peterson', 
    email: 'john.p@hotel.com', 
    phone: '+971 54 321 0987',
    source: 'referral',
    status: 'negotiation',
    value: 45000,
    interest: 'Hotel staff training program',
    assignedTo: 'Wilson',
    createdAt: '2024-12-01',
    lastContact: '2024-12-04',
    notes: '6-month training contract discussion'
  },
  { 
    id: '5', 
    name: 'Fatima Khalid', 
    email: 'fatima@startup.io', 
    phone: '+971 56 789 0123',
    source: 'whatsapp',
    status: 'contacted',
    value: 5200,
    interest: 'Private cooking class',
    assignedTo: 'Carlo',
    createdAt: '2024-12-03',
    lastContact: '2024-12-04',
    notes: 'Birthday party for 12 guests'
  },
  { 
    id: '6', 
    name: 'David Chen', 
    email: 'david@restaurant.ae', 
    phone: '+971 58 234 5678',
    source: 'phone',
    status: 'won',
    value: 18000,
    interest: 'Kitchen rental - 3 months',
    assignedTo: 'Wilson',
    createdAt: '2024-11-28',
    lastContact: '2024-12-02',
    notes: 'Contract signed!'
  },
  { 
    id: '7', 
    name: 'Lisa Wong', 
    email: 'lisa@email.com', 
    phone: '+971 50 876 5432',
    source: 'walkin',
    status: 'lost',
    value: 3500,
    interest: 'Weekend cooking class',
    assignedTo: 'Carlo',
    createdAt: '2024-11-25',
    lastContact: '2024-11-30',
    notes: 'Price too high, went to competitor'
  },
];

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');

  // Calculate stats
  const totalLeads = mockLeads.length;
  const totalValue = mockLeads.reduce((sum, lead) => sum + lead.value, 0);
  const wonValue = mockLeads.filter(l => l.status === 'won').reduce((sum, lead) => sum + lead.value, 0);
  const conversionRate = Math.round((mockLeads.filter(l => l.status === 'won').length / totalLeads) * 100);
  const avgDealValue = Math.round(totalValue / totalLeads);

  // Source breakdown
  const sourceStats = leadSources.map(source => ({
    ...source,
    count: mockLeads.filter(l => l.source === source.id).length,
    value: mockLeads.filter(l => l.source === source.id).reduce((sum, l) => sum + l.value, 0),
  }));

  // Filter leads
  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = selectedSource === 'all' || lead.source === selectedSource;
    const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
    return matchesSearch && matchesSource && matchesStatus;
  });

  const getSourceIcon = (sourceId: string) => {
    const source = leadSources.find(s => s.id === sourceId);
    return source ? source.icon : Globe;
  };

  const getSourceColor = (sourceId: string) => {
    const source = leadSources.find(s => s.id === sourceId);
    return source ? source.color : 'from-stone-500 to-stone-600';
  };

  const getStatusBadge = (statusId: string) => {
    const status = leadStatuses.find(s => s.id === statusId);
    return status ? status.bgLight : 'bg-stone-100 text-stone-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-stone-900 via-stone-700 to-stone-900 bg-clip-text text-transparent">
            Lead Management
          </h1>
          <p className="text-stone-500 mt-1">Track and convert your prospects into customers</p>
        </div>
        <Button className="bg-gradient-to-r from-stone-900 to-stone-700 hover:from-stone-800 hover:to-stone-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Stats Cards - Edgy Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 p-6 text-white hover:shadow-xl hover:shadow-stone-900/20 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/10">
                <Users className="h-5 w-5" />
              </div>
              <span className="flex items-center text-sm text-emerald-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +18%
              </span>
            </div>
            <p className="text-3xl font-bold">{totalLeads}</p>
            <p className="text-sm text-stone-400 mt-1">Total Leads</p>
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white hover:shadow-xl hover:shadow-emerald-600/20 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/20">
                <Target className="h-5 w-5" />
              </div>
              <span className="flex items-center text-sm text-emerald-200">
                <TrendingUp className="h-4 w-4 mr-1" />
                Pipeline
              </span>
            </div>
            <p className="text-3xl font-bold">{formatPrice(totalValue)}</p>
            <p className="text-sm text-emerald-200 mt-1">Total Pipeline</p>
          </div>
        </div>

        {/* Won Revenue */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white hover:shadow-xl hover:shadow-amber-500/20 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/20">
                <DollarSign className="h-5 w-5" />
              </div>
              <span className="flex items-center text-sm text-green-200">
                <CheckCircle className="h-4 w-4 mr-1" />
                Won
              </span>
            </div>
            <p className="text-3xl font-bold">{formatPrice(wonValue)}</p>
            <p className="text-sm text-amber-200 mt-1">Won Revenue</p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white hover:shadow-xl hover:shadow-violet-600/20 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/20">
                <Zap className="h-5 w-5" />
              </div>
              <span className="flex items-center text-sm text-violet-200">
                <Sparkles className="h-4 w-4 mr-1" />
                Rate
              </span>
            </div>
            <p className="text-3xl font-bold">{conversionRate}%</p>
            <p className="text-sm text-violet-200 mt-1">Conversion Rate</p>
          </div>
        </div>
      </div>

      {/* Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Sources Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-stone-900">Lead Sources</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Last 30 days</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sourceStats.slice(0, 8).map((source) => {
              const Icon = source.icon;
              return (
                <div key={source.id} className="group cursor-pointer">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${source.color} text-white transition-transform group-hover:scale-105`}>
                    <Icon className="h-6 w-6 mb-2" />
                    <p className="text-2xl font-bold">{source.count}</p>
                    <p className="text-sm opacity-80">{source.name}</p>
                  </div>
                  <p className="text-sm text-stone-500 mt-2 text-center">{formatPrice(source.value)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Calculator */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold">Revenue Calculator</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-white/10 rounded-xl">
              <p className="text-sm text-stone-400">Avg Deal Value</p>
              <p className="text-2xl font-bold text-amber-400">{formatPrice(avgDealValue)}</p>
            </div>
            
            <div className="p-4 bg-white/10 rounded-xl">
              <p className="text-sm text-stone-400">Potential Revenue</p>
              <p className="text-2xl font-bold text-emerald-400">{formatPrice(totalValue - wonValue)}</p>
              <p className="text-xs text-stone-500 mt-1">From active leads</p>
            </div>

            <div className="p-4 bg-white/10 rounded-xl">
              <p className="text-sm text-stone-400">Projected Monthly</p>
              <p className="text-2xl font-bold text-violet-400">{formatPrice(wonValue * 4)}</p>
              <p className="text-xs text-stone-500 mt-1">Based on current rate</p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-stone-400">Win Rate Target</span>
                <span className="text-amber-400">30%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  style={{ width: `${Math.min(conversionRate / 30 * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-stone-500 mt-1">{conversionRate}% current / 30% target</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search leads by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          
          <select 
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Sources</option>
            {leadSources.map(source => (
              <option key={source.id} value={source.id}>{source.name}</option>
            ))}
          </select>

          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            {leadStatuses.map(status => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button 
              variant={viewMode === 'kanban' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </Button>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Lead</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Source</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Interest</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Value</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Assigned</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Last Contact</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLeads.map((lead) => {
                const SourceIcon = getSourceIcon(lead.source);
                return (
                  <tr key={lead.id} className="hover:bg-stone-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{lead.name}</p>
                          <p className="text-sm text-stone-500">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getSourceColor(lead.source)} text-white text-sm`}>
                        <SourceIcon className="h-4 w-4" />
                        {leadSources.find(s => s.id === lead.source)?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-700 max-w-[200px] truncate">{lead.interest}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-stone-900">{formatPrice(lead.value)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusBadge(lead.status)}>
                        {leadStatuses.find(s => s.id === lead.status)?.name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium">
                            {lead.assignedTo.charAt(0)}
                          </div>
                          <span className="text-sm text-stone-600">{lead.assignedTo}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-stone-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-stone-500">
                        <Clock className="h-4 w-4" />
                        {lead.lastContact ? formatDate(lead.lastContact) : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No leads found</p>
            <p className="text-sm text-stone-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Pipeline Summary */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h3 className="font-semibold text-stone-900 mb-4">Pipeline Overview</h3>
        <div className="flex items-center gap-2">
          {leadStatuses.slice(0, -1).map((status, i) => {
            const count = mockLeads.filter(l => l.status === status.id).length;
            const width = Math.max((count / totalLeads) * 100, 5);
            return (
              <div key={status.id} className="flex-1" style={{ flex: width }}>
                <div className={`h-3 ${status.color} ${i === 0 ? 'rounded-l-full' : ''} ${i === leadStatuses.length - 2 ? 'rounded-r-full' : ''}`} />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-stone-500">{status.name}</span>
                  <span className="text-xs font-medium text-stone-700">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
