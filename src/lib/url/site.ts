import type { NextRequest } from "next/server";

function normalizeUrl(value?: string | null) {
  const trimmed = value?.trim().replace(/\/+$/, "") || "";
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function isLocalUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function getSiteUrl(request?: NextRequest) {
  const requestOrigin = normalizeUrl(request?.nextUrl.origin);
  const configuredUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const productionUrl = normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  const vercelUrl = normalizeUrl(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const fallbackUrl = "https://mamalu.vercel.app";

  if (configuredUrl && isValidUrl(configuredUrl) && (!isLocalUrl(configuredUrl) || !requestOrigin || isLocalUrl(requestOrigin))) {
    return configuredUrl;
  }

  if (requestOrigin) {
    return requestOrigin;
  }

  return productionUrl || vercelUrl || fallbackUrl;
}

export function getPublicSiteUrl() {
  const configuredUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const productionUrl = normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  const vercelUrl = normalizeUrl(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const fallbackUrl = "https://mamalu.vercel.app";

  if (configuredUrl && isValidUrl(configuredUrl) && !isLocalUrl(configuredUrl)) {
    return configuredUrl;
  }

  return productionUrl || vercelUrl || fallbackUrl;
}
