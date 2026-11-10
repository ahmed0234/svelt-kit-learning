import { eq, and, desc, sql, count } from 'drizzle-orm';
import type { CollectionItem, CollectionSummary, ItemKey, MediaType } from '#lib/collections.js';
import { db } from './index';
import { collections, collectionMovies } from './schema';

const PREVIEW_POSTERS = 4;

/** Rows store the TMDB id as `tmdbMovieId` for both movies and TV shows. */
type CollectionMovieRow = typeof collectionMovies.$inferSelect;

function toItem(row: CollectionMovieRow): CollectionItem {
	return {
		id: row.tmdbMovieId,
		media_type: row.mediaType,
		title: row.title,
		overview: row.overview ?? '',
		poster_path: row.posterPath,
		backdrop_path: null,
		vote_average: row.voteAverage ?? 0,
		release_date: row.releaseDate ?? '',
		addedAt: row.addedAt.toISOString()
	};
}

/** Bump a collection's `updatedAt` so recently used collections sort first. */
function touchCollection(collectionId: string) {
	return db
		.update(collections)
		.set({ updatedAt: new Date() })
		.where(eq(collections.id, collectionId));
}

/** True if `collectionId` exists and belongs to `userId`. */
async function ownsCollection(collectionId: string, userId: string) {
	const collection = await db.query.collections.findFirst({
		where: and(eq(collections.id, collectionId), eq(collections.userId, userId)),
		columns: { id: true }
	});
	return !!collection;
}

/**
 * Fetch all collections belonging to a verified Clerk user, most recently used first,
 * with every saved title's key (for "already saved" checks) and a few preview posters.
 */
export async function getUserCollections(userId: string): Promise<CollectionSummary[]> {
	if (!userId) throw new Error('Unauthorized');

	const rows = await db.query.collections.findMany({
		where: eq(collections.userId, userId),
		orderBy: [desc(collections.updatedAt)],
		with: {
			movies: {
				columns: { mediaType: true, tmdbMovieId: true, posterPath: true },
				orderBy: [desc(collectionMovies.addedAt)]
			}
		}
	});

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		description: row.description,
		updatedAt: row.updatedAt.toISOString(),
		count: row.movies.length,
		posters: row.movies
			.flatMap((movie) => (movie.posterPath ? [movie.posterPath] : []))
			.slice(0, PREVIEW_POSTERS),
		items: row.movies.map((movie): ItemKey => `${movie.mediaType}:${movie.tmdbMovieId}`)
	}));
}

/**
 * Fetch a single collection and all its saved titles, most recently added first.
 * Enforces ownership: only the owner can access their private collection.
 */
export async function getCollectionWithMovies(collectionId: string, userId: string) {
	if (!userId) throw new Error('Unauthorized');

	const collection = await db.query.collections.findFirst({
		where: and(eq(collections.id, collectionId), eq(collections.userId, userId)),
		with: {
			movies: {
				orderBy: [desc(collectionMovies.addedAt)]
			}
		}
	});
	if (!collection) return null;

	const { movies, ...rest } = collection;
	return { ...rest, items: movies.map(toItem) };
}

/** Number of collections a user has, for enforcing `MAX_COLLECTIONS`. */
export async function countUserCollections(userId: string) {
	if (!userId) throw new Error('Unauthorized');

	const [row] = await db
		.select({ total: count() })
		.from(collections)
		.where(eq(collections.userId, userId));
	return row?.total ?? 0;
}

/** True if the user already has a collection with this name (ignoring case). */
export async function hasCollectionNamed(userId: string, name: string) {
	if (!userId) throw new Error('Unauthorized');

	const existing = await db.query.collections.findFirst({
		where: and(
			eq(collections.userId, userId),
			sql`lower(${collections.name}) = lower(${name.trim()})`
		),
		columns: { id: true }
	});
	return !!existing;
}

/**
 * Create a new collection for a verified user.
 */
export async function createCollection(
	userId: string,
	data: { name: string; description?: string | null }
) {
	if (!userId) throw new Error('Unauthorized');

	const [created] = await db
		.insert(collections)
		.values({
			userId,
			name: data.name.trim(),
			description: data.description?.trim() || null
		})
		.returning();

	return created;
}

/**
 * Delete a collection after verifying user ownership. Its titles go with it (cascade).
 */
export async function deleteCollection(collectionId: string, userId: string) {
	if (!userId) throw new Error('Unauthorized');

	const [deleted] = await db
		.delete(collections)
		.where(and(eq(collections.id, collectionId), eq(collections.userId, userId)))
		.returning();

	return deleted ?? null;
}

/**
 * Add a movie or TV show to a user's collection, storing its TMDB details directly in
 * PostgreSQL. Subsequent views read from PostgreSQL with zero additional TMDB API calls.
 *
 * Returns `null` when the collection doesn't exist or isn't the user's, `{ added: false }`
 * when the title was already in it, and `{ added: true }` otherwise.
 */
export async function addMovieToCollection(
	collectionId: string,
	userId: string,
	movieData: {
		mediaType: MediaType;
		tmdbMovieId: number;
		title: string;
		posterPath?: string | null;
		overview?: string | null;
		voteAverage?: number | null;
		releaseDate?: string | null;
	}
) {
	if (!userId) throw new Error('Unauthorized');

	// 1. Verify that the collection belongs to this user
	if (!(await ownsCollection(collectionId, userId))) return null;

	// 2. Insert the title (the unique index turns duplicates into a no-op)
	const [movie] = await db
		.insert(collectionMovies)
		.values({
			collectionId,
			mediaType: movieData.mediaType,
			tmdbMovieId: movieData.tmdbMovieId,
			title: movieData.title,
			posterPath: movieData.posterPath,
			overview: movieData.overview,
			voteAverage: movieData.voteAverage,
			releaseDate: movieData.releaseDate
		})
		.onConflictDoNothing({
			target: [
				collectionMovies.collectionId,
				collectionMovies.mediaType,
				collectionMovies.tmdbMovieId
			]
		})
		.returning({ id: collectionMovies.id });

	if (movie) await touchCollection(collectionId);
	return { added: !!movie };
}

/** Number of titles in a collection the user owns, for enforcing `MAX_COLLECTION_ITEMS`. */
export async function countCollectionMovies(collectionId: string, userId: string) {
	if (!userId) throw new Error('Unauthorized');

	const [row] = await db
		.select({ total: count() })
		.from(collectionMovies)
		.innerJoin(collections, eq(collections.id, collectionMovies.collectionId))
		.where(and(eq(collectionMovies.collectionId, collectionId), eq(collections.userId, userId)));
	return row?.total ?? 0;
}

/**
 * Remove a title from a collection after verifying ownership.
 *
 * Returns `null` when the collection doesn't exist or isn't the user's, and
 * `{ removed }` otherwise (false if the title wasn't in it).
 */
export async function removeMovieFromCollection(
	collectionId: string,
	userId: string,
	mediaType: MediaType,
	tmdbMovieId: number
) {
	if (!userId) throw new Error('Unauthorized');

	// Verify collection ownership
	if (!(await ownsCollection(collectionId, userId))) return null;

	const [removed] = await db
		.delete(collectionMovies)
		.where(
			and(
				eq(collectionMovies.collectionId, collectionId),
				eq(collectionMovies.mediaType, mediaType),
				eq(collectionMovies.tmdbMovieId, tmdbMovieId)
			)
		)
		.returning({ id: collectionMovies.id });

	if (removed) await touchCollection(collectionId);
	return { removed: !!removed };
}
