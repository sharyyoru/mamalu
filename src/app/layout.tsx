import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Header, Footer } from "@/components/layout";
import { SocialSidebar } from "@/components/layout/SocialSidebar";
import { LiveChat } from "@/components/layout/LiveChat";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mamalu Kitchen - Authentic Home-Cooked Flavors",
    template: "%s | Mamalu Kitchen",
  },
  description:
    "Discover authentic recipes, artisan products, cooking classes, and culinary services. Join Mamalu Kitchen on a journey of flavor.",
  keywords: [
    "cooking",
    "recipes",
    "cooking classes",
    "food products",
    "culinary",
    "events",
    "food consultancy",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if we're on an admin or studio page
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdminOrStudio = pathname.startsWith("/admin") || pathname.startsWith("/studio");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {!isAdminOrStudio && <Header />}
        <main className="flex-1">{children}</main>
        {!isAdminOrStudio && <Footer />}
        {!isAdminOrStudio && (
          <>
            <SocialSidebar />
            <LiveChat />
          </>
        )}
      </body>
    </html>
  );
}
