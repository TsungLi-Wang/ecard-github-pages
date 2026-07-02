# 電子賀卡寄送器（GitHub Pages 版）

**像 Font-Awesome 工具一樣直接給別人用**：分享你的 GitHub Pages 網址，收件人/同事只要用**自己的** Apps Script 後端（/exec）就能寄信。

日期：2026-07-02

前端特色：
- 左側即時預覽 + 拖曳區自動轉 AVIF/WebP → PNG
- 罐頭文字可編輯保存
- 收件人清單（支援批次貼上）+ 逐筆狀態
- 賀卡圖合成（含 {name} 替換 + 寄件人 + 日期）
- 信件版型（內文/賀卡誰在前）
- 寄出前逐筆 modal 確認
- 完全靜態，無後端 token 外洩

## 架構
- `docs/index.html`：GitHub Pages 靜態前端（單檔，方便 fork / 直接用）
- `apps-script/Code.gs` + `appsscript.json`：寄信後端（MailApp）
- 使用 `postMessage` + 隱藏 iframe 解決跨域問題

信件永遠從**使用者的自己 Google 帳號**寄出。

## 架構

- `docs/index.html`：GitHub Pages 靜態前端。
- `apps-script/Code.gs`：Apps Script MailApp 寄信後端。
- `apps-script/appsscript.json`：Apps Script 權限與 Web App 設定。

這版沒有把 Gmail token 放在 GitHub Pages。使用者必須先登入 Google 並授權 Apps Script，信件會從該使用者的 Gmail / Google Workspace 帳號寄出。

前端呼叫後端採用「隱藏 iframe 表單提交 + `postMessage` 回傳結果」，用來避開 GitHub Pages 直接 `fetch()` Apps Script Web App 常見的 CORS 問題。

## 快速上線步驟

### 1. 準備後端（Apps Script）

1. 新開一個 Apps Script 專案。
2. 複製 `apps-script/Code.gs` 全部貼上。
3. 開啟「顯示 appsscript.json」，把 `apps-script/appsscript.json` 內容貼上。
4. 部署 → Web 應用程式：
   - **執行身份**：存取應用程式的使用者
   - **誰可以存取**：有 Google 帳戶的任何人（或公司網域）
5. 複製 `/exec` 結尾的網址。

### 2. 第一次使用一定要先授權

**每個要寄信的人**都要做這一步：

- 直接在新分頁打開上面拿到的 `/exec` 網址。
- 完成 Google 授權（允許寄送郵件）。
- 看到「剩餘配額」數字後就可以關閉。

> 如果只從 Pages 點寄送，授權畫面很容易被 iframe 藏住，造成「沒反應」。

### 3. 發布到 GitHub Pages

```bash
git add .
git commit -m "chore: ready for launch"
git push -u origin main
```

然後去 repo **Settings → Pages**：
- Source: **Deploy from a branch**
- Branch: `main`
- Folder: `/docs`
儲存後等 1~2 分鐘，得到公開網址。

（本 repo 已經設定好 `/docs` 作為發布來源。）

### 4. 使用

1. 打開 Pages 網址。
2. 最上方貼上你的 `/exec` → 點「保存」。
3. （建議）點「開啟授權頁」再確認一次。
4. 上傳賀卡底圖 → 加入收件人 → 填文字或選罐頭 → 選版型。
5. 「逐筆預覽 & 寄出」檢查每位收件人 → 確認寄出。

所有偏好設定只存在本機。

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
- 信件 HTML 內文與圖片順序
- 圖片在 Gmail / Apple Mail / Outlook 都能正常顯示
- 配額有正確扣除

再試 2~3 位不同收件人，驗證逐筆狀態更新。

## 常見問題（FAQ）

**Q: 按寄送後完全沒反應？**  
A: 99% 是還沒直接開 `/exec` 做過授權。請先直接在新分頁打開你的 `/exec` URL 完成 Google 授權，再回來試。

**Q: 圖片在信件裡顯示不出來？**  
A: 確認使用 PNG / JPG / GIF（工具已限制）。AVIF/WebP/HEIC 即使轉檔也建議測試特定客戶端。圖片建議控制在 1~2MB 內。

**Q: 今天寄信配額用完了？**  
A: Google 個人帳戶每日約 100 封（依帳號而定）。公司 Workspace 額度較高。配額歸零就要等隔天。

**Q: 想讓多個同事共用同一個後端？**  
A: 可以，但要小心配額與發信身份。目前設計是「每人用自己的後端」最乾淨。

**Q: 如何更新這個工具？**  
A: Pull 最新 code → `git push` → Pages 會自動更新。

**Q: 想記錄寄送紀錄？**  
A: 目前版本沒有。後續可串 Google Sheet。

## 目前限制與後續

- 無寄送紀錄表
- 無白名單 / 批次上限保護
- 建議正式給多人用前加上這些限制

歡迎 fork 改進後 PR！
後續優先項目：Sheet 紀錄、白名單、顯示目前授權帳號。
