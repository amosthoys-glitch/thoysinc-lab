import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** 발행된 글을 최신순으로. 드래프트는 dev 서버에서만 보입니다. */
export async function getPosts(): Promise<Post[]> {
	const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
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
