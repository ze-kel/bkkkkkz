/* eslint-disable @typescript-eslint/no-unused-vars */
import * as fs from 'fs-extra';
import path from 'path';
import globalSettings from './globalSettings';

export type ISettings = {
  testString: string;
  testBool: boolean;
};

const defaults: ISettings = {
  testString: 'test',
  testBool: true,
};

const SETTINGS_PATH = '.bkz/settings.json';
