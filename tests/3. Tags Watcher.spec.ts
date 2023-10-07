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

const fol = path.join(workingPath, 'fol');
const fol2 = path.join(fol, 'fol2');

test('Tag editing', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  let tags = await getTagsInLeftMenu(L.tagTreeItem);

  await sleep(LOAD_TIMEOUT);

  expect(tags, 'Initial tags loaded correctly').toEqual(['tag1', 'tag2', 'tag3']);

  fs.renameSync(path.join(fol, 'g.txt'), path.join(fol, 'g.md'));
  fs.renameSync(path.join(fol2, 'i.txt'), path.join(fol2, 'i.md'));

  await sleep(LOAD_TIMEOUT);

  tags = await getTagsInLeftMenu(L.tagTreeItem);

  expect(tags, 'Added files are parsed correctly').toEqual([
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
});

test('Tag page', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  await L.tagTreeItem.last().click();

  await sleep(LOAD_TIMEOUT);

  expect(await L.bookItems.count(), 'Tag shows correct number of books associated').toBe(2);

  fs.renameSync(path.join(fol, 'g2.txt'), path.join(fol, 'g2.md'));

  await sleep(LOAD_TIMEOUT);

  expect(await L.bookItems.count(), 'New file on disk with opened tag is shown').toBe(3);

  fs.removeSync(path.join(workingPath, 'r.md'));

  await sleep(LOAD_TIMEOUT);

  expect(await L.bookItems.count(), 'File deleted from disk is removed correctly').toBe(2);

  const toUpdate = fs.readFileSync(path.join(fol2, 'i.txt'));
  fs.writeFileSync(path.join(workingPath, 'r2.md'), toUpdate.toString());

  await sleep(LOAD_TIMEOUT);

  expect(await L.bookItems.count(), 'File updated disk is removed correctly').toBe(1);
});
