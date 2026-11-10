/**
 * For data a page shows behind a skeleton: on client-side navigation (`isDataRequest`) the
 * promise is passed through so SvelteKit streams it in after the page renders. On a full page
 * load it's awaited instead, because SSR only renders `{#await}`'s pending branch, so this
 * way the HTML holds the real content. A failure stays a rejected promise so the page can
 * show its error UI either way.
 *
 * The value is wrapped in an object because `await` would otherwise flatten the promise.
 */
export async function streamOnNavigation<T>(
	promise: Promise<T>,
	isDataRequest: boolean
): Promise<{ value: T | Promise<T> }> {
	if (isDataRequest) return { value: promise };
	try {
		return { value: await promise };
	} catch {
		return { value: promise };
	}
}
