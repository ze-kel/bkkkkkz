import * as matter from 'gray-matter';
import type { ISavedFile } from './files';
import settings from './settings';
import { parse, isValid } from 'date-fns';

export type IDateRead = { started?: string; finished?: string };

export type Status = 'read' | 'to-read' | 'reading';

export type numbersOnlyString = string;
export interface IBookData {
  title?: string;
  author?: string;
  year?: number;
  myRating?: number;
  read?: IDateRead[];
  tags?: string[];
  cover?: string;
  ISBN13?: number;
}

const numberVerifier = (v: unknown) => {
  if (!v) return -1;
  return Number.isNaN(Number(v)) ? -1 : Number(v);
};
const stringVerifier = (v: unknown) => (typeof v === 'string' ? v : '');

const stringArrayVerifier = (v: unknown) => {
  if (!Array.isArray(v)) return [];
  return Array.from(
    v.reduce((acc: Set<string>, el: unknown) => {
      const newS = stringVerifier(el);
      if (newS) acc.add(newS);
      return acc;
    }, new Set()),
  );
};

const dateVerifier = (date: unknown, dateFormat: string): string | null => {
  if (typeof date !== 'string') return null;
  const parsed = parse(date, dateFormat, new Date());
  if (!isValid(parsed)) return null;
  return date;
};

const ISBNVerifier = (isbn: unknown) => {
  if (typeof isbn != 'number') return;
  if (String(isbn).length != 13) return;
  return isbn;
};

const readDatesVerifier = (v: unknown) => {
  if (!Array.isArray(v)) return [];
  const stngs = settings.getStore();
  const dateFormat = stngs.dateFormat;
  return v.reduce((acc, dates) => {
    const verifiedDate: IDateRead = {};

    const from = dateVerifier(dates.started, dateFormat);

    if (from) {
      verifiedDate.started = from;
    }
    const to = dateVerifier(dates.finished, dateFormat);

    if (to) {
      verifiedDate.finished = to;
    }

    if (Object.values(verifiedDate).length > 0) {
      acc.push(verifiedDate);
    }
    return acc;
  }, []);
};

type BoodataProp = {
  key: keyof IBookData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifier: (v: unknown) => any;
};

const bookDataProps: BoodataProp[] = [
  {
    key: 'title',
    verifier: stringVerifier,
  },
  {
    key: 'author',
    verifier: stringVerifier,
  },
  {
    key: 'year',
    verifier: numberVerifier,
  },
  {
    key: 'myRating',
    verifier: numberVerifier,
  },
  {
    key: 'read',
    verifier: readDatesVerifier,
  },
  {
    key: 'tags',
    verifier: stringArrayVerifier,
  },
  {
    key: 'cover',
    verifier: stringVerifier,
  },
  {
    key: 'ISBN13',
    verifier: ISBNVerifier,
  },
];

export const makeBookFile = (path: string, name: string): ISavedFile => {
  const parsed = matter.read(path);

  const file: ISavedFile = {
    content: parsed.content,
    path,
    name,
  };

  bookDataProps.forEach((prop) => {
    const data: unknown = parsed.data[prop.key];
    if (data) {
      const verified = prop.verifier(data);
      if (verified) file[prop.key] = prop.verifier(data);
    }
  });

  return file;
};

export const makeEncodedBook = (file: ISavedFile): string => {
  const data: IBookData = {};

  bookDataProps.forEach((prop) => {
    const property = file[prop.key];
    if (property) {
      const verified = prop.verifier(property);
      if (verified) data[prop.key] = verified;
    }
  });

  const result = matter.stringify(file.content || '', data);

  return result;
};
