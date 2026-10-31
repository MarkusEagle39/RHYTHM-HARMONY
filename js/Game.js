import { TRACKS } from './tracks.js';

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

export class Game {
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
