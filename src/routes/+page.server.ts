import {
	MOVIE_GENRES,
	TV_GENRES,
	getPopularAnime,
	getMoviesByGenre,
	getPopularMovies,
	getPopularTvShows,
	getTrending,
	getTrendingAnime,
	getTvShowsByGenre
} from '#lib/server/tmdb.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const { userId } = locals.auth();

	// Not awaited: each list streams to the page independently, so sections show their own
	// loading state and one failed request doesn't break the others.
	return {
		userId,
		trending: getTrending(fetch, 'movie', 'week'),
		trendingToday: getTrending(fetch, 'movie', 'day'),
		popular: getPopularMovies(fetch),
		action: getMoviesByGenre(fetch, MOVIE_GENRES.action),
		sciFi: getMoviesByGenre(fetch, MOVIE_GENRES.sciFi),
		comedy: getMoviesByGenre(fetch, MOVIE_GENRES.comedy),
		horror: getMoviesByGenre(fetch, MOVIE_GENRES.horror),
		thriller: getMoviesByGenre(fetch, MOVIE_GENRES.thriller),
		romance: getMoviesByGenre(fetch, MOVIE_GENRES.romance),
		popularTv: getPopularTvShows(fetch),
		trendingTv: getTrending(fetch, 'tv', 'week'),
		tvDrama: getTvShowsByGenre(fetch, TV_GENRES.drama),
		trendingAnime: getTrendingAnime(fetch),
		popularAnime: getPopularAnime(fetch)
	};
};
