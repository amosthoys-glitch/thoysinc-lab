// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// 배포 대상마다 주소가 다릅니다.
//   운영(Azure SWA)      : https://blog.thoysinc.com/
//   미리보기(GitHub Pages): https://amosthoys-glitch.github.io/thoyslab-blog/
// 워크플로가 SITE_URL / SITE_BASE 를 넣어 주고, 없으면 운영 기본값을 씁니다.
const site = process.env.SITE_URL ?? 'https://blog.thoysinc.com';
const base = process.env.SITE_BASE ?? '/';

// https://astro.build/config
export default defineConfig({
	site,
	base,
	integrations: [mdx(), sitemap()],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
