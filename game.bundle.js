window.__rhythmModules = {};

(() => {
const TRACKS = {
  beethoven: {
    title: 'Für Elise',
    composer: 'Ludwig van Beethoven',
    artwork: 'assets/music/beethoven-fur-elise.jpg',
    phrase: [
      [76, 0], [75, 1], [76, 0], [75, 1], [76, 0], [71, 2], [74, 3],
      [72, 2], [69, 1], [64, 2], [69, 1], [71, 2], [72, 3], [76, 0],
    ],
  },
  atraente: {
    title: 'Atraente',
    composer: 'Chiquinha Gonzaga',
    artwork: 'assets/music/atraente.jpg',
    // Polca leve, com frases curtas, saltos e ritmo regular.
    phrase: [
      [65, 0, 1], [69, 2, 0.5], [72, 3, 0.5], [69, 1, 1],
      [67, 0, 0.5], [69, 2, 0.5], [72, 1, 1.5], [77, 3, 0.5],
      [76, 2, 0.5], [72, 0, 1], [69, 1, 0.5], [67, 3, 0.5],
      [65, 0, 1], [72, 2, 1],
    ],
  },
  brejeiro: {
    title: 'Brejeiro',
    composer: 'Ernesto Nazareth',
    artwork: 'assets/music/brejeiro.jpg',
    // Tango brasileiro sincopado, alternando notas repetidas e contratempos.
    phrase: [
      [73, 1, 1.5], [76, 1, 0.5], [78, 3, 0.5], [76, 0, 1],
      [73, 2, 0.5], [69, 2, 1.5], [71, 0, 0.5], [73, 3, 0.5],
      [76, 1, 1.5], [78, 1, 0.5], [81, 3, 1], [78, 2, 0.5],
      [76, 0, 0.5], [73, 2, 1],
    ],
  },
  odeon: {
    title: 'Odeon',
    composer: 'Ernesto Nazareth',
    artwork: 'assets/music/odeon.jpg',
    // Linha mais grave e ampla, com pausas longas e respostas agudas.
    phrase: [
      [52, 0, 1.5], [59, 3, 1], [64, 1, 0.5], [59, 2, 1],
      [56, 0, 1.5], [63, 3, 0.5], [68, 2, 1], [64, 0, 1],
      [52, 1, 1.5], [59, 3, 0.5], [64, 2, 1], [71, 3, 1.5],
      [68, 1, 0.5], [64, 0, 1],
    ],
  },
};

window.__rhythmModules.TRACKS = TRACKS;
})();

(() => {
const TONE_GAIN = 0.24;

class AudioController {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.volume = 0.34;
  }

  start() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context ??= new AudioContext();
    this.context.resume();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.context.destination);
  }

  playTone(frequency, duration = 0.26) {
    if (!this.context || !this.masterGain) return;

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;

    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(TONE_GAIN, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    oscillator.start();
    oscillator.stop(now + duration + 0.02);
  }

  setVolume(volume) {
    this.volume = volume;
    this.setGain(volume, 0.05);
  }

  mute(duration = 0.03) {
    this.setGain(0.0001, duration);
  }

  restoreVolume(duration = 0.05) {
    this.setGain(this.volume, duration);
  }

  disconnect() {
    if (!this.masterGain) return;
    try {
      this.masterGain.disconnect();
    } catch {
      // O nó pode já ter sido desconectado ao encerrar a partida.
    }
    this.masterGain = null;
  }

  setGain(value, timeConstant) {
    if (!this.masterGain || !this.context) return;
    this.masterGain.gain.setTargetAtTime(
      value,
      this.context.currentTime,
      timeConstant,
    );
  }
}

window.__rhythmModules.AudioController = AudioController;
})();

