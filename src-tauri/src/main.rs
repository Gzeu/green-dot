// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};
use tauri_plugin_notification::NotificationExt;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug)]
struct AppState {
    is_running: bool,
    is_paused: bool,
    config: Config,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
struct Config {
    interval: u32,
    adaptive: bool,
    burst: bool,
    idle_check: bool,
    low_priority: bool,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            interval: 4,
            adaptive: true,
            burst: true,
            idle_check: true,
            low_priority: true,
        }
    }
}

// Invoke Node.js CLI commands
#[tauri::command]
fn start_green_dot(config: Config) -> Result<String, String> {
    let mut args = vec![
        "run".to_string(),
        "start".to_string(),
        "--silent".to_string(),
        "--interval".to_string(),
        config.interval.to_string(),
    ];

    if !config.adaptive {
        args.push("--no-adaptive".to_string());
    }
    if !config.burst {
        args.push("--no-burst".to_string());
    }

    let output = Command::new("npm")
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to start: {}", e))?;

    if output.status.success() {
        Ok("Green Dot started successfully".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn stop_green_dot() -> Result<String, String> {
    let output = Command::new("npm")
        .args(["run", "stop"])
        .output()
        .map_err(|e| format!("Failed to stop: {}", e))?;

    if output.status.success() {
        Ok("Green Dot stopped successfully".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn get_status() -> Result<String, String> {
    let output = Command::new("npm")
        .args(["run", "status"])
        .output()
        .map_err(|e| format!("Failed to get status: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
fn save_config(config: Config) -> Result<(), String> {
    // Save to home directory config file
    let config_path = dirs::home_dir()
        .ok_or("Could not find home directory")?;
    let config_file = config_path.join(".green-dot-config.json");
    
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    std::fs::write(config_file, json)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn load_config() -> Result<Config, String> {
    let config_path = dirs::home_dir()
        .ok_or("Could not find home directory")?;
    let config_file = config_path.join(".green-dot-config.json");
    
    if config_file.exists() {
        let contents = std::fs::read_to_string(config_file)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        
        let config: Config = serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse config: {}", e))?;
        
        Ok(config)
    } else {
        Ok(Config::default())
    }
}

fn create_system_tray() -> SystemTray {
    let start = CustomMenuItem::new("start".to_string(), "▶️ Start");
    let pause = CustomMenuItem::new("pause".to_string(), "⏸️ Pause").disabled();
    let stop = CustomMenuItem::new("stop".to_string(), "⏹️ Stop").disabled();
    let separator = SystemTrayMenuItem::Separator;
    let dashboard = CustomMenuItem::new("dashboard".to_string(), "📊 Dashboard");
    let settings = CustomMenuItem::new("settings".to_string(), "⚙️ Settings");
    let separator2 = SystemTrayMenuItem::Separator;
    let quit = CustomMenuItem::new("quit".to_string(), "❌ Quit");

    let tray_menu = SystemTrayMenu::new()
        .add_item(start)
        .add_item(pause)
        .add_item(stop)
        .add_native_item(separator)
        .add_item(dashboard)
        .add_item(settings)
        .add_native_item(separator2)
        .add_item(quit);

    SystemTray::new().with_menu(tray_menu)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .system_tray(create_system_tray())
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                // Show window on left click
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "start" => {
                    if let Some(window) = app.get_window("main") {
                        window.emit("tray-event", "start").unwrap();
                    }
                    app.notification()
                        .builder()
                        .title("Green Dot")
                        .body("Status keeper started")
                        .show()
                        .unwrap();
                }
                "pause" => {
                    if let Some(window) = app.get_window("main") {
                        window.emit("tray-event", "pause").unwrap();
                    }
                }
                "stop" => {
                    if let Some(window) = app.get_window("main") {
                        window.emit("tray-event", "stop").unwrap();
                    }
                    app.notification()
                        .builder()
                        .title("Green Dot")
                        .body("Status keeper stopped")
                        .show()
                        .unwrap();
                }
                "dashboard" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "settings" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                    window.emit("navigate", "settings").unwrap();
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            start_green_dot,
            stop_green_dot,
            get_status,
            save_config,
            load_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
