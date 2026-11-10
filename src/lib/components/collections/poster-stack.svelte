<script lang="ts">
	import LibraryIcon from '@lucide/svelte/icons/library';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import { tmdbImageUrl } from '#lib/tmdb.js';
	import { cn } from '#lib/utils.js';

	type Props = {
		/** Poster paths, front first; up to three are shown. */
		posters: string[];
		class?: string;
	};

	let { posters, class: className }: Props = $props();

	// Left, right and centre (on top). They fan out further while an ancestor `group/stack`
	// is hovered.
	const SLOTS = [
		'z-0 -translate-x-[58%] -rotate-[9deg] group-hover/stack:-translate-x-[72%] group-hover/stack:-rotate-[14deg]',
		'z-0 translate-x-[58%] rotate-[9deg] group-hover/stack:translate-x-[72%] group-hover/stack:rotate-[14deg]',
		'z-10 group-hover/stack:-translate-y-[6%] group-hover/stack:scale-105'
	];

	// Slot for each poster in order: the first takes the centre, the rest fan out behind it.
	const SLOT_ORDER = [2, 0, 1];

	let placed = $derived(
		posters.slice(0, 3).map((path, i) => ({ path, slot: SLOTS[SLOT_ORDER[i]] }))
	);
</script>

<div class={cn('relative grid place-items-center', className)} aria-hidden="true">
	{#if placed.length === 0}
		<div
			class="grid aspect-2/3 w-[30%] place-items-center rounded-xl border-2 border-dashed border-foreground/15 text-muted-foreground transition duration-500 group-hover/stack:-translate-y-[4%]"
		>
			<LibraryIcon class="size-6 opacity-50" />
		</div>
	{:else}
		{#each placed as poster (poster.slot)}
			<div
				class={cn(
					'absolute aspect-2/3 w-[30%] overflow-hidden rounded-xl bg-muted shadow-xl ring-1 ring-black/10 transition duration-500 ease-out',
					poster.slot
				)}
			>
				<TmdbImage src={tmdbImageUrl(poster.path, 185)} sizes="120px" />
			</div>
		{/each}
	{/if}
</div>
