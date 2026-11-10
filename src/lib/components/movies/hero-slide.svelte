<script lang="ts">
	import StarIcon from '@lucide/svelte/icons/star';
	import {
		backdropSrcset,
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
		rank: number;
		/** Load immediately with high priority (use for the first visible slide). */
		eager?: boolean;
	};

	let { movie, rank, eager = false }: Props = $props();

	// The slide spans the content column: full width minus gutters, capped at max-w-6xl.
	const SIZES = '(min-width: 1184px) 1152px, calc(100vw - 2rem)';

	// Wide screens prefer the backdrop, phones the poster; each falls back to the other.
	let wideSrcset = $derived(
		movie.backdrop_path
			? backdropSrcset(movie.backdrop_path)
			: movie.poster_path && posterSrcset(movie.poster_path)
	);
	let tallSrcset = $derived(
		movie.poster_path
			? posterSrcset(movie.poster_path)
			: movie.backdrop_path && backdropSrcset(movie.backdrop_path)
	);
	let fallbackSrc = $derived(
		movie.poster_path
			? tmdbImageUrl(movie.poster_path, 500)
			: movie.backdrop_path && tmdbImageUrl(movie.backdrop_path, 780)
	);

	let year = $derived(releaseYear(movie));
	let rating = $derived(formatRating(movie));
</script>

<a
	href={detailsHref(movie)}
	draggable="false"
	class="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
>
	<article
		class="group relative isolate aspect-4/5 w-full overflow-hidden rounded-2xl bg-muted sm:aspect-video lg:aspect-21/9"
	>
		<TmdbImage
			src={fallbackSrc}
			srcset={tallSrcset}
			{wideSrcset}
			sizes={SIZES}
			{eager}
			class="group-hover:scale-105"
		/>

		<div
			class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent sm:bg-linear-to-r sm:from-black/60 sm:via-black/10"
		></div>

		<div
			class="absolute inset-x-3 bottom-3 rounded-xl border border-white/15 bg-white/10 p-4 text-white shadow-2xl shadow-black/20 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-500 group-hover:bg-white/15 sm:inset-x-auto sm:start-6 sm:bottom-6 sm:max-w-md sm:p-5 lg:max-w-lg"
		>
			<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-white/80">
				<span class="rounded-full bg-white/15 px-2 py-0.5 text-white">#{rank} Trending</span>
				{#if rating}
					<span class="inline-flex items-center gap-1">
						<StarIcon class="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
						<span><span class="sr-only">Rated </span>{rating}</span>
					</span>
				{/if}
				{#if year}
					<span aria-hidden="true" class="text-white/40">•</span>
					<span>{year}</span>
				{/if}
			</div>

			<h3
				class="mt-2 line-clamp-2 text-xl font-semibold tracking-tight text-balance sm:text-2xl lg:text-3xl"
			>
				{movie.title}
			</h3>

			{#if movie.overview}
				<p class="mt-2 line-clamp-2 text-sm leading-relaxed text-white/75 sm:line-clamp-3">
					{movie.overview}
				</p>
			{/if}
		</div>
	</article>
</a>
