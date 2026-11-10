<script lang="ts">
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import FilmIcon from '@lucide/svelte/icons/film';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import SearchIcon from '@lucide/svelte/icons/search';
	import StarIcon from '@lucide/svelte/icons/star';
	import TvIcon from '@lucide/svelte/icons/tv';
	import XIcon from '@lucide/svelte/icons/x';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import {
		detailsHref,
		formatRating,
		releaseYear,
		SEARCH_TYPES,
		searchHref,
		tmdbImageUrl,
		type SearchType,
		type TmdbMovie
	} from '#lib/tmdb.js';
	import { cn } from '#lib/utils.js';

	type Props = {
		/** Focus the input on mount (e.g. when the mobile search opens). */
		autofocus?: boolean;
		/** Called on Escape with an empty input, so a parent can close the search. */
		ondismiss?: () => void;
		input?: HTMLInputElement | null;
		class?: string;
	};

	let { autofocus = false, ondismiss, input = $bindable(null), class: className }: Props = $props();

	const MIN_CHARS = 2;
	const DEBOUNCE_MS = 250;

	const id = $props.id();
	const listboxId = `${id}-listbox`;
	const optionId = (index: number) => `${id}-option-${index}`;

	const queryFromUrl = () =>
		page.route.id === '/search' ? (page.url.searchParams.get('query') ?? '') : '';

	let query = $state(queryFromUrl());
	let suggestions = $state.raw<TmdbMovie[]>([]);
	/** The query `suggestions` belong to, so stale results never show for new input. */
	let suggestedFor = $state('');
	let loading = $state(false);
	let failed = $state(false);
	let open = $state(false);
	/** Highlighted option: a suggestion, or `suggestions.length` for "See all results". */
	let active = $state(-1);

	let timer: ReturnType<typeof setTimeout> | undefined;
	let controller: AbortController | null = null;

	let trimmed = $derived(query.trim());
	let showList = $derived(open && trimmed.length >= MIN_CHARS);
	let optionCount = $derived(suggestions.length + 1);

	afterNavigate(() => {
		query = queryFromUrl();
		open = false;
		active = -1;
	});

	/** Open the list and (debounced) fetch suggestions for the current query if needed. */
	function refresh() {
		open = true;
		clearTimeout(timer);
		controller?.abort();

		const q = trimmed;
		if (q.length < MIN_CHARS) {
			loading = false;
			return;
		}
		if (q === suggestedFor) {
			loading = false;
			return;
		}
		loading = true;
		timer = setTimeout(() => fetchSuggestions(q), DEBOUNCE_MS);
	}

	async function fetchSuggestions(q: string) {
		const current = new AbortController();
		controller = current;
		try {
			const res = await fetch(
				`${resolve('/search/suggestions')}?${new URLSearchParams({ query: q })}`,
				{
					signal: current.signal
				}
			);
			if (!res.ok) throw new Error(`Suggestions failed: ${res.status}`);
			suggestions = await res.json();
			failed = false;
		} catch (err) {
			if (current.signal.aborted) return;
			console.error(err);
			suggestions = [];
			failed = true;
		}
		suggestedFor = q;
		loading = false;
	}

	/** Keep the active filter when searching again from the results page. */
	function currentType(): SearchType {
		const type = page.url.searchParams.get('type') as SearchType;
		return page.route.id === '/search' && SEARCH_TYPES.includes(type) ? type : 'all';
	}

	function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (active >= 0 && active < suggestions.length) {
			goto(detailsHref(suggestions[active]));
		} else if (trimmed) {
			// searchHref() is built on resolve(); the lint rule can't see through it.
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(searchHref(trimmed, currentType()));
		} else {
			input?.focus();
			return;
		}
		input?.blur();
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			if (!showList) {
				open = true;
				return;
			}
			event.preventDefault();
			const step = event.key === 'ArrowDown' ? 1 : -1;
			// -1 (the input itself) is part of the cycle, so arrowing back up returns to typing.
			active = ((active + 1 + step + optionCount + 1) % (optionCount + 1)) - 1;
			document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
		} else if (event.key === 'Escape') {
			event.preventDefault();
			if (showList) open = false;
			else if (query) query = '';
			else ondismiss?.();
		}
	}

	function clear() {
		query = '';
		active = -1;
		input?.focus();
	}

	function onfocusout(event: FocusEvent) {
		const root = event.currentTarget as HTMLElement;
		if (!root.contains(event.relatedTarget as Node | null)) open = false;
	}

	/** Split `text` around the first case-insensitive match of the query, for highlighting. */
	function highlight(text: string) {
		const index = text.toLowerCase().indexOf(suggestedFor.toLowerCase());
		if (!suggestedFor || index === -1) return null;
		return [
			text.slice(0, index),
			text.slice(index, index + suggestedFor.length),
			text.slice(index + suggestedFor.length)
		];
	}

	function focusOnMount(node: HTMLInputElement) {
		if (autofocus) node.focus();
	}
