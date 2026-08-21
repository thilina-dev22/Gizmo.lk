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
} from "lucide-react";



const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(FALLBACK_IMAGE);
  const [quantity, setQuantity] = useState(1);

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
        const imgs = safeParseImages(data.product?.images);
        setActiveImage(imgs[0] || FALLBACK_IMAGE);
      }
    } catch (err) {
      console.error("Fetch product error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${id}`);
      const data = await res.json();
      setReviewsList(data.reviews || []);
    } catch (err) {
      console.error("Fetch reviews error:", err);
      setReviewsList([]);
    }
  };

  const handleAddToCart = () => {
    if (product) addItem(product, quantity);
  };

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity);
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
  const specs: Record<string, string> = safeParseSpecs(product.specs);

  const whatsappMessage = encodeURIComponent(
    `Hi GizmoTek.lk! I want to order:\n*Product*: ${product.title}\n*Price*: Rs. ${product.sellingPriceLkr.toLocaleString()}\n*Qty*: ${quantity}\n*Link*: https://gizmotek.lk/products/${product.id}`
  );

  const displayRating = product.rating || 0;
  const displayCount = product.reviewCount || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
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
            <div className="relative h-96 sm:h-[450px] w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
              <OptimizedImage
                src={activeImage}
                alt={product.title}
                fill
                priority
              />
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                {product.isBestSeller && (
                  <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full shadow">
                    Best Seller
                  </span>
                )}
                <span className="bg-cyan-500/20 text-cyan-400 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full border border-cyan-500/30">
                  {product.category}
                </span>
              </div>
            </div>

            {/* Thumbnail Selector */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((imgUrl, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(imgUrl)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImage === imgUrl ? "border-cyan-400 scale-105" : "border-slate-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <OptimizedImage
                      src={imgUrl}
                      alt={`${product.title} thumb ${i}`}
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
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                  SKU: {product.sku}
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-1 leading-tight">
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
                    In Stock & Ready to Dispatch
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Estimated Delivery: 2-4 Days
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-2">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Product Overview</h4>
                <p>{product.description}</p>
              </div>

              {/* Specs Table */}
              {Object.keys(specs).length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Technical Specifications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(specs).map(([key, value]) => (
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
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>7-Day Replacement</span>
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
