"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Loader2 } from "lucide-react";
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

            <div className="flex gap-3 justify-center">
              <Link href="/book">
                <Button variant="outline">Browse Classes</Button>
              </Link>
              {bookingId && (
                <Link href={`/account/bookings/${bookingId}`}>
                  <Button>Complete Payment</Button>
                </Link>
              )}
              {!bookingId && (
                <Link href="/account">
                  <Button>View My Bookings</Button>
                </Link>
              )}
            </div>
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
