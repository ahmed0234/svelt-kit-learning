<script lang="ts">
	import * as Carousel from '#lib/components/ui/carousel/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import type { TmdbMovie } from '#lib/tmdb.js';
	import HeroControls from './hero-controls.svelte';
	import HeroSlide from './hero-slide.svelte';
	import SectionStatus from './section-status.svelte';

	type Props = {
		/** Pass the unawaited promise from `load` to stream it and show a skeleton meanwhile. */
		movies: Promise<TmdbMovie[]> | TmdbMovie[];
		title?: string;
		class?: string;
	};

	let { movies, title = 'Trending this week', class: className }: Props = $props();

	const headingId = $props.id();
	const frame = 'aspect-4/5 w-full rounded-2xl sm:aspect-video lg:aspect-21/9';
</script>

<section class={className} aria-labelledby={headingId}>
	<h2 id={headingId} class="mb-4 text-2xl font-semibold tracking-tight">{title}</h2>

	{#await movies}
		<div aria-busy="true" aria-label="Loading {title}" class="relative">
			<Skeleton class={frame} />
			<div
				class="absolute inset-x-3 bottom-3 space-y-3 sm:inset-x-auto sm:start-6 sm:bottom-6 sm:w-md"
			>
				<Skeleton class="h-4 w-32 bg-foreground/10" />
				<Skeleton class="h-7 w-3/4 bg-foreground/10" />
				<Skeleton class="h-4 w-full bg-foreground/10" />
			</div>
		</div>
	{:then list}
		{#if list.length > 0}
			<Carousel.Root opts={{ loop: true }}>
				<Carousel.Content>
					{#each list as movie, i (movie.id)}
						<Carousel.Item aria-label="{i + 1} of {list.length}: {movie.title}">
							<HeroSlide {movie} rank={i + 1} eager={i === 0} />
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				<HeroControls />
			</Carousel.Root>
		{:else}
			<SectionStatus
				kind="empty"
				message="No trending movies right now. Check back soon."
				class={frame}
			/>
		{/if}
	{:catch}
		<SectionStatus kind="error" message="We couldn't load trending movies." class={frame} />
	{/await}
</section>
