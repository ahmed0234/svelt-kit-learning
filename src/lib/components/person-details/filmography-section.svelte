<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import StarIcon from '@lucide/svelte/icons/star';
	import DetailsSection from '#lib/components/movie-details/details-section.svelte';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import {
		detailsHref,
		formatRating,
		releaseYear,
		tmdbImageUrl,
		type FilmographyGroup
	} from '#lib/tmdb.js';

	type Props = {
		groups: FilmographyGroup[];
		/** Department to show first, e.g. the person's `known_for_department`. */
		initial?: string | null;
	};

	let { groups, initial }: Props = $props();

	// Enough to fill the column next to the sidebar before asking to expand.
	const COLLAPSED_COUNT = 12;
	const today = new Date().toISOString().slice(0, 10);

	// svelte-ignore state_referenced_locally
	let department = $state(
		groups.find((group) => group.department === initial)?.department ?? groups[0]?.department ?? ''
	);
	let showAll = $state(false);

	let credits = $derived(groups.find((group) => group.department === department)?.credits ?? []);
	let visible = $derived(showAll ? credits : credits.slice(0, COLLAPSED_COUNT));

	function select(value: string) {
		// Toggle groups allow deselecting; keep one department active.
		if (!value) return;
		department = value;
		showAll = false;
	}
</script>

<DetailsSection title="Filmography">
	{#snippet action()}
		<span class="text-sm text-muted-foreground tabular-nums">
			{credits.length}
			{credits.length === 1 ? 'movie' : 'movies'}
		</span>
	{/snippet}

	{#if groups.length > 1}
		<!-- Scrolls sideways on small screens instead of wrapping into a tall block. -->
		<div class="-mx-4 mb-4 [scrollbar-width:none] overflow-x-auto px-4">
			<ToggleGroup.Root
				type="single"
				variant="outline"
				size="sm"
				value={department}
				onValueChange={select}
				aria-label="Department"
			>
				{#each groups as group (group.department)}
					<ToggleGroup.Item value={group.department} class="px-3 whitespace-nowrap">
						{group.department}
						<span class="text-muted-foreground tabular-nums">{group.credits.length}</span>
					</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>
		</div>
	{/if}

	<ol
		class="divide-y divide-foreground/10 overflow-hidden rounded-2xl border border-foreground/10 bg-muted/30"
	>
		{#each visible as credit (credit.id)}
			{@const year = releaseYear(credit)}
			{@const rating = formatRating(credit)}
			{@const upcoming = !credit.release_date || credit.release_date > today}
			<li class="animate-in duration-300 fade-in">
				<a
					href={detailsHref(credit)}
					class="group flex items-center gap-3 p-2.5 pe-4 transition-colors outline-none hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:gap-4"
				>
					<span
						class="w-10 shrink-0 text-center text-sm font-medium text-muted-foreground tabular-nums sm:w-12"
					>
						{year ?? '—'}
					</span>
					<span
						class="relative aspect-2/3 w-11 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10 sm:w-12"
					>
						<TmdbImage
							src={credit.poster_path && tmdbImageUrl(credit.poster_path, 92)}
							srcset={credit.poster_path &&
								`${tmdbImageUrl(credit.poster_path, 92)} 92w, ${tmdbImageUrl(credit.poster_path, 185)} 185w`}
							sizes="48px"
							class="group-hover:scale-105"
						/>
					</span>
					<span class="min-w-0 flex-1">
						<span class="flex items-center gap-2">
							<span class="truncate font-medium group-hover:underline" title={credit.title}>
								{credit.title}
							</span>
							{#if upcoming}
								<span
									class="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-primary"
								>
									{credit.release_date ? 'Upcoming' : 'TBA'}
								</span>
							{/if}
						</span>
						{#if credit.roles.length > 0}
							<span class="line-clamp-1 text-sm text-muted-foreground">
								{department === 'Acting' ? 'as ' : ''}{credit.roles.join(', ')}
							</span>
						{/if}
					</span>
					{#if rating}
						<span class="inline-flex shrink-0 items-center gap-1 text-sm">
							<StarIcon class="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
							<span class="font-medium tabular-nums"
								><span class="sr-only">Rated </span>{rating}</span
							>
						</span>
					{/if}
				</a>
			</li>
		{/each}
	</ol>

	{#if credits.length > COLLAPSED_COUNT}
		<div class="mt-3 flex justify-center">
			<Button
				variant="outline"
				size="sm"
				aria-expanded={showAll}
				onclick={() => (showAll = !showAll)}
			>
				{showAll ? 'Show fewer' : `Show all ${credits.length}`}
				<ChevronDownIcon
					data-icon="inline-end"
					class={['transition-transform duration-300', showAll && 'rotate-180']}
				/>
			</Button>
		</div>
	{/if}
</DetailsSection>
