const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');

let watcher: any;

type IFile = {
  type: 'file';
  name: string;
  path: string;
};

type IFolder = {
  type: 'folder';
  name: string;
  path: string;
  content: {
    [key: string]: IFile | IFolder;
  };
};

const watchFolder = (path: string) => {
  watcher = chokidar.watch(path, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true,
  });

  const log = console.log.bind(console);
  // Add event listeners.
  watcher
    .on('add', (path: any) => log(`File ${path} has been added`))
    .on('change', (path: any) => log(`File ${path} has been changed`))
    .on('unlink', (path: any) => log(`File ${path} has been removed`));

  // More possible events.
  watcher
    .on('addDir', (path: any) => log(`Directory ${path} has been added`))
    .on('unlinkDir', (path: any) => log(`Directory ${path} has been removed`))
    .on('error', (error: any) => log(`Watcher error: ${error}`))
    .on('ready', () => log('Initial scan complete. Ready for changes'))
    .on('raw', (event: any, path: any, details: any) => {
      // internal
      log('Raw event info:', event, path, details);
    });
};

const getFilesFromFolder = (basePath: string): IFolder => {
  fs.ensureDirSync(basePath);

  const files = fs.readdirSync(basePath);

  const output: IFolder = {
    type: 'folder',
    name: path.basename(basePath),
    path: basePath,
    content: {},
  };

  files.forEach((file: string) => {
    if (fs.statSync(path.join(basePath, file)).isDirectory()) {
      output.content[file] = getFilesFromFolder(path.join(basePath, file));
    } else {
      output.content[file] = { type: 'file', name: file, path: path.join(basePath, file) };
    }
  });

  return output;
};

export default { watchFolder, getFilesFromFolder };
