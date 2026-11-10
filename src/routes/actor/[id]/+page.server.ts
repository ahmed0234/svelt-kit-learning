import { loadPersonDetails } from '#lib/server/tmdb.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ fetch, params }) => loadPersonDetails(fetch, params.id);
