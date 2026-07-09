// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{Read, Write};
use std::net::TcpListener;
use std::time::Duration;

#[tauri::command]
async fn start_auth_server(port: u16) -> Result<String, String> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
        .map_err(|e| format!("Failed to bind to port {}: {}", port, e))?;
    
    listener.set_nonblocking(false).ok();
    
    let (tx, rx) = std::sync::mpsc::channel::<Result<String, String>>();
    
    std::thread::spawn(move || {
        for stream in listener.incoming() {
            match stream {
                Ok(mut stream) => {
                    stream.set_read_timeout(Some(Duration::from_secs(120))).ok();
                    let mut buffer = [0u8; 2048];
                    if let Ok(bytes_read) = stream.read(&mut buffer) {
                        let request = String::from_utf8_lossy(&buffer[..bytes_read]);
                        
                        if let Some(line) = request.lines().next() {
                            if line.starts_with("GET ") {
                                let parts: Vec<&str> = line.split_whitespace().collect();
                                if parts.len() > 1 {
                                    let path = parts[1];
                                    if let Some(query_idx) = path.find('?') {
                                        let query = &path[query_idx + 1..];
                                        if query.contains("code=") {
                                            let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<html><head><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#f3f4f6;} .card{background:white;padding:2rem;border-radius:1rem;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);text-align:center;} h2{color:#10b981;}</style></head><body><div class=\"card\"><h2>Authentication Successful!</h2><p>You can close this window and return to BD OS.</p><script>setTimeout(() => window.close(), 1500);</script></div></body></html>";
                                            stream.write_all(response.as_bytes()).ok();

                                            let _ = tx.send(Ok(query.to_string()));
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                        
                        let response = "HTTP/1.1 400 Bad Request\r\n\r\nMissing authorization code or query.";
                        stream.write_all(response.as_bytes()).ok();
                    }
                }
                Err(_) => {
                    let _ = tx.send(Err("Authentication timed out or failed.".to_string()));
                    return;
                }
            }
        }
        let _ = tx.send(Err("Listener closed".to_string()));
    });

    let code = rx.recv()
        .map_err(|e| format!("Channel error: {}", e))?
        .map_err(|e| e)?;

    Ok(code)
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![start_auth_server])
    .plugin(tauri_plugin_sql::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
