fn main() {
    // The app's own commands. Declaring them here generates the `allow-…` permissions that capabilities
    // reference. Keep in step with `focus_sense::COMMANDS`.
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&[
                "app_info",
                "auth_begin",
                "focus_sense_status",
                "focus_sense_configure",
                "focus_sense_start",
                "focus_sense_stop",
                "focus_sense_events",
                "focus_sense_clear",
            ])),
    )
    .expect("failed to run tauri-build");
}
