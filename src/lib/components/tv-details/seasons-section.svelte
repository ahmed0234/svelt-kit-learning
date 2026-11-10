<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import StarIcon from '@lucide/svelte/icons/star';
	import { navigating, page } from '$app/state';
	import DetailsSection from '#lib/components/movie-details/details-section.svelte';
	import SectionStatus from '#lib/components/movies/section-status.svelte';
	import SliderNav from '#lib/components/movies/slider-nav.svelte';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Carousel from '#lib/components/ui/carousel/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import {
		formatDate,
		posterSrcset,
		seasonHref,
		tmdbImageUrl,
		type TvSeason,
		type TvSeasonDetails
	} from '#lib/tmdb.js';
	import EpisodeCard from './episode-card.svelte';

	type Props = {
		showId: number;
		seasons: TvSeason[];
		/** Season number whose episodes are shown. */
		selected: number;
		/** That season's episodes; a promise while they stream in. */
		season: Promise<TvSeasonDetails> | TvSeasonDetails;
	};

	let { showId, seasons, selected, season }: Props = $props();

	// Matches the item widths below (2.5 / 4 / 5 per view in the main column).
	const SIZES = '(min-width: 1024px) 150px, (min-width: 768px) 20vw, (min-width: 640px) 25vw, 40vw';
	// Enough to get a feel for the season before asking to expand.
	const COLLAPSED_COUNT = 8;
	const today = new Date().toISOString().slice(0, 10);

	const episodesHeadingId = $props.id();

	/** Season whose full episode list is expanded; any other season starts collapsed. */
	let expandedSeason = $state<number | null>(null);

	let current = $derived(seasons.find((s) => s.season_number === selected) ?? seasons[0]);
	let startIndex = $derived(Math.max(0, seasons.indexOf(current)));
	// Picking another season reruns this page's load; dim the old episodes meanwhile.
	let switching = $derived(!!navigating.to && navigating.to.url.pathname === page.url.pathname);
	let year = $derived(current?.air_date?.slice(0, 4));
	let airDate = $derived(formatDate(current?.air_date ?? ''));
	let showAll = $derived(expandedSeason === current?.season_number);
</script>

