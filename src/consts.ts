// Global site data. Imported anywhere via `import { ... } from '../consts'`.

export const SITE_TITLE = 'thoysinc';
export const SITE_DESCRIPTION =
	'Windows Server, Active Directory, Entra ID, Intune, PowerShell — 실무에서 직접 부딪힌 것만 기록합니다.';

export const AUTHOR = 'Jongmin (Amos) Jung';
export const AUTHOR_BIO_KO =
	'2002년부터 리테일 IT 현장에 있었습니다. 매장 15곳을 새로 열며 서버·POS·네트워크를 깔았고, 200대 규모의 Tier 2·3 지원을 맡았습니다. 지금은 애리조나 챈들러에 있습니다.';
export const AUTHOR_BIO_EN =
	'In retail IT since 2002 — built out 15 new store locations, ran Tier 2/3 support across 200+ machines. Based in Chandler, Arizona.';

export const SITE_URL = 'https://blog.thoysinc.com';

export const SOCIAL = {
	github: 'https://github.com/amosthoys-glitch',
	email: 'mailto:amosthoys@gmail.com',
};

export const LANGS = {
	ko: { label: '한국어', short: 'KO', htmlLang: 'ko' },
	en: { label: 'English', short: 'EN', htmlLang: 'en' },
} as const;

export type Lang = keyof typeof LANGS;
