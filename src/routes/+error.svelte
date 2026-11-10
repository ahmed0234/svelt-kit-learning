<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import FilmIcon from '@lucide/svelte/icons/film';
	import RotateCwIcon from '@lucide/svelte/icons/rotate-cw';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button/index.js';

	let notFound = $derived(page.status === 404);
	let Icon = $derived(notFound ? FilmIcon : CircleAlertIcon);
</script>

<svelte:head>
	<title>{notFound ? 'Not found' : 'Something went wrong'}</title>
</svelte:head>

<main class="mx-auto grid min-h-[70vh] max-w-6xl place-items-center px-4 py-16">
	<div
		class="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-foreground/10 bg-muted/40 p-8 text-center backdrop-blur-xl"
	>
		<Icon class="size-10 text-muted-foreground" aria-hidden="true" />
		<div>
			<p class="text-sm font-medium text-muted-foreground tabular-nums">{page.status}</p>
			<h1 class="mt-1 text-xl font-semibold tracking-tight">
				{page.error?.message ?? 'Something went wrong'}
			</h1>
		</div>
		<div class="flex flex-wrap justify-center gap-2">
			<Button href={resolve('/')}>
				<ArrowLeftIcon data-icon="inline-start" />
				Back to browse
			</Button>
			{#if !notFound}
				<Button variant="outline" onclick={() => invalidateAll()}>
					<RotateCwIcon data-icon="inline-start" />
					Try again
				</Button>
			{/if}
		</div>
	</div>
</main>
