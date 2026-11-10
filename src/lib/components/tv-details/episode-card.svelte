<script lang="ts">
	import StarIcon from '@lucide/svelte/icons/star';
	import TvIcon from '@lucide/svelte/icons/tv';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		episodeCode,
		formatDate,
		formatRuntime,
		stillSrcset,
		tmdbImageUrl,
		type TvEpisode
	} from '#lib/tmdb.js';

	type Props = {
		episode: TvEpisode;
		/** `YYYY-MM-DD`; episodes airing later are marked upcoming. */
		today: string;
	};

	let { episode, today }: Props = $props();

	// Matches the still column below (8rem on phones, 13rem from `sm`).
	const SIZES = '(min-width: 640px) 208px, 128px';
	// About three lines in the text column; shorter overviews don't need a toggle.
	const COLLAPSE_AFTER_CHARS = 220;

	const overviewId = $props.id();

	let expanded = $state(false);

	let upcoming = $derived(!episode.air_date || episode.air_date > today);
	let date = $derived(formatDate(episode.air_date ?? ''));
	let rating = $derived(
		!upcoming && episode.vote_count > 0 ? episode.vote_average.toFixed(1) : null
	);
	let isLong = $derived(episode.overview.length > COLLAPSE_AFTER_CHARS);
</script>

<article
	class="group grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-2xl border border-foreground/10 bg-muted/30 p-3 transition-colors duration-300 hover:bg-muted/50 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-x-4 sm:p-4"
>
	<div
		class="relative aspect-video self-start overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10 sm:row-span-2"
	>
		<TmdbImage
			src={episode.still_path && tmdbImageUrl(episode.still_path, 300)}
			srcset={episode.still_path && stillSrcset(episode.still_path)}
			sizes={SIZES}
			placeholder={TvIcon}
			class="group-hover:scale-105"
		/>
		<span
			class="absolute start-1.5 bottom-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-white tabular-nums backdrop-blur-md"
		>
			{episodeCode(episode)}
		</span>
	</div>

	<div class="min-w-0">
		<p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
			<span class="font-medium tabular-nums">Episode {episode.episode_number}</span>
			{#if date}<span aria-hidden="true">·</span><time datetime={episode.air_date}>{date}</time
				>{/if}
			{#if upcoming}
				<span
					class="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-primary"
				>
					{date ? 'Upcoming' : 'TBA'}
				</span>
			{/if}
		</p>
		<h4 class="mt-1 line-clamp-2 font-semibold tracking-tight">
			{episode.name || `Episode ${episode.episode_number}`}
		</h4>
		{#if episode.runtime || rating}
			<p class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
				{#if episode.runtime}<span>{formatRuntime(episode.runtime)}</span>{/if}
				{#if rating}
					<span class="inline-flex items-center gap-1">
						<StarIcon class="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
						<span class="font-medium text-foreground"
							><span class="sr-only">Rated </span>{rating}</span
						>
					</span>
				{/if}
			</p>
		{/if}
	</div>

	<!-- Spans both columns on phones, sits under the title beside the still from `sm`. -->
	<div class="col-span-2 sm:col-span-1 sm:col-start-2">
		{#if episode.overview}
			<p
				id={overviewId}
				class={[
					'text-sm leading-relaxed text-foreground/80',
					isLong && !expanded && 'line-clamp-3'
				]}
			>
				{episode.overview}
			</p>
			{#if isLong}
				<Button
					variant="link"
					size="sm"
					class="h-auto px-0"
					aria-expanded={expanded}
					aria-controls={overviewId}
					onclick={() => (expanded = !expanded)}
				>
					{expanded ? 'Show less' : 'Read more'}
				</Button>
			{/if}
		{:else}
			<p class="text-sm text-muted-foreground italic">
				{upcoming ? 'Details for this episode haven’t been announced yet.' : 'No overview yet.'}
			</p>
		{/if}
	</div>
</article>
