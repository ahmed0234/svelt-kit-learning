<script lang="ts">
	import DetailsSection from '#lib/components/movie-details/details-section.svelte';
	import SliderNav from '#lib/components/movies/slider-nav.svelte';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import * as Carousel from '#lib/components/ui/carousel/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { profileSrcset, TMDB_IMAGE_ORIGIN, tmdbImageUrl } from '#lib/tmdb.js';

	type Props = { photos: string[]; name: string };

	let { photos, name }: Props = $props();

	// Matches the item widths below (2.5 / 4 / 6 per view).
	const SIZES = '(min-width: 1024px) 180px, (min-width: 640px) 25vw, 40vw';

	let open = $state(false);
	// Kept set while closing so the exit animation has content.
	let current = $state<number | null>(null);

	function show(index: number) {
		current = index;
		open = true;
	}
</script>

<Carousel.Root opts={{ align: 'start', slidesToScroll: 'auto' }}>
	<DetailsSection title="Photos">
		{#snippet action()}
			<SliderNav />
		{/snippet}

		<Carousel.Content>
			{#each photos as path, i (path)}
				<Carousel.Item class="basis-[40%] sm:basis-1/4 lg:basis-1/6">
					<button
						type="button"
						draggable="false"
						class="group relative block aspect-2/3 w-full overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-foreground/5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						onclick={() => show(i)}
					>
						<TmdbImage
							src={tmdbImageUrl(path, 185)}
							srcset={profileSrcset(path)}
							sizes={SIZES}
							class="group-hover:scale-105"
						/>
						<span class="sr-only">View photo {i + 1} of {photos.length}</span>
					</button>
				</Carousel.Item>
			{/each}
		</Carousel.Content>
	</DetailsSection>
</Carousel.Root>

<Dialog.Root bind:open>
	<Dialog.Content class="w-auto max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:max-w-none">
		{#if current !== null}
			<Dialog.Title class="sr-only">{name}, photo {current + 1} of {photos.length}</Dialog.Title>
			<img
				src="{TMDB_IMAGE_ORIGIN}/t/p/h632{photos[current]}"
				alt="{name}, photo {current + 1}"
				width="421"
				height="632"
				decoding="async"
				class="block max-h-[85svh] w-auto bg-muted object-contain"
			/>
		{/if}
	</Dialog.Content>
</Dialog.Root>
