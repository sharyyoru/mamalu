"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function CancelledContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-stone-900 mb-2">
              Payment Cancelled
            </h1>
            <p className="text-lg text-stone-600 mb-6">
              Your payment was cancelled. Your booking is still pending.
            </p>

            <div className="bg-amber-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                Don&apos;t worry - you can complete your payment at any time. Your spot is reserved for a limited time.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center mb-4">
              <Link href="/minichef">
                <Button variant="outline" className="font-bold">Mini Chef</Button>
              </Link>
              <Link href="/bigchef">
                <Button variant="outline" className="font-bold">Big Chef</Button>
              </Link>
              <Link href="/book/rentals">
                <Button variant="outline" className="font-bold">Rentals</Button>
              </Link>
            </div>

            <a 
              href="https://wa.me/971509475595" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF8C6B] hover:bg-[#ff7a54] text-white font-bold rounded-lg transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp Us
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BookingCancelledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    }>
      <CancelledContent />
    </Suspense>
  );
}
