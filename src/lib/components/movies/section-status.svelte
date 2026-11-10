<script lang="ts">
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import FilmIcon from '@lucide/svelte/icons/film';
	import RotateCwIcon from '@lucide/svelte/icons/rotate-cw';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '#lib/components/ui/button/index.js';
	import { cn } from '#lib/utils.js';

	type Props = {
		/** `error` shows a retry button that re-runs the page's load. */
		kind: 'empty' | 'error';
		message: string;
		class?: string;
	};

	let { kind, message, class: className }: Props = $props();

	let Icon = $derived(kind === 'error' ? CircleAlertIcon : FilmIcon);
</script>

<div
	role={kind === 'error' ? 'alert' : undefined}
	class={cn(
		'flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-muted/40 p-6 text-center',
		className
	)}
>
	<Icon class="size-8 text-muted-foreground" aria-hidden="true" />
	<p class="text-sm text-muted-foreground">{message}</p>
	{#if kind === 'error'}
		<Button variant="outline" size="sm" onclick={() => invalidateAll()}>
			<RotateCwIcon data-icon="inline-start" />
			Try again
		</Button>
	{/if}
</div>
