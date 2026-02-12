"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Plus, Minus, ShoppingCart, Users, Clock, ChefHat, Loader2, CalendarDays } from "lucide-react";

interface MenuPackage {
  id: string;
  name: string;
  items: string[];
  price: number;
  emoji: string;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
  category: "food" | "merch";
}

const menuPackages: MenuPackage[] = [
  {
    id: "texas-roadhouse",
    name: "Texas Roadhouse",
    items: ["Baked BBQ wings", "Skillet Mac & Cheese", "Mississippi mud pie"],
    price: 275,
    emoji: "🍕"
  },
  {
    id: "little-italy",
    name: "Little Italy",
    items: ["Pasta from scratch", "Pomodoro sauce", "Margherita pizza", "Fudgy brownies"],
    price: 250,
    emoji: "🍝"
  },
  {
    id: "funtastic",
    name: "Funtastic",
    items: ["Mixed Berry babka", "Cheesy pizza bomb", "Chocolate chip marble cookies"],
    price: 180,
    emoji: "🧁"
  },
  {
    id: "kung-fu-panda",
    name: "Kung fu Panda",
    items: ["California sushi rolls", "Chicken yakitori skewer", "Veggie stir-fried noodles", "Chocolate custard tart"],
    price: 275,
    emoji: "🍜"
  },
  {
    id: "cupcake-masterclass",
    name: "Cupcake Masterclass",
    items: ["Choose between: Vanilla, chocolate or red velvet cupcakes", "Learn piping skills and decorate to match the season"],
    price: 275,
    emoji: "🧁"
  },
  {
    id: "dream-diner",
    name: "Dream Diner",
    items: ["Mini cheesy garlic monkey bread", "Alfredo chicken lasagna rolls", "Oreo Sprinkle skillet cookie"],
    price: 200,
    emoji: "🥤"
  },
  {
    id: "hola-amigos",
    name: "Hola Amigos",
    items: ["Cheese and mushroom quesadillas", "Pulled chicken tacos", "Churros with chocolate sauce"],
    price: 250,
    emoji: "🌮"
  },
  {
    id: "healthylicious",
    name: "Healthylicious",
    items: ["Parmesan baked chicken tenders", "Sweet potato fries", "Double chocolate zucchini muffins"],
    price: 225,
    emoji: "🥦"
  },
  {
    id: "dumpling-masterclass",
    name: "Dumpling Masterclass",
    items: ["Pan fried mushroom dumplings", "Steamed chicken dumplings", "Chocolate dumplings"],
    price: 225,
    emoji: "🥟"
  },
  {
    id: "pretzel-masterclass",
    name: "Pretzel Masterclass",
    items: ["Pepperoni pizza pretzel", "Garlic and herb pretzel", "Cinnamon sugar pretzel"],
    price: 180,
    emoji: "🥨"
  },
  {
    id: "mama-mia",
    name: "Mama Mia",
    items: ["Bow tie pasta from scratch", "Creamy pink sauce", "Baked chicken milanese", "Chocolate chip biscotti"],
    price: 250,
    emoji: "🍝"
  },
  {
    id: "cookie-masterclass",
    name: "Cookie masterclass",
    items: ["Herb and cheddar cookies", "Funfetti Cookies", "Brownie crinkle cookies"],
    price: 275,
    emoji: "🍪"
  }
];

const foodAddOns: AddOn[] = [
  { id: "mini-pizzas", name: "Mini Pizzas", price: 50, unit: "12 pieces", category: "food" },
  { id: "chicken-tenders", name: "Chicken Tenders", price: 60, unit: "12 pieces", category: "food" },
  { id: "mini-burgers", name: "Mini Burgers", price: 70, unit: "6 pieces", category: "food" },
  { id: "musakhan-rolls", name: "Musakhan Rolls", price: 50, unit: "12 pieces", category: "food" },
  { id: "soft-drinks", name: "Soft Drinks", price: 15, unit: "per pc", category: "food" },
  { id: "juice", name: "Juice", price: 8, unit: "per pc", category: "food" }
];

const merchAddOns: AddOn[] = [
  { id: "custom-apron", name: "Custom Apron (with name)", price: 80, unit: "per piece", category: "merch" },
  { id: "chef-hat", name: "Chef Hat (with name)", price: 50, unit: "per piece", category: "merch" },
  { id: "custom-mug", name: "Custom Mug (any design)", price: 45, unit: "per mug", category: "merch" },
  { id: "custom-spatula", name: "Custom Spatula", price: 50, unit: "per spatula", category: "merch" },
  { id: "cupcake-goodie-bag", name: "Cupcake Goodie Bags", price: 80, unit: "per bag", category: "merch" },
  { id: "pancake-goodie-bag", name: "Pancake Goodie Bags", price: 80, unit: "per bag", category: "merch" },
  { id: "cookie-kit", name: "Cookie Kits", price: 70, unit: "per bag", category: "merch" }
];

