<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';

	type Props = {
		title?: string;
		/** Rows without a value are skipped, so callers can list every fact unconditionally. */
		rows: { label: string; value: string | null | undefined }[];
		keywords?: string[];
		/** Extra content between the rows and the keywords (e.g. a chart or logos). */
		children?: Snippet;
	};

	let { title = 'Details', rows, keywords = [], children }: Props = $props();

	const headingId = $props.id();

	let visibleRows = $derived(rows.filter((row) => row.value));
</script>

<section
	class="rounded-2xl border border-foreground/10 bg-muted/30 p-5"
	aria-labelledby={headingId}
>
	<h2 id={headingId} class="font-semibold">{title}</h2>

	<dl class="mt-4 space-y-3 text-sm">
		{#each visibleRows as row (row.label)}
			<div>
				<dt class="text-xs font-medium text-muted-foreground">{row.label}</dt>
				<dd class="mt-0.5">{row.value}</dd>
			</div>
		{/each}
	</dl>

	{@render children?.()}

	{#if keywords.length > 0}
		<h3 class="mt-5 text-xs font-medium text-muted-foreground">Keywords</h3>
		<ul class="mt-2 flex flex-wrap gap-1.5">
			{#each keywords as keyword (keyword)}
				<li><Badge variant="outline">{keyword}</Badge></li>
			{/each}
		</ul>
	{/if}
</section>
