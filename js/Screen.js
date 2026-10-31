import { TRACKS } from './tracks.js';

const $ = (selector) => document.querySelector(selector);
const screens = [...document.querySelectorAll('.screen')];

export class ScreenController {
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
