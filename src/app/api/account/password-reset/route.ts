import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";
import { getPublicSiteUrl } from "@/lib/url/site";

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isLocalUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function getRequestSiteUrl(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !isLocalUrl(origin)) {
    return origin.replace(/\/+$/, "");
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  if (host) {
    const url = `${protocol}://${host}`;
    if (!isLocalUrl(url)) {
      return url.replace(/\/+$/, "");
    }
  }

  return getPublicSiteUrl();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Authentication service not configured" }, { status: 500 });
    }

    const redirectTo = `${getRequestSiteUrl(request)}/account`;
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error) {
      console.error("Password reset link generation error:", error);
      return NextResponse.json(
        { error: "Unable to send password reset email" },
        { status: 500 }
      );
    }

    const actionLink = data.properties?.action_link;
    if (!actionLink) {
      console.error("Password reset link generation returned no action_link");
      return NextResponse.json(
        { error: "Unable to send password reset email" },
        { status: 500 }
      );
    }

    const emailResult = await sendPasswordResetEmail({ email, actionLink });
    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Unable to send password reset email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Password reset API error:", error);
    return NextResponse.json({ error: "Unable to send password reset email" }, { status: 500 });
  }
}
