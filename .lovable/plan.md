

# Pango - Property Rental Platform for Dar es Salaam

## Overview
A modern property rental marketplace connecting verified landlords with renters in Dar es Salaam, Tanzania. Built as a responsive web app with Lovable Cloud (Supabase) for backend.

## Architecture

```text
┌─────────────────────────────────────┐
│           Frontend (React)          │
│  Pages: Home, Search, Listing,     │
│  Dashboard (Owner/Renter/Admin)    │
├─────────────────────────────────────┤
│        Lovable Cloud (Supabase)     │
│  Auth │ Database │ Storage │ RLS   │
├─────────────────────────────────────┤
│        External Services            │
│  Leaflet Maps │ Payments (later)   │
└─────────────────────────────────────┘
```

## Phase 1: Foundation

### Database Schema
- **profiles** — user profile data (name, phone, avatar, bio)
- **user_roles** — role management (admin, landlord, renter) using enum + security definer function
- **properties** — listings (title, description, price, type, rooms, amenities, location coords, address, status)
- **property_images** — multiple images per property (stored in Supabase Storage)
- **nearby_services** — hospitals, transport, markets, roads linked to properties
- **favorites** — saved listings for renters
- RLS policies on all tables

### Authentication
- Email/password signup with role selection (landlord or renter)
- Landlord verification flow (admin approves before they can list)
- Protected routes based on role

## Phase 2: Core Pages

### Public Pages
1. **Landing Page** — hero with search bar, featured listings, how-it-works section, Dar es Salaam focused branding
2. **Search/Browse** — filterable grid (price range, location/area, property type), sort options
3. **Property Detail** — image gallery, description, amenities, nearby services, map with location pin, landlord contact info
4. **Auth Pages** — login, signup (with role selection), forgot password

### Landlord Dashboard
- My listings (add/edit/delete)
- Property form: multi-step with image uploads, amenity checkboxes, nearby services, map pin selector
- Listing status (pending verification, active, inactive)

### Renter Dashboard
- Saved/favorite listings
- Contact history

### Admin Dashboard
- User management (verify/suspend landlords)
- Listing moderation (approve/reject)
- Platform stats

## Phase 3: Map & Media

- **Leaflet + OpenStreetMap** for map integration (free, no API key needed)
- Property location picker for landlords (click on map to set coords)
- Map view for search results
- Satellite/aerial view toggle
- **Supabase Storage** bucket for property images with public read access

## Phase 4: Polish & Mobile

- Fully responsive design for mobile browsers
- Touch-friendly UI, bottom navigation on mobile
- Image optimization and lazy loading
- Swahili/English language considerations in UI copy

## Technical Decisions
- **Maps**: Leaflet + OpenStreetMap (free) instead of Google Maps
- **Storage**: Supabase Storage for property images
- **Auth**: Lovable Cloud auth with email/password
- **Payments**: Deferred to later phase — will use built-in Lovable payments when ready
- **Styling**: Tailwind CSS with a warm, modern color palette suited to the Dar es Salaam market

## Implementation Order
1. Enable Lovable Cloud + set up database schema and RLS
2. Auth pages with role-based signup
3. Landing page and property listing UI
4. Property detail page with image gallery
5. Landlord dashboard with listing creation form
6. Search and filter functionality
7. Map integration with Leaflet
8. Favorites system for renters
9. Admin dashboard for verification
10. Mobile responsiveness polish

