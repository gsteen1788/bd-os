param (
    [string]$Path = "."
)

$FullPath = Resolve-Path $Path -ErrorAction Stop
Write-Host "Watching for new files in: $FullPath"

$Watcher = New-Object System.IO.FileSystemWatcher
$Watcher.Path = $FullPath
$Watcher.IncludeSubdirectories = $false
$Watcher.EnableRaisingEvents = $true

# Define the event
$Action = { 
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    Write-Host "New Activity: $changeType in $path"
}

# Synchronous wait for one event
$Result = $Watcher.WaitForChanged([System.IO.WatcherChangeTypes]::Created + [System.IO.WatcherChangeTypes]::Changed, 6000000) # Wait up to ~1.5 hours

if ($Result.TimedOut) {
    Write-Host "Timed out waiting for files."
} else {
    Write-Host "Detected change: $($Result.Name) - $($Result.ChangeType)"
}
