import * as path from 'path';
import * as fs from 'fs-extra';
import { getRootPath } from './rootPath';

import { z } from 'zod';

export const zSettings = z.object({
  recursiveFolders: z.boolean().default(false),
  dateFormat: z.string().default('yyyy-MM-dd'),
  dateLocale: z.string().default('en-GB'),
  coversPath: z.string().default('.covers'),
  darkMode: z.enum(['Light', 'System', 'Dark']).default('System'),
});

export type ISettings = z.infer<typeof zSettings>;

const JSON_NAME = 'settings.json';

export const getSettings = () => {
  const rootPath = getRootPath();

  if (!rootPath) {
    throw new Error('Trying to read settings without root path present');
  }

  const targetFolder = path.join(rootPath, '/.internal/');
  const targetFile = path.join(targetFolder, JSON_NAME);

  fs.ensureDirSync(targetFolder);

  const f = fs.existsSync(targetFile) ? JSON.parse(fs.readFileSync(targetFile).toString()) : {};

  const parsed = zSettings.safeParse(f);
  if (!parsed.success) {
    const def = zSettings.parse({});
    return def;
  }
  return parsed.data;
};

export const saveSettings = (settings: ISettings) => {
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
