import { AudioController } from './js/Audio.js';
import { Game } from './js/Game.js';
import { MenuController } from './js/Menu.js';
import { ScreenController } from './js/Screen.js';

const audio = new AudioController();
const screen = new ScreenController();
const game = new Game({ audio, screen });
const menu = new MenuController({ game, screen, audio });

menu.initialize();
