# Thrive Name Tag Printer — Setup Guide

## Hosting (Free Options)

### Option 1: GitHub Pages (Recommended)
1. Create a free GitHub account at github.com
2. Create a new repository (e.g., `thrive-nametags`)
3. Upload `index.html` to the repository
4. Go to **Settings > Pages** > Source: **main branch** > Save
5. Your app will be live at: `https://yourusername.github.io/thrive-nametags/`

### Option 2: Netlify (Drag & Drop)
1. Go to https://app.netlify.com/drop
2. Drag the `nametag-printer` folder onto the page
3. Your app is instantly live with a random URL
4. Optionally set a custom subdomain (e.g., `thrive-nametags.netlify.app`)

### Option 3: Cloudflare Pages
1. Sign up at https://pages.cloudflare.com
2. Connect your GitHub repo or do direct upload
3. Free, fast, global CDN

All options are 100% free for static sites.

---

## Attendance Sync to Google Sheets (Optional)

1. Open your [Google Sheet](https://docs.google.com/spreadsheets/d/1emTIXAFHBae-r6Zo3W48I_PBSMuPjC25dPnmNptz-bg/edit)
2. Go to **Extensions > Apps Script**
3. Delete any existing code, paste this:

```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Attendance');
  if (!sheet) {
    sheet = ss.insertSheet('Attendance');
    sheet.appendRow(['Date', 'Time', 'Chinese Name', 'English Name']);
    sheet.getRange('1:1').setFontWeight('bold');
  }
  sheet.appendRow([data.date, data.time, data.chinese || '', data.english || '']);
  return ContentService.createTextOutput(JSON.stringify({status:'ok'}))
    .setMimeType(ContentService.MimeType.JSON);.
}

function doGet(e) {
  return ContentService.createTextOutput('Attendance script is running.');
}
```

4. Click **Deploy > New deployment**
5. Type: **Web app**, Execute as: **Me**, Access: **Anyone**
6. Click **Deploy**, authorize, copy the URL
7. In the app, go to **Settings** (gear icon) and paste the URL

---

## Printer Setup

### Nelko PL70e via Web Bluetooth
- **Android**: Use **Chrome** browser — Web Bluetooth works natively
- **iPad**: Use [**Bluefy**](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055) browser (Safari does not support Web Bluetooth)
- Pair the Nelko PL70e via Bluetooth in your device settings first
- In the app, tap **Connect Printer** and select your Nelko from the list
- The app auto-detects the correct BLE service/characteristic

### If BLE Connection Fails
1. Go to **Settings > BLE Debug: Scan for Services**
2. Select your printer and note the service UUID with a writable characteristic
3. Paste that UUID in the **BLE Service UUID** field and save

### Fallback Print Methods
- **Browser Print**: Uses the system print dialog (works if printer appears as a system printer)
- **Share**: Generates a PNG image you can share to the Nelko app

---

## How to Use

1. Open the app on your tablet/phone
2. Tap **Connect Printer** to pair with the Nelko
3. Search for a name (Chinese or English)
4. Tap the name card
5. Tap **BLE Print** to print directly
6. The person is automatically logged as checked in
7. View attendance by tapping the "X checked in" badge

### Adding Walk-Ins
Tap the **+** button to create a name tag for someone not in the database.
