import path from 'path';
import forms from '@tailwindcss/forms';
const skeletonPath = require.resolve('@skeletonlabs/skeleton');
import skeleton from '@skeletonlabs/skeleton/tailwind/skeleton.cjs';

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		path.join(skeletonPath, '../**/*.{html,js,svelte,ts}')
	],
	theme: {
		extend: {}
	},
	plugins: [forms, ...skeleton()]
};
