'use strict';

const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const ora = require('ora');

class Launcher {
  constructor() {
    this.scriptPath = path.join(__dirname, '..', 'scripts', 'KeepActive.ps1');
  }

  async start(options) {
    const spinner = ora('Launching green-dot...').start();

    try {
      // Build PowerShell command
      const interval = parseInt(options.interval) || 4;
      const adaptive = options.adaptive !== false;
      const burst = options.burst !== false;
      const idleCheck = options.idleCheck !== false;
      const lowPriority = options.lowPriority !== false;

      const psCommand = `powershell.exe -ExecutionPolicy Bypass -File "${this.scriptPath}" -IntervalMinutes ${interval} -Adaptive:$${adaptive} -BurstMode:$${burst} -CheckIdle:$${idleCheck} -LowPriority:$${lowPriority}`;

      if (options.silent) {
        // Background mode
        const child = spawn('powershell.exe', [
          '-WindowStyle', 'Hidden',
          '-ExecutionPolicy', 'Bypass',
          '-File', this.scriptPath,
          '-IntervalMinutes', interval.toString(),
          `-Adaptive:$${adaptive}`,
          `-BurstMode:$${burst}`,
          `-CheckIdle:$${idleCheck}`,
          `-LowPriority:$${lowPriority}`
        ], {
          detached: true,
          stdio: 'ignore'
        });

        child.unref();
        spinner.succeed(chalk.green('✓ Green-dot started in background mode!'));
        console.log(chalk.gray('\nUse ') + chalk.cyan('gd --status') + chalk.gray(' to check status'));
        console.log(chalk.gray('Use ') + chalk.cyan('gd --stop') + chalk.gray(' to stop all instances\n'));
      } else {
        // Foreground mode
        spinner.succeed(chalk.green('✓ Green-dot is running...'));
        console.log(chalk.gray('\nPress ') + chalk.red('Ctrl+C') + chalk.gray(' to stop\n'));

        const child = spawn('powershell.exe', [
          '-ExecutionPolicy', 'Bypass',
          '-File', this.scriptPath,
          '-IntervalMinutes', interval.toString(),
          `-Adaptive:$${adaptive}`,
          `-BurstMode:$${burst}`,
          `-CheckIdle:$${idleCheck}`,
          `-LowPriority:$${lowPriority}`
        ], {
          stdio: 'inherit'
        });

        child.on('error', (error) => {
          console.error(chalk.red('\n❌ Error:'), error.message);
          process.exit(1);
        });

        child.on('exit', (code) => {
          if (code !== 0 && code !== null) {
            console.error(chalk.red(`\n❌ Process exited with code ${code}`));
            process.exit(code);
          }
        });
      }
    } catch (error) {
      spinner.fail(chalk.red('❌ Failed to start green-dot'));
      throw error;
    }
  }

  async stop() {
    return new Promise((resolve, reject) => {
      const command = 'powershell.exe -Command "Get-Process | Where-Object {$_.MainWindowTitle -match \'KeepActive\' -or $_.CommandLine -match \'KeepActive\'} | Stop-Process -Force"';
      
      exec(command, (error, stdout, stderr) => {
        if (error && !error.message.includes('Cannot find a process')) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async status() {
    return new Promise((resolve, reject) => {
      const command = 'powershell.exe -Command "Get-Process | Where-Object {$_.MainWindowTitle -match \'KeepActive\' -or $_.CommandLine -match \'KeepActive\'} | Select-Object Id, ProcessName, StartTime"';
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.log(chalk.yellow('⚠️  No green-dot instances found'));
          resolve();
        } else if (stdout.trim()) {
          console.log(chalk.green('✓ Active green-dot instances:'));
          console.log(stdout);
          resolve();
        } else {
          console.log(chalk.yellow('⚠️  No green-dot instances found'));
          resolve();
        }
      });
    });
  }
}

module.exports = new Launcher();