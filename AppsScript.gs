// ============================================================
// Thrive Name Tags — Google Apps Script
// Copy this entire file into your Google Apps Script project
// Then: Deploy → New deployment → Web app → Execute as: Me → Anyone
// ============================================================

const SS = SpreadsheetApp.getActiveSpreadsheet();

// ============================================================
// doGet — READ actions (returns JSON)
// ============================================================
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  try {
    switch (action) {
      case 'getMasterList':
        return jsonResponse(getMasterList());
      case 'getFormResponses':
        return jsonResponse(getFormResponses());
      case 'getAttendance':
        return jsonResponse(getAttendanceData(e.parameter.date || ''));
      case 'getAuditLog':
        return jsonResponse(getAuditLog());
      case 'getDevices':
        return jsonResponse(getDevices());
      default:
        return jsonResponse({ version: '2.0', status: 'ok' });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getMasterList() {
  const sheet = SS.getSheetByName('Master List');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const cn = String(row[0] || '').trim();
    const en = String(row[1] || '').trim();
    if (!cn && !en) continue;
    result.push({
      chinese: cn,
      english: en,
      service: String(row[2] || '').trim(),
      group: String(row[3] || '').trim(),
      kid: String(row[4] || '').trim().toUpperCase() === 'Y'
    });
  }
  return result;
}

function getFormResponses() {
  const sheet = SS.getSheets()[0]; // First sheet (Form Responses)
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Form responses: Timestamp, Chinese Name, English Name, ...
    const cn = String(row[1] || '').trim();
    const en = String(row[2] || '').trim();
    if (!cn && !en) continue;
    result.push({ chinese: cn, english: en });
  }
  return result;
}

function getAttendanceData(dateFilter) {
  const sheet = SS.getSheetByName('Attendance');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const date = String(row[0] || '').trim();
    // Filter by date if provided
    if (dateFilter && date !== dateFilter) continue;
    result.push({
      date: date,
      time: String(row[1] || '').trim(),
      chinese: String(row[2] || '').trim(),
      english: String(row[3] || '').trim(),
      service: String(row[4] || '').trim(),
      isKid: String(row[5] || '').trim(),
      isNew: String(row[6] || '').trim(),
      deviceId: String(row[7] || '').trim(),
      personId: String(row[8] || '').trim()
    });
  }
  return result;
}

function getAuditLog() {
  const sheet = SS.getSheetByName('Audit');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  // Return last 100 rows, most recent first
  const result = [];
  for (let i = data.length - 1; i >= 1 && result.length < 100; i--) {
    const row = data[i];
    result.push({
      timestamp: String(row[0] || ''),
      deviceId: String(row[1] || ''),
      deviceName: String(row[2] || ''),
      action: String(row[3] || ''),
      details: String(row[4] || '')
    });
  }
  return result;
}

function getDevices() {
  const sheet = SS.getSheetByName('Devices');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    result.push({
      deviceId: String(row[0] || ''),
      deviceName: String(row[1] || ''),
      userAgent: String(row[2] || ''),
      lastSeen: String(row[3] || ''),
      firstSeen: String(row[4] || '')
    });
  }
  return result;
}

// ============================================================
// doPost — WRITE actions (existing functionality)
// ============================================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    switch (action) {
      case 'attendance':
        return handleAttendance(body);
      case 'audit':
        return handleAudit(body);
      case 'heartbeat':
        return handleHeartbeat(body);
      case 'initMasterList':
        return handleInitMasterList(body);
      case 'addName':
        return handleAddName(body);
      case 'setKid':
        return handleSetKid(body);
      case 'updateName':
        return handleUpdateName(body);
      case 'deleteName':
        return handleDeleteName(body);
      case 'bulkAdd':
        return handleBulkAdd(body);
      default:
        return textResponse('Unknown action: ' + action);
    }
  } catch (err) {
    return textResponse('Error: ' + err.message);
  }
}

function textResponse(msg) {
  return ContentService.createTextOutput(msg);
}

