/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IpcRendererEvent, IpcMainEvent } from 'electron';

export const callWithoutEvent = (func: (...args: any[]) => void) => {
  return (_: IpcRendererEvent | IpcMainEvent, ...args: any[]) => func(...args);
};

export const FILENAME_REGEX = /[\\/:"*?<>|]+/g;
export const DOTFILE_REGEX = /(?:^|[\\/])(\.(?!\.)[^\\/]+)$/;
