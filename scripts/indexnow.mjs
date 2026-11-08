// 새로 올리거나 고친 글 주소를 IndexNow(Bing·Naver·Yandex 등)에 알립니다.
// 사용법:
//   node scripts/indexnow.mjs <host> <주소...>   바뀐 주소만 보냄 (평소에는 이렇게)
//   node scripts/indexnow.mjs <host> --all       사이트맵 전체를 보냄 (처음 한 번만)
// 같은 주소 묶음을 짧은 시간에 여러 번 보내면 403(UserForbiddedToAccessSite)으로 거절되니,
// 전체 제출은 되도록 하지 말고 바뀐 주소만 보내세요.
// 키 파일 https://<host>/<KEY>.txt 이 먼저 배포되어 있어야 합니다.
const KEY = 'fb9ce7fbfefce628be64cd5114d7638f';
const host = process.argv[2] || 'life.thoysinc.com';
const base = `https://${host}`;
const args = process.argv.slice(3);

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

let urlList;
if (args.includes('--all')) {
	urlList = (await sitemapUrls(`${base}/sitemap-index.xml`)).filter((u) => u.startsWith(base));
} else {
	urlList = [...new Set(args.filter((u) => u.startsWith(base)))];
}
if (urlList.length === 0) {
	console.log(`${host}: 보낼 주소가 없습니다.`);
	process.exit(0);
}

// 배포 직후에는 새 페이지가 아직 안 퍼졌을 수 있어, 200 이 나오는 주소만 보냅니다.
const live = [];
for (const u of urlList) {
	const r = await fetch(u, { method: 'HEAD' });
	if (r.ok) live.push(u);
	else console.log(`건너뜀 (HTTP ${r.status}): ${u}`);
}
if (live.length === 0) process.exit(0);

// 한 주소씩 GET 으로 보냅니다. 여러 주소를 한 번에 POST 하면 403 으로 거절되는 일이 있었습니다.
for (const u of live) {
	const r = await fetch('https://api.indexnow.org/indexnow?url=' + encodeURIComponent(u) + '&key=' + KEY);
	console.log(`${r.status} ${u}`);
}
