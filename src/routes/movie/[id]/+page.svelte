<script lang="ts">
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import PlayIcon from '@lucide/svelte/icons/play';
	import {
		CastSection,
		CrewSection,
		MovieFacts,
		ReviewsSection,
		VideoPlayerDialog,
		VideosSection,
		WatchProviders
	} from '#lib/components/movie-details/index.js';
	import { MovieRow, TitleDetails } from '#lib/components/movies/index.js';
	import { SaveButton } from '#lib/components/collections/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { TMDB_IMAGE_ORIGIN, type MovieVideo } from '#lib/tmdb.js';
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

	let directors = $derived(
		data.crew.filter((person) => person.jobs.includes('Director')).map((person) => person.name)
	);
	let writers = $derived(
		data.crew
			.filter((person) =>
				person.jobs.some((job) => ['Screenplay', 'Writer', 'Story', 'Novel'].includes(job))
			)
			.map((person) => person.name)
	);
	let credits = $derived(
		[
			{ label: directors.length > 1 ? 'Directors' : 'Director', names: directors },
			{ label: writers.length > 1 ? 'Writers' : 'Writer', names: writers }
		].filter((credit) => credit.names.length > 0)
	);
</script>

<svelte:head>
	<title>{data.details.title}</title>
	<meta name="description" content={data.details.overview} />
	<link rel="preconnect" href={TMDB_IMAGE_ORIGIN} />
</svelte:head>

<main>
	<TitleDetails details={data.details} certification={data.certification}>
		{#if credits.length > 0}
			<dl class="mt-5 grid gap-3 text-sm sm:grid-cols-2">
				{#each credits as credit (credit.label)}
					<div>
						<dt class="text-xs font-medium text-muted-foreground">{credit.label}</dt>
						<dd class="mt-0.5 font-medium">{credit.names.join(', ')}</dd>
					</div>
				{/each}
			</dl>
		{/if}

		<div class="mt-6 flex flex-wrap gap-2">
			{#if trailer}
				<Button onclick={() => play(trailer)}>
					<PlayIcon data-icon="inline-start" class="fill-current" />
					{trailer.type === 'Trailer' ? 'Watch trailer' : `Play ${trailer.type.toLowerCase()}`}
				</Button>
			{/if}
			<SaveButton item={data.details} appearance="button" />
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
				{#if data.crew.length > 0}
					<CrewSection crew={data.crew} />
				{/if}
				{#if data.videos.length > 0}
					<VideosSection videos={data.videos} onplay={play} />
				{/if}
				{#if data.reviews.length > 0}
					<ReviewsSection reviews={data.reviews} />
				{/if}
			</div>

			<aside class="space-y-6 lg:sticky lg:top-20 lg:self-start" aria-label="Movie details">
				<WatchProviders providers={data.watchProviders} />
				<MovieFacts facts={data.facts} />
			</aside>
		</div>

		{#if data.recommendations.length > 0}
			<MovieRow title="More like this" movies={data.recommendations} />
		{/if}
	</div>

	<VideoPlayerDialog video={playing} bind:open={playerOpen} />
</main>
