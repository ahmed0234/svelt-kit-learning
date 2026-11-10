import { loadTvDetails } from '#lib/server/tmdb.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ fetch, params, request, url, isDataRequest }) => {
	// Vercel sets the visitor's country; elsewhere (e.g. local dev) fall back to the US.
	const country = request.headers.get('x-vercel-ip-country')?.toUpperCase();
	const region = country && /^[A-Z]{2}$/.test(country) ? country : 'US';
	return loadTvDetails(fetch, params.id, region, url.searchParams.get('season'), isDataRequest);
};
