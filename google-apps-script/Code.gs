const BOOKINGS_SHEET = "Bookings";
const CLICKS_SHEET = "WhatsAppClicks";
const MAINTENANCE_SHEET = "Maintenance";
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
  "status",
  "nightlyRate",
  "totalAmount",
  "notes"
];
const MAINTENANCE_HEADERS = ["id", "apartmentId", "date", "category", "description", "status", "cost", "notes"];
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
    if (!isAuthorized_(payload.token)) return json_({ ok: false, error: "Unauthorized" });
    if (payload.action === "getSchema") return schemaResponse_();
    if (payload.action === "readBusinessData") return readBusinessData_();
    if (payload.action === "appendColumns") return appendColumns_(payload);
    if (payload.action === "whatsappClick" && isValidClick_(payload.click)) {
      const click = payload.click;
      getClicksSheet_().appendRow([String(click.id || Utilities.getUuid()), click.clickedAt ? new Date(click.clickedAt) : new Date(), String(click.pageUrl || ""), String(click.suiteName || ""), String(click.apartmentId || ""), String(click.checkIn || ""), String(click.checkOut || ""), String(click.guests || "")]);
      return json_({ ok: true });
    }
    if (payload.action === "createReservation" && isValidReservation_(payload.reservation)) return createReservation_(payload.reservation);
    return json_({ ok: false, error: "Invalid request" });
  } catch (error) { return json_({ ok: false, error: String(error) }); }
}

function sheetHeaders_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map((value) => String(value || "").trim());
}

function schemaResponse_() {
  return json_({ ok: true, updatedAt: new Date().toISOString(), headers: { Bookings: sheetHeaders_(BOOKINGS_SHEET), Maintenance: sheetHeaders_(MAINTENANCE_SHEET) } });
}

function rowsAsObjects_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() === 0) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map((value) => String(value || "").trim());
  return values.slice(1).filter((row) => row.some((value) => value !== "")).map((row) => {
    const result = {};
    headers.forEach((header, index) => {
      if (!header) return;
      const value = row[index];
      if (value instanceof Date) result[header] = /date|checkin|checkout/i.test(header) ? toDateString_(value) : toIsoString_(value);
      else result[header] = value === undefined ? "" : value;
    });
    if (result.apartmentId) result.apartmentId = normalizeApartmentId_(result.apartmentId);
    return result;
  });
}

function readBusinessData_() {
  return json_({ ok: true, updatedAt: new Date().toISOString(), headers: { Bookings: sheetHeaders_(BOOKINGS_SHEET), Maintenance: sheetHeaders_(MAINTENANCE_SHEET) }, reservations: rowsAsObjects_(BOOKINGS_SHEET), maintenance: rowsAsObjects_(MAINTENANCE_SHEET) });
}

function appendColumns_(payload) {
  const sheetName = payload.sheet === BOOKINGS_SHEET || payload.sheet === MAINTENANCE_SHEET ? payload.sheet : "";
  const columns = Array.isArray(payload.columns) ? payload.columns : [];
  const expectedHeaders = Array.isArray(payload.expectedHeaders) ? payload.expectedHeaders.map(String) : [];
  if (!sheetName || !columns.length || columns.length > 20 || !isShortText_(String(payload.idempotencyKey || ""))) return json_({ ok: false, error: "Invalid append-only schema request." });
  const normalizedColumns = columns.map((column) => ({ name: String(column && column.name || "").trim(), purpose: String(column && column.purpose || "").trim() }));
  if (normalizedColumns.some((column) => !/^[A-Za-z][A-Za-z0-9 _-]{0,63}$/.test(column.name) || !column.purpose || column.purpose.length > MAX_TEXT_LENGTH || /^[=+\-@]/.test(column.name))) return json_({ ok: false, error: "Every column needs a safe name and purpose." });
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      if (sheetName !== MAINTENANCE_SHEET || expectedHeaders.length) return json_({ ok: false, error: "Sheet state changed. Review current schema and propose again." });
      sheet = spreadsheet.insertSheet(MAINTENANCE_SHEET);
      sheet.appendRow(MAINTENANCE_HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, MAINTENANCE_HEADERS.length).setFontWeight("bold");
    }
    const current = sheetHeaders_(sheetName);
    if (current.join("\u001f") !== expectedHeaders.join("\u001f") && !(sheetName === MAINTENANCE_SHEET && expectedHeaders.length === 0 && current.join("\u001f") === MAINTENANCE_HEADERS.join("\u001f"))) return json_({ ok: false, error: "Sheet headers changed after approval. Review the latest headers and confirm a new proposal." });
    const existing = {};
    current.forEach((header) => existing[header.toLowerCase()] = true);
    const added = []; const skipped = [];
    normalizedColumns.forEach((column) => {
      if (existing[column.name.toLowerCase()]) { skipped.push(column.name); return; }
      const nextColumn = sheet.getLastColumn() + 1;
      sheet.getRange(1, nextColumn).setValue(column.name).setFontWeight("bold").setNote(column.purpose);
      existing[column.name.toLowerCase()] = true; added.push(column.name);
    });
    return json_({ ok: true, duplicate: added.length === 0, added, skipped, headers: sheetHeaders_(sheetName), idempotencyKey: String(payload.idempotencyKey) });
  } finally { lock.releaseLock(); }
}
function normalizeApartmentId_(value) {
  const raw = String(value || "").trim();
  const legacy = { A: "two-bedroom-1", B: "two-bedroom-2", C: "one-bedroom-1", D: "one-bedroom-2", E: "one-bedroom-3", F: "one-bedroom-4" };
  return legacy[raw.toUpperCase()] || raw;
}

