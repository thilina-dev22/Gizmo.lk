import { create } from "zustand";

interface LoadingStore {
  pendingRequests: number;
  beginRequest: () => void;
  endRequest: () => void;
}

/** Counts in-flight API requests so a global progress bar can show while data is fetching. */
export const useLoadingStore = create<LoadingStore>()((set) => ({
  pendingRequests: 0,
  beginRequest: () => set((state) => ({ pendingRequests: state.pendingRequests + 1 })),
  endRequest: () => set((state) => ({ pendingRequests: Math.max(0, state.pendingRequests - 1) })),
}));
