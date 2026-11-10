<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CompassIcon from '@lucide/svelte/icons/compass';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import { flip } from 'svelte/animate';
	import { SvelteSet } from 'svelte/reactivity';
	import { fly, scale } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { useCollections } from '#lib/components/collections/index.js';
	import DeleteCollectionDialog from '#lib/components/collections/delete-collection-dialog.svelte';
	import PosterStack from '#lib/components/collections/poster-stack.svelte';
	import SignedOutPanel from '#lib/components/collections/signed-out-panel.svelte';
	import MovieCard from '#lib/components/movies/movie-card.svelte';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import {
		itemKey,
		timeAgo,
		titleCount,
		type CollectionItem,
		type ItemKey
	} from '#lib/collections.js';
	import { TMDB_IMAGE_ORIGIN, tmdbImageUrl } from '#lib/tmdb.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const collections = useCollections();

	const SORTS = {
		added: { label: 'Recently added', compare: () => 0 },
		title: {
			label: 'Title',
			compare: (a: CollectionItem, b: CollectionItem) => a.title.localeCompare(b.title)
		},
		rating: {
			label: 'Rating',
			compare: (a: CollectionItem, b: CollectionItem) => b.vote_average - a.vote_average
		}
	};
	type Sort = keyof typeof SORTS;

	let sort = $state<Sort>('added');
	let filter = $state<'all' | 'movie' | 'tv'>('all');
	let deleteOpen = $state(false);
	/** Titles being removed: hidden right away, back if the request fails. */
	const removing = new SvelteSet<ItemKey>();

	let items = $derived(data.signedIn ? data.items : []);
	let hasBoth = $derived(
		items.some((item) => item.media_type === 'movie') &&
			items.some((item) => item.media_type === 'tv')
	);
	let visible = $derived(
		items
			.filter((item) => !removing.has(itemKey(item)))
			.filter((item) => filter === 'all' || item.media_type === filter)
			// Loaded newest first, so "Recently added" keeps the server order.
			.sort(SORTS[sort].compare)
	);
	let posters = $derived(items.flatMap((item) => (item.poster_path ? [item.poster_path] : [])));

	async function remove(item: CollectionItem) {
		if (!data.signedIn) return;
		const key = itemKey(item);
		removing.add(key);
		await collections.remove(data.collection, item);
		// On success the refreshed data no longer has it; on failure it reappears.
		removing.delete(key);
	}
</script>

<svelte:head>
	<title>{data.signedIn ? data.collection.name : 'Collection'}</title>
	<meta name="robots" content="noindex" />
	<link rel="preconnect" href={TMDB_IMAGE_ORIGIN} />
</svelte:head>

