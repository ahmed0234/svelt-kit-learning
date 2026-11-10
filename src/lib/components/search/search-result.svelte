<script lang="ts">
	import FilmIcon from '@lucide/svelte/icons/film';
	import StarIcon from '@lucide/svelte/icons/star';
	import TvIcon from '@lucide/svelte/icons/tv';
	import SaveButton from '#lib/components/collections/save-button.svelte';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import {
		detailsHref,
		formatDate,
		formatRating,
		posterSrcset,
		tmdbImageUrl,
		type TmdbMovie
	} from '#lib/tmdb.js';

	let { movie }: { movie: TmdbMovie } = $props();

	let isTv = $derived(movie.media_type === 'tv');
	let rating = $derived(formatRating(movie));
	let date = $derived(formatDate(movie.release_date));
	let TypeIcon = $derived(isTv ? TvIcon : FilmIcon);
</script>

<!-- The save button sits beside the link (not inside it), so hover styles key off this wrapper. -->
<div class="group/card relative h-full">
	<a
		href={detailsHref(movie)}
		class="group flex h-full gap-4 rounded-2xl border border-foreground/10 bg-muted/30 p-3 pe-14 transition duration-300 ease-out outline-none group-hover/card:-translate-y-0.5 group-hover/card:border-foreground/20 group-hover/card:bg-muted/60 group-hover/card:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-4 sm:pe-16"
	>
		<div
			class="relative aspect-2/3 w-20 shrink-0 self-start overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-foreground/10 sm:w-24"
		>
			<TmdbImage
				src={movie.poster_path && tmdbImageUrl(movie.poster_path, 185)}
				srcset={movie.poster_path && posterSrcset(movie.poster_path)}
				sizes="96px"
				placeholder={TypeIcon}
				class="group-hover/card:scale-105"
			/>
		</div>

		<article class="min-w-0 flex-1">
			<p
				class="inline-flex items-center gap-1 rounded-full bg-foreground/[0.07] px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase"
			>
				<TypeIcon class="size-3" aria-hidden="true" />
				{isTv ? 'TV show' : 'Movie'}
			</p>
			<h2
				class="mt-1.5 line-clamp-2 font-semibold tracking-tight text-balance group-hover/card:underline"
			>
				{movie.title}
			</h2>
			<p class="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
				{#if date}
					<span>{isTv ? `First aired ${date}` : date}</span>
				{:else}
					<span>Release date TBA</span>
				{/if}
				{#if rating}
					<span class="inline-flex items-center gap-1">
						<StarIcon class="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
						<span class="font-medium text-foreground"
							><span class="sr-only">Rated </span>{rating}</span
						>
					</span>
				{/if}
			</p>
			{#if movie.overview}
				<p class="mt-2 line-clamp-3 text-sm leading-relaxed text-foreground/80">{movie.overview}</p>
			{/if}
		</article>
	</a>

	<SaveButton
		item={movie}
		appearance="plain"
		class="absolute end-3 top-3 transition duration-300 group-hover/card:-translate-y-0.5 sm:end-4 sm:top-4"
	/>
</div>
