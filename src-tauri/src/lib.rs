// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::{Command, Stdio};
use sysinfo::System;
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Try to start Python backend, but don't crash if it fails
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                // Wait a bit for the app to initialize
                std::thread::sleep(std::time::Duration::from_millis(500));

                // Check if backend is already running
                let mut system = sysinfo::System::new_all();
                system.refresh_all();

                let process_name = if cfg!(windows) {
                    "notebooklm_backend.exe"
                } else {
                    "notebooklm_backend"
                };
                let is_running = system.processes_by_name(process_name).next().is_some();

                if is_running {
                    println!(
                        "Backend process '{}' is already running. Skipping launch.",
                        process_name
                    );
                    return;
                }

                // Try to find python_api directory or executable
                let possible_paths = vec![
                    // Development mode - use python app.py
                    std::env::current_dir()
                        .ok()
                        .and_then(|p| p.parent().map(|p| p.join("python_api"))),
                    // Production mode - look for bundled resources (flat)
                    app_handle.path().resource_dir().ok(),
                    // Production mode - look for bundled resources (subdir)
                    app_handle
                        .path()
                        .resource_dir()
                        .ok()
                        .map(|p| p.join("python_api")),
                    // Production mode - look for _up_ directory structure (Tauri v2 artifact)
                    std::env::current_exe()
                        .ok()
                        .and_then(|p| p.parent().map(|p| p.join("_up_").join("python_api"))),
                    // Production mode - _up_ inside resource dir
                    app_handle
                        .path()
                        .resource_dir()
                        .ok()
                        .map(|p| p.join("_up_").join("python_api")),
                    // Production mode - look relative to executable
                    std::env::current_exe()
                        .ok()
                        .and_then(|p| p.parent().map(|p| p.join("python_api"))),
                    // Production mode - in parent directory
                    std::env::current_exe().ok().and_then(|p| {
                        p.parent()
                            .and_then(|p| p.parent().map(|p| p.join("python_api")))
                    }),
                ];

                for path_opt in possible_paths {
                    if let Some(python_api_path) = path_opt {
                        println!("Checking for backend at: {:?}", python_api_path);

                        // First try to find the PyInstaller executable in dist folder
                        let exe_path_dist =
                            python_api_path.join("dist").join("notebooklm_backend.exe");
                        let exe_path_root = python_api_path.join("notebooklm_backend.exe");

                        // Try dist folder first (development)
                        if exe_path_dist.exists() {
                            println!("Found Python backend executable at: {:?}", exe_path_dist);

                            match Command::new(&exe_path_dist)
                                .current_dir(&python_api_path)
                                .stdout(Stdio::null())
                                .stderr(Stdio::null())
                                .spawn()
                            {
                                Ok(_) => {
                                    println!("Python backend executable started successfully");
                                    return;
                                }
                                Err(e) => {
                                    eprintln!("Failed to start Python backend executable: {}", e);
                                }
                            }
                        }

                        // Try root folder (production - bundled)
                        if exe_path_root.exists() {
                            println!("Found Python backend executable at: {:?}", exe_path_root);

                            match Command::new(&exe_path_root)
                                .current_dir(&python_api_path)
                                .stdout(Stdio::null())
                                .stderr(Stdio::null())
                                .spawn()
                            {
                                Ok(_) => {
                                    println!("Python backend executable started successfully");
                                    return;
                                }
                                Err(e) => {
                                    eprintln!("Failed to start Python backend executable: {}", e);
                                }
                            }
                        }

                        // Fallback to python app.py for development
                        let app_py_path = python_api_path.join("app.py");
                        if app_py_path.exists() {
                            println!("Found Python backend script at: {:?}", app_py_path);

                            match Command::new("python")
                                .arg(&app_py_path)
                                .current_dir(&python_api_path)
                                .stdout(Stdio::null())
                                .stderr(Stdio::null())
                                .spawn()
                            {
                                Ok(_) => {
                                    println!("Python backend script started successfully");
                                    return;
                                }
                                Err(e) => {
                                    eprintln!("Failed to start Python backend script: {}", e);
                                }
                            }
                        }
                    }
                }

                eprintln!("Could not find or start Python backend. Please start it manually.");
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
