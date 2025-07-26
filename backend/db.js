const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./bank.db');

const initDb = () => {
  const schema = fs.readFileSync('./schema.sql', 'utf-8');
  db.exec(schema, (err) => {
    if (err) console.error('Error initializing DB', err);
    else console.log('✅ Database initialized');
  });
};

module.exports = { db, initDb };
