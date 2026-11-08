// 글을 올린 뒤 실행하면 사이트맵의 모든 주소를 IndexNow(Bing·Naver 등)에 알립니다.
// 사용법: node scripts/indexnow.mjs [host]   기본 host = blog.thoysinc.com
// 키 파일 https://<host>/<KEY>.txt 이 먼저 배포되어 있어야 합니다.
const KEY = 'fb9ce7fbfefce628be64cd5114d7638f';
const host = process.argv[2] || 'blog.thoysinc.com';
const base = `https://${host}`;

async function sitemapUrls(url) {
	const xml = await (await fetch(url)).text();
	const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
	const out = [];
	for (const loc of locs) {
		if (loc.endsWith('.xml')) out.push(...(await sitemapUrls(loc)));
		else out.push(loc);
	}
	return out;
}

const keyCheck = await fetch(`${base}/${KEY}.txt`);
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
	console.error(`키 파일이 아직 ${base}/${KEY}.txt 에 없습니다. 배포를 먼저 기다리세요.`);
	process.exit(1);
}
const urlList = (await sitemapUrls(`${base}/sitemap-index.xml`)).filter((u) => u.startsWith(base));
const res = await fetch('https://api.indexnow.org/indexnow', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json; charset=utf-8' },
	body: JSON.stringify({ host, key: KEY, keyLocation: `${base}/${KEY}.txt`, urlList }),
});
console.log(`${host}: ${urlList.length}개 주소 제출 → HTTP ${res.status} ${await res.text()}`);
