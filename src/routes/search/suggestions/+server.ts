import { json } from '@sveltejs/kit';
import { searchTitles } from '#lib/server/tmdb.js';
import type { RequestHandler } from './$types';

const MAX_SUGGESTIONS = 6;
const MAX_QUERY_LENGTH = 100;

/** Typeahead results for the navbar search: the top movies and TV shows for `?query=`. */
export const GET: RequestHandler = async ({ fetch, url }) => {
	const query = (url.searchParams.get('query') ?? '').trim().slice(0, MAX_QUERY_LENGTH);
	if (!query) return json([]);

	try {
		const { results } = await searchTitles(fetch, query, 'all');
		return json(results.slice(0, MAX_SUGGESTIONS), {
			// Lets the browser reuse results while the user edits and retypes a query.
			headers: { 'cache-control': 'public, max-age=300' }
		});
	} catch (err) {
		console.error(err);
		return json([], { status: 502 });
	}
};
