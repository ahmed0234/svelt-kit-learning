<div align="center">

# 🎬 CineShelf

**Browse movies, TV shows and anime from TMDB, and save your favourites into personal collections.**

![SvelteKit](https://img.shields.io/badge/SvelteKit-3-FF3E00?logo=svelte&logoColor=white)
![Svelte](<https://img.shields.io/badge/Svelte-5%20(runes)-FF3E00?logo=svelte&logoColor=white>)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk&logoColor=white)
![Drizzle](https://img.shields.io/badge/ORM-Drizzle-C5F74F?logo=drizzle&logoColor=black)
![Neon](https://img.shields.io/badge/DB-Neon%20Postgres-00E599?logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Bun](https://img.shields.io/badge/Package_manager-Bun-000000?logo=bun&logoColor=white)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Authentication](#-authentication)
- [Database Structure](#-database-structure)
- [Routes & Endpoints](#-routes--endpoints)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Conventions & Gotchas](#-conventions--gotchas)

---

## 🎯 About

CineShelf is a full-stack SvelteKit app for discovering films and shows. Anyone can browse
trending titles, search, and open detailed pages for movies, TV shows and people (actors and
crew). Signed-in users can create **collections** (for example "Watch later" or "90s sci-fi")
and save movies and TV shows into them.

All catalogue data comes live from the [TMDB API](https://developer.themoviedb.org/docs).
When a user saves a title, its key details are **copied into Postgres**, so opening a
collection later needs no TMDB calls at all.

---

## 🧰 Tech Stack

| Layer              | Technology                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**      | [SvelteKit 3](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev) (runes mode forced for all project files)                                               |
| **Language**       | TypeScript                                                                                                                                                          |
| **Build tool**     | Vite 8                                                                                                                                                              |
| **Styling**        | Tailwind CSS 4 (CSS-first config), `@tailwindcss/forms`, `@tailwindcss/typography`, `tw-animate-css`                                                                |
| **UI components**  | [shadcn-svelte](https://shadcn-svelte.com) (built on `bits-ui`, style `vega`), Lucide icons, `svelte-sonner` toasts, `embla-carousel-svelte`, `vaul-svelte` drawers |
| **Theming**        | `mode-watcher` (light / dark mode)                                                                                                                                  |
| **Authentication** | [Clerk](https://clerk.com) via `svelte-clerk`                                                                                                                       |
| **Database**       | [Neon](https://neon.tech) serverless PostgreSQL (`@neondatabase/serverless`, HTTP driver)                                                                           |
| **ORM**            | [Drizzle ORM](https://orm.drizzle.team) + `drizzle-kit` for migrations                                                                                              |
| **External API**   | [TMDB](https://www.themoviedb.org) v3 (movies, TV, people, images, videos)                                                                                          |
| **Deployment**     | Vercel (`@sveltejs/adapter-vercel`)                                                                                                                                 |
| **Tooling**        | Bun, ESLint, Prettier (+ Svelte and Tailwind plugins), `svelte-check`                                                                                               |

---

## ✨ Features

### 🍿 Discover

- **Home page** with a hero slider and many rows: trending movies (today and this week),
  popular movies, Action, Sci-Fi, Comedy, Horror, Thriller and Romance, popular and trending
  TV, TV drama, plus trending and popular anime.
- Each row **streams in on its own**, with its own loading state, so one failed request
  doesn't break the rest of the page.

### 🔍 Search

- **Navbar typeahead** with the top 6 matching movies and TV shows.
- Keyboard shortcuts: press **`/`** or **`Ctrl/⌘ + K`** to jump to search from anywhere.
- **Full search page** (`/search`) with a filter for _All_, _Movies_ or _TV_, and pagination.
  With an empty query it shows trending movies and TV instead.

### 🎞️ Detail pages

- **Movies:** overview, facts, cast, crew, YouTube trailers and videos (in a player dialog),
  reviews, keywords, a "More like this" row and **where to watch** (streaming
  providers for the visitor's country, detected from Vercel's `x-vercel-ip-country` header,
  defaulting to `US`).
- **TV shows:** the same, plus a **seasons and episodes** browser (`?season=` in the URL).
- **People (actors and crew):** biography and facts, social links, photo gallery, known-for
  titles, a filmography grouped by role, and videos from their best-known movies.

### 📚 Collections (signed-in users)

- Create, view and delete collections, each with a **name** (max 60 chars) and optional
  **description** (max 200 chars). Names are unique per user (case-insensitive).
- Save any movie **or** TV show from any card via a collection picker, or create a new
  collection and save the title into it in one step.
- **Optimistic UI:** saves and removals show up instantly and roll back if the server fails,
  with toast notifications (including _Undo_ after a removal).
- Collection cards show the title count, the last update time and a stack of up to 4 posters.
- Safety limits: up to **100 collections** per user and **1,000 titles** per collection.
- If a signed-out visitor tries to save, they get a sign-in prompt, and **the save resumes
  automatically** after they sign in.

### 🎨 UX

- Light / dark mode toggle.
- Loading progress bar and skeleton screens on navigation.
- Responsive layout with a dedicated mobile search.

---

## ⚙️ How It Works

```mermaid
flowchart LR
    B[Browser] -->|page loads & form actions| S[SvelteKit server<br/>+page.server.ts]
    S -->|locals.auth| C[Clerk]
    S -->|tmdb.ts, cached 10 min| T[TMDB API]
    S -->|Drizzle ORM| D[(Neon Postgres)]
```

- **All TMDB calls happen on the server** (`src/lib/server/tmdb.ts`), so the API key never
  reaches the browser. Responses are cached in memory per server instance for **10 minutes**,
  and every request times out after **8 seconds**.
- TV results are normalized to the same shape as movies (`name` → `title`,
  `first_air_date` → `release_date`), so the same cards can render both.
- **All database access** goes through `src/lib/server/db/collections.ts`. Every function
  takes the `userId` and checks ownership in its `WHERE` clause, so users can only ever see or
  change their own collections.
- When a title is saved, the server **looks it up on TMDB itself** (using only the
  `mediaType` + `tmdbId` from the form). Titles can't be forged by sending fake details.
- The root layout loads the user's collections (without blocking the page) so every movie
  card across the app knows whether it's already saved.

---

## 🔐 Authentication

Authentication is handled entirely by **Clerk**. There is no users table in the database:
collections store the Clerk user ID directly.

| Piece            | File                                           | What it does                                                                        |
| ---------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Server hook      | `src/hooks.server.ts`                          | `withClerkHandler()` verifies the session on every request and adds `locals.auth()` |
| Root layout load | `src/routes/+layout.server.ts`                 | Returns `buildClerkProps(locals.auth())` so Clerk knows who is signed in during SSR |
| Root layout      | `src/routes/+layout.svelte`                    | Wraps the app in `<ClerkProvider>`                                                  |
| Sign in page     | `src/routes/sign-in/[...sign-in]/+page.svelte` | Renders Clerk's `<SignIn />` component                                              |
| Sign up page     | `src/routes/sign-up/[...sign-up]/+page.svelte` | Renders Clerk's `<SignUp />` component                                              |
| Navbar           | `src/lib/components/navbar/user-menu.svelte`   | Shows _Sign in_ / _Sign up_ buttons, or Clerk's `<UserButton />` avatar menu        |

**Sign up / sign in flow**

1. The user clicks **Sign up** or **Sign in** in the navbar (or in the sign-in prompt that
   appears when they try to save a title).
2. They land on `/sign-up` or `/sign-in`, where Clerk's hosted UI handles the whole flow
   (email, social providers, verification, etc., depending on your Clerk dashboard settings).
   The catch-all routes (`[...sign-in]`) let Clerk use sub-paths for multi-step flows.
3. After success, Clerk redirects to the `redirect_url` (the page they came from) or to the
   fallback redirect URL (`/`).
4. On the server, any load or action reads the user with:

   ```ts
   const { userId } = locals.auth();
   ```

**Access rules:** browsing, search and detail pages are public. The `/collections` pages are
also public but show a sign-in prompt instead of data to signed-out visitors. Every
collection action returns `401` without a user. Someone else's collection returns `404`, just
like a missing one, so IDs can't be probed.

---

## 🗄️ Database Structure

The schema lives in `src/lib/server/db/schema.ts`. There are **two tables**.

> ℹ️ **Movies, TV shows, actors and crew are not stored as their own tables.** They are fetched
> live from TMDB. The only catalogue data in the database is the snapshot of a title copied
> into `collection_movies` when someone saves it. Actors are linked to movies through TMDB's
> credits data on the detail pages, not through the database.

```mermaid
erDiagram
    CLERK_USER ||--o{ COLLECTIONS : "owns (user_id)"
    COLLECTIONS ||--o{ COLLECTION_MOVIES : "contains (cascade delete)"

    CLERK_USER {
        string id "managed by Clerk, not a DB table"
    }
    COLLECTIONS {
        uuid id PK
        text user_id
        text name
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    COLLECTION_MOVIES {
        uuid id PK
        uuid collection_id FK
        text media_type "movie or tv"
        integer tmdb_movie_id
        text title
        text poster_path
        text overview
        double vote_average
        text release_date
        timestamptz added_at
    }
```

### `collections`

A named list owned by one Clerk user.

| Column        | Type          | Notes                                                                                                     |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `id`          | `uuid`        | Primary key, random default                                                                               |
| `user_id`     | `text`        | Clerk user ID, **not null**, indexed (`collections_user_id_idx`)                                          |
| `name`        | `text`        | **Not null** (app limits it to 60 chars, unique per user ignoring case)                                   |
| `description` | `text`        | Optional (app limits it to 200 chars)                                                                     |
| `created_at`  | `timestamptz` | Defaults to `now()`                                                                                       |
| `updated_at`  | `timestamptz` | Defaults to `now()`; bumped whenever a title is added or removed, so recently used collections sort first |

### `collection_movies`

A movie or TV show saved into a collection, with its details copied from TMDB at save time.

| Column          | Type               | Notes                                                   |
| --------------- | ------------------ | ------------------------------------------------------- |
| `id`            | `uuid`             | Primary key, random default                             |
| `collection_id` | `uuid`             | **FK → `collections.id`**, `ON DELETE CASCADE`, indexed |
| `media_type`    | `text`             | `'movie'` or `'tv'`, default `'movie'`                  |
| `tmdb_movie_id` | `integer`          | TMDB ID of the movie **or** TV show                     |
| `title`         | `text`             | **Not null**                                            |
| `poster_path`   | `text`             | TMDB image path                                         |
| `overview`      | `text`             | Plot summary                                            |
| `vote_average`  | `double precision` | TMDB rating out of 10                                   |
| `release_date`  | `text`             | Release / first air date                                |
| `added_at`      | `timestamptz`      | Defaults to `now()`                                     |

**Relationships & constraints**

- **One user → many collections** (via `collections.user_id`).
- **One collection → many saved titles** (via `collection_movies.collection_id`). Deleting a
  collection deletes all its titles.
- **Unique index** on `(collection_id, media_type, tmdb_movie_id)`: the same title can't be saved
  twice in one collection. `media_type` is part of the key because TMDB IDs are only unique
  per type (movie `1396` and TV show `1396` are different titles).
- Drizzle `relations()` are defined (`collections.movies` ↔ `collectionMovies.collection`), so
  the relational `db.query.*` API works.

---

## 🧭 Routes & Endpoints

### Pages

| Route                        | Auth                        | Description                                            |
| ---------------------------- | --------------------------- | ------------------------------------------------------ |
| `/`                          | Public                      | Home: hero slider and streamed movie / TV / anime rows |
| `/search?query=&type=&page=` | Public                      | Search results (`type` = `all`, `movie` or `tv`)       |
| `/movie/[id]`                | Public                      | Movie details                                          |
| `/tv/[id]?season=`           | Public                      | TV show details with seasons and episodes              |
| `/actor/[id]`                | Public                      | Person (actor or crew) details                         |
| `/collections`               | Public (data needs sign-in) | The user's collections                                 |
| `/collections/[id]`          | Owner only                  | One collection and its saved titles                    |
| `/sign-in/[...sign-in]`      | Public                      | Clerk sign in                                          |
| `/sign-up/[...sign-up]`      | Public                      | Clerk sign up                                          |

### API endpoint

| Method | Path                         | Description                                                                                              |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET`  | `/search/suggestions?query=` | JSON array of up to 6 movies and TV shows for the navbar typeahead. Cached by the browser for 5 minutes. |

### Form actions (`/collections`)

All collection changes are SvelteKit form actions in `src/routes/collections/+page.server.ts`.
The client calls them from anywhere in the app with `POST /collections?/<action>`.

| Action     | Fields                                                 | What it does                                               |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| `?/create` | `name`, `description`, optional `mediaType` + `tmdbId` | Creates a collection, and optionally saves a title into it |
| `?/delete` | `collectionId`                                         | Deletes a collection (and its titles)                      |
| `?/add`    | `collectionId`, `mediaType`, `tmdbId`                  | Saves a title into a collection                            |
| `?/remove` | `collectionId`, `mediaType`, `tmdbId`                  | Removes a title from a collection                          |

Errors come back as `fail()` responses with a user-friendly `message`
(`400` invalid input, `401` signed out, `404` missing collection or title, `409` duplicate name,
`502` TMDB unreachable).

---

## 📁 Project Structure

```text
.
├── src/
│   ├── app.d.ts                  # Global types (includes svelte-clerk env types)
│   ├── app.html                  # HTML shell
│   ├── env.ts                    # ⚠️ Declares all env vars (public / private)
│   ├── hooks.server.ts           # Clerk handler → locals.auth()
│   ├── lib/
│   │   ├── collections.ts        # Client-safe collection types, limits, helpers
│   │   ├── tmdb.ts               # Client-safe TMDB types + image URL helpers
│   │   ├── utils.ts              # cn() class merger
│   │   ├── hooks/                # Svelte hooks (e.g. IsMobile)
│   │   ├── server/               # 🔒 Server-only code
│   │   │   ├── tmdb.ts           #   TMDB API wrapper (cache, timeouts, normalizing)
│   │   │   ├── defer.ts          #   Stream-on-navigation helper
│   │   │   └── db/
│   │   │       ├── index.ts      #   Drizzle client (neon-http)
│   │   │       ├── schema.ts     #   Tables + relations
│   │   │       └── collections.ts#   Ownership-checked queries
│   │   └── components/
│   │       ├── ui/               # Generated shadcn-svelte components
│   │       ├── navbar/           # Navbar, search, logo, user menu
│   │       ├── movies/           # Cards, rows, hero slider, skeletons
│   │       ├── movie-details/    # Cast, crew, videos, reviews, watch providers...
│   │       ├── tv-details/       # Seasons and episodes
│   │       ├── person-details/   # Filmography, photos, social links
│   │       ├── collections/      # Picker, dialogs, save button, shared state
│   │       ├── search/           # Search result item
│   │       └── mode-switcher.svelte
│   └── routes/
│       ├── +layout.server.ts     # Clerk props + user's collections
│       ├── +layout.svelte        # Providers, navbar, toaster, loading UI
│       ├── +page.(server.)ts     # Home
│       ├── +error.svelte         # Error / 404 page
│       ├── layout.css            # Tailwind 4 config + theme tokens
│       ├── movie/[id]/           # Movie details
│       ├── tv/[id]/              # TV details
│       ├── actor/[id]/           # Person details
│       ├── search/               # Search page + suggestions/ JSON endpoint
│       ├── collections/          # Collections list + form actions
│       │   └── [id]/             # Single collection
│       ├── sign-in/[...sign-in]/ # Clerk sign in
│       └── sign-up/[...sign-up]/ # Clerk sign up
├── static/                       # Static files (robots.txt)
├── components.json               # shadcn-svelte config
├── drizzle.config.ts             # drizzle-kit config (reads DATABASE_URL from .env)
├── vite.config.ts                # Vite + SvelteKit config (adapter lives here)
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) (the project uses `bun.lock`)
- A [Clerk](https://clerk.com) application
- A [Neon](https://neon.tech) Postgres database (any Postgres reachable by the Neon serverless driver)
- A [TMDB](https://www.themoviedb.org/settings/api) API key (v3)

### 1. Clone and install

```sh
git clone <your-repo-url>
cd svelt-kit-app
bun install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Clerk (from the Clerk dashboard → API Keys)
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk routes
PUBLIC_CLERK_SIGN_IN_URL=/sign-in
PUBLIC_CLERK_SIGN_UP_URL=/sign-up
PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Neon Postgres connection string
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# TMDB v3 API key
TMDB_API=your_tmdb_api_key
```

| Variable                                     | Public? | Purpose                                                 |
| -------------------------------------------- | :-----: | ------------------------------------------------------- |
| `PUBLIC_CLERK_PUBLISHABLE_KEY`               |   ✅    | Clerk frontend key                                      |
| `CLERK_SECRET_KEY`                           |   ❌    | Clerk backend key, used to verify sessions              |
| `PUBLIC_CLERK_SIGN_IN_URL`                   |   ✅    | Path of the sign-in page                                |
| `PUBLIC_CLERK_SIGN_UP_URL`                   |   ✅    | Path of the sign-up page                                |
| `PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` |   ✅    | Where to go after sign-in if there's no `redirect_url`  |
| `PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` |   ✅    | Where to go after sign-up if there's no `redirect_url`  |
| `DATABASE_URL`                               |   ❌    | Postgres connection string (also used by `drizzle-kit`) |
| `TMDB_API`                                   |   ❌    | TMDB v3 API key, sent as `api_key` on server requests   |

> 💡 Variables are declared in `src/env.ts` with `defineEnvVars` and imported from
> `$app/env/private` / `$app/env/public`. **Add any new variable there first.**

### 3. Create the database tables

```sh
bun run db:push
```

Or, to use versioned migrations:

```sh
bun run db:generate   # writes SQL migrations to ./drizzle
bun run db:migrate    # applies them
```

### 4. Run the app

```sh
bun run dev
```

Open the URL Vite prints (usually <http://localhost:5173>).

### 5. Build for production

```sh
bun run build
bun run preview   # preview the production build locally
```

The build uses `@sveltejs/adapter-vercel`, so it's ready to deploy to Vercel. Add the same
environment variables in your Vercel project settings.

---

## 📜 Available Scripts

| Command               | Description                                        |
| --------------------- | -------------------------------------------------- |
| `bun run dev`         | Start the dev server                               |
| `bun run build`       | Production build                                   |
| `bun run preview`     | Preview the production build                       |
| `bun run check`       | `svelte-kit sync` + `svelte-check` (type checking) |
| `bun run check:watch` | Type checking in watch mode                        |
| `bun run lint`        | `prettier --check` + `eslint`                      |
| `bun run format`      | Format everything with Prettier                    |
| `bun run db:push`     | Push the schema straight to the database           |
| `bun run db:generate` | Generate SQL migrations into `./drizzle`           |
| `bun run db:migrate`  | Apply migrations                                   |
| `bun run db:studio`   | Open Drizzle Studio to browse the data             |

> There is no test framework set up yet.

---

## 📌 Conventions & Gotchas

This project uses **SvelteKit 3**, which differs from SvelteKit 2 in a few ways:

- 🚫 **No `svelte.config.js`.** Kit options (adapter, compiler options) are passed to the
  `sveltekit()` plugin in `vite.config.ts`.
- 🔗 **Import alias is `#lib`, not `$lib`.** It's defined in `package.json` `"imports"`
  (`#lib/*` → `src/lib/*`).
- 🌱 **Env vars** come from `$app/env/private` and `$app/env/public`, not `$env/static/*`.
- 🧭 **Internal links** must use `resolve()` from `$app/paths` (enforced by ESLint). Catch-all
  routes need an explicit param, e.g. `resolve('/sign-in/[...sign-in]', { 'sign-in': '' })`.
- 🧩 **UI components:** add new shadcn-svelte components with its CLI rather than by hand.
  Merge classes with `cn` from `#lib/utils`.
- 🔒 **Data access:** new queries go in `src/lib/server/db/`, must take a `userId` and enforce
  ownership, and are called only from `+page.server.ts` loads and actions.
- 🪟 **Windows:** `bun run build` fails at the final Vercel adapter step with
  `EPERM ... symlink` unless Developer Mode is on (or the shell is elevated). The Vite client
  and server builds before it are the meaningful check.

---

<div align="center">

Movie and TV data provided by [TMDB](https://www.themoviedb.org).
This product uses the TMDB API but is not endorsed or certified by TMDB.

</div>
