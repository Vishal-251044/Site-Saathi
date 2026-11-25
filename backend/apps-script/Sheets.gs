/**
 * SITE SAATHI API · Sheets.gs
 * Small helpers to read and write the content tables as lists of objects.
 * Tables are small (a few hundred rows), so a whole table is rewritten on save; Router.gs holds a lock.
 */

function spreadsheet_() {
  const id = getProp_('SHEET_ID', false);
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Setup missing: bind this script to the "SITE SAATHI Content" sheet or set SHEET_ID.');
  return ss;
}

function sheet_(name) {
  const sh = spreadsheet_().getSheetByName(name);
  if (!sh) throw new Error('Missing tab "' + name + '". Run setupSheets() once from the script editor.');
  return sh;
}

/** All rows of a tab as objects keyed by the header row. Empty rows are skipped. */
function readTable_(name) {
  const values = sheet_(name).getDataRange().getValues();
  if (values.length < 2) return [];
  const head = values[0].map(String);
  return values.slice(1)
    .filter(function (r) { return r.some(function (c) { return c !== '' && c !== null; }); })
    .map(function (r) { const o = {}; head.forEach(function (h, i) { o[h] = r[i] === undefined || r[i] === null ? '' : r[i]; }); return o; });
}

/** Replace a whole tab with these rows (columns from SCHEMA). */
function writeTable_(name, rows) {
  const cols = SCHEMA[name];
  const sh = sheet_(name);
  // A leading apostrophe keeps typed text like "=..." as text, never a formula.
  const cell = function (v) { return v === undefined || v === null ? '' : (typeof v === 'string' && v.charAt(0) === '=' ? "'" + v : v); };
  const data = [cols].concat(rows.map(function (r) { return cols.map(function (c) { return cell(r[c]); }); }));
  sh.clearContents();
  sh.getRange(1, 1, data.length, cols.length).setValues(data);
}

const same_ = function (a, b) { return String(a).trim() === String(b).trim(); };

/** Insert or update one row, matched on the key columns. Returns the saved row. */
function upsert_(name, keyCols, obj) {
  const rows = readTable_(name);
  const i = rows.findIndex(function (r) { return keyCols.every(function (k) { return same_(r[k], obj[k]); }); });
  const row = i >= 0 ? Object.assign(rows[i], obj) : Object.assign({}, obj);
  if (i >= 0) rows[i] = row; else rows.push(row);
  writeTable_(name, rows);
  return row;
}

function appendRow_(name, obj) {
  sheet_(name).appendRow(SCHEMA[name].map(function (c) { return obj[c] === undefined ? '' : obj[c]; }));
}

function findRow_(name, pred) { return readTable_(name).filter(pred)[0] || null; }