(() => {
const { TRACKS } = window.__rhythmModules;

const $ = (selector) => document.querySelector(selector);
const screens = [...document.querySelectorAll('.screen')];

class ScreenController {
  show(screenId) {
    screens.forEach((screen) => {
      screen.classList.toggle('active', screen.id === screenId);
    });
    document.body.classList.toggle('game-active', screenId === 'game');
  }

  isActive(screenId) {
    return $(`#${screenId}`).classList.contains('active');
  }

  setPauseVisible(isVisible) {
    $('#pauseOverlay').classList.toggle('show', isVisible);
  }

  showJudgment(result) {
    const element = $('#judgement');
    element.textContent = result;
    element.classList.remove('show');
    void element.offsetWidth;
    element.classList.add('show');
  }

  updateScore(score, combo) {
    $('#score').textContent = String(score).padStart(7, '0');
    $('#combo').textContent = String(combo).padStart(3, '0');
    $('#sideScore').textContent = String(score).padStart(6, '0');
  }

  updateFever(charge, enabled = true) {
    const fill = $('#feverFill');
    const bar = $('#feverBar');
    const label = $('#feverLabel');
    bar.style.display = enabled ? '' : 'none';
    if (!enabled) return;
    const isCharged = charge >= 100;
    fill.style.height = `${charge}%`;
    bar.setAttribute('aria-valuenow', String(Math.round(charge)));
    bar.classList.toggle('charged', isCharged);
    label.textContent = isCharged ? 'FEVER!' : `FEVER ${Math.round(charge)}%`;
  }

  updateMeasure(value) {
    $('#measure').textContent = value;
  }

  updateTrack(title, composer) {
    $('#activeTrackName').textContent = `— ${title.toUpperCase()}`;
    $('#gameArtist').textContent = composer.toUpperCase();
    $('#resultTrackName').textContent = `${title.toUpperCase()} · ${composer.toUpperCase()}`;
  }

  updateLevel(difficulty, chartLevel, noteCount, title, composer) {
    document.querySelectorAll('.diff').forEach((button) => {
      button.classList.toggle('active', button.dataset.diff === difficulty);
    });
    $('#chartLevel').textContent = chartLevel;
    $('#noteCount').textContent = noteCount;
    this.updateTrack(title, composer);
  }

  selectTrack(trackId) {
    document.querySelectorAll('[data-track]').forEach((button) => {
      button.classList.toggle('selected', button.dataset.track === trackId);
    });

    const track = TRACKS[trackId];
    if (!track) return;

    const artwork = $('#selectionArtImage');
    artwork.src = track.artwork;
    artwork.alt = `Capa de ${track.title}, de ${track.composer}`;
    $('#artCaption').textContent = `${track.title.toUpperCase()}\n${track.composer.toUpperCase()}`;
  }

  showResults({ score, maximumCombo, judgments, gameOver }) {
    $('#finalScore').textContent = String(score).padStart(7, '0');
    $('#maxCombo').textContent = String(maximumCombo).padStart(3, '0');
    $('#perfectCount').textContent = judgments.PERFECT;
    $('#greatCount').textContent = judgments.GREAT;
    $('#goodCount').textContent = judgments.GOOD;
    $('#missCount').textContent = judgments.MISS;

    $('#resultEyebrow').innerHTML = gameOver
      ? 'GAME OVER <span>— FEVER ESGOTADO</span>'
      : 'SESSÃO CONCLUÍDA <span>— 04</span>';
    $('#resultTitle').innerHTML = gameOver
      ? 'FIM DE <em>JOGO.</em>'
      : 'BELO <em>RITMO.</em>';
    $('#retryButton').innerHTML = gameOver
      ? 'TENTAR DE NOVO <span>↻</span>'
      : 'JOGAR DE NOVO <span>↗</span>';
    this.show('result');
  }
}

window.__rhythmModules.ScreenController = ScreenController;
})();