// ---- Attendance ----
function handleAttendance(body) {
  let sheet = SS.getSheetByName('Attendance');
  if (!sheet) {
    sheet = SS.insertSheet('Attendance');
    sheet.appendRow(['Date', 'Time', 'Chinese Name', 'English Name', 'Service', 'IsKid', 'IsNew', 'DeviceId', 'PersonId']);
  }
  sheet.appendRow([
    body.date || new Date().toISOString().slice(0, 10),
    body.time || new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'Asia/Taipei' }),
    body.chinese || '',
    body.english || '',
    body.service || '',
    body.isKid ? 'Y' : '',
    body.isNew ? 'Y' : '',
    body.deviceId || '',
    body.personId || ''
  ]);
  return textResponse('OK');
}

// ---- Audit ----
function handleAudit(body) {
  let sheet = SS.getSheetByName('Audit');
  if (!sheet) {
    sheet = SS.insertSheet('Audit');
    sheet.appendRow(['Timestamp', 'DeviceId', 'DeviceName', 'Action', 'Details']);
  }
  sheet.appendRow([
    body.timestamp || new Date().toISOString(),
    body.deviceId || '',
    body.deviceName || '',
    body.auditAction || '',
    body.details || ''
  ]);
  return textResponse('OK');
}

// ---- Heartbeat (device tracking) ----
function handleHeartbeat(body) {
  let sheet = SS.getSheetByName('Devices');
  if (!sheet) {
    sheet = SS.insertSheet('Devices');
    sheet.appendRow(['DeviceId', 'DeviceName', 'UserAgent', 'LastSeen', 'FirstSeen']);
  }
  const deviceId = body.deviceId || '';
  if (!deviceId) return textResponse('No deviceId');

  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === deviceId) {
      // Update existing device
      sheet.getRange(i + 1, 2).setValue(body.deviceName || data[i][1]);
      sheet.getRange(i + 1, 3).setValue(body.userAgent || data[i][2]);
      sheet.getRange(i + 1, 4).setValue(body.timestamp || new Date().toISOString());
      found = true;
      break;
    }
  }
  if (!found) {
    const now = body.timestamp || new Date().toISOString();
    sheet.appendRow([deviceId, body.deviceName || '', body.userAgent || '', now, now]);
  }
  return textResponse('OK');
}

// ---- Initialize Master List from Form Responses ----
function handleInitMasterList(body) {
  const formSheet = SS.getSheets()[0];
  const formData = formSheet.getDataRange().getValues();

  let masterSheet = SS.getSheetByName('Master List');
  if (!masterSheet) {
    masterSheet = SS.insertSheet('Master List');
    masterSheet.appendRow(['Chinese Name', 'English Name', 'Service', 'Group', 'Kid']);
  }

  const existing = new Set();
  const masterData = masterSheet.getDataRange().getValues();
  for (let i = 1; i < masterData.length; i++) {
    const key = (String(masterData[i][0] || '') + '|' + String(masterData[i][1] || '')).toLowerCase();
    existing.add(key);
  }

  let added = 0;
  for (let i = 1; i < formData.length; i++) {
    const cn = String(formData[i][1] || '').trim();
    const en = String(formData[i][2] || '').trim();
    if (!cn && !en) continue;
    const key = (cn + '|' + en).toLowerCase();
    if (existing.has(key)) continue;
    masterSheet.appendRow([cn, en, '', '', '']);
    existing.add(key);
    added++;
  }

  // Also add seed names from body if provided
  if (body.names && Array.isArray(body.names)) {
    for (const n of body.names) {
      const cn = String(n.chinese || '').trim();
      const en = String(n.english || '').trim();
      if (!cn && !en) continue;
      const key = (cn + '|' + en).toLowerCase();
      if (existing.has(key)) continue;
      masterSheet.appendRow([cn, en, n.service || '', n.group || '', '']);
      existing.add(key);
      added++;
    }
  }

  return textResponse('Added ' + added + ' names');
}

