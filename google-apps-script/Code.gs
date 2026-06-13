const BOOKINGS_SHEET = "Bookings";
const CLICKS_SHEET = "WhatsAppClicks";
const HEADERS = [
  "id",
  "apartmentId",
  "checkIn",
  "checkOut",
  "units",
  "source",
  "guestName",
  "deposit",
  "status"
];
const CLICK_HEADERS = [
  "id",
  "clickedAt",
  "pageUrl",
  "suiteName",
  "apartmentId",
  "checkIn",
  "checkOut",
  "guests"
];

function doGet() {
  const sheet = getBookingsSheet_();
  const rows = sheet.getDataRange().getValues();
  const clickSheet = getClicksSheet_();
  const clickRows = clickSheet.getDataRange().getValues();
  const bookings = rows.slice(1)
    .filter((row) => row[0] && row[1] && row[2] && row[3])
    .map((row) => ({
      id: String(row[0]),
      apartmentId: String(row[1]),
      checkIn: toDateString_(row[2]),
      checkOut: toDateString_(row[3]),
      units: Number(row[4]) || 1,
      status: String(row[8] || "Confirmed")
    }))
    .filter((booking) => booking.status !== "Cancelled");
  const whatsappClicks = clickRows.slice(1)
    .filter((row) => row[0] && row[1])
    .slice(-25)
    .reverse()
    .map((row) => ({
      id: String(row[0]),
      clickedAt: toIsoString_(row[1]),
      pageUrl: String(row[2] || ""),
      suiteName: String(row[3] || ""),
      apartmentId: String(row[4] || ""),
      checkIn: toDateString_(row[5]),
      checkOut: toDateString_(row[6]),
      guests: String(row[7] || "")
    }));

  return ContentService
    .createTextOutput(JSON.stringify({
      updatedAt: new Date().toISOString(),
      bookings,
      whatsappClickCount: Math.max(clickRows.length - 1, 0),
      whatsappClicks
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
    if (payload.action !== "whatsappClick" || !payload.click) {
      return json_({ ok: false, error: "Unknown action" });
    }

    const click = payload.click;
    getClicksSheet_().appendRow([
      String(click.id || Utilities.getUuid()),
      click.clickedAt ? new Date(click.clickedAt) : new Date(),
      String(click.pageUrl || ""),
      String(click.suiteName || ""),
      String(click.apartmentId || ""),
      String(click.checkIn || ""),
      String(click.checkOut || ""),
      String(click.guests || "")
    ]);

    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function setupTecualaSuitesSheet() {
  getBookingsSheet_();
  getClicksSheet_();
}

function getBookingsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(BOOKINGS_SHEET);

  if (!sheet) sheet = spreadsheet.insertSheet(BOOKINGS_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Pending", "Confirmed", "Paid", "Cancelled"], true)
    .setAllowInvalid(false)
    .setHelpText("Choose Pending, Confirmed, Paid, or Cancelled.")
    .build();
  sheet.getRange("I2:I").setDataValidation(statusRule);

  return sheet;
}

function getClicksSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CLICKS_SHEET);

  if (!sheet) sheet = spreadsheet.insertSheet(CLICKS_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CLICK_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CLICK_HEADERS.length).setFontWeight("bold");
  }

  return sheet;
}

function toDateString_(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(value);
}

function toIsoString_(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value || "");
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
