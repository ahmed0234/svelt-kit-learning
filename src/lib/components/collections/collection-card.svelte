<script lang="ts">
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import { collectionHref, timeAgo, titleCount, type CollectionSummary } from '#lib/collections.js';
	import { tmdbImageUrl } from '#lib/tmdb.js';
	import PosterStack from './poster-stack.svelte';

	type Props = {
		collection: CollectionSummary;
		ondelete: (collection: CollectionSummary) => void;
	};

	let { collection, ondelete }: Props = $props();
</script>

<!-- The delete button sits beside the link (not inside it), so hover styles key off this wrapper. -->
<div class="group/stack relative h-full">
	<a
		href={collectionHref(collection.id)}
		class="flex h-full flex-col rounded-3xl border border-foreground/10 bg-muted/30 p-3 transition duration-300 ease-out outline-none group-hover/stack:-translate-y-1 group-hover/stack:border-foreground/20 group-hover/stack:bg-muted/50 group-hover/stack:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
	>
		<div
			class="relative isolate aspect-16/10 overflow-hidden rounded-2xl bg-linear-to-br from-muted to-foreground/10"
		>
			{#if collection.posters[0]}
				<!-- The front poster, blurred into a backdrop. -->
				<TmdbImage
					src={tmdbImageUrl(collection.posters[0], 92)}
					sizes="300px"
					class="scale-125 opacity-60 blur-2xl"
				/>
			{/if}
			<PosterStack posters={collection.posters} class="absolute inset-0 pt-[6%]" />
		</div>

		<div class="flex-1 px-2 pt-4 pb-1">
			<h2 class="truncate text-lg font-semibold tracking-tight" title={collection.name}>
				{collection.name}
			</h2>
			{#if collection.description}
				<p class="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{collection.description}</p>
			{/if}
			<p class="mt-2 text-xs text-muted-foreground tabular-nums">
				<span class="font-medium text-foreground">{titleCount(collection.count)}</span>
				· Updated <time datetime={collection.updatedAt}>{timeAgo(collection.updatedAt)}</time>
			</p>
		</div>
	</a>

	<button
		type="button"
		onclick={() => ondelete(collection)}
		class="absolute end-5 top-5 grid size-8 place-items-center rounded-full border border-white/15 bg-black/40 text-white opacity-0 shadow-md backdrop-blur-md transition duration-300 outline-none group-focus-within/stack:opacity-100 group-hover/stack:-translate-y-1 group-hover/stack:opacity-100 hover:bg-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring [@media(hover:none)]:opacity-100"
	>
		<Trash2Icon class="size-3.5" aria-hidden="true" />
		<span class="sr-only">Delete {collection.name}</span>
	</button>
</div>
