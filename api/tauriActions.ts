import type { IBookFromDb } from '~/api/tauriEvents';
import { invoke } from '@tauri-apps/api/core';

export type IBookSaveResult = {
  path: string;
  modified: string;
};

/**
 *  When forced set to false will return error if
 *  1. Book.modified is not null but is not equal to file last modified
 *  2. File does not exist already.
 */
export const c_save_file = async (book: IBookFromDb, forced = false) => {
  const r = (await invoke('c_save_file', {
    book,
    forced,
  })) as IBookSaveResult | string;

  return r;
};

export const c_get_files_path = async (path: string) => {
  return (await invoke('c_get_files_path', {
    path,
  })) as IBookFromDb[];
};

export const c_get_files_tag = async (tag: string) => {
  return (await invoke('c_get_files_tag', {
    tag,
  })) as IBookFromDb[];
};

export type BookReadResult =
  | {
      book: IBookFromDb;
      // This error happens when file is read, but metadata parsing encountered error.
      // Book will default to empty values, except for path, markdown and modified.
      parsing_error: string | null;
    }
  // String error here means error happened when reading file(or it does not exist)
  | string;

export const c_read_file_by_path = async (path: string) => {
  const res = (await invoke('c_read_file_by_path', {
    path,
  })) as BookReadResult | string;

  return res;
};
