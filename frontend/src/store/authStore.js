import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchMe } from '../api/user';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      initialized: false,
      theme: 'light',
      setAuth: (user, token) => set({ user, token, initialized: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null, initialized: true }),
      setInitialized: (val) => set({ initialized: val }),
      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ initialized: true });
          return;
        }
        try {
          const user = await fetchMe();
          set({ user, initialized: true });
        } catch (err) {
          if (err.response?.status === 401) {
            set({ user: null, token: null, initialized: true });
          } else {
            set({ initialized: true });
          }
        }
      },
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: newTheme };
      }),
      initTheme: () => set((state) => {
        document.documentElement.setAttribute('data-theme', state.theme);
        if (state.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return {};
      }),
    }),
    {
      name: 'apple-todo-auth',
      partialize: (state) => ({ user: state.user, token: state.token, theme: state.theme }),
    }
  )
);
