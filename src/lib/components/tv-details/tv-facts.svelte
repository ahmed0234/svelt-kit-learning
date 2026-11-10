<script lang="ts">
	import FactsCard from '#lib/components/movie-details/facts-card.svelte';
	import { formatDate, formatRuntime, tmdbImageUrl, type TvExtras } from '#lib/tmdb.js';

	type Props = {
		facts: TvExtras['facts'];
		networks: TvExtras['networks'];
		/** Typical episode length in minutes. */
		runtime: number | null;
	};

	let { facts, networks, runtime }: Props = $props();

	const count = (n: number) => (n > 0 ? n.toLocaleString('en-US') : null);

	let rows = $derived([
		{
			label: 'Status',
			value:
				facts.status && facts.in_production && facts.status !== 'Returning Series'
					? `${facts.status} (in production)`
					: facts.status
		},
		{ label: 'Type', value: facts.type },
		{ label: 'First aired', value: formatDate(facts.first_air_date ?? '') },
		{ label: 'Last aired', value: formatDate(facts.last_air_date ?? '') },
		{ label: 'Seasons', value: count(facts.seasons) },
		{ label: 'Episodes', value: count(facts.episodes) },
		{ label: 'Episode runtime', value: runtime ? formatRuntime(runtime) : null },
		{ label: 'Original name', value: facts.original_name },
		{ label: 'Original language', value: facts.original_language },
		{ label: 'Production', value: facts.companies.join(', ') },
		{ label: 'Countries', value: facts.countries.join(', ') },
		{ label: 'Spoken languages', value: facts.languages.join(', ') }
	]);

	// Only interesting while a show is still airing; finished shows have aired everything.
	let progress = $derived(
		facts.aired_episodes !== null && facts.episodes > 0 && facts.aired_episodes < facts.episodes
			? facts.aired_episodes / facts.episodes
			: null
	);
</script>

<FactsCard {rows} keywords={facts.keywords}>
	{#if progress !== null}
		<div class="mt-4">
			<div class="flex items-baseline justify-between text-xs">
				<span class="text-muted-foreground">Episodes aired</span>
				<span class="font-semibold tabular-nums">{facts.aired_episodes} / {facts.episodes}</span>
			</div>
			<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
				<div class="h-full rounded-full bg-emerald-500" style:width="{progress * 100}%"></div>
			</div>
		</div>
	{/if}

	{#if networks.length > 0}
		<h3 class="mt-5 text-xs font-medium text-muted-foreground">
			{networks.length === 1 ? 'Network' : 'Networks'}
		</h3>
		<ul class="mt-2 flex flex-wrap gap-2">
			{#each networks as network (network.id)}
				<li title={network.name}>
					{#if network.logo_path}
						<!-- Logos are mostly dark on transparent, so they sit on a light chip in both themes. -->
						<span
							class="flex h-9 items-center rounded-lg bg-white px-2.5 shadow-sm ring-1 ring-foreground/10"
						>
							<img
								src={tmdbImageUrl(network.logo_path, 92)}
								alt={network.name}
								height="20"
								loading="lazy"
								decoding="async"
								class="h-5 w-auto max-w-24 object-contain"
							/>
						</span>
					{:else}
						<span
							class="flex h-9 items-center rounded-lg bg-background/60 px-3 text-sm font-medium ring-1 ring-foreground/10"
						>
							{network.name}
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</FactsCard>
