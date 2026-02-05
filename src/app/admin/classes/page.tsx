"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CalendarDays, 
  Plus, 
  Search, 
  Clock,
  Users,
  DollarSign,
  Eye,
  Edit3,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Cake,
  ChefHat,
  Coffee,
  Baby,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

// Mamalu Schedule Time Slots
const MAMALU_TIME_SLOTS = [
  { start: "10:00", end: "12:30", label: "10:00 AM - 12:30 PM", days: [0, 1, 2, 3, 4, 5, 6] },
  { start: "13:30", end: "15:00", label: "1:30 PM - 3:00 PM", days: [0, 1, 2, 3, 4, 5, 6] },
  { start: "16:00", end: "17:30", label: "4:00 PM - 5:30 PM", days: [0, 1, 2, 3, 4, 5, 6] },
  { start: "18:30", end: "20:00", label: "6:30 PM - 8:00 PM", days: [0, 1, 2, 3, 4, 5, 6] },
  { start: "21:00", end: "22:30", label: "9:00 PM - 10:30 PM", days: [4, 5] },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  service_type: string;
  description: string;
  short_description: string;
  base_price: number;
  is_active: boolean;
  packages: ServicePackage[];
}

interface ServicePackage {
  id: string;
  name: string;
  price: number;
  price_per_person: number;
  min_guests: number;
  max_guests: number;
  duration_minutes: number;
}

interface ScheduledClass {
  id: string;
  service_id: string;
  service_name: string;
  service_type: string;
  date: string;
  time_slot: string;
  max_capacity: number;
  booked_count: number;
  is_active: boolean;
}

const categoryIcons: Record<string, any> = {
  birthday_deck: Cake,
  corporate_deck: Users,
  nanny_class: ChefHat,
  walkin_menu: Coffee,
  kids: Baby,
  adults: Users,
};

