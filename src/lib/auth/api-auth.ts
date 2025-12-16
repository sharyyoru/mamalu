import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error: string | null;
}

/**
 * Verify user authentication and role for API routes
 * @param request - Next.js request object
 * @param allowedRoles - Array of roles that are allowed to access this endpoint
 * @returns AuthResult with user data or error
 */
export async function verifyAuth(
  request: NextRequest,
  allowedRoles: string[] = []
): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return {
        user: null,
        error: "Authentication service not configured"
      };
    }

    // Get authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return {
        user: null,
        error: "Unauthorized - Please log in"
      };
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, full_name")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      return {
        user: null,
        error: "User profile not found"
      };
    }

    // Check if user has required role
    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
      return {
        user: null,
        error: `Access denied - Required role: ${allowedRoles.join(" or ")}`
      };
    }

    return {
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name || undefined
      },
      error: null
    };
  } catch (error: any) {
    console.error("Auth verification error:", error);
    return {
      user: null,
      error: "Authentication failed"
    };
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 * Returns 401 if not authenticated or 403 if role not allowed
 */
export async function requireAuth(
  request: NextRequest,
  allowedRoles: string[] = []
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const { user, error } = await verifyAuth(request, allowedRoles);

  if (error || !user) {
    const statusCode = error?.includes("Access denied") ? 403 : 401;
    return NextResponse.json(
      { error: error || "Unauthorized" },
      { status: statusCode }
    );
  }

  return { user };
}
