<script lang="ts">
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { Button } from '#lib/components/ui/button/index.js';
	import { getEmblaContext } from '#lib/components/ui/carousel/context.js';

	const ctx = getEmblaContext('<SliderNav/>');
</script>

<div class="flex gap-2">
	<Button
		variant="outline"
		size="icon-sm"
		class="rounded-full"
		disabled={!ctx.canScrollPrev}
		onclick={ctx.scrollPrev}
		onkeydown={ctx.handleKeyDown}
	>
		<ChevronLeftIcon />
		<span class="sr-only">Previous</span>
	</Button>
	<Button
		variant="outline"
		size="icon-sm"
		class="rounded-full"
		disabled={!ctx.canScrollNext}
		onclick={ctx.scrollNext}
		onkeydown={ctx.handleKeyDown}
	>
		<ChevronRightIcon />
		<span class="sr-only">Next</span>
	</Button>
</div>
