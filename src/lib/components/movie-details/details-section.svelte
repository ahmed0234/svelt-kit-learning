<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		/** Rendered at the end of the heading row (e.g. slider buttons). */
		action?: Snippet;
		children: Snippet;
		class?: string;
	};

	let { title, action, children, class: className }: Props = $props();

	const headingId = $props.id();
</script>

<section class={className} aria-labelledby={headingId}>
	<div class="mb-4 flex items-center justify-between gap-4">
		<h2 id={headingId} class="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
		{@render action?.()}
	</div>
	{@render children()}
</section>