<div id="seasons" class="scroll-mt-20 space-y-6">
	<!-- `startIndex` only applies on mount, so the selected season starts in view. -->
	<Carousel.Root opts={{ align: 'start', slidesToScroll: 'auto', startIndex }}>
		<DetailsSection title="Seasons">
			{#snippet action()}
				<div class="flex items-center gap-3">
					<span class="hidden text-sm text-muted-foreground tabular-nums sm:inline">
						{seasons.length}
						{seasons.length === 1 ? 'season' : 'seasons'}
					</span>
					<SliderNav />
				</div>
			{/snippet}

			<!-- Vertical padding leaves room for the selected ring and hover lift. -->
			<Carousel.Content class="py-2">
				{#each seasons as item (item.id)}
					{@const isCurrent = item.season_number === current?.season_number}
					<Carousel.Item class="basis-[40%] sm:basis-1/4 md:basis-1/5">
						<!-- seasonHref() is built on resolve(); the lint rule can't see through it. -->
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							href={seasonHref(showId, item.season_number)}
							data-sveltekit-noscroll
							data-sveltekit-replacestate
							draggable="false"
							aria-current={isCurrent ? 'true' : undefined}
							class="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						>
							<div
								class={[
									'relative aspect-2/3 overflow-hidden rounded-xl bg-muted shadow-sm transition duration-300 ease-out',
									isCurrent
										? 'shadow-xl ring-2 ring-primary ring-offset-2 ring-offset-background'
										: 'ring-1 ring-foreground/5 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:ring-foreground/15'
								]}
							>
								<TmdbImage
									src={item.poster_path && tmdbImageUrl(item.poster_path, 185)}
									srcset={item.poster_path && posterSrcset(item.poster_path)}
									sizes={SIZES}
									placeholder={LayersIcon}
									class="group-hover:scale-105"
								/>
								<span
									class="absolute inset-x-1.5 bottom-1.5 rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-center text-[0.6875rem] font-medium text-white tabular-nums backdrop-blur-md"
								>
									{item.episode_count}
									{item.episode_count === 1 ? 'episode' : 'episodes'}
								</span>
								{#if isCurrent}
									<span
										class="absolute start-1.5 top-1.5 animate-in rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-semibold text-primary-foreground shadow-md duration-300 zoom-in-75 fade-in"
									>
										Viewing
									</span>
								{/if}
							</div>
							<p
								class={[
									'mt-2 line-clamp-1 px-0.5 text-sm font-medium',
									isCurrent ? 'text-foreground' : 'text-foreground/85 group-hover:underline'
								]}
								title={item.name}
							>
								{item.name}
							</p>
							<p class="px-0.5 text-xs text-muted-foreground tabular-nums">
								{item.air_date?.slice(0, 4) ?? 'TBA'}
							</p>
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</Carousel.Item>
				{/each}
			</Carousel.Content>
		</DetailsSection>
	</Carousel.Root>

	{#if current}
		<section
			aria-labelledby={episodesHeadingId}
			aria-busy={switching}
			class={['transition-opacity duration-300', switching && 'pointer-events-none opacity-50']}
		>
			{#key current.season_number}
				<!-- Season summary: available immediately from the show, before episodes load. -->
				<div
					class="flex animate-in gap-4 rounded-2xl border border-foreground/10 bg-background/60 p-4 shadow-lg backdrop-blur-xl backdrop-saturate-150 duration-500 fade-in slide-in-from-bottom-2 sm:p-5"
				>
					<div
						class="relative hidden aspect-2/3 w-24 shrink-0 self-start overflow-hidden rounded-xl bg-muted shadow-md ring-1 ring-foreground/10 sm:block"
					>
						<TmdbImage
							src={current.poster_path && tmdbImageUrl(current.poster_path, 185)}
							sizes="96px"
							placeholder={LayersIcon}
						/>
					</div>
					<div class="min-w-0">
						<h3 id={episodesHeadingId} class="text-lg font-semibold tracking-tight sm:text-xl">
							{current.name}
						</h3>
						<p
							class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
						>
							<span class="tabular-nums">
								{current.episode_count}
								{current.episode_count === 1 ? 'episode' : 'episodes'}
							</span>
							{#if airDate}
								<span aria-hidden="true">·</span>
								<span>Premiered {airDate}</span>
							{:else if !year}
								<span aria-hidden="true">·</span>
								<span>Air date TBA</span>
							{/if}
							{#if current.vote_average > 0}
								<span aria-hidden="true">·</span>
								<span class="inline-flex items-center gap-1">
									<StarIcon class="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
									<span class="font-medium text-foreground"
										><span class="sr-only">Rated </span>{current.vote_average.toFixed(1)}</span
									>
								</span>
							{/if}
						</p>
						{#if current.overview}
							<p class="mt-3 max-w-prose text-sm leading-relaxed text-foreground/85">
								{current.overview}
							</p>
						{/if}
					</div>
				</div>

				<div class="mt-4">
					{#await season}
						<span class="sr-only" role="status">Loading episodes…</span>
						<ul class="space-y-3" aria-hidden="true">
							{#each { length: 3 }, i (i)}
								<li
									class="grid grid-cols-[8rem_1fr] gap-3 rounded-2xl border border-foreground/10 bg-muted/30 p-3 sm:grid-cols-[13rem_1fr] sm:gap-4 sm:p-4"
								>
									<Skeleton class="aspect-video rounded-xl" />
									<div class="space-y-2 py-1">
										<Skeleton class="h-3 w-28" />
										<Skeleton class="h-5 w-2/3" />
										<Skeleton class="hidden h-4 w-full sm:block" />
										<Skeleton class="hidden h-4 w-4/5 sm:block" />
									</div>
								</li>
							{/each}
						</ul>
					{:then details}
						{#if details.episodes.length > 0}
							{@const visible = showAll
								? details.episodes
								: details.episodes.slice(0, COLLAPSED_COUNT)}
							<ol class="space-y-3">
								{#each visible as episode, i (episode.id)}
									<li
										class="animate-in duration-500 fill-mode-both fade-in slide-in-from-bottom-2"
										style:animation-delay="{Math.min(i % COLLAPSED_COUNT, 8) * 40}ms"
									>
										<EpisodeCard {episode} {today} />
									</li>
								{/each}
							</ol>

							{#if details.episodes.length > COLLAPSED_COUNT}
								<div class="mt-4 flex justify-center">
									<Button
										variant="outline"
										size="sm"
										aria-expanded={showAll}
										onclick={() => (expandedSeason = showAll ? null : current.season_number)}
									>
										{showAll ? 'Show fewer' : `Show all ${details.episodes.length} episodes`}
										<ChevronDownIcon
											data-icon="inline-end"
											class={['transition-transform duration-300', showAll && 'rotate-180']}
										/>
									</Button>
								</div>
							{/if}
						{:else}
							<SectionStatus kind="empty" message="No episodes listed for this season yet." />
						{/if}
					{:catch}
						<SectionStatus kind="error" message="We couldn't load these episodes." />
					{/await}
				</div>
			{/key}
		</section>
	{/if}
</div>
