const chalk = require('chalk');
const prompts = require('prompts');
const Launcher = require('./launcher');
const readline = require('readline');
const process = require('process');

// Helper to clear the console
const clearScreen = () => {
  const blank = '\n'.repeat(process.stdout.rows);
  console.log(blank);
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
};

// Helper to wait for key press
const waitForAnyKey = async (message = 'Press any key to continue...') => {
  process.stdin.setRawMode(true);
  return new Promise(resolve => {
    console.log(`\n${chalk.gray(message)}`);
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve();
    });
  });
};

class Menu {
  constructor() {
    this.currentConfig = {
      interval: 4,
      adaptive: true,
      burst: true,
      idleCheck: true,
      lowPriority: true,
      silent: false
    };
    
    // Load saved configuration if available
    this.loadConfig();
  }
  
  loadConfig() {
    try {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(os.homedir(), '.green-dot-config.json');
      
      if (fs.existsSync(configPath)) {
        const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        this.currentConfig = { ...this.currentConfig, ...savedConfig };
      }
    } catch (error) {
      console.error('Warning: Could not load saved configuration:', error.message);
    }
  }
  
  async saveConfig() {
    try {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const configPath = path.join(os.homedir(), '.green-dot-config.json');
      
      fs.writeFileSync(configPath, JSON.stringify(this.currentConfig, null, 2), 'utf8');
    } catch (error) {
      console.error('Warning: Could not save configuration:', error.message);
    }
  }

