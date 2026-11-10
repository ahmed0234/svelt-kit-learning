<script lang="ts">
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import { resolve } from '$app/paths';
	import { UserButton, useClerkContext } from 'svelte-clerk';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';

	const clerk = useClerkContext();

	// Known during SSR from the layout's `initialState`, so the right controls render
	// immediately. Only the avatar menu itself waits for Clerk's script.
	let signedIn = $derived(!!clerk.auth.userId);
</script>

{#if signedIn}
	<!-- Fixed size so the avatar doesn't shift the navbar when it mounts. -->
	<div class="grid size-9 place-items-center">
		{#if clerk.isLoaded}
			<div class="animate-in duration-300 zoom-in-90 fade-in">
				<UserButton
					appearance={{
						elements: {
							avatarBox:
								'size-9 ring-2 ring-foreground/10 transition hover:ring-foreground/30 hover:scale-105'
						}
					}}
				/>
			</div>
		{:else}
			<Skeleton class="size-9 rounded-full" />
			<span class="sr-only">Loading account menu</span>
		{/if}
	</div>
{:else}
	<div class="flex items-center gap-1.5">
		<Button
			variant="ghost"
			size="sm"
			href={resolve('/sign-in/[...sign-in]', { 'sign-in': '' })}
			class="rounded-full"
		>
			<LogInIcon data-icon="inline-start" class="max-sm:hidden" />
			Sign in
		</Button>
		<Button
			size="sm"
			href={resolve('/sign-up/[...sign-up]', { 'sign-up': '' })}
			class="rounded-full shadow-md transition hover:-translate-y-px hover:shadow-lg max-sm:hidden"
		>
			Sign up
		</Button>
	</div>
{/if}
