import { google } from "googleapis";

async function findExistingRow(request_id, transporter_id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A:H",
  });

  const rows = res.data.values || [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === request_id && rows[i][7] === transporter_id) {
      return i + 1; // sheet row number (1-based)
    }
  }

  return null;
}

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export async function appendRatesToSheet(rows) {
  if (!rows?.length) return;

  for (const r of rows) {
    const existingRow = await findExistingRow(
      r.request_id,
      r.transporter_id
    );

    const values = [[
      r.request_id,        // A
      r.company_id,        // B
      r.movement_type,     // C
      r.lane,              // D
      r.commodity,         // E
      r.vehicle_type,      // F
      r.weight,            // G
      r.transporter_id,    // H
      r.transporter_name,  // I
      r.rate_pkr,          // J
      r.availability_date, // K
      r.remarks,           // L
      r.updated_at,        // M
    ]];

    if (existingRow) {
      // UPDATE
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Sheet1!A${existingRow}:M${existingRow}`,
        valueInputOption: "RAW",
        requestBody: { values },
      });
    } else {
      // APPEND
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!A:M",
        valueInputOption: "RAW",
        requestBody: { values },
      });
    }
  }
}
