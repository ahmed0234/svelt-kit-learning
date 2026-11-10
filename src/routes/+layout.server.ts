import { buildClerkProps } from 'svelte-clerk/server';
import { getUserCollections } from '#lib/server/db/collections.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, depends }) => {
	depends('app:collections');

	const auth = locals.auth();
	return {
		...buildClerkProps(auth),
		// Signed-in only, and not awaited: pages render immediately and the "saved" state on
		// cards fills in when this arrives.
		collections: auth.userId ? getUserCollections(auth.userId) : null
	};
};
