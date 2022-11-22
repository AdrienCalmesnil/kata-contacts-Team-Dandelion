const sqlite3 = require("sqlite3");
const open = require("sqlite").open;
const fs = require("fs");
const process = require("process");

const filename = "contacts.sqlite3";
const numContacts = parseInt(process.argv[2]); //read from process.argv

const shouldMigrate = !fs.existsSync(filename);

/**
 * Generate `numContacts` contacts,
 * one at a time
 *
 */

function* generateContacts(numContacts) {
  let i = 1;

  while (i <= numContacts) {
    yield [`name-${i}`, `email-${i}@domain.tld`];
    i++;
  }
}

const migrate = async (db) => {
  console.log("Migrating db ...");
  await db.exec(`
        CREATE TABLE contacts(
          name TEXT NOT NULL,
          email TEXT NOT NULL
         )
     `);
  console.log("Done migrating db");
};

const insertContacts = async (db) => {
  console.log("Inserting contacts ...");
  const e = numContacts;
  const generator = generateContacts(e);
  let i = 0;
  while (i <= numContacts) {
    const eachContact = generator.next().value;
    const query = `INSERT INTO contacts (name, email) VALUES (?,?)`;
    await db.run(query, eachContact, (err, rows) => {
      if (err) throw err;
      console.log("Row inserted with id = " + rows.insertId);
    });
    i++;
  }
};

const queryContact = async (db) => {
  const start = Date.now();
  const res = await db.get("SELECT name FROM contacts WHERE email = ?", [
    `email-${numContacts}@domain.tld`,
  ]);
  if (!res || !res.name) {
    console.error("Contact not found");
    process.exit(1);
  }
  const end = Date.now();
  const elapsed = (end - start) / 1000;
  console.log(`Query took ${elapsed} seconds`);
};

(async () => {
  const db = await open({
    filename,
    driver: sqlite3.Database,
  });
  if (shouldMigrate) {
    await migrate(db);
  }
  await insertContacts(db);
  await queryContact(db);
  await db.close();
})();
