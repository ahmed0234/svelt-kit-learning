// Client-safe collection types and limits. Queries live in `#lib/server/db/collections.ts`.
import { resolve } from '$app/paths';
import type { TmdbMovie } from './tmdb.js';

export const COLLECTION_NAME_MAX = 60;
export const COLLECTION_DESCRIPTION_MAX = 200;
// Generous for real use; they stop runaway scripts from filling the database.
export const MAX_COLLECTIONS = 100;
export const MAX_COLLECTION_ITEMS = 1000;

export type MediaType = TmdbMovie['media_type'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Collection ids are UUIDs; checking first avoids a database error on malformed ids. */
export const isCollectionId = (value: string) => UUID.test(value);

/** Link to one collection's page. */
export const collectionHref = (id: string) => resolve('/collections/[id]', { id });

/** Identifies a title across movies and TV, whose TMDB ids can collide (e.g. "tv:1396"). */
export type ItemKey = `${MediaType}:${number}`;

export const itemKey = (item: Pick<TmdbMovie, 'media_type' | 'id'>): ItemKey =>
	`${item.media_type}:${item.id}`;

/** One of the user's collections, with just enough to render pickers and cards. */
export type CollectionSummary = {
	id: string;
	name: string;
	description: string | null;
	/** ISO timestamp of the last change (created, or a title added or removed). */
	updatedAt: string;
	count: number;
	/** Up to 4 poster paths, most recently added first. */
	posters: string[];
	/** Every title in the collection, for "already saved" checks. */
	items: ItemKey[];
};

/** A saved title. Shaped like `TmdbMovie` so the existing cards can render it. */
export type CollectionItem = TmdbMovie & { addedAt: string };

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 24 * 3600],
	['month', 30 * 24 * 3600],
	['week', 7 * 24 * 3600],
	['day', 24 * 3600],
	['hour', 3600],
	['minute', 60]
];

/** e.g. "3 days ago", "just now". */
export function timeAgo(iso: string, now = Date.now()) {
	const seconds = (new Date(iso).getTime() - now) / 1000;
	for (const [unit, size] of RELATIVE_UNITS) {
		if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
	}
	return 'just now';
}

/** e.g. "1 title", "12 titles". */
export const titleCount = (count: number) =>
	`${count.toLocaleString('en-US')} ${count === 1 ? 'title' : 'titles'}`;
