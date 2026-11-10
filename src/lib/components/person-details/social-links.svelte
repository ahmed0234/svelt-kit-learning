<script lang="ts">
	import AtSignIcon from '@lucide/svelte/icons/at-sign';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import ClapperboardIcon from '@lucide/svelte/icons/clapperboard';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import Music2Icon from '@lucide/svelte/icons/music-2';
	import PlayIcon from '@lucide/svelte/icons/play';
	import UsersIcon from '@lucide/svelte/icons/users';
	import type { SocialLink } from '#lib/tmdb.js';

	let { links }: { links: SocialLink[] } = $props();

	const headingId = $props.id();

	// Lucide has no brand logos, so each network gets a recognisable generic icon and a tint.
	const STYLES: Record<SocialLink['kind'], { icon: typeof GlobeIcon; tint: string }> = {
		imdb: { icon: ClapperboardIcon, tint: 'bg-amber-400/15 text-amber-700 dark:text-amber-300' },
		instagram: { icon: CameraIcon, tint: 'bg-pink-500/15 text-pink-700 dark:text-pink-300' },
		twitter: { icon: AtSignIcon, tint: 'bg-foreground/10 text-foreground' },
		facebook: { icon: UsersIcon, tint: 'bg-blue-500/15 text-blue-700 dark:text-blue-300' },
		tiktok: { icon: Music2Icon, tint: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' },
		youtube: { icon: PlayIcon, tint: 'bg-red-500/15 text-red-700 dark:text-red-300' },
		wikidata: {
			icon: BookOpenIcon,
			tint: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
		},
		homepage: { icon: GlobeIcon, tint: 'bg-primary/10 text-primary' }
	};
</script>

<section
	class="rounded-2xl border border-foreground/10 bg-muted/30 p-5"
	aria-labelledby={headingId}
>
	<h2 id={headingId} class="font-semibold">Social & links</h2>

	{#if links.length > 0}
		<ul class="mt-4 space-y-1">
			{#each links as link (link.kind)}
				{@const style = STYLES[link.kind]}
				<li>
					<!-- External profiles, so resolve() doesn't apply. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						class="group -mx-2 flex items-center gap-3 rounded-xl p-2 transition-colors outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring"
					>
						<span class="grid size-9 shrink-0 place-items-center rounded-lg {style.tint}">
							<style.icon class="size-4" aria-hidden="true" />
						</span>
						<span class="min-w-0 flex-1">
							<span class="block text-sm font-medium">{link.label}</span>
							{#if link.handle}
								<span class="block truncate text-xs text-muted-foreground">{link.handle}</span>
							{/if}
						</span>
						<ExternalLinkIcon
							class="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
							aria-hidden="true"
						/>
						<span class="sr-only">(opens in a new tab)</span>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-4 text-sm text-muted-foreground">No social profiles listed.</p>
	{/if}
</section>
