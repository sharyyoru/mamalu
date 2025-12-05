import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";

export const metadata = {
  title: {
    default: "Admin Portal | Mamalu Kitchen",
    template: "%s | Admin Portal",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current path to skip auth for login/unauthorized pages
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  
  // Skip auth check for public admin pages
  const publicPaths = ["/admin/login", "/admin/unauthorized"];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  if (isPublicPath) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  const supabase = await createClient();
  
  // Check if Supabase is configured
  if (!supabase) {
    return (
      <html lang="en">
        <body>
          <div className="min-h-screen flex items-center justify-center bg-stone-100">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
              <h1 className="text-2xl font-bold text-stone-900 mb-4">Supabase Not Configured</h1>
              <p className="text-stone-600">Please add your Supabase credentials to .env.local</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Check if user has admin access
  const adminRoles = ["staff", "admin", "super_admin"];
  if (!profile || !adminRoles.includes(profile.role)) {
    redirect("/admin/unauthorized");
  }

  return (
    <html lang="en">
      <body className="bg-stone-100">
        <div className="flex h-screen overflow-hidden">
          <AdminSidebar userRole={profile.role} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <AdminHeader 
              user={{
                email: user.email || "",
                name: profile.full_name || user.email || "",
                avatar: profile.avatar_url,
                role: profile.role,
              }} 
            />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
