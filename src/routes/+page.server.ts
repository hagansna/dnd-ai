import type { PageServerLoad } from './$types';

export const load = (async ({ fetch }) => {
	const res = await fetch('https://www.dnd5eapi.co/api/classes');
	const data = await res.json();
	return { body: data.results };
}) satisfies PageServerLoad;
