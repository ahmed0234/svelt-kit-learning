<script lang="ts">
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import StarIcon from '@lucide/svelte/icons/star';
	import { SvelteSet } from 'svelte/reactivity';
	import { Button } from '#lib/components/ui/button/index.js';
	import { formatDate, type MovieReview } from '#lib/tmdb.js';
	import DetailsSection from './details-section.svelte';

	let { reviews }: { reviews: MovieReview[] } = $props();

	// Roughly five lines of text; shorter reviews don't need a toggle.
	const COLLAPSE_AFTER_CHARS = 400;

	const expanded = new SvelteSet<string>();

	function toggle(id: string) {
		if (expanded.has(id)) expanded.delete(id);
		else expanded.add(id);
	}
</script>

<DetailsSection title="Reviews">
	<ul class="space-y-4">
		{#each reviews as review (review.id)}
			{@const isLong = review.content.length > COLLAPSE_AFTER_CHARS}
			{@const isOpen = expanded.has(review.id)}
			{@const date = formatDate(review.created_at.slice(0, 10))}
			<li class="rounded-2xl border border-foreground/10 bg-muted/30 p-4 sm:p-5">
				<article>
					<header class="flex items-center gap-3">
						{#if review.avatar_url}
							<img
								src={review.avatar_url}
								alt=""
								width="40"
								height="40"
								loading="lazy"
								decoding="async"
								class="size-10 shrink-0 rounded-full bg-muted object-cover"
							/>
						{:else}
							<span
								class="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary uppercase"
								aria-hidden="true"
							>
								{review.author.charAt(0)}
							</span>
						{/if}
						<div class="min-w-0 flex-1">
							<h3 class="truncate font-medium">{review.author}</h3>
							<p class="text-xs text-muted-foreground">
								<time datetime={review.created_at}>{date}</time>
							</p>
						</div>
						{#if review.rating}
							<span
								class="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300"
							>
								<StarIcon class="size-3 fill-current" aria-hidden="true" />
								<span><span class="sr-only">Rated </span>{review.rating}/10</span>
							</span>
						{/if}
					</header>

					<p
						id="review-{review.id}"
						class={[
							'mt-3 text-sm leading-relaxed whitespace-pre-line text-foreground/90',
							isLong && !isOpen && 'line-clamp-5'
						]}
					>
						{review.content}
					</p>

					<div class="mt-2 flex flex-wrap items-center gap-2">
						{#if isLong}
							<Button
								variant="link"
								size="sm"
								class="h-auto px-0"
								aria-expanded={isOpen}
								aria-controls="review-{review.id}"
								onclick={() => toggle(review.id)}
							>
								{isOpen ? 'Show less' : 'Read more'}
							</Button>
						{/if}
						<Button
							variant="link"
							size="sm"
							class="ms-auto h-auto px-0 text-muted-foreground"
							href={review.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							On TMDB
							<ExternalLinkIcon data-icon="inline-end" />
						</Button>
					</div>
				</article>
			</li>
		{/each}
	</ul>
</DetailsSection>
