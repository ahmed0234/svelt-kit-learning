<script lang="ts">
	import type { MovieExtras } from '#lib/tmdb.js';
	import FactsCard from './facts-card.svelte';

	let { facts }: { facts: MovieExtras['facts'] } = $props();

	const usd = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		notation: 'compact',
		maximumFractionDigits: 1
	});

	let rows = $derived([
		{ label: 'Status', value: facts.status },
		{ label: 'Original title', value: facts.original_title },
		{ label: 'Original language', value: facts.original_language },
		{ label: 'Collection', value: facts.collection },
		{ label: 'Budget', value: facts.budget > 0 ? usd.format(facts.budget) : null },
		{ label: 'Box office', value: facts.revenue > 0 ? usd.format(facts.revenue) : null },
		{ label: 'Production', value: facts.companies.join(', ') },
		{ label: 'Countries', value: facts.countries.join(', ') },
		{ label: 'Spoken languages', value: facts.languages.join(', ') }
	]);

	// Box office as a multiple of the budget, shown as a bar capped at 5×.
	let returnMultiple = $derived(
		facts.budget > 0 && facts.revenue > 0 ? facts.revenue / facts.budget : null
	);
</script>

<FactsCard {rows} keywords={facts.keywords}>
	{#if returnMultiple}
		<div class="mt-4">
			<div class="flex items-baseline justify-between text-xs">
				<span class="text-muted-foreground">Return on budget</span>
				<span class="font-semibold tabular-nums">{returnMultiple.toFixed(1)}×</span>
			</div>
			<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
				<div
					class={['h-full rounded-full', returnMultiple >= 1 ? 'bg-emerald-500' : 'bg-destructive']}
					style:width="{Math.min(returnMultiple / 5, 1) * 100}%"
				></div>
			</div>
		</div>
	{/if}
</FactsCard>
