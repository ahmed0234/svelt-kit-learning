<script lang="ts">
	import { Badge } from '#lib/components/ui/badge/index.js';
	import {
		formatDate,
		personAge,
		releaseYear,
		type FilmographyGroup,
		type PersonDetails
	} from '#lib/tmdb.js';

	type Props = { person: PersonDetails; filmography: FilmographyGroup[] };

	let { person, filmography }: Props = $props();

	const headingId = $props.id();
	const today = new Date().toISOString().slice(0, 10);

	let age = $derived(person.birthday ? personAge(person.birthday, person.deathday) : null);

	/** e.g. "July 3, 1962 (age 64)"; the note is dropped when the age is unknown. */
	function withAge(date: string | null, note: string | null) {
		const formatted = date && formatDate(date);
		if (!formatted) return null;
		return age !== null && note ? `${formatted} (${note})` : formatted;
	}

	// A movie can appear in several departments (e.g. directed and starred in it).
	let movieCount = $derived(
		new Set(filmography.flatMap((group) => group.credits.map((credit) => credit.id))).size
	);
	let yearsActive = $derived.by(() => {
		const years = filmography
			.flatMap((group) => group.credits)
			.filter((credit) => credit.release_date && credit.release_date <= today)
			.map((credit) => Number(releaseYear(credit)));
		if (years.length === 0) return null;
		const first = Math.min(...years);
		const last = Math.max(...years);
		return first === last ? String(first) : `${first} – ${last}`;
	});

	let rows = $derived(
		[
			{ label: 'Known for', value: person.known_for_department },
			{ label: 'Gender', value: person.gender },
			{ label: 'Born', value: withAge(person.birthday, person.deathday ? null : `age ${age}`) },
			{ label: 'Died', value: withAge(person.deathday, `aged ${age}`) },
			{ label: 'Place of birth', value: person.place_of_birth },
			{ label: 'Movie credits', value: movieCount > 0 ? movieCount.toLocaleString('en-US') : null },
			{ label: 'Years active', value: yearsActive },
			{
				label: 'TMDB popularity',
				value: person.popularity > 0 ? person.popularity.toFixed(1) : null
			}
		].filter((row) => row.value)
	);
</script>

<section
	class="rounded-2xl border border-foreground/10 bg-muted/30 p-5"
	aria-labelledby={headingId}
>
	<h2 id={headingId} class="font-semibold">Personal info</h2>

	<dl class="mt-4 space-y-3 text-sm">
		{#each rows as row (row.label)}
			<div>
				<dt class="text-xs font-medium text-muted-foreground">{row.label}</dt>
				<dd class="mt-0.5">{row.value}</dd>
			</div>
		{/each}
	</dl>

	{#if person.also_known_as.length > 0}
		<h3 class="mt-5 text-xs font-medium text-muted-foreground">Also known as</h3>
		<ul class="mt-2 flex flex-wrap gap-1.5">
			{#each person.also_known_as as alias (alias)}
				<li><Badge variant="outline" class="h-auto py-0.5 whitespace-normal">{alias}</Badge></li>
			{/each}
		</ul>
	{/if}
</section>
