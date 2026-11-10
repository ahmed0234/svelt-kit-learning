<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CheckIcon from '@lucide/svelte/icons/check';
	import LibraryIcon from '@lucide/svelte/icons/library';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import RotateCwIcon from '@lucide/svelte/icons/rotate-cw';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Drawer from '#lib/components/ui/drawer/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import { IsMobile } from '#lib/hooks/is-mobile.svelte.js';
	import { COLLECTION_NAME_MAX, type CollectionSummary } from '#lib/collections.js';
	import { tmdbImageUrl } from '#lib/tmdb.js';
	import { useCollections } from './collections-state.svelte.js';

	const collections = useCollections();
	const isMobile = new IsMobile();

	let creating = $state(false);
	let newName = $state('');
	let createError = $state<string | null>(null);
	let submitting = $state(false);

	let target = $derived(collections.target);
	let list = $derived(collections.list);
	let year = $derived(target?.release_date?.slice(0, 4) || null);
	let savedIn = $derived(
		target && list
			? list.filter((collection) => collections.contains(collection, target)).length
			: 0
	);

	function onOpenChange(open: boolean) {
		if (open) return;
		creating = false;
		newName = '';
		createError = null;
	}

	async function create(event: SubmitEvent) {
		event.preventDefault();
		const name = newName.trim();
		if (!name || submitting) return;
		submitting = true;
		createError = null;
		const result = await collections.create({ name }, target);
		submitting = false;
		if (result.error) {
			createError = result.error;
			return;
		}
		newName = '';
		creating = false;
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}
</script>