  async showMainMenu() {
    clearScreen();
    console.log(chalk.green('╔════════════════════════════════════════╗'));
    console.log(chalk.green('║') + '          ' + chalk.bold.white('🟢 GREEN DOT - MAIN MENU') + '         ' + chalk.green('║'));
    console.log(chalk.green('╚════════════════════════════════════════╝\n'));

    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { title: '🚀 Start with current settings', value: 'start' },
        { title: '⚙️  Configure settings', value: 'configure' },
        { title: '📊 View current status', value: 'status' },
        { title: '🛑 Stop all instances', value: 'stop' },
        { title: '❌ Exit', value: 'exit' }
      ]
    });

    switch (action) {
      case 'start':
        await this.startApp();
        break;
      case 'configure':
        await this.showConfigMenu();
        break;
      case 'status':
        await this.showStatus();
        break;
      case 'stop':
        await this.stopInstances();
        break;
      case 'exit':
        console.log('\n👋 Goodbye!\n');
        process.exit(0);
    }
  }

  async showConfigMenu() {
    clearScreen();
    console.log(chalk.blue('╔════════════════════════════════════════╗'));
    console.log(chalk.blue('║') + '          ' + chalk.bold.white('⚙️  CONFIGURATION') + '                   ' + chalk.blue('║'));
    console.log(chalk.blue('╚════════════════════════════════════════╝\n'));

    try {
      // Get interval
      const { interval } = await prompts({
        type: 'number',
        name: 'interval',
        message: 'Interval in minutes (1-60):',
        initial: this.currentConfig.interval,
        validate: value => value >= 1 && value <= 60 ? true : 'Please enter a number between 1 and 60'
      });

      // Get other settings
      const settings = await prompts([
        {
          type: 'toggle',
          name: 'adaptive',
          message: 'Enable AI Adaptive timing?',
          initial: this.currentConfig.adaptive,
          active: 'yes',
          inactive: 'no'
        },
        {
          type: 'toggle',
          name: 'burst',
          message: 'Enable Burst Mode?',
          initial: this.currentConfig.burst,
          active: 'yes',
          inactive: 'no',
          hint: 'Burst mode sends multiple signals in quick succession'
        },
        {
          type: 'toggle',
          name: 'idleCheck',
          message: 'Enable Idle Detection?',
          initial: this.currentConfig.idleCheck,
          active: 'yes',
          inactive: 'no',
          hint: 'Pauses activity when system is idle'
        },
        {
          type: 'toggle',
          name: 'lowPriority',
          message: 'Run in Low Priority Mode?',
          initial: this.currentConfig.lowPriority,
          active: 'yes',
          inactive: 'no',
          hint: 'Reduces impact on system performance'
        },
        {
          type: 'toggle',
          name: 'silent',
          message: 'Run in Background (Silent Mode)?',
          initial: this.currentConfig.silent,
          active: 'yes',
          inactive: 'no',
          hint: 'Runs without showing console window'
        }
      ]);

      // Ask what to do next
      const { action } = await prompts({
        type: 'select',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { title: '✅ Save and Start', value: 'start' },
          { title: '💾 Save and Return to Main Menu', value: 'save' },
          { title: '❌ Cancel', value: 'cancel' }
        ]
      });

      if (action !== 'cancel') {
        this.currentConfig = { 
          ...this.currentConfig, 
          ...settings, 
          interval: interval || this.currentConfig.interval 
        };
        
        // Save the configuration
        await this.saveConfig();
        
        if (action === 'start') {
          await this.startApp();
          return;
        }
      }
    } catch (error) {
      console.error('\n' + chalk.red('❌ Error in configuration:'), error.message);
      await waitForAnyKey('Press any key to continue...');
    }

    await this.showMainMenu();
  }

  async startApp() {
    clearScreen();
    console.log(chalk.green('╔════════════════════════════════════════╗'));
    console.log(chalk.green('║') + '          ' + chalk.bold.white('🚀 STARTING GREEN DOT') + '             ' + chalk.green('║'));
    console.log(chalk.green('╚════════════════════════════════════════╝\n'));
    
    console.log(chalk.bold('Starting with the following settings:'));
    console.log(`   • Interval: ${chalk.cyan(this.currentConfig.interval)} minutes`);
    console.log(`   • AI Adaptive: ${this.currentConfig.adaptive ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`   • Burst Mode: ${this.currentConfig.burst ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`   • Idle Detection: ${this.currentConfig.idleCheck ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`   • Low Priority: ${this.currentConfig.lowPriority ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`   • Silent Mode: ${this.currentConfig.silent ? chalk.green('Enabled') : chalk.red('Disabled')}\n`);

    try {
      // Check for existing instances first
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to continue?',
        initial: true
      });

      if (!confirm) {
        await this.showMainMenu();
        return;
      }

      // Stop any existing instances to avoid conflicts
      try {
        const launcher = new Launcher();
        await launcher.stop();
      } catch (error) {
        // Ignore errors when stopping non-existent instances
      }

      // Start new instance
      const launcherInstance = new Launcher();
      await launcherInstance.start({
        interval: this.currentConfig.interval,
        adaptive: this.currentConfig.adaptive,
        burst: this.currentConfig.burst,
        idleCheck: this.currentConfig.idleCheck,
        lowPriority: this.currentConfig.lowPriority,
        silent: this.currentConfig.silent
      });

      // Set up cleanup on process exit
      this.setupCleanup(launcherInstance);

    } catch (error) {
      console.error('\n' + chalk.red('❌ Error:'), error.message);
      await waitForAnyKey('Press any key to return to the main menu...');
      await this.showMainMenu();
    }
  }

  setupCleanup(launcherInstance) {
    // Handle process termination
    const cleanup = async () => {
      try {
        if (launcherInstance) {
          await launcherInstance.stop();
        }
        process.exit(0);
      } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
      }
    };

    // Handle different termination events
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }

  async showStatus() {
    clearScreen();
    console.log(chalk.blue('╔════════════════════════════════════════╗'));
    console.log(chalk.blue('║') + '          ' + chalk.bold.white('📊 CURRENT STATUS') + '                 ' + chalk.blue('║'));
    console.log(chalk.blue('╚════════════════════════════════════════╝\n'));
    
    // Show current configuration
    console.log(chalk.bold('Current Configuration:'));
    console.log(`   • Interval: ${chalk.cyan(this.currentConfig.interval)} minutes`);
    console.log(`   • AI Adaptive: ${this.currentConfig.adaptive ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`   • Burst Mode: ${this.currentConfig.burst ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`   • Idle Detection: ${this.currentConfig.idleCheck ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`   • Low Priority: ${this.currentConfig.lowPriority ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`   • Silent Mode: ${this.currentConfig.silent ? chalk.green('Enabled') : chalk.red('Disabled')}\n`);
    
    // Show running instances
    console.log(chalk.bold('Running Instances:'));
    try {
      const launcher = new Launcher();
      await launcher.status();
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not retrieve instance status'));
      console.error(chalk.red('Error details:'), error.message);
    }
    
    await waitForAnyKey('\nPress any key to return to the main menu...');
    await this.showMainMenu();
  }

  async stopInstances() {
    clearScreen();
    console.log(chalk.red('╔════════════════════════════════════════╗'));
    console.log(chalk.red('║') + '          ' + chalk.bold.white('🛑 STOPPING INSTANCES') + '             ' + chalk.red('║'));
    console.log(chalk.red('╚════════════════════════════════════════╝\n'));
    
    const spinner = ora('Stopping all green-dot instances...').start();
    
    try {
      await launcher.stop();
      spinner.succeed(chalk.green('All instances have been stopped.'));
    } catch (error) {
      spinner.fail(chalk.red('Error stopping instances'));
      console.error(chalk.red('\nError details:'), error.message);
    }
    
    await waitForAnyKey();
    await this.showMainMenu();
  }
}

module.exports = new Menu();
