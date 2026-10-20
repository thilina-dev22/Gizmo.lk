import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCartStore, Product } from "@/store/useCartStore";
import { formatLKR, getMaxPurchasableQuantity, getProductOptions, getStockStatus, safeParseImages } from "@/lib/utils";
import { FALLBACK_PRODUCT_IMAGE, FLAT_DELIVERY_FEE_LKR, FREE_SHIPPING_THRESHOLD_LKR } from "@/lib/constants";
import { apiFetch, getErrorMessage, isAbortError, ApiError } from "@/lib/api";
import { toast } from "@/store/useToastStore";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetailSkeleton, ProductGridSkeleton, Skeleton } from "@/components/common/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import {
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  Banknote,
  Plus,
  Minus,
  Star,
  ExternalLink,
  MessageSquare,
  Send,
  ChevronRight,
  ChevronLeft,
  Check,
  Share2,
  Copy,
  Mail,
  MessageCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { SEOHead } from "@/components/common/SEOHead";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const SPECIAL_SPEC_KEYS = new Set([
  "Brand", "brand", "Warranty", "warranty",
  "Height", "height", "Width", "width", "Length", "length", "Weight", "weight", "Dimensions", "dimensions",
  "Colors", "colors", "Color", "color",
  "Variants", "variants", "Voltage", "voltage", "Options", "options", "VariantType",
]);

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const closeCart = useCartStore((state) => state.closeCart);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Review Form & List State
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  // Load product (and reset per-product UI state when navigating between products)
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    setQuantity(1);
    setActiveImageIndex(0);
    setReviewFeedback(null);

    apiFetch<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(({ product: loaded }) => {
        setProduct(loaded);
        const options = getProductOptions(loaded.specs);
        setSelectedColor(options.colors[0] || "");
        setSelectedVariant(options.variants[0] || "");

        // Show the clean slug URL without triggering a router navigation / refetch
        if (loaded.slug && id !== loaded.slug) {
          window.history.replaceState(window.history.state, "", `/products/${loaded.slug}`);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setProduct(null);
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(getErrorMessage(err, "We couldn't load this product."));
        }
        setLoading(false);
      });

    return () => controller.abort();
  }, [id, reloadKey]);

  const productId = product?.id;
  const productCategory = product?.category;

  // Approved reviews for the resolved product
  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    setReviewsLoading(true);
    apiFetch<{ reviews: Review[] }>(`/api/reviews?productId=${encodeURIComponent(productId)}`, {
      signal: controller.signal,
      silent: true,
    })
      .then((data) => setReviewsList(data.reviews || []))
      .catch((err) => {
        if (!isAbortError(err)) setReviewsList([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setReviewsLoading(false);
      });
    return () => controller.abort();
  }, [productId]);

  // "You may also like" products from the same category
  useEffect(() => {
    if (!productId || !productCategory) return;
    const controller = new AbortController();
    setRelatedLoading(true);
    apiFetch<{ products: Product[] }>(
      `/api/products?category=${encodeURIComponent(productCategory)}&exclude=${encodeURIComponent(productId)}&sort=bestsellers&limit=8`,
      { signal: controller.signal, silent: true }
    )
      .then((data) => setRelatedProducts(data.products || []))
      .catch((err) => {
        if (!isAbortError(err)) setRelatedProducts([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setRelatedLoading(false);
      });
    return () => controller.abort();
  }, [productId, productCategory]);

  const images = useMemo(() => safeParseImages(product?.images), [product?.images]);
  const options = useMemo(() => getProductOptions(product?.specs), [product?.specs]);
  const stockStatus = getStockStatus(product?.stock);
  const maxQuantity = getMaxPurchasableQuantity(product?.stock);

  const handleAddToCart = useCallback(() => {
    if (!product || !stockStatus.canBuy) return false;
    addItem(product, quantity, { selectedColor, selectedVariant, warranty: options.warranty });
    return true;
  }, [product, stockStatus.canBuy, addItem, quantity, selectedColor, selectedVariant, options.warranty]);

  const handleBuyNow = () => {
    if (handleAddToCart()) {
      closeCart();
      navigate("/checkout");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmittingReview(true);
    setReviewFeedback(null);

    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        body: {
          productId: product.id,
          authorName: authorName.trim(),
          rating: newRating,
          comment: comment.trim(),
        },
      });
      setReviewFeedback({ tone: "success", message: "Thank you! Your review has been submitted and will appear once approved." });
      setAuthorName("");
      setComment("");
      setNewRating(5);
    } catch (err) {
      setReviewFeedback({ tone: "error", message: getErrorMessage(err, "Failed to submit review") });
    } finally {
      setSubmittingReview(false);
    }
  };

  const productPath = product ? `/products/${product.slug || product.id}` : "";
  const productUrl = `https://gizmotek.lk${productPath}`;

  const productJsonLd = useMemo(() => {
    if (!product) return undefined;
    const rating = product.rating || 0;
    const count = product.reviewCount || 0;
    return [
      {
        "@type": "Product",
        "@id": `${productUrl}#product`,
        "name": product.title,
        "image": images.length > 0 ? images : [FALLBACK_PRODUCT_IMAGE],
        "description": product.description || `${product.title} available with islandwide delivery across Sri Lanka at GizmoTek.lk`,
        "sku": product.sku,
        "brand": {
          "@type": "Brand",
          "name": options.brand || "GizmoTek",
        },
        "offers": {
          "@type": "Offer",
          "url": productUrl,
          "priceCurrency": "LKR",
          "price": product.sellingPriceLkr,
          "priceValidUntil": `${new Date().getFullYear() + 1}-12-31`,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": "GizmoTek.lk",
            "url": "https://gizmotek.lk",
          },
          "hasMerchantReturnPolicy": {
            "@type": "MerchantReturnPolicy",
            "applicableCountry": "LK",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "merchantReturnDays": 7,
            "merchantReturnLink": "https://gizmotek.lk/return-policy",
          },
          "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingRate": {
              "@type": "MonetaryAmount",
              "value": product.sellingPriceLkr >= FREE_SHIPPING_THRESHOLD_LKR ? "0" : String(FLAT_DELIVERY_FEE_LKR),
              "currency": "LKR",
            },
            "shippingDestination": {
              "@type": "DefinedRegion",
              "addressCountry": "LK",
            },
            "deliveryTime": {
              "@type": "ShippingDeliveryTime",
              "businessDays": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              },
              "transitTime": {
                "@type": "QuantitativeValue",
                "minValue": 2,
                "maxValue": 4,
                "unitCode": "DAY",
              },
            },
          },
        },
        ...(rating > 0 && count > 0
          ? {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": rating.toFixed(1),
                "reviewCount": count,
                "bestRating": "5",
                "worstRating": "1",
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gizmotek.lk/" },
          {
            "@type": "ListItem",
            "position": 2,
            "name": product.category || "Products",
            "item": `https://gizmotek.lk/products?category=${encodeURIComponent(product.category || "")}`,
          },
          { "@type": "ListItem", "position": 3, "name": product.title, "item": productUrl },
        ],
      },
    ];
  }, [product, images, options.brand, productUrl]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <ErrorState title="Couldn't load this product" message={loadError} onRetry={() => setReloadKey((key) => key + 1)} />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4 animate-fade-in">
        <SEOHead title="Product Not Found | GizmoTek.lk" noIndex={true} />
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <p className="text-xs text-slate-400">The product you are looking for does not exist or has been removed.</p>
        <Link
          to="/products"
          className="inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const currentImage = images[activeImageIndex] || images[0] || FALLBACK_PRODUCT_IMAGE;

  const handleNextImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 35) {
      handleNextImage();
    } else if (diff < -35) {
      handlePrevImage();
    }
    setTouchStartX(null);
  };

  const { specs, brand, warranty, colors: availableColors, variants: availableVariants, variantTitle } = options;

  const height = specs["Height"] || specs["height"] || "";
  const width = specs["Width"] || specs["width"] || "";
  const length = specs["Length"] || specs["length"] || "";
  const weight = specs["Weight"] || specs["weight"] || "";
  const dimensionsStr = specs["Dimensions"] || specs["dimensions"] || "";
  const hasDimensions = Boolean(height || width || length || weight || dimensionsStr);
  const generalSpecs = Object.entries(specs).filter(([k]) => !SPECIAL_SPEC_KEYS.has(k));

  const whatsappMessage = encodeURIComponent(
    `Hi GizmoTek.lk! I want to order:\n*Product*: ${product.title}\n*SKU*: ${product.sku}${selectedColor ? `\n*Color*: ${selectedColor}` : ""}${selectedVariant ? `\n*Option*: ${selectedVariant}` : ""}\n*Warranty*: ${warranty}\n*Price*: Rs. ${product.sellingPriceLkr.toLocaleString()}\n*Qty*: ${quantity}\n*Link*: ${productUrl}`
  );

  const displayRating = product.rating || 0;
  const displayCount = product.reviewCount || 0;

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}${productPath}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement("input");
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      toast.success("Product link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Couldn't copy the link. Please copy it from the address bar.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-28 sm:pb-8 space-y-12 animate-fade-in">
      <SEOHead
        title={`${product.title} - Price in Sri Lanka | GizmoTek.lk`}
        description={`Buy ${product.title} online for Rs. ${product.sellingPriceLkr.toLocaleString()} in Sri Lanka. ${product.description ? product.description.slice(0, 140) + '...' : '100% genuine quality with Islandwide Cash on Delivery (COD) & warranty.'}`}
        keywords={`${product.title}, ${product.title} price Sri Lanka, ${product.category} Sri Lanka, buy ${product.title} Colombo, GizmoTek.lk`}
        canonical={productUrl}
        ogImage={images[0] || FALLBACK_PRODUCT_IMAGE}
        ogType="product"
        jsonLd={productJsonLd}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
        <Link to="/" className="hover:text-cyan-400 shrink-0">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link to="/products" className="hover:text-cyan-400 shrink-0">Products</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-cyan-400 truncate">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
        <span className="text-slate-200 font-semibold truncate max-w-xs hidden sm:inline">{product.title}</span>
      </nav>

      <div className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Gallery (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div
              className="relative h-72 sm:h-96 md:h-[450px] w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl group select-none cursor-pointer"
              onClick={handleNextImage}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <OptimizedImage
                key={currentImage}
                src={currentImage}
                alt={`${product.title} - Image ${activeImageIndex + 1}`}
                fill
                priority={activeImageIndex === 0}
                className="group-hover:scale-105 transition-transform duration-300"
              />

              {/* Badges Overlay */}
              <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
                {product.isBestSeller && (
                  <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full shadow">
                    Best Seller
                  </span>
                )}
                <span className="bg-cyan-500/20 text-cyan-400 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full border border-cyan-500/30">
                  {product.category}
                </span>
                {brand && (
                  <span className="bg-slate-900/90 text-slate-200 font-bold text-[10px] uppercase px-3 py-1 rounded-full border border-slate-700">
                    Brand: {brand}
                  </span>
                )}
              </div>

              {/* Interactive Navigation Arrows for Multi-image Products */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white flex items-center justify-center border border-slate-700 shadow-xl backdrop-blur-md opacity-90 hover:opacity-100 hover:border-cyan-400 transition-all z-20"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 text-cyan-300" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white flex items-center justify-center border border-slate-700 shadow-xl backdrop-blur-md opacity-90 hover:opacity-100 hover:border-cyan-400 transition-all z-20"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 text-cyan-300" />
                  </button>

                  {/* Counter Badge */}
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-bold text-cyan-300 z-10 pointer-events-none">
                    {activeImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Selector */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto py-2 px-1 no-scrollbar">
                {images.map((imgUrl, i) => (
                  <button
                    key={`${imgUrl}-${i}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(i);
                    }}
                    aria-label={`Show image ${i + 1}`}
                    aria-current={activeImageIndex === i}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-slate-900 ${
                      activeImageIndex === i
                        ? "border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-950"
                        : "border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700"
                    }`}
                  >
                    <OptimizedImage src={imgUrl} alt={`${product.title} thumb ${i + 1}`} fill />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Specs & Quick Checkout Action (6 cols) */}
          <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
                    SKU: {product.sku}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{warranty}</span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {product.title}
                </h1>
              </div>

              {/* Social Proof Rating */}
              <a href="#reviews" className="flex items-center gap-2 w-fit group">
                <div className="flex text-amber-400" aria-hidden="true">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(displayRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-200">{displayRating.toFixed(1)}</span>
                <span className="text-slate-500 text-xs group-hover:text-cyan-400 transition-colors">
                  | {displayCount > 0 ? `${displayCount} Customer Review${displayCount === 1 ? "" : "s"}` : "No reviews yet"}
                </span>
              </a>

              {/* Price Box */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-400 block">Selling Price (LKR)</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
                    {formatLKR(product.sellingPriceLkr)}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border inline-block ${
                      stockStatus.tone === "out"
                        ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                        : stockStatus.tone === "low"
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    }`}
                  >
                    {stockStatus.tone === "in" ? "In Stock & Ready to Dispatch" : stockStatus.tone === "low" ? `Hurry — ${stockStatus.label}` : "Currently Out of Stock"}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {stockStatus.canBuy ? "Estimated Delivery: 2-4 Days" : "Contact us on WhatsApp for restock dates"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-2">
                <h2 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Product Overview</h2>
                <p className="whitespace-pre-line">{product.description}</p>
              </div>

              {/* Color Options Selector */}
              {availableColors.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 uppercase tracking-wider">Select Color:</span>
                    <span className="text-cyan-400 font-semibold">{selectedColor || "None Selected"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
                    {availableColors.map((col) => {
                      const isSelected = selectedColor === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setSelectedColor(col)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-cyan-500 text-slate-950 shadow-neon scale-105"
                              : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{col}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Variant / Voltage / Size Selector */}
              {availableVariants.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 uppercase tracking-wider">Select {variantTitle}:</span>
                    <span className="text-cyan-400 font-semibold">{selectedVariant || "None Selected"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={variantTitle}>
                    {availableVariants.map((v) => {
                      const isSelected = selectedVariant === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setSelectedVariant(v)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-cyan-500 text-slate-950 shadow-neon scale-105"
                              : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{v}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Dimensions & Weight Card */}
              {hasDimensions && (
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <h2 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                    Product Dimensions &amp; Weight
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      ["Height", height],
                      ["Width", width],
                      ["Length", length],
                    ]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div key={label} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block uppercase">{label}</span>
                          <span className="font-bold text-white text-xs">{value}</span>
                        </div>
                      ))}
                    {weight && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block uppercase">Weight</span>
                        <span className="font-bold text-cyan-400 text-xs">{weight}</span>
                      </div>
                    )}
                    {!height && !width && !length && dimensionsStr && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 text-center">
                        <span className="text-[10px] text-slate-400 block uppercase">Dimensions</span>
                        <span className="font-bold text-white text-xs">{dimensionsStr}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* General Tech Specs Table */}
              {generalSpecs.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <h2 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Technical Specifications</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {generalSpecs.map(([key, value]) => (
                      <div key={key} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex justify-between gap-3">
                        <dt className="text-slate-400">{key}:</dt>
                        <dd className="font-semibold text-slate-200 text-right">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* Quantity & CTA Buttons */}
            <div className="space-y-4 pt-6 border-t border-slate-800">
              {stockStatus.canBuy && (
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Quantity:</span>
                  <div className="flex items-center border border-slate-700 rounded-xl bg-slate-900 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="p-2.5 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-extrabold text-sm text-slate-100 tabular-nums" aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                      aria-label="Increase quantity"
                      className="p-2.5 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {stockStatus.tone === "low" && (
                    <span className="text-[11px] font-semibold text-amber-400">{stockStatus.label}</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!stockStatus.canBuy}
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-100 font-bold py-3.5 px-6 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all text-xs cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4 text-cyan-400" />
                  <span>Add to Shopping Cart</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!stockStatus.canBuy}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-slate-950 font-extrabold py-3.5 px-6 rounded-xl shadow-neon transition-all text-xs cursor-pointer active:scale-[0.98] disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4" />
                  <span>{stockStatus.canBuy ? "Buy Now Quick Checkout" : "Out of Stock"}</span>
                </button>
              </div>

              {/* WhatsApp Direct Order Button */}
              <a
                href={`https://wa.me/94721410369?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{stockStatus.canBuy ? "Order via WhatsApp Direct (+94 72 141 0369)" : "Ask about restock on WhatsApp"}</span>
              </a>

              {/* Product Share Widget */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Share This Gadget:</span>
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {/* WhatsApp Share */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product.title} on GizmoTek Sri Lanka:\n${productUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      copiedLink
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                        : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-700 hover:border-cyan-400 hover:text-cyan-300"
                    }`}
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                  </button>

                  {/* Email Share */}
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`${product.title} - GizmoTek Sri Lanka`)}&body=${encodeURIComponent(`Hi,\n\nI found this tech product on GizmoTek.lk:\n${product.title}\nPrice: Rs. ${product.sellingPriceLkr.toLocaleString()}\n\nCheck it out here: ${productUrl}`)}`}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    title="Share via Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>

                  {/* Native Mobile Share (iOS / Android) */}
                  {typeof navigator !== "undefined" && "share" in navigator && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator
                          .share({
                            title: product.title,
                            text: `Check out ${product.title} on GizmoTek Sri Lanka!`,
                            url: productUrl,
                          })
                          .catch(() => {});
                      }}
                      className="flex sm:hidden items-center gap-1.5 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>More</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sri Lanka Delivery Guarantee */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <Truck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>2-4 Days Islandwide</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Cash on Delivery</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{warranty}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews & Moderation Form Section */}
        <section id="reviews" className="pt-10 border-t border-slate-800 space-y-8 scroll-mt-32">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <span>Customer Reviews</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Read customer feedback or share your own experience.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-white">{displayRating.toFixed(1)} / 5.0</span>
              <span className="text-xs text-slate-400">({displayCount} reviews)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Approved Reviews List (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {reviewsLoading ? (
                Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-7 h-7 rounded-full" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))
              ) : reviewsList.length > 0 ? (
                reviewsList.map((rev) => (
                  <article key={rev.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center border border-cyan-500/30 shrink-0">
                          {rev.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-200 text-xs block truncate">{rev.authorName}</span>
                          <time className="text-[10px] text-slate-500" dateTime={rev.createdAt}>
                            {new Date(rev.createdAt).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" })}
                          </time>
                        </div>
                      </div>

                      <div className="flex text-amber-400 shrink-0" aria-label={`${rev.rating} out of 5 stars`}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pl-9">{rev.comment}</p>
                  </article>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <h3 className="text-xs font-bold text-slate-300">No Reviews Yet</h3>
                  <p className="text-[11px] text-slate-500">
                    Be the first customer to review this tech product!
                  </p>
                </div>
              )}
            </div>

            {/* Submit Review Form (5 cols) */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>Write a Product Review</span>
                </h3>

                {reviewFeedback && (
                  <div
                    role="status"
                    className={`p-3 rounded-xl border text-xs animate-fade-in ${
                      reviewFeedback.tone === "success"
                        ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-950/50 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {reviewFeedback.message}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label htmlFor="review-name" className="font-semibold text-slate-300">Your Full Name *</label>
                    <input
                      id="review-name"
                      type="text"
                      required
                      maxLength={60}
                      autoComplete="name"
                      placeholder="e.g. Kasun Fernando"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-300 block">Rating (1 to 5 Stars) *</span>
                    <div className="flex gap-2" role="radiogroup" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          role="radio"
                          aria-checked={newRating === star}
                          aria-label={`${star} star${star > 1 ? "s" : ""}`}
                          onClick={() => setNewRating(star)}
                          className={`p-2 rounded-xl border transition-all flex items-center justify-center gap-1 cursor-pointer hover:scale-110 ${
                            newRating >= star
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                              : "bg-slate-950 border-slate-800 text-slate-600"
                          }`}
                        >
                          <Star className={`w-4 h-4 ${newRating >= star ? "fill-amber-400" : ""}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="review-comment" className="font-semibold text-slate-300">Your Product Review *</label>
                    <textarea
                      id="review-comment"
                      rows={3}
                      required
                      maxLength={600}
                      placeholder="Share details about build quality, performance, and battery life..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none resize-none text-xs"
                    />
                    <span className="text-[10px] text-slate-500 block text-right">{comment.length}/600</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-cyan-600 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all shadow-neon cursor-pointer disabled:opacity-50"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Review...</span>
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </button>
                  <span className="text-[10px] text-slate-500 text-center block">
                    * Reviews are moderated before they appear on the store.
                  </span>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {(relatedLoading || relatedProducts.length > 0) && (
          <section className="pt-10 border-t border-slate-800 space-y-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>More in {product.category}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">You May Also Like</h2>
              </div>
              <Link
                to={`/products?category=${encodeURIComponent(product.category)}`}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 shrink-0"
              >
                View all &rarr;
              </Link>
            </div>
            {relatedLoading ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {relatedProducts.slice(0, 8).map((related) => (
                  <ProductCard key={related.id} product={related} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
              {stockStatus.canBuy ? `Total (${quantity} × LKR)` : "Availability"}
            </span>
            <span className={`text-sm font-extrabold truncate ${stockStatus.canBuy ? "text-cyan-400" : "text-rose-400"}`}>
              {stockStatus.canBuy ? formatLKR(product.sellingPriceLkr * quantity) : "Out of Stock"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!stockStatus.canBuy}
              className="bg-slate-900 hover:bg-slate-850 text-slate-100 p-3 rounded-xl border border-slate-700 font-bold text-xs min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer disabled:opacity-40"
              title="Add to Cart"
              aria-label="Add to cart"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!stockStatus.canBuy}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-extrabold py-3 px-5 rounded-xl text-xs shadow-neon min-h-[42px] cursor-pointer disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              <Zap className="w-4 h-4" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
