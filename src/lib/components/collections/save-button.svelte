<script lang="ts">
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import BookmarkCheckIcon from '@lucide/svelte/icons/bookmark-check';
	import CheckIcon from '@lucide/svelte/icons/check';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { Button } from '#lib/components/ui/button/index.js';
	import { cn } from '#lib/utils.js';
	import { useCollections, type SaveTarget } from './collections-state.svelte.js';

	type Props = {
		item: SaveTarget;
		/**
		 * `overlay`: glass button over a poster, revealed on hover (always shown on touch screens
		 * and once saved). `plain`: a quiet round button for list layouts. `button`: a labelled
		 * button for details pages.
		 */
		appearance?: 'overlay' | 'plain' | 'button';
		class?: string;
	};

	let { item, appearance = 'overlay', class: className }: Props = $props();

	const collections = useCollections();

	let saved = $derived(collections.isSaved(item));
	let label = $derived(
		saved ? `${item.title} is saved. Manage collections` : `Save ${item.title} to a collection`
	);

	function onclick(event: MouseEvent) {
		// Cards are links; the button sits beside them, but guard against bubbling anyway.
		event.preventDefault();
		event.stopPropagation();
		collections.open(item);
	}
</script>

{#snippet swapIcon(size: string)}
	<span class={cn('relative', size)} aria-hidden="true">
		<PlusIcon
			class={cn(
				'absolute inset-0 transition duration-300 ease-out',
				size,
				saved && 'scale-0 rotate-90 opacity-0'
			)}
		/>
		<CheckIcon
			class={cn(
				'absolute inset-0 transition duration-300 ease-out',
				size,
				!saved && 'scale-0 -rotate-90 opacity-0'
			)}
			strokeWidth={3}
		/>
	</span>
{/snippet}

{#if appearance === 'button'}
	<Button variant="outline" {onclick} aria-haspopup="dialog" class={className}>
		{#if saved}
			<BookmarkCheckIcon data-icon="inline-start" class="animate-in duration-300 zoom-in-50" />
			Saved
		{:else}
			<BookmarkIcon data-icon="inline-start" />
			Save
		{/if}
	</Button>
{:else}
	<button
		type="button"
		{onclick}
		aria-label={label}
		aria-haspopup="dialog"
		title={saved ? 'Saved · manage collections' : 'Save to collection'}
		class={cn(
			'grid place-items-center rounded-full transition duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-90',
			appearance === 'overlay' && [
				'size-8 border shadow-md backdrop-blur-md',
				saved
					? 'border-white/40 bg-white text-black'
					: 'border-white/15 bg-black/40 text-white hover:scale-110 hover:bg-black/60',
				// Revealed with the card on hover/focus; touch screens have no hover, so always shown.
				!saved &&
					'opacity-0 group-focus-within/card:opacity-100 group-hover/card:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
			],
			appearance === 'plain' && [
				'size-9 border',
				saved
					? 'border-transparent bg-primary text-primary-foreground shadow-md'
					: 'border-foreground/15 bg-background/60 text-foreground backdrop-blur-md hover:scale-105 hover:bg-background'
			],
			className
		)}
	>
		{@render swapIcon('size-4')}
	</button>
{/if}
