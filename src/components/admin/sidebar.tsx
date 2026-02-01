"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UtensilsCrossed,
  Building2,
  ShoppingBag,
  CreditCard,
  Bell,
  BarChart3,
  Settings,
  ChefHat,
  Warehouse,
  MessageSquare,
  Tags,
  UserPlus,
  Ticket,
  FileText,
  Link as LinkIcon,
  Phone,
  ScanLine,
  ClipboardList,
  PieChart,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface AdminSidebarProps {
  userRole: string;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users & CRM", href: "/admin/users", icon: Users },
  { name: "Leads", href: "/admin/leads", icon: UserPlus },
  { name: "Classes", href: "/admin/classes", icon: CalendarDays, children: [
    { name: "Schedule", href: "/admin/classes" },
    { name: "Class Types", href: "/admin/classes/types" },
    { name: "Course Series", href: "/admin/classes/series" },
    { name: "Instructors", href: "/admin/classes/instructors" },
  ]},
  { name: "Kitchen Rental", href: "/admin/rentals", icon: Warehouse, children: [
    { name: "Bookings", href: "/admin/rentals" },
    { name: "Assets", href: "/admin/rentals/assets" },
    { name: "Shifts", href: "/admin/rentals/shifts" },
    { name: "Maintenance", href: "/admin/rentals/maintenance" },
  ]},
  { name: "Bookings", href: "/admin/bookings", icon: Ticket },
  { name: "Event Scanner", href: "/admin/scanner", icon: ScanLine },
  { name: "Attendees", href: "/admin/attendees", icon: ClipboardList },
  { name: "Invoices", href: "/admin/invoices", icon: FileText },
  { name: "Payment Links", href: "/admin/payment-links", icon: LinkIcon },
  { name: "Payment Extras", href: "/admin/payment-extras", icon: DollarSign },
  { name: "WhatsApp Monitor", href: "/admin/whatsapp", icon: Phone, superAdminOnly: true },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Memberships", href: "/admin/memberships", icon: CreditCard },
  { name: "Marketing", href: "/admin/marketing", icon: Tags, children: [
    { name: "Campaigns", href: "/admin/marketing" },
    { name: "Discounts", href: "/admin/marketing/discounts" },
    { name: "Referrals", href: "/admin/marketing/referrals" },
  ]},
  { name: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Sales Report", href: "/admin/sales", icon: TrendingUp },
  { name: "Reports", href: "/admin/reports", icon: PieChart },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    if (item.superAdminOnly && userRole !== 'super_admin') {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-64 bg-stone-900 text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-stone-800">
        <Link href="/admin" className="flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-amber-500" />
          <div>
            <span className="font-bold text-lg">Mamalu</span>
            <span className="text-xs text-stone-400 block -mt-1">Admin Portal</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
        <ul className="space-y-1 px-3">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            // Dashboard gets white highlight, others get amber
            const isDashboard = item.href === "/admin" && pathname === "/admin";
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? isDashboard 
                        ? "bg-white text-stone-900 shadow-lg"
                        : "bg-amber-600 text-white"
                      : "text-stone-300 hover:bg-stone-800 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
                {item.children && isActive && (
                  <ul className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.name}>
                        <Link
                          href={child.href}
                          className={cn(
                            "block px-3 py-1.5 rounded text-sm transition-colors",
                            pathname === child.href
                              ? "text-amber-400"
                              : "text-stone-400 hover:text-white"
                          )}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

    </aside>
  );
}
