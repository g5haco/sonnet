fn main() {
    // `app_info` is the only app command. Declaring it here generates the
    // `allow-app-info` permission that capabilities reference.
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["app_info"])),
    )
    .expect("failed to run tauri-build");
}
