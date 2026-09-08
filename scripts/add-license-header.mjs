// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Thoys Inc.

// 사이트 코드 맨 위에 라이선스 표시를 넣는다.
//
// 파일은 한 개씩 떨어져 돌아다닌다. 누가 컴포넌트 하나만 퍼가면 그 사본에는 조건이
// 남지 않는다. SPDX 한 줄이면 사람도 도구도(라이선스 스캐너) 바로 알아본다.
//
//   node scripts/add-license-header.mjs          바뀔 파일만 보여준다
//   node scripts/add-license-header.mjs --write  실제로 넣는다
//
// ⚠️ 글에는 넣지 않는다. src/content/ 아래(글·이미지)는 MIT 가 아니라 저작권 유보이고,
//    거기에 MIT 표시를 달면 정반대의 뜻이 된다. CONTENT-LICENSE.md 참조.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..");
const WRITE = process.argv.includes("--write");
const MARK = "SPDX-License-Identifier";

const LINES = ["SPDX-License-Identifier: MIT", "Copyright (c) 2026 Thoys Inc."];

// 확장자별 주석 모양. 여기 없는 것은 손대지 않는다 — 형식을 잘못 짚으면 파일이 깨진다.
const STYLE = {
  ".astro": ["// ", ""], // 프론트매터(---) 안에 넣는다. 아래 참조.
  ".ts": ["// ", ""],
  ".mjs": ["// ", ""],
  ".js": ["// ", ""],
  ".css": ["/* ", " */"],
};

// 글과 남의 것은 건드리지 않는다.
const SKIP = [
  /^src\/content\//, // 글 — 저작권 유보
  /^dist\//,
  /^node_modules\//,
  /^public\//,
  /^legacy\//,
];

const files = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => STYLE[path.extname(f)])
  .filter((f) => !SKIP.some((re) => re.test(f)));

let added = 0;
let skipped = 0;

for (const rel of files) {
  const full = path.join(ROOT, rel);
  const src = fs.readFileSync(full, "utf8");

  if (src.slice(0, 400).includes(MARK)) {
    skipped += 1;
    continue;
  }

  const [open, close] = STYLE[path.extname(rel)];
  const nl = src.includes("\r\n") ? "\r\n" : "\n";
  const header = LINES.map((l) => `${open}${l}${close}`).join(nl);

  let out;
  if (path.extname(rel) === ".astro" && /^---\r?\n/.test(src)) {
    // Astro 는 파일 맨 앞의 --- 가 프론트매터의 시작이다. 그 위에 무엇이든 두면
    // 프론트매터로 인식되지 않으므로, 여는 --- 바로 아래에 넣는다.
    const brk = src.indexOf("\n") + 1;
    out = src.slice(0, brk) + header + nl + src.slice(brk);
  } else {
    out = header + nl + nl + src;
  }

  if (WRITE) fs.writeFileSync(full, out, "utf8");
  added += 1;
  console.log(`  ${WRITE ? "추가" : "추가 예정"}  ${rel}`);
}

console.log(`\n${added}개 ${WRITE ? "추가함" : "추가 예정"} · ${skipped}개는 이미 있음`);
if (!WRITE && added) console.log("실제로 넣으려면 --write 를 붙일 것");
