/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = async function () {
  return {
    directories: {
      output: 'dist',
      buildResources: 'tools/buildResources',
    },
    files: ['.output/**/*', 'dist-electron'],

    // Specify linux target just for disabling snap compilation
    linux: {
      target: 'deb',
    },
  };
};
