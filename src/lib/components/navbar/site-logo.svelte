<script lang="ts" module>
	// The wordmark's two halves; the second is muted. Change them here to rebrand.
	const BRAND = ['Cine', 'Shelf'] as const;
	export const SITE_NAME = BRAND.join('');
</script>

<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<a
	href={resolve('/')}
	class="group flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
>
	<!-- A film frame with a play notch; the amber spark echoes the rating stars. -->
	<span
		class="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-md ring-1 ring-foreground/10 transition duration-300 ease-out group-hover:scale-105 group-hover:-rotate-6"
		aria-hidden="true"
	>
		<svg viewBox="0 0 24 24" class="size-5" fill="none">
			<rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" stroke-width="2" />
			<path d="M10 9.5v5l4.5-2.5z" fill="currentColor" />
			<path
				d="M7 5v2M12 5v2M17 5v2M7 17v2M12 17v2M17 17v2"
				stroke="currentColor"
				stroke-width="1.5"
			/>
		</svg>
		<span
			class="absolute end-1 top-1 size-1.5 rounded-full bg-amber-400 shadow-[0_0_8px] shadow-amber-400/80"
		></span>
		<!-- Sheen that sweeps across on hover. -->
		<span
			class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
		></span>
	</span>
	<span class="text-lg font-semibold tracking-tight">
		{BRAND[0]}<span class="text-muted-foreground transition-colors group-hover:text-foreground"
			>{BRAND[1]}</span
		>
	</span>
</a>
