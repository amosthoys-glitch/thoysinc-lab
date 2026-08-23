// Global site data. Imported anywhere via `import { ... } from '../consts'`.

export const SITE_TITLE = 'thoyslab';
export const SITE_DESCRIPTION =
	'Windows Server, Active Directory, Entra ID, Intune, PowerShell — 실무에서 직접 부딪힌 것만 기록합니다.';

export const AUTHOR = 'Jongmin (Amos) Jung';
export const AUTHOR_BIO_KO =
	'8년차 시스템 관리자. 애리조나 챈들러에서 Windows 인프라를 다룹니다.';
export const AUTHOR_BIO_EN =
	'Sysadmin with 8+ years in Windows infrastructure. Based in Chandler, Arizona.';

export const SITE_URL = 'https://blog.thoysinc.com';

export const SOCIAL = {
	github: 'https://github.com/', // TODO: 본인 계정
	linkedin: 'https://www.linkedin.com/', // TODO: 본인 프로필
	email: 'mailto:amosthoys@gmail.com',
};

export const LANGS = {
	ko: { label: '한국어', short: 'KO', htmlLang: 'ko' },
	en: { label: 'English', short: 'EN', htmlLang: 'en' },
} as const;

export type Lang = keyof typeof LANGS;
