#!/usr/bin/env node
// 새 글 파일을 src/content/blog/ 에 만듭니다.
//   npm run new -- <slug> ["제목"] [--lang ko|en] [--tags a,b,c] [--mdx]
// 예:
//   npm run new -- ad-first-dc "첫 도메인 컨트롤러 세우기" --tags active-directory,homelab

import { writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'blog');

const argv = process.argv.slice(2);
const flags = { lang: 'ko', tags: '', mdx: false };
const positional = [];

for (let i = 0; i < argv.length; i++) {
	const arg = argv[i];
	if (arg === '--mdx') flags.mdx = true;
	else if (arg === '--lang') flags.lang = argv[++i];
	else if (arg === '--tags') flags.tags = argv[++i];
	else if (arg.startsWith('--')) {
		console.error(`알 수 없는 옵션: ${arg}`);
		process.exit(1);
	} else positional.push(arg);
}

const [slug, title] = positional;

if (!slug) {
	console.error('사용법: npm run new -- <slug> ["제목"] [--lang ko|en] [--tags a,b,c] [--mdx]');
	process.exit(1);
}

if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
	console.error(`slug 는 소문자 영숫자와 하이픈만 씁니다 (받은 값: "${slug}")`);
	process.exit(1);
}

if (flags.lang !== 'ko' && flags.lang !== 'en') {
	console.error(`--lang 은 ko 또는 en 이어야 합니다 (받은 값: "${flags.lang}")`);
	process.exit(1);
}

const tags = flags.tags
	.split(',')
	.map((t) => t.trim())
	.filter(Boolean);

const invalidTag = tags.find((t) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t));
if (invalidTag) {
	console.error(`태그는 소문자 kebab-case 로 씁니다 (받은 값: "${invalidTag}")`);
	process.exit(1);
}

const pubDate = new Date().toLocaleDateString('en-US', {
	month: 'short',
	day: '2-digit',
	year: 'numeric',
}).replace(',', '');

const ko = flags.lang === 'ko';
const body = ko
	? `> 환경: (OS 빌드 / 제품 버전)

## 증상

## 원인

## 해결

\`\`\`powershell

\`\`\`

## 왜 그런가
`
	: `> Environment: (OS build / product versions)

## Symptom

## Cause

## Fix

\`\`\`powershell

\`\`\`

## Why it happens
`;

const frontmatter = [
	'---',
	`title: '${(title ?? slug).replace(/'/g, "''")}'`,
	`description: ''`,
	`pubDate: '${pubDate}'`,
	`lang: '${flags.lang}'`,
	`tags: [${tags.map((t) => `'${t}'`).join(', ')}]`,
	'draft: true',
	'---',
	'',
	'',
].join('\n');

const file = join(BLOG_DIR, `${slug}.${flags.mdx ? 'mdx' : 'md'}`);

try {
	await access(file);
	console.error(`이미 존재합니다: ${file}`);
	process.exit(1);
} catch {
	// 없으면 정상
}

await writeFile(file, frontmatter + body, 'utf8');
console.log(`생성됨: ${file}`);
console.log(`URL:    /blog/${slug}/`);
console.log(`\ndraft: true 상태입니다. 발행할 때 지우거나 false 로 바꾸세요.`);
