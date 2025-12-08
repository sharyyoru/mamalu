"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  CalendarDays, 
  Plus, 
  Search, 
  Filter,
  Clock,
  Users,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit3,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

interface ClassData {
  _id: string;
  title: string;
  slug: string;
  classType: string;
  numberOfSessions: number;
  sessionDuration: number;
  pricePerSession: number;
  fullPrice: number;
  startDate: string;
  spotsAvailable: number;
  maxSpots: number;
  location: string;
  featured: boolean;
  active: boolean;
  instructor?: {
    _id: string;
    name: string;
    title: string;
    supabaseUserId: string;
    image: string;
  };
  image: string;
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    revenue: number;
  };
}

interface Stats {
  totalClasses: number;
  activeClasses: number;
  totalBookings: number;
  confirmedBookings: number;
}

export default function ClassesPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/classes');
      if (!res.ok) throw new Error('Failed to fetch classes');
      const data = await res.json();
      setClasses(data.classes || []);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const getClassStatus = (cls: ClassData) => {
    if (!cls.active) return 'inactive';
    const now = new Date();
    const startDate = cls.startDate ? new Date(cls.startDate) : null;
    if (!startDate) return 'draft';
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const classDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    if (classDay.getTime() === today.getTime()) return 'today';
    if (cls.spotsAvailable === 0) return 'full';
    if (startDate < now) return 'past';
    return 'upcoming';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'today': return 'bg-green-100 text-green-700';
      case 'upcoming': return 'bg-blue-100 text-blue-700';
      case 'full': return 'bg-amber-100 text-amber-700';
      case 'past': return 'bg-stone-100 text-stone-600';
      case 'inactive': return 'bg-red-100 text-red-700';
      case 'draft': return 'bg-purple-100 text-purple-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const filteredClasses = classes.filter(cls => 
    cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.instructor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { label: 'Total Classes', value: stats?.totalClasses || 0, icon: CalendarDays, color: 'from-violet-500 to-purple-600' },
    { label: 'Active Classes', value: stats?.activeClasses || 0, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
    { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: Users, color: 'from-amber-500 to-orange-600' },
    { label: 'Confirmed', value: stats?.confirmedBookings || 0, icon: DollarSign, color: 'from-cyan-500 to-blue-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Classes</h1>
          <p className="text-stone-500 mt-1">Manage cooking classes and schedules</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchClasses}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/studio/structure/cookingClass" target="_blank">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Class
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-700">
            <AlertCircle className="h-5 w-5 inline mr-2" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search classes or instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <select className="px-4 py-2 border border-stone-200 rounded-lg text-sm">
              <option>All Types</option>
              <option value="in-person">In-Person</option>
              <option value="online">Online</option>
              <option value="private">Private</option>
              <option value="corporate">Corporate</option>
            </select>
            <select className="px-4 py-2 border border-stone-200 rounded-lg text-sm">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Classes List */}
      <Card>
        <CardContent className="p-0">
          {filteredClasses.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays className="h-12 w-12 text-stone-300 mx-auto mb-4" />
              <h3 className="font-semibold text-stone-900 mb-2">No classes found</h3>
              <p className="text-stone-500 mb-4">
                {classes.length === 0 
                  ? "Create your first class in Sanity Studio"
                  : "Try adjusting your search"}
              </p>
              <Link href="/studio/structure/cookingClass" target="_blank">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Class in Sanity
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Class</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Schedule</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Instructor</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Bookings</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Price</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredClasses.map((cls) => {
                    const status = getClassStatus(cls);
                    const enrolled = (cls.maxSpots || 0) - (cls.spotsAvailable || 0);
                    const capacity = cls.maxSpots || 12;
                    
                    return (
                      <tr key={cls._id} className="hover:bg-stone-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {cls.image && (
                              <div className="h-12 w-12 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                                <Image 
                                  src={cls.image} 
                                  alt={cls.title} 
                                  width={48} 
                                  height={48}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-stone-900">{cls.title}</p>
                              <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {cls.classType || 'in-person'}
                                </Badge>
                                {cls.location && (
                                  <>
                                    <MapPin className="h-3 w-3" />
                                    {cls.location}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-stone-900">
                              {cls.startDate ? formatDate(cls.startDate) : 'Not scheduled'}
                            </p>
                            <p className="text-sm text-stone-500">
                              {cls.numberOfSessions} session{cls.numberOfSessions > 1 ? 's' : ''} × {cls.sessionDuration}h
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {cls.instructor ? (
                            <div className="flex items-center gap-2">
                              {cls.instructor.image ? (
                                <Image 
                                  src={cls.instructor.image}
                                  alt={cls.instructor.name}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium text-sm">
                                  {cls.instructor.name?.charAt(0)}
                                </div>
                              )}
                              <div>
                                <span className="text-sm text-stone-700">{cls.instructor.name}</span>
                                {cls.instructor.title && (
                                  <p className="text-xs text-stone-400">{cls.instructor.title}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-stone-400">No instructor</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-stone-100 rounded-full max-w-[100px]">
                              <div 
                                className="h-full bg-amber-500 rounded-full" 
                                style={{ width: `${Math.min((enrolled / capacity) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-stone-600">{enrolled}/{capacity}</span>
                          </div>
                          {cls.bookings.pending > 0 && (
                            <p className="text-xs text-amber-600 mt-1">{cls.bookings.pending} pending</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-stone-900">{formatPrice(cls.fullPrice)}</p>
                          <p className="text-xs text-stone-500">{formatPrice(cls.pricePerSession)}/session</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusBadge(status)}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                          {cls.featured && (
                            <Badge className="bg-amber-100 text-amber-700 ml-1">Featured</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/classes/${cls._id}`}>
                              <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            </Link>
                            <Link href={`/studio/structure/cookingClass;${cls._id}`} target="_blank">
                              <Button variant="ghost" size="sm"><Edit3 className="h-4 w-4" /></Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
