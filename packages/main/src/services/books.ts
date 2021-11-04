import * as matter from 'gray-matter';
import type { ILoadedFile } from './files';

export type DateRead = { started?: Date; finished?: Date };

export type Status = 'read' | 'to-read' | 'reading';

export interface IBookData {
  title?: string;
  author?: string;
  year?: number;
  myRating?: number;
}

const numberVerifier = (v: unknown) => {
  if (!v) return -1;
  return Number.isNaN(Number(v)) ? -1 : Number(v);
};
const stringVerifier = (v: unknown) => (typeof v === 'string' ? v : '');

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
];

export const makeBookFile = (path: string, name: string): ILoadedFile => {
  const parsed = matter.read(path);

  const file: ILoadedFile = {
    content: parsed.content,
    path,
    name,
  };

  bookDataProps.forEach((prop) => {
    const data: unknown = parsed.data[prop.key];
    if (data) {
      file[prop.key] = prop.verifier(data);
    }
  });

  return file;
};

export const makeEncodedBook = (file: ILoadedFile): string => {
  const data: IBookData = {};

  bookDataProps.forEach((prop) => {
    const property = file[prop.key];
    if (property) {
      data[prop.key] = prop.verifier(property);
    }
  });

  const result = matter.stringify(file.content, data);

  return result;
};
