import { error } from '@sveltejs/kit';
import { TMDB_API } from '$app/env/private';
import { streamOnNavigation } from './defer.js';
import {
	tmdbImageUrl,
	type CastMember,
	type CrewMember,
	type FilmographyGroup,
	type PersonCredit,
	type PersonDetails,
	type PersonVideo,
	type SearchResults,
	type SearchType,
	type SocialLink,
	type TitleExtras,
	type TvEpisode,
	type TvEpisodeRef,
	type TvExtras,
	type TvSeason,
	type TvSeasonDetails,
	type MovieExtras,
	type MovieVideo,
	type TmdbDetails,
	type TmdbMovie,
	type WatchProvider,
	type WatchProviders
} from '#lib/tmdb.js';

export type { TmdbDetails, TmdbMovie };

type MediaType = TmdbMovie['media_type'];

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// TMDB data changes slowly; caching per server instance keeps the homepage's
// many parallel requests off TMDB's rate limit.
const CACHE_TTL_MS = 10 * 60 * 1000;
// A hung TMDB request would otherwise hold navigation open indefinitely.
const REQUEST_TIMEOUT_MS = 8000;
const cache = new Map<string, { expires: number; value: Promise<unknown> }>();

export const MOVIE_GENRES = {
	action: 28,
	comedy: 35,
	horror: 27,
	romance: 10749,
	sciFi: 878,
	thriller: 53
} as const;

export const TV_GENRES = {
	drama: 18
} as const;

// News, reality, soap and talk shows crowd out scripted series in TV discover results.
const UNSCRIPTED_TV_GENRES = '10763|10764|10766|10767';

export class TmdbError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
	}
}

type RawResult = Omit<TmdbMovie, 'media_type' | 'title' | 'release_date'> & {
	title?: string;
	name?: string;
	release_date?: string;
	first_air_date?: string;
};

type RawDetails = RawResult & {
	tagline?: string;
	genres?: { id: number; name: string }[];
	vote_count?: number;
	runtime?: number | null;
	episode_run_time?: number[];
	number_of_seasons?: number;
};

function normalize(result: RawResult, mediaType: MediaType): TmdbMovie {
	return {
		id: result.id,
		media_type: mediaType,
		title: result.title ?? result.name ?? '',
		overview: result.overview,
		poster_path: result.poster_path,
		backdrop_path: result.backdrop_path,
		vote_average: result.vote_average,
		release_date: result.release_date ?? result.first_air_date ?? ''
	};
}

/**
 * Cache a request's promise for `CACHE_TTL_MS`. Failures are evicted so the next
 * request (or "Try again") refetches.
 */
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
	const hit = cache.get(key);
	if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;

	const value = load();
	cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
	value.catch(() => cache.delete(key));
	return value;
}

