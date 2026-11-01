import * as SQLite from "expo-sqlite";

export const database = SQLite.openDatabase("dictionary.db");

function execute(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.transaction(
      (tx) => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      },
      (error) => reject(error)
    );
  });
}

const WORD_COLUMNS = [
  "word",
  "phonetics",
  "audio",
  "partOfSpeech",
  "meaning",
  "sourceUrl",
  "image",
  "status",
  "dateForgets",
  "dateTotallyForgets",
  "forgettingSpan",
];

function wordToParams(word) {
  return WORD_COLUMNS.map((column) =>
    word[column] === undefined ? null : word[column]
  );
}

export function init() {
  return execute(
    `CREATE TABLE IF NOT EXISTS words (
      word TEXT PRIMARY KEY NOT NULL,
      phonetics TEXT,
      audio TEXT,
      partOfSpeech TEXT,
      meaning TEXT,
      sourceUrl TEXT,
      image TEXT,
      status INTEGER NOT NULL DEFAULT 0,
      dateForgets INTEGER NOT NULL DEFAULT 0,
      dateTotallyForgets INTEGER NOT NULL DEFAULT 0,
      forgettingSpan INTEGER NOT NULL DEFAULT 0
    )`
  ).then(() =>
    execute(
      `CREATE TABLE IF NOT EXISTS theme (
        id INTEGER PRIMARY KEY NOT NULL,
        isDark INTEGER NOT NULL
      )`
    )
  );
}

export function addWord(word) {
  return execute(
    `INSERT OR REPLACE INTO words (${WORD_COLUMNS.join(", ")})
     VALUES (${WORD_COLUMNS.map(() => "?").join(", ")})`,
    wordToParams(word)
  );
}

export function updateWord(word) {
  const columns = WORD_COLUMNS.filter((column) => column !== "word");
  const params = wordToParams(word);
  params.shift();
  return execute(
    `UPDATE words SET ${columns.map((column) => `${column} = ?`).join(", ")}
     WHERE word = ?`,
    [...params, word.word]
  );
}

export function deleteWord(wordText) {
  return execute("DELETE FROM words WHERE word = ?", [wordText]);
}

export function getWords() {
  return execute("SELECT * FROM words").then((result) => {
    const words = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      const word = {};
      for (const column of WORD_COLUMNS) {
        if (row[column] !== null || column === "image") {
          word[column] = row[column];
        }
      }
      words.push(word);
    }
    return words;
  });
}

export function getTheme() {
  return execute("SELECT isDark FROM theme WHERE id = 1").then((result) => {
    if (result.rows.length === 0) return true;
    return result.rows.item(0).isDark === 1;
  });
}

export function setTheme(isDark) {
  return execute("INSERT OR REPLACE INTO theme (id, isDark) VALUES (1, ?)", [
    isDark ? 1 : 0,
  ]);
}
