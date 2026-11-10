import { error } from '@sveltejs/kit';
import { isCollectionId } from '#lib/collections.js';
import { getCollectionWithMovies } from '#lib/server/db/collections.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, depends }) => {
	depends('app:collections');

	// Public route: signed-out visitors get a sign-in prompt, never another user's data.
	const { userId } = locals.auth();
	if (!userId) return { signedIn: false as const };

	// Someone else's collection looks exactly like a missing one, so ids can't be probed.
	const collection = isCollectionId(params.id)
		? await getCollectionWithMovies(params.id, userId)
		: null;
	if (!collection) error(404, 'Collection not found');

	return {
		signedIn: true as const,
		collection: {
			id: collection.id,
			name: collection.name,
			description: collection.description,
			createdAt: collection.createdAt.toISOString(),
			updatedAt: collection.updatedAt.toISOString()
		},
		items: collection.items
	};
};