async function request<T>(
	fetchFn: typeof fetch,
	path: string,
	params: Record<string, string>
): Promise<T> {
	const url = new URL(`${TMDB_BASE_URL}${path}`);
	for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
	url.searchParams.set('api_key', TMDB_API);

	const res = await fetchFn(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
	if (!res.ok) throw new TmdbError(`TMDB request to ${path} failed: ${res.status}`, res.status);
	return res.json();
}

/**
 * Fetch a list endpoint that returns `{ results: [...] }`.
 */
function getList(
	fetchFn: typeof fetch,
	mediaType: MediaType,
	path: string,
	params: Record<string, string> = {}
): Promise<TmdbMovie[]> {
	return cached(`${path}?${new URLSearchParams(params)}`, async () => {
		const data = await request<{ results: RawResult[] }>(fetchFn, path, params);
		return data.results.map((result) => normalize(result, mediaType));
	});
}

/**
 * Fetch trending movies or TV shows for the given time window.
 */
export function getTrending(
	fetchFn: typeof fetch = fetch,
	mediaType: MediaType = 'movie',
	window: 'day' | 'week' = 'week'
) {
	return getList(fetchFn, mediaType, `/trending/${mediaType}/${window}`);
}

/**
 * Fetch TMDB's current popular movies.
 */
export function getPopularMovies(fetchFn: typeof fetch = fetch) {
	return getList(fetchFn, 'movie', '/movie/popular');
}

/**
 * Fetch TMDB's current popular TV shows.
 */
export function getPopularTvShows(fetchFn: typeof fetch = fetch) {
	return getList(fetchFn, 'tv', '/tv/popular');
}

/**
 * Fetch the most popular movies in a genre, skipping titles with too few votes to be meaningful.
 */
export function getMoviesByGenre(fetchFn: typeof fetch = fetch, genreId: number) {
	return getList(fetchFn, 'movie', '/discover/movie', {
		with_genres: String(genreId),
		sort_by: 'popularity.desc',
		include_adult: 'false',
		'vote_count.gte': '100'
	});
}

/**
 * Fetch the most popular scripted TV shows in a genre.
 */
export function getTvShowsByGenre(fetchFn: typeof fetch = fetch, genreId: number) {
	return getList(fetchFn, 'tv', '/discover/tv', {
		with_genres: String(genreId),
		without_genres: UNSCRIPTED_TV_GENRES,
		sort_by: 'popularity.desc',
		include_adult: 'false',
		'vote_count.gte': '100'
	});
}

// Anime as TMDB models it: Japanese-language TV in the Animation genre.
const ANIMATION_GENRE = 16;
const ANIME_PARAMS = {
	with_genres: String(ANIMATION_GENRE),
	with_original_language: 'ja',
	include_adult: 'false'
};
// TMDB's trending lists can't be filtered, so anime are picked out of the top
// `TRENDING_ANIME_PAGES` × 20 trending shows (about 15 of the top 100 are usually anime).
const TRENDING_ANIME_PAGES = 5;
const MIN_TRENDING_ANIME = 8;
const MAX_ROW = 20;
const RECENT_ANIME_DAYS = 30;

type RawTrendingTv = RawResult & { genre_ids?: number[]; original_language?: string };

const isAnime = (result: RawTrendingTv) =>
	result.original_language === 'ja' && !!result.genre_ids?.includes(ANIMATION_GENRE);

/** The most popular anime of all time, skipping titles with too few votes to be meaningful. */
export function getPopularAnime(fetchFn: typeof fetch = fetch) {
	return getList(fetchFn, 'tv', '/discover/tv', {
		...ANIME_PARAMS,
		sort_by: 'popularity.desc',
		'vote_count.gte': '200'
	});
}

/** Popular anime with an episode in the last `RECENT_ANIME_DAYS`. */
function getRecentAnime(fetchFn: typeof fetch) {
	const isoDate = (time: number) => new Date(time).toISOString().slice(0, 10);
	return getList(fetchFn, 'tv', '/discover/tv', {
		...ANIME_PARAMS,
		sort_by: 'popularity.desc',
		// Dates in the params make this a new cache key each day, so the list stays current.
		'air_date.gte': isoDate(Date.now() - RECENT_ANIME_DAYS * 24 * 60 * 60 * 1000),
		'air_date.lte': isoDate(Date.now()),
		'vote_count.gte': '20'
	});
}

/**
 * This week's trending anime, in trending order. Topped up with recently aired anime when a
 * week has few, so the row is never sparse. Pages that fail are skipped.
 */
export function getTrendingAnime(fetchFn: typeof fetch = fetch): Promise<TmdbMovie[]> {
	return cached('/trending/tv/week?anime', async () => {
		const pages = await Promise.allSettled(
			Array.from({ length: TRENDING_ANIME_PAGES }, (_, i) =>
				request<{ results: RawTrendingTv[] }>(fetchFn, '/trending/tv/week', {
					page: String(i + 1)
				})
			)
		);
		const trending = pages
			.flatMap((page) => (page.status === 'fulfilled' ? page.value.results : []))
			.filter(isAnime)
			.map((result) => normalize(result, 'tv'));
		const extra =
			trending.length < MIN_TRENDING_ANIME ? await getRecentAnime(fetchFn).catch(() => []) : [];

		// TMDB's paging can repeat a show across pages.
		const unique = new Map<number, TmdbMovie>();
		for (const show of [...trending, ...extra]) if (!unique.has(show.id)) unique.set(show.id, show);
		if (unique.size === 0 && pages.every((page) => page.status === 'rejected')) {
			throw (pages[0] as PromiseRejectedResult).reason;
		}
		return [...unique.values()].slice(0, MAX_ROW);
	});
}

/**
 * Fetch the basics of one movie or TV show (no extras), e.g. to copy into a collection.
 * Throws `TmdbError` (status 404 for unknown ids).
 */
export function getTitleSummary(
	fetchFn: typeof fetch = fetch,
	mediaType: MediaType,
	id: number
): Promise<TmdbMovie> {
	const path = `/${mediaType}/${id}`;
	return cached(path, async () =>
		normalize(await request<RawResult>(fetchFn, path, {}), mediaType)
	);
}

// TMDB serves at most 500 pages of search results.
const MAX_SEARCH_PAGE = 500;

/**
 * Search movies and/or TV shows by title. "all" uses TMDB's multi search with people
 * dropped, so a page can hold fewer than 20 results.
 */
export function searchTitles(
	fetchFn: typeof fetch = fetch,
	query: string,
	type: SearchType = 'all',
	page = 1
): Promise<SearchResults> {
	const path = type === 'all' ? '/search/multi' : `/search/${type}`;
	const params = {
		query,
		page: String(Math.min(Math.max(page, 1), MAX_SEARCH_PAGE)),
		include_adult: 'false'
	};
	return cached(`${path}?${new URLSearchParams(params)}`, async () => {
		const data = await request<{
			page: number;
			total_pages: number;
			total_results: number;
			results: (RawResult & { media_type?: string })[];
		}>(fetchFn, path, params);

		return {
			page: data.page,
			total_pages: Math.min(data.total_pages, MAX_SEARCH_PAGE),
			total_results: data.total_results,
			results: data.results.flatMap((result) => {
				const mediaType = type === 'all' ? result.media_type : type;
				return mediaType === 'movie' || mediaType === 'tv' ? [normalize(result, mediaType)] : [];
			})
		};
	});
}

type RawPerson = { id: number; name: string; profile_path: string | null };
type RawProvider = { provider_id: number; provider_name: string; logo_path: string };
type RawProviders = Partial<Record<'flatrate' | 'rent' | 'buy', RawProvider[]>> & {
	link?: string;
};
type RegionProviders = Omit<WatchProviders, 'region'>;

type RawMovieDetails = RawDetails & {
	status?: string;
	original_title?: string;
	original_language?: string;
	budget?: number;
	revenue?: number;
	imdb_id?: string | null;
	homepage?: string | null;
	belongs_to_collection?: { name: string } | null;
	production_companies?: { name: string }[];
	production_countries?: { name: string }[];
	spoken_languages?: { iso_639_1: string; english_name: string }[];
	credits?: {
		cast: (RawPerson & { character: string })[];
		crew: (RawPerson & { job: string })[];
	};
	videos?: {
		results: {
			key: string;
			name: string;
			site: string;
			type: string;
			official: boolean;
			published_at: string;
		}[];
	};
	reviews?: {
		results: {
			id: string;
			author: string;
			author_details: { name?: string; avatar_path: string | null; rating: number | null };
			content: string;
			created_at: string;
			url: string;
		}[];
	};
	recommendations?: { results: RawResult[] };
	similar?: { results: RawResult[] };
	release_dates?: {
		results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[];
	};
	keywords?: { keywords: { name: string }[] };
	'watch/providers'?: { results: Record<string, RawProviders> };
};

/** Details plus extras for every region; `pickRegion` narrows them per request. */
type CachedTitle<Extras extends TitleExtras> = {
	details: TmdbDetails;
	extras: Omit<Extras, 'certification' | 'watchProviders'>;
	certifications: Record<string, string>;
	providers: Record<string, RegionProviders>;
};

type RawReviews = RawMovieDetails['reviews'];

const MAX_CAST = 20;
const MAX_CREW = 12;
const MAX_VIDEOS = 12;
const MAX_REVIEWS = 3;
const MAX_KEYWORDS = 15;
const MIN_RECOMMENDATIONS = 6;

// Key crew in display order; anything else (assistants, grips, …) is left out.
const CREW_JOBS = [
	'Director',
	'Screenplay',
	'Writer',
	'Story',
	'Novel',
	'Producer',
	'Original Music Composer',
	'Director of Photography',
	'Editor'
];

const VIDEO_TYPES = ['Trailer', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes'];

// Theatrical release first; it's the rating people expect to see.
const RELEASE_TYPE_PRIORITY = [3, 2, 4, 5, 6, 1];

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

/**
 * Merge each person's key jobs into one entry, ordered by their most important job.
 * `jobs` lists the jobs to keep, most important first.
 */
function keyCrew(crew: (RawPerson & { job: string })[], jobs = CREW_JOBS): CrewMember[] {
	const people = new Map<number, CrewMember & { rank: number }>();
	for (const member of crew) {
		const rank = jobs.indexOf(member.job);
		if (rank === -1) continue;
		const person = people.get(member.id);
		if (person) {
			if (!person.jobs.includes(member.job)) person.jobs.push(member.job);
			person.rank = Math.min(person.rank, rank);
		} else {
			const { id, name, profile_path } = member;
			people.set(id, { id, name, profile_path, jobs: [member.job], rank });
		}
	}
	return [...people.values()]
		.sort((a, b) => a.rank - b.rank)
		.slice(0, MAX_CREW)
		.map(({ id, name, profile_path, jobs: personJobs }) => ({
			id,
			name,
			profile_path,
			jobs: personJobs.sort((a, b) => jobs.indexOf(a) - jobs.indexOf(b))
		}));
}

function toReviews(raw: RawReviews) {
	return (raw?.results ?? []).slice(0, MAX_REVIEWS).map((review) => ({
		id: review.id,
		author: review.author_details.name || review.author,
		avatar_url: avatarUrl(review.author_details.avatar_path),
		rating: review.author_details.rating,
		content: review.content.trim(),
		created_at: review.created_at,
		url: review.url
	}));
}

/** TMDB's recommendations, or "similar" titles when there are too few of them. */
function relatedTitles(
	recommendations: RawResult[] = [],
	similar: RawResult[] = [],
	mediaType: MediaType
) {
	return (recommendations.length >= MIN_RECOMMENDATIONS ? recommendations : similar)
		.filter((title) => title.poster_path)
		.map((title) => normalize(title, mediaType));
}

function rankVideos(videos: NonNullable<RawMovieDetails['videos']>['results']): MovieVideo[] {
	return videos
		.filter((video) => video.site === 'YouTube' && VIDEO_TYPES.includes(video.type))
		.sort(
			(a, b) =>
				VIDEO_TYPES.indexOf(a.type) - VIDEO_TYPES.indexOf(b.type) ||
				Number(b.official) - Number(a.official) ||
				b.published_at.localeCompare(a.published_at)
		)
		.slice(0, MAX_VIDEOS)
		.map(({ key, name, type, official }) => ({ key, name, type, official }));
}

/** TMDB avatars are either image paths or (older accounts) a full URL behind a leading slash. */
function avatarUrl(path: string | null) {
	if (!path) return null;
	return path.startsWith('/http') ? path.slice(1) : tmdbImageUrl(path, 185);
}

function certificationsByRegion(raw: RawMovieDetails['release_dates']) {
	const result: Record<string, string> = {};
	for (const { iso_3166_1, release_dates } of raw?.results ?? []) {
		const rated = release_dates
			.filter((release) => release.certification.trim())
			.sort(
				(a, b) => RELEASE_TYPE_PRIORITY.indexOf(a.type) - RELEASE_TYPE_PRIORITY.indexOf(b.type)
			);
		if (rated[0]) result[iso_3166_1] = rated[0].certification.trim();
	}
	return result;
}

function providersByRegion(raw: RawMovieDetails['watch/providers']) {
	const toProviders = (list: RawProvider[] = []): WatchProvider[] =>
		list.map((provider) => ({
			id: provider.provider_id,
			name: provider.provider_name,
			logo_path: provider.logo_path
		}));

	const result: Record<string, RegionProviders> = {};
	for (const [region, providers] of Object.entries(raw?.results ?? {})) {
		result[region] = {
			link: providers.link ?? null,
			stream: toProviders(providers.flatrate),
			rent: toProviders(providers.rent),
			buy: toProviders(providers.buy)
		};
	}
	return result;
}

function movieFacts(raw: RawMovieDetails): MovieExtras['facts'] {
	const languages = raw.spoken_languages ?? [];
	const languageName = (code: string) =>
		languages.find((language) => language.iso_639_1 === code)?.english_name ||
		languageNames.of(code) ||
		code;

	return {
		status: raw.status || null,
		original_title:
			raw.original_title && raw.original_title !== raw.title ? raw.original_title : null,
		original_language: raw.original_language ? languageName(raw.original_language) : null,
		budget: raw.budget ?? 0,
		revenue: raw.revenue ?? 0,
		collection: raw.belongs_to_collection?.name ?? null,
		companies: raw.production_companies?.map((company) => company.name) ?? [],
		countries: raw.production_countries?.map((country) => country.name) ?? [],
		languages: languages.map((language) => language.english_name || language.iso_639_1),
		keywords: raw.keywords?.keywords.slice(0, MAX_KEYWORDS).map((keyword) => keyword.name) ?? [],
		imdb_id: raw.imdb_id || null,
		homepage: raw.homepage || null
	};
}

function toDetails(raw: RawDetails, mediaType: MediaType): TmdbDetails {
	return {
		...normalize(raw, mediaType),
		tagline: raw.tagline ?? '',
		genres: raw.genres?.map((genre) => genre.name) ?? [],
		vote_count: raw.vote_count ?? 0,
		runtime: (mediaType === 'tv' ? raw.episode_run_time?.[0] : raw.runtime) || null,
		seasons: raw.number_of_seasons ?? null
	};
}

/**
 * Fetch a movie with credits, videos, reviews, recommendations and more in a single request.
 * Only what the page renders is kept, so the cache and the page payload stay small.
 */
function getMovie(fetchFn: typeof fetch, id: number): Promise<CachedTitle<MovieExtras>> {
	const path = `/movie/${id}`;
	return cached(`${path}?full`, async () => {
		const raw = await request<RawMovieDetails>(fetchFn, path, {
			append_to_response:
				'credits,videos,reviews,recommendations,similar,release_dates,keywords,watch/providers'
		});

		return {
			details: toDetails(raw, 'movie'),
			extras: {
				cast: (raw.credits?.cast ?? [])
					.slice(0, MAX_CAST)
					.map(({ id, name, profile_path, character }) => ({ id, name, profile_path, character })),
				crew: keyCrew(raw.credits?.crew ?? []),
				videos: rankVideos(raw.videos?.results ?? []),
				reviews: toReviews(raw.reviews),
				recommendations: relatedTitles(raw.recommendations?.results, raw.similar?.results, 'movie'),
				facts: movieFacts(raw)
			},
			certifications: certificationsByRegion(raw.release_dates),
			providers: providersByRegion(raw['watch/providers'])
		};
	});
}

/** Narrow the region-specific parts of a cached movie or show to one ISO 3166-1 region. */
function pickRegion<Extras extends TitleExtras>(title: CachedTitle<Extras>, region: string) {
	return {
		...title.extras,
		certification: title.certifications[region] ?? title.certifications.US ?? null,
		watchProviders: {
			region: regionNames.of(region) ?? region,
			...(title.providers[region] ?? { link: null, stream: [], rent: [], buy: [] })
		}
	} as Extras;
}

/**
 * Validate a details-route id and run `load`, mapping TMDB failures to SvelteKit errors
 * (404 for unknown ids, 502 for anything else).
 */
async function loadById<T>(label: string, id: string, load: (id: number) => Promise<T>) {
	if (!/^[1-9]\d{0,9}$/.test(id)) error(404, `${label} not found`);

	try {
		return await load(Number(id));
	} catch (err) {
		if (err instanceof TmdbError && err.status === 404) error(404, `${label} not found`);
		console.error(err);
		error(502, `We couldn't load this ${label.toLowerCase()}. Please try again.`);
	}
}

const mediaLabel = (mediaType: MediaType) => (mediaType === 'tv' ? 'TV show' : 'Movie');

/**
 * `load` body for the movie page: details plus extras for `region` (ISO 3166-1, e.g. "US"),
 * which picks the age rating and streaming services.
 */
export function loadMovieDetails(fetchFn: typeof fetch, id: string, region: string) {
	return loadById(mediaLabel('movie'), id, async (numericId) => {
		const movie = await getMovie(fetchFn, numericId);
		return { details: movie.details, ...pickRegion(movie, region) };
	});
}

type RawSeason = {
	id: number;
	season_number: number;
	name: string;
	overview?: string;
	poster_path: string | null;
	air_date: string | null;
	episode_count?: number;
	vote_average?: number;
};

type RawEpisode = {
	id: number;
	season_number: number;
	episode_number: number;
	name: string;
	overview?: string;
	still_path: string | null;
	air_date: string | null;
	runtime?: number | null;
	vote_average?: number;
	vote_count?: number;
};

type RawTvDetails = RawDetails & {
	status?: string;
	type?: string;
	in_production?: boolean;
	original_name?: string;
	original_language?: string;
	last_air_date?: string | null;
	number_of_episodes?: number;
	homepage?: string | null;
	created_by?: RawPerson[];
	networks?: { id: number; name: string; logo_path: string | null }[];
	production_companies?: { name: string }[];
	production_countries?: { name: string }[];
	spoken_languages?: { iso_639_1: string; english_name: string }[];
	seasons?: RawSeason[];
	last_episode_to_air?: RawEpisode | null;
	next_episode_to_air?: RawEpisode | null;
	aggregate_credits?: {
		cast: (RawPerson & {
			roles: { character: string; episode_count: number }[];
			total_episode_count: number;
		})[];
		crew: (RawPerson & { jobs: { job: string; episode_count: number }[] })[];
	};
	videos?: RawMovieDetails['videos'];
	reviews?: RawReviews;
	recommendations?: { results: RawResult[] };
	similar?: { results: RawResult[] };
	content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
	keywords?: { results: { name: string }[] };
	'watch/providers'?: RawMovieDetails['watch/providers'];
	external_ids?: { imdb_id?: string | null };
};

// Key TV crew in display order. Covers live action and anime credits ("Series Composition",
// "Character Designer"); episode directors and writers rank below the people who shape a series.
const TV_CREW_JOBS = [
	'Creator',
	'Series Composition',
	'Original Story',
	'Novel',
	'Comic Book',
	'Executive Producer',
	'Director',
	'Writer',
	'Character Designer',
	'Original Music Composer',
	'Music',
	'Director of Photography',
	'Animation Director'
];
// Long-running shows have dozens of episode directors; keep the most prolific few per job.
const MAX_PER_TV_JOB = 3;

/** Creators plus the series' most prolific key crew, merged per person. */
function tvCrew(raw: RawTvDetails): CrewMember[] {
	const entries = (raw.aggregate_credits?.crew ?? [])
		.flatMap(({ id, name, profile_path, jobs }) =>
			jobs.map(({ job, episode_count }) => ({ id, name, profile_path, job, episode_count }))
		)
		.sort((a, b) => b.episode_count - a.episode_count);

	const perJob = new Map<string, number>();
	const kept = entries.filter((entry) => {
		const count = perJob.get(entry.job) ?? 0;
		perJob.set(entry.job, count + 1);
		return count < MAX_PER_TV_JOB;
	});
	const creators = (raw.created_by ?? []).map((person) => ({ ...person, job: 'Creator' }));
	return keyCrew([...creators, ...kept], TV_CREW_JOBS);
}

function tvCast(raw: RawTvDetails): CastMember[] {
	return (raw.aggregate_credits?.cast ?? []).slice(0, MAX_CAST).map((person) => ({
		id: person.id,
		name: person.name,
		profile_path: person.profile_path,
		character: [...person.roles]
			.sort((a, b) => b.episode_count - a.episode_count)
			.map((role) => role.character)
			.filter(Boolean)
			.join(' / '),
		episode_count: person.total_episode_count
	}));
}

function toSeason(raw: RawSeason): TvSeason {
	return {
		id: raw.id,
		season_number: raw.season_number,
		name: raw.name || (raw.season_number === 0 ? 'Specials' : `Season ${raw.season_number}`),
		overview: raw.overview?.trim() ?? '',
		poster_path: raw.poster_path,
		air_date: raw.air_date || null,
		episode_count: raw.episode_count ?? 0,
		vote_average: raw.vote_average ?? 0
	};
}

/** Regular seasons in order with specials last; announced seasons without episodes are dropped. */
function tvSeasons(raw: RawTvDetails) {
	return (raw.seasons ?? [])
		.filter((season) => (season.episode_count ?? 0) > 0)
		.map(toSeason)
		.sort(
			(a, b) =>
				Number(a.season_number === 0) - Number(b.season_number === 0) ||
				a.season_number - b.season_number
		);
}

function toEpisodeRef(raw: RawEpisode | null | undefined): TvEpisodeRef | null {
	if (!raw) return null;
	const { season_number, episode_number, name, air_date } = raw;
	return { season_number, episode_number, name, air_date: air_date || null };
}

/** Regular episodes aired so far: every episode before the latest one, plus that one. */
function airedEpisodes(seasons: TvSeason[], last: TvEpisodeRef | null, total: number) {
	if (!last) return 0;
	if (last.season_number === 0) return null;

	const lastSeason = seasons.find((season) => season.season_number === last.season_number);
	// Some shows (often anime, e.g. One Piece) number episodes across the whole series.
	const absolute = !!lastSeason && last.episode_number > lastSeason.episode_count;
	const aired = absolute
		? last.episode_number
		: seasons
				.filter((season) => season.season_number > 0 && season.season_number < last.season_number)
				.reduce((sum, season) => sum + season.episode_count, 0) + last.episode_number;
	return total > 0 ? Math.min(aired, total) : aired;
}

function tvFacts(raw: RawTvDetails, seasons: TvSeason[], last: TvEpisodeRef | null) {
	const languages = raw.spoken_languages ?? [];
	const languageName = (code: string) =>
		languages.find((language) => language.iso_639_1 === code)?.english_name ||
		languageNames.of(code) ||
		code;
	const isAnime =
		raw.original_language === 'ja' && !!raw.genres?.some((genre) => genre.name === 'Animation');

	return {
		status: raw.status || null,
		type: isAnime ? 'Anime' : raw.type || null,
		in_production: raw.in_production ?? false,
		original_name: raw.original_name && raw.original_name !== raw.name ? raw.original_name : null,
		original_language: raw.original_language ? languageName(raw.original_language) : null,
		first_air_date: raw.first_air_date || null,
		last_air_date: raw.last_air_date || null,
		seasons: raw.number_of_seasons ?? seasons.filter((season) => season.season_number > 0).length,
		episodes: raw.number_of_episodes ?? 0,
		aired_episodes: airedEpisodes(seasons, last, raw.number_of_episodes ?? 0),
		companies: raw.production_companies?.map((company) => company.name) ?? [],
		countries: raw.production_countries?.map((country) => country.name) ?? [],
		languages: languages.map((language) => language.english_name || language.iso_639_1),
		keywords: raw.keywords?.results.slice(0, MAX_KEYWORDS).map((keyword) => keyword.name) ?? [],
		imdb_id: raw.external_ids?.imdb_id || null,
		homepage: raw.homepage || null
	} satisfies TvExtras['facts'];
}

function tvCertifications(raw: RawTvDetails['content_ratings']) {
	const result: Record<string, string> = {};
	for (const { iso_3166_1, rating } of raw?.results ?? []) {
		if (rating.trim()) result[iso_3166_1] = rating.trim();
	}
	return result;
}

/**
 * Fetch a TV show with series-wide credits, videos, reviews, recommendations and more in a
 * single request. Episodes are fetched per season (see `getTvSeason`).
 */
function getTvShow(fetchFn: typeof fetch, id: number): Promise<CachedTitle<TvExtras>> {
	const path = `/tv/${id}`;
	return cached(`${path}?full`, async () => {
		const raw = await request<RawTvDetails>(fetchFn, path, {
			append_to_response:
				'aggregate_credits,videos,reviews,recommendations,similar,content_ratings,keywords,watch/providers,external_ids'
		});
		const seasons = tvSeasons(raw);
		const lastEpisode = toEpisodeRef(raw.last_episode_to_air);
		const details = toDetails(raw, 'tv');

		return {
			// Many shows leave `episode_run_time` empty; the latest episode's runtime is a good stand-in.
			details: { ...details, runtime: details.runtime ?? raw.last_episode_to_air?.runtime ?? null },
			extras: {
				cast: tvCast(raw),
				crew: tvCrew(raw),
				videos: rankVideos(raw.videos?.results ?? []),
				reviews: toReviews(raw.reviews),
				recommendations: relatedTitles(raw.recommendations?.results, raw.similar?.results, 'tv'),
				seasons,
				lastEpisode,
				nextEpisode: toEpisodeRef(raw.next_episode_to_air),
				creators: (raw.created_by ?? []).map(({ id, name, profile_path }) => ({
					id,
					name,
					profile_path
				})),
				networks: (raw.networks ?? []).map(({ id, name, logo_path }) => ({ id, name, logo_path })),
				facts: tvFacts(raw, seasons, lastEpisode)
			},
			certifications: tvCertifications(raw.content_ratings),
			providers: providersByRegion(raw['watch/providers'])
		};
	});
}

/** Fetch one season of a show with all its episodes. */
function getTvSeason(
	fetchFn: typeof fetch,
	showId: number,
	season: number
): Promise<TvSeasonDetails> {
	const path = `/tv/${showId}/season/${season}`;
	return cached(path, async () => {
		const raw = await request<RawSeason & { episodes?: RawEpisode[] }>(fetchFn, path, {});
		const episodes = (raw.episodes ?? []).map((episode): TvEpisode => ({
			...toEpisodeRef(episode)!,
			id: episode.id,
			overview: episode.overview?.trim() ?? '',
			still_path: episode.still_path,
			runtime: episode.runtime || null,
			vote_average: episode.vote_average ?? 0,
			vote_count: episode.vote_count ?? 0
		}));
		return { ...toSeason(raw), episode_count: episodes.length, episodes };
	});
}

/** The season to open with: the one airing (or last aired), else the first regular season. */
function defaultSeason(extras: TvExtras) {
	const seasons = extras.seasons;
	const current = extras.nextEpisode?.season_number ?? extras.lastEpisode?.season_number;
	if (current && seasons.some((season) => season.season_number === current)) return current;
	return (seasons.find((season) => season.season_number > 0) ?? seasons[0])?.season_number ?? null;
}

/**
 * `load` body for the TV page: details plus extras for `region` (see `loadMovieDetails`) and
 * the episodes of the season picked by the `?season=` param (or a sensible default). Episodes
 * stream in on client-side navigation; see `streamOnNavigation`.
 */
export function loadTvDetails(
	fetchFn: typeof fetch,
	id: string,
	region: string,
	seasonParam: string | null,
	isDataRequest: boolean
) {
	return loadById(mediaLabel('tv'), id, async (numericId) => {
		const show = await getTvShow(fetchFn, numericId);
		const extras = pickRegion(show, region);

		const requested = seasonParam && /^\d{1,4}$/.test(seasonParam) ? Number(seasonParam) : null;
		const selectedSeason =
			requested !== null && extras.seasons.some((season) => season.season_number === requested)
				? requested
				: defaultSeason(extras);
		const episodes =
			selectedSeason === null
				? null
				: (await streamOnNavigation(getTvSeason(fetchFn, numericId, selectedSeason), isDataRequest))
						.value;

		return { details: show.details, ...extras, selectedSeason, season: episodes };
	});
}

type RawPersonCredit = RawResult & {
	adult?: boolean;
	vote_count?: number;
	character?: string;
	job?: string;
	department?: string;
};

type ExternalIdKey =
	| 'imdb_id'
	| 'instagram_id'
	| 'twitter_id'
	| 'facebook_id'
	| 'tiktok_id'
	| 'youtube_id'
	| 'wikidata_id';

type RawPersonDetails = {
	id: number;
	name: string;
	profile_path: string | null;
	biography?: string;
	birthday?: string | null;
	deathday?: string | null;
	place_of_birth?: string | null;
	gender?: number;
	known_for_department?: string | null;
	also_known_as?: string[];
	popularity?: number;
	homepage?: string | null;
	movie_credits?: { cast: RawPersonCredit[]; crew: RawPersonCredit[] };
	external_ids?: Partial<Record<ExternalIdKey, string | null>>;
	images?: { profiles: { file_path: string }[] };
};

type CachedPerson = {
	person: PersonDetails;
	social: SocialLink[];
	photos: string[];
	filmography: FilmographyGroup[];
	knownFor: PersonCredit[];
};

const MAX_KNOWN_FOR = 15;
const MAX_PHOTOS = 20;
const MAX_ALIASES = 8;
// Each of these costs a request, so only the person's best-known movies are searched.
const VIDEO_MOVIES = 6;

const GENDERS: Record<number, PersonDetails['gender']> = {
	1: 'Female',
	2: 'Male',
	3: 'Non-binary'
};

/** Merge credits per movie (one actor can play several characters in a film), newest first. */
function mergeCredits(credits: RawPersonCredit[], role: (credit: RawPersonCredit) => string) {
	const movies = new Map<number, PersonCredit>();
	for (const credit of credits) {
		if (credit.adult) continue;
		const name = role(credit).trim();
		const movie = movies.get(credit.id);
		if (movie) {
			if (name && !movie.roles.includes(name)) movie.roles.push(name);
		} else {
			movies.set(credit.id, {
				...normalize(credit, 'movie'),
				roles: name ? [name] : [],
				vote_count: credit.vote_count ?? 0
			});
		}
	}
	// Undated titles are usually announced projects, so they sort with the newest.
	return [...movies.values()].sort(
		(a, b) =>
			Number(!!a.release_date) - Number(!!b.release_date) ||
			b.release_date.localeCompare(a.release_date)
	);
}

/** Acting first, then crew departments by number of credits. */
function filmography(raw: RawPersonDetails['movie_credits']): FilmographyGroup[] {
	const crewByDepartment = new Map<string, RawPersonCredit[]>();
	for (const credit of raw?.crew ?? []) {
		const department = credit.department || 'Crew';
		crewByDepartment.set(department, [...(crewByDepartment.get(department) ?? []), credit]);
	}

	const crew = [...crewByDepartment]
		.map(([department, credits]) => ({
			department,
			credits: mergeCredits(credits, (credit) => credit.job ?? '')
		}))
		.sort((a, b) => b.credits.length - a.credits.length);
	const acting = mergeCredits(raw?.cast ?? [], (credit) => credit.character ?? '');

	return [{ department: 'Acting', credits: acting }, ...crew].filter(
		(group) => group.credits.length > 0
	);
}

/** The person's most-voted movies in their main department, with posters for the carousel. */
function knownFor(groups: FilmographyGroup[], department: string | null) {
	const group = groups.find((g) => g.department === department) ?? groups[0];
	return (group?.credits ?? [])
		.filter((credit) => credit.poster_path && credit.vote_count > 0)
		.sort((a, b) => b.vote_count - a.vote_count)
		.slice(0, MAX_KNOWN_FOR);
}

function socialLinks(raw: RawPersonDetails): SocialLink[] {
	const ids = raw.external_ids ?? {};
	const links: SocialLink[] = [];
	const add = (kind: SocialLink['kind'], label: string, handle: string | null, url: string) =>
		links.push({ kind, label, handle, url });

	if (ids.imdb_id) add('imdb', 'IMDb', ids.imdb_id, `https://www.imdb.com/name/${ids.imdb_id}/`);
	if (ids.instagram_id)
		add(
			'instagram',
			'Instagram',
			`@${ids.instagram_id}`,
			`https://www.instagram.com/${ids.instagram_id}/`
		);
	if (ids.twitter_id) add('twitter', 'X', `@${ids.twitter_id}`, `https://x.com/${ids.twitter_id}`);
	if (ids.facebook_id)
		add('facebook', 'Facebook', ids.facebook_id, `https://www.facebook.com/${ids.facebook_id}`);
	if (ids.tiktok_id)
		add('tiktok', 'TikTok', `@${ids.tiktok_id}`, `https://www.tiktok.com/@${ids.tiktok_id}`);
	if (ids.youtube_id) {
		// Channel ids start with "UC"; anything else is a handle.
		const handle = ids.youtube_id.replace(/^@/, '');
		if (/^UC[\w-]{22}$/.test(handle))
			add('youtube', 'YouTube', null, `https://www.youtube.com/channel/${handle}`);
		else add('youtube', 'YouTube', `@${handle}`, `https://www.youtube.com/@${handle}`);
	}
	if (ids.wikidata_id)
		add(
			'wikidata',
			'Wikidata',
			ids.wikidata_id,
			`https://www.wikidata.org/wiki/${ids.wikidata_id}`
		);
	if (raw.homepage) add('homepage', 'Official site', null, raw.homepage);
	return links;
}

/** Fetch a person with movie credits, external ids and photos in a single request. */
function getPerson(fetchFn: typeof fetch, id: number): Promise<CachedPerson> {
	const path = `/person/${id}`;
	return cached(`${path}?full`, async () => {
		const raw = await request<RawPersonDetails>(fetchFn, path, {
			append_to_response: 'movie_credits,external_ids,images'
		});
		const groups = filmography(raw.movie_credits);
		const department = raw.known_for_department || null;

		return {
			person: {
				id: raw.id,
				name: raw.name,
				profile_path: raw.profile_path,
				biography: raw.biography?.trim() ?? '',
				birthday: raw.birthday || null,
				deathday: raw.deathday || null,
				place_of_birth: raw.place_of_birth?.trim() || null,
				gender: GENDERS[raw.gender ?? 0] ?? null,
				known_for_department: department,
				also_known_as: (raw.also_known_as ?? [])
					.filter((alias) => alias !== raw.name)
					.slice(0, MAX_ALIASES),
				popularity: raw.popularity ?? 0
			},
			social: socialLinks(raw),
			photos: (raw.images?.profiles ?? []).slice(0, MAX_PHOTOS).map((image) => image.file_path),
			filmography: groups,
			knownFor: knownFor(groups, department)
		};
	});
}

/** A movie's YouTube videos, ranked like the movie page's. */
function getMovieVideos(fetchFn: typeof fetch, id: number): Promise<MovieVideo[]> {
	const path = `/movie/${id}/videos`;
	return cached(path, async () => {
		const raw = await request<NonNullable<RawMovieDetails['videos']>>(fetchFn, path, {});
		return rankVideos(raw.results);
	});
}

/**
 * The trailer and a featurette (often cast interviews) from each of the person's best-known
 * movies; TMDB has no videos of people themselves. Never rejects, since videos are optional.
 */
async function getPersonVideos(fetchFn: typeof fetch, movies: PersonCredit[]) {
	const results = await Promise.allSettled(
		movies.slice(0, VIDEO_MOVIES).map(async (movie) => {
			const videos = await getMovieVideos(fetchFn, movie.id);
			const picks = [
				videos.find((video) => video.type === 'Trailer' || video.type === 'Teaser'),
				videos.find((video) => video.type === 'Featurette' || video.type === 'Behind the Scenes')
			];
			return picks
				.filter((video) => video !== undefined)
				.map((video): PersonVideo => ({
					...video,
					// Most video names don't say which movie they're from.
					name: video.name.toLowerCase().includes(movie.title.toLowerCase())
						? video.name
						: `${movie.title}: ${video.name}`,
					movie: movie.title
				}));
		})
	);
	return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}

/**
 * `load` body for the person page. Videos take extra requests, so they're returned as a
 * promise that SvelteKit streams in after the page renders.
 */
export function loadPersonDetails(fetchFn: typeof fetch, id: string) {
	return loadById('Person', id, async (numericId) => {
		const person = await getPerson(fetchFn, numericId);
		return { ...person, videos: getPersonVideos(fetchFn, person.knownFor) };
	});
}
