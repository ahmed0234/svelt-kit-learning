<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import StarIcon from '@lucide/svelte/icons/star';
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		backdropSrcset,
		formatDate,
		formatRating,
		formatRuntime,
		posterSrcset,
		tmdbImageUrl,
		type TmdbDetails
	} from '#lib/tmdb.js';
	import TmdbImage from './tmdb-image.svelte';

	type Props = {
		details: TmdbDetails;
		/** Age rating, e.g. "PG-13". */
		certification?: string | null;
		/** Extra content at the bottom of the info card (e.g. key crew and actions). */
		children?: Snippet;
	};

	let { details, certification, children }: Props = $props();

	const BACKDROP_SIZES = '(min-width: 1184px) 1152px, calc(100vw - 2rem)';
	const POSTER_SIZES = '(min-width: 1024px) 240px, (min-width: 640px) 180px, 144px';

	let isTv = $derived(details.media_type === 'tv');
	let rating = $derived(formatRating(details));
	let date = $derived(formatDate(details.release_date));
	let runtime = $derived(
		details.runtime && `${formatRuntime(details.runtime)}${isTv ? ' per episode' : ''}`
	);
	let seasons = $derived(
		details.seasons && `${details.seasons} season${details.seasons === 1 ? '' : 's'}`
	);
	// Without a backdrop, the poster fills the banner (blurred) so the page keeps its shape.
	let bannerPath = $derived(details.backdrop_path ?? details.poster_path);
</script>

<article class="mx-auto max-w-6xl px-4 py-6 sm:py-8">
	<Button variant="ghost" size="sm" href={resolve('/')} class="-ms-2.5 mb-4">
		<ArrowLeftIcon data-icon="inline-start" />
		Back to browse
	</Button>

	<div class="relative isolate aspect-video overflow-hidden rounded-2xl bg-muted lg:aspect-21/9">
		<TmdbImage
			src={bannerPath && tmdbImageUrl(bannerPath, 780)}
			srcset={details.backdrop_path
				? backdropSrcset(details.backdrop_path)
				: details.poster_path && posterSrcset(details.poster_path)}
			sizes={BACKDROP_SIZES}
			eager
			class={details.backdrop_path ? undefined : 'scale-110 blur-2xl'}
		/>
		<div
			class="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent"
		></div>
	</div>

	<div
		class="relative -mt-16 grid gap-6 sm:-mt-28 sm:grid-cols-[180px_1fr] sm:px-6 lg:-mt-36 lg:grid-cols-[240px_1fr] lg:px-8"
	>
		<div
			class="relative aspect-2/3 w-36 overflow-hidden rounded-xl bg-muted shadow-xl ring-1 ring-foreground/10 sm:w-full"
		>
			<TmdbImage
				src={details.poster_path && tmdbImageUrl(details.poster_path, 342)}
				srcset={details.poster_path && posterSrcset(details.poster_path)}
				sizes={POSTER_SIZES}
				eager
			/>
		</div>

		<div
			class="self-end rounded-2xl border border-foreground/10 bg-background/60 p-5 shadow-lg backdrop-blur-xl backdrop-saturate-150 sm:p-6"
		>
			<h1 class="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
				{details.title}
			</h1>
			{#if details.tagline}
				<p class="mt-1 text-muted-foreground italic">{details.tagline}</p>
			{/if}

			<dl class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
				{#if certification}
					<div>
						<dt class="sr-only">Age rating</dt>
						<dd
							class="rounded-sm border border-foreground/25 px-1.5 text-xs leading-5 font-semibold tracking-wide"
						>
							{certification}
						</dd>
					</div>
				{/if}
				{#if rating}
					<div class="inline-flex items-center gap-1.5">
						<dt class="sr-only">Rating</dt>
						<StarIcon class="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
						<dd>
							<span class="font-semibold">{rating}</span><span class="text-muted-foreground"
								>/10 · {details.vote_count.toLocaleString('en-US')} votes</span
							>
						</dd>
					</div>
				{/if}
				{#if date}
					<div>
						<dt class="sr-only">{isTv ? 'First aired' : 'Release date'}</dt>
						<dd class="text-muted-foreground">{date}</dd>
					</div>
				{/if}
				{#if runtime}
					<div>
						<dt class="sr-only">Runtime</dt>
						<dd class="text-muted-foreground">{runtime}</dd>
					</div>
				{/if}
				{#if seasons}
					<div>
						<dt class="sr-only">Seasons</dt>
						<dd class="text-muted-foreground">{seasons}</dd>
					</div>
				{/if}
			</dl>

			{#if details.genres.length > 0}
				<ul class="mt-4 flex flex-wrap gap-2" aria-label="Genres">
					{#each details.genres as genre (genre)}
						<li><Badge variant="secondary">{genre}</Badge></li>
					{/each}
				</ul>
			{/if}

			<h2 class="mt-6 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
				Overview
			</h2>
			<p class="mt-2 max-w-prose leading-relaxed">
				{details.overview || 'No overview available yet.'}
			</p>

			{@render children?.()}
		</div>
	</div>
</article>