(() => {
const { TRACKS } = window.__rhythmModules;

const $ = (selector) => document.querySelector(selector);

const TRAVEL_DISTANCE = 1450;
const NOTE_HEIGHT = 17;
const HIT_LINE_CENTER_OFFSET = 87;
const BEAT_INTERVAL = 0.5;
const HIT_WINDOWS = [
  { maximum: 0.065, result: 'PERFECT', points: 1000 },
  { maximum: 0.13, result: 'GREAT', points: 750 },
  { maximum: 0.2, result: 'GOOD', points: 500 },
];
const FEVER_CHARGE = { PERFECT: 4, GREAT: 3, GOOD: 2 };

const LEVELS = {
  EASY: { label: 'LV. 03', repeats: 7, extraEvery: 0 },
  MEDIUM: { label: 'LV. 06', repeats: 7, extraEvery: 3 },
  HARD: { label: 'LV. 08', repeats: 7, extraEvery: 2 },
};

function createNote(id, lane, time, frequency) {
  return {
    id,
    lane,
    time,
    frequency,
    hit: false,
    missed: false,
    audioPlayed: false,
    element: null,
  };
}

class Game {
  constructor({ audio, screen }) {
    this.audio = audio;
    this.screen = screen;
    this.selectedLevel = 'EASY';
    this.selectedTrack = 'beethoven';
    this.running = false;
    this.paused = false;
    this.frame = 0;
    this.startTime = 0;
    this.pauseTime = 0;
    this.pausedDuration = 0;
    this.notes = [];
    this.judgments = {};
    this.combo = 0;
    this.maximumCombo = 0;
    this.score = 0;
    this.feverCharge = 50;
    this.feverEnabled = true;
    this.noteSpeed = 1;
    this.effectsEnabled = true;
    this.playfieldHeight = 0;
    this.lastMeasure = '';
    window.addEventListener('resize', () => this.updatePlayfieldSize());
  }

  get isRunning() { return this.running; }
  get isPaused() { return this.paused; }

  selectLevel(level) {
    if (!LEVELS[level]) return;
    this.selectedLevel = level;
    this.screen.updateLevel(
      level,
      LEVELS[level].label,
      this.createChart(level).length,
      this.currentTrack.title,
      this.currentTrack.composer,
    );
  }

  selectTrack(trackId) {
    if (!TRACKS[trackId]) return;
    this.selectedTrack = trackId;
    this.screen.selectTrack(trackId);
    this.selectLevel(this.selectedLevel);
  }

  get currentTrack() { return TRACKS[this.selectedTrack]; }

  setSpeed(speed) { this.noteSpeed = speed; }
  setEffects(enabled) { this.effectsEnabled = enabled; }
  setFeverEnabled(enabled) {
    this.feverEnabled = enabled;
    this.feverCharge = 50;
    this.screen.updateFever(this.feverCharge, this.feverEnabled);
  }

  start() {
    this.screen.show('game');
    this.stop();
    this.updatePlayfieldSize();
    this.notes = this.createChart();
    this.judgments = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    this.combo = 0;
    this.maximumCombo = 0;
    this.score = 0;
    this.feverCharge = 50;
    this.pausedDuration = 0;
    this.paused = false;
    this.lastMeasure = '';

    this.screen.updateTrack(this.currentTrack.title, this.currentTrack.composer);
    this.screen.updateScore(this.score, this.combo);
    this.screen.updateFever(this.feverCharge, this.feverEnabled);
    this.screen.showJudgment('READY?');
    this.screen.setPauseVisible(false);
    this.createNoteElements();
    this.audio.start();
    this.startTime = performance.now() + 1100;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    this.paused = false;
    cancelAnimationFrame(this.frame);
    this.audio.disconnect();
  }

  togglePause() {
    if (!this.running) return;
    if (this.paused) {
      this.resume();
      return;
    }
    this.paused = true;
    this.pauseTime = performance.now();
    this.screen.setPauseVisible(true);
    this.audio.mute();
  }

  resume() {
    if (!this.paused) return;
    this.pausedDuration += performance.now() - this.pauseTime;
    this.paused = false;
    this.screen.setPauseVisible(false);
    this.audio.restoreVolume();
  }

  finish({ fromQuit = false, gameOver = false } = {}) {
    if (!this.running && !fromQuit) return;
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.audio.mute(0.04);
    this.screen.showResults({
      score: this.score,
      maximumCombo: this.maximumCombo,
      judgments: this.judgments,
      gameOver,
    });
  }

  pressLane(lane) {
    if (!this.running || this.paused) return;
    const elapsed = this.elapsedTime(performance.now());
    const laneElement = $(`#lanes .lane[data-lane="${lane}"]`);
    this.flashLane(laneElement);
    const note = this.findClosestNote(lane, elapsed);
    if (!note) {
      this.screen.showJudgment('');
      return;
    }

    const judgment = HIT_WINDOWS.find((window) => Math.abs(note.time - elapsed) <= window.maximum);
    if (!judgment) {
      this.screen.showJudgment('');
      return;
    }

    note.hit = true;
    note.element.remove();
    this.judgments[judgment.result] += 1;
    this.combo += 1;
    this.maximumCombo = Math.max(this.combo, this.maximumCombo);
    this.score += judgment.points;
    if (this.feverEnabled) {
      this.feverCharge = Math.min(100, this.feverCharge + FEVER_CHARGE[judgment.result]);
      this.screen.updateFever(this.feverCharge, this.feverEnabled);
    }
    this.screen.showJudgment(judgment.result);
    this.screen.updateScore(this.score, this.combo);
    this.applyHitEffect(laneElement, judgment.result);
  }

  createChart(level = this.selectedLevel) {
    const settings = LEVELS[level];
    const baseNotes = [];
    let beatPosition = 0;
    let noteIndex = 0;

    for (let repeat = 0; repeat < settings.repeats; repeat += 1) {
      this.currentTrack.phrase.forEach(([number, lane, beatLength = 1]) => {
        baseNotes.push(createNote(
          noteIndex * 2,
          lane,
          1.4 + beatPosition * BEAT_INTERVAL,
          this.frequencyFor(number),
        ));
        beatPosition += beatLength;
        noteIndex += 1;
      });
    }

    const chart = baseNotes.flatMap((note, index) => {
      if (settings.extraEvery === 0 || index % settings.extraEvery !== 1) return [note];
      const medium = level === 'MEDIUM';
      const extraNote = createNote(
        1000 + index,
        (note.lane + (medium ? 1 : 2)) % 4,
        note.time + 0.23,
        note.frequency * (medium ? 1.122462 : 0.749154),
      );
      return [note, extraNote];
    });
    return chart.sort((first, second) => first.time - second.time);
  }

  createNoteElements() {
    $('#lanes').querySelectorAll('.note').forEach((element) => element.remove());
    const lanes = [...$('#lanes').querySelectorAll('.lane')];

    this.notes.forEach((note) => {
      const element = document.createElement('div');
      element.className = 'note';
      element.dataset.id = note.id;
      element.style.top = '0';
      element.style.visibility = 'hidden';
      lanes[note.lane].append(element);
      note.element = element;
    });
  }

  loop(now = performance.now()) {
    if (!this.running) return;
    if (this.paused) {
      this.frame = requestAnimationFrame((time) => this.loop(time));
      return;
    }
    const elapsed = this.elapsedTime(now);
    const hitLineCenter = this.playfieldHeight - HIT_LINE_CENTER_OFFSET;
    const travelHeight = hitLineCenter - NOTE_HEIGHT / 2;

    for (const note of this.notes) {
      if (note.hit || note.missed) continue;
      this.updateNotePosition(note, elapsed, travelHeight);
      this.playNoteAudio(note, elapsed);
      this.markMissedNote(note, elapsed);
      if (!this.running) return;
    }
    this.updateMeasure(elapsed);
    const lastNote = this.notes[this.notes.length - 1];
    if (elapsed > lastNote.time + 1.2) {
      this.finish();
      return;
    }
    this.frame = requestAnimationFrame((time) => this.loop(time));
  }

  updateNotePosition(note, elapsed, travelHeight) {
    const untilHit = elapsed - note.time;
    const visible = elapsed >= note.time - TRAVEL_DISTANCE / 1000 / this.noteSpeed;
    if (!visible) return;
    const progress = (untilHit * this.noteSpeed * 1000 + TRAVEL_DISTANCE) / TRAVEL_DISTANCE;
    const percent = Math.max(-4, Math.min(100, progress * 100));
    note.element.style.visibility = percent <= 15 ? 'hidden' : 'visible';
    note.element.style.transform = `translate3d(0, ${percent * travelHeight / 100}px, 0)`;
  }

  playNoteAudio(note, elapsed) {
    if (elapsed < note.time - 0.018 || note.audioPlayed) return;
    this.audio.playTone(note.frequency, note.frequency < 180 ? 0.4 : 0.24);
    note.audioPlayed = true;
  }

  markMissedNote(note, elapsed) {
    if (elapsed - note.time <= 0.19) return;
    note.missed = true;
    note.element.remove();
    this.screen.showJudgment('MISS');
    this.judgments.MISS += 1;
    this.combo = 0;
    if (this.feverEnabled) {
      this.feverCharge = Math.max(0, this.feverCharge - 5);
      this.screen.updateFever(this.feverCharge, this.feverEnabled);
      if (this.feverCharge === 0) {
        this.finish({ gameOver: true });
        return;
      }
    }
    this.screen.updateScore(this.score, this.combo);
  }

  updateMeasure(elapsed) {
    const measure = `${String(Math.max(1, Math.floor(Math.max(0, elapsed) / 2) + 1)).padStart(2, '0')}—01`;
    if (measure === this.lastMeasure) return;
    this.screen.updateMeasure(measure);
    this.lastMeasure = measure;
  }

  findClosestNote(lane, elapsed) {
    let closestNote = null;
    let closestOffset = Infinity;

    for (const note of this.notes) {
      if (note.lane !== lane || note.hit || note.missed) continue;
      const offset = Math.abs(note.time - elapsed);
      if (offset < closestOffset) {
        closestNote = note;
        closestOffset = offset;
      }
    }

    return closestNote;
  }

  updatePlayfieldSize() {
    if (this.screen.isActive('game')) this.playfieldHeight = $('#playfield').clientHeight;
  }

  elapsedTime(now) { return (now - this.startTime - this.pausedDuration) / 1000; }
  frequencyFor(number) { return 440 * 2 ** ((number - 69) / 12); }

  flashLane(lane) {
    lane.classList.add('pressed');
    setTimeout(() => lane.classList.remove('pressed'), 90);
  }

  applyHitEffect(lane, judgment) {
    if (!this.effectsEnabled || judgment !== 'PERFECT') return;
    lane.style.boxShadow = 'inset 0 0 35px #4fffe04c';
    setTimeout(() => { lane.style.boxShadow = ''; }, 170);
  }
}

window.__rhythmModules.Game = Game;
})();

(() => {
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const LANE_KEYS = { d: 0, f: 1, j: 2, k: 3 };
const ARROW_LANES = { arrowleft: 0, arrowdown: 1, arrowup: 2, arrowright: 3 };

class MenuController {
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

window.__rhythmModules.MenuController = MenuController;
})();

const { AudioController, Game, MenuController, ScreenController } = window.__rhythmModules;

const audio = new AudioController();
const screen = new ScreenController();
const game = new Game({ audio, screen });
const menu = new MenuController({ game, screen, audio });

menu.initialize();


delete window.__rhythmModules;