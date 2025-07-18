import { create, StateCreator } from 'zustand';

interface SessionState {
  token: string | null;
  setToken: (token: string) => void;
  clearSession: () => void;
}

const sessionStateCreator: StateCreator<SessionState> = (set) => ({
  token: null,
  setToken: (token: string) => set({ token }),
  clearSession: () => set({ token: null }),
});

export const useSessionStore = create<SessionState>(sessionStateCreator);