// ---- Add Name ----
function handleAddName(body) {
  let sheet = SS.getSheetByName('Master List');
  if (!sheet) {
    sheet = SS.insertSheet('Master List');
    sheet.appendRow(['Chinese Name', 'English Name', 'Service', 'Group', 'Kid']);
  }
  sheet.appendRow([
    body.chinese || '',
    body.english || '',
    body.service || '',
    body.group || '',
    body.kid ? 'Y' : ''
  ]);
  return textResponse('OK');
}

// ---- Set Kid Flag ----
function handleSetKid(body) {
  const sheet = SS.getSheetByName('Master List');
  if (!sheet) return textResponse('No Master List');
  const cn = (body.chinese || '').trim().toLowerCase();
  const en = (body.english || '').trim().toLowerCase();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowCn = String(data[i][0] || '').trim().toLowerCase();
    const rowEn = String(data[i][1] || '').trim().toLowerCase();
    if ((cn && rowCn === cn) || (en && rowEn === en)) {
      sheet.getRange(i + 1, 5).setValue(body.kid ? 'Y' : '');
      return textResponse('OK');
    }
  }
  return textResponse('Not found');
}

// ---- Update Name ----
function handleUpdateName(body) {
  const sheet = SS.getSheetByName('Master List');
  if (!sheet) return textResponse('No Master List');
  const oldCn = (body.oldChinese || '').trim().toLowerCase();
  const oldEn = (body.oldEnglish || '').trim().toLowerCase();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowCn = String(data[i][0] || '').trim().toLowerCase();
    const rowEn = String(data[i][1] || '').trim().toLowerCase();
    if ((oldCn && rowCn === oldCn) || (oldEn && rowEn === oldEn)) {
      if (body.chinese !== undefined) sheet.getRange(i + 1, 1).setValue(body.chinese);
      if (body.english !== undefined) sheet.getRange(i + 1, 2).setValue(body.english);
      if (body.service !== undefined) sheet.getRange(i + 1, 3).setValue(body.service);
      if (body.group !== undefined) sheet.getRange(i + 1, 4).setValue(body.group);
      if (body.kid !== undefined) sheet.getRange(i + 1, 5).setValue(body.kid ? 'Y' : '');
      return textResponse('OK');
    }
  }
  return textResponse('Not found');
}

// ---- Delete Name ----
function handleDeleteName(body) {
  const sheet = SS.getSheetByName('Master List');
  if (!sheet) return textResponse('No Master List');
  const cn = (body.chinese || '').trim().toLowerCase();
  const en = (body.english || '').trim().toLowerCase();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowCn = String(data[i][0] || '').trim().toLowerCase();
    const rowEn = String(data[i][1] || '').trim().toLowerCase();
    if ((cn && rowCn === cn) || (en && rowEn === en)) {
      sheet.deleteRow(i + 1);
      return textResponse('OK');
    }
  }
  return textResponse('Not found');
}

// ---- Bulk Add ----
function handleBulkAdd(body) {
  if (!body.names || !Array.isArray(body.names)) return textResponse('No names');
  let sheet = SS.getSheetByName('Master List');
  if (!sheet) {
    sheet = SS.insertSheet('Master List');
    sheet.appendRow(['Chinese Name', 'English Name', 'Service', 'Group', 'Kid']);
  }

  const existing = new Set();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const key = (String(data[i][0] || '') + '|' + String(data[i][1] || '')).toLowerCase();
    existing.add(key);
  }

  let added = 0;
  for (const n of body.names) {
    const cn = String(n.chinese || '').trim();
    const en = String(n.english || '').trim();
    if (!cn && !en) continue;
    const key = (cn + '|' + en).toLowerCase();
    if (existing.has(key)) continue;
    sheet.appendRow([cn, en, n.service || '', n.group || '', n.kid ? 'Y' : '']);
    existing.add(key);
    added++;
  }
  return textResponse('Added ' + added);
}
