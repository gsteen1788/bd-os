$certStore = Get-ChildItem -Path Cert:\LocalMachine\Root

$pemContent = ""

foreach ($cert in $certStore) {
    $base64 = [System.Convert]::ToBase64String($cert.RawData, "InsertLineBreaks")
    $pemContent += "-----BEGIN CERTIFICATE-----`r`n"
    $pemContent += $base64 + "`r`n"
    $pemContent += "-----END CERTIFICATE-----`r`n"
}

$pemContent | Out-File -FilePath "custom-ca.pem" -Encoding Ascii
Write-Host "Certificates exported to custom-ca.pem"
