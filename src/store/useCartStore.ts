import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getMaxPurchasableQuantity } from "@/lib/utils";

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  sellingPriceLkr: number;
  /** Only present in admin API responses. */
  costPriceLkr?: number;
  sku: string;
  stock: number;
  images: string; // JSON string array
  specs?: string | null;
  supplierLink?: string | null;
  supplierNotes?: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
}

export interface CartItem {
  id?: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedVariant?: string;
  warranty?: string;
}

export interface CartSyncResult {
  removedTitles: string[];
  priceChanged: boolean;
  quantityAdjusted: boolean;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  quickViewProduct: Product | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (
    product: Product,
    quantity?: number,
    options?: { selectedColor?: string; selectedVariant?: string; warranty?: string }
  ) => void;
  removeItem: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  clearCart: () => void;
  syncProducts: (freshProducts: Product[]) => CartSyncResult;
  setQuickViewProduct: (product: Product | null) => void;
  getSubtotal: () => number;
  getTotalCount: () => number;
}

export function getCartItemKey(item: CartItem): string {
  return item.id || `${item.product.id}-${item.selectedColor || ""}-${item.selectedVariant || ""}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      quickViewProduct: null,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product, quantity = 1, options) => {
        const maxQuantity = getMaxPurchasableQuantity(product.stock);
        if (maxQuantity <= 0 || quantity <= 0) return;

        set((state) => {
          const color = options?.selectedColor || "";
          const variant = options?.selectedVariant || "";
          const warranty = options?.warranty || "";
          const itemKey = `${product.id}-${color}-${variant}`;

          const existingIndex = state.items.findIndex((item) => getCartItemKey(item) === itemKey);

          if (existingIndex > -1) {
            // Replace the item immutably so subscribed components re-render
            const items = state.items.map((item, index) =>
              index === existingIndex
                ? {
                    ...item,
                    id: itemKey,
                    product,
                    quantity: Math.min(item.quantity + quantity, maxQuantity),
                    warranty: warranty || item.warranty,
                  }
                : item
            );
            return { items, isOpen: true };
          }

          return {
            items: [
              ...state.items,
              {
                id: itemKey,
                product,
                quantity: Math.min(quantity, maxQuantity),
                selectedColor: color || undefined,
                selectedVariant: variant || undefined,
                warranty: warranty || undefined,
              },
            ],
            isOpen: true,
          };
        });
      },

      removeItem: (itemKey) => {
        set((state) => ({
          items: state.items.filter((item) => getCartItemKey(item) !== itemKey),
        }));
      },

      updateQuantity: (itemKey, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemKey);
          return;
        }
        set((state) => ({
          items: state.items.map((item) => {
            if (getCartItemKey(item) !== itemKey) return item;
            const maxQuantity = getMaxPurchasableQuantity(item.product.stock);
            return { ...item, quantity: Math.max(1, Math.min(quantity, maxQuantity || 1)) };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      // Refresh prices & stock from the server and drop products that no longer exist / sold out
      syncProducts: (freshProducts) => {
        const freshById = new Map(freshProducts.map((product) => [product.id, product]));
        const result: CartSyncResult = { removedTitles: [], priceChanged: false, quantityAdjusted: false };

        const items = get().items.flatMap((item) => {
          const fresh = freshById.get(item.product.id);
          const maxQuantity = fresh ? getMaxPurchasableQuantity(fresh.stock) : 0;
          if (!fresh || maxQuantity <= 0) {
            result.removedTitles.push(item.product.title);
            return [];
          }
          if (fresh.sellingPriceLkr !== item.product.sellingPriceLkr) result.priceChanged = true;
          const quantity = Math.min(item.quantity, maxQuantity);
          if (quantity !== item.quantity) result.quantityAdjusted = true;
          return [{ ...item, product: fresh, quantity }];
        });

        set({ items });
        return result;
      },

      setQuickViewProduct: (product) => set({ quickViewProduct: product }),

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.sellingPriceLkr * item.quantity,
          0
        );
      },

      getTotalCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "gizmotek-cart-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
