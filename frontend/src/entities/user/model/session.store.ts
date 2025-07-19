import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setTokens: (tokens: { access: string; refresh: string }) => void;
  clearSession: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

const sessionStateCreator: StateCreator<
  SessionState,
  [],
  [],
  SessionState
> = (set) => ({
  accessToken: null,
  refreshToken: null,
  _hasHydrated: false,
  setTokens: (tokens) => {
    set({ 
      accessToken: tokens.access, 
      refreshToken: tokens.refresh 
    });
  },
  clearSession: () => {
    set({ 
      accessToken: null, 
      refreshToken: null 
    });
  },
  setHasHydrated: (hasHydrated) => {
    set({ _hasHydrated: hasHydrated });
  },
});

export const useSessionStore = create<SessionState>()(
  persist(
    sessionStateCreator,
    {
      name: 'session-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken 
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);