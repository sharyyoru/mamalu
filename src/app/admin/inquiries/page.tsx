"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MessageSquare, 
  Search,
  Mail,
  Phone,
  User,
  Reply,
  Archive,
  Star,
  StarOff,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  is_read: boolean;
  replied_at?: string;
  created_at: string;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchInquiries = useCallback(async () => {
    try {
      const res = await fetch("/api/inquiries");
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
        if (data.inquiries?.length > 0 && !selectedInquiry) {
          setSelectedInquiry(data.inquiries[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedInquiry]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const markAsRead = async (id: string) => {
    setUpdating(true);
    try {
      await fetch("/api/inquiries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_read: true }),
      });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    } finally {
      setUpdating(false);
    }
  };

  const markAsReplied = async (id: string) => {
    setUpdating(true);
    try {
      await fetch("/api/inquiries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_read: true, replied_at: new Date().toISOString() }),
      });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, is_read: true, replied_at: new Date().toISOString() } : i));
    } catch (error) {
      console.error("Failed to mark as replied:", error);
    } finally {
      setUpdating(false);
    }
  };

  const selectInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    if (!inquiry.is_read) {
      markAsRead(inquiry.id);
    }
  };

  const getStatusBadge = (inquiry: Inquiry) => {
    if (inquiry.replied_at) return { class: "bg-green-100 text-green-700", label: "Replied" };
    if (inquiry.is_read) return { class: "bg-amber-100 text-amber-700", label: "Read" };
    return { class: "bg-blue-100 text-blue-700", label: "New" };
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    // Status filter
    if (statusFilter === "new" && inquiry.is_read) return false;
    if (statusFilter === "read" && !inquiry.is_read) return false;
    if (statusFilter === "replied" && !inquiry.replied_at) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        inquiry.name.toLowerCase().includes(query) ||
        inquiry.email.toLowerCase().includes(query) ||
        inquiry.subject.toLowerCase().includes(query) ||
        inquiry.message.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: inquiries.length,
    new: inquiries.filter(i => !i.is_read).length,
    read: inquiries.filter(i => i.is_read && !i.replied_at).length,
    replied: inquiries.filter(i => i.replied_at).length,
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (diffHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

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
          <h1 className="text-3xl font-bold text-stone-900">Inquiries</h1>
          <p className="text-stone-500 mt-1">Manage customer questions and requests from the contact form</p>
        </div>
        <Button variant="outline" onClick={fetchInquiries}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-violet-500 flex items-center justify-center text-white font-bold text-lg">
              {stats.total}
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.total}</p>
              <p className="text-sm text-stone-500">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {stats.new}
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.new}</p>
              <p className="text-sm text-stone-500">New</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-lg">
              {stats.read}
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.read}</p>
              <p className="text-sm text-stone-500">Read</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center text-white font-bold text-lg">
              {stats.replied}
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.replied}</p>
              <p className="text-sm text-stone-500">Replied</p>
            </div>
          </CardContent>
        </Card>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredInquiries.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">No inquiries found</p>
              </div>
            ) : (
              filteredInquiries.map((inquiry) => {
                const status = getStatusBadge(inquiry);
                return (
                  <div
                    key={inquiry.id}
                    onClick={() => selectInquiry(inquiry)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedInquiry?.id === inquiry.id 
                        ? "bg-amber-50 border-2 border-amber-200" 
                        : inquiry.is_read 
                          ? "bg-white border border-stone-200 hover:border-stone-300"
                          : "bg-blue-50 border border-blue-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-medium text-sm ${
                          inquiry.is_read ? "bg-stone-100 text-stone-600" : "bg-blue-100 text-blue-600"
                        }`}>
                          {inquiry.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${inquiry.is_read ? "text-stone-900" : "text-blue-900"}`}>
                            {inquiry.name}
                          </p>
                          <p className="text-xs text-stone-500">{formatDate(inquiry.created_at)}</p>
                        </div>
                      </div>
                      {!inquiry.is_read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="font-medium text-stone-800 text-sm mb-1 line-clamp-1">{inquiry.subject}</p>
                    <p className="text-xs text-stone-500 line-clamp-2">{inquiry.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${status.class} text-xs`}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail View */}
        <Card className="lg:col-span-2">
          {selectedInquiry ? (
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">{selectedInquiry.subject}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-stone-500">
                    <span className="flex items-center gap-1"><User className="h-4 w-4" /> {selectedInquiry.name}</span>
                    <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {selectedInquiry.email}</span>
                    {selectedInquiry.phone && (
                      <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {selectedInquiry.phone}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <Badge className={getStatusBadge(selectedInquiry).class}>
                  {getStatusBadge(selectedInquiry).label}
                </Badge>
                <span className="text-sm text-stone-500">
                  {new Date(selectedInquiry.created_at).toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl mb-6">
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>

              <div className="border-t border-stone-200 pt-6">
                <h3 className="font-medium text-stone-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href={`mailto:${selectedInquiry.email}?subject=Re: ${selectedInquiry.subject}`}
                    onClick={() => markAsReplied(selectedInquiry.id)}
                  >
                    <Button>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply via Email
                    </Button>
                  </a>
                  {selectedInquiry.phone && (
                    <>
                      <a href={`tel:${selectedInquiry.phone}`}>
                        <Button variant="outline">
                          <Phone className="h-4 w-4 mr-2" />
                          Call Customer
                        </Button>
                      </a>
                      <a href={`https://wa.me/${selectedInquiry.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      </a>
                    </>
                  )}
                  {!selectedInquiry.replied_at && (
                    <Button 
                      variant="outline"
                      onClick={() => markAsReplied(selectedInquiry.id)}
                      disabled={updating}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Replied
                    </Button>
                  )}
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
