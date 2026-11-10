<script lang="ts">
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import SearchIcon from '@lucide/svelte/icons/search';
	import SearchXIcon from '@lucide/svelte/icons/search-x';
	import { resolve } from '$app/paths';
	import { navigating } from '$app/state';
	import { MovieRow } from '#lib/components/movies/index.js';
	import SectionStatus from '#lib/components/movies/section-status.svelte';
	import SearchResult from '#lib/components/search/search-result.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import { SEARCH_TYPES, searchHref, TMDB_IMAGE_ORIGIN, type SearchType } from '#lib/tmdb.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const TYPE_LABELS: Record<SearchType, string> = { all: 'All', movie: 'Movies', tv: 'TV shows' };

	// Switching filter or page keeps the old results visible (dimmed) until the new ones load.
	let pending = $derived(navigating.to?.route.id === '/search');
</script>

<svelte:head>
	<title>{data.query ? `“${data.query}” · Search` : 'Search'}</title>
	<meta name="robots" content="noindex" />
	<link rel="preconnect" href={TMDB_IMAGE_ORIGIN} />
</svelte:head>

{#snippet resultsSkeleton()}
	<ul class="grid gap-4 md:grid-cols-2" aria-hidden="true">
		{#each { length: 6 }, i (i)}
			<li class="flex gap-4 rounded-2xl border border-foreground/10 bg-muted/30 p-3 sm:p-4">
				<Skeleton class="aspect-2/3 w-20 rounded-xl sm:w-24" />
				<div class="flex-1 space-y-2.5 py-1">
					<Skeleton class="h-4 w-16 rounded-full" />
					<Skeleton class="h-5 w-3/4" />
					<Skeleton class="h-4 w-1/3" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-5/6" />
				</div>
			</li>
		{/each}
	</ul>
{/snippet}

<main class="mx-auto max-w-6xl px-4 py-8 sm:py-10">
	{#if data.query && data.results}
		<header class="animate-in duration-500 fade-in slide-in-from-bottom-2">
			<p class="text-sm font-medium text-muted-foreground">Search results for</p>
			<h1 class="mt-1 text-3xl font-semibold tracking-tight text-balance break-words sm:text-4xl">
				“{data.query}”
			</h1>
		</header>

		<div class="mt-6 flex flex-wrap items-center justify-between gap-3">
			<nav aria-label="Filter results">
				<ul
					class="inline-flex rounded-full border border-foreground/10 bg-foreground/5 p-1 backdrop-blur-xl"
				>
					{#each SEARCH_TYPES as type (type)}
						{@const current = data.type === type}
						<li>
							<!-- searchHref() is built on resolve(); the lint rule can't see through it. -->
							<!-- eslint-disable svelte/no-navigation-without-resolve -->
							<a
								href={searchHref(data.query, type)}
								aria-current={current ? 'page' : undefined}
								data-sveltekit-noscroll
								class={[
									'block rounded-full px-4 py-1.5 text-sm font-medium transition duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring',
									current
										? 'bg-background text-foreground shadow-md ring-1 ring-foreground/10'
										: 'text-muted-foreground hover:text-foreground'
								]}
							>
								{TYPE_LABELS[type]}
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</li>
					{/each}
				</ul>
			</nav>

			{#await data.results then results}
				{#if results.total_results > 0}
					<p class="text-sm text-muted-foreground tabular-nums" aria-live="polite">
						{results.total_results.toLocaleString('en-US')}
						{results.total_results === 1 ? 'result' : 'results'}
					</p>
				{/if}
			{/await}
		</div>

		<div
			class={['mt-6 transition-opacity duration-300', pending && 'pointer-events-none opacity-50']}
			aria-busy={pending}
		>
			{#await data.results}
				<span class="sr-only" role="status">Searching…</span>
				{@render resultsSkeleton()}
			{:then results}
				{#if results.results.length > 0}
					<ul class="grid gap-4 md:grid-cols-2">
						{#each results.results as movie, i (`${movie.media_type}-${movie.id}`)}
							<li
								class="animate-in duration-500 fill-mode-both fade-in slide-in-from-bottom-3"
								style:animation-delay="{Math.min(i, 10) * 40}ms"
							>
								<SearchResult {movie} />
							</li>
						{/each}
					</ul>

					{#if results.total_pages > 1}
						<nav class="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
							{#if results.page > 1}
								<Button
									variant="outline"
									href={searchHref(data.query, data.type, results.page - 1)}
								>
									<ChevronLeftIcon data-icon="inline-start" />
									Previous
								</Button>
							{/if}
							<span class="text-sm text-muted-foreground tabular-nums">
								Page {results.page} of {results.total_pages}
							</span>
							{#if results.page < results.total_pages}
								<Button
									variant="outline"
									href={searchHref(data.query, data.type, results.page + 1)}
								>
									Next
									<ChevronRightIcon data-icon="inline-end" />
								</Button>
							{/if}
						</nav>
					{/if}
				{:else}
					{@const pastEnd = data.page > 1 && results.total_results > 0}
					<div
						class="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-muted/40 px-6 py-16 text-center"
					>
						<SearchXIcon class="size-10 text-muted-foreground" aria-hidden="true" />
						<div>
							<h2 class="text-lg font-semibold">
								{pastEnd
									? 'No more results'
									: `No ${data.type === 'all' ? 'titles' : TYPE_LABELS[data.type].toLowerCase()} match “${data.query}”`}
							</h2>
							<p class="mt-1 text-sm text-muted-foreground">
								{pastEnd
									? 'This page is past the end of the results.'
									: 'Check the spelling, try a shorter title, or search everything.'}
							</p>
						</div>
						<div class="flex flex-wrap justify-center gap-2">
							{#if pastEnd}
								<Button variant="outline" href={searchHref(data.query, data.type)}
									>First page</Button
								>
							{:else if data.type !== 'all'}
								<Button variant="outline" href={searchHref(data.query)}>Search all titles</Button>
							{/if}
						</div>
					</div>
				{/if}
			{:catch}
				<SectionStatus
					kind="error"
					message="We couldn't search right now. Please try again."
					class="py-16"
				/>
			{/await}
		</div>
	{:else}
		<!-- No query yet: invite a search and show what's popular. -->
		<section
			class="flex animate-in flex-col items-center px-2 py-10 text-center duration-500 fade-in slide-in-from-bottom-2 sm:py-16"
		>
			<span
				class="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg"
				aria-hidden="true"
			>
				<SearchIcon class="size-6" />
			</span>
			<h1 class="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Find your next watch</h1>
			<p class="mt-2 max-w-md text-muted-foreground">
				Search thousands of movies and TV shows by title.
			</p>
			<form
				action={resolve('/search')}
				method="GET"
				role="search"
				class="mt-6 flex w-full max-w-lg gap-2"
			>
				<label for="search-page-input" class="sr-only">Search movies and TV shows</label>
				<input
					id="search-page-input"
					name="query"
					type="search"
					required
					maxlength="100"
					autocomplete="off"
					enterkeyhint="search"
					placeholder="Try “Interstellar”"
					class="h-11 min-w-0 flex-1 rounded-full border border-foreground/10 bg-foreground/5 px-5 text-sm transition outline-none focus:border-foreground/20 focus:bg-background focus:ring-4 focus:ring-ring/20"
				/>
				<Button type="submit" class="h-11 rounded-full px-5">Search</Button>
			</form>
		</section>

		<div class="space-y-12">
			{#if data.trendingMovies}
				<MovieRow title="Trending movies" movies={data.trendingMovies} />
			{/if}
			{#if data.trendingTv}
				<MovieRow title="Trending TV shows" movies={data.trendingTv} />
			{/if}
		</div>
	{/if}
</main>