<main class="mx-auto max-w-6xl px-4 py-6 sm:py-8">
	<Button variant="ghost" size="sm" href={resolve('/collections')} class="-ms-2.5 mb-4">
		<ArrowLeftIcon data-icon="inline-start" />
		All collections
	</Button>

	{#if !data.signedIn}
		<h1 class="sr-only">Collection</h1>
		<div class="py-6 sm:py-12">
			<SignedOutPanel message="Sign in to open this collection." />
		</div>
	{:else}
		<header
			class="group/stack relative isolate animate-in overflow-hidden rounded-3xl border border-foreground/10 bg-muted/30 duration-500 fade-in slide-in-from-bottom-2"
		>
			{#if posters[0]}
				<TmdbImage
					src={tmdbImageUrl(posters[0], 185)}
					sizes="100vw"
					class="scale-125 opacity-40 blur-3xl"
				/>
			{/if}
			<div
				class="pointer-events-none absolute inset-0 bg-linear-to-t from-background/80 via-background/40 to-transparent"
			></div>

			<div class="relative grid gap-6 p-5 sm:grid-cols-[14rem_1fr] sm:items-center sm:p-8">
				<PosterStack {posters} class="mx-auto h-36 w-56 sm:h-44" />
				<div class="min-w-0">
					<p class="text-sm font-medium text-muted-foreground">Collection</p>
					<h1
						class="mt-1 text-3xl font-semibold tracking-tight text-balance break-words sm:text-4xl"
					>
						{data.collection.name}
					</h1>
					{#if data.collection.description}
						<p class="mt-2 max-w-prose text-foreground/85">{data.collection.description}</p>
					{/if}
					<p class="mt-3 text-sm text-muted-foreground tabular-nums">
						<span class="font-medium text-foreground">{titleCount(items.length)}</span>
						· Updated
						<time datetime={data.collection.updatedAt}>{timeAgo(data.collection.updatedAt)}</time>
					</p>
					<div class="mt-5 flex flex-wrap gap-2">
						<Button href={resolve('/search')}>
							<SearchIcon data-icon="inline-start" />
							Find titles to add
						</Button>
						<Button
							variant="outline"
							class="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
							onclick={() => (deleteOpen = true)}
						>
							<Trash2Icon data-icon="inline-start" />
							Delete
						</Button>
					</div>
				</div>
			</div>
		</header>

		{#if items.length > 0}
			<div class="mt-8 flex flex-wrap items-center justify-between gap-3">
				{#if hasBoth}
					<ToggleGroup.Root
						type="single"
						variant="outline"
						size="sm"
						value={filter}
						onValueChange={(value) => value && (filter = value as typeof filter)}
						aria-label="Show"
					>
						<ToggleGroup.Item value="all" class="px-3">All</ToggleGroup.Item>
						<ToggleGroup.Item value="movie" class="px-3">Movies</ToggleGroup.Item>
						<ToggleGroup.Item value="tv" class="px-3">TV shows</ToggleGroup.Item>
					</ToggleGroup.Root>
				{:else}
					<span></span>
				{/if}
				<ToggleGroup.Root
					type="single"
					variant="outline"
					size="sm"
					value={sort}
					onValueChange={(value) => value && (sort = value as Sort)}
					aria-label="Sort by"
				>
					{#each Object.entries(SORTS) as [value, option] (value)}
						<ToggleGroup.Item {value} class="px-3 whitespace-nowrap"
							>{option.label}</ToggleGroup.Item
						>
					{/each}
				</ToggleGroup.Root>
			</div>

			<ul class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{#each visible as item, i (itemKey(item))}
					<li
						animate:flip={{ duration: 300 }}
						in:fly|global={{ y: 16, duration: 400, delay: Math.min(i, 10) * 30 }}
						out:scale={{ start: 0.85, duration: 220 }}
					>
						<MovieCard movie={item}>
							{#snippet action()}
								<button
									type="button"
									onclick={() => remove(item)}
									disabled={removing.has(itemKey(item))}
									class="grid size-8 place-items-center rounded-full border border-white/15 bg-black/40 text-white opacity-0 shadow-md backdrop-blur-md transition duration-300 outline-none group-focus-within/card:opacity-100 group-hover/card:opacity-100 hover:scale-110 hover:bg-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring active:scale-90 [@media(hover:none)]:opacity-100"
								>
									{#if removing.has(itemKey(item))}
										<LoaderCircleIcon class="size-4 animate-spin" aria-hidden="true" />
									{:else}
										<XIcon class="size-4" aria-hidden="true" />
									{/if}
									<span class="sr-only">Remove {item.title} from {data.collection.name}</span>
								</button>
							{/snippet}
						</MovieCard>
						<p class="mt-1.5 px-0.5 text-[0.6875rem] text-muted-foreground">
							Added <time datetime={item.addedAt}>{timeAgo(item.addedAt)}</time>
						</p>
					</li>
				{/each}
			</ul>
		{:else}
			<div
				class="mt-8 flex animate-in flex-col items-center rounded-3xl border border-dashed bg-muted/30 px-6 py-14 text-center duration-500 fade-in"
			>
				<CompassIcon class="size-10 text-muted-foreground" aria-hidden="true" />
				<h2 class="mt-4 text-lg font-semibold">Nothing here yet</h2>
				<p class="mt-1 max-w-sm text-sm text-balance text-muted-foreground">
					Tap the + on any poster or search result to save it to “{data.collection.name}”.
				</p>
				<div class="mt-6 flex flex-wrap justify-center gap-2">
					<Button href={resolve('/')}>Browse titles</Button>
					<Button variant="outline" href={resolve('/search')}>
						<SearchIcon data-icon="inline-start" />
						Search
					</Button>
				</div>
			</div>
		{/if}

		<DeleteCollectionDialog
			bind:open={deleteOpen}
			collection={{ ...data.collection, count: items.length }}
			leave
		/>
	{/if}
</main>
