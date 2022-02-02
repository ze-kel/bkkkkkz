import { getDateReducerSingle } from './getDateReducer';
import type { ISortByOption } from '/@main/services/watcher';
import type { ISavedFile } from '/@main/services/files';

export type IBookGroup = {
  label: string;
  content: ISavedFile[];
};

const getGroupLabel = (book: ISavedFile, propety: ISortByOption): string => {
  switch (propety) {
    case 'Title': {
      return book.title ? book.title[0] : 'Unknown Author';
    }
    case 'Author': {
      return book.author ? book.author[0] : 'Unknown Author';
    }
    case 'Year': {
      return book.year ? String(book.year) : 'Unknown Year';
    }
    case 'First Read': {
      const date = book.read?.reduce(getDateReducerSingle(false), null)?.getFullYear();
      return date ? String(date) : 'Never';
    }
    case 'Last Read': {
      const date = book.read?.reduce(getDateReducerSingle(true), null)?.getFullYear();
      return date ? String(date) : 'Never';
    }
    case 'Filename': {
      return book.name[0];
    }
    case 'Rating': {
      return book.myRating ? String(book.myRating) : 'Not Rated';
    }
  }
};

export const groupItems = (sortedItems: ISavedFile[], sortingBy: ISortByOption) => {
  const grouped: IBookGroup[] = [];

  let lastLabel: string | null = null;

  sortedItems.forEach((book, index) => {
    const bookLabel = getGroupLabel(book, sortingBy);
    if (bookLabel !== lastLabel) {
      grouped.push({ label: bookLabel, content: [book] });
    } else {
      grouped[grouped.length - 1].content.push(book);
    }

    lastLabel = bookLabel;
  });

  return grouped;
};
