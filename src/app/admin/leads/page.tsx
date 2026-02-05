"use client";

import { useState, useEffect, useRef } from "react";
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
  Trash2,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  X,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";

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

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  lead_type: string | null;
  source: string;
  status: string;
  interests: string[] | null;
  budget_range: string | null;
  notes: string | null;
  assigned_to: string | null;
  last_contacted_at: string | null;
  created_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ imported: number; errors: string[] | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch leads from API
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leads?limit=500');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Calculate stats
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const wonLeads = leads.filter(l => l.status === 'won').length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Source breakdown
  const sourceStats = leadSources.map(source => ({
    ...source,
    count: leads.filter(l => l.source === source.id).length,
  }));

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = selectedSource === 'all' || lead.source === selectedSource;
    const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
    return matchesSearch && matchesSource && matchesStatus;
  });

  // Handle Excel file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Send to API
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: jsonData, clearExisting: false }),
      });

      const result = await res.json();
      if (res.ok) {
        setUploadResult({ imported: result.imported, errors: result.errors });
        fetchLeads();
      } else {
        setUploadResult({ imported: 0, errors: [result.error] });
      }
    } catch (error: any) {
      setUploadResult({ imported: 0, errors: [error.message] });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clear all leads
  const clearAllLeads = async () => {
    if (!confirm('Are you sure you want to delete ALL leads? This cannot be undone.')) return;
    
    try {
      const res = await fetch('/api/leads/import', { method: 'DELETE' });
      if (res.ok) {
        fetchLeads();
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Failed to clear leads:', error);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      { name: 'John Doe', email: 'john@example.com', phone: '+971501234567', company: 'ABC Corp', source: 'website', status: 'new', notes: 'Interested in cooking class' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'leads_template.xlsx');
  };

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 p-6 text-white hover:shadow-xl hover:shadow-stone-900/20 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/10">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{totalLeads}</p>
            <p className="text-sm text-stone-400 mt-1">Total Leads</p>
          </div>
        </div>

        {/* New Leads */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white hover:shadow-xl hover:shadow-blue-600/20 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/20">
                <UserPlus className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{newLeads}</p>
            <p className="text-sm text-blue-200 mt-1">New Leads</p>
          </div>
        </div>

        {/* Won Leads */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white hover:shadow-xl hover:shadow-green-500/20 transition-all">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-white/20">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{wonLeads}</p>
            <p className="text-sm text-green-200 mt-1">Won / Converted</p>
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Import Leads */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-6">
            <Upload className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold">Import Leads</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-stone-400">
              Upload your customer data from Excel or CSV files.
            </p>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {uploading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : 'Upload Excel File'}
            </Button>

            <Button 
              onClick={downloadTemplate}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            {uploadResult && (
              <div className={`p-3 rounded-lg ${uploadResult.errors ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                <p className="text-sm">
                  {uploadResult.imported > 0 ? `✓ Imported ${uploadResult.imported} leads` : 'Import failed'}
                </p>
                {uploadResult.errors?.map((err, i) => (
                  <p key={i} className="text-xs text-red-300 mt-1">{err}</p>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-white/10">
              <Button 
                onClick={clearAllLeads}
                variant="ghost"
                size="sm"
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Leads
              </Button>
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
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Company</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Type</th>
                <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Status</th>
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
                          {lead.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{lead.name}</p>
                          <p className="text-sm text-stone-500">{lead.email || lead.phone || 'No contact'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getSourceColor(lead.source)} text-white text-sm`}>
                        <SourceIcon className="h-4 w-4" />
                        {leadSources.find(s => s.id === lead.source)?.name || lead.source}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-700 max-w-[200px] truncate">{lead.company || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-700">{lead.lead_type || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusBadge(lead.status)}>
                        {leadStatuses.find(s => s.id === lead.status)?.name || lead.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-stone-500">
                        <Clock className="h-4 w-4" />
                        {lead.last_contacted_at ? formatDate(lead.last_contacted_at) : 'Never'}
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
            const count = leads.filter(l => l.status === status.id).length;
            const width = totalLeads > 0 ? Math.max((count / totalLeads) * 100, 5) : 5;
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
