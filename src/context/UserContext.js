import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

const STORAGE_KEY = 'mingle.currentUser';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          setUser(cached);
          // Refresh from server in background; ignore failures (offline / no backend yet)
          if (cached?.username) {
            api
              .getUserByUsername(cached.username)
              .then((fresh) => {
                if (fresh) {
                  setUser(fresh);
                  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)).catch(() => {});
                }
              })
              .catch(() => {});
          }
        }
      } catch (e) {
        // ignore
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setUser(next);
    if (next) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const signIn = useCallback(
    async (username) => {
      const fetched = await api.getUserByUsername(username.trim());
      await persist(fetched);
      return fetched;
    },
    [persist]
  );

  const signUp = useCallback(
    async (payload) => {
      const created = await api.createUser(payload);
      await persist(created);
      return created;
    },
    [persist]
  );

  const signOut = useCallback(async () => {
    await persist(null);
  }, [persist]);

  const value = useMemo(
    () => ({ user, hydrated, signIn, signUp, signOut, setUser: persist }),
    [user, hydrated, signIn, signUp, signOut, persist]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
