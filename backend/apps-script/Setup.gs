/**
 * SITE SAATHI API · Setup.gs
 * Run setupSheets() once from the script editor: creates any missing tab with its header row.
 * It never deletes or changes existing data. Safe to run again.
 */
function setupSheets() {
  const ss = spreadsheet_();
  const made = [];
  Object.keys(SCHEMA).forEach(function (name) {
    let sh = ss.getSheetByName(name);
    if (!sh) { sh = ss.insertSheet(name); made.push(name); }
    if (sh.getLastRow() === 0) { sh.appendRow(SCHEMA[name]); sh.setFrozenRows(1); }
  });
  if (readTable_('manifest').length === 0) writeTable_('manifest', [{ content_version: 0, published_on: '', lessons_count: 0 }]);
  Logger.log(made.length ? 'Created tabs: ' + made.join(', ') : 'All tabs already exist.');
  return made;
}

/** Quick self-check you can run from the editor after setup (no data changes). */
function checkSetup() {
  const miss = ['PEPPER', 'TOKEN_SECRET'].filter(function (k) { return !getProp_(k, false); });
  const media = getProp_('CLOUDINARY_API_SECRET', false) ? 'Cloudinary' : (getProp_('DRIVE_FOLDER_ID', false) ? 'Google Drive (backup)' : 'NOT SET (Admin Mode -> Server keys)');
  const team = readTable_('team').length;
  Logger.log('Secrets: ' + (miss.length ? 'made at first use (' + miss.join(', ') + ')' : 'ok') + ' · media storage: ' + media +
    ' · team members: ' + team + (team ? '' : ' -> open the app, Admin Mode, First setup (code in tab "setup")'));
}
