const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const path = require('path');

async function extractNames(file) {
  const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
  let names = [];

  if (ext === 'csv') {
    await new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', data => {
          if (data.name) names.push({ name: data.name, email: data.email });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    return names;
  } else if (ext === 'txt') {
    names = fs.readFileSync(file.path, 'utf8')
      .split('\n')
      .map(line => ({ name: line.trim(), email: "" }))
      .filter(e => e.name.length > 0);
    return names;
  } else if (ext === 'json') {
    const json = JSON.parse(fs.readFileSync(file.path, 'utf8'));
    if (Array.isArray(json)) {
      if (typeof json[0] === "string") return json.map(n => ({ name: n, email: "" }));
      if (typeof json[0] === "object") return json.map(e => ({ name: e.name, email: e.email || "" }));
    } else if (json.names && Array.isArray(json.names)) {
      return json.names.map(n => ({ name: n, email: "" }));
    }
    return [];
  } else if (['xls', 'xlsx', 'ods'].includes(ext)) {
    const workbook = xlsx.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    return rows.map(row => ({ name: row.name || row[0], email: row.email || "" })).filter(e => e.name);
  } else {
    throw new Error('Unsupported file format');
  }
}

module.exports = { extractNames };