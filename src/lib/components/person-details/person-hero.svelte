<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CakeIcon from '@lucide/svelte/icons/cake';
	import FlowerIcon from '@lucide/svelte/icons/flower';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import UserIcon from '@lucide/svelte/icons/user';
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		backdropSrcset,
		formatDate,
		personAge,
		profileSrcset,
		tmdbImageUrl,
		type PersonDetails
	} from '#lib/tmdb.js';

	type Props = {
		person: PersonDetails;
		/** Backdrop of one of the person's best-known movies; the profile is blurred in otherwise. */
		backdropPath: string | null;
		/** Extra content at the bottom of the info card (e.g. actions). */
		children?: Snippet;
	};

	let { person, backdropPath, children }: Props = $props();

	// Same frame as title-details.svelte, so the two pages feel like one product.
	const BACKDROP_SIZES = '(min-width: 1184px) 1152px, calc(100vw - 2rem)';
	const PROFILE_SIZES = '(min-width: 1024px) 240px, (min-width: 640px) 180px, 144px';
	// Roughly six lines in the card; shorter biographies don't need a toggle.
	const COLLAPSE_AFTER_CHARS = 600;

	let expanded = $state(false);

	let age = $derived(person.birthday ? personAge(person.birthday, person.deathday) : null);
	let born = $derived(formatDate(person.birthday ?? ''));
	let died = $derived(formatDate(person.deathday ?? ''));
	let isLong = $derived(person.biography.length > COLLAPSE_AFTER_CHARS);

	const bioId = $props.id();
</script>

<article class="mx-auto max-w-6xl px-4 py-6 sm:py-8">
	<Button variant="ghost" size="sm" href={resolve('/')} class="-ms-2.5 mb-4">
		<ArrowLeftIcon data-icon="inline-start" />
		Back to browse
	</Button>

	<div class="relative isolate aspect-video overflow-hidden rounded-2xl bg-muted lg:aspect-21/9">
		{#if backdropPath}
			<TmdbImage
				src={tmdbImageUrl(backdropPath, 780)}
				srcset={backdropSrcset(backdropPath)}
				sizes={BACKDROP_SIZES}
				eager
			/>
		{:else}
			<TmdbImage
				src={person.profile_path && tmdbImageUrl(person.profile_path, 185)}
				sizes={BACKDROP_SIZES}
				placeholder={UserIcon}
				eager
				class="scale-110 blur-2xl"
			/>
		{/if}
		<div
			class="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/30 to-transparent"
		></div>
	</div>

	<div
		class="relative -mt-16 grid gap-6 sm:-mt-28 sm:grid-cols-[180px_1fr] sm:px-6 lg:-mt-36 lg:grid-cols-[240px_1fr] lg:px-8"
	>
		<div
			class="relative aspect-2/3 w-36 animate-in overflow-hidden rounded-xl bg-muted shadow-xl ring-1 ring-foreground/10 duration-500 fade-in slide-in-from-bottom-4 sm:w-full"
		>
			<TmdbImage
				src={person.profile_path && tmdbImageUrl(person.profile_path, 185)}
				srcset={person.profile_path && profileSrcset(person.profile_path)}
				sizes={PROFILE_SIZES}
				placeholder={UserIcon}
				eager
			/>
		</div>

		<div
			class="animate-in self-end rounded-2xl border border-foreground/10 bg-background/60 p-5 shadow-lg backdrop-blur-xl backdrop-saturate-150 delay-75 duration-500 fill-mode-both fade-in slide-in-from-bottom-4 sm:p-6"
		>
			<h1 class="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
				{person.name}
			</h1>

			{#if person.known_for_department || person.gender}
				<ul class="mt-3 flex flex-wrap gap-2" aria-label="Profile">
					{#if person.known_for_department}
						<li><Badge>{person.known_for_department}</Badge></li>
					{/if}
					{#if person.gender}
						<li><Badge variant="secondary">{person.gender}</Badge></li>
					{/if}
				</ul>
			{/if}

			<dl class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
				{#if born}
					<div class="inline-flex items-center gap-1.5">
						<dt>
							<CakeIcon class="size-4 text-muted-foreground" /><span class="sr-only">Born</span>
						</dt>
						<dd>
							{born}{#if age !== null && !died}<span class="text-muted-foreground">
									· {age} years old</span
								>{/if}
						</dd>
					</div>
				{/if}
				{#if died}
					<div class="inline-flex items-center gap-1.5">
						<dt>
							<FlowerIcon class="size-4 text-muted-foreground" /><span class="sr-only">Died</span>
						</dt>
						<dd>
							{died}{#if age !== null}<span class="text-muted-foreground"> · aged {age}</span>{/if}
						</dd>
					</div>
				{/if}
				{#if person.place_of_birth}
					<div class="inline-flex min-w-0 items-center gap-1.5">
						<dt>
							<MapPinIcon class="size-4 text-muted-foreground" /><span class="sr-only"
								>Place of birth</span
							>
						</dt>
						<dd class="text-muted-foreground">{person.place_of_birth}</dd>
					</div>
				{/if}
			</dl>

			<h2 class="mt-6 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
				Biography
			</h2>
			{#if person.biography}
				<p
					id={bioId}
					class={[
						'mt-2 max-w-prose leading-relaxed whitespace-pre-line',
						isLong && !expanded && 'line-clamp-6'
					]}
				>
					{person.biography}
				</p>
				{#if isLong}
					<Button
						variant="link"
						size="sm"
						class="mt-1 h-auto px-0"
						aria-expanded={expanded}
						aria-controls={bioId}
						onclick={() => (expanded = !expanded)}
					>
						{expanded ? 'Show less' : 'Read full biography'}
					</Button>
				{/if}
			{:else}
				<p class="mt-2 max-w-prose leading-relaxed text-muted-foreground">
					We don't have a biography for {person.name} yet.
				</p>
			{/if}

			{@render children?.()}
		</div>
	</div>
</article>
