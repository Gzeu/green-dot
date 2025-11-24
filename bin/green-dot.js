#!/usr/bin/env node

'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const updateNotifier = require('update-notifier');
const launcher = require('../lib/launcher');
const pkg = require('../package.json');

// Check for updates
const notifier = updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 });
if (notifier.update) {
  notifier.notify({
    message: `Update available ${chalk.dim(notifier.update.current)} → ${chalk.green(notifier.update.latest)}\nRun ${chalk.cyan('npm i -g green-dot')} to update`
  });
}

const banner = `
${chalk.green('╔════════════════════════════════════════╗')}
${chalk.green('║')}          ${chalk.bold.white('🟢 GREEN DOT v' + pkg.version)}         ${chalk.green('║')}
${chalk.green('║')}    ${chalk.gray('AI-Powered Status Keeper')}         ${chalk.green('║')}
${chalk.green('╚════════════════════════════════════════╝')}
`;

program
  .name('green-dot')
  .description('🟢 Keep your Teams & Messenger status green with AI-powered automation')
  .version(pkg.version, '-v, --version')
  .option('-i, --interval <minutes>', 'Interval in minutes (default: 4)', '4')
  .option('-s, --silent', 'Run in silent mode (background)')
  .option('-a, --adaptive', 'Enable AI adaptive timing (default: true)', true)
  .option('-b, --burst', 'Enable burst mode (default: true)', true)
  .option('-l, --low-priority', 'Run with low priority (default: true)', true)
  .option('--no-idle-check', 'Disable user idle detection')
  .option('--no-adaptive', 'Disable AI adaptive timing')
  .option('--no-burst', 'Disable burst mode')
  .option('--no-low-priority', 'Disable low priority mode')
  .option('--test', 'Test mode (1 minute interval)')
  .option('--stop', 'Stop all running instances')
  .option('--status', 'Show status of running instances')
  .option('--config', 'Show current configuration')
  .parse(process.argv);

const options = program.opts();

(async () => {
  try {
    if (options.stop) {
      console.log(chalk.yellow('\n🛑 Stopping all green-dot instances...\n'));
      await launcher.stop();
      console.log(chalk.green('✓ All instances stopped!\n'));
      process.exit(0);
    }

    if (options.status) {
      console.log(chalk.cyan('\n📊 Checking status...\n'));
      await launcher.status();
      process.exit(0);
    }

    if (options.config) {
      console.log(chalk.cyan('\n⚙️  Current Configuration:\n'));
      const config = require('../lib/config');
      console.log(JSON.stringify(config.data, null, 2));
      console.log(chalk.gray(`\nConfig file: ${config.getConfigPath()}\n`));
      process.exit(0);
    }

    if (options.test) {
      console.log(chalk.yellow('\n🧪 Starting in TEST mode (1 min interval)...\n'));
      options.interval = '1';
      options.silent = false;
    }

    if (!options.silent) {
      console.log(banner);
      console.log(chalk.white('🚀 Starting green-dot...'));
      console.log(chalk.gray(`   Interval: ${options.interval} minutes`));
      console.log(chalk.gray(`   Mode: ${options.adaptive ? '🧠 AI Adaptive' : '🎲 Standard'}`));
      
      const features = [];
      if (options.burst) features.push('⚡Burst');
      if (!options.noIdleCheck) features.push('👤Idle');
      if (options.lowPriority) features.push('🔇Stealth');
      
      if (features.length > 0) {
        console.log(chalk.gray(`   Features: ${features.join(' ')}`));
      }
      console.log('');
    }

    await launcher.start(options);

  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
})();

process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ Unexpected error:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Unhandled rejection:'), error.message);
  process.exit(1);
});