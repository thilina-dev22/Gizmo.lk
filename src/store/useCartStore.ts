import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  sellingPriceLkr: number;
  costPriceLkr: number;
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
}

export interface CartItem {
  id?: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedVariant?: string;
  warranty?: string;
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
  removeItem: (itemIdOrProductId: string) => void;
  updateQuantity: (itemIdOrProductId: string, quantity: number) => void;
  clearCart: () => void;
  setQuickViewProduct: (product: Product | null) => void;
  getSubtotal: () => number;
  getTotalCount: () => number;
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
        set((state) => {
          const color = options?.selectedColor || "";
          const variant = options?.selectedVariant || "";
          const warranty = options?.warranty || "";
          const itemKey = `${product.id}-${color}-${variant}`;

          const existingIndex = state.items.findIndex((item) => {
            const currentKey = item.id || `${item.product.id}-${item.selectedColor || ""}-${item.selectedVariant || ""}`;
            return currentKey === itemKey || (item.product.id === product.id && !color && !variant && !item.selectedColor && !item.selectedVariant);
          });

          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].quantity += quantity;
            if (color) updated[existingIndex].selectedColor = color;
            if (variant) updated[existingIndex].selectedVariant = variant;
            if (warranty) updated[existingIndex].warranty = warranty;
            return { items: updated, isOpen: true };
          } else {
            return {
              items: [
                ...state.items,
                {
                  id: itemKey,
                  product,
                  quantity,
                  selectedColor: color || undefined,
                  selectedVariant: variant || undefined,
                  warranty: warranty || undefined,
                },
              ],
              isOpen: true,
            };
          }
        });
      },

      removeItem: (itemIdOrProductId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.id !== itemIdOrProductId && item.product.id !== itemIdOrProductId
          ),
        }));
      },

      updateQuantity: (itemIdOrProductId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemIdOrProductId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === itemIdOrProductId || item.product.id === itemIdOrProductId) {
              return { ...item, quantity };
            }
            return item;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

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
