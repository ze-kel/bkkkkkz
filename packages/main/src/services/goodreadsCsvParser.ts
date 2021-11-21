// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck Too much hassle with unknowns
import Papa from 'papaparse';

import type { IUnsavedFile } from './files';

import { parse, format } from 'date-fns';

const ParseCSV = async (csvString: string): Promise<Array<IUnsavedFile>> => {
  const parsed = await Papa.parse(csvString, { header: true });

  if (parsed.errors) {
    console.log(parse.errors);
    throw 'Errors when parsing';
  }

  const data = parsed.data;

  const arr: IUnsavedFile[] = [];

  data.forEach((book) => {
    if (typeof book !== 'object') {
      return;
    }

    if (!book.Author || !book.Title || !book.ISBN) {
      continue;
    }

    const newBook: IUnsavedFile = {
      author: book.Author,
      title: book.Title,
      ISBN: book.ISBN,
      read: [],
      tags: [],
    };

    if (book['Original Publication Year']) {
      newBook.year = book['Original Publication Year'];
    } else {
      newBook.year = book['Year Published'];
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
export default ParseCSV;
