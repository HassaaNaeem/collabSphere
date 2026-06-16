# CollabSphere — Frontend

A minimal, editorial frontend for **CollabSphere**, the platform connecting social
media influencers with media houses. Built to match the project proposal.

## Stack
- **React 18 + Vite**
- **React Router DOM** — routing (incl. 6 auth routes, one per actor × mode)
- **Framer Motion** — premium, restrained animations
- **React Hook Form** — all auth forms
- **date-fns** — date formatting / relative times
- **Context API + useReducer** — auth & theme state (current phase)
- **@tanstack/react-query** — already wired in `App.jsx`, ready for the backend phase
- **lucide-react** — icons

## Getting started
```bash
npm install
npm run dev      # http://localhost:5173
```

## Theme
Light/dark theme toggle in the top-right of every screen. Preference is stored in
`localStorage` and respects the OS setting on first load. Theming is driven by CSS
variables under `[data-theme]` in `src/index.css`.

## Routes
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login/influencer` · `/signup/influencer` | Influencer auth |
| `/login/brand` · `/signup/brand` | Media house auth |
| `/login/admin` · `/signup/admin` | Super admin auth |
| `/app/influencer` | Influencer dashboard (+ `/campaigns`, `/contracts`) |
| `/app/brand` | Media house dashboard (+ `/influencers`, `/campaigns`) |
| `/app/admin` | Super admin overview (+ `/verifications`, `/reviews`) |

Protected routes are guarded by `RequireAuth`, which redirects to the correct
login and keeps each actor inside their own area.

> **Demo auth:** any email + password (6+ chars) signs you in — there is no backend
> yet. After login you're routed to that role's dashboard.

## Project structure
```
src/
├── App.jsx                 # providers (QueryClient, Theme, Auth) + Router
├── index.css               # design system + light/dark tokens
├── context/                # ThemeContext, AuthContext (useReducer)
├── data/dummyData.js       # dummy entities (matches proposal)
├── services/api.js         # promise-based service layer (→ TanStack Query later)
├── router/AppRoutes.jsx    # all routes + page transitions
├── components/
│   ├── ui/                 # primitives, ThemeToggle
│   ├── layout/             # AppLayout (sidebar + topbar)
│   ├── auth/               # AuthForm (RHF), RequireAuth
│   └── motion/             # shared Framer variants
└── pages/                  # Landing, dashboards, discovery, admin, 404
```

## Moving to the real backend (next phase)
The data layer is already isolated in `src/services/api.js`. Each function returns a
promise of dummy data today. To go live:

1. Replace each `api.*` body with a `fetch('/api/...')` call to the Express server.
2. Swap the `useEffect + useState` data loads in pages for TanStack Query:
   ```js
   const { data, isLoading } = useQuery({
     queryKey: ['campaigns', filters],
     queryFn: () => api.getCampaigns(filters),
   })
   ```
3. Point auth `LOGIN` / `SIGNUP` actions at the backend (JWT) instead of dummy auth.

No component refactor required — the boundaries are already in place.

