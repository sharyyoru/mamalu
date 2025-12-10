"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ChefHat, Mail, Lock, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured. Please check your environment variables.");
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // TEMPORARY: Allow wilson@mutant.ae direct access while debugging
      if (data.user.email === "wilson@mutant.ae") {
        console.log("Allowing wilson@mutant.ae direct admin access");
        // Use window.location for full page reload to ensure layout renders properly
        window.location.href = "/admin";
        return;
      }

      // Check if user has admin role using API (bypasses RLS)
      const response = await fetch("/api/auth/check-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id, email: data.user.email }),
      });

      const result = await response.json();
      console.log("Role check result:", result);

      if (!result.hasAdminAccess) {
        await supabase.auth.signOut();
        setError(`You do not have permission to access the admin portal. (Role: ${result.profile?.role || 'no profile'})`);
        setLoading(false);
        return;
      }

      // Use window.location for full page reload to ensure layout renders properly
      window.location.href = "/admin";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 to-stone-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
              <ChefHat className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Mamalu Kitchen</h1>
            <p className="text-stone-500 mt-1">Admin Portal</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mamalukitchen.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 z-10" />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-stone-200 text-center">
            <p className="text-xs text-stone-500">
              Powered by <span className="text-amber-600 font-medium">Mutant</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
