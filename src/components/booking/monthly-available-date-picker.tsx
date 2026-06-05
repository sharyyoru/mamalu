"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface MonthlyAvailableDatePickerProps {
  availableDates?: string[];
  value: string;
  onChange: (date: string) => void;
  today: string;
  restrictToAvailableDates?: boolean;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getCalendarDays(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function getInitialMonthlyCalendarMonth(availableDates: string[], selectedDate: string, today: string) {
  const firstFutureDate = availableDates.find((date) => date >= today);
  return (selectedDate || firstFutureDate || today).slice(0, 7);
}

export function MonthlyAvailableDatePicker({
  availableDates = [],
  value,
  onChange,
  today,
  restrictToAvailableDates = true,
}: MonthlyAvailableDatePickerProps) {
  const [activeMonth, setActiveMonth] = useState(() =>
    getInitialMonthlyCalendarMonth(availableDates, value, today)
  );
  const [isOpen, setIsOpen] = useState(false);
  const availableSet = new Set(availableDates);
  const days = getCalendarDays(activeMonth);
  const [year, month] = activeMonth.split("-").map(Number);
  const previousMonth = formatMonthKey(new Date(year, month - 2, 1));
  const nextMonth = formatMonthKey(new Date(year, month, 1));

  useEffect(() => {
    setActiveMonth(getInitialMonthlyCalendarMonth(availableDates, value, today));
  }, [availableDates, value, today]);

  const selectedLabel = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-GB")
    : "dd/mm/yyyy";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between rounded-lg border border-stone-300 bg-white px-4 py-2 text-left text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FF8C6B]"
      >
        <span className={value ? "text-stone-900" : "text-stone-400"}>{selectedLabel}</span>
        <Calendar className="h-4 w-4 text-stone-700" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-lg border border-stone-200 bg-white p-3 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveMonth(previousMonth)}
              className="rounded-md px-2 py-1 text-sm text-stone-500 hover:bg-stone-100"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-bold text-stone-800">{monthLabel(activeMonth)}</div>
            <button
              type="button"
              onClick={() => setActiveMonth(nextMonth)}
              className="rounded-md px-2 py-1 text-sm text-stone-500 hover:bg-stone-100"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-stone-500">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date) => {
              const dateKey = formatDateKey(date);
              const inMonth = dateKey.startsWith(activeMonth);
              const isPast = dateKey < today;
              const isAvailable = !isPast && (!restrictToAvailableDates || availableSet.has(dateKey));
              const isSelected = value === dateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => {
                    if (!isAvailable) return;
                    onChange(dateKey);
                    setIsOpen(false);
                  }}
                  disabled={!isAvailable}
                  className={`aspect-square rounded-md text-sm transition-colors ${
                    isSelected
                      ? "bg-[#FF8C6B] text-white"
                      : isAvailable && restrictToAvailableDates
                        ? "border border-[#FF8C6B] bg-[#FF8C6B]/10 font-bold text-[#E95F3F] hover:bg-[#FF8C6B]/20"
                        : isAvailable
                        ? "text-stone-800 hover:bg-stone-100"
                        : inMonth
                        ? "text-stone-300"
                        : "text-stone-200"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {restrictToAvailableDates && availableDates.length === 0 && (
            <p className="mt-3 text-sm text-amber-700">No monthly dates are available yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
