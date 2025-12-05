"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Lock, ArrowRight } from "lucide-react";

type AuthMode = "login" | "register";

export default function AccountPage() {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <div className="py-20 bg-stone-50 min-h-[70vh]">
      <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="text-center">
            <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <User className="h-7 w-7 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <p className="text-stone-600 text-sm mt-2">
              {mode === "login"
                ? "Sign in to access your orders and bookings"
                : "Join Mamalu Kitchen for exclusive benefits"}
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input placeholder="John Doe" className="pl-10" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
              {mode === "login" && (
                <div className="text-right">
                  <a
                    href="#"
                    className="text-sm text-amber-600 hover:text-amber-700"
                  >
                    Forgot password?
                  </a>
                </div>
              )}
              <Button type="submit" className="w-full">
                {mode === "login" ? "Sign In" : "Create Account"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-stone-600">
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  onClick={() =>
                    setMode(mode === "login" ? "register" : "login")
                  }
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
