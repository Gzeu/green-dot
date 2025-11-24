'use strict';

const os = require('os');

class Utils {
  static isWindows() {
    return os.platform() === 'win32';
  }

  static checkPlatform() {
    if (!this.isWindows()) {
      throw new Error('green-dot only supports Windows platform');
    }
  }

  static randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`;
  }

  static getSystemIdleTime() {
    // Returns system idle time in seconds
    // Requires Windows API access via PowerShell
    return 0; // Placeholder - implemented in PowerShell script
  }
}

module.exports = Utils;