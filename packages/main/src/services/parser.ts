export type DateRead = { started?: Date; finished?: Date };
import yaml from 'js-yaml';

export type Status = 'read' | 'to-read' | 'reading';

export type BookData = {
  title?: string;
  author?: string;
  year?: number;
  myRating?: number;
  markdown?: string;
};

const stringVerifier = (a: unknown): string => String(a);
const numberVerifier = (a: unknown): number => (Number.isNaN(Number(a)) ? -1 : Number(a));

type ParseKey = {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifier: (a: unknown) => any;
};

const BookDataKeys: ParseKey[] = [
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

// [1] is YAML DATA, [2] is correct empty line between YAML(ending with ---) and markdown, [3] is markdown.
const bookRegex = /(?:(?:---)(.+?)(?:---(?:(?:\r?\n|\r))?(?:(?:\r?\n|\r))?))?(.*)/ms;

const parse = (raw: string): BookData => {
  const matched = raw.match(bookRegex);

  let YAML = '';
  let MD = '';
  if (matched) {
    if (matched[1]) {
      YAML = matched[1];
    }
    if (matched[2]) {
      MD = matched[2];
    }
  }

  const book: BookData = {
    markdown: MD,
  };
  const parsed = yaml.loadAll(YAML)[0];

  BookDataKeys.forEach(({ key, verifier }) => {
    if (parsed[key]) {
      book[key] = verifier(parsed[key]);
    }
  });

  return book;
};

const encode = (book: BookData): string => {
  return yaml.dump(book, {
    flowLevel: 1,
    sortKeys: function (a: string, b: string) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    },
  });
};

export { parse, encode };
