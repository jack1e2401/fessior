param([string]$Container = 'ocj_judge0_server')
$ErrorActionPreference = 'Stop'

function Invoke-Judge0Fixture {
  param([string]$Name, [string]$Code, [int]$Language = 71, [string]$Expected = '', [int]$MemoryMb = 128)
  $request = @{
    source_code = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Code))
    language_id = $Language
    cpu_time_limit = 1
    wall_time_limit = 3
    memory_limit = $MemoryMb * 1024
    max_processes_and_or_threads = 16
    max_file_size = 64
    enable_network = $false
    enable_per_process_and_thread_time_limit = $true
    enable_per_process_and_thread_memory_limit = $true
  }
  if ($Expected -ne '') { $request.expected_output = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Expected)) }
  $json = $request | ConvertTo-Json -Compress
  $raw = $json | docker exec -i $Container curl -sS -X POST 'http://127.0.0.1:2358/submissions?base64_encoded=true&wait=true' -H 'Content-Type: application/json' --data-binary '@-'
  if ($LASTEXITCODE -ne 0) { throw "Judge0 request failed: $Name" }
  $result = $raw | ConvertFrom-Json
  if (!$result.status) { throw "Judge0 rejected ${Name}: $raw" }
  if ($result.stderr) { $result.stderr = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($result.stderr)) }
  Write-Host "$Name`: status=$($result.status.id) message=$($result.message)"
  return $result
}

$ac = Invoke-Judge0Fixture -Name AC -Code 'print(42)' -Expected '42'
if ($ac.status.id -ne 3) { throw 'AC fixture failed' }
$wa = Invoke-Judge0Fixture -Name WA -Code 'print(41)' -Expected '42'
if ($wa.status.id -ne 4) { throw 'WA fixture failed' }
$ce = Invoke-Judge0Fixture -Name CE -Code 'int main( {' -Language 54
if ($ce.status.id -ne 6) { throw 'CE fixture failed' }
$re = Invoke-Judge0Fixture -Name RE -Code 'raise ValueError("boom")'
if ($re.status.id -lt 7 -or $re.status.id -gt 12) { throw 'RE fixture failed' }
$tle = Invoke-Judge0Fixture -Name TLE -Code 'while True: pass'
if ($tle.status.id -ne 5) { throw 'TLE fixture failed' }
$wall = Invoke-Judge0Fixture -Name WALL -Code "import time`ntime.sleep(20)"
if ($wall.status.id -ne 5) { throw 'Wall timeout fixture failed' }
$memoryCode = "#include <vector>`nint main(){std::vector<char> v(64*1024*1024, 1); return v[0];}"
$mle = Invoke-Judge0Fixture -Name MLE -Code $memoryCode -Language 54 -MemoryMb 32
if ($mle.status.id -lt 7 -or $mle.status.id -gt 12 -or $mle.stderr -notmatch 'std::bad_alloc') { throw 'MLE fixture failed' }
$networkCode = "import socket`ntry:`n socket.create_connection(('127.0.0.1', 2358), timeout=1)`n print('CONNECTED')`nexcept OSError:`n print('DENIED')"
$network = Invoke-Judge0Fixture -Name NETWORK -Code $networkCode -Expected 'DENIED'
if ($network.status.id -ne 3) { throw 'Network isolation fixture failed' }
$threadsCode = "import threading`ne = threading.Event()`nstarted = []`nfor i in range(32):`n try:`n  t = threading.Thread(target=e.wait)`n  t.start()`n  started.append(t)`n except RuntimeError:`n  break`nprint('LIMITED' if len(started) < 32 else 'UNLIMITED')`ne.set()`nfor t in started: t.join()"
$threads = Invoke-Judge0Fixture -Name PROCESSES -Code $threadsCode -Expected 'LIMITED'
if ($threads.status.id -ne 3) { throw 'Process/thread bound fixture failed' }
$output = Invoke-Judge0Fixture -Name OUTPUT -Code 'print("x" * 131072)'
if ($output.status.id -eq 3) { throw 'Output bound fixture failed' }
$file = Invoke-Judge0Fixture -Name FILE -Code 'with open("out", "w") as f: f.write("x" * 131072)'
if ($file.status.id -eq 3) { throw 'File bound fixture failed' }
Write-Host 'Judge0 sandbox fixtures passed'
