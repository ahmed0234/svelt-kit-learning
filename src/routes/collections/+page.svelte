<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import { flip } from 'svelte/animate';
	import { fly, scale } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import CollectionCard from '#lib/components/collections/collection-card.svelte';
	import CreateCollectionDialog from '#lib/components/collections/create-collection-dialog.svelte';
	import DeleteCollectionDialog from '#lib/components/collections/delete-collection-dialog.svelte';
	import PosterStack from '#lib/components/collections/poster-stack.svelte';
	import SignedOutPanel from '#lib/components/collections/signed-out-panel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { titleCount, type CollectionSummary } from '#lib/collections.js';
	import { TMDB_IMAGE_ORIGIN } from '#lib/tmdb.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Name ideas only: first-time users start empty and create their own collections.
	const SUGGESTIONS = ['Must Watch', 'Favorite Anime', 'Horror Night', 'Comfort Rewatches'];

	let createOpen = $state(false);
	let createName = $state('');
	let deleteOpen = $state(false);
	let deleting = $state.raw<CollectionSummary | null>(null);

	let totalTitles = $derived(
		data.collections.reduce((total, collection) => total + collection.count, 0)
	);

	function openCreate(name = '') {
		createName = name;
		createOpen = true;
	}

	function confirmDelete(collection: CollectionSummary) {
		deleting = collection;
		deleteOpen = true;
	}
</script>

<svelte:head>
	<title>Collections</title>
	<meta name="robots" content="noindex" />
	<link rel="preconnect" href={TMDB_IMAGE_ORIGIN} />
</svelte:head>

<main class="mx-auto max-w-6xl px-4 py-8 sm:py-10">
	{#if !data.signedIn}
		<h1 class="sr-only">Collections</h1>
		<div class="py-6 sm:py-12">
			<SignedOutPanel />
		</div>
	{:else}
		<header
			class="flex animate-in flex-wrap items-end justify-between gap-4 duration-500 fade-in slide-in-from-bottom-2"
		>
			<div>
				<p class="text-sm font-medium text-muted-foreground">Your library</p>
				<h1 class="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Collections</h1>
				{#if data.collections.length > 0}
					<p class="mt-1 text-sm text-muted-foreground tabular-nums">
						{data.collections.length}
						{data.collections.length === 1 ? 'collection' : 'collections'} · {titleCount(
							totalTitles
						)}
					</p>
				{/if}
			</div>
			{#if data.collections.length > 0}
				<Button onclick={() => openCreate()} class="rounded-full shadow-md">
					<PlusIcon data-icon="inline-start" />
					New collection
				</Button>
			{/if}
		</header>

		{#if data.collections.length === 0}
			<!-- First visit: nothing predefined, just an invitation and some name ideas. -->
			<section
				class="group/stack mt-8 flex animate-in flex-col items-center overflow-hidden rounded-3xl border border-foreground/10 bg-muted/30 px-6 pt-10 pb-12 text-center duration-500 fade-in slide-in-from-bottom-3"
			>
				<PosterStack posters={[]} class="h-40 w-full max-w-xs" />
				<h2 class="mt-4 text-2xl font-semibold tracking-tight">Start your first collection</h2>
				<p class="mt-2 max-w-md text-balance text-muted-foreground">
					Save movies and shows as you browse with the
					<span
						class="mx-0.5 inline-grid size-5 translate-y-0.5 place-items-center rounded-full bg-foreground text-background"
						aria-hidden="true"><PlusIcon class="size-3" strokeWidth={3} /></span
					><span class="sr-only">plus</span>
					button, or create a collection now.
				</p>
				<Button onclick={() => openCreate()} class="mt-6 rounded-full shadow-md">
					<PlusIcon data-icon="inline-start" />
					Create a collection
				</Button>
				<div class="mt-8">
					<p
						class="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground"
					>
						<SparklesIcon class="size-3.5" aria-hidden="true" />
						Need an idea?
					</p>
					<ul class="mt-3 flex flex-wrap justify-center gap-2">
						{#each SUGGESTIONS as suggestion (suggestion)}
							<li>
								<button
									type="button"
									onclick={() => openCreate(suggestion)}
									class="rounded-full border border-foreground/15 bg-background/60 px-3.5 py-1.5 text-sm transition outline-none hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-background hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
								>
									{suggestion}
								</button>
							</li>
						{/each}
					</ul>
				</div>
			</section>
		{:else}
			<ul class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.collections as collection, i (collection.id)}
					<li
						animate:flip={{ duration: 300 }}
						in:fly|global={{ y: 16, duration: 400, delay: Math.min(i, 8) * 40 }}
						out:scale={{ start: 0.92, duration: 200 }}
					>
						<CollectionCard {collection} ondelete={confirmDelete} />
					</li>
				{/each}
				<li>
					<button
						type="button"
						onclick={() => openCreate()}
						class="group flex h-full min-h-56 w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-foreground/15 text-muted-foreground transition duration-300 outline-none hover:-translate-y-1 hover:border-foreground/30 hover:bg-muted/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
					>
						<span
							class="grid size-12 place-items-center rounded-2xl border border-dashed border-current transition duration-300 group-hover:rotate-90"
						>
							<PlusIcon class="size-5" aria-hidden="true" />
						</span>
						<span class="font-medium">New collection</span>
					</button>
				</li>
			</ul>

			<p class="mt-10 text-center text-sm text-muted-foreground">
				Looking for something to add?
				<a href={resolve('/search')} class="font-medium text-foreground hover:underline"
					>Search movies & TV</a
				>
			</p>
		{/if}

		<CreateCollectionDialog bind:open={createOpen} initialName={createName} />
		<DeleteCollectionDialog bind:open={deleteOpen} collection={deleting} />
	{/if}
</main>
