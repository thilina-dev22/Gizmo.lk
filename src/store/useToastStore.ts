import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  show: (tone: ToastTone, message: string, durationMs?: number) => void;
  dismiss: (id: number) => void;
}

let nextToastId = 1;

export const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],
  show: (tone, message, durationMs = 4000) => {
    const id = nextToastId++;
    // Keep at most 4 toasts on screen
    set((state) => ({ toasts: [...state.toasts.slice(-3), { id, tone, message }] }));
    setTimeout(() => get().dismiss(id), durationMs);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().show("success", message),
  error: (message: string) => useToastStore.getState().show("error", message, 6000),
  info: (message: string) => useToastStore.getState().show("info", message),
};
