"use client";

import { useCallback, useState } from "react";
import MamaluVoucher from "@/components/MamaluVoucher";
import { Send, Loader2 } from "lucide-react";

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

export default function VoucherPreviewPage() {
  const [email, setEmail]     = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState<string | null>(null);
  const [blobs, setBlobs]     = useState<{ front: Blob; terms: Blob } | null>(null);

  const handleGenerated = useCallback((generated: { front: Blob; terms: Blob }) => {
    setBlobs(generated);
  }, []);

  const handleSend = async () => {
    if (!blobs || !email) return;
    setSending(true);
    setResult(null);
    try {
      const [frontImageBase64, termsImageBase64] = await Promise.all([
        blobToBase64(blobs.front),
        blobToBase64(blobs.terms),
      ]);
      const res = await fetch("/api/send-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "test",
          recipientName: "Test Customer",
          recipientEmail: email,
          amount: 250,
          voucherCode: "MAMALU-018",
          frontImageBase64,
          termsImageBase64,
        }),
      });
      const data = await res.json();
      setResult(res.ok ? `✅ Email sent to ${email}` : `❌ ${data.error}`);
    } catch (err) {
      setResult(`❌ ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Voucher Email Preview</h1>
      <p className="text-stone-500 text-sm mb-6">
        Test data: <code className="bg-stone-100 px-1 rounded">To: Aisha · From: Mamalu Kitchen · Code: MAMALU-018 · Date: 26 June 2026</code>
      </p>

      <MamaluVoucher
        toName="Aisha"
        fromName="Mamalu Kitchen"
        voucherCode="MAMALU-018"
        issueDate="26 June 2026"
        onGenerated={handleGenerated}
      />

      <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8C6B]/40 focus:border-[#FF8C6B]"
        />
        <button
          onClick={handleSend}
          disabled={!blobs || !email || sending}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#FF8C6B] text-white font-bold rounded-xl hover:bg-[#ff7a54] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send Test Email
        </button>
      </div>

      {result && (
        <p className="mt-4 text-sm font-medium text-stone-700">{result}</p>
      )}
    </div>
  );
}
