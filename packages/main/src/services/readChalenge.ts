import * as path from 'path';
import * as fs from 'fs-extra';
import { getRootPath } from './rootPath';

import { z } from 'zod';

export const zReadChallenge = z.array(
  z.object({
    year: z.number().min(1),
    books: z.number().min(1),
  }),
);

export type IReadChallengeData = z.infer<typeof zReadChallenge>;

const JSON_NAME = 'readChallenge.json';

export const getReadChallenge = () => {
  const rootPath = getRootPath();

  if (!rootPath) {
    throw new Error('Trying to read settings without root path present');
  }

  const targetFolder = path.join(rootPath, '/.internal/');
  const targetFile = path.join(targetFolder, JSON_NAME);

  fs.ensureDirSync(targetFolder);

  const f = fs.existsSync(targetFile) ? JSON.parse(fs.readFileSync(targetFile).toString()) : [];

  const parsed = zReadChallenge.parse(f);
  return parsed;
};

export const saveReadChallenge = (settings: IReadChallengeData) => {
  const rootPath = getRootPath();
  console.log('saving', settings);

  if (!rootPath) {
    throw new Error('Trying to write settings without root path present');
  }

  const targetFolder = path.join(rootPath, '/.internal/');
  const targetFile = path.join(targetFolder, JSON_NAME);

  fs.ensureDirSync(targetFolder);
  fs.writeFileSync(targetFile, JSON.stringify(settings));
  return;
};
