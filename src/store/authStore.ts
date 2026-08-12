import { create } from "zustand";
import type { User } from "firebase/auth";

interface AuthState {
  user: User | null;
  initializing: boolean;
  setUser: (user: User | null) => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  setUser: (user) => set({ user }),
  setInitializing: (value) => set({ initializing: value }),
}));
