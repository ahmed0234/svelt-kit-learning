<script lang="ts">
	import * as Carousel from '#lib/components/ui/carousel/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import type { TmdbMovie } from '#lib/tmdb.js';
	import MovieCard from './movie-card.svelte';
	import SectionStatus from './section-status.svelte';
	import SliderNav from './slider-nav.svelte';

	type Props = {
		title: string;
		/** Pass the unawaited promise from `load` to stream it and show a skeleton meanwhile. */
		movies: Promise<TmdbMovie[]> | TmdbMovie[];
		class?: string;
	};

	let { title, movies, class: className }: Props = $props();

	const headingId = $props.id();
	// Shared by the cards and the skeleton so both lay out identically.
	const itemBasis = 'basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6';
</script>

{#snippet heading()}
	<h2 id={headingId} class="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
{/snippet}

<section class={className} aria-labelledby={headingId}>
	{#await movies}
		<div class="mb-3">{@render heading()}</div>
		<div class="-ms-4 flex overflow-hidden py-2" aria-busy="true" aria-label="Loading {title}">
			{#each { length: 6 }, i (i)}
				<div class="shrink-0 ps-4 {itemBasis}">
					<Skeleton class="aspect-2/3 rounded-xl" />
				</div>
			{/each}
		</div>
	{:then list}
		{#if list.length > 0}
			<Carousel.Root opts={{ align: 'start', slidesToScroll: 'auto' }}>
				<div class="mb-3 flex items-center justify-between gap-4">
					{@render heading()}
					<SliderNav />
				</div>
				<!-- Vertical padding leaves room for the hover lift inside the clipped viewport. -->
				<Carousel.Content class="py-2">
					{#each list as movie (movie.id)}
						<Carousel.Item class={itemBasis}>
							<MovieCard {movie} />
						</Carousel.Item>
					{/each}
				</Carousel.Content>
			</Carousel.Root>
		{:else}
			<div class="mb-3">{@render heading()}</div>
			<SectionStatus kind="empty" message="Nothing to show here right now." class="h-64" />
		{/if}
	{:catch}
		<div class="mb-3">{@render heading()}</div>
		<SectionStatus kind="error" message="We couldn't load {title.toLowerCase()}." class="h-64" />
	{/await}
</section>
