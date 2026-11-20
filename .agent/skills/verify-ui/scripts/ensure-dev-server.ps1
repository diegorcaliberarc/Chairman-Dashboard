$port = 3000
$listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listening) {
  Write-Output "Next.js dev server already listening on http://localhost:$port (PID: $($listening[0].OwningProcess))"
  exit 0
}
Write-Output "Port $port is free. Start the dev server via run_command with IsDaemon=true: npm run dev"
exit 1
