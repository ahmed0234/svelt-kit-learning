// Client-safe TMDB types and image helpers. API calls live in `#lib/server/tmdb.ts`.
import { resolve } from '$app/paths';

/**
 * A movie or TV show. TV results are normalized to movie field names on the server
 * (`name` → `title`, `first_air_date` → `release_date`). Ids are only unique per `media_type`.
 */
export type TmdbMovie = {
	id: number;
	media_type: 'movie' | 'tv';
	title: string;
	overview: string;
	poster_path: string | null;
	backdrop_path: string | null;
	vote_average: number;
	release_date: string;
};

export const TMDB_IMAGE_ORIGIN = 'https://image.tmdb.org';

// Widths TMDB serves for each image type (see /configuration).
const BACKDROP_WIDTHS = [300, 780, 1280];
const POSTER_WIDTHS = [185, 342, 500, 780];

export function tmdbImageUrl(path: string, width: number) {
	return `${TMDB_IMAGE_ORIGIN}/t/p/w${width}${path}`;
}

function srcset(path: string, widths: number[]) {
	return widths.map((w) => `${tmdbImageUrl(path, w)} ${w}w`).join(', ');
}

export const backdropSrcset = (path: string) => srcset(path, BACKDROP_WIDTHS);
export const posterSrcset = (path: string) => srcset(path, POSTER_WIDTHS);

// Profiles come in w185 and h632 (≈421px wide at the 2:3 ratio TMDB uses).
export const profileSrcset = (path: string) =>
	`${tmdbImageUrl(path, 185)} 185w, ${TMDB_IMAGE_ORIGIN}/t/p/h632${path} 421w`;

// `hqdefault` is 4:3 with letterboxing, which `object-cover` crops away in a 16:9 frame.
export const youtubeThumbnail = (key: string) => `https://i.ytimg.com/vi/${key}/mqdefault.jpg`;
export const youtubeThumbnailSrcset = (key: string) =>
	`https://i.ytimg.com/vi/${key}/mqdefault.jpg 320w, https://i.ytimg.com/vi/${key}/hqdefault.jpg 480w`;

export const releaseYear = (movie: TmdbMovie) => movie.release_date?.slice(0, 4) || null;

/** One-decimal rating, or null for unrated movies. */
export const formatRating = (movie: TmdbMovie) =>
	movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;

/** Full details for one movie or TV show, normalized like `TmdbMovie`. */
export type TmdbDetails = TmdbMovie & {
	tagline: string;
	genres: string[];
	vote_count: number;
	/** Minutes; for TV, a typical episode. */
	runtime: number | null;
	/** TV only. */
	seasons: number | null;
};

export type TmdbPerson = { id: number; name: string; profile_path: string | null };
export type CastMember = TmdbPerson & {
	character: string;
	/** TV only: episodes the person appeared in across the whole series. */
	episode_count?: number;
};
/** One person with every key job they held, most important first. */
export type CrewMember = TmdbPerson & { jobs: string[] };

/** A YouTube video (TMDB's other hosts are dropped). */
export type MovieVideo = { key: string; name: string; type: string; official: boolean };

export type MovieReview = {
	id: string;
	author: string;
	avatar_url: string | null;
	/** Out of 10, or null if the author didn't rate it. */
	rating: number | null;
	content: string;
	created_at: string;
	url: string;
};

export type WatchProvider = { id: number; name: string; logo_path: string };
export type WatchProviders = {
	/** Display name of the viewer's region, e.g. "United States". */
	region: string;
	/** TMDB's watch page for the region, which credits JustWatch. */
	link: string | null;
	stream: WatchProvider[];
	rent: WatchProvider[];
	buy: WatchProvider[];
};

/** What the movie and TV pages both show beyond `TmdbDetails`. */
export type TitleExtras = {
	/** Age rating for the viewer's region, e.g. "PG-13" or "TV-MA". */
	certification: string | null;
	cast: CastMember[];
	crew: CrewMember[];
	/** Best first: official trailers, then teasers, clips and featurettes. */
	videos: MovieVideo[];
	reviews: MovieReview[];
	recommendations: TmdbMovie[];
	watchProviders: WatchProviders;
};

/** Everything the movie page shows beyond `TmdbDetails`. */
export type MovieExtras = TitleExtras & {
	facts: {
		status: string | null;
		original_title: string | null;
		original_language: string | null;
		/** USD; 0 when unknown. */
		budget: number;
		revenue: number;
		collection: string | null;
		companies: string[];
		countries: string[];
		languages: string[];
		keywords: string[];
		imdb_id: string | null;
		homepage: string | null;
	};
};

export type TvSeason = {
	id: number;
	/** 0 is TMDB's "Specials". */
	season_number: number;
	name: string;
	overview: string;
	poster_path: string | null;
	/** `YYYY-MM-DD`, or null when not announced. */
	air_date: string | null;
	episode_count: number;
	vote_average: number;
};

export type TvEpisodeRef = {
	season_number: number;
	episode_number: number;
	name: string;
	air_date: string | null;
};

