import { fail } from '@sveltejs/kit';
import {
	COLLECTION_DESCRIPTION_MAX,
	COLLECTION_NAME_MAX,
	isCollectionId,
	MAX_COLLECTION_ITEMS,
	MAX_COLLECTIONS,
	type MediaType
} from '#lib/collections.js';
import {
	addMovieToCollection,
	countCollectionMovies,
	countUserCollections,
	createCollection,
	deleteCollection,
	getUserCollections,
	hasCollectionNamed,
	removeMovieFromCollection
} from '#lib/server/db/collections.js';
import { getTitleSummary, TmdbError } from '#lib/server/tmdb.js';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

const TMDB_ID = /^[1-9]\d{0,9}$/;

export const load: PageServerLoad = async ({ locals, depends }) => {
	depends('app:collections');

	// The page is public; signed-out visitors get a sign-in prompt instead of data.
	const { userId } = locals.auth();
	if (!userId) return { signedIn: false as const, collections: [] };
	return { signedIn: true as const, collections: await getUserCollections(userId) };
};

const unauthorized = () => fail(401, { message: 'Sign in to manage your collections.' });
const notFound = () => fail(404, { message: "That collection doesn't exist anymore." });

function field(data: FormData, name: string) {
	const value = data.get(name);
	return typeof value === 'string' ? value.trim() : '';
}

function collectionId(data: FormData) {
	const id = field(data, 'collectionId');
	return isCollectionId(id) ? id : null;
}

/**
 * Read the `mediaType` + `tmdbId` fields and look the title up on TMDB. Details are copied
 * from TMDB rather than the request, so saved titles can't be forged.
 */
async function titleFromForm(data: FormData, fetchFn: RequestEvent['fetch']) {
	const mediaType = field(data, 'mediaType') as MediaType;
	const tmdbId = field(data, 'tmdbId');
	if ((mediaType !== 'movie' && mediaType !== 'tv') || !TMDB_ID.test(tmdbId)) {
		return { error: fail(400, { message: 'That title is invalid.' }) };
	}

	try {
		const title = await getTitleSummary(fetchFn, mediaType, Number(tmdbId));
		return {
			title: {
				mediaType,
				tmdbMovieId: title.id,
				title: title.title,
				posterPath: title.poster_path,
				overview: title.overview,
				voteAverage: title.vote_average,
				releaseDate: title.release_date || null
			}
		};
	} catch (err) {
		if (err instanceof TmdbError && err.status === 404) {
			return { error: fail(404, { message: "We couldn't find that title." }) };
		}
		console.error(err);
		return { error: fail(502, { message: "We couldn't reach TMDB. Please try again." }) };
	}
}

async function addTitle(
	userId: string,
	id: string,
	title: Parameters<typeof addMovieToCollection>[2]
) {
	if ((await countCollectionMovies(id, userId)) >= MAX_COLLECTION_ITEMS) {
		return fail(400, { message: `A collection can hold up to ${MAX_COLLECTION_ITEMS} titles.` });
	}
	const result = await addMovieToCollection(id, userId, title);
	if (!result) return notFound();
	return { collectionId: id, added: result.added };
}

export const actions: Actions = {
	/** Create a collection; with `mediaType` + `tmdbId`, also save that title into it. */
	create: async ({ request, locals, fetch }) => {
		const { userId } = locals.auth();
		if (!userId) return unauthorized();

		const data = await request.formData();
		const name = field(data, 'name');
		const description = field(data, 'description');
		if (!name) return fail(400, { message: 'Give your collection a name.', name, description });
		if (name.length > COLLECTION_NAME_MAX) {
			return fail(400, {
				message: `Names can be up to ${COLLECTION_NAME_MAX} characters.`,
				name,
				description
			});
		}
		if (description.length > COLLECTION_DESCRIPTION_MAX) {
			return fail(400, {
				message: `Descriptions can be up to ${COLLECTION_DESCRIPTION_MAX} characters.`,
				name,
				description
			});
		}

		// Resolve the title first so a bad title doesn't leave an empty collection behind.
		const withTitle = data.has('tmdbId') ? await titleFromForm(data, fetch) : null;
		if (withTitle?.error) return withTitle.error;

		if ((await countUserCollections(userId)) >= MAX_COLLECTIONS) {
			return fail(400, { message: `You can have up to ${MAX_COLLECTIONS} collections.` });
		}
		if (await hasCollectionNamed(userId, name)) {
			return fail(409, {
				message: `You already have a collection called “${name}”.`,
				name,
				description
			});
		}

		const created = await createCollection(userId, { name, description });
		if (withTitle?.title) await addMovieToCollection(created.id, userId, withTitle.title);
		return { collectionId: created.id, name: created.name, created: true };
	},

	delete: async ({ request, locals }) => {
		const { userId } = locals.auth();
		if (!userId) return unauthorized();

		const id = collectionId(await request.formData());
		if (!id) return notFound();

		const deleted = await deleteCollection(id, userId);
		if (!deleted) return notFound();
		return { collectionId: id, deleted: true };
	},

	add: async ({ request, locals, fetch }) => {
		const { userId } = locals.auth();
		if (!userId) return unauthorized();

		const data = await request.formData();
		const id = collectionId(data);
		if (!id) return notFound();

		const { title, error } = await titleFromForm(data, fetch);
		if (error) return error;
		return addTitle(userId, id, title);
	},

	remove: async ({ request, locals }) => {
		const { userId } = locals.auth();
		if (!userId) return unauthorized();

		const data = await request.formData();
		const id = collectionId(data);
		const mediaType = field(data, 'mediaType');
		const tmdbId = field(data, 'tmdbId');
		if (!id) return notFound();
		if ((mediaType !== 'movie' && mediaType !== 'tv') || !TMDB_ID.test(tmdbId)) {
			return fail(400, { message: 'That title is invalid.' });
		}

		const result = await removeMovieFromCollection(id, userId, mediaType, Number(tmdbId));
		if (!result) return notFound();
		return { collectionId: id, removed: result.removed };
	}
};
