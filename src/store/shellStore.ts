import { create } from "zustand";

type ShellState = {
  userName?: string;
  userRank?: string;
  avatarUrl?: string;
  balance?: number;
  hydrated: boolean;
  setShellData: (data: {
    userName?: string;
    userRank?: string;
    avatarUrl?: string;
    balance?: number;
  }) => void;
};

export const useShellStore = create<ShellState>((set) => ({
  userName: undefined,
  userRank: undefined,
  avatarUrl: undefined,
  balance: undefined,
  hydrated: false,
  setShellData: (data) =>
    set({
      ...data,
      hydrated: true,
    }),
}));
