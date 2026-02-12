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

async function findExistingRows(request_id, transporter_id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A:N",
  });

  const rows = res.data.values || [];
  const matchingRows = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === request_id && rows[i][7] === transporter_id) {
      matchingRows.push(i + 1); // actual sheet row number
    }
  }

  return matchingRows;
}

export async function appendRatesToSheet(rows) {
  if (!rows?.length) return;

  for (const r of rows) {
    const existingRows = await findExistingRows(
      r.request_id,
      r.transporter_id
    );

    // 🔁 If previous rows exist → mark them OLD RATE
    for (const rowNumber of existingRows) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Sheet1!M${rowNumber}`, // rate_status column
        valueInputOption: "RAW",
        requestBody: {
          values: [["OLD RATE"]],
        },
      });
    }

    // ✅ Append new FINAL RATE row
    const values = [[
      r.request_id,
      r.company_id,
      r.movement_type,
      r.lane,
      r.commodity,
      r.vehicle_type,
      r.weight,
      r.transporter_id,
      r.transporter_name,
      r.rate_pkr,
      r.availability_date,
      r.remarks,
      "FINAL RATE",
      r.updated_at,
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:N",
      valueInputOption: "RAW",
      requestBody: { values },
    });
  }
}
