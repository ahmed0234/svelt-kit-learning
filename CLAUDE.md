# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A movie-collections app: users sign in with Clerk, create collections, and save TMDB movies into them. Movie details are copied into Postgres when saved so later views need no TMDB calls.

Stack: SvelteKit 3 + Svelte 5 (runes), Vite 8, Tailwind CSS 4, shadcn-svelte (bits-ui), Clerk (`svelte-clerk`), Drizzle ORM on Neon serverless Postgres, deployed with `@sveltejs/adapter-vercel`.

## Commands

Use bun (`bun.lock` is the only lockfile; don't add `package-lock.json`).

```sh
bun run dev          # dev server
bun run build        # production build
bun run preview      # preview the build
bun run check        # svelte-kit sync + svelte-check (type checking)
bun run lint         # prettier --check + eslint
bun run format       # prettier --write
bun run db:push      # push schema to the database (drizzle-kit)
bun run db:generate  # generate SQL migrations into ./drizzle
bun run db:migrate   # apply migrations
bun run db:studio
```

`drizzle.config.ts` loads `DATABASE_URL` from `.env` via dotenv. There is no test framework set up.

On Windows, `bun run build` fails at the final `adapter-vercel` step with `EPERM ... symlink` unless Developer Mode is enabled (or the shell is elevated). The Vite client/server builds before it are the meaningful check.

`.claude/skills/` holds vendored skills pinned by hash in `skills-lock.json`; don't reformat or hand-edit them.

## SvelteKit 3 specifics (differ from SvelteKit 2 habits)

- **No `svelte.config.js`.** Kit options (adapter, compiler options) are passed to the `sveltekit()` plugin in `vite.config.ts`. Runes mode is forced for all project files.
- **Import alias is `#lib`, not `$lib`.** It is defined via `"imports"` in `package.json` (`#lib/*` → `src/lib/*`) and is what `components.json` uses for shadcn-svelte output.
- **Env vars are declared in `src/env.ts`** with `defineEnvVars` (each marked `public: true/false`) and imported from `$app/env/private` / `$app/env/public` — not `$env/static/*`. Add new variables there first.
- `tsconfig.json` extends `$app/tsconfig`.

## Architecture

- **Auth:** `src/hooks.server.ts` installs `withClerkHandler()`, which provides `locals.auth()`. The root `+layout.server.ts` returns `buildClerkProps(locals.auth())`, and `+layout.svelte` wraps the app in `<ClerkProvider>`. Get the user ID on the server with `const { userId } = locals.auth()`. Clerk's hosted UI lives at the catch-all routes `sign-in/[...sign-in]` and `sign-up/[...sign-up]`.
- **Database:** `src/lib/server/db/index.ts` exports a `db` (drizzle over `neon-http`) with the schema attached, so the relational `db.query.*` API is available. `schema.ts` defines `collections` (owned directly by a Clerk `userId` string; there is no users table) and `collection_movies` (FK with cascade delete, unique on `(collection_id, tmdb_movie_id)`).
- **TMDB:** `src/lib/server/tmdb.ts` wraps the TMDB v3 API using the private `TMDB_API` key. Its functions take SvelteKit's `fetch` from the load event as an argument; call them only from server code.
- **Data access:** `src/lib/server/db/collections.ts` holds the query functions. Every function takes `userId` and enforces ownership in its `WHERE` clause (or checks the collection first before touching movies). New data-access code should follow the same pattern and be called from `+page.server.ts` loads and actions, never from the client.
- **UI:** shadcn-svelte components are generated into `src/lib/components/ui/` (style `vega`, lucide icons). Add more with the shadcn-svelte CLI rather than writing them by hand. Theme tokens and Tailwind config live in `src/routes/layout.css` (Tailwind 4, CSS-first; there is no `tailwind.config`). Dark mode uses `mode-watcher` (`<ModeWatcher />` in the root layout, toggle in `src/lib/components/mode-switcher.svelte`). Use `cn` from `#lib/utils` to merge classes.

- **Links:** build internal `href`s with `resolve()` from `$app/paths` (enforced by `svelte/no-navigation-without-resolve`). It is typed against route IDs, so catch-all routes need an explicit param, e.g. `resolve('/sign-in/[...sign-in]', { 'sign-in': '' })`. For link-styled buttons, pass `href` to `<Button>` rather than wrapping it in `<a>`.

## Agent skills

`.claude/skills/` contains installed skills (`shadcn-svelte`, `svelte-code-writer`, `svelte-core-bestpractices`, tracked in `skills-lock.json`). Use them when writing Svelte components or adding shadcn components.
