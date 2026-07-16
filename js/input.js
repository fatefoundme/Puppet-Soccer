import { KEYS } from './constants.js';

export class InputManager {
  constructor() {
    this.keys = {};
    this._onDown = this._onDown.bind(this);
    this._onUp = this._onUp.bind(this);
    window.addEventListener('keydown', this._onDown);
    window.addEventListener('keyup', this._onUp);
  }

  _onDown(e) {
    if (Object.values(KEYS).includes(e.code)) {
      e.preventDefault();
      this.keys[e.code] = true;
    }
  }

  _onUp(e) {
    if (Object.values(KEYS).includes(e.code)) {
      e.preventDefault();
      this.keys[e.code] = false;
    }
  }

  isDown(code) {
    return !!this.keys[code];
  }

  destroy() {
    window.removeEventListener('keydown', this._onDown);
    window.removeEventListener('keyup', this._onUp);
  }
}
