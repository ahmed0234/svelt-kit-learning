<script lang="ts">
	import UserIcon from '@lucide/svelte/icons/user';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import SliderNav from '#lib/components/movies/slider-nav.svelte';
	import * as Carousel from '#lib/components/ui/carousel/index.js';
	import { personHref, profileSrcset, tmdbImageUrl, type CastMember } from '#lib/tmdb.js';
	import DetailsSection from './details-section.svelte';

	let { cast }: { cast: CastMember[] } = $props();

	// Matches the item widths below (2.5 / 4 / 5 / 7 per view).
	const SIZES =
		'(min-width: 1184px) 150px, (min-width: 1024px) 14vw, (min-width: 768px) 20vw, (min-width: 640px) 25vw, 40vw';
</script>

<Carousel.Root opts={{ align: 'start', slidesToScroll: 'auto' }}>
	<DetailsSection title="Top cast">
		{#snippet action()}
			<SliderNav />
		{/snippet}

		<Carousel.Content>
			{#each cast as person, i (person.id)}
				<Carousel.Item
					class="basis-[40%] sm:basis-1/4 md:basis-1/5 lg:basis-1/7"
					aria-label="{i + 1} of {cast.length}: {person.name}"
				>
					<a
						href={personHref(person)}
						draggable="false"
						class="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					>
						<figure>
							<div
								class="relative aspect-2/3 overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-foreground/5 transition duration-300 ease-out group-hover:shadow-lg group-hover:ring-foreground/15"
							>
								<TmdbImage
									src={person.profile_path && tmdbImageUrl(person.profile_path, 185)}
									srcset={person.profile_path && profileSrcset(person.profile_path)}
									sizes={SIZES}
									placeholder={UserIcon}
									class="group-hover:scale-105"
								/>
							</div>
							<figcaption class="mt-2 px-0.5">
								<p
									class="line-clamp-1 text-sm font-medium group-hover:underline"
									title={person.name}
								>
									{person.name}
								</p>
								{#if person.character}
									<p class="line-clamp-2 text-xs text-muted-foreground">{person.character}</p>
								{/if}
								{#if person.episode_count}
									<p
										class="mt-0.5 text-[0.6875rem] font-medium text-muted-foreground/80 tabular-nums"
									>
										{person.episode_count}
										{person.episode_count === 1 ? 'episode' : 'episodes'}
									</p>
								{/if}
							</figcaption>
						</figure>
					</a>
				</Carousel.Item>
			{/each}
		</Carousel.Content>
	</DetailsSection>
</Carousel.Root>
