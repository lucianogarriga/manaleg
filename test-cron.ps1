$plain = (Read-Host "CRON_SECRET").Trim()

$url = "https://manaleg.com.ar/api/cron/alertas?dry=1"

try {
  $r = Invoke-RestMethod -Uri $url -Headers @{ Authorization = "Bearer $plain" } -MaximumRedirection 5
  $r | ConvertTo-Json -Depth 5
} catch {
  "Error $($_.Exception.Response.StatusCode): $($_.Exception.Message)"
}
