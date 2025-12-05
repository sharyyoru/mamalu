import Link from "next/link";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
          <ShieldX className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Access Denied</h1>
        <p className="text-stone-600 mb-8">
          You don&apos;t have permission to access the admin portal. 
          Please contact your administrator if you believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" asChild href="/">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
          <Button asChild href="/admin/login">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
