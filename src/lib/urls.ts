// 사이트 내부 링크는 전부 이걸 거쳐야 합니다.
// 운영은 base '/' 지만 GitHub Pages 미리보기는 '/thoysinc-lab' 아래에 올라가서,
// 링크를 하드코딩하면 미리보기에서 전부 깨집니다.
const BASE = ('/' + import.meta.env.BASE_URL + '/').replace(/\/+/g, '/');

/** url('blog/hello/') -> '/blog/hello/' (운영) 또는 '/thoysinc-lab/blog/hello/' (미리보기) */
export function url(path = ''): string {
	return BASE + path.replace(/^\//, '');
}
