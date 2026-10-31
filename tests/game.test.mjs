import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import test from 'node:test';

globalThis.window ??= { addEventListener() {} };
globalThis.cancelAnimationFrame ??= () => {};

const { Game } = await import('../js/Game.js');
const { TRACKS } = await import('../js/tracks.js');

function createGame() {
  const calls = { levels: [], results: [], fever: [], score: [] };
  const screen = {
    updateLevel: (...args) => calls.levels.push(args),
    selectTrack() {},
    updateFever: (...args) => calls.fever.push(args),
    updateScore: (...args) => calls.score.push(args),
    showResults: (result) => calls.results.push(result),
    showJudgment() {},
  };
  const audio = { mute() {}, disconnect() {} };
  return { game: new Game({ audio, screen }), calls };
}

test('catálogo tem quatro faixas com motivos válidos e arte local', async () => {
  assert.deepEqual(Object.keys(TRACKS), ['beethoven', 'atraente', 'brejeiro', 'odeon']);

  for (const track of Object.values(TRACKS)) {
    assert.ok(track.title);
    assert.ok(track.composer);
    assert.ok(track.phrase.length > 0);
    await access(new URL(`../${track.artwork}`, import.meta.url));

    for (const [pitch, lane, beatLength = 1] of track.phrase) {
      assert.ok(Number.isFinite(pitch));
      assert.ok(Number.isInteger(lane) && lane >= 0 && lane < 4);
      assert.ok(Number.isFinite(beatLength) && beatLength > 0);
    }
  }
});

test('dificuldades geram charts ordenados, com densidade crescente e menos de um minuto', () => {
  const { game } = createGame();
  const levels = ['EASY', 'MEDIUM', 'HARD'];

  for (const trackId of Object.keys(TRACKS)) {
    game.selectedTrack = trackId;
    const charts = levels.map((level) => game.createChart(level));

    assert.ok(charts[0].length < charts[1].length);
    assert.ok(charts[1].length < charts[2].length);

    for (const chart of charts) {
      const times = chart.map(({ time }) => time);
      assert.deepEqual(times, [...times].sort((a, b) => a - b));
      assert.equal(new Set(chart.map(({ id }) => id)).size, chart.length);
      assert.ok(chart.every(({ lane, frequency }) => lane >= 0 && lane < 4 && frequency > 0));
      assert.ok(chart.at(-1).time + 1.1 + 1.2 < 60);
    }

    const baseNotes = charts.map((chart) => chart.filter(({ id }) => id < 1000));
    assert.deepEqual(baseNotes[1], baseNotes[0]);
    assert.deepEqual(baseNotes[2], baseNotes[0]);
  }
});

test('seleção de faixa e dificuldade atualiza o estado e a tela', () => {
  const { game, calls } = createGame();

  game.selectTrack('odeon');
  assert.equal(game.selectedTrack, 'odeon');
  assert.equal(game.selectedLevel, 'EASY');
  assert.equal(calls.levels.at(-1)[0], 'EASY');
  assert.equal(calls.levels.at(-1)[3], TRACKS.odeon.title);

  game.selectLevel('HARD');
  assert.equal(game.selectedLevel, 'HARD');
  assert.equal(calls.levels.at(-1)[0], 'HARD');
  assert.equal(calls.levels.at(-1)[2], game.createChart('HARD').length);

  const updateCount = calls.levels.length;
  game.selectLevel('IMPOSSIBLE');
  game.selectTrack('unknown-track');
  assert.equal(calls.levels.length, updateCount);
  assert.equal(game.selectedTrack, 'odeon');
});

test('julgamentos incrementam score, combo e Fever de acordo com a precisão', () => {
  const originalDocument = globalThis.document;
  const originalSetTimeout = globalThis.setTimeout;
  const laneElement = { classList: { add() {}, remove() {} }, style: {} };
  globalThis.document = { querySelector: () => laneElement };
  globalThis.setTimeout = () => 0;

  try {
    for (const [offset, expectedJudgment, points, fever] of [
      [0.02, 'PERFECT', 1000, 4],
      [0.09, 'GREAT', 750, 3],
      [0.17, 'GOOD', 500, 2],
    ]) {
      const { game, calls } = createGame();
      game.running = true;
      game.effectsEnabled = false;
      game.startTime = performance.now() - 10_000;
      game.judgments = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
      const elapsed = game.elapsedTime(performance.now());
      game.notes = [{
        id: 1,
        lane: 0,
        time: elapsed + offset,
        frequency: 440,
        hit: false,
        missed: false,
        element: { remove() {} },
      }];

      game.pressLane(0);

      assert.equal(game.judgments[expectedJudgment], 1);
      assert.equal(game.score, points);
      assert.equal(game.combo, 1);
      assert.equal(game.feverCharge, 50 + fever);
      assert.equal(calls.score.at(-1)[0], points);
    }
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('nota perdida zera a Fever e encerra a partida com Game Over', () => {
  const { game, calls } = createGame();
  const note = { time: 2, element: { remove() {} } };
  game.running = true;
  game.feverCharge = 5;
  game.judgments = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
  game.combo = 7;

  game.markMissedNote(note, 2.2);

  assert.equal(note.missed, true);
  assert.equal(game.feverCharge, 0);
  assert.equal(game.combo, 0);
  assert.equal(game.running, false);
  assert.equal(calls.results.length, 1);
  assert.equal(calls.results[0].gameOver, true);
});

test('Fever desativada não encerra a partida por erro', () => {
  const { game, calls } = createGame();
  game.running = true;
  game.feverEnabled = false;
  game.feverCharge = 0;
  game.judgments = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };

  game.markMissedNote({ time: 1, element: { remove() {} } }, 1.2);

  assert.equal(game.running, true);
  assert.equal(game.feverCharge, 0);
  assert.equal(calls.results.length, 0);
  assert.equal(game.judgments.MISS, 1);
});