export default function ClassesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [showEditSlotsModal, setShowEditSlotsModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      setServices(data.services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.is_active).length,
    kidsServices: services.filter(s => s.category === 'kids').length,
    adultsServices: services.filter(s => s.category === 'adults').length,
  };

  const statCards = [
    { label: 'Total Services', value: stats.totalServices, icon: CalendarDays, color: 'from-violet-500 to-purple-600' },
    { label: 'Active Services', value: stats.activeServices, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
    { label: 'Kids Classes', value: stats.kidsServices, icon: Baby, color: 'from-pink-500 to-rose-600' },
    { label: 'Adults Classes', value: stats.adultsServices, icon: Users, color: 'from-indigo-500 to-purple-600' },
  ];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'kids': return 'bg-pink-100 text-pink-700';
      case 'adults': return 'bg-indigo-100 text-indigo-700';
      case 'walkin': return 'bg-amber-100 text-amber-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const getServiceTypeBadge = (type: string) => {
    switch (type) {
      case 'birthday_deck': return 'bg-pink-50 text-pink-600';
      case 'corporate_deck': return 'bg-blue-50 text-blue-600';
      case 'nanny_class': return 'bg-amber-50 text-amber-600';
      case 'walkin_menu': return 'bg-green-50 text-green-600';
      default: return 'bg-stone-50 text-stone-600';
    }
  };

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
          <h1 className="text-3xl font-bold text-stone-900">Classes & Services</h1>
          <p className="text-stone-500 mt-1">Manage cooking classes, birthday parties, and corporate events</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchServices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewClassModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Class
          </Button>
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
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <select 
              className="px-4 py-2 border border-stone-200 rounded-lg text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="kids">Kids</option>
              <option value="adults">Adults</option>
              <option value="walkin">Walk-in</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <Card>
        <CardContent className="p-0">
          {filteredServices.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays className="h-12 w-12 text-stone-300 mx-auto mb-4" />
              <h3 className="font-semibold text-stone-900 mb-2">No services found</h3>
              <p className="text-stone-500 mb-4">
                {services.length === 0 
                  ? "Add your first service to get started"
                  : "Try adjusting your search"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Service</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Category</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Packages</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Base Price</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Time Slots</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-stone-600 uppercase px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredServices.map((service) => {
                    const Icon = categoryIcons[service.service_type] || categoryIcons[service.category] || ChefHat;
                    const lowestPrice = service.packages?.length
                      ? Math.min(...service.packages.map(p => p.price))
                      : service.base_price;
                    
                    return (
                      <tr key={service.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-5 w-5 text-stone-600" />
                            </div>
                            <div>
                              <p className="font-medium text-stone-900">{service.name}</p>
                              <p className="text-sm text-stone-500 line-clamp-1">{service.short_description || service.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <Badge className={getCategoryBadge(service.category)}>
                              {service.category}
                            </Badge>
                            <Badge className={`${getServiceTypeBadge(service.service_type)} text-xs block w-fit`}>
                              {service.service_type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-stone-700">
                            {service.packages?.length || 0} package{(service.packages?.length || 0) !== 1 ? 's' : ''}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-stone-900">{formatPrice(lowestPrice)}</p>
                          {service.packages?.length > 0 && (
                            <p className="text-xs text-stone-500">starting from</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedService(service);
                              setShowEditSlotsModal(true);
                            }}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Edit Slots
                          </Button>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={service.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {service.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/book/${service.slug}`} target="_blank">
                              <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedService(service);
                              setShowEditSlotsModal(true);
                            }}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
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

      {/* New Class Modal */}
      {showNewClassModal && (
        <NewClassModal 
          services={services}
          onClose={() => setShowNewClassModal(false)}
          onSuccess={() => {
            setShowNewClassModal(false);
            fetchServices();
          }}
        />
      )}

      {/* Edit Time Slots Modal */}
      {showEditSlotsModal && selectedService && (
        <EditTimeSlotsModal
          service={selectedService}
          onClose={() => {
            setShowEditSlotsModal(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
}

// New Class Modal Component
function NewClassModal({ 
  services, 
  onClose, 
  onSuccess 
}: { 
  services: Service[]; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(12);
  const [saving, setSaving] = useState(false);

  const selectedService = services.find(s => s.id === selectedServiceId);
  
  // Get available time slots for selected date
  const getAvailableSlotsForDate = () => {
    if (!selectedDate) return [];
    const dateObj = new Date(selectedDate + "T00:00:00");
    const dayOfWeek = dateObj.getDay();
    return MAMALU_TIME_SLOTS.filter(slot => slot.days.includes(dayOfWeek));
  };

  const availableSlots = getAvailableSlotsForDate();

  const handleSubmit = async () => {
    if (!selectedServiceId || !selectedDate || !selectedTimeSlot) return;
    
    setSaving(true);
    try {
      // For now, just close the modal - actual API integration would go here
      onSuccess();
    } catch (err) {
      console.error('Failed to create class:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-stone-900">Schedule New Class</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Select Service
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Choose a service...</option>
              <optgroup label="Kids">
                {services.filter(s => s.category === 'kids').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
              <optgroup label="Adults">
                {services.filter(s => s.category === 'adults').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
              <optgroup label="Walk-in">
                {services.filter(s => s.category === 'walkin').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            </select>
            {selectedService && (
              <p className="mt-2 text-sm text-stone-500">{selectedService.short_description || selectedService.description}</p>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTimeSlot(''); // Reset time slot when date changes
              }}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Time Slot
              </label>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-amber-600">No time slots available for this day.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot.start)}
                      className={`py-3 px-4 rounded-lg text-sm font-medium transition-all text-left ${
                        selectedTimeSlot === slot.start
                          ? "bg-amber-500 text-white"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Max Capacity */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Max Capacity
            </label>
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 1)}
              min={1}
              max={50}
              className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t bg-stone-50">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedServiceId || !selectedDate || !selectedTimeSlot || saving}
            className="flex-1 bg-amber-500 hover:bg-amber-600"
          >
            {saving ? 'Creating...' : 'Create Class'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Edit Time Slots Modal Component
function EditTimeSlotsModal({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const [enabledSlots, setEnabledSlots] = useState<Record<string, boolean>>(() => {
    // Default all slots to enabled
    const slots: Record<string, boolean> = {};
    MAMALU_TIME_SLOTS.forEach(slot => {
      slots[slot.start] = true;
    });
    return slots;
  });

  const toggleSlot = (slotStart: string) => {
    setEnabledSlots(prev => ({
      ...prev,
      [slotStart]: !prev[slotStart]
    }));
  };

  const handleSave = async () => {
    // For now, just close - actual API integration would save slot preferences
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Edit Time Slots</h2>
            <p className="text-sm text-stone-500">{service.name}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-stone-600 mb-4">
            Select which time slots are available for this service. The 9pm slot is only available on Thursday and Friday.
          </p>
          
          <div className="space-y-3">
            {MAMALU_TIME_SLOTS.map((slot) => (
              <div
                key={slot.start}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  enabledSlots[slot.start] ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div>
                  <p className="font-medium text-stone-900">{slot.label}</p>
                  <p className="text-xs text-stone-500">
                    {slot.days.length === 7 
                      ? 'Available every day' 
                      : `Only ${slot.days.map(d => DAY_NAMES[d]).join(' & ')}`}
                  </p>
                </div>
                <button
                  onClick={() => toggleSlot(slot.start)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    enabledSlots[slot.start] ? 'bg-amber-500' : 'bg-stone-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    enabledSlots[slot.start] ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t bg-stone-50">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="flex-1 bg-amber-500 hover:bg-amber-600"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
