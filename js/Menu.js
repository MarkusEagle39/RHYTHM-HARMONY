const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const LANE_KEYS = { d: 0, f: 1, j: 2, k: 3 };
const ARROW_LANES = { arrowleft: 0, arrowdown: 1, arrowup: 2, arrowright: 3 };

export class MenuController {
  constructor({ game, screen, audio }) {
    this.game = game;
    this.screen = screen;
    this.audio = audio;
  }

  initialize() {
    this.bindButtons();
    this.bindSettings();
    document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    this.game.selectLevel('EASY');
  }

  bindButtons() {
    $('#startSelect').onclick = () => this.screen.show('select');
    $('#goMusic').onclick = () => this.screen.show('select');
    $('#homeSettings').onclick = () => this.openSettings();
    $('#creditsButton').onclick = () => window.alert('RHYTHM HARMONY · Protótipo de jogo de ritmo\nTemas de Beethoven sintetizados localmente.');
    $$('[data-screen]').forEach((button) => { button.onclick = () => this.screen.show(button.dataset.screen); });
    $$('.diff').forEach((button) => { button.onclick = () => this.game.selectLevel(button.dataset.diff); });
    $$('[data-track]').forEach((button) => {
      button.onclick = () => this.game.selectTrack(button.dataset.track);
    });
    $('#playNow').onclick = () => this.game.start();
    $('#retryButton').onclick = () => this.game.start();
    $('#pauseButton').onclick = () => this.game.togglePause();
    $('#resumeButton').onclick = () => this.game.resume();
    $('#restartButton').onclick = () => this.game.start();
    $('#pauseSettings').onclick = () => this.openSettings();
    $$('.touch-key').forEach((button) => {
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        this.game.pressLane(Number(button.dataset.lane));
      });
    });
    $('#quitButton').onclick = () => {
      this.game.stop();
      this.game.finish({ fromQuit: true });
    };
    $('#skipButton').onclick = () => this.game.finish();
    $('#openSettings').onclick = () => this.openSettings();
    $('#closeSettings').onclick = () => this.closeSettings();
    $('#settingsModal').onclick = (event) => {
      if (event.target.id === 'settingsModal') this.closeSettings();
    };
  }

  bindSettings() {
    $('#volume').oninput = (event) => {
      const volume = Number(event.target.value) / 100;
      $('#volumeLabel').textContent = `${event.target.value}%`;
      this.audio.setVolume(volume);
    };
    $('#speed').onchange = (event) => this.game.setSpeed(Number(event.target.value));
    $('#effects').onchange = (event) => {
      const enabled = event.target.value === 'on';
      this.game.setEffects(enabled);
      document.body.classList.toggle('reduced-effects', !enabled);
    };
    $('#feverToggle').onchange = (event) => {
      this.game.setFeverEnabled(event.target.value === 'on');
    };
  }

  openSettings() { $('#settingsModal').classList.add('show'); }
  closeSettings() { $('#settingsModal').classList.remove('show'); }

  handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (Object.hasOwn(ARROW_LANES, key)) {
      this.handleArrowKey(event, key);
      return;
    }
    if (key === 'backspace') {
      event.preventDefault();
      this.handleBackspace();
      return;
    }
    if (key === 'enter') {
      this.handleEnter(event);
      return;
    }
    if (Object.hasOwn(LANE_KEYS, key)) {
      event.preventDefault();
      this.game.pressLane(LANE_KEYS[key]);
    }
    if (key === 'escape' && this.game.isRunning) this.game.togglePause();
  }

  handleArrowKey(event, key) {
    const menuIsOpen = ['home', 'select', 'result'].some((id) => this.screen.isActive(id))
      || $('#settingsModal').classList.contains('show');
    if (this.game.isPaused || menuIsOpen) {
      const editing = $('#settingsModal').classList.contains('show') && event.target.matches('input, select');
      if (!editing) {
        event.preventDefault();
        this.moveFocus(event.key);
      }
      return;
    }
    if (this.game.isRunning) {
      event.preventDefault();
      this.game.pressLane(ARROW_LANES[key]);
    }
  }

  handleEnter(event) {
    const editing = $('#settingsModal').classList.contains('show') && event.target.matches('input, select');
    if (editing) return;
    event.preventDefault();
    const items = this.navigationItems();
    const focused = items.includes(document.activeElement) ? document.activeElement : null;
    if (focused) focused.click();
    else if ($('#settingsModal').classList.contains('show')) $('#closeSettings').click();
    else if (this.screen.isActive('home')) this.screen.show('select');
    else if (this.screen.isActive('select') || this.screen.isActive('result')) this.game.start();
    else if (this.game.isPaused) this.game.resume();
  }

  handleBackspace() {
    if ($('#settingsModal').classList.contains('show')) this.closeSettings();
    else if (this.game.isPaused) this.game.resume();
    else if (this.screen.isActive('game')) this.game.togglePause();
    else if (this.screen.isActive('result')) this.screen.show('select');
    else if (this.screen.isActive('select')) this.screen.show('home');
  }

  navigationItems() {
    if ($('#settingsModal').classList.contains('show')) return this.visible('#settingsModal button, #settingsModal input, #settingsModal select');
    if (this.game.isPaused) return this.visible('#pauseOverlay button');
    if (this.screen.isActive('home')) return [...this.visible('.home-nav .home-link'), $('#openSettings')];
    if (this.screen.isActive('select')) return [...this.visible('[data-track]'), ...this.visible('.diff'), $('#playNow'), ...this.visible('#select [data-screen]')];
    if (this.screen.isActive('result')) return [$('#retryButton'), ...this.visible('#result [data-screen]')];
    return [];
  }

  visible(selector) { return $$(selector).filter((element) => element.getClientRects().length > 0); }

  moveFocus(direction) {
    const items = this.navigationItems();
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement);
    if (currentIndex < 0) {
      items[direction === 'ArrowUp' || direction === 'ArrowLeft' ? items.length - 1 : 0].focus();
      return;
    }
    const current = items[currentIndex].getBoundingClientRect();
    const centerX = current.left + current.width / 2;
    const centerY = current.top + current.height / 2;
    const vector = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[direction];
    let nearest = null;
    let nearestScore = Infinity;
    items.forEach((item, index) => {
      if (index === currentIndex) return;
      const rect = item.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - centerX;
      const dy = rect.top + rect.height / 2 - centerY;
      const forward = dx * vector[0] + dy * vector[1];
      if (forward <= 0) return;
      const score = forward + Math.abs(dx * vector[1] - dy * vector[0]) * 1.8;
      if (score < nearestScore) { nearestScore = score; nearest = item; }
    });
    if (nearest) nearest.focus();
    else items[direction === 'ArrowUp' || direction === 'ArrowLeft' ? items.length - 1 : 0].focus();
  }
}
