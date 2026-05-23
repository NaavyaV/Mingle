import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // Fall back to LAN host of the Expo dev server so a phone on the same
  // network can reach the backend without code changes. The simulator
  // hits localhost just fine.
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:4000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}

export const API_BASE_URL = resolveBaseUrl();
console.log('[api] base URL ->', API_BASE_URL);

async function request(path, { method = 'GET', body, signal } = {}) {
  const url = `${API_BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = { raw: text };
    }
    if (!res.ok) {
      const message = data?.error || `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    if (err && err.message === 'Network request failed') {
      console.log('[api] network error reaching', url);
      const friendly = new Error(
        `Can't reach the server at ${API_BASE_URL}. Make sure your backend is running (cd server && npm run dev) and that your phone/simulator is on the same network.`
      );
      friendly.status = 0;
      friendly.cause = err;
      throw friendly;
    }
    throw err;
  }
}

export const api = {
  // users
  listUsers: () => request('/api/users'),
  getUserByUsername: (username) =>
    request(`/api/users/by-username/${encodeURIComponent(username)}`),
  createUser: (payload) => request('/api/users', { method: 'POST', body: payload }),
  updateUser: (id, patch) =>
    request(`/api/users/${id}`, { method: 'PATCH', body: patch }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),

  // friends
  getFriends: (username) =>
    request(`/api/friends/${encodeURIComponent(username)}`),
  requestFriend: (from, to) =>
    request('/api/friends/request', { method: 'POST', body: { from, to } }),
  acceptFriend: (me, other) =>
    request('/api/friends/accept', { method: 'POST', body: { me, other } }),
  removeFriend: (me, other) =>
    request('/api/friends', { method: 'DELETE', body: { me, other } }),

  // messages
  listConversations: (username) =>
    request(`/api/messages/conversations/${encodeURIComponent(username)}`),
  getThread: (me, other) =>
    request(
      `/api/messages/thread?me=${encodeURIComponent(me)}&other=${encodeURIComponent(other)}`
    ),
  sendMessage: (payload) =>
    request('/api/messages', { method: 'POST', body: payload }),

  // events
  listEvents: () => request('/api/events'),
  getEvent: (id) => request(`/api/events/${encodeURIComponent(id)}`),
  createEvent: (payload) => request('/api/events', { method: 'POST', body: payload }),
  setEventGoing: (id, username, going) =>
    request(`/api/events/${encodeURIComponent(id)}/going`, {
      method: 'POST',
      body: { username, going },
    }),
};
