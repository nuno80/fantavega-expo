// scripts/check-excel.ts
// Check column names in Excel file

import * as path from "path";
import * as XLSX from "xlsx";

const excelPath = path.resolve(__dirname, "../../Quotazioni_Fantacalcio_Stagione_2025_26 (1).xlsx");
console.log("📖 Reading Excel file:", excelPath);

const workbook = XLSX.readFile(excelPath);
console.log("📊 Sheets:", workbook.SheetNames);

const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

console.log("📊 Total rows:", rows.length);
console.log("\n📋 First row (column names):");
if (rows[0]) {
  console.log(JSON.stringify(rows[0], null, 2));
}

console.log("\n📋 Sample rows (first 3):");
rows.slice(0, 3).forEach((row, i) => {
  console.log(`\nRow ${i}:`, JSON.stringify(row, null, 2));
});
