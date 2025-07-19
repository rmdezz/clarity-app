import { create, StateCreator } from 'zustand';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  setToken: (token: string) => void;
  setTokens: (tokens: { access: string; refresh: string }) => void;
  clearSession: () => void;
}

const sessionStateCreator: StateCreator<SessionState> = (set) => ({
  accessToken: null,
  refreshToken: null,
  setTokens: (tokens) => set({ 
    accessToken: tokens.access, 
    refreshToken: tokens.refresh 
  }),
  clearSession: () => set({ 
    accessToken: null, 
    refreshToken: null 
  }),
});

export const useSessionStore = create<SessionState>(sessionStateCreator);