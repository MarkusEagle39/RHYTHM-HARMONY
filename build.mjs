import { readFile, writeFile } from 'node:fs/promises';

const moduleFiles = [
  ['TRACKS', 'js/tracks.js'],
  ['AudioController', 'js/Audio.js'],
  ['ScreenController', 'js/Screen.js'],
  ['Game', 'js/Game.js'],
  ['MenuController', 'js/Menu.js'],
];

const compiledModules = await Promise.all(moduleFiles.map(async ([name, path]) => {
  const source = (await readFile(path, 'utf8'))
    .replace(/^import \{ TRACKS \} from '\.\/tracks\.js';\n/gm, 'const { TRACKS } = window.__rhythmModules;\n')
    .replace(/^export\s+/gm, '');
  return `(() => {\n${source}\nwindow.__rhythmModules.${name} = ${name};\n})();`;
}));

const entryPoint = (await readFile('game.js', 'utf8'))
  .replace(/^import .*;\n/gm, '')
  .replace(/^/m, 'const { AudioController, Game, MenuController, ScreenController } = window.__rhythmModules;\n');

const bundle = [
  'window.__rhythmModules = {};',
  ...compiledModules,
  entryPoint,
  'delete window.__rhythmModules;',
].join('\n\n');

await writeFile('game.bundle.js', bundle);
console.log('game.bundle.js atualizado.');
