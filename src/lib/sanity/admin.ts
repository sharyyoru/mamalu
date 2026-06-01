import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export function createSanityAdminClient() {
  if (!process.env.SANITY_API_TOKEN) {
    throw new Error("Missing SANITY_API_TOKEN");
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  });
}
