// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck Too much hassle with unknowns
import Papa from 'papaparse';
import path from 'path';
import fs from 'fs';
import Settings from './settings';

import type { IUnsavedFile } from './files';

import { parse, format } from 'date-fns';
import { NUMBERS_REGEX } from '../helpers/utils';

const ParseGoodreadsCSV = async (csvPath: string): Promise<Array<IUnsavedFile>> => {
  if (path.extname(csvPath) !== '.csv') {
    throw 'Not a csv';
  }

  const file = fs.readFileSync(csvPath);

  const parsed = await Papa.parse(file.toString(), { header: true });

  const data = parsed.data;

  const arr: IUnsavedFile[] = [];

  const stngs = Settings.getStore();
  const dateFormat = stngs.dateFormat;

  data.forEach((book) => {
    if (typeof book !== 'object') {
      return;
    }

    if (!book.Author || !book.Title) {
      return;
    }

    const newBook: IUnsavedFile = {
      author: book.Author,
      title: book.Title.replace('--', '—'),
      read: [],
      tags: [],
    };

    if (book['ISBN13']) {
      const clearISBN = book['ISBN13'].replace(NUMBERS_REGEX, '');
      if (clearISBN.length === 13) {
        newBook.ISBN13 = Number(clearISBN);
      }
    }

    if (book['Original Publication Year']) {
      newBook.year = Number(book['Original Publication Year']);
    } else {
      newBook.year = Number(book['Year Published']);
    }

    if (book['Date Read']) {
      const parsed = parse(book['Date Read'], 'yyyy/MM/dd', new Date());

      newBook.read.push({ finished: format(parsed, dateFormat) });
    }

    if (book['My Rating']) {
      newBook.myRating = Number(book['My Rating']);
    }

    arr.push(newBook);
  });

  return arr;
};

export default ParseGoodreadsCSV;
