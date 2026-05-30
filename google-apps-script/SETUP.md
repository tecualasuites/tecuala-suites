# Tecuala Suites Google Sheets Setup

1. Create a blank Google Sheet named `Tecuala Suites Reservations`.
2. Open `Extensions > Apps Script`.
3. Replace the editor contents with `Code.gs`.
4. Save and run `setupTecualaSuitesSheet` once.
5. Deploy as a web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Copy the deployed `/exec` URL.
7. Paste that URL into `SHARED_BOOKINGS_URL` near the top of `src/main.jsx`.

The public website receives only suite IDs, dates, blocked units, and status.
Guest names and deposits remain private in the spreadsheet.

Running `setupTecualaSuitesSheet` adds a dropdown to the `status` column with:

- `Pending`
- `Confirmed`
- `Paid`
- `Cancelled`

Use these simple values in the `apartmentId` column:

| Suite | apartmentId |
| --- | --- |
| Suite A | `A` |
| Suite B | `B` |
| Suite C | `C` |
| Suite D | `D` |
| Suite E | `E` |
| Suite F | `F` |
