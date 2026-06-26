"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Gift, Loader2 } from "lucide-react";
import Link from "next/link";
import { openAccountWithAutoLogin } from "@/lib/account/auto-login-client";
import MamaluVoucher from "@/components/MamaluVoucher";
import type { PurchaseDetails } from "@/app/api/vouchers/purchase-details/route";

interface VoucherEmailData {
  toName: string;
  fromName: string;
  voucherCode: string;
  issueDate: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
}

function formatIssueDate(dateStr: string | null): string {
  if (!dateStr) return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

async function fetchPurchaseDetailsWithRetry(sessionId: string, maxAttempts = 6): Promise<PurchaseDetails | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(`/api/vouchers/purchase-details?session_id=${sessionId}`);
      if (!res.ok) continue;
      const data: PurchaseDetails = await res.json();
      if (data.voucher_code) return data;
    } catch {
      // Retry on fetch error
    }
  }
  return null;
}

export default function VoucherSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const isGift = searchParams.get("gift") === "1";
  const [status, setStatus] = useState<"loading" | "success" | "error">(sessionId ? "loading" : "error");
  const [openingAccount, setOpeningAccount] = useState(false);
  const [voucherEmailData, setVoucherEmailData] = useState<VoucherEmailData | null>(null);
  const emailSentRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    const t = setTimeout(() => setStatus("success"), 1200);
    return () => clearTimeout(t);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    fetchPurchaseDetailsWithRetry(sessionId).then((details) => {
      if (!details?.voucher_code) return;
      const deliveryName  = details.is_gift ? (details.recipient_name ?? details.customer_name) : details.customer_name;
      const deliveryEmail = details.is_gift ? (details.recipient_email ?? details.customer_email) : details.customer_email;
      setVoucherEmailData({
        toName:         deliveryName,
        fromName:       details.is_gift ? details.customer_name : "Mamalu Kitchen",
        voucherCode:    details.voucher_code,
        issueDate:      formatIssueDate(details.paid_at),
        recipientName:  deliveryName,
        recipientEmail: deliveryEmail ?? "",
        amount:         details.amount,
      });
    });
  }, [sessionId]);

  const handleGenerated = useCallback(
    async ({ front, terms }: { front: Blob; terms: Blob }) => {
      if (emailSentRef.current || !voucherEmailData || !sessionId) return;
      emailSentRef.current = true;
      try {
        const [frontImageBase64, termsImageBase64] = await Promise.all([
          blobToBase64(front),
          blobToBase64(terms),
        ]);
        await fetch("/api/send-voucher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            recipientName:    voucherEmailData.recipientName,
            recipientEmail:   voucherEmailData.recipientEmail,
            amount:           voucherEmailData.amount,
            voucherCode:      voucherEmailData.voucherCode,
            frontImageBase64,
            termsImageBase64,
          }),
        });
      } catch {
        // Non-fatal: the webhook's basic email is the fallback
      }
    },
    [voucherEmailData, sessionId],
  );

  return (
    <div className="min-h-screen bg-[#fff5eb] flex items-center justify-center p-6">
      {/* Hidden canvas renderer — silently generates blobs and triggers the canvas email */}
      {voucherEmailData && (
        <div className="sr-only" aria-hidden="true">
          <MamaluVoucher
            toName={voucherEmailData.toName}
            fromName={voucherEmailData.fromName}
            voucherCode={voucherEmailData.voucherCode}
            issueDate={voucherEmailData.issueDate}
            onGenerated={handleGenerated}
          />
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        {status === "loading" ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-[#ff7f5c] mx-auto mb-4" />
            <p className="text-stone-500">Confirming your purchase…</p>
          </>
        ) : status === "success" ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h1
              className="text-3xl font-bold text-stone-900 mb-3"
              style={{ fontFamily: "var(--font-mossy), cursive" }}
            >
              Payment Successful!
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-[#ff7f5c]" />
              <p className="text-stone-600 font-medium">
                {isGift ? "The gift card is on its way" : "Your gift card is on its way"}
              </p>
            </div>
            <p className="text-stone-500 text-sm mb-8">
              We&apos;ve sent the gift card code to {isGift ? "the recipient's" : "your"} email. It may take a few minutes to arrive — please also check the spam folder.
            </p>
            <div className="space-y-3">
              {!isGift && (
                <button
                  type="button"
                  disabled={openingAccount}
                  onClick={async () => {
                    setOpeningAccount(true);
                    await openAccountWithAutoLogin({
                      sessionId,
                      destination: "/account/vouchers",
                    });
                  }}
                  className="inline-block w-full py-3 rounded-2xl bg-[#ff7f5c] text-white font-bold hover:bg-[#ff6a42] transition-colors disabled:opacity-60"
                >
                  {openingAccount ? "Opening..." : "View My Vouchers"}
                </button>
              )}
              <Link
                href="/"
                className="inline-block w-full py-3 rounded-2xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-red-500 font-medium mb-4">Something went wrong.</p>
            <Link href="/vouchers" className="text-[#ff7f5c] underline text-sm">
              Return to Gift Cards
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
