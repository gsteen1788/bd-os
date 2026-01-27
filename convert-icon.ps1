Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\Users\steen Graeme\BD OS\bd-os\public\icons\ShortcutIcon.png"
$destPath = "c:\Users\steen Graeme\BD OS\bd-os\public\icons\ShortcutIcon.ico"

try {
    $img = [System.Drawing.Image]::FromFile($sourcePath)
    $ms = New-Object System.IO.MemoryStream
    
    # Create a new icon from the image
    # Note: This simple conversion works but for high quality icons one typically 
    # needs to embed multiple sizes. This standard .NET conversion is basic.
    # A more robust way using System.Drawing.Icon directly:
    
    $bm = New-Object System.Drawing.Bitmap($img)
    $iconHandle = $bm.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
    
    $fs = New-Object System.IO.FileStream($destPath, [System.IO.FileMode]::Create)
    $icon.Save($fs)
    
    $fs.Close()
    $icon.Dispose()
    $bm.Dispose()
    $img.Dispose()
    
    Write-Host "Successfully created icon at $destPath"
} catch {
    Write-Error "Failed to convert icon: $_"
    exit 1
}
