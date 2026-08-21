import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/product/QuickViewModal";

// Route-based Code Splitting for performance optimization
const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import("./pages/ProductsPage").then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import("./pages/OrderSuccessPage").then((m) => ({ default: m.OrderSuccessPage })));

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

// Suspense loading spinner
function RouteLoadingFallback() {
  return (
    <div className="flex-1 min-h-[50vh] flex items-center justify-center p-12 text-slate-400 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading GizmoTek...</span>
      </div>
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
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/return-policy" element={<ReturnPolicyPage />} />
            <Route path="/refund-policy" element={<ReturnPolicyPage />} />
            <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
            <Route path="/delivery-policy" element={<ShippingPolicyPage />} />
            <Route path="/contact-us" element={<ContactPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/faqs" element={<FAQPage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
