#requires -Version 7.0
param(
    [Parameter(Mandatory)][string]$FinHome,
    [string]$OutputRoot = '.artifacts/DEV-01'
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
& "$PSScriptRoot/build.ps1" -FinHome $FinHome -OutputRoot $OutputRoot -IncludeTests
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
# build.ps1 has validated the selected run directory before any test writes.
$outputPath = if ([IO.Path]::IsPathRooted($OutputRoot)) { $OutputRoot } else { Join-Path $workspace $OutputRoot }
$output = [IO.Path]::TrimEndingDirectorySeparator([IO.Path]::GetFullPath($outputPath))
$runtime = Join-Path $workspace ('.runtime/' + [IO.Path]::GetFileName($output))
$builtPod = "$output/test/upsFleet.pod"
$loadedPod = "$runtime/lib/fan/upsFleet.pod"
if ((Test-Path -LiteralPath $loadedPod) -and ((Get-Item -LiteralPath $loadedPod).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Test POD must not be a reparse point' }
Copy-Item -LiteralPath $builtPod -Destination $loadedPod -Force
$hash = (Get-FileHash -LiteralPath $builtPod).Hash
if ((Get-FileHash -LiteralPath $loadedPod).Hash -ne $hash) { throw 'Test POD copy mismatch' }
$java = (Get-Command java -CommandType Application).Source
$arguments = @("-Dfan.home=$runtime", "-Djava.io.tmpdir=$output/tmp", "-Duser.home=$runtime/user",
    '-cp', "$runtime/lib/java/sys.jar", 'fanx.tools.Fant', 'upsFleet::QualityEvaluatorTest')
$start = [Diagnostics.ProcessStartInfo]::new()
$start.FileName = $java
$start.WorkingDirectory = $runtime
$start.UseShellExecute = $false
$start.CreateNoWindow = $true
$start.RedirectStandardOutput = $true
$start.RedirectStandardError = $true
foreach ($argument in $arguments) { $start.ArgumentList.Add($argument) }
foreach ($name in @('FAN_HOME', 'FAN_ENV', 'FAN_PATH', 'FAN_SUBSTITUTE', 'JAVA_TOOL_OPTIONS', '_JAVA_OPTIONS', 'JDK_JAVA_OPTIONS')) { $start.Environment.Remove($name) | Out-Null }
$start.Environment['UPS_DEV01_TEST_POD'] = $loadedPod
$process = [Diagnostics.Process]::Start($start)
$stdout = $process.StandardOutput.ReadToEndAsync()
$stderr = $process.StandardError.ReadToEndAsync()
$process.WaitForExit()
$log = $stdout.Result + $stderr.Result
$log | Set-Content -LiteralPath "$output/test.log" -Encoding utf8
Write-Host $log
[ordered]@{ recordedAtUtc = [DateTime]::UtcNow.ToString('o'); executable = $java; arguments = $arguments; workingDirectory = $runtime; exitCode = $process.ExitCode;
    loadedPod = $loadedPod; podSha256 = $hash; acceptance = 'FT-01 / AC-02 (DEV-01 slice only)' } |
    ConvertTo-Json -Depth 5 | Set-Content -LiteralPath "$output/test.json" -Encoding utf8
if ($process.ExitCode -ne 0 -or $log -notmatch 'All tests passed') { throw "Fantom test failed or no passing test summary: exit $($process.ExitCode)" }
