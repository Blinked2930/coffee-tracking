# Technical Specifications: Kafe Tracker

## 1. Architecture
- **Frontend Framework:** Next.js (App Router) or Vite + React
- **Styling:** Tailwind CSS (for mobile-first, clean UI)
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
- **Hosting:** Vercel (for Next.js) or Netlify (for Vite)

## 2. Database Schema (Supabase)

### Table: `users`
- `id`: UUID (Primary Key)
- `name`: String (One of the 8 volunteers)
- `pin`: String (Hashed PIN for login)
- `avatar_url`: String (Optional)
- `created_at`: Timestamp

### Table: `kafes`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to `users`)
- `type`: String (Enum: 'standard', 'espresso', 'macchiato', 'freddo', etc.)
- `location`: String (Optional)
- `notes`: Text (Optional)
- `photo_url`: String (Optional)
- `created_at`: Timestamp

## 3. PWA Configuration
- `manifest.json`: Defines app name, short name, icons (192x192, 512x512), theme color, background color, and display mode (`standalone`).
- `service-worker.js`: Basic caching for offline capability and fast loading.

## 4. Key Components
- `LoginScreen`: Form for Name and PIN.
- `HomeTab`: Contains the main CTA button and emoji toggles.
- `DetailsModal`: For adding location, photos, and notes.
- `FeedTab`: List component mapping over fetched `kafes` data.
- `LeaderboardTab`: Aggregated view of `kafes` grouped by `user_id`.