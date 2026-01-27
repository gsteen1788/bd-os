$TargetFile = "c:\Users\steen Graeme\BD OS\bd-os\src-tauri\target\release\bd-os.exe"
$IconFile = "c:\Users\steen Graeme\BD OS\bd-os\public\icons\ShortcutIcon.ico"

# Get the real Desktop path (handles OneDrive redirection etc)
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutFile = Join-Path $DesktopPath "BD OS.lnk"

try {
    $WScriptShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WScriptShell.CreateShortcut($ShortcutFile)
    $Shortcut.TargetPath = $TargetFile
    $Shortcut.IconLocation = $IconFile
    $Shortcut.Save()
    Write-Host "Success: Shortcut created at '$ShortcutFile'"
} catch {
    Write-Error "Failed to create shortcut: $_"
    exit 1
}
