import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { api } from '../api/client';
import { useUser } from './UserContext';

/**
 * Background unread-message tracker.
 *
 * Polls /api/messages/conversations on a slow interval (and immediately
 * when the app foregrounds or screens explicitly call `refresh()`) and
 * exposes the per-conversation unread map plus a total count. The
 * TabNavigator reads the total to drive the Messages tab badge.
 */
const UnreadContext = createContext({
  total: 0,
  unreadByUser: {},
  refresh: async () => {},
});

const POLL_MS = 8000;

export function UnreadProvider({ children }) {
  const { user } = useUser();
  const [unreadByUser, setUnreadByUser] = useState({});
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (!user?.username || inflight.current) return;
    inflight.current = true;
    try {
      const convos = await api.listConversations(user.username);
      const next = {};
      for (const c of convos || []) {
        if (c.unread > 0) next[c.other] = c.unread;
      }
      setUnreadByUser(next);
    } catch {
      /* network blips are fine — we'll retry on next tick */
    } finally {
      inflight.current = false;
    }
  }, [user?.username]);

  // Wipe state on sign out so a stale badge from a previous user can't
  // leak across sessions.
  useEffect(() => {
    if (!user?.username) setUnreadByUser({});
  }, [user?.username]);

  // Periodic polling while signed in.
  useEffect(() => {
    if (!user?.username) return undefined;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [user?.username, refresh]);

  // Foreground refresh — when the user returns to the app after a
  // backgrounded period we want the badge to update right away.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const total = useMemo(
    () => Object.values(unreadByUser).reduce((s, n) => s + n, 0),
    [unreadByUser]
  );

  const value = useMemo(() => ({ total, unreadByUser, refresh }), [
    total,
    unreadByUser,
    refresh,
  ]);

  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}

export function useUnread() {
  return useContext(UnreadContext);
}
