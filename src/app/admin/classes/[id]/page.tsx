"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft,
  Users,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  User,
  Edit3,
  ExternalLink,
  ChefHat,
  Send,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { sanityClient } from "@/lib/sanity/client";

interface InstructorData {
  id: string;
  name: string;
  title: string | null;
  image: string | null;
}

interface ClassDetail {
  _id: string;
  title: string;
  description: string;
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
  instructorId?: string;
  instructor?: InstructorData;
  image: string;
  whatYouLearn: string[];
  schedule: Array<{
    sessionNumber: number;
    title: string;
    description: string;
    date: string;
  }>;
}

interface Booking {
  id: string;
  booking_number: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  status: string;
  payment_type: string;
  sessions_booked: number;
  total_amount: number;
  paid_at: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    avatar_url: string;
    dietary_restrictions: string[];
    skill_level: string;
  };
}

interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  revenue: number;
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch class from Sanity
      const classResult = await sanityClient.fetch(`
        *[_type == "cookingClass" && _id == $id][0] {
          _id,
          title,
          description,
          classType,
          numberOfSessions,
          sessionDuration,
          pricePerSession,
          fullPrice,
          startDate,
          spotsAvailable,
          maxSpots,
          location,
          featured,
          active,
          whatYouLearn,
          schedule,
          instructorId,
          "image": mainImage.asset->url
        }
      `, { id });

      if (!classResult) {
        setError('Class not found');
        return;
      }

      // Fetch instructor data from database if instructorId exists
      let instructorData: InstructorData | null = null;
      if (classResult.instructorId) {
        try {
          const instructorRes = await fetch(`/api/admin/instructors`);
          if (instructorRes.ok) {
            const data = await instructorRes.json();
            const found = data.instructors?.find((i: { id: string }) => i.id === classResult.instructorId);
            if (found) {
              instructorData = {
                id: found.id,
                name: found.full_name,
                title: found.instructor_title,
                image: found.instructor_image_url || found.avatar_url,
              };
            }
          }
        } catch (e) {
          console.error('Failed to fetch instructor:', e);
        }
      }

      setClassData({
        ...classResult,
        instructor: instructorData || undefined,
      });

      // Fetch bookings
      const bookingsRes = await fetch(`/api/admin/classes/${id}/bookings`);
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings || []);
        setStats(bookingsData.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch class');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingBooking(bookingId);
    try {
      const res = await fetch(`/api/admin/classes/${id}/bookings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });

      if (res.ok) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Failed to update booking:', err);
    } finally {
      setUpdatingBooking(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'no_show': return 'bg-stone-100 text-stone-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="space-y-6">
        <Link href="/admin/classes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
        </Link>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700">{error || 'Class not found'}</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/admin/classes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-stone-900">{classData.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline">{classData.classType || 'in-person'}</Badge>
              <Badge className={classData.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                {classData.active ? 'Active' : 'Inactive'}
              </Badge>
              {classData.featured && <Badge className="bg-amber-100 text-amber-700">Featured</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href={`/studio/structure/cookingClass;${classData._id}`} target="_blank">
            <Button>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit in Sanity
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-100">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats?.total || 0}</p>
              <p className="text-sm text-stone-500">Total Bookings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats?.confirmed || 0}</p>
              <p className="text-sm text-stone-500">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats?.pending || 0}</p>
              <p className="text-sm text-stone-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{formatPrice(stats?.revenue || 0)}</p>
              <p className="text-sm text-stone-500">Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-100">
              <Calendar className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{classData.spotsAvailable || 0}</p>
              <p className="text-sm text-stone-500">Spots Left</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Details */}
        <Card>
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classData.image && (
              <div className="rounded-xl overflow-hidden">
                <Image 
                  src={classData.image} 
                  alt={classData.title} 
                  width={400} 
                  height={200}
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-stone-400" />
                <span>{classData.startDate ? formatDate(classData.startDate) : 'Not scheduled'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-stone-400" />
                <span>{classData.numberOfSessions} sessions × {classData.sessionDuration}h</span>
              </div>
              {classData.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-stone-400" />
                  <span>{classData.location}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="h-4 w-4 text-stone-400" />
                <span>{formatPrice(classData.fullPrice)} total ({formatPrice(classData.pricePerSession)}/session)</span>
              </div>
            </div>

            {classData.instructor && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-stone-500 mb-2">Instructor</p>
                <div className="flex items-center gap-3">
                  {classData.instructor.image ? (
                    <Image 
                      src={classData.instructor.image}
                      alt={classData.instructor.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <ChefHat className="h-5 w-5 text-amber-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-stone-900">{classData.instructor.name}</p>
                    {classData.instructor.title && (
                      <p className="text-sm text-stone-500">{classData.instructor.title}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {classData.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-stone-600">{classData.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bookings ({bookings.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bookings.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <h3 className="font-semibold text-stone-900 mb-2">No bookings yet</h3>
                <p className="text-stone-500">Bookings will appear here when students enroll</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-4 hover:bg-stone-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium">
                          {booking.attendee_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{booking.attendee_name}</p>
                          <div className="flex items-center gap-3 text-sm text-stone-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {booking.attendee_email}
                            </span>
                            {booking.attendee_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {booking.attendee_phone}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusBadge(booking.status)}>
                              {booking.status}
                            </Badge>
                            <span className="text-xs text-stone-400">
                              {booking.booking_number} • {formatDate(booking.created_at)}
                            </span>
                          </div>
                          {booking.user?.dietary_restrictions && booking.user.dietary_restrictions.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {booking.user?.dietary_restrictions?.map((d, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-stone-900">{formatPrice(booking.total_amount)}</p>
                        <p className="text-xs text-stone-500">
                          {booking.sessions_booked} session{booking.sessions_booked > 1 ? 's' : ''} • {booking.payment_type}
                        </p>
                        {booking.paid_at ? (
                          <Badge className="bg-green-100 text-green-700 mt-1">Paid</Badge>
                        ) : (
                          <div className="space-y-1">
                            <Badge className="bg-red-100 text-red-700">Unpaid</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs w-full"
                              onClick={async () => {
                                setSendingInvoice(booking.id);
                                try {
                                  const res = await fetch('/api/invoices', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      bookingId: booking.id,
                                      customerName: booking.attendee_name,
                                      customerEmail: booking.attendee_email,
                                      customerPhone: booking.attendee_phone,
                                      amount: booking.total_amount,
                                      description: `Booking: ${classData?.title}`,
                                      sendImmediately: true,
                                    }),
                                  });
                                  if (res.ok) {
                                    const data = await res.json();
                                    alert(`Payment link sent!\n${data.paymentLink}`);
                                    fetchData();
                                  }
                                } catch (err) {
                                  console.error('Failed to send invoice:', err);
                                } finally {
                                  setSendingInvoice(null);
                                }
                              }}
                              disabled={sendingInvoice === booking.id}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send Payment Link
                            </Button>
                          </div>
                        )}
                        
                        {/* Status actions */}
                        {booking.status === 'pending' && (
                          <div className="flex gap-1 mt-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              disabled={updatingBooking === booking.id}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirm
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600"
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              disabled={updatingBooking === booking.id}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                        {booking.status === 'confirmed' && (
                          <div className="flex gap-1 mt-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                              disabled={updatingBooking === booking.id}
                            >
                              Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
