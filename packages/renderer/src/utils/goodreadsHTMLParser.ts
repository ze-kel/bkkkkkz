import { format, parse } from 'date-fns';
import { useStore } from '../use/store';
import type { IBookData } from '/@main/services/books';

const grabSimpleValue = (rootElement: Element, name: string) => {
  const value = rootElement
    .getElementsByClassName('field ' + name)[0]
    .getElementsByClassName('value')[0];

  if (name === 'title') {
    return value.children[0].getAttribute('title') as string;
  }

  if (value.children.length) {
    return value.children[0].innerHTML;
  } else {
    return value.innerHTML;
  }
};

const getDates = (rootElement: Element, name: string) => {
  const result = [];
  const dates = rootElement
    .getElementsByClassName('field ' + name)[0]
    .getElementsByClassName('date_' + name);

  const store = useStore();

  if (!store.settings) return;
  const dateFormat = store.settings.dateFormat;

  for (const date in dates) {
    const parsedDate = parse(date, 'MMM dd, y', new Date());
    const formattedDate = format(parsedDate, dateFormat);
    result.push(formattedDate);
  }

  // GR shows reverse-chronological order
  result.reverse();
  return result;
};

export const parseBook = (rootElement: Element) => {
  const book: IBookData = {};

  book.title = grabSimpleValue(rootElement, 'title');
  book.author = grabSimpleValue(rootElement, 'author');
  book.ISBN13 = Number(grabSimpleValue(rootElement, 'isbn13'));

  book.myRating = rootElement
    .getElementsByClassName('field rating')[0]
    .getElementsByClassName('star on').length;

  //const startedReading = getDates(rootElement, 'date_started');
  // const finishedReading = getDates(rootElement, 'date_read');
  return book;
};
