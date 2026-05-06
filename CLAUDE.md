# Lolapabouillet

## What is this app?
A festival weekend organiser for ~30 friends.
Lollapalooza-inspired with pastel colors and floral theme.

## Tech Stack
- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (database, auth, storage)
- Leaflet.js (map)
- Lilita One (Google Font for logo)

## Design System
- Background: #FFF8F0 (cream)
- Pink: #F4A7B9
- Lavender: #C9B8E8
- Mint: #B8E4D8
- Charcoal: #2D2D2D
- Logo font: Lilita One, uppercase, white,
  WebkitTextStroke: 2px #2D2D2D
- Buttons: pill-shaped
- Cards: soft rounded corners, gentle shadow
- Mobile-first

## Event
- Name: Lolapabouillet
- Date: Friday 22 May 2026 at 19:00
- Location: 18 route du Passoir

## Pages (bottom nav order)
1. /profile       → Profile & Join form
2. /announcements → News feed
3. /planning      → Artists + Schedule (Artists tab only live)
4. /cars          → Carpooling
5. /tents         → Sleeping arrangements
6. /map           → Driver map (Leaflet)

## Database Tables
users, cars, car_passengers, tents, tent_guests,
announcements, djs, events, settings

## Key Rules
- Always run npx tsc --noEmit after changes
- One feature per prompt, one page at a time
- Never touch files not mentioned in the prompt
- Always use shared components from /components/ui
- Always mobile-first
