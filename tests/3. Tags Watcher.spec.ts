import * as path from 'path';
import * as fs from 'fs-extra';
import type { ElectronApplication, Locator } from 'playwright';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { setupTest, afterTest, sleep, getLocators, LOAD_TIMEOUT } from './helpers';

let electronApp: ElectronApplication;

const originalPath = path.join(process.cwd(), 'tests', 'testfiles_packs', '3. Tags');
const workingPath = path.join(process.cwd(), 'tests', 'tagswatcher');

beforeEach(async () => {
  electronApp = await setupTest(originalPath, workingPath);
});

afterEach(async () => await afterTest(electronApp, workingPath));

const getTagsInLeftMenu = async (locator: Locator): Promise<string[]> => {
  const itemsTotal = await locator.count();

  const tags = [];

  for (let i = 0; i < itemsTotal; i++) {
    const tag = await locator.nth(i).innerText();
    tags.push(tag.replace('#', ''));
  }

  return tags;
};

test('Tags watcher', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  let tags = await getTagsInLeftMenu(L.tagTreeItem);

  expect(tags, 'Initial tags loaded correctly').toEqual(['tag1', 'tag2', 'tag3']);

  const fol = path.join(workingPath, 'fol');
  const fol2 = path.join(fol, 'fol2');

  fs.renameSync(path.join(fol, 'g.txt'), path.join(fol, 'g.md'));
  fs.renameSync(path.join(fol2, 'i.txt'), path.join(fol2, 'i.md'));

  await sleep(LOAD_TIMEOUT);

  tags = await getTagsInLeftMenu(L.tagTreeItem);

  expect(tags, 'Added files are parsed correctly').toEqual([
    '_read',
    '_reading',
    'tag1',
    'tag2',
    'tag3',
    'tag6',
    'tag7',
    'tag8',
    'tag9',
  ]);

  fs.removeSync(fol2);

  await sleep(LOAD_TIMEOUT);

  tags = await getTagsInLeftMenu(L.tagTreeItem);

  expect(tags, 'Removed file is parsed correctly').toEqual([
    '_reading',
    'tag1',
    'tag2',
    'tag3',
    'tag7',
    'tag8',
  ]);

  const toUpdate = fs.readFileSync(path.join(fol, 'g2.txt'));
  fs.writeFileSync(path.join(fol, 'g.md'), toUpdate.toString());

  await sleep(LOAD_TIMEOUT);

  tags = await getTagsInLeftMenu(L.tagTreeItem);

  expect(tags, 'Updated file is parsed correctly').toEqual([
    'tag1',
    'tag2',
    'tag3',
    'tag4',
    'tag5',
  ]);
}, 50000);