{#snippet thumbnail(collection: CollectionSummary)}
	<span
		class="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-linear-to-br from-muted to-foreground/10 ring-1 ring-foreground/10"
	>
		{#if collection.posters[0]}
			<TmdbImage src={tmdbImageUrl(collection.posters[0], 92)} sizes="48px" />
		{:else}
			<span class="text-base font-semibold text-muted-foreground uppercase" aria-hidden="true">
				{collection.name.charAt(0)}
			</span>
		{/if}
	</span>
{/snippet}

{#snippet body()}
	{#if target}
		<!-- What's being saved, so the picker never feels detached from the card that opened it. -->
		<div class="flex items-center gap-3 px-1">
			<span
				class="relative aspect-2/3 w-11 shrink-0 overflow-hidden rounded-md bg-muted shadow-md ring-1 ring-foreground/10"
			>
				<TmdbImage src={target.poster_path && tmdbImageUrl(target.poster_path, 92)} sizes="44px" />
			</span>
			<div class="min-w-0">
				<p class="text-xs font-medium text-muted-foreground">Save to collection</p>
				<p class="truncate font-semibold" title={target.title}>{target.title}</p>
				<p class="text-xs text-muted-foreground">
					{target.media_type === 'tv' ? 'TV show' : 'Movie'}{year ? ` · ${year}` : ''}
					{#if savedIn > 0}
						<span class="text-foreground">
							· In {savedIn}
							{savedIn === 1 ? 'collection' : 'collections'}</span
						>
					{/if}
				</p>
			</div>
		</div>
	{/if}

	<div class="-mx-1 mt-4 max-h-[min(22rem,50svh)] overflow-y-auto px-1">
		{#if !list && collections.status === 'error'}
			<div class="flex flex-col items-center gap-3 py-8 text-center">
				<p class="text-sm text-muted-foreground">We couldn't load your collections.</p>
				<Button variant="outline" size="sm" onclick={() => collections.refresh()}>
					<RotateCwIcon data-icon="inline-start" />
					Try again
				</Button>
			</div>
		{:else if !list}
			<ul class="space-y-1" aria-busy="true" aria-label="Loading collections">
				{#each { length: 3 }, i (i)}
					<li class="flex items-center gap-3 p-2">
						<Skeleton class="size-12 rounded-lg" />
						<div class="flex-1 space-y-2">
							<Skeleton class="h-4 w-1/2" />
							<Skeleton class="h-3 w-1/4" />
						</div>
					</li>
				{/each}
			</ul>
		{:else if list.length === 0}
			<div class="flex flex-col items-center px-4 py-6 text-center">
				<span
					class="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"
					aria-hidden="true"
				>
					<LibraryIcon class="size-6" />
				</span>
				<p class="mt-3 font-medium">No collections yet</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Create your first one, like “Must Watch” or “Favorite Anime”.
				</p>
			</div>
		{:else if target}
			<ul class="space-y-1">
				{#each list as collection (collection.id)}
					{@const checked = collections.contains(collection, target)}
					{@const busy = collections.pending.has(collection.id)}
					<li animate:flip={{ duration: 250 }} in:fly={{ y: 8, duration: 250 }}>
						<button
							type="button"
							role="checkbox"
							aria-checked={checked}
							aria-busy={busy}
							onclick={() => collections.toggle(collection, target)}
							class={[
								'group flex w-full items-center gap-3 rounded-xl p-2 text-start transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
								checked ? 'bg-foreground/[0.06]' : 'hover:bg-foreground/5'
							]}
						>
							{@render thumbnail(collection)}
							<span class="min-w-0 flex-1">
								<span class="block truncate font-medium">{collection.name}</span>
								<span class="block text-xs text-muted-foreground tabular-nums">
									{collection.count}
									{collection.count === 1 ? 'title' : 'titles'}
								</span>
							</span>
							<span
								class={[
									'grid size-6 shrink-0 place-items-center rounded-full border transition duration-300 ease-out',
									checked
										? 'scale-100 border-transparent bg-primary text-primary-foreground shadow-md'
										: 'border-foreground/20 text-transparent group-hover:border-foreground/40'
								]}
								aria-hidden="true"
							>
								{#if busy}
									<LoaderCircleIcon
										class={['size-3.5 animate-spin', checked ? '' : 'text-muted-foreground']}
									/>
								{:else if checked}
									<CheckIcon class="size-3.5 animate-in duration-300 zoom-in-0" strokeWidth={3} />
								{/if}
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="mt-3 border-t border-foreground/10 pt-3">
		{#if creating || (list && list.length === 0)}
			<form onsubmit={create} class="animate-in duration-200 fade-in slide-in-from-bottom-1">
				<label for="new-collection-name" class="sr-only">New collection name</label>
				<div class="flex gap-2">
					<input
						id="new-collection-name"
						bind:value={newName}
						{@attach focusOnMount}
						maxlength={COLLECTION_NAME_MAX}
						placeholder="New collection name"
						autocomplete="off"
						aria-invalid={createError ? 'true' : undefined}
						aria-describedby={createError ? 'new-collection-error' : undefined}
						onkeydown={(event) => {
							if (event.key === 'Escape' && list && list.length > 0) {
								event.stopPropagation();
								creating = false;
							}
						}}
						class="h-10 min-w-0 flex-1 rounded-xl border border-foreground/15 bg-background/60 px-3 text-sm transition outline-none focus:border-foreground/30 focus:ring-4 focus:ring-ring/20"
					/>
					<Button type="submit" class="h-10 rounded-xl" disabled={!newName.trim() || submitting}>
						{#if submitting}
							<LoaderCircleIcon data-icon="inline-start" class="animate-spin" />
						{/if}
						{target ? 'Create & save' : 'Create'}
					</Button>
				</div>
				{#if createError}
					<p id="new-collection-error" class="mt-2 text-xs text-destructive" role="alert">
						{createError}
					</p>
				{/if}
			</form>
		{:else}
			<Button
				variant="ghost"
				class="w-full justify-start rounded-xl px-2"
				onclick={() => (creating = true)}
				disabled={!list}
			>
				<span
					class="grid size-8 place-items-center rounded-lg border border-dashed border-foreground/25"
				>
					<PlusIcon class="size-4" />
				</span>
				New collection
			</Button>
		{/if}
	</div>
{/snippet}

{#snippet footer()}
	<div class="flex items-center justify-between gap-2">
		<Button
			variant="link"
			size="sm"
			class="px-0 text-muted-foreground"
			href={resolve('/collections')}
			onclick={() => (collections.pickerOpen = false)}
		>
			All collections
			<ArrowRightIcon data-icon="inline-end" />
		</Button>
		<Button onclick={() => (collections.pickerOpen = false)}>Done</Button>
	</div>
{/snippet}

{#if isMobile.current}
	<Drawer.Root bind:open={collections.pickerOpen} {onOpenChange}>
		<Drawer.Content class="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
			<Drawer.Header class="px-0 text-start">
				<Drawer.Title class="sr-only">Save to collection</Drawer.Title>
				<Drawer.Description class="sr-only">
					Choose the collections this title belongs in.
				</Drawer.Description>
			</Drawer.Header>
			{@render body()}
			<div class="mt-4">{@render footer()}</div>
		</Drawer.Content>
	</Drawer.Root>
{:else}
	<Dialog.Root bind:open={collections.pickerOpen} {onOpenChange}>
		<Dialog.Content
			class="gap-0 border-foreground/10 bg-popover/90 p-5 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 sm:max-w-md"
		>
			<Dialog.Title class="sr-only">Save to collection</Dialog.Title>
			<Dialog.Description class="sr-only">
				Choose the collections this title belongs in.
			</Dialog.Description>
			{@render body()}
			<div class="mt-4">{@render footer()}</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