export type TvEpisode = TvEpisodeRef & {
	id: number;
	overview: string;
	still_path: string | null;
	runtime: number | null;
	vote_average: number;
	vote_count: number;
};

export type TvSeasonDetails = TvSeason & { episodes: TvEpisode[] };

export type TvNetwork = { id: number; name: string; logo_path: string | null };

/** Everything the TV page shows beyond `TmdbDetails`. */
export type TvExtras = TitleExtras & {
	/** Regular seasons in order, then specials. */
	seasons: TvSeason[];
	lastEpisode: TvEpisodeRef | null;
	nextEpisode: TvEpisodeRef | null;
	creators: TmdbPerson[];
	networks: TvNetwork[];
	facts: {
		status: string | null;
		/** TMDB's show type ("Scripted", "Miniseries", …), or "Anime" for Japanese animation. */
		type: string | null;
		in_production: boolean;
		original_name: string | null;
		original_language: string | null;
		first_air_date: string | null;
		last_air_date: string | null;
		seasons: number;
		episodes: number;
		/** Regular (non-special) episodes aired so far, or null when unknown. */
		aired_episodes: number | null;
		companies: string[];
		countries: string[];
		languages: string[];
		keywords: string[];
		imdb_id: string | null;
		homepage: string | null;
	};
};

/** Link to one season on a TV show's page. */
export const seasonHref = (showId: number, season: number) =>
	`${resolve('/tv/[id]', { id: String(showId) })}?season=${season}`;

/** e.g. "S2 E5"; specials read "Special 3". */
export const episodeCode = (episode: Pick<TvEpisodeRef, 'season_number' | 'episode_number'>) =>
	episode.season_number === 0
		? `Special ${episode.episode_number}`
		: `S${episode.season_number} E${episode.episode_number}`;

// Episode stills come in w92, w185, w300 and original (16:9).
export const stillSrcset = (path: string) =>
	`${tmdbImageUrl(path, 185)} 185w, ${tmdbImageUrl(path, 300)} 300w, ${TMDB_IMAGE_ORIGIN}/t/p/original${path} 1280w`;

/** Link to the details page for a movie or TV show. */
export function detailsHref(movie: TmdbMovie) {
	const params = { id: String(movie.id) };
	return movie.media_type === 'tv' ? resolve('/tv/[id]', params) : resolve('/movie/[id]', params);
}

/** e.g. "2h 5m" */
export function formatRuntime(minutes: number) {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return h > 0 ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

// TMDB dates are plain `YYYY-MM-DD`; format in UTC so the day doesn't shift with the viewer's zone.
const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

export const formatDate = (date: string) => (date ? dateFormat.format(new Date(date)) : null);

export const SEARCH_TYPES = ['all', 'movie', 'tv'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export type SearchResults = {
	results: TmdbMovie[];
	page: number;
	total_pages: number;
	total_results: number;
};

/** Link to the search page. Defaults (type "all", page 1) are left out of the URL. */
export function searchHref(query: string, type: SearchType = 'all', page = 1) {
	const params = new URLSearchParams({ query });
	if (type !== 'all') params.set('type', type);
	if (page > 1) params.set('page', String(page));
	return `${resolve('/search')}?${params}`;
}

/** Link to the details page for a person (actor or crew member). */
export const personHref = (person: { id: number }) =>
	resolve('/actor/[id]', { id: String(person.id) });

export type PersonDetails = TmdbPerson & {
	biography: string;
	/** `YYYY-MM-DD`, or null when unknown. */
	birthday: string | null;
	deathday: string | null;
	place_of_birth: string | null;
	gender: 'Female' | 'Male' | 'Non-binary' | null;
	/** e.g. "Acting", "Directing". */
	known_for_department: string | null;
	also_known_as: string[];
	popularity: number;
};

/** One movie in a filmography, with every role (character or job) the person had on it. */
export type PersonCredit = TmdbMovie & { roles: string[]; vote_count: number };

/** Credits for one department ("Acting", "Directing", …), newest first; undated titles lead. */
export type FilmographyGroup = { department: string; credits: PersonCredit[] };

export type SocialLink = {
	kind:
		'imdb' | 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'youtube' | 'wikidata' | 'homepage';
	label: string;
	/** Handle or id shown under the label; null for links without one (e.g. homepage). */
	handle: string | null;
	url: string;
};

/** A video from one of the person's movies; `movie` is that movie's title. */
export type PersonVideo = MovieVideo & { movie: string };

/**
 * Whole years between `birthday` and `deathday` (or today). Dates are `YYYY-MM-DD`, compared
 * as calendar dates so the result doesn't depend on the viewer's time zone.
 */
export function personAge(birthday: string, deathday?: string | null) {
	const end = deathday ?? new Date().toISOString().slice(0, 10);
	const [by, bm, bd] = birthday.split('-').map(Number);
	const [ey, em, ed] = end.split('-').map(Number);
	if (!by || !ey) return null;
	return ey - by - (em < bm || (em === bm && ed < bd) ? 1 : 0);
}
