<script lang="ts">
	import { HeroSlider, MovieRow } from '#lib/components/movies/index.js';
	import { TMDB_IMAGE_ORIGIN } from '#lib/tmdb.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Movies, TV and anime alternate so similar rows aren't stacked together.
	let rows = $derived([
		{ title: 'Popular Movies', movies: data.popular },
		{ title: 'Trending Movies', movies: data.trendingToday },
		{ title: 'Popular TV Shows', movies: data.popularTv },
		{ title: 'Trending Anime', movies: data.trendingAnime },
		{ title: 'Action Movies', movies: data.action },
		{ title: 'Sci-Fi Movies', movies: data.sciFi },
		{ title: 'Trending TV Shows', movies: data.trendingTv },
		{ title: 'Popular Anime', movies: data.popularAnime },
		{ title: 'Comedy Movies', movies: data.comedy },
		{ title: 'Horror Movies', movies: data.horror },
		{ title: 'TV Drama Series', movies: data.tvDrama },
		{ title: 'Thriller Movies', movies: data.thriller },
		{ title: 'Romantic Movies', movies: data.romance }
	]);
</script>

<svelte:head>
	<link rel="preconnect" href={TMDB_IMAGE_ORIGIN} />
</svelte:head>

<main class="mx-auto max-w-6xl space-y-12 px-4 py-8">
	<h1 class="sr-only">Movie collections</h1>
	<HeroSlider movies={data.trending} />
	{#each rows as row (row.title)}
		<MovieRow title={row.title} movies={row.movies} />
	{/each}
</main>
