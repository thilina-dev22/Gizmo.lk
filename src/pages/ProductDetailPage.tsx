import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCartStore, Product } from "@/store/useCartStore";
import { formatLKR, safeParseImages, safeParseSpecs } from "@/lib/utils";
import { OptimizedImage } from "@/components/common/OptimizedImage";
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
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  Share2,
  Copy,
  Mail,
  MessageCircle,
} from "lucide-react";
import { SEOHead } from "@/components/common/SEOHead";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Review Form & List State
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (data.product) {
        setProduct(data.product);
        setActiveImageIndex(0);

        // Auto-update browser URL to clean slug if accessed via ID or mismatch
        if (data.product.slug && id !== data.product.slug) {
          window.history.replaceState(null, '', `/products/${data.product.slug}`);
        }

        // Auto-select initial color & variant if available
        const parsedSpecs = safeParseSpecs(data.product?.specs);
        const colorsList = (parsedSpecs["Colors"] || parsedSpecs["colors"] || parsedSpecs["Color"] || parsedSpecs["color"] || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (colorsList.length > 0) {
          setSelectedColor(colorsList[0]);
        }

        const variantsList = (parsedSpecs["Variants"] || parsedSpecs["variants"] || parsedSpecs["Voltage"] || parsedSpecs["voltage"] || parsedSpecs["Options"] || parsedSpecs["options"] || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (variantsList.length > 0) {
          setSelectedVariant(variantsList[0]);
        }

        // Fetch reviews with resolved product ID
        fetchReviews(data.product.id);
      }
    } catch (err) {
      console.error("Fetch product error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productIdOrSlug?: string) => {
    const target = productIdOrSlug || product?.id || id;
    if (!target) return;
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(target)}`);
      const data = await res.json();
      setReviewsList(data.reviews || []);
    } catch (err) {
      console.error("Fetch reviews error:", err);
      setReviewsList([]);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      const parsedSpecs = safeParseSpecs(product.specs);
      const warranty = parsedSpecs["Warranty"] || parsedSpecs["warranty"] || "7-Day Replacement Guarantee";
      addItem(product, quantity, { selectedColor, selectedVariant, warranty });
    }
  };

  const handleBuyNow = () => {
    if (product) {
      const parsedSpecs = safeParseSpecs(product.specs);
      const warranty = parsedSpecs["Warranty"] || parsedSpecs["warranty"] || "7-Day Replacement Guarantee";
      addItem(product, quantity, { selectedColor, selectedVariant, warranty });
      openCart();
      navigate("/checkout");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmittingReview(true);
    setReviewFeedback("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          authorName,
          rating: newRating,
          comment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviewFeedback("Thank you! Your review has been submitted for admin verification.");
        setAuthorName("");
        setComment("");
      } else {
        setReviewFeedback(data.error || "Failed to submit review");
      }
    } catch (err) {
      setReviewFeedback("Network error. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading product details...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
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

  const images: string[] = safeParseImages(product.images);
  const currentImage = images[activeImageIndex] || images[0] || FALLBACK_IMAGE;

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
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 35) {
      handleNextImage();
    } else if (diff < -35) {
      handlePrevImage();
    }
    setTouchStartX(null);
  };

  const specs: Record<string, string> = safeParseSpecs(product.specs);

  // Extract special attributes
  const brand = specs["Brand"] || specs["brand"] || "";
  const warranty = specs["Warranty"] || specs["warranty"] || "7-Day Replacement Guarantee";
  const height = specs["Height"] || specs["height"] || "";
  const width = specs["Width"] || specs["width"] || "";
  const length = specs["Length"] || specs["length"] || "";
  const weight = specs["Weight"] || specs["weight"] || "";
  const hasDimensions = Boolean(height || width || length || weight || specs["Dimensions"] || specs["dimensions"]);
  const dimensionsStr = specs["Dimensions"] || specs["dimensions"] || "";

  const availableColors = (specs["Colors"] || specs["colors"] || specs["Color"] || specs["color"] || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  const availableVariants = (specs["Variants"] || specs["variants"] || specs["Voltage"] || specs["voltage"] || specs["Options"] || specs["options"] || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  const variantTitle = specs["VariantType"] || (specs["Voltage"] || specs["voltage"] ? "Voltage / Model" : "Options / Variations");

  // Filter remaining specs for general table
  const specialKeys = new Set([
    "Brand", "brand", "Warranty", "warranty",
    "Height", "height", "Width", "width", "Length", "length", "Weight", "weight", "Dimensions", "dimensions",
    "Colors", "colors", "Color", "color",
    "Variants", "variants", "Voltage", "voltage", "Options", "options", "VariantType"
  ]);
  const generalSpecs = Object.entries(specs).filter(([k]) => !specialKeys.has(k));

  const whatsappMessage = encodeURIComponent(
    `Hi GizmoTek.lk! I want to order:\n*Product*: ${product.title}\n*SKU*: ${product.sku}${selectedColor ? `\n*Color*: ${selectedColor}` : ""}${selectedVariant ? `\n*Option*: ${selectedVariant}` : ""}\n*Warranty*: ${warranty}\n*Price*: Rs. ${product.sellingPriceLkr.toLocaleString()}\n*Qty*: ${quantity}\n*Link*: https://gizmotek.lk/products/${product.slug || product.id}`
  );

  const displayRating = product.rating || 0;
  const displayCount = product.reviewCount || 0;

  const productJsonLd = [
    {
      "@type": "Product",
      "@id": `https://gizmotek.lk/products/${product.slug || product.id}#product`,
      "name": product.title,
      "image": images.length > 0 ? images : [FALLBACK_IMAGE],
      "description": product.description || `${product.title} available with islandwide delivery across Sri Lanka at GizmoTek.lk`,
      "sku": product.sku,
      "brand": {
        "@type": "Brand",
        "name": brand || "GizmoTek",
      },
      "offers": {
        "@type": "Offer",
        "url": `https://gizmotek.lk/products/${product.slug || product.id}`,
        "priceCurrency": "LKR",
        "price": product.sellingPriceLkr,
        "priceValidUntil": "2027-12-31",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "GizmoTek.lk",
          "url": "https://gizmotek.lk",
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "450",
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
      ...(displayRating > 0 && displayCount > 0
        ? {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": displayRating.toFixed(1),
              "reviewCount": displayCount,
              "bestRating": "5",
              "worstRating": "1",
            },
          }
        : {}),
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://gizmotek.lk/",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": product.category || "Products",
          "item": `https://gizmotek.lk/products?category=${encodeURIComponent(product.category || "")}`,
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.title,
          "item": `https://gizmotek.lk/products/${product.slug || product.id}`,
        },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      <SEOHead
        title={`${product.title} - Price in Sri Lanka | GizmoTek.lk`}
        description={`Buy ${product.title} online for Rs. ${product.sellingPriceLkr.toLocaleString()} in Sri Lanka. ${product.description ? product.description.slice(0, 140) + '...' : '100% genuine quality with Islandwide Cash on Delivery (COD) & warranty.'}`}
        keywords={`${product.title}, ${product.title} price Sri Lanka, ${product.category} Sri Lanka, buy ${product.title} Colombo, GizmoTek.lk`}
        canonical={`https://gizmotek.lk/products/${product.slug || product.id}`}
        ogImage={currentImage || (images.length > 0 ? images[0] : FALLBACK_IMAGE)}
        ogType="product"
        jsonLd={productJsonLd}
      />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-cyan-400">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-cyan-400">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-cyan-400">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-200 font-semibold truncate max-w-xs">{product.title}</span>
      </div>

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
                priority
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

            {/* Thumbnail Selector - Clean padding, no cut-off/capping */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto py-2 px-1 scrollbar-thin">
                {images.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(i);
                    }}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-slate-900 ${
                      activeImageIndex === i
                        ? "border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-950"
                        : "border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700"
                    }`}
                  >
                    <OptimizedImage
                      src={imgUrl}
                      alt={`${product.title} thumb ${i + 1}`}
                      fill
                    />
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
                  {/* Per-Product Verified Warranty Badge */}
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
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
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
                <span className="text-slate-500 text-xs">
                  | {displayCount > 0 ? `${displayCount} Verified Buyer Reviews` : "No reviews yet"}
                </span>
              </div>

              {/* Price Box */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Selling Price (LKR)</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
                    {formatLKR(product.sellingPriceLkr)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block">
                    In Stock &amp; Ready to Dispatch
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Estimated Delivery: 2-4 Days
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-2">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Product Overview</h4>
                <p className="whitespace-pre-line">{product.description}</p>
              </div>

              {/* Color Options Selector */}
              {availableColors.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 uppercase tracking-wider">Select Color:</span>
                    <span className="text-cyan-400 font-semibold">{selectedColor || "None Selected"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((col: string) => {
                      const isSelected = selectedColor === col;
                      return (
                        <button
                          key={col}
                          type="button"
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
                  <div className="flex flex-wrap gap-2">
                    {availableVariants.map((v: string) => {
                      const isSelected = selectedVariant === v;
                      return (
                        <button
                          key={v}
                          type="button"
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
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>Product Dimensions &amp; Weight</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {height && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block uppercase">Height</span>
                        <span className="font-bold text-white text-xs">{height}</span>
                      </div>
                    )}
                    {width && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block uppercase">Width</span>
                        <span className="font-bold text-white text-xs">{width}</span>
                      </div>
                    )}
                    {length && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block uppercase">Length</span>
                        <span className="font-bold text-white text-xs">{length}</span>
                      </div>
                    )}
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
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Technical Specifications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {generalSpecs.map(([key, value]) => (
                      <div key={key} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex justify-between">
                        <span className="text-slate-400">{key}:</span>
                        <span className="font-semibold text-slate-200">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity & CTA Buttons */}
            <div className="space-y-4 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center border border-slate-700 rounded-xl bg-slate-900 overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 font-extrabold text-sm text-slate-100">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-100 font-bold py-3.5 px-6 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all text-xs cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-cyan-400" />
                  <span>Add to Shopping Cart</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-slate-950 font-extrabold py-3.5 px-6 rounded-xl shadow-neon transition-all text-xs cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now Quick Checkout</span>
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
                <span>Order via WhatsApp Direct (+94 72 141 0369)</span>
              </a>

              {/* Product Share Widget */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Share This Gadget:</span>
                  </span>
                  {copiedLink && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                      <Check className="w-3 h-3" />
                      <span>Link copied to clipboard!</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* WhatsApp Share */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product.title} on GizmoTek Sri Lanka:\nhttps://gizmotek.lk/products/${product.slug || product.id}`)}`}
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
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/products/${product.slug || product.id}`;
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(shareUrl);
                      } else {
                        const input = document.createElement("input");
                        input.value = shareUrl;
                        document.body.appendChild(input);
                        input.select();
                        document.execCommand("copy");
                        document.body.removeChild(input);
                      }
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
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
                    href={`mailto:?subject=${encodeURIComponent(`${product.title} - GizmoTek Sri Lanka`)}&body=${encodeURIComponent(`Hi,\n\nI found this tech product on GizmoTek.lk:\n${product.title}\nPrice: Rs. ${product.sellingPriceLkr.toLocaleString()}\n\nCheck it out here: https://gizmotek.lk/products/${product.slug || product.id}`)}`}
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
                        if (navigator.share) {
                          navigator.share({
                            title: product.title,
                            text: `Check out ${product.title} on GizmoTek Sri Lanka!`,
                            url: `https://gizmotek.lk/products/${product.slug || product.id}`,
                          }).catch(() => {});
                        }
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
        <div className="pt-10 border-t border-slate-800 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <span>Verified Customer Reviews</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Read verified customer feedback or share your experience.
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
              {reviewsList.length > 0 ? (
                reviewsList.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center border border-cyan-500/30">
                          {rev.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-200 text-xs">{rev.authorName}</span>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Verified Buyer
                          </span>
                        </div>
                      </div>

                      <div className="flex text-amber-400">
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
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-300">No Approved Reviews Yet</h4>
                  <p className="text-[11px] text-slate-500">
                    Be the first verified customer to submit a review for this tech product!
                  </p>
                </div>
              )}
            </div>

            {/* Submit Review Form (5 cols) */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>Write a Product Review</span>
                </h4>

                {reviewFeedback && (
                  <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs">
                    {reviewFeedback}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kasun Fernando"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Rating (1 to 5 Stars) *</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          className={`p-2 rounded-xl border transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
                    <label className="font-semibold text-slate-300">Your Product Review *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Share details about build quality, performance, and battery life..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none resize-none text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-cyan-600 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all shadow-neon cursor-pointer disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting Review..." : "Submit Review for Verification"}
                  </button>
                  <span className="text-[10px] text-slate-500 text-center block">
                    * Reviews are subject to admin moderation prior to public display.
                  </span>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Total (LKR)</span>
            <span className="text-sm font-extrabold text-cyan-400 truncate">
              {formatLKR(product.sellingPriceLkr * quantity)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAddToCart}
              className="bg-slate-900 hover:bg-slate-850 text-slate-100 p-3 rounded-xl border border-slate-700 font-bold text-xs min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer"
              title="Add to Cart"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={handleBuyNow}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-extrabold py-3 px-5 rounded-xl text-xs shadow-neon min-h-[42px] cursor-pointer"
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
