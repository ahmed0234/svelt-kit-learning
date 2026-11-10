<script lang="ts">
	import StarIcon from '@lucide/svelte/icons/star';
	import type { Snippet } from 'svelte';
	import SaveButton from '#lib/components/collections/save-button.svelte';
	import {
		detailsHref,
		formatRating,
		posterSrcset,
		releaseYear,
		tmdbImageUrl,
		type TmdbMovie
	} from '#lib/tmdb.js';
	import TmdbImage from './tmdb-image.svelte';

	type Props = {
		movie: TmdbMovie;
		/** Replaces the "save to collection" button in the top-left corner. */
		action?: Snippet;
	};

	let { movie, action }: Props = $props();

	// Matches the item widths in movie-row.svelte (2 / 3 / 4 / 5 / 6 per view).
	const SIZES =
		'(min-width: 1184px) 184px, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw';

	let rating = $derived(formatRating(movie));
	let year = $derived(releaseYear(movie));
</script>

<!-- The button sits beside the link (not inside it), so hover styles key off this wrapper. -->
<div class="group/card relative">
	<a
		href={detailsHref(movie)}
		draggable="false"
		class="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
	>
		<article
			class="relative isolate aspect-2/3 overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-foreground/5 transition duration-300 ease-out group-hover/card:-translate-y-1 group-hover/card:shadow-xl group-hover/card:ring-foreground/15"
		>
			<TmdbImage
				src={movie.poster_path && tmdbImageUrl(movie.poster_path, 342)}
				srcset={movie.poster_path && posterSrcset(movie.poster_path)}
				sizes={SIZES}
				class="group-hover/card:scale-105"
			/>

			{#if rating}
				<span
					class="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-md"
				>
					<StarIcon class="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
					<span><span class="sr-only">Rated </span>{rating}</span>
				</span>
			{/if}

			<div
				class="absolute inset-x-2 bottom-2 rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-white backdrop-blur-md transition-colors duration-300 group-hover/card:bg-black/50"
			>
				<h3 class="line-clamp-1 text-sm font-semibold" title={movie.title}>{movie.title}</h3>
				{#if year}
					<p class="text-xs text-white/70">{year}</p>
				{/if}
			</div>
		</article>
	</a>

	<!-- Lifts with the card on hover. -->
	<div
		class="absolute start-2 top-2 transition duration-300 ease-out group-hover/card:-translate-y-1"
	>
		{#if action}
			{@render action()}
		{:else}
			<SaveButton item={movie} />
		{/if}
	</div>
</div>
