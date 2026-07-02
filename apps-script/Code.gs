/**
 * 電子賀卡寄送 - Apps Script 後端（搭配 GitHub Pages 前端）
 * 部署方式：Web App → Execute as: User accessing / Access: Anyone with Google account
 * 記得先直接開 /exec 完成授權！
 */
function doGet() {
  var quotaText = '';
  var authNote = '';
  try {
    var quota = MailApp.getRemainingDailyQuota();
    quotaText = '<p style="font-size:18px;margin:12px 0;">目前帳號今日剩餘寄送配額：<strong>' + quota + '</strong> 封</p>';
    if (quota > 0) {
      authNote = '<p style="color:#1a5;">✅ 已完成授權，現在可以回到 GitHub Pages 工具頁面輸入此網址開始使用。</p>';
    }
  } catch (err) {
    quotaText = '<p style="color:#c33;">尚未完成寄信授權。</p>';
    authNote = '<p style="margin-top:16px;">請點擊上方「Review Permissions」或重新整理本頁，依指示授權「寄送郵件」權限。</p>' +
               '<p style="font-size:13px;color:#666;">授權完成後，配額數字會出現。然後關閉本頁，回到你的 GitHub Pages 電子賀卡工具，貼上本頁網址（/exec 結尾）即可使用。</p>';
  }

  var html = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>電子賀卡寄送 — Apps Script 後端</title>' +
    '<style>body{font-family:-apple-system,system-ui,"PingFang TC","Microsoft JhengHei",sans-serif;line-height:1.7;padding:32px 20px;color:#222;max-width:620px;margin:0 auto;background:#f9f9f9}' +
    'h1{font-size:22px;margin-bottom:8px}.card{background:#fff;border-radius:8px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06)}' +
    'code{background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:90%}a{color:#c33}</style>' +
    '<div class="card"><h1>電子賀卡寄送 API 後端</h1>' +
    '<p>這個 Web App 是搭配 <strong>GitHub Pages 前端</strong> 使用的寄信服務。</p>' +
    '<p><strong>使用流程：</strong></p>' +
    '<ol style="padding-left:20px"><li>第一次請直接開啟本頁，完成 Google 授權（允許寄信）。</li>' +
    '<li>授權成功後看到「剩餘配額」數字。</li>' +
    '<li>複製本頁完整網址（結尾是 /exec）。</li>' +
    '<li>打開 GitHub Pages 的電子賀卡工具頁面，貼上此網址，按「保存」。</li></ol>' +
    quotaText + authNote +
    '<p style="margin-top:24px;font-size:12px;color:#888">此 Apps Script 只會用你的配額寄信，不會存任何資料。部署時請確認「Execute as: User accessing」與「Access: Anyone with Google account」。</p></div>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('電子賀卡寄送 — 請先授權')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  var requestId = '';
  try {
    var payloadText = e && e.parameter && e.parameter.payload;
    if (!payloadText && e && e.postData && e.postData.contents) {
      payloadText = e.postData.contents;
    }
    if (!payloadText) throw new Error('缺少 payload');

    var data = JSON.parse(payloadText);
    requestId = data.requestId || '';
    var result = sendCard(data);
    return postMessageResponse_(requestId, result);
  } catch (err) {
    return postMessageResponse_(requestId, {
      success: false,
      error: err.toString()
    });
  }
}

function sendCard(data) {
  try {
    if (!data.recipientEmail) throw new Error('收件人 Email 為空');
    if (!isValidEmail_(data.recipientEmail)) throw new Error('收件人 Email 格式錯誤');
    if (!data.composedImageData) throw new Error('合成圖片資料為空');

    var remainingQuota = MailApp.getRemainingDailyQuota();
    if (remainingQuota <= 0) throw new Error('今日寄信配額已用完');

    var executingUserEmail = getExecutingUserEmail_();
    var imageBlob = dataUrlToBlob_(data.composedImageData, 'card.png');
    var mailBody = data.mailBody || '';
    var senderName = data.senderName || '';
    var layoutOrder = data.layoutOrder === 'cardFirst' ? 'cardFirst' : 'bodyFirst';
    var safeMailBody = escapeHtml_(mailBody).replace(/\n/g, '<br>');

    var bodyHtml = '';
    if (mailBody.trim()) {
      bodyHtml = '<div style="font-size:15px;margin-bottom:20px;white-space:pre-wrap;">' + safeMailBody + '</div>';
    }

    var cardHtml = '<div style="margin:0 0 20px 0;">'
      + '<img src="cid:cardImage" style="display:block;width:100%;max-width:600px;height:auto;border:0;" alt="賀卡">'
      + '</div>';

    var html = '<div style="max-width:600px;margin:0 auto;font-family:\'PingFang TC\',\'Microsoft JhengHei\',sans-serif;color:#333;line-height:1.7;">';
    html += layoutOrder === 'cardFirst' ? cardHtml + bodyHtml : bodyHtml + cardHtml;
    html += '</div>';

    var subject = data.subject || ('來自 ' + (senderName || '朋友') + ' 的賀卡');
    subject = String(subject).slice(0, 250);

    var plainBody = mailBody.trim()
      ? mailBody + '\n\n（本信件包含一張賀卡圖，請以支援 HTML 的郵件軟體開啟）'
      : '（本信件包含一張賀卡圖，請以支援 HTML 的郵件軟體開啟）';

    var options = {
      htmlBody: html,
      inlineImages: { cardImage: imageBlob }
    };
    if (senderName) options.name = senderName;

    MailApp.sendEmail(data.recipientEmail, subject, plainBody, options);

    return {
      success: true,
      recipientName: data.recipientName || '',
      recipientEmail: data.recipientEmail,
      sentBy: executingUserEmail,
      remainingQuota: MailApp.getRemainingDailyQuota()
    };
  } catch (err) {
    return {
      success: false,
      error: err.toString(),
      recipientName: data.recipientName || '',
      recipientEmail: data.recipientEmail || ''
    };
  }
}

function dataUrlToBlob_(dataUrl, filename) {
  var parts = String(dataUrl || '').split(',');
  if (parts.length < 2) throw new Error('圖片資料格式錯誤');

  var contentTypeMatch = parts[0].match(/:(.*?);/);
  if (!contentTypeMatch) throw new Error('圖片資料格式錯誤');

  var contentType = contentTypeMatch[1];
  var bytes = Utilities.base64Decode(parts[1]);
  return Utilities.newBlob(bytes, contentType, filename);
}

function postMessageResponse_(requestId, result) {
  var message = {
    source: 'ecard-appscript',
    requestId: requestId || '',
    result: result
  };

  var html = '<!doctype html><meta charset="utf-8">' +
    '<script>' +
    'parent.postMessage(' + JSON.stringify(message).replace(/</g, '\\u003c') + ', "*");' +
    '</script>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('寄送結果')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getExecutingUserEmail_() {
  return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || '';
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function escapeHtml_(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
