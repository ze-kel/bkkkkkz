import * as path from 'path';
import * as fs from 'fs-extra';
import type { ElectronApplication } from 'playwright';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { setupTest, afterTest, sleep, getLocators, LOAD_TIMEOUT } from './helpers';

let electronApp: ElectronApplication;

const originalPath = path.join(process.cwd(), 'tests', 'testfiles_packs', '2. Single File');
const workingPath = path.join(process.cwd(), 'tests', 'file editing');

beforeEach(async () => {
  electronApp = await setupTest(originalPath, workingPath);
});

afterEach(async () => await afterTest(electronApp, workingPath));

test('Files are seen', async () => {
  const page = await electronApp.firstWindow();
  const L = getLocators(page);

  await L.fileTreeItems.first().click();
  await sleep(LOAD_TIMEOUT);
  expect(await L.openedTab.count(), 'After clicking All Books we have an open tab').toBe(1);
  expect(await L.bookItems.count(), 'Number of books we see in all books is correct').toBe(1);

  await L.bookItems.first().click();
  await sleep(LOAD_TIMEOUT);

  expect(await L.editorTitle.innerText(), 'Book shows correct author').toBe('The 48 Laws of Power');
  expect(await L.editorAuthor.innerText(), 'Book shows correct author').toBe('Greene, Robert');
  expect(await L.editorYear.innerText(), 'Book shows correct year').toBe('1998');
  expect(await L.editorIsbn.innerText(), 'Book shows correct ISBN').toBe('9780140280197');

  const newContent = fs.readFileSync(path.join(workingPath, 'm.txt'));

  fs.writeFileSync(path.join(workingPath, '48.md'), newContent.toString());
  await sleep(LOAD_TIMEOUT);

  expect(await L.editorTitle.innerText(), 'Book tilte updated to reflect changes').toBe(
    'Meditations',
  );
  expect(await L.editorAuthor.innerText(), 'Book author updated to reflect changes').toBe(
    'Marcus Aurelius',
  );
  expect(await L.editorYear.innerText(), 'Book year updated to reflect changes').toBe('180');
  expect(await L.editorIsbn.innerText(), 'Book ISBN updated to reflect changes').toBe(
    '9780140449334',
  );

  expect(await L.editorMarkdown.innerHTML(), 'Book markdown updated to reflect changes').toContain(
    'This is some sample markdown',
  );
});
