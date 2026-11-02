// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Thoys Inc.

import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

// pubDate 는 날짜만 적으므로 UTC 자정으로 읽힙니다. 애리조나(UTC-7, 서머타임 없음)
// 자정에 공개되도록 7시간을 더해 비교합니다. 매일 새벽 다시 빌드하는 워크플로가
// 그날 날짜의 글을 공개합니다(예약 발행).
const ARIZONA_OFFSET_MS = 7 * 60 * 60 * 1000;

const isLive = (data: Post['data']) =>
	!data.draft && data.pubDate.getTime() + ARIZONA_OFFSET_MS <= Date.now();

/** 공개할 글을 최신순으로. dev 서버에서는 드래프트와 예약 글도 보입니다. */
export async function getPosts(): Promise<Post[]> {
	const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || isLive(data));
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** 태그 -> 글 개수. 개수 많은 순, 동률이면 사전순. */
export async function getTagCounts(): Promise<{ tag: string; count: number }[]> {
	const posts = await getPosts();
	const counts = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.data.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}
	return [...counts.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 해당 태그가 달린 글만. */
export async function getPostsByTag(tag: string): Promise<Post[]> {
	const posts = await getPosts();
	return posts.filter((post) => post.data.tags.includes(tag));
}
