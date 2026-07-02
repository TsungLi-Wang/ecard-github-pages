function doGet() {
  var quotaText = '';
  try {
    quotaText = '<p>目前帳號今日剩餘寄送配額：' + MailApp.getRemainingDailyQuota() + '</p>';
  } catch (err) {
    quotaText = '<p>尚未完成寄信授權：' + escapeHtml_(err.toString()) + '</p>';
  }

  return HtmlService.createHtmlOutput(
      '<!doctype html><meta charset="utf-8"><title>電子賀卡寄送 API</title>' +
      '<style>body{font-family:system-ui,sans-serif;line-height:1.6;padding:32px;color:#222}</style>' +
      '<h1>電子賀卡寄送 API</h1>' +
      '<p>這個 Apps Script Web App 是 GitHub Pages 前端的寄信後端。</p>' +
      '<p>第一次使用時，請先授權此應用程式寄信。</p>' +
      quotaText)
    .setTitle('電子賀卡寄送 API')
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
