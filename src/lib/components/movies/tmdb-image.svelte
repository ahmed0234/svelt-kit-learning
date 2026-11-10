<script lang="ts">
	import FilmIcon from '@lucide/svelte/icons/film';
	import { cn } from '#lib/utils.js';

	type Props = {
		/** Fallback URL; when missing, a placeholder icon is shown. */
		src: string | null;
		srcset?: string | null;
		/** Alternate srcset used from the `sm` breakpoint up (e.g. backdrop instead of poster). */
		wideSrcset?: string | null;
		sizes: string;
		/** Load immediately with high priority (use for above-the-fold images). */
		eager?: boolean;
		/** Icon shown when there's no image (or it fails to load). */
		placeholder?: typeof FilmIcon;
		class?: string;
	};

	let {
		src,
		srcset,
		wideSrcset,
		sizes,
		eager = false,
		placeholder: Placeholder = FilmIcon,
		class: className
	}: Props = $props();

	let loaded = $state(false);
	let failed = $state(false);

	// The image may finish loading before hydration, in which case `onload` never fires.
	function markIfComplete(img: HTMLImageElement) {
		if (img.complete && img.naturalWidth > 0) loaded = true;
	}
</script>

{#if src && !failed}
	<picture>
		{#if wideSrcset}
			<source media="(min-width: 640px)" srcset={wideSrcset} {sizes} />
		{/if}
		<img
			{src}
			srcset={srcset || undefined}
			{sizes}
			alt=""
			draggable="false"
			loading={eager ? 'eager' : 'lazy'}
			fetchpriority={eager ? 'high' : 'auto'}
			decoding="async"
			onload={() => (loaded = true)}
			onerror={() => (failed = true)}
			{@attach markIfComplete}
			class={cn(
				'absolute inset-0 size-full object-cover transition duration-700 ease-out',
				loaded ? 'opacity-100' : 'opacity-0',
				className
			)}
		/>
	</picture>
{:else}
	<div class="absolute inset-0 grid place-items-center text-muted-foreground">
		<Placeholder class="size-1/3 max-w-10 opacity-40" aria-hidden="true" />
	</div>
{/if}
