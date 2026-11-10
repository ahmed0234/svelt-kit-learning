<script lang="ts">
	import { getEmblaContext } from '#lib/components/ui/carousel/context.js';
	import SliderNav from './slider-nav.svelte';

	const ctx = getEmblaContext('<HeroControls/>');
</script>

<div class="mt-4 flex items-center justify-between gap-4">
	<p class="text-sm text-muted-foreground tabular-nums sm:hidden" aria-live="polite">
		{ctx.selectedIndex + 1} / {ctx.scrollSnaps.length}
	</p>

	<div class="hidden items-center sm:flex">
		{#each ctx.scrollSnaps as snap, i (snap)}
			<button
				type="button"
				class="group/dot p-1"
				aria-label="Go to slide {i + 1}"
				aria-current={i === ctx.selectedIndex}
				onclick={() => ctx.scrollTo(i)}
			>
				<span
					class={[
						'block h-1.5 rounded-full transition-all duration-300',
						i === ctx.selectedIndex
							? 'w-6 bg-foreground'
							: 'w-1.5 bg-foreground/20 group-hover/dot:bg-foreground/50'
					]}
				></span>
			</button>
		{/each}
	</div>

	<SliderNav />
</div>
