"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  ExternalLink,
} from "lucide-react";

interface AdminHeaderProps {
  user: {
    email: string;
    name: string;
    avatar?: string;
    role: string;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      router.push("/admin/login");
    }
  };

  const roleLabels: Record<string, string> = {
    staff: "Staff",
    admin: "Admin",
    super_admin: "Super Admin",
  };

  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search users, bookings, orders..."
            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* View site */}
        <Link
          href="/"
          target="_blank"
          className="text-sm text-stone-600 hover:text-amber-600 flex items-center gap-1"
        >
          View Site
          <ExternalLink className="h-3 w-3" />
        </Link>

        {/* Notifications */}
        <button className="relative p-2 text-stone-600 hover:bg-stone-100 rounded-lg">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 hover:bg-stone-100 rounded-lg"
          >
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <User className="h-4 w-4 text-amber-600" />
              )}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-stone-900">{user.name}</div>
              <div className="text-xs text-stone-500">{roleLabels[user.role] || user.role}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-stone-400" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-20">
                <div className="px-4 py-2 border-b border-stone-100">
                  <div className="text-sm font-medium text-stone-900">{user.name}</div>
                  <div className="text-xs text-stone-500">{user.email}</div>
                </div>
                <Link
                  href="/admin/settings/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <hr className="my-1" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
