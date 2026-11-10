<script lang="ts">
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import type { MovieVideo } from '#lib/tmdb.js';

	type Props = {
		/** The video to play. Kept set while closing so the exit animation has content. */
		video: MovieVideo | null;
		open: boolean;
	};

	let { video, open = $bindable() }: Props = $props();
</script>

<Dialog.Root bind:open>
	<!-- The dialog content unmounts when closed, which removes the iframe and stops playback. -->
	<Dialog.Content class="gap-0 overflow-hidden p-0 sm:max-w-5xl">
		{#if video}
			<div class="p-4 pe-14">
				<Dialog.Title class="line-clamp-1">{video.name}</Dialog.Title>
				<Dialog.Description>
					{video.official ? 'Official ' : ''}{video.type.toLowerCase()} · YouTube
				</Dialog.Description>
			</div>
			<div class="aspect-video bg-black">
				<iframe
					src="https://www.youtube-nocookie.com/embed/{video.key}?autoplay=1&rel=0"
					title={video.name}
					class="size-full"
					allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
					allowfullscreen
				></iframe>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
