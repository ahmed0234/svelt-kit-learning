<script lang="ts">
	import { onMount, untrack, type Snippet } from 'svelte';
	import { useClerkContext } from 'svelte-clerk';
	import type { CollectionSummary } from '#lib/collections.js';
	import CollectionPicker from './collection-picker.svelte';
	import { CollectionsState, setCollections } from './collections-state.svelte.js';
	import SignInPrompt from './sign-in-prompt.svelte';

	type Props = {
		/** The root layout's streamed collections (null when signed out). */
		collections: Promise<CollectionSummary[]> | CollectionSummary[] | null | undefined;
		children: Snippet;
	};

	let { collections, children }: Props = $props();

	const clerk = useClerkContext();
	const state = new CollectionsState(() => !!clerk.auth.userId);
	setCollections(state);

	$effect(() => {
		const source = collections;
		// `sync` reads the current list; untracked so optimistic updates don't re-run it.
		untrack(() => state.sync(source));
	});

	// Signing in or out through Clerk's modal doesn't reload the page, so refetch on change.
	let lastUser = clerk.auth.userId;
	$effect(() => {
		const user = clerk.auth.userId;
		if (user === lastUser) return;
		lastUser = user;
		untrack(() => state.refresh());
	});

	onMount(() => state.restoreResume());
</script>

{@render children()}

<CollectionPicker />
<SignInPrompt />
