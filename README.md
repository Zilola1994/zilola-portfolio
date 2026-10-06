# ZILOLA MOTOYOSHI — Interactive Portfolio (web)

Self-contained, offline. No build step, no external requests.

- Open: serve this folder with any static server and open `index.html`
  (e.g. `python3 -m http.server` → http://localhost:8000). Opening the file directly also works in most browsers.
- Host: drag this folder (or the zip) onto https://app.netlify.com/drop, or push it to a GitHub repo and enable GitHub Pages.
  HTTPS is required for phone tilt (DeviceOrientation) on iOS/Android.
- Controls: ← → keys / swipe / dots / arrows. Tilt the phone (or move the mouse left/right) to switch worlds.
  SOUND button (off by default) starts the original synthesized soundtrack.
- Debug: `?slide=3`, `?tilt=-1|0|1` (fixed tilt), `?static` (no motion).
- Files: `index.html` (slides), `pages.css` (page design, same as PDF), `app.css`/`app.js` (shell, tilt, glass),
  `worlds.js` (anime / toy-box world layers), `sound.js` (music — edit CONFIG and stem functions), `fonts/` (subset WOFF2).

## 背景ネームレイヤー / Name layer (new)
- 各スライドのワールド背景とガラスパネルの間に、大きな ZILOLA ワードマーク（インラインSVG、`namelayer.js`／生成: `../gen_namelayer.py`）を配置。
- 文字ごとに位相をずらした「波」の上下＋わずかな回転/スキュー（3.8s）と、クラゲのような呼吸（scale 0.97–1.03・不透明度 0.12–0.20、5.2s）。transform/opacity のみ。
- 傾きに連動：左＝ピンク寄り、右＝ミント＋バイオレットの光、左右に軽くパララックス。`pointer-events:none` で前面の操作に影響しません。
- `?static` のみ完全静止。OSの「視差効果を減らす／アニメーションを減らす」(prefers-reduced-motion) では止めずに、波を小さく・呼吸をゆっくり（8s）にするだけ。自動再生・傾きもそのまま動作（点滅系だけ停止）。

## 自動再生 / Autoplay (new)
- 14枚を7秒ごとに自動送り（最後→最初へループ）。ナビ右端の ❚❚ / ▶ ボタンで一時停止・再開。
- 矢印・ドット・キー操作・スワイプで自動停止。`?noauto` または `?static` で無効。

## 上チルト・オーバービュー / Up-tilt overview (new)
- 端末の上端を奥へ傾ける（最初の姿勢から約22°以上）と、全14スライドのサムネイル一覧（キャリア俯瞰）がガラスで表示。戻すと閉じる。
- PC：マウスを画面最上端に0.35秒置く、または ↑ キー。Esc / ↓ / 画面下端へ移動で閉じる。サムネイルをクリックでそのスライドへ。
- サムネイル画像は `thumbs/`。

## 開き方の注意
- zipは必ず「展開」してから `web/index.html` をブラウザ（Chrome / Safari / Edge）で開いてください。Finderのスペースキー（クイックルック）、iPhoneの「ファイル」アプリのプレビュー、zip内を直接ダブルクリック、ではJavaScriptが動かず静止画になります。
- file:// でそのまま動作します（ES module / fetch 不使用、通常の script タグのみ）。ただしスマホの傾き(ジャイロ)は HTTPS 配信時のみ。PCはマウス左右で傾きを再現。
