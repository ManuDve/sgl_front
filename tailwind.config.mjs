/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		extend: {
			colors: {
				"sgl-black": "#0A0A0A",
				"sgl-white": "#F5F5F5",
				"sgl-gold": "#C9A84C",
				"sgl-gold-light": "#E8C97A",
				"sgl-gray": "#1A1A1A",
				"sgl-gray-mid": "#6B6B6B",
				"sgl-gray-light": "#E5E5E5"
			},
			fontFamily: {
				sans: ["Inter", "sans-serif"],
				serif: ["Playfair Display", "serif"]
			}
		}
	},
	plugins: []
};
