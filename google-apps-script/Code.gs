const BOOKINGS_SHEET = "Bookings";
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

function doGet() {
  const sheet = getBookingsSheet_();
  const rows = sheet.getDataRange().getValues();
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

  return ContentService
    .createTextOutput(JSON.stringify({
      updatedAt: new Date().toISOString(),
      bookings
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupTecualaSuitesSheet() {
  getBookingsSheet_();
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

function toDateString_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(value);
}
