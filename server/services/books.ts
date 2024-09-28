import * as matter from 'gray-matter';
import type { ISavedFile } from './files';
import { z } from 'zod';

const zDateRead = z.object({ started: z.string().optional(), finished: z.string().optional() });

export type IDateRead = z.infer<typeof zDateRead>;

export const zBookData = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  year: z.number().optional(),
  myRating: z.number().optional(),
  read: z.array(zDateRead).optional(),
  tags: z.array(z.string()).optional(),
  cover: z.string().optional(),
  ISBN13: z.number().optional(),
});

export type IBookData = z.infer<typeof zBookData>;

export const makeBookFile = (path: string, name: string): ISavedFile => {
  const parsed = matter.read(path);

  const res = zBookData.safeParse(parsed.data);

  const toAdd = res.success ? res.data : {};

  const file: ISavedFile = {
    content: parsed.content,
    path,
    name,
    ...toAdd,
  };

  return file;
};

export const makeEncodedBook = (file: ISavedFile): string => {
  const res = zBookData.safeParse(file);

  const data: IBookData = res.success ? res.data : {};

  const result = matter.stringify(file.content || '', data);

  return result;
};
