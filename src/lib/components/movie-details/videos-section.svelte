<script lang="ts">
	import PlayIcon from '@lucide/svelte/icons/play';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import SliderNav from '#lib/components/movies/slider-nav.svelte';
	import * as Carousel from '#lib/components/ui/carousel/index.js';
	import { youtubeThumbnail, youtubeThumbnailSrcset, type MovieVideo } from '#lib/tmdb.js';
	import DetailsSection from './details-section.svelte';

	type Props = {
		videos: MovieVideo[];
		onplay: (video: MovieVideo) => void;
		title?: string;
	};

	let { videos, onplay, title = 'Trailers & videos' }: Props = $props();

	// Two per view from `sm` up, inside the main column (at most ~780px wide).
	const SIZES = '(min-width: 1024px) 390px, (min-width: 640px) 50vw, 80vw';
</script>

<Carousel.Root opts={{ align: 'start', slidesToScroll: 'auto' }}>
	<DetailsSection {title}>
		{#snippet action()}
			<SliderNav />
		{/snippet}

		<Carousel.Content>
			{#each videos as video (video.key)}
				<Carousel.Item class="basis-4/5 sm:basis-1/2">
					<button
						type="button"
						class="group block w-full rounded-xl text-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						onclick={() => onplay(video)}
					>
						<span
							class="relative isolate block aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/5"
						>
							<TmdbImage
								src={youtubeThumbnail(video.key)}
								srcset={youtubeThumbnailSrcset(video.key)}
								sizes={SIZES}
								class="group-hover:scale-105"
							/>
							<span
								class="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"
							></span>
							<span
								class="absolute inset-0 m-auto grid size-12 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:bg-black/60"
							>
								<PlayIcon class="size-5 translate-x-px fill-current" aria-hidden="true" />
							</span>
							<span
								class="absolute start-2 bottom-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-md"
							>
								{video.type}
							</span>
						</span>
						<span class="mt-2 line-clamp-1 block px-0.5 text-sm font-medium" title={video.name}>
							<span class="sr-only">Play </span>{video.name}
						</span>
					</button>
				</Carousel.Item>
			{/each}
		</Carousel.Content>
	</DetailsSection>
</Carousel.Root>
