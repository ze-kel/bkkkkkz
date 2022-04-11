import * as path from 'path';
import * as fs from 'fs-extra';
import type { ElectronApplication } from 'playwright';
import { afterAll, beforeAll, expect, test } from 'vitest';
import {
  setupTest,
  afterTest,
  sleep,
  getLocators,
  LOAD_TIMEOUT,
  getBookFromEditor,
} from './helpers';
import type { TestBookFromEditor } from './helpers';

let electronApp: ElectronApplication;

const originalPath = path.join(process.cwd(), 'tests', 'testfiles_packs', '2. Single File');
const workingPath = path.join(process.cwd(), 'tests', 'file editing');

beforeAll(async () => {
  electronApp = await setupTest(originalPath, workingPath);
});

afterAll(async () => await afterTest(electronApp, workingPath));

test('Changes on disk are reflected in the interface', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  await L.fileTreeItems.first().click();
  await sleep(LOAD_TIMEOUT);
  expect(await L.openedTab.count(), 'After clicking All Books we have an open tab').toBe(1);
  expect(await L.bookItems.count(), 'Number of books we see in all books is correct').toBe(1);

  await L.bookItems.first().click();
  await sleep(LOAD_TIMEOUT);

  const expected: TestBookFromEditor = {
    title: 'The 48 Laws of Power',
    author: 'Greene, Robert',
    year: '1998',
    ISBN: '9780140280197',
    tags: ['48tag', 'anothertag'],
    dates: [{ from: '24/03/2017', to: '12/05/2017' }],
    rating: 4,
  };

  let bookInEditor = await getBookFromEditor(L);

  expect(bookInEditor).toEqual(expected);

  const newContent = fs.readFileSync(path.join(workingPath, 'diskChange.txt'));
  fs.writeFileSync(path.join(workingPath, '48.md'), newContent.toString());
  await sleep(LOAD_TIMEOUT);

  const expectedAfter: TestBookFromEditor = {
    title: 'Meditations',
    author: 'Marcus Aurelius',
    year: '180',
    ISBN: '9780140449334',
    tags: ['1one', '2two', '3three'],
    dates: [
      { from: '01/06/2019', to: '30/07/2019' },
      { from: '10/02/2020', to: '30/07/2020' },
    ],
    rating: 3.5,
  };

  bookInEditor = await getBookFromEditor(L);

  expect(bookInEditor).toEqual(expectedAfter);
});

test('Changes made in edtior are reflected in interface', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  await sleep(LOAD_TIMEOUT);

  // We have to click first, otherwise it won't clear properly. Gotta be some problem with playwright and contenteditable
  await L.editorAuthor.click();
  await L.editorAuthor.fill('Branden, Nathaniel');

  await L.editorTitle.click();
  await L.editorTitle.fill('Six Pillars of Self-Esteem');

  await L.editorYear.click();
  await L.editorYear.fill('1994');

  await L.editorIsbn.click();
  await L.editorIsbn.fill('9780553374391');

  await sleep(LOAD_TIMEOUT);

  await sleep(LOAD_TIMEOUT);

  await L.editorStar.last().click({ force: true });

  await L.editorDateRemove.first().click();
  await L.editorDateAdd.first().click();

  await L.editorDateFrom.last().fill('01/01/2021');

  await sleep(LOAD_TIMEOUT);

  await L.editorDateTo.last().fill('07/01/2021');
  await L.editorDateTo.last().press('Enter');

  await sleep(LOAD_TIMEOUT);

  await L.editorMarkdown.click();
  await L.editorMarkdown.type(' and some more');

  await sleep(LOAD_TIMEOUT);

  await L.editorTag.first().click();
  await L.editorTag.first().fill('');

  await sleep(LOAD_TIMEOUT);

  await L.editorAddTag.first().click();

  await sleep(LOAD_TIMEOUT);

  const expected: TestBookFromEditor = {
    title: 'Six Pillars of Self-Esteem',
    author: 'Branden, Nathaniel',
    year: '1994',
    ISBN: '9780553374391',
    tags: ['2two', '3three', 'tag3'],
    dates: [
      { from: '10/02/2020', to: '30/07/2020' },
      { from: '01/01/2021', to: '07/01/2021' },
    ],
    rating: 5,
  };

  const bookInEditor = await getBookFromEditor(L);

  expect(bookInEditor).toEqual(expected);
});

test('Changes made in edtior are saved to disk', async () => {
  const expected = fs.readFileSync(path.join(workingPath, 'editorChange.txt'));
  const onDisk = fs.readFileSync(path.join(workingPath, '48.md'));

  fs.writeFileSync(path.join(originalPath, 'salkdasd.txt'), onDisk.toString());

  expect(expected.toString(), 'After editing all changes are saved to disk').toEqual(
    onDisk.toString(),
  );
});
