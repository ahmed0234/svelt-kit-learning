import { streamOnNavigation } from '#lib/server/defer.js';
import { getTrending, searchTitles } from '#lib/server/tmdb.js';
import { SEARCH_TYPES, type SearchType } from '#lib/tmdb.js';
import type { PageServerLoad } from './$types';

// Longer queries never match a title and only waste a TMDB request.
const MAX_QUERY_LENGTH = 100;

const isSearchType = (value: string | null): value is SearchType =>
	SEARCH_TYPES.includes(value as SearchType);

export const load: PageServerLoad = async ({ fetch, url, isDataRequest }) => {
	const query = (url.searchParams.get('query') ?? '').trim().slice(0, MAX_QUERY_LENGTH);
	const typeParam = url.searchParams.get('type');
	const type = isSearchType(typeParam) ? typeParam : 'all';
	const page = Math.max(1, Math.floor(Number(url.searchParams.get('page')) || 1));

	const results = query
		? (await streamOnNavigation(searchTitles(fetch, query, type, page), isDataRequest)).value
		: null;

	return {
		query,
		type,
		page,
		results,
		// Fills the page when there's nothing to search for yet.
		trendingMovies: query ? null : getTrending(fetch, 'movie', 'week'),
		trendingTv: query ? null : getTrending(fetch, 'tv', 'week')
	};
};
