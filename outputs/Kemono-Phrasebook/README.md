# Kemono Phrasebook — 獸展日文會話手帖

先開 **Kemono-Phrasebook.html**。這是可直接使用的單一 HTML，已內嵌全部程式、樣式、100 句教材與 11 個文法模組，不需要安裝、網路、帳號或 localhost。

## 兩種使用方式

### 單一 HTML（最快開始）

在 macOS 用 Safari、Chrome 或 Edge 開啟 `Kemono-Phrasebook.html`。可直接搜尋、收藏、展示、配對及編輯教材。手機的檔案預覽工具可能不執行 JavaScript；手機建議使用下方 PWA。

### PWA（手機推薦）

將 `pwa/` 內全部檔案放到同一個 HTTPS 靜態網站目錄，例如既有 GitHub Pages。本專案提供 [GitHub Pages 線上版本](https://daisuke.tw/furrynihongo/)，程式與內建教材公開於 [furrynihongo](https://github.com/daisuke1230/furrynihongo)。

1. 在手機瀏覽器開啟網址。
2. 到「設定」確認「必要資源已全部快取」。
3. Android 使用瀏覽器的「安裝應用程式」；iPhone 使用 Safari 的「分享 → 加入主畫面」。
4. 首次快取完成後，關閉 App，開啟飛航模式，再從主畫面開啟，確認這支手機可用。

在 Mac 本機測試 PWA：在本資料夾開啟 Terminal，執行：

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

然後開啟 `http://127.0.0.1:8000/pwa/`。`localhost`／`127.0.0.1` 只供同一台裝置測試；手機連到區域網路 IP 的一般 HTTP 網址通常無法使用 Service Worker。結束時按 Control-C。

## 功能

- **會話**：十個情境、中文／日文／假名／標籤全文搜尋；可疊加情境、文法、難度、常用、收藏、最近使用篩選。片假名與平假名互通搜尋。
- **大字展示**：日本朋友閱讀的日文大字，中文與平假名可個別切換；支援直橫向、重播、停止及快速返回。系統全螢幕視瀏覽器能力提供，否則保留滿版展示。
- **配對練習**：4／6／8 組、兩種語言方向；從目前篩選範圍抽題，排除重複 ID、重複翻譯及相同語意群組。誤配只提供情境提示。完成整回合才儲存結果。
- **錯題複習**：優先抽出待複習錯題，不足組數時從相同篩選範圍補題；之後無誤配對完成的句子會移出待複習。最多保留 100 回學習紀錄。
- **文法**：11 個資料驅動模組，包含句型、解釋、接續／動詞變化、可替換單字、例句、相關會話與配對練習。
- **教材管理**：新增、修改、搜尋、動態新增情境、刪除自訂句子、JSON 驗證／預覽／合併匯入與匯出。
- **設定**：淺色／深色／跟隨系統、四種文字大小、中文／平假名／英文顯示設定、語音選擇與三段語速。

## 日文語音

使用 Web Speech API，指定 `ja-JP`，朗讀**日文原句**。自動模式優先選擇瀏覽器標記為本機的日文語音；語速可選 0.75x、1.0x、1.25x。每次播放前會先停止上一段。

在「設定 → 測試日文語音」確認是否有聲音。如果沒有列出日文語音，請先在作業系統下載／安裝，再重新偵測或重開瀏覽器。

「本機」是瀏覽器提供的標記，**不等於已驗證能離線朗讀**。請在目標手機飛航模式下實際測試。沒有語音時，所有文字教材與遊戲仍可使用。此版保留 `audioUrl` 欄位，尚未實作預錄音檔播放或額外音檔快取。

## 保存、備份與更新

使用 `localStorage` 保存自訂教材、內建教材的本機修改、收藏、最近使用、設定與學習紀錄。原始內建教材不被修改，也不會在 App 更新時主動清空使用者資料。

- **完整備份**：包含全部使用者資料；搬移裝置或版本前先下載。
- **匯出教材**：匯出目前全部教材，可作為編輯及擴充 JSON 範本；不含個人學習紀錄。
- **匯入 JSON**：先驗證並預覽。預設保留相同 ID 的現有內容；勾選「允許更新」後才覆寫同 ID 的教材（完整備份也會套用設定）。收藏與紀錄會合併；檔案中沒有的既有資料保留。
- 匯入最多 5 MB／5,000 句，實際可儲存量受瀏覽器 `localStorage` 空間限制。空間不足時會提示且不套用該次修改。
- 內建教材的本機修改另存在 `overrides`。內建句子可編輯；只有自訂句子可刪除。
- PWA 更新只更換此安裝路徑的靜態快取；不刪除使用者資料。更新後重開 App 載入新版本。
- 不同瀏覽器、網站來源（協定＋網域＋連接埠），以及單檔與 PWA 的儲存互相獨立。同一網站來源的不同路徑可能共用資料。搬移 HTML 路徑也可能影響 `file://` 儲存，請先備份。
- 私密瀏覽、清除網站資料、瀏覽器儲存回收及移除 App 可能清除資料；本機保存不是永久備份。
- 如果舊資料無法解析，App 保留原儲存內容、阻止直接覆寫，並提供復原檔下載。

## 可編輯來源與建置

`source/src/` 內含 HTML、CSS、Vanilla JavaScript 與教材 JSON。沒有第三方前端套件或 CDN。

從本資料夾執行（只需 Python 3）：

```sh
python3 source/scripts/build.py
```

會從同一份來源重建本資料夾內的 HTML 與 `pwa/`。修改教材時編輯 `source/src/data.json`；不要分別修改兩個輸出版本。建置不會讀取或改動瀏覽器資料。

有 Node.js 時可執行資料與邏輯驗證：

```sh
node source/scripts/test-core.cjs
```

完整驗證紀錄見 `驗收紀錄.md`。根專案另保留 `scripts/test-browser.cjs` 作為開發用瀏覽器驗收腳本。

## 教材資料模型

```json
{
  "schemaVersion": 1,
  "categories": [{"id": "my-event", "name": "我的活動", "description": "自訂情境"}],
  "grammars": [],
  "phrases": [{
    "id": "custom-hello",
    "categoryId": "my-event",
    "texts": {"zh-TW": "你好。", "ja-JP": "こんにちは。", "en-US": "Hello."},
    "readings": {"ja-Hira": "こんにちは。"},
    "tags": ["招呼"],
    "grammarIds": [],
    "difficulty": 1,
    "semanticGroup": "greeting-hello",
    "common": true,
    "audioUrl": null,
    "relatedIds": [],
    "followUpIds": []
  }]
}
```

翻譯依 `zh-TW`、`ja-JP`、`en-US` 管理；`ja-Hira` 存在 `readings`，不是獨立翻譯語言。新增英文只需加入 `texts.en-US`，並到設定開啟英文顯示，不須更動既有 ID。相近語意的句子應使用相同 `semanticGroup`，避免同回合產生多個合理答案。全文搜尋無法自行判斷語意是否接近，新增教材仍需人工設定此群組。

文法模組讀取 `grammars`，不是前端寫死。自訂文法可透過 JSON 加入，需提供 `id`、`title`、`group`、`pattern`、`explanation`、`conjugations`、`words`、`exampleIds`。

教材與中文解釋為本工具撰寫，適合獸展日常交流；資料驗證不代表專業日語校訂。文法參考：[東京外國語大學言語模組](https://www.coelang.tufs.ac.jp/mt/ja/gmod/)、[國際交流基金《いろどり》](https://www.irodori.jpf.go.jp/)。參考連結需要網路，教材與解釋本身已內建。
