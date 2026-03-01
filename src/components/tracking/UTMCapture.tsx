"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { parseUTMParams, storeUTMParams } from "@/lib/tracking/utm";

// Client component that captures UTM parameters from URL and stores them
export function UTMCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Parse UTM params from current URL
    const params = {
      utm_source: searchParams.get("utm_source") || undefined,
      utm_medium: searchParams.get("utm_medium") || undefined,
      utm_campaign: searchParams.get("utm_campaign") || undefined,
      utm_content: searchParams.get("utm_content") || undefined,
      utm_term: searchParams.get("utm_term") || undefined,
    };

    // Store if any UTM params present
    if (Object.values(params).some(v => v)) {
      storeUTMParams(params);
    }
  }, [searchParams]);

  // This component doesn't render anything
  return null;
}
