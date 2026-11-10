<script lang="ts">
	import ClapperboardIcon from '@lucide/svelte/icons/clapperboard';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { VideoPlayerDialog, VideosSection } from '#lib/components/movie-details/index.js';
	import { MovieRow } from '#lib/components/movies/index.js';
	import {
		FilmographySection,
		PersonFacts,
		PersonHero,
		PhotosSection,
		SocialLinks
	} from '#lib/components/person-details/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import { TMDB_IMAGE_ORIGIN, type MovieVideo } from '#lib/tmdb.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let playerOpen = $state(false);
	let playing = $state.raw<MovieVideo | null>(null);

	function play(video: MovieVideo) {
		playing = video;
		playerOpen = true;
	}

	let backdropPath = $derived(
		data.knownFor.find((movie) => movie.backdrop_path)?.backdrop_path ?? null
	);
	let imdb = $derived(data.social.find((link) => link.kind === 'imdb'));
	// TMDB has no interviews for people, so point at a YouTube search instead.
	let interviewsUrl = $derived(
		`https://www.youtube.com/results?search_query=${encodeURIComponent(`${data.person.name} interview`)}`
	);
	let description = $derived(
		data.person.biography.split('\n')[0].slice(0, 160) ||
			`Biography, movies and photos of ${data.person.name}.`
	);
</script>

<svelte:head>
	<title>{data.person.name}</title>
	<meta name="description" content={description} />
	<link rel="preconnect" href={TMDB_IMAGE_ORIGIN} />
</svelte:head>

<main>
	<PersonHero person={data.person} {backdropPath}>
		<div class="mt-6 flex flex-wrap gap-2">
			{#if data.filmography.length > 0}
				<Button href="#filmography">
					<ClapperboardIcon data-icon="inline-start" />
					View filmography
				</Button>
			{/if}
			<Button variant="outline" href={interviewsUrl} target="_blank" rel="noopener noreferrer">
				<SearchIcon data-icon="inline-start" />
				Find interviews
			</Button>
			{#if imdb}
				<Button variant="outline" href={imdb.url} target="_blank" rel="noopener noreferrer">
					IMDb
					<ExternalLinkIcon data-icon="inline-end" />
				</Button>
			{/if}
		</div>
	</PersonHero>

	<div class="mx-auto max-w-6xl space-y-12 px-4 pb-16">
		{#if data.knownFor.length > 0}
			<MovieRow title="Known for" movies={data.knownFor} />
		{/if}

		<div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
			<div class="min-w-0 space-y-12">
				{#if data.filmography.length > 0}
					<div id="filmography" class="scroll-mt-20">
						<FilmographySection
							groups={data.filmography}
							initial={data.person.known_for_department}
						/>
					</div>
				{/if}

				{#await data.videos}
					<div aria-busy="true" aria-label="Loading videos">
						<Skeleton class="mb-4 h-8 w-56" />
						<div class="grid gap-4 sm:grid-cols-2">
							<Skeleton class="aspect-video rounded-xl" />
							<Skeleton class="hidden aspect-video rounded-xl sm:block" />
						</div>
					</div>
				{:then videos}
					{#if videos.length > 0}
						<VideosSection title="Trailers & featurettes" {videos} onplay={play} />
					{/if}
				{/await}

				{#if data.photos.length > 1}
					<PhotosSection photos={data.photos} name={data.person.name} />
				{/if}
			</div>

			<aside
				class="space-y-6 lg:sticky lg:top-20 lg:self-start"
				aria-label="About {data.person.name}"
			>
				<PersonFacts person={data.person} filmography={data.filmography} />
				<SocialLinks links={data.social} />
			</aside>
		</div>
	</div>

	<VideoPlayerDialog video={playing} bind:open={playerOpen} />
</main>
