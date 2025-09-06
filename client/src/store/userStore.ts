import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "../api/apiClient";

export type User = {
  id: string;
  email: string;
  name: string;
  lastname: string;
  roles: string[];
};

type UserState = {
  user: User | null;
  setUser: (u: User | null) => void;
  fetchUser: () => Promise<void>;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, _get) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      fetchUser: async () => {
        try {
          const res = await apiClient.get("/auth/me");
          set({ user: res.data });
        } catch (e) {
          console.error("Error fetching user (store):", e);
          set({ user: null });
        }
      },
    }),
    {
      name: "user",
      partialize: (state) => ({ user: state.user }),
      version: 1,
    }
  )
);
