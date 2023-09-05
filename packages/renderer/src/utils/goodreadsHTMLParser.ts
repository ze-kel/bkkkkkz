import { format, parse, isValid } from 'date-fns';
import { trpcApi } from './trpc';
import type { IBookData, IDateRead } from '/@main/services/books';
import type { IUnsavedFile } from '/@main/services/files';
import { useStore } from '/@/use/store';

const grabSimpleValue = (rootElement: Element, name: string) => {
  const value = rootElement
    .getElementsByClassName('field ' + name)[0]
    .getElementsByClassName('value')[0];

  if (name === 'title') {
    return value.children[0].getAttribute('title') as string;
  }

  if (value.children.length) {
    return value.children[0].innerHTML.trim();
  } else {
    return value.innerHTML.trim();
  }
};

const parseDate = (stringToParse: string, possibleFormats: string[]): Date | undefined => {
  let parsed;

  for (const format of possibleFormats) {
    parsed = parse(stringToParse, format, new Date());

    if (isValid(parsed)) return parsed;
  }
};

const getDates = (rootElement: Element, dateFormat: string): IDateRead[] => {
  // Date started and date finished are separate in a table, each date is marked with a class
  // like date_started_amzn1grreading_sessionv141zd03da758c4d922gx543baa13a0a0 to identify pairs
  const hashes = new Set();
  const dateEls = rootElement.getElementsByClassName('editable_date');
  for (const cdateEl of dateEls) {
    const classes = cdateEl.classList;
    hashes.add(classes[1].replace('date_started', '').replace('date_read', ''));
  }

  const result: IDateRead[] = [];

  // No idea why but the seccond format appeared in my export, even though the date is seen on the web
  const possibleFormats = ['MMM dd, y', 'MMM yyyy'];

  for (const hash of hashes) {
    const date: IDateRead = {};

    const startedEl = rootElement.getElementsByClassName('date_started' + hash);
    if (startedEl.length) {
      // StartedEl contains a span and a link, we ned span's content
      const parsedStared = parseDate(startedEl[0].children[0].innerHTML, possibleFormats);
      if (parsedStared) {
        const started = format(parsedStared, dateFormat);
        date.started = started;
      }
    }

    const finishedEl = rootElement.getElementsByClassName('date_read' + hash);
    if (finishedEl.length) {
      const parsedFinished = parseDate(finishedEl[0].children[0].innerHTML, possibleFormats);
      if (parsedFinished) {
        const finished = format(parsedFinished, dateFormat);
        date.finished = finished;
      }
    }
    if (date.started || date.finished) {
      result.push(date);
    }
  }
  return result;
};

const getYear = (rootElement: Element) => {
  const yearUnparsed = grabSimpleValue(rootElement, 'date_pub');
  const possibleFormats = ['MMM dd, yyyy', 'yyyy'];

  const date = parseDate(yearUnparsed, possibleFormats);
  if (date) return date.getFullYear();
};

const parseBook = (rootElement: Element, dateFormat: string): IUnsavedFile => {
  const book: IUnsavedFile = { unsaved: true };

  book.title = grabSimpleValue(rootElement, 'title');
  book.author = grabSimpleValue(rootElement, 'author');
  book.ISBN13 = Number(grabSimpleValue(rootElement, 'isbn13'));

  const year = getYear(rootElement);
  if (year) book.year = year;

  book.myRating = rootElement
    .getElementsByClassName('field rating')[0]
    .getElementsByClassName('star on').length;

  book.read = getDates(rootElement, dateFormat);
  return book;
};

export const importGoodReadsHTML = (event: any) => {
  if (!event.target?.files) {
    return;
  }

  const store = useStore();

  const fr = new FileReader();
  const parser = new DOMParser();
  fr.readAsText(event.target.files[0]);
  fr.onload = async function () {
    if (typeof fr.result === 'string') {
      const html = parser.parseFromString(fr.result, 'text/html');
      const books = html.getElementById('booksBody')?.children;
      if (!books) return;

      const result: IUnsavedFile[] = [];

      if (!store.settings || !store.rootPath) return;

      for (const book of books) {
        result.push(parseBook(book, store.settings?.dateFormat));
      }

      const path = await trpcApi.createFolder.mutate({
        pathToFolder: store.rootPath,
        name: `Goodreads Import ${format(new Date(), 'MM-dd HH-mm-ss')}`,
      });

      await trpcApi.saveNewFiles.mutate({ basePath: path, files: result });
    }
  };
};
