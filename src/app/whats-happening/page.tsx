"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface CalendarItem {
  id: string;
  month: number;
  year: number;
  image_url: string;
  title: string;
}

export default function WhatsHappeningPage() {
  const [calendarItem, setCalendarItem] = useState<CalendarItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  const currentMonth = new Date().getMonth() + 1; // 1-indexed
  const currentYear = new Date().getFullYear();
  const monthName = MONTH_NAMES[currentMonth - 1];

  useEffect(() => {
    async function fetchCalendarItem() {
      try {
        const res = await fetch(`/api/calendar?month=${currentMonth}&year=${currentYear}`);
        if (res.ok) {
          const data = await res.json();
          setCalendarItem(data);
        }
      } catch (error) {
        console.error("Failed to fetch calendar item:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCalendarItem();
  }, [currentMonth, currentYear]);

  // Default image if no calendar item exists
  const defaultImage = "/calendar-items/FEB 2026 NEWSLETTER 2_page-0001.avif";
  const imageUrl = calendarItem?.image_url || defaultImage;

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 
                className="text-2xl md:text-3xl text-stone-900"
                style={{ fontFamily: 'var(--font-mossy), cursive' }}
              >
                What&apos;s Happening at Mamalu Kitchen
              </h1>
              <div className="flex items-center gap-2 text-stone-600 mt-1">
                <Calendar className="h-4 w-4" />
                <span style={{ fontFamily: 'var(--font-mossy), cursive' }}>
                  {monthName} {currentYear}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative aspect-[3/4] md:aspect-[4/5]">
                <Image
                  src={imageUrl}
                  alt={`${monthName} ${currentYear} Schedule`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="text-center mt-8">
              <p 
                className="text-stone-600 mb-4"
                style={{ fontFamily: 'var(--font-mossy), cursive' }}
              >
                Ready to book your spot?
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("openMamaluMenu"))}
                className="inline-block px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
                style={{ fontFamily: 'var(--font-mossy), cursive' }}
              >
                Book a Class
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
