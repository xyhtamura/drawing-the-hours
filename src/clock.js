/**
 * Drawing the Hours — Visit Clock
 * Counts a visit's time down. src/hour-clock.js draws it, as a sheet of the
 * hour's paper crossing the field.
 */

export class VisitClock {
  constructor(totalSeconds = 60) {
    this.totalSeconds = totalSeconds;
    this.remainingSeconds = totalSeconds;
    this.isPaused = false;
    this.isExpired = false;
  }

  reset(seconds = 60) {
    this.totalSeconds = seconds;
    this.remainingSeconds = seconds;
    this.isPaused = false;
    this.isExpired = false;
  }

  addTime(seconds) {
    this.remainingSeconds = Math.min(this.totalSeconds + 15, this.remainingSeconds + seconds);
  }

  update(dt) {
    if (this.isPaused || this.isExpired) return;
    this.remainingSeconds = Math.max(0, this.remainingSeconds - dt);
    if (this.remainingSeconds <= 0) this.isExpired = true;
  }
}
