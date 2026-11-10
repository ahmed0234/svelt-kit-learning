<script lang="ts">
	import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import PlayIcon from '@lucide/svelte/icons/play';
	import {
		CastSection,
		CrewSection,
		ReviewsSection,
		VideoPlayerDialog,
		VideosSection,
		WatchProviders
	} from '#lib/components/movie-details/index.js';
	import { MovieRow, TitleDetails } from '#lib/components/movies/index.js';
	import { SeasonsSection, TvFacts } from '#lib/components/tv-details/index.js';
	import { SaveButton } from '#lib/components/collections/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		episodeCode,
		formatDate,
		personHref,
		TMDB_IMAGE_ORIGIN,
		type MovieVideo
	} from '#lib/tmdb.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let playerOpen = $state(false);
	let playing = $state.raw<MovieVideo | null>(null);

	function play(video: MovieVideo) {
		playing = video;
		playerOpen = true;
	}

	// Videos are ranked server-side, so the first is the best trailer available.
	let trailer = $derived(data.videos[0]);
	let next = $derived(data.nextEpisode);
	let nextDate = $derived(next && formatDate(next.air_date ?? ''));
</script>

<svelte:head>
	<title>{data.details.title}</title>
	<meta name="description" content={data.details.overview} />
	<link rel="preconnect" href={TMDB_IMAGE_ORIGIN} />
</svelte:head>

<main>
	<TitleDetails details={data.details} certification={data.certification}>
		{#if data.creators.length > 0 || data.networks.length > 0 || data.facts.status}
			<dl class="mt-5 grid gap-3 text-sm sm:grid-cols-3">
				{#if data.creators.length > 0}
					<div>
						<dt class="text-xs font-medium text-muted-foreground">
							{data.creators.length > 1 ? 'Creators' : 'Creator'}
						</dt>
						<dd class="mt-0.5 font-medium">
							{#each data.creators as creator, i (creator.id)}
								<a href={personHref(creator)} class="hover:underline">{creator.name}</a>{i <
								data.creators.length - 1
									? ', '
									: ''}
							{/each}
						</dd>
					</div>
				{/if}
				{#if data.networks.length > 0}
					<div>
						<dt class="text-xs font-medium text-muted-foreground">
							{data.networks.length > 1 ? 'Networks' : 'Network'}
						</dt>
						<dd class="mt-0.5 font-medium">
							{data.networks.map((network) => network.name).join(', ')}
						</dd>
					</div>
				{/if}
				{#if data.facts.status}
					<div>
						<dt class="text-xs font-medium text-muted-foreground">Status</dt>
						<dd class="mt-0.5 flex items-center gap-1.5 font-medium">
							{#if data.facts.status === 'Returning Series'}
								<span class="relative flex size-2" aria-hidden="true">
									<span
										class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60"
									></span>
									<span class="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
								</span>
							{/if}
							{data.facts.status}
						</dd>
					</div>
				{/if}
			</dl>
		{/if}

		{#if next}
			<p
				class="mt-5 flex items-start gap-3 rounded-xl border border-foreground/10 bg-foreground/5 p-3 text-sm"
			>
				<CalendarClockIcon
					class="mt-0.5 size-4 shrink-0 text-muted-foreground"
					aria-hidden="true"
				/>
				<span class="min-w-0">
					<span class="font-medium">Next episode</span>
					<span class="text-muted-foreground">
						· {episodeCode(next)}{next.name ? ` · ${next.name}` : ''}
					</span>
					<span class="block text-muted-foreground">{nextDate ?? 'Air date to be announced'}</span>
				</span>
			</p>
		{/if}

		<div class="mt-6 flex flex-wrap gap-2">
			{#if trailer}
				<Button onclick={() => play(trailer)}>
					<PlayIcon data-icon="inline-start" class="fill-current" />
					{trailer.type === 'Trailer' ? 'Watch trailer' : `Play ${trailer.type.toLowerCase()}`}
				</Button>
			{/if}
			<SaveButton item={data.details} appearance="button" />
			{#if data.seasons.length > 0}
				<Button variant={trailer ? 'outline' : 'default'} href="#seasons">
					<LayersIcon data-icon="inline-start" />
					Browse episodes
				</Button>
			{/if}
			{#if data.facts.imdb_id}
				<Button
					variant="outline"
					href="https://www.imdb.com/title/{data.facts.imdb_id}/"
					target="_blank"
					rel="noopener noreferrer"
				>
					IMDb
					<ExternalLinkIcon data-icon="inline-end" />
				</Button>
			{/if}
			{#if data.facts.homepage}
				<Button
					variant="outline"
					href={data.facts.homepage}
					target="_blank"
					rel="noopener noreferrer"
				>
					<GlobeIcon data-icon="inline-start" />
					Official site
				</Button>
			{/if}
		</div>
	</TitleDetails>

	<div class="mx-auto max-w-6xl space-y-12 px-4 pb-16">
		{#if data.cast.length > 0}
			<CastSection cast={data.cast} />
		{/if}

		<div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
			<div class="min-w-0 space-y-12">
				{#if data.season && data.selectedSeason !== null}
					<SeasonsSection
						showId={data.details.id}
						seasons={data.seasons}
						selected={data.selectedSeason}
						season={data.season}
					/>
				{/if}
				{#if data.crew.length > 0}
					<CrewSection crew={data.crew} title="Creators & key crew" />
				{/if}
				{#if data.videos.length > 0}
					<VideosSection videos={data.videos} onplay={play} />
				{/if}
				{#if data.reviews.length > 0}
					<ReviewsSection reviews={data.reviews} />
				{/if}
			</div>

			<aside class="space-y-6 lg:sticky lg:top-20 lg:self-start" aria-label="Show details">
				<WatchProviders providers={data.watchProviders} />
				<TvFacts facts={data.facts} networks={data.networks} runtime={data.details.runtime} />
			</aside>
		</div>

		{#if data.recommendations.length > 0}
			<MovieRow title="More like this" movies={data.recommendations} />
		{/if}
	</div>

	<VideoPlayerDialog video={playing} bind:open={playerOpen} />
</main>
