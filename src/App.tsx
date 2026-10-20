import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/product/QuickViewModal";
import { TopLoadingBar } from "@/components/common/TopLoadingBar";
import { Toaster } from "@/components/common/Toaster";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// Route-based Code Splitting for performance optimization
const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import("./pages/ProductsPage").then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import("./pages/OrderSuccessPage").then((m) => ({ default: m.OrderSuccessPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

// Policy & Compliance Pages (PayHere Requirements)
const TermsPage = lazy(() => import("./pages/policies/TermsPage").then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("./pages/policies/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const ReturnPolicyPage = lazy(() => import("./pages/policies/ReturnPolicyPage").then((m) => ({ default: m.ReturnPolicyPage })));
const ShippingPolicyPage = lazy(() => import("./pages/policies/ShippingPolicyPage").then((m) => ({ default: m.ShippingPolicyPage })));
const ContactPage = lazy(() => import("./pages/policies/ContactPage").then((m) => ({ default: m.ContactPage })));
const FAQPage = lazy(() => import("./pages/policies/FAQPage").then((m) => ({ default: m.FAQPage })));

// Admin Pages
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage").then((m) => ({ default: m.AdminLoginPage })));
const AdminOverviewPage = lazy(() => import("./pages/admin/AdminOverviewPage").then((m) => ({ default: m.AdminOverviewPage })));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage").then((m) => ({ default: m.AdminOrdersPage })));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage").then((m) => ({ default: m.AdminProductsPage })));
const AdminReviewsPage = lazy(() => import("./pages/admin/AdminReviewsPage").then((m) => ({ default: m.AdminReviewsPage })));

// Scroll restoration component
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

// Suspense loading indicator shown while a route's code chunk downloads
function RouteLoadingFallback() {
  return (
    <div
      role="status"
      className="flex-1 min-h-[50vh] flex flex-col items-center justify-center gap-4 p-12 animate-fade-in"
    >
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400/40 animate-spin" />
        <div className="absolute inset-3 rounded-full bg-cyan-500/20 animate-pulse" />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Loading GizmoTek…</span>
    </div>
  );
}

export function App() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950 min-h-screen flex flex-col">
      <ScrollToTop />
      <TopLoadingBar />
      <Toaster />

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

      <main className="flex-1">
        <ErrorBoundary>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Storefront Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<OrderSuccessPage />} />

            {/* Policy & Compliance Pages */}
            <Route path="/terms-and-conditions" element={<TermsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPage />} />
            <Route path="/return-policy" element={<ReturnPolicyPage />} />
            <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
            <Route path="/contact-us" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />

            {/* Alias URLs redirect to the single canonical URL (no duplicate content) */}
            <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
            <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
            <Route path="/refund-policy" element={<Navigate to="/return-policy" replace />} />
            <Route path="/delivery-policy" element={<Navigate to="/shipping-policy" replace />} />
            <Route path="/contact" element={<Navigate to="/contact-us" replace />} />
            <Route path="/faqs" element={<Navigate to="/faq" replace />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
            </Route>

            {/* Unknown URLs get a proper (noindex) 404 page instead of a soft-404 redirect */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
