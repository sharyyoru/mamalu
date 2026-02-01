"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Users,
  Star,
  Crown,
  FileText,
  Calendar,
  Minus,
  Plus,
  ShoppingCart,
  Loader2,
} from "lucide-react";

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  price_per_person: number;
  min_guests: number;
  max_guests: number;
  duration_minutes: number;
  includes: string[];
  is_popular: boolean;
}

interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_popular: boolean;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  service_type: string;
  description: string;
  menu_pdf_url: string;
  base_price: number;
  min_guests: number;
  max_guests: number;
  duration_minutes: number;
  features: string[];
  packages: ServicePackage[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function ServiceBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  
  // Booking state
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchService();
  }, [slug]);

  const fetchService = async () => {
    try {
      const res = await fetch(`/api/services/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setService(data.service);
        setMenuItems(data.menuItems || []);
        
        // Auto-select popular package
        const popular = data.service?.packages?.find((p: ServicePackage) => p.is_popular);
        if (popular) {
          setSelectedPackage(popular);
          setGuestCount(popular.min_guests || 1);
        }
      }
    } catch (error) {
      console.error("Failed to fetch service:", error);
    } finally {
      setLoading(false);
    }
  };

  const isWalkin = service?.service_type === "walkin_menu";

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const getCartQuantity = (itemId: string) => {
    return cart.find((i) => i.id === itemId)?.quantity || 0;
  };

  const calculateTotal = () => {
    if (isWalkin) {
      return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
    
    if (!selectedPackage) return 0;
    
    // If price_per_person is set, calculate based on guests
    if (selectedPackage.price_per_person) {
      return selectedPackage.price_per_person * guestCount;
    }
    
    return selectedPackage.price;
  };

  const handleSubmit = async () => {
    if (!service) return;
    
    setSubmitting(true);
    try {
      const totalAmount = calculateTotal();
      
      const res = await fetch("/api/services/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          packageId: selectedPackage?.id,
          serviceType: service.service_type,
          serviceName: service.name,
          packageName: selectedPackage?.name,
          customerName,
          customerEmail,
          customerPhone,
          companyName,
          eventDate: eventDate || null,
          eventTime: eventTime || null,
          guestCount,
          items: isWalkin ? cart : [],
          baseAmount: totalAmount,
          totalAmount,
          specialRequests,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    return `${minutes} mins`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Service not found</h1>
        <Button asChild>
          <Link href="/book">Back to Services</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/book">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-stone-900">{service.name}</h1>
                <p className="text-sm text-stone-500">
                  {isWalkin ? "Order from our menu" : "Book your experience"}
                </p>
              </div>
            </div>
            {service.menu_pdf_url && (
              <a
                href={service.menu_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
              >
                <FileText className="h-4 w-4" />
                View Full Menu
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step Indicator */}
            {!isWalkin && (
              <div className="flex items-center gap-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        step >= s
                          ? "bg-stone-900 text-white"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {step > s ? <Check className="h-4 w-4" /> : s}
                    </div>
                    <span className={`text-sm ${step >= s ? "text-stone-900" : "text-stone-400"}`}>
                      {s === 1 ? "Package" : s === 2 ? "Details" : "Confirm"}
                    </span>
                    {s < 3 && <div className="w-8 h-0.5 bg-stone-200" />}
                  </div>
                ))}
              </div>
            )}

            {/* Step 1: Package Selection (Non-walkin) */}
            {!isWalkin && step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-stone-900">Select Your Package</h2>
                
                <div className="grid gap-4">
                  {service.packages?.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={`cursor-pointer transition-all ${
                        selectedPackage?.id === pkg.id
                          ? "ring-2 ring-stone-900 shadow-lg"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setGuestCount(pkg.min_guests || 1);
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-stone-900">{pkg.name}</h3>
                              {pkg.is_popular && (
                                <Badge className="bg-amber-100 text-amber-700 border-0">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-stone-600 mt-1">{pkg.description}</p>
                            
                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-stone-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDuration(pkg.duration_minutes)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {pkg.min_guests}-{pkg.max_guests} guests
                              </span>
                            </div>

                            {pkg.includes && pkg.includes.length > 0 && (
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                {(pkg.includes as string[]).map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm text-stone-600">
                                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-stone-900">
                              AED {pkg.price.toLocaleString()}
                            </div>
                            {pkg.price_per_person && (
                              <div className="text-sm text-stone-500">
                                AED {pkg.price_per_person}/person
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedPackage && (
                  <div className="flex justify-end">
                    <Button
                      size="lg"
                      className="bg-stone-900 hover:bg-stone-800"
                      onClick={() => setStep(2)}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Event Details (Non-walkin) */}
            {!isWalkin && step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-stone-900">Event Details</h2>
                
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {/* Guest Count */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Number of Guests
                      </label>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setGuestCount(Math.max(selectedPackage?.min_guests || 1, guestCount - 1))}
                          disabled={guestCount <= (selectedPackage?.min_guests || 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-2xl font-bold w-12 text-center">{guestCount}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setGuestCount(Math.min(selectedPackage?.max_guests || 50, guestCount + 1))}
                          disabled={guestCount >= (selectedPackage?.max_guests || 50)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-stone-500">
                          (Min: {selectedPackage?.min_guests}, Max: {selectedPackage?.max_guests})
                        </span>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Preferred Date
                        </label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Preferred Time
                        </label>
                        <select
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                        >
                          <option value="">Select time</option>
                          <option value="09:00">9:00 AM</option>
                          <option value="10:00">10:00 AM</option>
                          <option value="11:00">11:00 AM</option>
                          <option value="12:00">12:00 PM</option>
                          <option value="13:00">1:00 PM</option>
                          <option value="14:00">2:00 PM</option>
                          <option value="15:00">3:00 PM</option>
                          <option value="16:00">4:00 PM</option>
                          <option value="17:00">5:00 PM</option>
                        </select>
                      </div>
                    </div>

                    {/* Special Requests */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Special Requests (Optional)
                      </label>
                      <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Dietary requirements, allergies, theme preferences..."
                        rows={3}
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="bg-stone-900 hover:bg-stone-800"
                    onClick={() => setStep(3)}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Contact Details (Non-walkin) */}
            {!isWalkin && step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-stone-900">Your Details</h2>
                
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+971 XX XXX XXXX"
                          className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          required
                        />
                      </div>
                      {service.service_type === "corporate_deck" && (
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-2">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Your company"
                            className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="bg-stone-900 hover:bg-stone-800"
                    onClick={handleSubmit}
                    disabled={!customerName || !customerEmail || !customerPhone || submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Payment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Walk-in Menu */}
            {isWalkin && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-stone-900">Our Menu</h2>
                
                {/* Group items by category */}
                {["appetizer", "main", "dessert", "drink"].map((category) => {
                  const items = menuItems.filter((item) => item.category === category);
                  if (items.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h3 className="text-lg font-bold text-stone-900 capitalize mb-4">
                        {category === "main" ? "Main Courses" : `${category}s`}
                      </h3>
                      <div className="grid gap-4">
                        {items.map((item) => (
                          <Card key={item.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-stone-900">{item.name}</h4>
                                    {item.is_popular && (
                                      <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                                        <Star className="h-3 w-3 mr-1 fill-current" />
                                        Popular
                                      </Badge>
                                    )}
                                    {item.is_vegetarian && (
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                        V
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-stone-500 mt-1">{item.description}</p>
                                </div>
                                <div className="flex items-center gap-4 ml-4">
                                  <span className="font-bold text-stone-900">
                                    AED {item.price}
                                  </span>
                                  {getCartQuantity(item.id) > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        onClick={() => removeFromCart(item.id)}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="w-6 text-center font-bold">
                                        {getCartQuantity(item.id)}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        onClick={() => addToCart(item)}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => addToCart(item)}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Customer Details for Walk-in */}
                {cart.length > 0 && (
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-bold text-stone-900">Your Details</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Full Name *"
                          className="px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          required
                        />
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="Email *"
                          className="px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                          required
                        />
                      </div>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Phone (Optional)"
                        className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-stone-900 mb-4">Order Summary</h3>
                  
                  {!isWalkin && selectedPackage && (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-stone-600">{selectedPackage.name}</span>
                        <span className="font-medium">AED {selectedPackage.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">Guests</span>
                        <span className="font-medium">{guestCount}</span>
                      </div>
                      {eventDate && (
                        <div className="flex justify-between">
                          <span className="text-stone-600">Date</span>
                          <span className="font-medium">{new Date(eventDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {eventTime && (
                        <div className="flex justify-between">
                          <span className="text-stone-600">Time</span>
                          <span className="font-medium">{eventTime}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isWalkin && cart.length > 0 && (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-stone-600">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium">
                            AED {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(selectedPackage || cart.length > 0) && (
                    <>
                      <div className="border-t border-stone-200 my-4" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>AED {calculateTotal().toLocaleString()}</span>
                      </div>

                      {isWalkin && (
                        <Button
                          className="w-full mt-4 bg-stone-900 hover:bg-stone-800"
                          size="lg"
                          onClick={handleSubmit}
                          disabled={!customerName || !customerEmail || submitting}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Checkout
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}

                  {!selectedPackage && !isWalkin && (
                    <p className="text-stone-500 text-sm">Select a package to continue</p>
                  )}

                  {isWalkin && cart.length === 0 && (
                    <p className="text-stone-500 text-sm">Add items to your order</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
