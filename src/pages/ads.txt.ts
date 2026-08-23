// ads.txt — 애드센스가 요구하는 게시자 인증 파일.
// 설정이 비어 있으면 빈 파일을 내보냅니다(잘못된 값이 나가는 것보다 낫습니다).
import type { APIRoute } from 'astro';
import { CLIENT_ID, adsEnabled } from '../data/adsense';

export const GET: APIRoute = () => {
	// ca-pub-1234... 에서 앞의 "ca-" 를 뗀 형태를 씁니다.
	const pub = CLIENT_ID.replace(/^ca-/, '');
	const body = adsEnabled ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : '';

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
