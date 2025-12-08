"use client";

import { useState } from "react";
import { 
  Settings, 
  Building2,
  CreditCard,
  Bell,
  Mail,
  Shield,
  Users,
  Globe,
  Palette,
  Database,
  Key,
  Save,
  Upload,
  ChefHat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const settingsSections = [
  { id: 'business', name: 'Business Info', icon: Building2 },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'team', name: 'Team', icon: Users },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'integrations', name: 'Integrations', icon: Database },
];

const teamMembers = [
  { id: '1', name: 'Wilson Admin', email: 'wilson@mutant.ae', role: 'super_admin', status: 'active' },
  { id: '2', name: 'Carlo Nickson', email: 'carlo@mutant.ae', role: 'admin', status: 'active' },
  { id: '3', name: 'Chef Ahmad', email: 'ahmad@mamalukitchen.com', role: 'instructor', status: 'active' },
  { id: '4', name: 'Sara Mohammed', email: 'sara@mamalukitchen.com', role: 'staff', status: 'active' },
];

const integrations = [
  { name: 'Stripe', description: 'Payment processing', status: 'connected', icon: '💳' },
  { name: 'Supabase', description: 'Database & Auth', status: 'connected', icon: '🔒' },
  { name: 'Sanity', description: 'Content Management', status: 'connected', icon: '📝' },
  { name: 'Mailchimp', description: 'Email Marketing', status: 'not_connected', icon: '📧' },
  { name: 'WhatsApp Business', description: 'Messaging', status: 'connected', icon: '💬' },
  { name: 'QuickBooks', description: 'Accounting', status: 'not_connected', icon: '📊' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('business');

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-700';
      case 'admin': return 'bg-orange-100 text-orange-700';
      case 'instructor': return 'bg-green-100 text-green-700';
      case 'staff': return 'bg-blue-100 text-blue-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Settings</h1>
        <p className="text-stone-500 mt-1">Manage your workspace and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {section.name}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'business' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>Update your business details and branding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-2xl bg-amber-100 flex items-center justify-center">
                      <ChefHat className="h-12 w-12 text-amber-600" />
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                      <p className="text-xs text-stone-500 mt-2">PNG, JPG up to 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Business Name</label>
                      <input type="text" defaultValue="Mamalu Kitchen" className="w-full px-4 py-2 border border-stone-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Contact Email</label>
                      <input type="email" defaultValue="hello@mamalukitchen.com" className="w-full px-4 py-2 border border-stone-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Phone</label>
                      <input type="tel" defaultValue="+971 4 XXX XXXX" className="w-full px-4 py-2 border border-stone-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Website</label>
                      <input type="url" defaultValue="https://mamalukitchen.com" className="w-full px-4 py-2 border border-stone-200 rounded-lg" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Address</label>
                    <textarea defaultValue="Al Quoz Industrial Area 3, Dubai, UAE" className="w-full px-4 py-2 border border-stone-200 rounded-lg h-20" />
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operating Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                        <span className="font-medium text-stone-700">{day}</span>
                        <div className="flex items-center gap-2">
                          <input type="time" defaultValue="09:00" className="px-2 py-1 border border-stone-200 rounded text-sm" />
                          <span className="text-stone-400">-</span>
                          <input type="time" defaultValue="22:00" className="px-2 py-1 border border-stone-200 rounded text-sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === 'payments' && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure payment methods and pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">💳</div>
                  <div className="flex-1">
                    <p className="font-medium text-stone-900">Stripe Connected</p>
                    <p className="text-sm text-stone-500">Account: Mamalu Kitchen LLC</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Default Currency</label>
                  <select className="w-full px-4 py-2 border border-stone-200 rounded-lg">
                    <option>AED - UAE Dirham</option>
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-stone-700">Payment Methods</label>
                  {['Credit/Debit Cards', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Cash'].map((method) => (
                    <div key={method} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <span className="text-stone-700">{method}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-stone-200 peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'team' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your team and permissions</CardDescription>
                </div>
                <Button size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{member.name}</p>
                          <p className="text-sm text-stone-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getRoleBadge(member.role)}>
                          {member.role.replace('_', ' ')}
                        </Badge>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <div>
                      <p className="font-medium text-stone-900">Two-Factor Authentication</p>
                      <p className="text-sm text-stone-500">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <div>
                      <p className="font-medium text-stone-900">Session Timeout</p>
                      <p className="text-sm text-stone-500">Auto-logout after inactivity</p>
                    </div>
                    <select className="px-4 py-2 border border-stone-200 rounded-lg text-sm">
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>4 hours</option>
                      <option>Never</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <div>
                      <p className="font-medium text-stone-900">API Keys</p>
                      <p className="text-sm text-stone-500">Manage API access tokens</p>
                    </div>
                    <Button variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'integrations' && (
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connect third-party services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrations.map((integration) => (
                    <div key={integration.name} className="p-4 border border-stone-200 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.icon}</span>
                          <div>
                            <p className="font-medium text-stone-900">{integration.name}</p>
                            <p className="text-sm text-stone-500">{integration.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={integration.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-700'}>
                          {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          {integration.status === 'connected' ? 'Manage' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'New bookings', description: 'Get notified when a new booking is made' },
                  { label: 'Cancellations', description: 'Get notified when a booking is cancelled' },
                  { label: 'New inquiries', description: 'Get notified about new customer inquiries' },
                  { label: 'Low inventory', description: 'Get notified when product stock is low' },
                  { label: 'Payment received', description: 'Get notified when payments are received' },
                  { label: 'Daily summary', description: 'Receive a daily summary email' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <div>
                      <p className="font-medium text-stone-900">{item.label}</p>
                      <p className="text-sm text-stone-500">{item.description}</p>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" defaultChecked className="rounded" />
                        Email
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" defaultChecked className="rounded" />
                        Push
                      </label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
