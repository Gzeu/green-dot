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

      // Build parameters array
      const params = [
        '-ExecutionPolicy', 'Bypass',
        '-File', this.scriptPath,
        '-IntervalMinutes', interval.toString()
      ];
      
      // Only add switch parameters if they are true
      if (adaptive) params.push('-Adaptive');
      if (burst) params.push('-BurstMode');
      if (idleCheck) params.push('-CheckIdle');
      if (lowPriority) params.push('-LowPriority');
      
      // For logging purposes only
      const psCommand = `powershell.exe -ExecutionPolicy Bypass -File "${this.scriptPath}" ${params.slice(4).join(' ')}`;

      if (options.silent) {
        // Background mode - use the same parameter approach but with hidden window
        const silentParams = [
          '-WindowStyle', 'Hidden',
          '-ExecutionPolicy', 'Bypass',
          '-File', this.scriptPath,
          '-IntervalMinutes', interval.toString()
        ];
        
        if (adaptive) silentParams.push('-Adaptive');
        if (burst) silentParams.push('-BurstMode');
        if (idleCheck) silentParams.push('-CheckIdle');
        if (lowPriority) silentParams.push('-LowPriority');
        
        const child = spawn('powershell.exe', silentParams, {
          detached: true,
          stdio: 'ignore'
        });

        child.unref();
        spinner.succeed(chalk.green('green-dot is running in the background'));
        console.log(chalk.gray('\nUse ') + chalk.cyan('gd --status') + chalk.gray(' to check status'));
        console.log(chalk.gray('Use ') + chalk.cyan('gd --stop') + chalk.gray(' to stop all instances\n'));
        return;
      } else {
        // Foreground mode
        spinner.succeed(chalk.green('✓ Green-dot is running...'));
        console.log(chalk.gray('\nPress ') + chalk.red('Ctrl+C') + chalk.gray(' to stop\n'));

        const child = spawn('powershell.exe', params, {
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