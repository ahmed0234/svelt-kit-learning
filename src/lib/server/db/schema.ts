import {
	pgTable,
	uuid,
	text,
	integer,
	doublePrecision,
	timestamp,
	index,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Collections table
 * Each collection belongs directly to an authenticated Clerk userId (Approach A).
 */
export const collections = pgTable(
	'collections',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id').notNull(),
		name: text('name').notNull(),
		description: text('description'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('collections_user_id_idx').on(table.userId)]
);

/**
 * Collection Movies table
 * Stores movies and TV shows cached from TMDB API inside a specific collection.
 * When users revisit collections, data is served instantly from PostgreSQL.
 * TMDB ids are only unique per media type, so `media_type` is part of an item's identity.
 */
export const collectionMovies = pgTable(
	'collection_movies',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		collectionId: uuid('collection_id')
			.notNull()
			.references(() => collections.id, { onDelete: 'cascade' }),
		mediaType: text('media_type', { enum: ['movie', 'tv'] })
			.notNull()
			.default('movie'),
		/** TMDB id of the movie or TV show (see `mediaType`). */
		tmdbMovieId: integer('tmdb_movie_id').notNull(),
		title: text('title').notNull(),
		posterPath: text('poster_path'),
		overview: text('overview'),
		voteAverage: doublePrecision('vote_average'),
		releaseDate: text('release_date'),
		addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		index('collection_movies_collection_id_idx').on(table.collectionId),
		uniqueIndex('collection_movies_collection_tmdb_idx').on(
			table.collectionId,
			table.mediaType,
			table.tmdbMovieId
		)
	]
);

/**
 * Table Relations for Drizzle Relational Queries
 */
export const collectionsRelations = relations(collections, ({ many }) => ({
	movies: many(collectionMovies)
}));

export const collectionMoviesRelations = relations(collectionMovies, ({ one }) => ({
	collection: one(collections, {
		fields: [collectionMovies.collectionId],
		references: [collections.id]
	})
}));

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionMovie = typeof collectionMovies.$inferSelect;
export type NewCollectionMovie = typeof collectionMovies.$inferInsert;
