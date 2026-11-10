<script lang="ts">
	import BookmarkPlusIcon from '@lucide/svelte/icons/bookmark-plus';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { useClerkContext } from 'svelte-clerk';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { posterSrcset, tmdbImageUrl } from '#lib/tmdb.js';
	import { useCollections } from './collections-state.svelte.js';

	const collections = useCollections();
	const clerk = useClerkContext();

	let target = $derived(collections.target);

	// Without Clerk's modal (script still loading), fall back to the hosted pages, which
	// send the visitor back here afterwards.
	let returnTo = $derived(encodeURIComponent(page.url.pathname + page.url.search));
	let signInHref = $derived(
		`${resolve('/sign-in/[...sign-in]', { 'sign-in': '' })}?redirect_url=${returnTo}`
	);
	let signUpHref = $derived(
		`${resolve('/sign-up/[...sign-up]', { 'sign-up': '' })}?redirect_url=${returnTo}`
	);

	/** Open Clerk's own modal so the visitor never leaves the page they were browsing. */
	function openClerk(event: MouseEvent, mode: 'signIn' | 'signUp') {
		const instance = clerk.clerk;
		if (!instance || !('openSignIn' in instance)) return; // follow the link instead
		event.preventDefault();
		collections.signInOpen = false;
		const options = { forceRedirectUrl: page.url.href, signUpForceRedirectUrl: page.url.href };
		if (mode === 'signIn') instance.openSignIn(options);
		else
			instance.openSignUp({
				forceRedirectUrl: page.url.href,
				signInForceRedirectUrl: page.url.href
			});
	}

	function onOpenChange(open: boolean) {
		// Closed without signing in: don't pop the picker open later.
		if (!open && !clerk.auth.userId) collections.cancelResume();
	}
</script>

<Dialog.Root bind:open={collections.signInOpen} {onOpenChange}>
	<Dialog.Content
		class="gap-0 overflow-hidden border-foreground/10 bg-popover/90 p-0 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 sm:max-w-sm"
	>
		<!-- Header: the title they were saving, blurred into a backdrop with the poster on top. -->
		<div class="relative isolate grid h-40 place-items-center overflow-hidden bg-muted">
			{#if target?.poster_path}
				<TmdbImage
					src={tmdbImageUrl(target.poster_path, 185)}
					sizes="384px"
					class="scale-125 opacity-70 blur-2xl"
				/>
			{/if}
			<div class="absolute inset-0 bg-linear-to-t from-popover via-popover/40 to-transparent"></div>
			<div class="relative flex animate-in items-end duration-500 fade-in slide-in-from-bottom-3">
				<span
					class="relative aspect-2/3 w-20 overflow-hidden rounded-lg bg-muted shadow-2xl ring-1 ring-white/20"
				>
					<TmdbImage
						src={target?.poster_path ? tmdbImageUrl(target.poster_path, 185) : null}
						srcset={target?.poster_path && posterSrcset(target.poster_path)}
						sizes="80px"
					/>
				</span>
				<span
					class="-ms-4 mb-2 grid size-10 animate-in place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-popover delay-200 duration-500 fill-mode-both zoom-in-50"
					aria-hidden="true"
				>
					<BookmarkPlusIcon class="size-5" />
				</span>
			</div>
		</div>

		<div class="px-6 pt-2 pb-6 text-center">
			<Dialog.Title class="text-lg font-semibold tracking-tight text-balance">
				{target ? `Sign in to save ${target.title}` : 'Sign in to save titles'}
			</Dialog.Title>
			<Dialog.Description class="mt-2 text-sm text-balance text-muted-foreground">
				Build collections like “Must Watch” or “Favorite Anime” and find them on any device.
			</Dialog.Description>

			<div class="mt-6 grid gap-2">
				<Button href={signInHref} onclick={(event) => openClerk(event, 'signIn')}>Sign in</Button>
				<Button variant="outline" href={signUpHref} onclick={(event) => openClerk(event, 'signUp')}>
					Create a free account
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
