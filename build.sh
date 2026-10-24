#!/bin/sh
# 把 src/ 的四段合成單一 HTML：
#   artifact.html — 給 Claude artifact 用（不含 doctype／head，由平台補上）
#   index.html    — 完整網頁，給 GitHub Pages 或直接用瀏覽器開
set -e
cd "$(dirname "$0")"
{ cat src/p1_data.html src/p2_ui.html; printf '<script type="module">\n'; cat src/p3_core.js src/p4_app.js; printf '</script>\n'; } > artifact.html
{ printf '<!doctype html>\n<html lang="zh-Hant-TW">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n'; cat artifact.html; printf '</body>\n</html>\n'; } > index.html
# 語法檢查（需要 node）
if command -v node >/dev/null 2>&1; then
  { sed -n '/^const DATA/,/^};/p' src/p1_data.html; cat src/p3_core.js src/p4_app.js; } > .check.mjs
  node --check .check.mjs && rm -f .check.mjs && echo "syntax OK"
fi
