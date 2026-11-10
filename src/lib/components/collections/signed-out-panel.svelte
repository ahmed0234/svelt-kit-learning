<script lang="ts">
	import LibraryIcon from '@lucide/svelte/icons/library';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useCollections } from './collections-state.svelte.js';

	let { message = 'Sign in to see and build your collections.' }: { message?: string } = $props();

	const collections = useCollections();
</script>

<div
	class="mx-auto flex max-w-lg animate-in flex-col items-center rounded-3xl border border-foreground/10 bg-muted/30 px-6 py-14 text-center backdrop-blur-xl duration-500 fade-in slide-in-from-bottom-3"
>
	<span
		class="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg"
		aria-hidden="true"
	>
		<LibraryIcon class="size-6" />
	</span>
	<h2 class="mt-5 text-2xl font-semibold tracking-tight">Your collections live here</h2>
	<p class="mt-2 text-balance text-muted-foreground">{message}</p>
	<div class="mt-6 flex flex-wrap justify-center gap-2">
		<Button onclick={() => collections.promptSignIn()}>Sign in</Button>
		<Button variant="outline" href={resolve('/')}>Keep browsing</Button>
	</div>
</div>
