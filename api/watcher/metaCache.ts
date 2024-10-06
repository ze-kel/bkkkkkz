import Database from '@tauri-apps/plugin-sql';
import type { IWatcherModule } from './watcherCore';
import type { IBookData } from '../books';
import { apiEventsEmitter } from '~/api/events';
import * as path from '@tauri-apps/api/path';

let db: Database | null = null;
const getDb = async () => {
  if (!db) {
    db = await Database.load('sqlite:test.db');
  }

  console.log('awa', await path.appDataDir(), await path.join(''));

  return db;
};

const initDatabase = async () => {
  const db = await getDb();
  await db.execute('DROP TABLE IF EXISTS tags');
  await db.execute('DROP TABLE IF EXISTS files');
  await db.execute('DROP TABLE IF EXISTS read');
  await db.execute(
    'CREATE TABLE files (path TEXT PRIMARY KEY, title TEXT, author TEXT, year INTEGER, myRating INTEGER, cover TEXT, isbn13 INTEGER);',
  );
  await db.execute(
    'CREATE TABLE tags (id INTEGER PRIMARY KEY, path TEXT, tag TEXT, FOREIGN KEY (path) REFERENCES files (path) ON DELETE CASCADE)',
  );
  await db.execute(
    'CREATE TABLE read (id INTEGER PRIMARY KEY, path TEXT, started TEXT, finished TEXT, FOREIGN KEY (path) REFERENCES files (path) ON DELETE CASCADE)',
  );
};

const wrapOrNull = (v?: string) => (v?.length ? `"${v}"` : 'NULL');

const addFileToDb = async (path: string, file: IBookData) => {
  console.log('add', path, file);
  const db = await getDb();

  await db.execute(
    `INSERT INTO files(path, title, author, year, myRating, cover, isbn13)
VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT(path) DO UPDATE SET
    title=excluded.title, author=excluded.author, year=excluded.year, myRating=excluded.myRating, cover=excluded.cover, isbn13=excluded.isbn13
  `,
    [path, file.title, file.author, file.year, file.myRating, file.cover, file.isbn13],
  );

  await db.execute('DELETE FROM tags WHERE path=$1 AND tag NOT IN ($2)', [path, file.tags || []]);

  if (file.tags?.length) {
    const pairs = file.tags.map((v) => `("${path}","${v}")`);

    await db.execute(`INSERT INTO tags(path, tag) VALUES ${pairs.join(',')}`);
  }

  const readPairs = file.read?.map(
    (v) => `(started = ${wrapOrNull(v.started)} AND finished = ${wrapOrNull(v.finished)})`,
  );

  if (readPairs?.length) {
    await db.execute(`DELETE FROM read WHERE path=$1 AND NOT (${readPairs?.join(' OR ')})`, [path]);
  } else {
    await db.execute(`DELETE FROM read WHERE path=$1`, [path]);
  }

  if (file.read?.length) {
    const vals = file.read.map(
      (v) => `("${path}",${wrapOrNull(v.started)},${wrapOrNull(v.finished)})`,
    );
    await db.execute(`INSERT INTO read(path, started, finished) VALUES ${vals.join(',')}`);
  }
};

const removeFileFromDb = async (path: string) => {
  const db = await getDb();
  await db.execute(`DELETE FROM files WHERE path=$1`, [path]);
};

export const MetaCache: IWatcherModule = {
  async initialize() {
    await initDatabase();
  },
  async initialFile(files) {
    await Promise.all(
      Object.entries(files).map(async (f) => await addFileToDb(f[0], f[1] as IBookData)),
    );
  },
  async addFile(file, path) {
    console.log('add file', path);
    await addFileToDb(path, file);
    apiEventsEmitter.emit('META_UPDATE');
  },
  async changeFile(file, path) {
    console.log('change file', path);
    await addFileToDb(path, file);
    apiEventsEmitter.emit('META_UPDATE');
  },
  async unlinkFile(path) {
    console.log('delete file', path);
    await removeFileFromDb(path);
    apiEventsEmitter.emit('META_UPDATE');
  },
};

export const getAllTags = async () => {
  const db = await getDb();
  const res = (await db.select('SELECT DISTINCT tag FROM tags')) as { tag: string }[];
  return res.map((v) => v.tag);
};

export interface IBookFromDb {
  path: string;
  title: string;
  author: string;
  year: number;
  myRating: number;
  cover: string;
  isbn13: string;
  tags: string[];
  read: {
    started?: string | undefined;
    finished?: string | undefined;
  }[];
}

const getFilesAbstract = async (whereClause: string) => {
  const db = await getDb();
  const res = (await db.select(
    `SELECT * FROM files 
    LEFT JOIN 
    (SELECT tags.path as tagPath, GROUP_CONCAT(tags.tag, ',') AS tagsRaw FROM tags GROUP BY tags.path)
    ON files.path = tagPath
    LEFT JOIN 
    (SELECT read.path as readPath, GROUP_CONCAT(IFNULL(read.started,'') || '|' || IFNULL(read.finished,''), ',') as readRaw FROM read GROUP BY read.path)
    ON files.path = readPath 
    ${whereClause};
    `,
  )) as Array<IBookFromDb & { tagsRaw: string; readRaw: string }>;

  res.map((v) => {
    if (v.tagsRaw) {
      v.tags = v.tagsRaw.split(',');
    }
    if (v.readRaw) {
      v.read = v.readRaw.split(',').map((dd) => {
        const [started, finished] = dd.split('|');
        return { started, finished };
      });
    }
  });

  console.log('where', whereClause, res);

  return res;
};

export const getFilesByTag = async (tag: string) => {
  return await getFilesAbstract(`WHERE files.path IN (SELECT path FROM tags WHERE tag="${tag}")`);
};

export const getFilesByPath = async (path: string) => {
  const db = await getDb();

  const all = await db.select('SELECT * FROM files');
  console.log('all', all);

  return await getFilesAbstract(
    `WHERE files.path LIKE concat('%', '${path}', '%') GROUP BY files.path`,
  );
};
