"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Upload, Save, Calendar, Check } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AdminCalendarPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    // Fetch existing calendar item for selected month/year
    async function fetchExisting() {
      try {
        const res = await fetch(`/api/calendar?month=${month}&year=${year}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setImageUrl(data.image_url || "");
            setTitle(data.title || "");
            setPreviewUrl(data.image_url || "");
          } else {
            setImageUrl("");
            setTitle("");
            setPreviewUrl("");
          }
        }
      } catch (error) {
        console.error("Failed to fetch calendar:", error);
      }
    }
    fetchExisting();
  }, [month, year]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "calendar-items");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
        setPreviewUrl(data.url);
        setMessage("Image uploaded successfully!");
      } else {
        setMessage("Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!imageUrl) {
      setMessage("Please upload an image first");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          image_url: imageUrl,
          title: title || `${MONTH_NAMES[month - 1]} ${year} Schedule`,
        }),
      });

      if (res.ok) {
        setMessage("Calendar saved successfully!");
      } else {
        setMessage("Failed to save calendar");
      }
    } catch (error) {
      console.error("Save error:", error);
      setMessage("Failed to save calendar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 
                className="text-2xl md:text-3xl text-stone-900"
                style={{ fontFamily: 'var(--font-mossy), cursive' }}
              >
                Calendar Management
              </h1>
              <p className="text-stone-600 text-sm">
                Upload monthly schedule images
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            {/* Month/Year Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${MONTH_NAMES[month - 1]} ${year} Schedule`}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              />
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Schedule Image
              </label>
              <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center">
                {previewUrl ? (
                  <div className="relative aspect-[3/4] max-h-96 mx-auto mb-4">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="py-8">
                    <Calendar className="h-12 w-12 text-stone-400 mx-auto mb-2" />
                    <p className="text-stone-500">No image uploaded</p>
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {/* Manual URL input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Or enter image URL directly
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                placeholder="/calendar-items/your-image.jpg"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              />
            </div>

            {/* Message */}
            {message && (
              <div className={`mb-6 p-3 rounded-lg ${message.includes("success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                <div className="flex items-center gap-2">
                  {message.includes("success") && <Check className="h-4 w-4" />}
                  {message}
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !imageUrl}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Calendar"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
