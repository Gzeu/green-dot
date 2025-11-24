'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

class Config {
  constructor() {
    this.configDir = path.join(os.homedir(), '.green-dot');
    this.configFile = path.join(this.configDir, 'config.json');
    this.data = this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }

      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults');
    }

    return this.getDefaults();
  }

  save() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      fs.writeFileSync(this.configFile, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error.message);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  getDefaults() {
    return {
      interval: 4,
      adaptive: true,
      burst: true,
      idleCheck: true,
      lowPriority: true,
      version: require('../package.json').version
    };
  }

  getConfigPath() {
    return this.configFile;
  }
}

module.exports = new Config();