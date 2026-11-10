<script lang="ts">
	import TvIcon from '@lucide/svelte/icons/tv';
	import { tmdbImageUrl, type WatchProvider, type WatchProviders } from '#lib/tmdb.js';

	let { providers }: { providers: WatchProviders } = $props();

	const headingId = $props.id();

	let groups = $derived(
		[
			{ label: 'Stream', items: providers.stream },
			{ label: 'Rent', items: providers.rent },
			{ label: 'Buy', items: providers.buy }
		].filter((group) => group.items.length > 0)
	);
</script>

{#snippet logo(provider: WatchProvider)}
	<img
		src={tmdbImageUrl(provider.logo_path, 92)}
		alt=""
		width="40"
		height="40"
		loading="lazy"
		decoding="async"
		class="size-10 rounded-lg bg-muted object-cover ring-1 ring-foreground/10"
	/>
	<span class="sr-only">{provider.name}</span>
{/snippet}

<section
	class="rounded-2xl border border-foreground/10 bg-muted/30 p-5"
	aria-labelledby={headingId}
>
	<h2 id={headingId} class="flex items-center gap-2 font-semibold">
		<TvIcon class="size-4 text-muted-foreground" aria-hidden="true" />
		Where to watch
	</h2>
	<p class="mt-0.5 text-xs text-muted-foreground">In {providers.region}</p>

	{#if groups.length > 0}
		<div class="mt-4 space-y-4">
			{#each groups as group (group.label)}
				<div>
					<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						{group.label}
					</h3>
					<ul class="mt-2 flex flex-wrap gap-2">
						{#each group.items as provider (provider.id)}
							<li title={provider.name}>
								{#if providers.link}
									<!-- External TMDB page, so resolve() doesn't apply. -->
									<!-- eslint-disable svelte/no-navigation-without-resolve -->
									<a
										href={providers.link}
										target="_blank"
										rel="noopener noreferrer"
										class="block rounded-lg transition outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring"
									>
										{@render logo(provider)}
									</a>
									<!-- eslint-enable svelte/no-navigation-without-resolve -->
								{:else}
									{@render logo(provider)}
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
		<p class="mt-4 text-[0.6875rem] text-muted-foreground">Availability data by JustWatch</p>
	{:else}
		<p class="mt-4 text-sm text-muted-foreground">
			Not available to stream, rent or buy in your region yet.
		</p>
	{/if}
</section>