function createReservation_(reservation) {
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getBookingsSheet_(); const rows = sheet.getDataRange().getValues().slice(1); const reservationId = String(reservation.id || Utilities.getUuid());
    const existing = rows.find((row) => String(row[0]) === reservationId);
    if (existing) return json_({ ok: true, duplicate: true, reservation: bookingRow_(existing) });
    const conflict = rows.find((row) => String(row[8] || "Confirmed").toLowerCase() !== "cancelled" && normalizeApartmentId_(row[1]) === normalizeApartmentId_(reservation.apartmentId) && toDateString_(row[2]) < reservation.checkOut && toDateString_(row[3]) > reservation.checkIn);
    if (conflict) return json_({ ok: false, error: "Suite is no longer available for those dates.", conflict: bookingRow_(conflict) });
    const row = [reservationId, normalizeApartmentId_(reservation.apartmentId), String(reservation.checkIn), String(reservation.checkOut), 1, String(reservation.source || "Lizzy"), String(reservation.guestName), optionalAmount_(reservation.deposit), String(reservation.status || "Confirmed"), optionalAmount_(reservation.nightlyRate), optionalAmount_(reservation.totalAmount), String(reservation.notes || "")];
    sheet.appendRow(row); return json_({ ok: true, duplicate: false, reservation: bookingRow_(row) });
  } finally { lock.releaseLock(); }
}

function bookingRow_(row) { return { id: String(row[0] || ""), apartmentId: normalizeApartmentId_(row[1]), checkIn: toDateString_(row[2]), checkOut: toDateString_(row[3]), status: String(row[8] || "Confirmed"), nightlyRate: row[9] === "" ? null : Number(row[9]), totalAmount: row[10] === "" ? null : Number(row[10]) }; }
function optionalAmount_(value) { return value === null || value === undefined || value === "" ? "" : Number(value); }
function isValidReservation_(reservation) {
  if (!reservation || ALLOWED_APARTMENT_IDS.indexOf(normalizeApartmentId_(reservation.apartmentId)) < 0 || normalizeApartmentId_(reservation.apartmentId) === "floating") return false;
  if (!isDateString_(reservation.checkIn) || !isDateString_(reservation.checkOut) || !reservation.checkIn || !reservation.checkOut || reservation.checkIn >= reservation.checkOut) return false;
  if (!isShortText_(String(reservation.id || "")) || !isShortText_(String(reservation.guestName || "")) || !String(reservation.guestName || "").trim()) return false;
  if (!isShortText_(String(reservation.source || "")) || !isShortText_(String(reservation.notes || ""))) return false;
  return [reservation.deposit, reservation.nightlyRate, reservation.totalAmount].every((value) => value === null || value === undefined || value === "" || (isFinite(Number(value)) && Number(value) >= 0));
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

  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getValues()[0];
  HEADERS.forEach((header, index) => {
    if (!currentHeaders[index]) sheet.getRange(1, index + 1).setValue(header).setFontWeight("bold");
  });

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
