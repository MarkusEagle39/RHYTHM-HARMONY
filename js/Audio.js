const TONE_GAIN = 0.24;

export class AudioController {
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
