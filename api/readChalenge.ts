import * as path from 'path';
import * as fs from 'fs-extra';
import { getRootPath } from './rootPath';

import { z } from 'zod';
import { sendNotificationToUser } from '../trpc/api';

export const zReadChallenge = z.record(
  z.string().length(4),
  z.object({
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

  const f = fs.existsSync(targetFile) ? JSON.parse(fs.readFileSync(targetFile).toString()) : {};

  try {
    const parsed = zReadChallenge.parse(f);
    return parsed;
  } catch (e) {
    sendNotificationToUser({
      title: 'Error when parsing Read Challenge data file',
      text: [
        'There might be your data. Please check it.',
        'It will be lost on next iteraction with «Currently Reading» panel.',
      ],
      ttlSeconds: Infinity,
      subtext: targetFile,
    });
    return {};
  }
};

export const saveReadChallenge = (settings: IReadChallengeData) => {
  const rootPath = getRootPath();

  if (!rootPath) {
    throw new Error('Trying to write settings without root path present');
  }

  const targetFolder = path.join(rootPath, '/.internal/');
  const targetFile = path.join(targetFolder, JSON_NAME);

  fs.ensureDirSync(targetFolder);
  fs.writeFileSync(targetFile, JSON.stringify(settings));
  return;
};
