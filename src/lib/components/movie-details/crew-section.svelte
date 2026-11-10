<script lang="ts">
	import UserIcon from '@lucide/svelte/icons/user';
	import TmdbImage from '#lib/components/movies/tmdb-image.svelte';
	import { personHref, tmdbImageUrl, type CrewMember } from '#lib/tmdb.js';
	import DetailsSection from './details-section.svelte';

	type Props = { crew: CrewMember[]; title?: string };

	let { crew, title = 'Directors & producers' }: Props = $props();
</script>

<DetailsSection {title}>
	<ul class="grid gap-3 sm:grid-cols-2">
		{#each crew as person (person.id)}
			<li>
				<a
					href={personHref(person)}
					class="group flex h-full items-center gap-3 rounded-xl border border-foreground/10 bg-muted/30 p-2.5 pe-4 transition duration-300 outline-none hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/60 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
				>
					<div class="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted">
						<TmdbImage
							src={person.profile_path && tmdbImageUrl(person.profile_path, 185)}
							sizes="56px"
							placeholder={UserIcon}
							class="group-hover:scale-105"
						/>
					</div>
					<div class="min-w-0">
						<p class="truncate font-medium group-hover:underline" title={person.name}>
							{person.name}
						</p>
						<p class="line-clamp-2 text-sm text-muted-foreground">{person.jobs.join(', ')}</p>
					</div>
				</a>
			</li>
		{/each}
	</ul>
</DetailsSection>
