# Furry Nihongo

Kemono Phrasebook：手機優先的離線獸展日文會話工具。HTML/CSS/Vanilla JavaScript，沒有套件依賴、CDN、帳號或後端。

先開 [可直接使用的單一 HTML](outputs/Kemono-Phrasebook/Kemono-Phrasebook.html)。手機 PWA 與完整使用說明見 [交付資料夾 README](outputs/Kemono-Phrasebook/README.md)。

- `src/`：主要來源與 202 句會話、119 個單字、11 個文法模組。
- `scripts/build.py`：使用 Python 3 重建兩種格式。
- `scripts/test-core.cjs`：資料、搜尋、選題、匯入與備份邏輯驗證（Node.js）。
- `scripts/test-browser.cjs`：開發用 Playwright 驗收，可由 `PLAYWRIGHT_MODULE`、`CHROME_BIN`、`TEST_ORIGIN` 指定本機測試環境。
- `outputs/Kemono-Phrasebook/`：集中交付，包含單一 HTML、PWA 與可編輯來源。
- `work/`：暫存與測試輸出，不作為交付。

```sh
python3 scripts/build.py
node scripts/test-core.cjs
```

建置後以靜態 HTTP server 供應專案，再執行瀏覽器驗收（預設 localhost:8765）：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
node scripts/test-browser.cjs
```

瀏覽器驗收依賴 Playwright；App 與建置程序本身不需要安裝任何 npm 套件。使用者資料只在瀏覽器，不寫入專案或交付檔案。

## GitHub Pages 部署

已提供 `.github/workflows/pages.yml`，推送 `main` 或手動執行 workflow 時：

1. 驗證全部教材、搜尋、抽題與資料匯入邏輯。
2. 從 `src/` 建置 Standalone 與 PWA。
3. 僅發布 `outputs/Kemono-Phrasebook/pwa/`，作為網站根目錄。

在 GitHub repository 的 **Settings → Pages → Build and deployment** 選擇 **GitHub Actions**。成功網址以 workflow 的 `github-pages` environment 顯示為準。已使用相對路徑，支援 `/<repository>/` 子目錄；不需要額外加入 `CNAME` 或修改既有主站。

Repository：[daisuke1230/furrynihongo](https://github.com/daisuke1230/furrynihongo)。GitHub Pages 網址：[Furry Nihongo](https://daisuke.tw/furrynihongo/)。既有主站使用 `daisuke.tw`，本專案沿用其子路徑，不另設網域。

目前為開發中的 MVP，教材持續修訂，尚未經日語母語者逐句校訂。

公開內容為程式與內建教材；收藏、自訂教材、設定與學習紀錄只存在各瀏覽器，不會因部署而上傳到 GitHub。使用者從單檔搬到網站前，請先匯出完整備份，再到網站匯入。

GitHub Pages 只負責提供網頁；現有 Web Speech API 的音質仍取決於裝置與瀏覽器。若要固定音質，可在之後改用預先產生的日文音檔，與教材一起離線快取。

官方說明：[GitHub Pages 自訂 workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[自訂網域與專案網站](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)。

## 本次教材擴充

目前 321 筆有效教材，包含 202 句會話與 119 個單字。新增遊行、私下邀約、回房間、親密互動及性暗示與回應；曖昧邀約附語境說明與可點選的回應。所有用語統一使用「界限」。

教材的 `kind`、`usageNote` 為可選欄位，舊版資料與使用者儲存不需重設。單字／會話種類篩選也會套用於配對選題。

## 攝影引導與男性親密溝通補充

新增 24 句攝影引導與 12 個相關詞語：頭部左右方向、收下巴、維持姿勢、看指尖或指定方位、舉起左右手／雙手、站位與拍完放鬆。左右明確以被攝者自己的方向為準，可用「頭的方向」「維持姿勢」「看指定位置」「手部動作」搜尋。

親密與性暗示以男性同士語境為主，新增 18 句、8 個詞語，涵蓋撫摸意願、可碰部位、衣物界限，以及口交詞義、誰做／誰接受、分別接受或拒絕與暫停確認。內容是非露骨的理解與意願溝通，不含性行為技巧或操作指導。

「避孕」移出預設教材，保留男性間也適用的保險套、同意與停止等用語。移出的舊項目保留原 ID 作備份相容用途，不出現在預設搜尋或配對；使用者既有修改與自訂資料保留。
