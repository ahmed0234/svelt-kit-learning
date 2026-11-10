<script lang="ts">
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { COLLECTION_DESCRIPTION_MAX, COLLECTION_NAME_MAX } from '#lib/collections.js';
	import { useCollections } from './collections-state.svelte.js';

	type Props = {
		open: boolean;
		/** Prefills the name (e.g. from a suggestion chip). */
		initialName?: string;
		oncreated?: (id: string) => void;
	};

	let { open = $bindable(), initialName = '', oncreated }: Props = $props();

	const collections = useCollections();
	const id = $props.id();

	let name = $state('');
	let description = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);

	function onOpenChange(isOpen: boolean) {
		if (!isOpen) return;
		name = initialName;
		description = '';
		error = null;
	}

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim() || submitting) return;
		submitting = true;
		error = null;
		const result = await collections.create({ name: name.trim(), description: description.trim() });
		submitting = false;
		if (result.error || !result.id) {
			error = result.error ?? 'Something went wrong.';
			return;
		}
		open = false;
		oncreated?.(result.id);
	}
</script>

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Content
		class="border-foreground/10 bg-popover/90 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 sm:max-w-md"
	>
		<Dialog.Header>
			<Dialog.Title>New collection</Dialog.Title>
			<Dialog.Description
				>Group titles however you like — a mood, a genre, a plan.</Dialog.Description
			>
		</Dialog.Header>

		<form {onsubmit} class="grid gap-4">
			<div class="grid gap-1.5">
				<div class="flex items-baseline justify-between">
					<label for="{id}-name" class="text-sm font-medium">Name</label>
					<span class="text-xs text-muted-foreground tabular-nums">
						{name.length}/{COLLECTION_NAME_MAX}
					</span>
				</div>
				<input
					id="{id}-name"
					bind:value={name}
					required
					maxlength={COLLECTION_NAME_MAX}
					autocomplete="off"
					placeholder="e.g. Must Watch"
					aria-invalid={error ? 'true' : undefined}
					aria-describedby={error ? `${id}-error` : undefined}
					class="h-10 rounded-xl border border-foreground/15 bg-background/60 px-3 text-sm transition outline-none focus:border-foreground/30 focus:ring-4 focus:ring-ring/20"
				/>
			</div>
			<div class="grid gap-1.5">
				<label for="{id}-description" class="text-sm font-medium">
					Description <span class="font-normal text-muted-foreground">(optional)</span>
				</label>
				<textarea
					id="{id}-description"
					bind:value={description}
					rows="3"
					maxlength={COLLECTION_DESCRIPTION_MAX}
					placeholder="What ties these titles together?"
					class="resize-none rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm transition outline-none focus:border-foreground/30 focus:ring-4 focus:ring-ring/20"
				></textarea>
			</div>

			{#if error}
				<p id="{id}-error" class="text-sm text-destructive" role="alert">{error}</p>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={!name.trim() || submitting}>
					{#if submitting}
						<LoaderCircleIcon data-icon="inline-start" class="animate-spin" />
					{/if}
					Create collection
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