</script>

<!-- Without JS this is a plain GET form, so search still works before hydration. -->
<form
	action={resolve('/search')}
	method="GET"
	role="search"
	class={cn('group/search relative', className)}
	{onsubmit}
	{onfocusout}
>
	<label for="{id}-input" class="sr-only">Search movies and TV shows</label>
	<div class="relative">
		<span
			class="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-muted-foreground transition-colors group-focus-within/search:text-foreground"
		>
			{#if loading}
				<LoaderCircleIcon class="size-4 animate-spin" aria-hidden="true" />
			{:else}
				<SearchIcon class="size-4" aria-hidden="true" />
			{/if}
		</span>
		<input
			bind:this={input}
			bind:value={query}
			{@attach focusOnMount}
			id="{id}-input"
			name="query"
			type="search"
			autocomplete="off"
			spellcheck="false"
			enterkeyhint="search"
			maxlength="100"
			placeholder="Search movies & TV shows…"
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={showList}
			aria-controls={listboxId}
			aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
			oninput={() => {
				active = -1;
				refresh();
			}}
			onfocus={refresh}
			{onkeydown}
			class="peer h-10 w-full appearance-none rounded-full border border-foreground/10 bg-foreground/5 ps-9 pe-16 text-sm shadow-inner shadow-foreground/5 transition-[background-color,border-color,box-shadow] duration-300 outline-none placeholder:text-muted-foreground/80 hover:bg-foreground/[0.07] focus:border-foreground/20 focus:bg-background/80 focus:shadow-lg focus:ring-4 focus:shadow-foreground/5 focus:ring-ring/20 [&::-webkit-search-cancel-button]:hidden"
		/>
		<div class="absolute inset-y-0 end-1.5 flex items-center gap-1">
			{#if query}
				<button
					type="button"
					class="grid size-7 animate-in place-items-center rounded-full text-muted-foreground transition duration-200 outline-none zoom-in-50 fade-in hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
					onclick={clear}
				>
					<XIcon class="size-3.5" aria-hidden="true" />
					<span class="sr-only">Clear search</span>
				</button>
			{:else}
				<kbd
					class="pointer-events-none me-1 hidden h-5 min-w-5 place-items-center rounded-md border border-foreground/15 bg-background/60 px-1.5 font-sans text-[0.6875rem] font-medium text-muted-foreground transition-opacity peer-focus:opacity-0 md:grid"
					aria-hidden="true">/</kbd
				>
			{/if}
		</div>
	</div>

	{#if showList}
		<div
			class="absolute inset-x-0 top-full z-50 mt-2 origin-top animate-in overflow-hidden rounded-2xl border border-foreground/10 bg-popover/85 shadow-2xl ring-1 shadow-black/10 ring-black/5 backdrop-blur-2xl backdrop-saturate-150 duration-200 zoom-in-95 fade-in slide-in-from-top-1 md:-inset-x-8"
		>
			<!-- Options link to their pages; focus stays in the input and arrow keys move `active`. -->
			<ul
				id={listboxId}
				role="listbox"
				aria-label="Suggestions"
				class="max-h-[min(26rem,70svh)] overflow-y-auto p-1.5"
			>
				{#if suggestedFor === trimmed && suggestions.length === 0 && !loading}
					<li class="px-3 py-6 text-center text-sm text-muted-foreground" role="presentation">
						{failed
							? "Suggestions aren't available right now."
							: `No quick matches for “${trimmed}”.`}
					</li>
				{:else if suggestions.length === 0}
					{#each { length: 3 }, i (i)}
						<li class="flex items-center gap-3 p-2" role="presentation" aria-hidden="true">
							<span class="h-15 w-10 animate-pulse rounded-md bg-muted"></span>
							<span class="flex-1 space-y-2">
								<span class="block h-3.5 w-2/3 animate-pulse rounded bg-muted"></span>
								<span class="block h-3 w-1/3 animate-pulse rounded bg-muted"></span>
							</span>
						</li>
					{/each}
				{/if}

				{#each suggestions as movie, i (`${movie.media_type}-${movie.id}`)}
					{@const parts = highlight(movie.title)}
					{@const year = releaseYear(movie)}
					{@const rating = formatRating(movie)}
					{@const TypeIcon = movie.media_type === 'tv' ? TvIcon : FilmIcon}
					<li
						id={optionId(i)}
						role="option"
						aria-selected={active === i}
						class={['transition-opacity', loading && 'opacity-60']}
					>
						<a
							href={detailsHref(movie)}
							tabindex="-1"
							class={[
								'flex items-center gap-3 rounded-xl p-2 transition-colors outline-none',
								active === i ? 'bg-foreground/[0.07]' : 'hover:bg-foreground/5'
							]}
							onpointermove={() => (active = i)}
						>
							<span
								class="relative aspect-2/3 w-10 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10"
							>
								<TmdbImage
									src={movie.poster_path && tmdbImageUrl(movie.poster_path, 92)}
									sizes="40px"
									placeholder={TypeIcon}
								/>
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-medium">
									{#if parts}{parts[0]}<mark
											class="bg-transparent font-semibold text-foreground underline decoration-amber-400 decoration-2 underline-offset-2"
											>{parts[1]}</mark
										>{parts[2]}{:else}{movie.title}{/if}
								</span>
								<span class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
									<TypeIcon class="size-3" aria-hidden="true" />
									{movie.media_type === 'tv' ? 'TV show' : 'Movie'}
									{#if year}<span aria-hidden="true">·</span> {year}{/if}
									{#if rating}
										<span aria-hidden="true">·</span>
										<StarIcon class="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
										<span><span class="sr-only">Rated </span>{rating}</span>
									{/if}
								</span>
							</span>
						</a>
					</li>
				{/each}

				<li
					id={optionId(suggestions.length)}
					role="option"
					aria-selected={active === suggestions.length}
					class="mt-1 border-t border-foreground/10 pt-1"
				>
					<!-- searchHref() is built on resolve(); the lint rule can't see through it. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={searchHref(trimmed, currentType())}
						tabindex="-1"
						class={[
							'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors outline-none',
							active === suggestions.length ? 'bg-foreground/[0.07]' : 'hover:bg-foreground/5'
						]}
						onpointermove={() => (active = suggestions.length)}
					>
						<SearchIcon class="size-4 text-muted-foreground" aria-hidden="true" />
						<span class="min-w-0 flex-1 truncate">
							See all results for <span class="font-medium">“{trimmed}”</span>
						</span>
						<CornerDownLeftIcon class="size-3.5 text-muted-foreground" aria-hidden="true" />
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</li>
			</ul>
		</div>
	{/if}
</form>
