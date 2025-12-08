"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  CreditCard,
  User,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  ChefHat,
  Banknote,
  Upload,
  Receipt,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

interface ClassData {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  image: string | null;
  classType: string;
  numberOfSessions: number;
  sessionDuration: number;
  pricePerSession: number;
  fullPrice: number;
  startDate: string;
  spotsAvailable: number;
  maxSpots: number;
  location: string;
  instructor: {
    id: string;
    name: string;
    title: string | null;
    image: string | null;
  } | null;
}

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export default function BookingPage({ params }: BookingPageProps) {
  const { slug } = use(params);
  
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [paymentType, setPaymentType] = useState<'full' | 'per_session'>('full');
  const [sessionsToBook, setSessionsToBook] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dietaryRestrictions: '',
    notes: '',
  });

  useEffect(() => {
    async function fetchClass() {
      try {
        // Fetch class data from API
        const res = await fetch(`/api/classes/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Class not found');
          } else {
            throw new Error('Failed to fetch class');
          }
          return;
        }
        const data = await res.json();
        setClassData(data.class);
        setSessionsToBook(data.class.numberOfSessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchClass();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classData) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/bookings/class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classData._id,
          attendeeName: formData.name,
          attendeeEmail: formData.email,
          attendeePhone: formData.phone,
          paymentType,
          sessionsBooked: paymentType === 'full' ? classData.numberOfSessions : sessionsToBook,
          dietaryRestrictions: formData.dietaryRestrictions,
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Booking failed');
      }

      const data = await res.json();
      setBookingId(data.booking.id);
      
      if (paymentMethod === 'stripe') {
        // Create Stripe checkout session
        const checkoutRes = await fetch('/api/payments/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: data.booking.id,
          }),
        });
        
        if (!checkoutRes.ok) {
          throw new Error('Failed to create payment session');
        }
        
        const checkoutData = await checkoutRes.json();
        window.location.href = checkoutData.url;
      } else {
        // Cash payment - show receipt upload
        setShowReceiptUpload(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = paymentType === 'full' 
    ? classData?.fullPrice || 0 
    : (classData?.pricePerSession || 0) * sessionsToBook;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error && !classData) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-stone-900 mb-2">{error}</h2>
              <Link href="/classes">
                <Button variant="outline">Back to Classes</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleReceiptUpload = async () => {
    if (!receiptFile || !bookingId) return;
    
    setUploadingReceipt(true);
    setError(null);
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('bookingId', bookingId);
      formDataUpload.append('receipt', receiptFile);
      
      const res = await fetch('/api/payments/upload-receipt', {
        method: 'POST',
        body: formDataUpload,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload receipt');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingReceipt(false);
    }
  };

  if (showReceiptUpload && !success) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Receipt className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Upload Payment Receipt</h2>
                <p className="text-stone-600">
                  Please upload a photo or PDF of your cash payment receipt to confirm your booking.
                </p>
              </div>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="h-5 w-5 inline mr-2" />
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-stone-200 rounded-lg p-8 text-center hover:border-amber-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-stone-400 mx-auto mb-3" />
                    {receiptFile ? (
                      <p className="text-stone-900 font-medium">{receiptFile.name}</p>
                    ) : (
                      <>
                        <p className="text-stone-900 font-medium">Click to upload receipt</p>
                        <p className="text-sm text-stone-500 mt-1">JPEG, PNG, WebP or PDF (max 10MB)</p>
                      </>
                    )}
                  </label>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">Payment Details</h4>
                  <p className="text-sm text-amber-700">
                    Amount to pay: <strong>{formatPrice(totalAmount)}</strong>
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Your booking will be confirmed once our team verifies your receipt.
                  </p>
                </div>
                
                <Button
                  onClick={handleReceiptUpload}
                  className="w-full"
                  size="lg"
                  disabled={!receiptFile || uploadingReceipt}
                >
                  {uploadingReceipt ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Submit Receipt
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowReceiptUpload(false);
                    setPaymentMethod('stripe');
                  }}
                >
                  Pay with Card Instead
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-stone-900 mb-2">
                {paymentMethod === 'cash' ? 'Receipt Submitted!' : 'Booking Confirmed!'}
              </h2>
              <p className="text-stone-600 mb-6">
                {paymentMethod === 'cash' 
                  ? 'Thank you! Your receipt has been submitted and is pending verification. You will receive a confirmation email once approved.'
                  : 'Thank you for booking. You will receive a confirmation email shortly.'
                }
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/classes">
                  <Button variant="outline">Browse More Classes</Button>
                </Link>
                <Link href="/account">
                  <Button>View My Bookings</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!classData) return null;

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <Link href={`/classes/${slug}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Class Details
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-stone-900 mb-6">
                  Book: {classData.title}
                </h1>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-5 w-5 inline mr-2" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Payment Option */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-3">
                      Select Payment Option
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentType('full')}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          paymentType === 'full'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="font-semibold text-stone-900">Full Course</div>
                        <div className="text-sm text-stone-600">
                          All {classData.numberOfSessions} sessions
                        </div>
                        <div className="text-lg font-bold text-amber-600 mt-2">
                          {formatPrice(classData.fullPrice)}
                        </div>
                        {classData.pricePerSession * classData.numberOfSessions > classData.fullPrice && (
                          <Badge className="bg-green-100 text-green-700 mt-1 text-xs">
                            Save {formatPrice(classData.pricePerSession * classData.numberOfSessions - classData.fullPrice)}
                          </Badge>
                        )}
                      </button>
                      
                      {classData.numberOfSessions > 1 && (
                        <button
                          type="button"
                          onClick={() => setPaymentType('per_session')}
                          className={`p-4 rounded-lg border-2 text-left transition-colors ${
                            paymentType === 'per_session'
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="font-semibold text-stone-900">Per Session</div>
                          <div className="text-sm text-stone-600">Pay as you go</div>
                          <div className="text-lg font-bold text-stone-700 mt-2">
                            {formatPrice(classData.pricePerSession)}/session
                          </div>
                        </button>
                      )}
                    </div>

                    {paymentType === 'per_session' && classData.numberOfSessions > 1 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Number of Sessions
                        </label>
                        <select
                          value={sessionsToBook}
                          onChange={(e) => setSessionsToBook(Number(e.target.value))}
                          className="w-full p-3 border border-stone-200 rounded-lg"
                        >
                          {Array.from({ length: classData.numberOfSessions }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n} session{n > 1 ? 's' : ''} - {formatPrice(classData.pricePerSession * n)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-3">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          paymentMethod === 'stripe'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <CreditCard className="h-6 w-6 text-violet-600 mb-2" />
                        <div className="font-semibold text-stone-900">Card Payment</div>
                        <div className="text-sm text-stone-600">
                          Pay securely with Stripe
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          paymentMethod === 'cash'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <Banknote className="h-6 w-6 text-green-600 mb-2" />
                        <div className="font-semibold text-stone-900">Cash Payment</div>
                        <div className="text-sm text-stone-600">
                          Upload receipt after payment
                        </div>
                      </button>
                    </div>
                    
                    {paymentMethod === 'cash' && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>Cash Payment Instructions:</strong> After submitting this form, you&apos;ll be asked to upload a photo of your payment receipt. Your booking will be confirmed once our team verifies the payment.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-stone-900">Your Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="+971 XX XXX XXXX"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Dietary Restrictions
                      </label>
                      <input
                        type="text"
                        value={formData.dietaryRestrictions}
                        onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="e.g., Vegetarian, Gluten-free, Nut allergy"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 h-24"
                        placeholder="Any special requests or notes..."
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : paymentMethod === 'stripe' ? (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pay {formatPrice(totalAmount)} with Card
                      </>
                    ) : (
                      <>
                        <Banknote className="h-5 w-5 mr-2" />
                        Continue to Upload Receipt
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-stone-900 mb-4">Order Summary</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-stone-900">{classData.title}</h4>
                    <Badge className="mt-1">{classData.classType}</Badge>
                  </div>

                  <div className="text-sm text-stone-600 space-y-2">
                    {classData.startDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(classData.startDate)}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {paymentType === 'full' ? classData.numberOfSessions : sessionsToBook} session{(paymentType === 'full' ? classData.numberOfSessions : sessionsToBook) > 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {classData.spotsAvailable} spots left
                    </div>
                  </div>

                  {classData.instructor && (
                    <div className="flex items-center gap-3 pt-4 border-t">
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
                        <p className="text-sm font-medium">{classData.instructor.name}</p>
                        <p className="text-xs text-stone-500">{classData.instructor.title || 'Instructor'}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">
                        {paymentType === 'full' ? 'Full Course' : `${sessionsToBook} Session${sessionsToBook > 1 ? 's' : ''}`}
                      </span>
                      <span>{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-amber-600">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
