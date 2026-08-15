class SoundService {
  constructor() {
    this.enabled = true;
    this.audioCtx = null;
  }

  getCtx() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioCtx;
  }

  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  play(name) {
    if (!this.enabled) return;
    switch (name) {
      case 'notification':
        this.playTone(800, 0.15);
        setTimeout(() => this.playTone(1000, 0.15), 150);
        break;
      case 'new-ride':
        this.playTone(600, 0.1);
        setTimeout(() => this.playTone(800, 0.1), 100);
        setTimeout(() => this.playTone(1000, 0.2), 200);
        break;
      case 'ride-accepted':
        this.playTone(523, 0.15);
        setTimeout(() => this.playTone(659, 0.15), 150);
        setTimeout(() => this.playTone(784, 0.2), 300);
        break;
      case 'trip-status':
        this.playTone(700, 0.12);
        setTimeout(() => this.playTone(900, 0.12), 120);
        break;
      case 'sos-alert':
        for (let i = 0; i < 3; i++) {
          setTimeout(() => this.playTone(1000, 0.15, 'square'), i * 200);
        }
        break;
      case 'chat-message':
        this.playTone(880, 0.1);
        setTimeout(() => this.playTone(1100, 0.1), 100);
        break;
      default:
        this.playTone(800, 0.15);
    }
  }

  setEnabled(val) {
    this.enabled = val;
  }
}

const soundService = new SoundService();
export default soundService;
