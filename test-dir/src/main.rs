use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::thread;
use std::time::Duration;
slint::include_modules!();

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct Config {
    pub enabled: bool,
}

fn main() -> Result<(), slint::PlatformError> {
    let mut config = get_config();
    config.enabled = false;
    set_config(config);
    let ui = AppWindow::new()?;
    ui.on_start_timer({
        let ui_handle = ui.as_weak();
        move || {
            let mut config = get_config();
            config.enabled = !config.enabled;
            set_config(config);
            let app = ui_handle.unwrap();
            if get_config().enabled {
                app.set_state("🚫".into())
            } else {
                app.set_state("🚀".into())
            }
        }
    });

    let ui_handle = ui.as_weak();
    std::thread::spawn(move || {
        let mut session_time = 60 * 25;
        let mut break_time = 60 * 5;
        loop {
            if get_config().enabled {
                let ui = ui_handle.clone();

                if session_time > 0 {
                    let time_minutes = session_time / 60;
                    let time_seconds = session_time - time_minutes * 60;
                    let mut str_minutes = time_minutes.to_string();
                    let mut str_seconds = time_seconds.to_string();
                    if str_minutes.len() < 2 {
                        str_minutes = "0".to_owned() + &*str_minutes
                    }
                    if str_seconds.len() < 2 {
                        str_seconds = "0".to_owned() + &*str_seconds
                    }

                    slint::invoke_from_event_loop(move || {
                        ui.unwrap()
                            .set_time((str_minutes.to_string() + ":" + &*str_seconds).into())
                    })
                    .expect("TODO: panic message");
                    session_time -= 1;
                } else if break_time > 1 {
                    let time_minutes = break_time / 60;
                    let time_seconds = break_time - time_minutes * 60;
                    let mut str_minutes = time_minutes.to_string();
                    let mut str_seconds = time_seconds.to_string();
                    if str_minutes.len() < 2 {
                        str_minutes = "0".to_owned() + &*str_minutes
                    }
                    if str_seconds.len() < 2 {
                        str_seconds = "0".to_owned() + &*str_seconds
                    }
                    slint::invoke_from_event_loop(move || {
                        ui.unwrap()
                            .set_time((str_minutes.to_string() + ":" + &*str_seconds).into())
                    })
                    .expect("TODO: panic message");
                    break_time -= 1;
                    if break_time == 1 {
                        session_time = 60 * 25;
                        break_time = 60 * 5;
                    }
                }
                thread::sleep(Duration::from_millis(1000));
            }
        }
    });
    ui.run()
}

pub fn get_config() -> Config {
    let path = data_dir().join("config.toml");

    confy::load_path(path).unwrap_or_else(|_| {
        set_config(Config { enabled: false });
        Config { enabled: false }
    })
}

pub fn set_config(config: Config) {
    let path = data_dir().join("config.toml");

    confy::store_path(path, config).expect("Could not save config");
}

pub fn data_dir() -> PathBuf {
    let home_dir = std::env::var_os("HOME").map(PathBuf::from).unwrap();
    home_dir
        .join("Library/Application Support")
        .join("me.yanice.pomodoro-timer")
}
