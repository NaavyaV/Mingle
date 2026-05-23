# Mingle Server

Tiny Express + Mongoose API that backs the Mingle app.

## Setup

1. Install deps

   ```bash
   cd server
   npm install
   ```

2. Configure your MongoDB Atlas URI

   ```bash
   cp .env.example .env
   # then edit .env and paste your Atlas connection string
   ```

   The connection string lives in **Atlas → your cluster → Connect → Drivers**. Make
   sure to:
   - URL-encode special characters in the password.
   - Include a database name (we use `mingle`) before the `?` in the URI.
   - Allow your dev machine's IP under **Network Access** in Atlas.

3. Run it

   ```bash
   npm run dev   # auto-restarts on file change (Node ≥ 18)
   # or
   npm start
   ```

   The API listens on `http://localhost:4000` by default.

## API surface

| Method | Path                                | Notes                                      |
| ------ | ----------------------------------- | ------------------------------------------ |
| GET    | `/api/health`                       | Health check                               |
| GET    | `/api/users`                        | List every user (used by Home screen)      |
| GET    | `/api/users/by-username/:username`  | Lookup by username (used for login)        |
| POST   | `/api/users`                        | Create user; generates a unique `username` |
| PATCH  | `/api/users/:id`                    | Partial update (cannot change `username`)  |

## How the client finds the server

The Expo client (`src/api/client.js`) figures out the base URL in this order:

1. `EXPO_PUBLIC_API_URL` env var (set in the project root before `expo start`).
2. The LAN host that Expo dev server is bound to, on port `4000` — works on a
   physical device on the same Wi-Fi without any code changes.
3. Falls back to `localhost:4000` (iOS simulator) or `10.0.2.2:4000` (Android
   emulator).
