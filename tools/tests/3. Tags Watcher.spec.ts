import * as path from 'path';
import * as fs from 'fs-extra';
import type { ElectronApplication } from 'playwright';
import { expect, test } from '@playwright/test';
import { setupTest, afterTest, getLocators } from './helpers';

let electronApp: ElectronApplication;
let workingPath: string;
let booksPath: string;
let resetFolder: () => void = () => {};

const originalPath = path.join(process.cwd(), 'tests', 'testfiles_packs', '3. Tags');
test.beforeAll(async () => {
  ({ electronApp, workingPath, booksPath, resetFolder } = await setupTest({ originalPath }));
});

test.beforeEach(() => {
  resetFolder();
});

test.afterAll(async () => await afterTest(electronApp, workingPath));

test('Tag editing', async () => {
  const fol = path.join(booksPath, 'fol');
  const fol2 = path.join(fol, 'fol2');

  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  await expect(L.tagTreeItem, 'Initial tags loaded correctly').toContainText([
    'tag1',
    'tag2',
    'tag3',
  ]);

  fs.renameSync(path.join(fol, 'g.txt'), path.join(fol, 'g.md'));
  fs.renameSync(path.join(fol2, 'i.txt'), path.join(fol2, 'i.md'));

  await expect(L.tagTreeItem, 'Added files are parsed correctly').toContainText([
    'tag1',
    'tag2',
    'tag3',
    'tag6',
    'tag7',
    'tag8',
    'tag9',
  ]);

  fs.removeSync(fol2);

  await expect(L.tagTreeItem, 'Removed file is parsed correctly').toContainText([
    'tag1',
    'tag2',
    'tag3',
    'tag7',
    'tag8',
  ]);

  const toUpdate = fs.readFileSync(path.join(fol, 'g2.txt'));
  fs.writeFileSync(path.join(fol, 'g.md'), toUpdate.toString());

  await expect(L.tagTreeItem, 'Updated file is parsed correctly').toContainText([
    'tag1',
    'tag2',
    'tag3',
    'tag4',
    'tag5',
  ]);
});

test('Tag page', async () => {
  const fol = path.join(booksPath, 'fol');
  const fol2 = path.join(fol, 'fol2');

  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  //wait for reset
  await expect(L.tagTreeItem).toHaveCount(3);

  await L.tagTreeItem.last().click();

  await expect(L.bookItems, 'Tag shows correct number of books associated').toHaveCount(2);

  fs.renameSync(path.join(fol, 'g2.txt'), path.join(fol, 'g2.md'));

  await expect(L.bookItems, 'New file on disk with opened tag is shown').toHaveCount(3);

  fs.removeSync(path.join(booksPath, 'r.md'));

  await expect(L.bookItems, 'File deleted from disk is removed correctly').toHaveCount(2);

  const toUpdate = fs.readFileSync(path.join(fol2, 'i.txt'));
  fs.writeFileSync(path.join(booksPath, 'r2.md'), toUpdate.toString());

  await expect(L.bookItems, 'File updated disk is removed correctly').toHaveCount(1);
});
