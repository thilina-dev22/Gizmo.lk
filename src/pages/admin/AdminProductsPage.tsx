import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Product } from "@/store/useCartStore";
import { CATEGORIES } from "@/lib/constants";
import { formatLKR, safeParseImages } from "@/lib/utils";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import {
  Plus,
  Edit,
  ExternalLink,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Audio");
  const [sellingPriceLkr, setSellingPriceLkr] = useState("");
  const [costPriceLkr, setCostPriceLkr] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("20");
  const [imageUrl, setImageUrl] = useState("");
  const [additionalImages, setAdditionalImages] = useState("");
  const [description, setDescription] = useState("");
  const [specsText, setSpecsText] = useState("");
  const [supplierLink, setSupplierLink] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [rating, setRating] = useState("0");
  const [reviewCount, setReviewCount] = useState("0");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error("Admin products error:", e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category match
      if (selectedCategory !== "ALL" && product.category !== selectedCategory) {
        return false;
      }

      // Stock status match
      if (stockFilter === "IN_STOCK" && product.stock <= 5) return false;
      if (stockFilter === "LOW_STOCK" && (product.stock <= 0 || product.stock > 5)) return false;
      if (stockFilter === "OUT_OF_STOCK" && product.stock > 0) return false;

      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const t = (product.title || "").toLowerCase();
        const s = (product.sku || "").toLowerCase();
        const c = (product.category || "").toLowerCase();
        const slug = (product.slug || "").toLowerCase();
        return t.includes(q) || s.includes(q) || c.includes(q) || slug.includes(q);
      }

      return true;
    });
  }, [products, selectedCategory, stockFilter, searchQuery]);

  // Reset page to 1 when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, stockFilter, itemsPerPage]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setTitle(product.title);
      setCategory(product.category);
      setSellingPriceLkr(String(product.sellingPriceLkr));
      setCostPriceLkr(String(product.costPriceLkr));
      setSku(product.sku);
      setStock(String(product.stock));
      const imgs = safeParseImages(product.images);
      setImageUrl(imgs[0] || "");
      setAdditionalImages(imgs.slice(1).join("\n"));
      setDescription(product.description || "");
      setSpecsText(
        product.specs
          ? typeof product.specs === "string"
            ? product.specs
            : JSON.stringify(product.specs, null, 2)
          : ""
      );
      setSupplierLink(product.supplierLink || "");
      setSupplierNotes(product.supplierNotes || "");
      setIsFeatured(product.isFeatured);
      setIsBestSeller(product.isBestSeller);
      setRating(String(product.rating || 0));
      setReviewCount(String(product.reviewCount || 0));
    } else {
      setEditingProduct(null);
      setTitle("");
      setCategory("Audio");
      setSellingPriceLkr("");
      setCostPriceLkr("");
      setSku(`GZ-${Math.floor(1000 + Math.random() * 9000)}`);
      setStock("10");
      setImageUrl("");
      setAdditionalImages("");
      setDescription("");
      setSpecsText("");
      setSupplierLink("");
      setSupplierNotes("");
      setIsFeatured(false);
      setIsBestSeller(false);
      setRating("0");
      setReviewCount("0");
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const extraImgs = additionalImages
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const allImages = imageUrl ? [imageUrl, ...extraImgs] : extraImgs;

      const payload = {
        title,
        category,
        sellingPriceLkr: Number(sellingPriceLkr),
        costPriceLkr: Number(costPriceLkr || 0),
        sku,
        stock: Number(stock),
        images: allImages,
        description,
        specs: specsText,
        supplierLink,
        supplierNotes,
        isFeatured,
        isBestSeller,
        rating: Number(rating || 0),
        reviewCount: Number(reviewCount || 0),
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Product Catalog &amp; Stock Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage cost price vs selling price, supplier links, and stock levels in LKR.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-neon transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3 bg-slate-900/60 p-4 rounded-3xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Title, SKU (e.g. GZ-101), Category, Slug..."
              className="w-full bg-slate-950 text-slate-200 pl-10 pr-10 py-2 rounded-xl border border-slate-800 text-xs focus:border-cyan-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category & Per Page selector */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Categories ({products.length})</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({products.filter((p) => p.category === cat.name).length})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-2 py-1.5 text-xs outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stock status filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
          {[
            { id: "ALL", label: "All Inventory", count: products.length },
            {
              id: "IN_STOCK",
              label: "In Stock (>5)",
              count: products.filter((p) => p.stock > 5).length,
            },
            {
              id: "LOW_STOCK",
              label: "Low Stock (<=5)",
              count: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
            },
            {
              id: "OUT_OF_STOCK",
              label: "Out of Stock (0)",
              count: products.filter((p) => p.stock <= 0).length,
            },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStockFilter(st.id as any)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                stockFilter === st.id
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  stockFilter === st.id ? "bg-cyan-500/30 text-cyan-200" : "bg-slate-800 text-slate-400"
                }`}
              >
                {st.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">SKU &amp; Category</th>
                <th className="p-4">Cost Price (LKR)</th>
                <th className="p-4">Selling Price (LKR)</th>
                <th className="p-4">Est. Profit</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Supplier / Import Link</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Loading inventory...
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    {searchQuery
                      ? `No products matching "${searchQuery}".`
                      : "No products found for the selected filter."}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const imgs = safeParseImages(product.images);
                  const profitLkr = product.sellingPriceLkr - product.costPriceLkr;
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 5;

                  return (
                    <tr key={product.id} className="hover:bg-slate-850 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                            <OptimizedImage
                              src={
                                imgs[0] ||
                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"
                              }
                              alt={product.title}
                              fill
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-200 line-clamp-1 max-w-[200px]">{product.title}</h4>
                            <span className="text-[10px] text-cyan-400">{product.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-xs font-semibold text-slate-200">{product.sku}</div>
                        <span className="text-[10px] text-slate-400">{product.category}</span>
                      </td>
                      <td className="p-4 text-slate-400 font-mono">{formatLKR(product.costPriceLkr)}</td>
                      <td className="p-4 font-bold text-cyan-400 font-mono">{formatLKR(product.sellingPriceLkr)}</td>
                      <td className="p-4 font-bold text-emerald-400 font-mono">+{formatLKR(profitLkr)}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
                            isOutOfStock
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                              : isLowStock
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-slate-950 text-slate-200 border-slate-800"
                          }`}
                        >
                          {product.stock} pcs {isOutOfStock ? "(Out)" : isLowStock ? "(Low)" : ""}
                        </span>
                      </td>
                      <td className="p-4">
                        {product.supplierLink ? (
                          <a
                            href={product.supplierLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                          >
                            <span>Supplier URL</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600 text-[10px]">None</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${product.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 text-cyan-400 hover:text-cyan-300 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                            title="View Product on Storefront"
                          >
                            <Search className="w-3 h-3" />
                            <span>View</span>
                          </Link>
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-950 rounded-lg border border-slate-800 cursor-pointer"
                            title="Edit product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing <strong className="text-slate-200 font-mono">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
              <strong className="text-slate-200 font-mono">
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
              </strong>{" "}
              of <strong className="text-slate-200 font-mono">{filteredProducts.length}</strong> products
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-600">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[30px] h-[30px] rounded-lg border text-xs font-semibold transition-colors ${
                          currentPage === p
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 font-bold"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">
                {editingProduct ? "Edit Product" : "Add New Inventory Product"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Product Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Cost Price (LKR)</label>
                  <input
                    type="number"
                    value={costPriceLkr}
                    onChange={(e) => setCostPriceLkr(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Selling Price (LKR) *</label>
                  <input
                    type="number"
                    required
                    value={sellingPriceLkr}
                    onChange={(e) => setSellingPriceLkr(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Stock Qty</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Storefront Customer Content Section */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  Storefront Content & Product Page Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Main Product Image URL</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">
                      Additional Gallery Image URLs <span className="text-slate-500 font-normal">(One per line)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={additionalImages}
                      onChange={(e) => setAdditionalImages(e.target.value)}
                      placeholder="https://image2.jpg&#10;https://image3.jpg"
                      className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-800 outline-none resize-none text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Full Product Description (Storefront View) *</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter full product overview, features, package contents, and customer info..."
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none resize-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">
                    Key Tech Specs & Features <span className="text-slate-500 font-normal">(e.g. Battery: 24h, Bluetooth: 5.3)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={specsText}
                    onChange={(e) => setSpecsText(e.target.value)}
                    placeholder="Bluetooth 5.3, Active Noise Cancellation, 24h Playtime, IPX5 Waterproof"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none resize-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">
                      Initial Rating Score <span className="text-slate-500 font-normal">(0.0 to 5.0)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">
                      Initial Review Count <span className="text-slate-500 font-normal">(Default 0)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={reviewCount}
                      onChange={(e) => setReviewCount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Featured Product Drop</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Best Seller Badge</span>
                  </label>
                </div>
              </div>

              {/* Supplier & Import Section (Optional) */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Supplier & Import Source (Optional Internal Info)
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-300">
                      Supplier / Import Source URL <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    {supplierLink ? (
                      <button
                        type="button"
                        onClick={() => setSupplierLink("")}
                        className="text-[10px] text-cyan-400 hover:underline font-medium cursor-pointer"
                      >
                        Clear URL (Direct Local Stock)
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-medium">Direct / Local Wholesale Stock</span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={supplierLink}
                    onChange={(e) => setSupplierLink(e.target.value)}
                    placeholder="Leave blank for local stock, or enter e.g. https://aliexpress.com/item/123"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none text-xs placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Internal Supplier Notes</label>
                  <textarea
                    rows={2}
                    value={supplierNotes}
                    onChange={(e) => setSupplierNotes(e.target.value)}
                    placeholder="Internal notes about supplier shipping times or local distributor contacts"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none resize-none text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 font-semibold hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
