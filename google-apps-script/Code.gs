const BOOKINGS_SHEET = "Bookings";
const CLICKS_SHEET = "WhatsAppClicks";
const SHARED_SECRET_PROPERTY = "APPS_SCRIPT_SHARED_SECRET";
const MAX_TEXT_LENGTH = 500;
const ALLOWED_APARTMENT_IDS = [
  "two-bedroom-1",
  "two-bedroom-2",
  "one-bedroom-1",
  "one-bedroom-2",
  "one-bedroom-3",
  "one-bedroom-4",
  "floating"
];
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

function doGet(e) {
  if (!isAuthorized_(e && e.parameter && e.parameter.token)) {
    return json_({ ok: false, error: "Unauthorized" });
  }

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
    if (!isAuthorized_(payload.token)) {
      return json_({ ok: false, error: "Unauthorized" });
    }
    if (payload.action !== "whatsappClick" || !isValidClick_(payload.click)) {
      return json_({ ok: false, error: "Invalid request" });
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

function setSharedSecret(value) {
  if (!value || String(value).length < 32) {
    throw new Error("Shared secret must be at least 32 characters.");
  }
  PropertiesService.getScriptProperties().setProperty(SHARED_SECRET_PROPERTY, String(value));
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

function isAuthorized_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty(SHARED_SECRET_PROPERTY);
  return Boolean(expected && token && String(token) === expected);
}

function isValidClick_(click) {
  return Boolean(
    click &&
      isShortText_(click.id) &&
      isIsoTimestamp_(click.clickedAt) &&
      isShortText_(click.pageUrl) &&
      isShortText_(click.suiteName) &&
      ALLOWED_APARTMENT_IDS.indexOf(String(click.apartmentId || "")) !== -1 &&
      isDateString_(click.checkIn || "") &&
      isDateString_(click.checkOut || "") &&
      isShortText_(String(click.guests || ""))
  );
}

function isShortText_(value) {
  return typeof value === "string" && value.length <= MAX_TEXT_LENGTH;
}

function isDateString_(value) {
  return value === "" || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isIsoTimestamp_(value) {
  return typeof value === "string" && !isNaN(new Date(value).getTime());
}
