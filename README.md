# 電子賀卡寄送器（GitHub Pages 版）

**像 Font-Awesome 工具一樣直接給別人用**：分享 GitHub Pages 網址，別人用自己的 Google 帳號一鍵彈窗授權後即可寄電子賀卡。

日期：2026-07-02

**新版流程（2026-07 改版）**：使用 Google Identity Services + Gmail API，直接在瀏覽器彈窗授權，無需再貼 /exec 或部署 Apps Script 後端寄信。

前端特色：
- 左側即時預覽 + 拖曳區自動轉 AVIF/WebP → PNG
- 罐頭文字可編輯保存
- 收件人清單（支援批次貼上）+ 逐筆狀態
- 賀卡圖合成（含 {name} 替換 + 寄件人 + 日期）
- 信件版型（內文/賀卡誰在前）
- 寄出前逐筆 modal 確認
- 完全靜態，無後端 token 外洩

信件永遠從**使用者自己授權的 Google 帳號**寄出（使用該帳號配額）。

## 架構
- `docs/index.html`：GitHub Pages 靜態前端（單檔，方便 fork / 直接用）
- 使用者自己的 Google 帳號透過 OAuth 彈窗授權（scope: gmail.send）
- 直接呼叫 Gmail API 發送（含 inline 賀卡圖）

舊的 Apps Script 後端保留在 `apps-script/` 供參考或舊版使用者。

## 快速上線步驟（新版 - Google 彈窗授權）

### 1. 取得 Google OAuth Client ID（每個想寄信的人都要做一次）

1. 前往 [Google Cloud Console](https://console.cloud.google.com/) 新增或選擇一個專案。
2. 啟用 **Gmail API**。
3. 左側選單 → **API 與服務** → **憑證** → **建立憑證** → **OAuth 用戶端 ID**。
4. 應用程式類型選「**網頁應用程式**」。
5. 在「**已授權的 JavaScript 來源**」加入：
   - 你的 GitHub Pages 網址（例如 `https://你的帳號.github.io`）
   - `http://localhost` （本地測試用）
6. 建立後複製 **Client ID**（長像 `xxxxxx.apps.googleusercontent.com`）。

> 給少數同事用時，直接加他們為「測試使用者」即可，不用通過 Google 審核。

### 2. 發布到 GitHub Pages

```bash
git add .
git commit -m "chore: ready for launch"
git push -u origin main
```

去 repo **Settings → Pages**：
- Source: Deploy from a branch → `main` + `/docs`

### 3. 使用（非常簡單）

1. 打開你的 GitHub Pages 網址。
2. 最上方貼上你剛取得的 **Client ID** → 點「保存」。
3. 點大藍色按鈕 **「用 Google 帳號授權寄信」** → 跳出 Google 彈窗 → 同意。
4. 授權成功後，頁面會顯示「✅ 已授權 you@gmail.com」。
5. 上傳底圖、加收件人、寫文字、選版型。
6. 「逐筆預覽 & 寄出」 → 直接寄（從你自己的 Gmail 寄出）。

所有設定（Client ID、罐頭文字）只存在你這台瀏覽器。

---

**給別人使用**：把 Pages 網址分享出去，他們自己照上面步驟取得自己的 Client ID 並授權即可。完全不用你給他們任何金鑰。

## 給別人使用

- 你可以把 **Pages 網址** 直接分享給同事/客戶。
- 他們只要：
  1. 自己部署一次 Apps Script 取得 `/exec`
  2. 打開你的 Pages 網址
  3. 貼上自己的 `/exec` 並先開啟授權
- 就不用給他們原始碼或權限。

## 測試建議

先用自己 Email 測 1 筆，確認：
- 寄件人顯示名稱正確
- 信件 HTML 內文 + 賀卡圖正常顯示
- 圖片在 Gmail / Apple Mail / Outlook 都能正常顯示
- 配額有扣

再測 2~3 位收件人，確認逐筆狀態。

## 常見問題（FAQ）

**Q: 按「用 Google 帳號授權寄信」沒反應或跳錯？**  
A: 確認 Client ID 正確 + 已把你的 Pages 網址加到 Google Cloud 的「已授權的 JavaScript 來源」。第一次請用測試使用者。

**Q: 圖片顯示不出來？**  
A: 目前使用 PNG inline (CID)。大部分郵件軟體都支援。如遇問題可試降低圖片尺寸。

**Q: 今天寄信配額用完了？**  
A: Gmail API 配額與 MailApp 類似（個人帳號通常每天 ~100 封左右）。配額用完要等隔天重置。

**Q: 需要部署 Apps Script 嗎？**  
A: 新版不需要了！只有想用舊版的人才需要。這個版本直接用 Gmail API。

**Q: 如何更新工具？**  
A: `git pull` → `git push` → Pages 自動更新。

## 目前限制

- 需要每個使用者自己建立一次 Google Cloud OAuth Client ID（約 5 分鐘）
- 無寄送紀錄
- 無白名單 / 批次上限
- 正式多人使用建議加上這些保護

歡迎 fork 改進後 PR！

後續可做：自動記錄到 Google Sheet、支援更多附件、使用者白名單。
