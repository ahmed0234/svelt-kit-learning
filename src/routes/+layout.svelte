<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { CollectionsProvider } from '#lib/components/collections/index.js';
	import { TitleDetailsSkeleton } from '#lib/components/movies/index.js';
	import { Navbar } from '#lib/components/navbar/index.js';
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import { navigating } from '$app/state';
	import { ModeWatcher } from 'mode-watcher';
	import { ClerkProvider } from 'svelte-clerk';
	import type { LayoutProps } from './$types';
	import './layout.css';

	let { children, data }: LayoutProps = $props();

	// Only Clerk's own props: the rest of the layout data (e.g. collections) isn't Clerk config.
	let clerkProps = $derived({ initialState: data.initialState });

	const DETAILS_ROUTES = new Set(['/movie/[id]', '/tv/[id]', '/actor/[id]']);

	// Details pages load server-side before rendering (so bad ids get a real 404), so while
	// one is loading we cover the old page with a matching skeleton. `navigating.to` clears
	// when the navigation completes, fails or is cancelled, so this can't get stuck.
	// Same-page navigations (e.g. picking a TV season via `?season=`) keep the page visible.
	let loadingDetails = $derived(
		DETAILS_ROUTES.has(navigating.to?.route.id ?? '') &&
			navigating.to?.url.pathname !== navigating.from?.url.pathname
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- `initialState` from the layout load lets Clerk know who's signed in during SSR. -->
<ClerkProvider {...clerkProps}>
	<ModeWatcher />
	<Toaster position="bottom-center" richColors={false} closeButton />
	<CollectionsProvider collections={data.collections}>
		<Navbar />
		{#if navigating.to}
			<!-- Delayed fade-in so instant (preloaded) navigations don't flash the bar. -->
			<div
				class="fixed inset-x-0 top-0 z-50 h-0.5 animate-in overflow-hidden delay-150 fill-mode-both fade-in"
				role="progressbar"
				aria-label="Loading page"
			>
				<div class="h-full w-1/3 animate-nav-progress bg-primary"></div>
			</div>
		{/if}
		{#if loadingDetails}
			<!-- Delayed like the progress bar, so preloaded (instant) navigations don't flash it. -->
			<div
				class="fixed inset-x-0 top-16 bottom-0 z-40 animate-in overflow-y-auto bg-background delay-150 duration-200 fill-mode-both fade-in"
				role="status"
				aria-live="polite"
			>
				<span class="sr-only">Loading details…</span>
				<TitleDetailsSkeleton />
			</div>
		{/if}
		{@render children()}
	</CollectionsProvider>
</ClerkProvider>
