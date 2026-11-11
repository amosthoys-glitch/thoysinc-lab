// 대표 사진이 없는 글의 공유 카드(1200x630)를 만듭니다. 한 번 만들어 src/assets/에 커밋합니다.
// 실행: node scripts/make-og.mjs
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f1219"/>
  <rect x="0" y="0" width="16" height="630" fill="#2337ff"/>
  <text x="90" y="200" font-family="Consolas, Menlo, monospace" font-size="40" fill="#6b7cff">PS C:\\&gt; _</text>
  <text x="90" y="330" font-family="Segoe UI, Arial, sans-serif" font-size="110" font-weight="700" fill="#ffffff">thoysinc</text>
  <text x="94" y="410" font-family="Segoe UI, Arial, sans-serif" font-size="38" fill="#c7cede">Windows Server · Active Directory · Microsoft 365 · Security</text>
  <text x="94" y="465" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="34" fill="#9aa5bd">실무에서 직접 부딪힌 것만 기록합니다</text>
  <text x="94" y="560" font-family="Segoe UI, Arial, sans-serif" font-size="32" fill="#6b7cff">blog.thoysinc.com</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('src/assets/og-default.png');
console.log('src/assets/og-default.png');
