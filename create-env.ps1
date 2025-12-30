if (-not (Test-Path ".env")) {
    "#====================================" | Out-File -FilePath .env
    "#.env file template" | Out-File -FilePath .env -Append
    "#====================================" | Out-File -FilePath .env -Append
    "#1. Put your phone number in the OWNERS variable(with your country code). If multiple owners exist, add a comma between them (e.g., 961056436,96103642579). Make sure to include your country code as well" | Out-File -FilePath .env -Append
    "#2. Get your Gemini API key and summary API Key(they can be the same key) from https://aistudio.google.com/api-keys (if you want to enable AI features)" | Out-File -FilePath .env -Append
    "#3. Get your remove.bg API key from https://www.remove.bg/api" | Out-File -FilePath .env -Append
    "" | Out-File -FilePath .env -Append
    "OWNERS=" | Out-File -FilePath .env -Append
    "GEMINI_API_KEY=" | Out-File -FilePath .env -Append
    "SUMMARY_API_KEY=" | Out-File -FilePath .env -Append
    "REMOVE_BG_API_KEY=" | Out-File -FilePath .env -Append

    Write-Host "Template .env file created successfully."
} else {
    Write-Host ".env file already exists, skipping creation."
}
