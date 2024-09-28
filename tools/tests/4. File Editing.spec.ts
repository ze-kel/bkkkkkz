import * as path from 'path';
import * as fs from 'fs-extra';
import type { ElectronApplication } from 'playwright';
import { expect, test } from '@playwright/test';
import {
  setupTest,
  afterTest,
  getLocators,
  expectBookInEditor,
  removeLineTerminators,
  testFolderBase,
} from './helpers';
import type { ExpectedBook } from './helpers';

let electronApp: ElectronApplication;
let workingPath: string;
let booksPath: string;

const originalPath = path.join(testFolderBase, 'testfiles_packs', '2. Single File');

test.beforeAll(async () => {
  ({ electronApp, workingPath, booksPath } = await setupTest({ originalPath }));
});

test.afterAll(async () => await afterTest(electronApp, workingPath));

test('Changes on disk are reflected in the interface', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  await L.fileTreeItems.first().click();

  await expect(L.openedTab, 'After clicking All Books we have an open tab').toHaveCount(1);
  await expect(L.bookItems, 'Number of books we see in all books is correct').toHaveCount(1);

  await L.bookItems.first().click();

  const expected: ExpectedBook = {
    title: 'The 48 Laws of Power',
    author: 'Greene, Robert',
    year: '1998',
    ISBN: '9780140280197',
    tags: ['48tag', 'anothertag'],
    dates: [{ from: '24 March 2017', to: '12 May 2017' }],
    rating: 4,
  };

  await expectBookInEditor(L, expected, 'Initial book:');

  const newContent = fs.readFileSync(path.join(booksPath, 'diskChange.txt'));
  fs.writeFileSync(path.join(booksPath, '48.md'), newContent.toString());

  const expectedAfter: ExpectedBook = {
    title: 'Meditations',
    author: 'Marcus Aurelius',
    year: '180',
    ISBN: '9780140449334',
    tags: ['1one', '2two', '3three'],
    dates: [
      { from: '01 June 2019', to: '30 July 2019' },
      { from: '10 February 2020', to: '30 July 2020' },
    ],
    rating: 3.5,
  };

  await expectBookInEditor(L, expectedAfter, 'Book after update on disk:');
});

test('Editing book works and saves correctly', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  await L.editorAuthor.click();
  await L.editorAuthor.fill('Branden, Nathaniel');

  await L.editorTitle.click();
  await L.editorTitle.fill('Six Pillars of Self-Esteem');

  await L.editorYear.click();
  await L.editorYear.fill('1994');

  await L.editorIsbn.click();
  await L.editorIsbn.fill('9780553374391');

  await L.editorStar.last().click({ force: true });

  await L.editorDateRemove.first().click();
  await L.editorDateAdd.first().click();

  //01/01/2021
  await L.editorDateFrom.last().click();
  await L.editorCalendarYearInput.fill('2021');
  await L.editorCalendarMonthSelectorButton.click();
  await L.editorCalendarMonthSelectorMonth.first().click();
  await L.editorCalendarDay.first().click();

  //07/01/2021
  await L.editorDateTo.last().click();
  await L.editorCalendarYearInput.fill('2021');
  await L.editorCalendarMonthSelectorButton.click();
  await L.editorCalendarMonthSelectorMonth.first().click();
  await L.editorCalendarDay.nth(6).click();

  await L.editorMarkdown.click();
  await L.editorMarkdown.pressSequentially(' and some more');

  await L.editorTag.first().click();
  await L.editorTag.first().fill('');

  await L.editorAddTag.first().click();

  const expected: ExpectedBook = {
    title: 'Six Pillars of Self-Esteem',
    author: 'Branden, Nathaniel',
    year: '1994',
    ISBN: '9780553374391',
    tags: ['2two', '3three', 'tag3'],
    dates: [
      { from: '10 February 2020', to: '30 July 2020' },
      { from: '01 January 2021', to: '07 January 2021' },
    ],
    rating: 5,
  };

  await expectBookInEditor(L, expected, 'Final Book:');
});

test('Changes made in edtior are saved to disk', async () => {
  const page = await electronApp.firstWindow();

  await page.waitForTimeout(1000);

  const expected = fs.readFileSync(path.join(booksPath, 'editorChange.txt'));
  const onDisk = fs.readFileSync(path.join(booksPath, '48.md'));

  //  fs.writeFileSync(path.join(originalPath, 'debug.txt'), onDisk.toString());

  const expectedStr = removeLineTerminators(expected.toString());
  const onDiskStr = removeLineTerminators(onDisk.toString());

  await expect(expectedStr, 'After editing all changes are saved to disk').toEqual(onDiskStr);
});
