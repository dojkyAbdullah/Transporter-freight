import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export async function appendRatesToSheet(rows) {
  if (!rows.length) return;

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A:H",
    valueInputOption: "RAW",
    requestBody: {
      values: rows.map((r) => [
        r.transporter_name,
        r.origin_city,
        r.destination_city,
        r.vehicle_type,
        r.weight_tons,
        r.rate_pkr,
        r.availability_date,
        r.remarks,
      ]),
    },
  });
}
