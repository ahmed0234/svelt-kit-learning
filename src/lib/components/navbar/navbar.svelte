<script lang="ts">
	import LibraryIcon from '@lucide/svelte/icons/library';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ModeSwitcher from '#lib/components/mode-switcher.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { IsMobile } from '#lib/hooks/is-mobile.svelte.js';
	import NavSearch from './nav-search.svelte';
	import SiteLogo from './site-logo.svelte';
	import UserMenu from './user-menu.svelte';

	// Matches the `md` breakpoint where the inline search appears.
	const isMobile = new IsMobile();

	let scrollY = $state(0);
	let mobileSearchOpen = $state(false);
	let desktopInput = $state<HTMLInputElement | null>(null);

	let scrolled = $derived(scrollY > 8);
	let onCollections = $derived(page.route.id?.startsWith('/collections') ?? false);

	afterNavigate(() => (mobileSearchOpen = false));

	function isEditable(target: EventTarget | null) {
		return (
			target instanceof HTMLElement &&
			(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
		);
	}

	// "/" or Ctrl/⌘+K jumps to search from anywhere on the page.
	function onkeydown(event: KeyboardEvent) {
		const shortcut =
			(event.key === '/' && !isEditable(event.target)) ||
			(event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey));
		if (!shortcut || event.defaultPrevented) return;
		event.preventDefault();
		if (isMobile.current) mobileSearchOpen = true;
		else desktopInput?.focus();
	}
</script>

<svelte:window bind:scrollY {onkeydown} />

<header
	class={[
		'sticky top-0 z-50 border-b backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-300',
		scrolled || mobileSearchOpen
			? 'border-foreground/10 bg-background/70 shadow-lg shadow-black/5'
			: 'border-transparent bg-background/40'
	]}
>
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
		<SiteLogo />

		<div class="ms-auto flex items-center gap-1.5 sm:gap-2">
			<!-- Grows when focused, so it stays compact until someone wants to type. -->
			<NavSearch
				bind:input={desktopInput}
				class="hidden w-64 transition-[width] duration-300 ease-out focus-within:w-80 md:block lg:w-72 lg:focus-within:w-96"
			/>

			<Button
				variant="ghost"
				size="icon"
				class="rounded-full md:hidden"
				aria-expanded={mobileSearchOpen}
				aria-controls="mobile-search"
				onclick={() => (mobileSearchOpen = !mobileSearchOpen)}
			>
				<span class="relative size-4">
					<SearchIcon
						class={[
							'absolute inset-0 size-4 transition duration-300',
							mobileSearchOpen && 'scale-0 rotate-90 opacity-0'
						]}
					/>
					<XIcon
						class={[
							'absolute inset-0 size-4 transition duration-300',
							!mobileSearchOpen && 'scale-0 -rotate-90 opacity-0'
						]}
					/>
				</span>
				<span class="sr-only">{mobileSearchOpen ? 'Close search' : 'Search'}</span>
			</Button>

			<Button
				variant="ghost"
				size="sm"
				href={resolve('/collections')}
				aria-current={onCollections ? 'page' : undefined}
				class={[
					'rounded-full max-md:size-9 max-md:px-0',
					onCollections && 'bg-foreground/[0.07] text-foreground'
				]}
			>
				<LibraryIcon data-icon="inline-start" class="max-md:m-0" />
				<span class="max-md:sr-only">Collections</span>
			</Button>

			<ModeSwitcher />

			<span class="mx-0.5 hidden h-6 w-px bg-foreground/10 sm:block" aria-hidden="true"></span>

			<UserMenu />
		</div>
	</div>

	{#if mobileSearchOpen && isMobile.current}
		<div
			id="mobile-search"
			class="mx-auto max-w-6xl animate-in px-4 pb-3 duration-300 fade-in slide-in-from-top-2"
		>
			<NavSearch autofocus ondismiss={() => (mobileSearchOpen = false)} />
		</div>
	{/if}
</header>
