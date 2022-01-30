import { parse } from 'date-fns';

import { useStore } from '/@/use/store';
import type { StateType } from '/@/use/store';
import type { IDateRead } from '/@main/services/books';

type IDateReducer = (acc: null | Date, datePair: IDateRead) => null | Date;

let store: StateType | null = null;

const getFormat = () => {
  if (!store) {
    store = useStore();
  }

  if (!store.settings) {
    throw 'Trying to access settings before they are loaded';
  }

  return store.settings?.dateFormat;
};

export const getDateReducerSingle = (last: boolean): IDateReducer => {
  return (acc, datePair) => {
    if (!datePair.finished) return acc;

    const finishedDate = parse(datePair.finished, getFormat(), new Date());

    if (acc === null) return finishedDate;

    if (last) {
      return finishedDate > acc ? finishedDate : acc;
    }
    return finishedDate < acc ? finishedDate : acc;
  };
};

export const dateReducerAllYears = (acc: number[], datePair: IDateRead): number[] => {
  if (!datePair.finished) return acc;

  const finishedDate = parse(datePair.finished, getFormat(), new Date());

  acc.push(finishedDate.getFullYear());
  return acc;
};