export default function KidsBookingPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [addOns, setAddOns] = useState<{ [key: string]: number }>({});
  const [numberOfKids, setNumberOfKids] = useState(6);
  
  // Booking form state
  const [ageRange, setAgeRange] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [allTimeSlots, setAllTimeSlots] = useState<{ start: string; end: string; duration: number; label: string }[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ start: string; end: string; duration: number; label: string }[]>([]);
  const [blockedTimeSlots, setBlockedTimeSlots] = useState<{ start: string; end: string; duration: number; label: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Fetch time slots when date changes
  useEffect(() => {
    if (!eventDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await fetch(`/api/services/availability?date=${eventDate}`);
        if (res.ok) {
          const data = await res.json();
          setAllTimeSlots(data.allSlots || []);
          setAvailableTimeSlots(data.availableSlots || []);
          setBlockedTimeSlots(data.blockedSlots || []);
        }
      } catch (error) {
        console.error("Failed to fetch slots:", error);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
    setEventTime("");
  }, [eventDate]);

  const handleBookingSubmit = async () => {
    if (!selectedPackage || !customerName || !customerEmail || !ageRange || !waiverAccepted) {
      alert("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const pkg = menuPackages.find(p => p.id === selectedPackage);
      const baseAmount = (pkg?.price || 0) * numberOfKids;
      const extrasData = Object.entries(addOns).map(([id, quantity]) => {
        const addOn = [...foodAddOns, ...merchAddOns].find(a => a.id === id);
        return addOn ? { id, name: addOn.name, price: addOn.price, quantity } : null;
      }).filter(Boolean);
      const extrasAmount = extrasData.reduce((sum, e: any) => sum + (e.price * e.quantity), 0);
      const totalAmount = baseAmount + extrasAmount;
      const depositAmount = Math.ceil(totalAmount * 0.5);

      const res = await fetch("/api/services/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: "birthday_deck",
          serviceName: `Kids Birthday - ${pkg?.name}`,
          packageName: pkg?.name,
          menuName: pkg?.name,
          menuPrice: pkg?.price,
          customerName,
          customerEmail,
          customerPhone,
          eventDate: eventDate || null,
          eventTime: eventTime || null,
          guestCount: numberOfKids,
          extras: extrasData,
          baseAmount,
          extrasAmount,
          totalAmount,
          isDepositPayment: true,
          depositAmount,
          balanceAmount: totalAmount - depositAmount,
          specialRequests,
          ageRange,
          waiverAccepted,
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

  const handleAddOnChange = (id: string, increment: boolean) => {
    setAddOns(prev => {
      const current = prev[id] || 0;
      const newValue = increment ? current + 1 : Math.max(0, current - 1);
      if (newValue === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newValue };
    });
  };

  const calculateTotal = () => {
    let total = 0;
    
    if (selectedPackage) {
      const pkg = menuPackages.find(p => p.id === selectedPackage);
      if (pkg) {
        total += pkg.price * numberOfKids;
      }
    }

    Object.entries(addOns).forEach(([id, quantity]) => {
      const addOn = [...foodAddOns, ...merchAddOns].find(a => a.id === id);
      if (addOn) {
        total += addOn.price * quantity;
      }
    });

    return total;
  };

  const selectedPkg = selectedPackage ? menuPackages.find(p => p.id === selectedPackage) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/classes" className="flex items-center gap-2 text-stone-600 hover:text-[#ff8c6b] transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Classes</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm text-stone-500">Total</div>
                <div className="text-2xl font-bold text-[#ff8c6b]">{calculateTotal()} AED</div>
              </div>
              <Button className="gradient-peach-glow text-white rounded-full px-6">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass-peach text-[#ff8c6b] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <ChefHat className="h-4 w-4" />
              Kids Birthday Party
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
              Where little chefs make big memories!
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
              Customise your birthday cooking party with your friends and family
            </p>

            {/* Quick Info */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                <Users className="h-4 w-4 text-[#ff8c6b]" />
                <span className="text-stone-700">Minimum: 6 | Maximum: 35</span>
              </div>
              <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#ff8c6b]" />
                <span className="text-stone-700">2 hour private birthday experience</span>
              </div>
              <div className="glass px-4 py-2 rounded-full flex items-center gap-2">
                <Check className="h-4 w-4 text-[#ff8c6b]" />
                <span className="text-stone-700">Starting at 180 AED per person</span>
              </div>
            </div>
          </div>

          {/* Number of Kids Selector */}
          <div className="max-w-md mx-auto mb-12">
            <div className="glass-card rounded-2xl p-6">
              <label className="text-sm font-semibold text-stone-700 mb-3 block">
                Number of Kids
              </label>
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 border-[#ff8c6b] hover:bg-[#ff8c6b] hover:text-white"
                  onClick={() => setNumberOfKids(Math.max(6, numberOfKids - 1))}
                  disabled={numberOfKids <= 6}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="text-center flex-1">
                  <div className="text-4xl font-bold text-[#ff8c6b]">{numberOfKids}</div>
                  <div className="text-sm text-stone-500">kids</div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 border-[#ff8c6b] hover:bg-[#ff8c6b] hover:text-white"
                  onClick={() => setNumberOfKids(Math.min(35, numberOfKids + 1))}
                  disabled={numberOfKids >= 35}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Menu Packages */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-3 text-center">
              🍴 Choose Your Menu Package
            </h2>
            <p className="text-stone-600 text-center mb-8 max-w-2xl mx-auto">
              Can't decide on what you want to make? We've got you covered. Below are our most popular celebration menus for kids
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuPackages.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`glass-card rounded-2xl p-6 text-left transition-all card-hover ${
                      isSelected ? "ring-4 ring-[#ff8c6b] ring-offset-2" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-5xl">{pkg.emoji}</div>
                      {isSelected && (
                        <div className="bg-[#ff8c6b] text-white rounded-full p-1.5">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 mb-3">{pkg.name}</h3>
                    <ul className="space-y-2 mb-4">
                      {pkg.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-stone-600 flex items-start gap-2">
                          <span className="text-[#ff8c6b] mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t border-stone-100">
                      <div className="text-sm text-stone-500">Price per person</div>
                      <div className="text-2xl font-bold text-[#ff8c6b]">{pkg.price} AED</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add-ons Section */}
          {selectedPackage && (
            <div className="space-y-12">
              {/* Food Add-ons */}
              <div>
                <h2 className="text-3xl font-bold text-stone-900 mb-3 text-center">
                  🍔 Additional Snack & Drink Options
                </h2>
                <p className="text-stone-600 text-center mb-8">
                  Want extra snacks at your party, we got you!!
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {foodAddOns.map((addOn) => {
                    const quantity = addOns[addOn.id] || 0;
                    return (
                      <div key={addOn.id} className="glass-card rounded-2xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-stone-900 mb-1">{addOn.name}</h4>
                            <p className="text-sm text-stone-500">{addOn.unit}</p>
                            <p className="text-lg font-bold text-[#ff8c6b] mt-2">
                              {addOn.price} AED
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-4">
                          {quantity === 0 ? (
                            <Button
                              onClick={() => handleAddOnChange(addOn.id, true)}
                              className="w-full gradient-peach-glow text-white rounded-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add
                            </Button>
                          ) : (
                            <div className="flex items-center gap-3 w-full">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-2 border-[#ff8c6b]"
                                onClick={() => handleAddOnChange(addOn.id, false)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <div className="flex-1 text-center font-bold text-lg text-[#ff8c6b]">
                                {quantity}
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-2 border-[#ff8c6b]"
                                onClick={() => handleAddOnChange(addOn.id, true)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Merch Add-ons */}
              <div>
                <h2 className="text-3xl font-bold text-stone-900 mb-3 text-center">
                  🎁 Pimp Your Party with Merch!
                </h2>
                <p className="text-stone-600 text-center mb-8">
                  Customized chef hats, aprons, and more!
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {merchAddOns.map((addOn) => {
                    const quantity = addOns[addOn.id] || 0;
                    return (
                      <div key={addOn.id} className="glass-card rounded-2xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-stone-900 mb-1">{addOn.name}</h4>
                            <p className="text-sm text-stone-500">{addOn.unit}</p>
                            <p className="text-lg font-bold text-[#ff8c6b] mt-2">
                              {addOn.price} AED
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-4">
                          {quantity === 0 ? (
                            <Button
                              onClick={() => handleAddOnChange(addOn.id, true)}
                              className="w-full gradient-peach-glow text-white rounded-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add
                            </Button>
                          ) : (
                            <div className="flex items-center gap-3 w-full">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-2 border-[#ff8c6b]"
                                onClick={() => handleAddOnChange(addOn.id, false)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <div className="flex-1 text-center font-bold text-lg text-[#ff8c6b]">
                                {quantity}
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-2 border-[#ff8c6b]"
                                onClick={() => handleAddOnChange(addOn.id, true)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Summary Card */}
          {selectedPackage && (
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="glass-card rounded-3xl p-8 glow-peach-sm">
                <h3 className="text-2xl font-bold text-stone-900 mb-6">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-stone-900">{selectedPkg?.name}</div>
                      <div className="text-sm text-stone-500">{numberOfKids} kids × {selectedPkg?.price} AED</div>
                    </div>
                    <div className="font-bold text-[#ff8c6b]">
                      {selectedPkg && (selectedPkg.price * numberOfKids).toFixed(0)} AED
                    </div>
                  </div>

                  {Object.entries(addOns).length > 0 && (
                    <>
                      <div className="border-t border-stone-200 pt-4">
                        <div className="text-sm font-semibold text-stone-700 mb-3">Add-ons</div>
                        {Object.entries(addOns).map(([id, quantity]) => {
                          const addOn = [...foodAddOns, ...merchAddOns].find(a => a.id === id);
                          if (!addOn) return null;
                          return (
                            <div key={id} className="flex justify-between items-center text-sm mb-2">
                              <div className="text-stone-600">
                                {addOn.name} × {quantity}
                              </div>
                              <div className="font-semibold text-stone-900">
                                {(addOn.price * quantity).toFixed(0)} AED
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div className="border-t border-stone-200 pt-4 flex justify-between items-center">
                    <div className="text-xl font-bold text-stone-900">Total</div>
                    <div className="text-3xl font-bold text-[#ff8c6b]">{calculateTotal()} AED</div>
                  </div>
                </div>

                <Button 
                  className="w-full mt-6 gradient-peach-glow text-white rounded-full py-6 text-lg"
                  onClick={() => setShowBookingForm(true)}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Proceed to Booking
                </Button>

                <p className="text-xs text-stone-500 text-center mt-4">
                  A 50% deposit is required to secure your booking, with the remaining 50% due 48 hours before the class.
                </p>
              </div>
            </div>
          )}

          {/* Booking Details Form */}
          {showBookingForm && selectedPackage && (
            <div className="mt-12 max-w-2xl mx-auto space-y-6">
              <div className="glass-card rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                  <CalendarDays className="h-6 w-6 text-[#ff8c6b]" />
                  Booking Details
                </h3>

                {/* Age Range */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-stone-700 mb-3">
                    Age Range of Children *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["3-6", "7-10", "11-13"].map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setAgeRange(range)}
                        className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                          ageRange === range
                            ? "bg-[#ff8c6b] text-white shadow-lg"
                            : "glass text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        {range} years
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8c6b]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Preferred Time
                      {loadingSlots && <span className="ml-2 text-xs text-stone-400">(Loading...)</span>}
                    </label>
                    {!eventDate ? (
                      <p className="text-sm text-stone-500 py-3">Select a date first</p>
                    ) : loadingSlots ? (
                      <div className="flex items-center gap-2 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                        <span className="text-sm text-stone-500">Checking availability...</span>
                      </div>
                    ) : availableTimeSlots.length === 0 ? (
                      <p className="text-sm text-amber-600 py-3">No available time slots. Try another date.</p>
                    ) : (
                      <div className="space-y-2">
                        {allTimeSlots.map((slot) => {
                          const isAvailable = availableTimeSlots.some(s => s.start === slot.start);
                          const isSelected = eventTime === slot.start;
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => setEventTime(slot.start)}
                              className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all text-left ${
                                isSelected
                                  ? "bg-[#ff8c6b] text-white"
                                  : isAvailable
                                    ? "glass text-stone-700 hover:bg-stone-100"
                                    : "bg-stone-50 text-stone-300 cursor-not-allowed line-through"
                              }`}
                            >
                              {slot.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-lg font-semibold text-stone-900">Your Details</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8c6b]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8c6b]"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+971 50 123 4567"
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8c6b]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1">Special Requests</label>
                      <input
                        type="text"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Allergies, dietary needs..."
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff8c6b]"
                      />
                    </div>
                  </div>
                </div>

                {/* Waiver */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waiverAccepted}
                      onChange={(e) => setWaiverAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-[#ff8c6b] focus:ring-[#ff8c6b]"
                    />
                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        I accept the Liability Waiver *
                      </p>
                      <p className="text-xs text-stone-600 mt-1">
                        By checking this box, I acknowledge and accept the terms of the Mamalu Kitchen liability waiver. 
                        I understand that cooking activities involve inherent risks including but not limited to burns, 
                        cuts, and allergic reactions. I agree to release Mamalu Kitchen from any liability.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  className="w-full gradient-peach-glow text-white rounded-full py-6 text-lg"
                  onClick={handleBookingSubmit}
                  disabled={submitting || !customerName || !customerEmail || !ageRange || !waiverAccepted}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Pay 50% Deposit ({Math.ceil(calculateTotal() * 0.5)} AED)
                    </>
                  )}
                </Button>

                <p className="text-xs text-stone-500 text-center mt-4">
                  50% deposit secures your booking. Balance of {Math.ceil(calculateTotal() * 0.5)} AED due 48 hours before event.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
