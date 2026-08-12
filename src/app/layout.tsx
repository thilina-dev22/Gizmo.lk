"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/product/QuickViewModal";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <html lang="en" className="dark">
      <head>
        <title>gizmo.lk online store | Electronics, Gadgets & Tech Accessories Sri Lanka</title>
        <meta
          name="description"
          content="Buy trending wireless earbuds, smartwatches, 4K car dashcams, and PC accessories online in Sri Lanka. Islandwide Cash on Delivery & Direct Bank Slip Verification."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950 min-h-screen flex flex-col">
        {!isAdminRoute && (
          <>
            <Navbar onOpenMobileNav={() => setIsMobileNavOpen(true)} />
            <MobileNavDrawer
              isOpen={isMobileNavOpen}
              onClose={() => setIsMobileNavOpen(false)}
            />
            <CartDrawer />
            <QuickViewModal />
          </>
        )}

        <main className="flex-1">{children}</main>

        {!isAdminRoute && <Footer />}
      </body>
    </html>
  );
}

