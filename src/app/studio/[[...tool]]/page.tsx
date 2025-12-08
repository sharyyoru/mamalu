"use client";

import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

// Suppress React DOM warnings for Sanity Studio props
const originalError = console.error;
if (typeof window !== 'undefined') {
  console.error = (...args) => {
    if (args[0]?.includes?.('disableTransition') || args[0]?.includes?.('React does not recognize')) {
      return;
    }
    originalError.apply(console, args);
  };
}

export default function StudioPage() {
  return <NextStudio config={config} />;
}
