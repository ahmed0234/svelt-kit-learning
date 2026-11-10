import { deserialize } from '$app/forms';
import { goto, invalidate } from '$app/navigation';
import { resolve } from '$app/paths';
import { getContext, setContext } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { toast } from 'svelte-sonner';
import { collectionHref, itemKey, type CollectionSummary, type ItemKey } from '#lib/collections.js';
import type { TmdbMovie } from '#lib/tmdb.js';

type ActionName = 'create' | 'delete' | 'add' | 'remove';

const RESUME_KEY = 'collections:resume-save';
type ActionData = Record<string, unknown> & { message?: string };

/** What gets saved: any movie or TV show the cards render. */
export type SaveTarget = Pick<
	TmdbMovie,
	'id' | 'media_type' | 'title' | 'poster_path' | 'release_date'
>;

export class CollectionActionError extends Error {}

/**
 * Post to one of the `/collections` form actions from anywhere in the app. Throws
 * `CollectionActionError` with a user-facing message when the action fails.
 */
async function postAction(name: ActionName, fields: Record<string, string | number>) {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) body.set(key, String(value));

	let res: Response;
	try {
		res = await fetch(`${resolve('/collections')}?/${name}`, {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
	} catch {
		throw new CollectionActionError("You're offline. Check your connection and try again.");
	}

	const result = deserialize(await res.text());
	if (result.type === 'success') return (result.data ?? {}) as ActionData;
	if (result.type === 'failure') {
		throw new CollectionActionError(
			(result.data as ActionData | undefined)?.message ?? 'Something went wrong.'
		);
	}
	throw new CollectionActionError('Something went wrong. Please try again.');
}

const titleFields = (target: SaveTarget) => ({ mediaType: target.media_type, tmdbId: target.id });

/**
 * The signed-in user's collections, plus the save picker and sign-in prompt that every
 * "+" button opens. One instance per app, provided through context by `CollectionsProvider`.
 */
export class CollectionsState {
	/** Null until loaded, and for signed-out visitors. */
	list = $state.raw<CollectionSummary[] | null>(null);
	status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
	/** Collection ids with a save/remove request in flight. */
	readonly pending = new SvelteSet<string>();

	pickerOpen = $state(false);
	signInOpen = $state(false);
	/** The title the picker (or sign-in prompt) is for. */
	target = $state.raw<SaveTarget | null>(null);
	/** Title to open the picker for once a signed-out visitor has signed in. */
	resumeAfterSignIn = $state.raw<SaveTarget | null>(null);

	// Rebuilt (never mutated) whenever the list changes, so a plain Set is right here.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	savedKeys = $derived(new Set<ItemKey>(this.list?.flatMap((collection) => collection.items)));

	#isSignedIn: () => boolean;
	#loadToken = 0;

	constructor(isSignedIn: () => boolean) {
		this.#isSignedIn = isSignedIn;
	}

	get signedIn() {
		return this.#isSignedIn();
	}

	isSaved(target: Pick<TmdbMovie, 'id' | 'media_type'>) {
		return this.signedIn && this.savedKeys.has(itemKey(target));
	}

	/** Take the collections from the root layout's (streamed) data. */
	async sync(source: Promise<CollectionSummary[]> | CollectionSummary[] | null | undefined) {
		const token = ++this.#loadToken;
		if (!source) {
			this.list = null;
			this.status = 'idle';
			return;
		}
		// Keep showing the previous list while a refresh is in flight.
		if (!this.list) this.status = 'loading';
		try {
			const list = await source;
			if (token !== this.#loadToken) return;
			this.list = list;
			this.status = 'ready';
			this.#resume();
		} catch (err) {
			if (token !== this.#loadToken) return;
			console.error(err);
			this.status = 'error';
		}
	}

	refresh() {
		return invalidate('app:collections');
	}

	/** Open the picker for `target`, or the sign-in prompt for signed-out visitors. */
	open(target: SaveTarget) {
		this.target = target;
		if (this.signedIn) {
			this.pickerOpen = true;
		} else {
			this.resumeAfterSignIn = target;
			// Sign-in may reload the page, so the pending save survives in session storage.
			try {
				sessionStorage.setItem(RESUME_KEY, JSON.stringify(target));
			} catch {
				// Storage can be unavailable (private mode); resuming then only works without a reload.
			}
			this.signInOpen = true;
		}
	}

	/** Show the sign-in prompt without a title (e.g. from the collections page). */
	promptSignIn() {
		this.target = null;
		this.signInOpen = true;
	}

	/** Pick up a save that was interrupted by signing in (call once on the client). */
	restoreResume() {
		try {
			const saved = sessionStorage.getItem(RESUME_KEY);
			if (saved && !this.resumeAfterSignIn) this.resumeAfterSignIn = JSON.parse(saved);
		} catch {
			// Unavailable or malformed storage: nothing to resume.
		}
		if (this.status === 'ready') this.#resume();
	}

	/** After signing in from the prompt, carry on to the picker the visitor was opening. */
	#resume() {
		const target = this.resumeAfterSignIn;
		if (!target || !this.signedIn) return;
		this.resumeAfterSignIn = null;
		try {
			sessionStorage.removeItem(RESUME_KEY);
		} catch {
			// See `open`.
		}
		this.signInOpen = false;
		this.target = target;
		this.pickerOpen = true;
	}

	/** Forget an interrupted save (the visitor dismissed the sign-in prompt). */
	cancelResume() {
		this.resumeAfterSignIn = null;
		try {
			sessionStorage.removeItem(RESUME_KEY);
		} catch {
			// See `open`.
		}
	}

	contains(collection: CollectionSummary, target: SaveTarget) {
		return collection.items.includes(itemKey(target));
	}

	/** Optimistically apply `change` to one collection; returns a function that undoes it. */
	#patch(id: string, change: (collection: CollectionSummary) => CollectionSummary) {
		const before = this.list;
		this.list =
			before?.map((collection) => (collection.id === id ? change(collection) : collection)) ?? null;
		return () => {
			this.list = before;
		};
	}

	async add(collection: CollectionSummary, target: SaveTarget, { quiet = false } = {}) {
		if (this.pending.has(collection.id)) return;
		const key = itemKey(target);
		const rollback = this.#patch(collection.id, (c) => ({
			...c,
			count: c.count + 1,
			items: [key, ...c.items],
			posters: target.poster_path ? [target.poster_path, ...c.posters].slice(0, 4) : c.posters,
			// A one-off timestamp string, not reactive state.
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			updatedAt: new Date().toISOString()
		}));
		this.pending.add(collection.id);
		try {
			const data = await postAction('add', { collectionId: collection.id, ...titleFields(target) });
			if (!quiet) {
				if (data.added === false) toast.info(`Already in ${collection.name}`);
				else
					toast.success(`Saved to ${collection.name}`, {
						description: target.title,
						action: { label: 'View', onClick: () => goto(collectionHref(collection.id)) }
					});
			}
			await this.refresh();
		} catch (err) {
			rollback();
			this.#fail(err, `Couldn't save to ${collection.name}`);
		} finally {
			this.pending.delete(collection.id);
		}
	}

	/** Returns whether the title was removed (the page has refreshed by then). */
	async remove(collection: Pick<CollectionSummary, 'id' | 'name'>, target: SaveTarget) {
		if (this.pending.has(collection.id)) return false;
		const key = itemKey(target);
		const rollback = this.#patch(collection.id, (c) => ({
			...c,
			count: Math.max(0, c.count - 1),
			items: c.items.filter((item) => item !== key)
		}));
		this.pending.add(collection.id);
		try {
			await postAction('remove', { collectionId: collection.id, ...titleFields(target) });
			toast(`Removed from ${collection.name}`, {
				description: target.title,
				action: {
					label: 'Undo',
					onClick: () => {
						const current = this.list?.find((c) => c.id === collection.id);
						if (current) this.add(current, target, { quiet: true });
					}
				}
			});
			await this.refresh();
			return true;
		} catch (err) {
			rollback();
			this.#fail(err, `Couldn't remove from ${collection.name}`);
			return false;
		} finally {
			this.pending.delete(collection.id);
		}
	}

	toggle(collection: CollectionSummary, target: SaveTarget) {
		return this.contains(collection, target)
			? this.remove(collection, target)
			: this.add(collection, target);
	}

	/**
	 * Create a collection, optionally saving `target` into it. Returns the new id, or null
	 * when it failed (the error is shown as a toast and also returned as `error`).
	 */
	async create(
		fields: { name: string; description?: string },
		target?: SaveTarget | null
	): Promise<{ id: string | null; error?: string }> {
		try {
			const data = await postAction('create', {
				name: fields.name,
				description: fields.description ?? '',
				...(target ? titleFields(target) : {})
			});
			const id = String(data.collectionId);
			toast.success(
				target ? `Saved to ${fields.name}` : `Created ${fields.name}`,
				target ? { description: target.title } : undefined
			);
			await this.refresh();
			return { id };
		} catch (err) {
			const message = err instanceof CollectionActionError ? err.message : 'Something went wrong.';
			return { id: null, error: message };
		}
	}

	/**
	 * Delete a collection. Pass `leave` when deleting from the collection's own page: going to
	 * the collections index first means that page never reloads into a "not found" error.
	 */
	async delete(collection: Pick<CollectionSummary, 'id' | 'name'>, { leave = false } = {}) {
		try {
			await postAction('delete', { collectionId: collection.id });
			toast.success(`Deleted ${collection.name}`);
			if (leave) await goto(resolve('/collections'));
			await this.refresh();
			return true;
		} catch (err) {
			this.#fail(err, `Couldn't delete ${collection.name}`);
			return false;
		}
	}

	#fail(err: unknown, title: string) {
		if (!(err instanceof CollectionActionError)) console.error(err);
		toast.error(title, {
			description: err instanceof CollectionActionError ? err.message : 'Please try again.'
		});
	}
}

const KEY = Symbol('collections');

export const setCollections = (state: CollectionsState) => setContext(KEY, state);
export const useCollections = () => getContext<CollectionsState>(KEY);
