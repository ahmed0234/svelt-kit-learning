<script lang="ts">
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { titleCount } from '#lib/collections.js';
	import { useCollections } from './collections-state.svelte.js';

	type Props = {
		open: boolean;
		/** Kept set while closing so the exit animation has content. */
		collection: { id: string; name: string; count: number } | null;
		/** Go to the collections index afterwards (when deleting from the collection's page). */
		leave?: boolean;
	};

	let { open = $bindable(), collection, leave = false }: Props = $props();

	const collections = useCollections();

	let deleting = $state(false);

	async function confirm(event: MouseEvent) {
		// Keep the dialog open (with a spinner) until the delete has finished.
		event.preventDefault();
		if (!collection || deleting) return;
		deleting = true;
		const deleted = await collections.delete(collection, { leave });
		deleting = false;
		if (deleted) open = false;
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		{#if collection}
			<AlertDialog.Header>
				<AlertDialog.Title>Delete “{collection.name}”?</AlertDialog.Title>
				<AlertDialog.Description>
					{collection.count > 0
						? `This removes the collection and the ${titleCount(collection.count)} saved in it.`
						: 'This removes the collection.'}
					This can't be undone.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel disabled={deleting}>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action
					class={buttonVariants({ variant: 'destructive' })}
					disabled={deleting}
					onclick={confirm}
				>
					{#if deleting}
						<LoaderCircleIcon data-icon="inline-start" class="animate-spin" />
					{/if}
					Delete collection
				</AlertDialog.Action>
			</AlertDialog.Footer>
		{/if}
	</AlertDialog.Content>
</AlertDialog.Root>
