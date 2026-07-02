# 電子賀卡寄送器：GitHub Pages 遷移版

日期：2026-07-02

## 架構

- `docs/index.html`：GitHub Pages 靜態前端。
- `apps-script/Code.gs`：Apps Script MailApp 寄信後端。
- `apps-script/appsscript.json`：Apps Script 權限與 Web App 設定。

這版沒有把 Gmail token 放在 GitHub Pages。使用者必須先登入 Google 並授權 Apps Script，信件會從該使用者的 Gmail / Google Workspace 帳號寄出。

前端呼叫後端採用「隱藏 iframe 表單提交 + `postMessage` 回傳結果」，用來避開 GitHub Pages 直接 `fetch()` Apps Script Web App 常見的 CORS 問題。

## 今天部署步驟

### 1. 建立或更新 Apps Script 後端

1. 到 Apps Script 建立專案。
2. 把 `apps-script/Code.gs` 貼到 Apps Script 的 `Code.gs`。
3. 在專案設定中勾選顯示 `appsscript.json`。
4. 把 `apps-script/appsscript.json` 貼到 Apps Script 的 manifest。
5. 點 `Deploy` -> `New deployment`。
6. Type 選 `Web app`。
7. `Execute as` 選 `User accessing the web app`。
8. `Who has access` 先選你要測試的範圍：
   - 公司內部：選網域內使用者。
   - 今天先快速測外部 Google 帳號：可先選 anyone with Google account。
9. 部署後複製 `/exec` 結尾的 Web App URL。

### 2. 先完成使用者授權

每個要寄信的使用者第一次使用前，先直接打開 Apps Script Web App URL。

看到「電子賀卡寄送 API」頁面，並能看到今日剩餘配額，就代表授權完成。

如果沒有先完成授權，GitHub Pages 前端送信時，授權畫面可能被藏在 iframe 裡，使用者會覺得像是沒有反應。

### 3. 發布 GitHub Pages

把整個 `ecard-github-pages` 資料夾推到 GitHub repo。

GitHub repo 設定：

1. 到 repo 的 `Settings`。
2. 進 `Pages`。
3. Source 選 `Deploy from a branch`。
4. Branch 選 `main`。
5. Folder 選 `/docs`。
6. 儲存後等待 GitHub Pages 產生網址。

### 4. 設定前端

1. 開啟 GitHub Pages 網址。
2. 在「Apps Script Web App URL」貼上剛才的 `/exec` URL。
3. 按「保存 API 設定」。
4. 上傳賀卡底圖、加入收件人、填寫賀卡文字與信件內容。
5. 先按「寄出前預覽」。
6. 再按「批次寄出」。

## 測試建議

先用 1 位自己的測試收件人測：

- 收件人是否收到信。
- From 是否為授權中的 Google 帳號。
- 寄件顯示名稱是否正確。
- HTML 信件內文與賀卡圖片順序是否正確。
- 圖片是否能在 Gmail、Apple Mail、Outlook 中顯示。

再測 2 到 3 位收件人，確認逐筆寄送結果會回到前端。

## 目前限制

- 第一次授權請先直接開 Apps Script URL，不要只從 GitHub Pages 按寄送。
- 這版尚未加入 Google Sheet 寄送紀錄。
- 這版尚未加入使用者白名單。
- 這版尚未加入每批上限，正式給多人使用前建議補上。
- `name` 是寄件顯示名稱，不會任意更改真正 From email。

## 後續優先更新

1. 加 Google Sheet 寄送紀錄。
2. 加使用者白名單與網域限制。
3. 加每批收件人上限。
4. 加「目前授權帳號」提示，讓使用者知道信會從哪個帳號寄出。
5. 若要公開給公司外多人長期使用，再評估 OAuth 驗證、Cloudflare Worker proxy 或正式後端。
