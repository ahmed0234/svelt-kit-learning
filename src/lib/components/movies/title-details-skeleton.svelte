<script lang="ts">
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
</script>

<!-- Placeholder with the same layout as title-details.svelte, so content lands where the skeleton was. -->
<div class="mx-auto max-w-6xl px-4 py-6 sm:py-8" aria-hidden="true">
	<Skeleton class="mb-4 h-8 w-36" />

	<Skeleton class="aspect-video rounded-2xl lg:aspect-21/9" />

	<div
		class="relative -mt-16 grid gap-6 sm:-mt-28 sm:grid-cols-[180px_1fr] sm:px-6 lg:-mt-36 lg:grid-cols-[240px_1fr] lg:px-8"
	>
		<Skeleton
			class="aspect-2/3 w-36 rounded-xl bg-muted shadow-xl ring-1 ring-foreground/10 sm:w-full"
		/>

		<div
			class="self-end rounded-2xl border border-foreground/10 bg-background/60 p-5 shadow-lg backdrop-blur-xl backdrop-saturate-150 sm:p-6"
		>
			<Skeleton class="h-8 w-2/3 sm:h-9 lg:h-10" />
			<Skeleton class="mt-3 h-4 w-1/2" />
			<div class="mt-5 flex flex-wrap gap-3">
				<Skeleton class="h-5 w-32" />
				<Skeleton class="h-5 w-28" />
				<Skeleton class="h-5 w-16" />
			</div>
			<div class="mt-4 flex gap-2">
				<Skeleton class="h-5 w-16 rounded-4xl" />
				<Skeleton class="h-5 w-20 rounded-4xl" />
				<Skeleton class="h-5 w-14 rounded-4xl" />
			</div>
			<Skeleton class="mt-7 h-3 w-20" />
			<div class="mt-3 max-w-prose space-y-2">
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-4/5" />
			</div>
		</div>
	</div>
</div>
