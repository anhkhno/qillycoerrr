/* ============================================================
   qillycoer masterlist — admin backend
   Paste this whole file into script.google.com (see README step 5).
   This is the ONLY place the admin login codes live — never put
   them in config.js / admin.js, since those are public.
   ============================================================ */

var SHEET_ID = "1Gc6oy0_d6dE7_SWtb3d6Sl93jRinKYnPKa23swH6QTM";

// Add one entry per admin: "telegram username" (lowercase, no @): "code"
var ADMINS = {
  "anhkhno": "060307",
};

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ ok: false, error: "Bad request." });
  }

  var username = String(body.username || "").toLowerCase().replace(/^@/, "").trim();
  var code = String(body.code || "").trim();

  if (!ADMINS[username] || ADMINS[username] !== code) {
    return jsonOut({ ok: false, error: "Invalid Telegram username or code." });
  }

  if (body.action === "verify") {
    return jsonOut({ ok: true });
  }

  if (body.action === "addOrder") {
    return addOrder(body.tab, body.order || {});
  }

  return jsonOut({ ok: false, error: "Unknown action." });
}

function addOrder(tabName, order) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return jsonOut({ ok: false, error: "No tab named \"" + tabName + "\"." });

  var lastRow = findLastDataRow(sheet);
  var row = [
    order.code || "",
    order.item || "",
    order.telegram ? "@" + String(order.telegram).replace(/^@/, "") : "",
    order.price || "",
    order.payment || "",
    order.status || "",
  ];
  sheet.getRange(lastRow + 1, 2, 1, 6).setValues([row]); // columns B–G

  return jsonOut({ ok: true });
}

// Finds the last row that actually has a Telegram username in column D,
// so new rows land right after your real data instead of far below
// leftover formatting/empty rows.
function findLastDataRow(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return 1;
  var colD = sheet.getRange(1, 4, lastRow, 1).getValues();
  for (var i = colD.length - 1; i >= 0; i--) {
    if (String(colD[i][0]).trim() !== "") return i + 1; // 1-indexed
  }
  return 2;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
