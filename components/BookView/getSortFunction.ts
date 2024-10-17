import type { ISortDirection, ISortByOption } from '~/api/openedTabs';
import { getDateReducerSingle } from './getDateReducer';
import type { IBookFromDb } from '~/api/tauriEvents';

type ISortFuction = (a: IBookFromDb, b: IBookFromDb, direction: ISortDirection) => number;

const getSortByReadFunc = (last: boolean, format: string): ISortFuction => {
  const dateReducer = getDateReducerSingle(last, format);

  return (a, b, dir) => {
    const at = a.read?.reduce(dateReducer, null) || null;
    const bt = b.read?.reduce(dateReducer, null) || null;

    if (at === null && bt === null) return 0;

    if (at === null) {
      return 1;
    }

    if (bt === null) {
      return -1;
    }

    return (at.getTime() - bt.getTime()) * dir;
  };
};

const getSortFunction = (type: ISortByOption, format: string): ISortFuction => {
  switch (type) {
    case 'Title': {
      return (a, b, dir) => {
        const at = a.title || null;
        const bt = b.title || null;
        if (!at) return 1;
        if (!bt) return -1;
        return at.localeCompare(bt) * dir;
      };
    }
    case 'Author': {
      return (a, b, dir) => {
        const at = a.author || null;
        const bt = b.author || null;
        if (!at) return 1;
        if (!bt) return -1;
        return at.localeCompare(bt) * dir;
      };
    }
    case 'Year': {
      return (a, b, dir) => {
        const at = Number(a.year) || -1;
        const bt = Number(b.year) || -1;
        return (at - bt) * dir;
      };
    }
    case 'Last Read': {
      return getSortByReadFunc(true, format);
    }
    case 'First Read': {
      return getSortByReadFunc(false, format);
    }
    case 'Rating': {
      return (a, b, dir) => {
        const at = a.myRating || null;
        const bt = b.myRating || null;
        if (!at) return 1;
        if (!bt) return -1;
        return (at - bt) * dir;
      };
    }
    case 'Filename': {
      return (a, b, dir) => {
        return a.name.localeCompare(b.name) * dir;
      };
    }
  }
};

export default getSortFunction;
