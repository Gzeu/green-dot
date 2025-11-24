'use strict';

const chalk = require('chalk');
const Utils = require('./utils');

try {
  Utils.checkPlatform();

  console.log('');
  console.log(chalk.green('✓') + ' green-dot installed successfully!');
  console.log('');
  console.log(chalk.bold('Quick Start:'));
  console.log(chalk.cyan('  gd') + chalk.gray('              # Start with defaults'));
  console.log(chalk.cyan('  gd --silent') + chalk.gray('     # Run in background'));
  console.log(chalk.cyan('  gd --help') + chalk.gray('       # Show all options'));
  console.log('');
  console.log(chalk.gray('Documentation: ') + chalk.blue('https://github.com/Gzeu/green-dot'));
  console.log('');
} catch (error) {
  console.error('');
  console.error(chalk.red('❌ Error: ') + error.message);
  console.error(chalk.yellow('\ngreen-dot only works on Windows.'));
  console.error('');
  process.exit(1);
}