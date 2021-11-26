// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck Too much hassle with unknowns
import Papa from 'papaparse';
import path from 'path';
import fs from 'fs';

import type { IUnsavedFile } from './files';

import { parse, format } from 'date-fns';

const ParseGoodreadsCSV = async (csvPath: string): Promise<Array<IUnsavedFile>> => {
  console.log(csvPath);
  console.log('extname', path.extname(csvPath));
  if (path.extname(csvPath) !== '.csv') {
    throw 'Not a csv';
  }

  const file = fs.readFileSync(csvPath);

  const parsed = await Papa.parse(file.toString(), { header: true });

  const data = parsed.data;

  const arr: IUnsavedFile[] = [];

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
      ISBN: book.ISBN,
      ISBN13: book.ISBN13,
      read: [],
      tags: [],
    };

    if (book['Original Publication Year']) {
      newBook.year = Number(book['Original Publication Year']);
    } else {
      newBook.year = Number(book['Year Published']);
    }

    if (book['Date Read']) {
      const parsed = parse(book['Date Read'], 'yyyy/MM/dd', new Date());

      newBook.read = [
        //@ts-expect-error later i'll connect vuex
        { finished: format(parsed, 'yyyy-MM-dd') },
      ];
    }

    if (book['My Rating']) {
      newBook.myRating = Number(book['My Rating']);
    }

    arr.push(newBook);
  });

  return arr;
};

export default ParseGoodreadsCSV;
