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
          const name = data.name || data.Name || data.fullName || data['Full Name'];
          const email = data.email || data.Email || '';
          if (name?.trim()) names.push({ name: name.trim(), email: email.trim() });
        })
        .on('end', resolve)
        .on('error', reject);
    });
  } else if (ext === 'txt') {
    names = fs.readFileSync(file.path, 'utf8')
      .split('\n')
      .map(line => ({ name: line.trim(), email: "" }))
      .filter(e => e.name);
  } else if (ext === 'json') {
    const json = JSON.parse(fs.readFileSync(file.path, 'utf8'));
    if (Array.isArray(json)) {
      names = json.map(item => {
        if (typeof item === 'string') return { name: item.trim(), email: "" };
        if (typeof item === 'object') return { name: item.name?.trim(), email: item.email?.trim() || "" };
        return null;
      }).filter(Boolean);
    } else if (json.names && Array.isArray(json.names)) {
      names = json.names.map(n => ({ name: n.trim(), email: "" }));
    }
  } else if (['xls', 'xlsx', 'ods'].includes(ext)) {
    const workbook = xlsx.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    names = rows.map(row => {
      const keys = Object.keys(row);
      const name = row.name || row.Name || row[keys[0]];
      const email = row.email || row.Email || row[keys[1]] || '';
      return name?.trim() ? { name: name.trim(), email: email.trim() } : null;
    }).filter(Boolean);
  } else {
    throw new Error('Unsupported file format');
  }

  if (!names.length) {
    console.error('No valid names found in file:', file.originalname);
  }

  return names;
}

module.exports = { extractNames };
