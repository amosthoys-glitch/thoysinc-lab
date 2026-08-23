import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			// 글 언어. 블로그 목록의 KO/EN 필터와 <html lang> 에 쓰입니다.
			lang: z.enum(['ko', 'en']).default('ko'),
			// 소문자 kebab-case 로 통일하세요. 태그 페이지가 자동 생성됩니다.
			tags: z.array(z.string()).default([]),
			// true 면 프로덕션 빌드에서 제외됩니다 (dev 서버에서는 보임).
			draft: z.boolean().default(false),
		}),
});

export const collections = { blog };
