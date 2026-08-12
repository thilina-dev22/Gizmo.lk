"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product } from "@/store/useCartStore";
import { CATEGORIES } from "@/lib/constants";
import { formatLKR } from "@/lib/utils";
import { Plus, Edit, Trash2, ExternalLink, Package, RefreshCw, X, Check, Search } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Audio");
  const [sellingPriceLkr, setSellingPriceLkr] = useState("");
  const [costPriceLkr, setCostPriceLkr] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("20");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [supplierLink, setSupplierLink] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setTitle(product.title);
      setCategory(product.category);
      setSellingPriceLkr(String(product.sellingPriceLkr));
      setCostPriceLkr(String(product.costPriceLkr));
      setSku(product.sku);
      setStock(String(product.stock));
      const imgs = JSON.parse(product.images || "[]");
      setImageUrl(imgs[0] || "");
      setDescription(product.description || "");
      setSupplierLink(product.supplierLink || "");
      setSupplierNotes(product.supplierNotes || "");
      setIsFeatured(product.isFeatured);
      setIsBestSeller(product.isBestSeller);
    } else {
      setEditingProduct(null);
      setTitle("");
      setCategory("Audio");
      setSellingPriceLkr("");
      setCostPriceLkr("");
      setSku(`GZ-${Math.floor(1000 + Math.random() * 9000)}`);
      setStock("10");
      setImageUrl("");
      setDescription("");
      setSupplierLink("");
      setSupplierNotes("");
      setIsFeatured(false);
      setIsBestSeller(false);
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title,
        category,
        sellingPriceLkr,
        costPriceLkr,
        sku,
        stock,
        images: [imageUrl],
        description,
        supplierLink,
        supplierNotes,
        isFeatured,
        isBestSeller,
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
            Product Catalog & Stock Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage cost price vs selling price, supplier links, and stock levels in LKR.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-neon transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">SKU & Category</th>
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
              ) : products.map((product) => {
                const imgs = JSON.parse(product.images || "[]");
                const profitLkr = product.sellingPriceLkr - product.costPriceLkr;
                return (
                  <tr key={product.id} className="hover:bg-slate-850 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                          <Image src={imgs[0] || "/placeholder.jpg"} alt={product.title} fill className="object-cover" />
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
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold text-slate-200">
                        {product.stock} pcs
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
                        <a
                          href={`/products/${product.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-cyan-400 hover:text-cyan-300 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                          title="View Product on Storefront"
                        >
                          <Search className="w-3 h-3" />
                          <span>View</span>
                        </a>
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-950 rounded-lg border border-slate-800"
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">
                {editingProduct ? "Edit Product" : "Add New Inventory Product"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
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
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
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

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Main Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none"
                />
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
                      className="text-[10px] text-cyan-400 hover:underline font-medium"
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
                <label className="font-semibold text-slate-300">Supplier Notes</label>
                <textarea
                  rows={2}
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  placeholder="Notes about supplier shipping times or packaging"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 font-semibold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
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
