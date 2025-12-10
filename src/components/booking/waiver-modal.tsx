"use client";

import { useState } from "react";
import { X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WaiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (signature: string) => void;
  attendeeName: string;
}

export function WaiverModal({ isOpen, onClose, onAccept, attendeeName }: WaiverModalProps) {
  const [signature, setSignature] = useState("");
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (signature.trim().toLowerCase() === attendeeName.trim().toLowerCase()) {
      onAccept(signature);
    } else {
      alert("Please type your full name exactly as shown to sign the waiver.");
    }
  };

  const isSignatureValid = signature.trim().toLowerCase() === attendeeName.trim().toLowerCase();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900">Waiver & Terms</h2>
              <p className="text-sm text-stone-500">Please read and sign to continue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto p-6 text-sm text-stone-700 leading-relaxed"
          onScroll={handleScroll}
        >
          <h3 className="font-bold text-lg text-stone-900 mb-4">
            MAMALU KITCHEN - LIABILITY WAIVER AND RELEASE
          </h3>

          <p className="mb-4">
            By signing this waiver, I acknowledge and agree to the following terms and conditions
            for participation in cooking classes and activities at Mamalu Kitchen:
          </p>

          <h4 className="font-semibold text-stone-900 mt-6 mb-2">1. ASSUMPTION OF RISK</h4>
          <p className="mb-4">
            I understand that cooking classes involve inherent risks including, but not limited to:
            burns from hot surfaces and liquids, cuts from knives and sharp objects, allergic reactions
            to food ingredients, slips and falls, and other kitchen-related injuries. I voluntarily
            assume all such risks and accept full responsibility for any injury or damage that may occur.
          </p>

          <h4 className="font-semibold text-stone-900 mt-6 mb-2">2. RELEASE OF LIABILITY</h4>
          <p className="mb-4">
            I hereby release, waive, and discharge Mamalu Kitchen, its owners, employees, instructors,
            and affiliates from any and all liability, claims, demands, or causes of action that may
            arise from my participation in any cooking class or activity, including any injury or
            damage to my person or property.
          </p>

          <h4 className="font-semibold text-stone-900 mt-6 mb-2">3. HEALTH DECLARATION</h4>
          <p className="mb-4">
            I confirm that I am in good physical health and have no medical conditions that would
            prevent my safe participation in cooking activities. I have disclosed any food allergies
            or dietary restrictions to the staff.
          </p>

          <h4 className="font-semibold text-stone-900 mt-6 mb-2">4. PHOTO/VIDEO CONSENT</h4>
          <p className="mb-4">
            I grant Mamalu Kitchen permission to take photographs and videos during classes and to
            use such media for promotional purposes, including social media, website, and marketing
            materials, unless I notify the staff in writing prior to the class.
          </p>

          <h4 className="font-semibold text-stone-900 mt-6 mb-2">5. CLASS POLICIES</h4>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Arrive at least 10 minutes before class start time</li>
            <li>Wear closed-toe shoes and appropriate clothing</li>
            <li>Follow all safety instructions provided by instructors</li>
            <li>No refunds for no-shows or late cancellations (less than 48 hours notice)</li>
            <li>Rescheduling is subject to availability</li>
          </ul>

          <h4 className="font-semibold text-stone-900 mt-6 mb-2">6. CANCELLATION POLICY</h4>
          <p className="mb-4">
            Cancellations made more than 48 hours before the scheduled class will receive a full
            refund or credit. Cancellations made within 48 hours are non-refundable but may be
            rescheduled subject to availability. No-shows forfeit the full class fee.
          </p>

          <h4 className="font-semibold text-stone-900 mt-6 mb-2">7. INDEMNIFICATION</h4>
          <p className="mb-4">
            I agree to indemnify and hold harmless Mamalu Kitchen from any claims, damages, or
            expenses arising from my actions or negligence during participation in any class or activity.
          </p>

          <h4 className="font-semibold text-stone-900 mt-6 mb-2">8. ACKNOWLEDGMENT</h4>
          <p className="mb-4">
            I have read this waiver and release in its entirety, understand its contents, and sign
            it voluntarily. I understand that by signing this document, I am giving up legal rights
            I might otherwise have.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <p className="text-amber-800 font-medium">
              Please scroll to the bottom to read the entire waiver before signing.
            </p>
          </div>
        </div>

        {/* Signature Section */}
        <div className="p-6 border-t border-stone-200 bg-stone-50">
          {!hasScrolledToBottom ? (
            <div className="flex items-center gap-2 text-amber-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">Please scroll and read the entire waiver to continue</span>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-stone-700">
                    I have read, understood, and agree to the above Waiver, Release of Liability,
                    and Terms & Conditions.
                  </span>
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Digital Signature - Type your full name: <span className="text-amber-600">{attendeeName}</span>
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full name to sign"
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                {signature && !isSignatureValid && (
                  <p className="text-red-500 text-sm mt-1">
                    Signature must match: {attendeeName}
                  </p>
                )}
                {isSignatureValid && (
                  <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Signature verified
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!hasScrolledToBottom || !agreedToTerms || !isSignatureValid}
              className="flex-1 bg-amber-500 hover:bg-amber-600"
            >
              Accept & Sign Waiver
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
