#requires -Version 7.0
param(
    [Parameter(Mandatory)][string]$FinHome,
    [string]$OutputRoot = '.artifacts/DEV-01',
    [switch]$IncludeTests
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$artifactsRoot = [IO.Path]::GetFullPath((Join-Path $workspace '.artifacts'))
$outputPath = if ([IO.Path]::IsPathRooted($OutputRoot)) { $OutputRoot } else { Join-Path $workspace $OutputRoot }
$output = [IO.Path]::TrimEndingDirectorySeparator([IO.Path]::GetFullPath($outputPath))
$runId = [IO.Path]::GetFileName($output)
if ([IO.Path]::GetDirectoryName($output) -ne $artifactsRoot -or $runId -notmatch '^[A-Za-z0-9][A-Za-z0-9_-]*$') {
    throw 'OutputRoot must be one named run directory directly under this worktree .artifacts'
}
$runtime = Join-Path $workspace ".runtime/$runId"
$sdk = (Resolve-Path -LiteralPath $FinHome).Path

# Reject reparse points in every existing destination ancestor before copying or launching.
foreach ($path in @($output, $runtime)) {
    $cursor = $path
    while ($cursor) {
        if (Test-Path -LiteralPath $cursor) {
            if ((Get-Item -LiteralPath $cursor).Attributes -band [IO.FileAttributes]::ReparsePoint) {
                throw "Output ancestor is a reparse point: $cursor"
            }
        }
        $cursor = [IO.Path]::GetDirectoryName($cursor)
    }
    if (Test-Path -LiteralPath $path) {
        $links = Get-ChildItem -LiteralPath $path -Recurse -Force | Where-Object {
            $_.Attributes -band [IO.FileAttributes]::ReparsePoint
        }
        if ($links) { throw "Existing output tree contains reparse points: $path" }
    }
}
$podOutput = if ($IncludeTests) { Join-Path $output 'test' } else { $output }
$directories = @($output, $podOutput, "$output/tmp", "$runtime/lib/fan", "$runtime/lib/java", "$runtime/etc/sys", "$runtime/user")
foreach ($dir in $directories) {
    if (Test-Path -LiteralPath $dir) {
        if ((Get-Item -LiteralPath $dir).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse point: $dir" }
    }
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}
# BuildPod/compiler depend only on sys. No FIN services, projects or secrets are copied.
$inputs = @('lib/fan/sys.pod', 'lib/fan/compiler.pod', 'lib/fan/build.pod', 'lib/java/sys.jar',
    'etc/sys/timezones.ftz', 'etc/sys/timezone-aliases.props', 'etc/sys/units.txt')
$inputEvidence = foreach ($relative in $inputs) {
    $source = Join-Path $sdk $relative
    $target = Join-Path $runtime $relative
    if ((Test-Path -LiteralPath $target) -and ((Get-Item -LiteralPath $target).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw "Reparse point: $target" }
    $before = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
    Copy-Item -LiteralPath $source -Destination $target -Force
    if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $before) { throw "SDK copy mismatch: $relative" }
    [ordered]@{ path = $relative; sha256 = $before }
}
$java = (Get-Command java -CommandType Application).Source
$arguments = @("-Dfan.home=$runtime", "-Djava.io.tmpdir=$output/tmp", "-Duser.home=$runtime/user",
    '-cp', "$runtime/lib/java/sys.jar", 'fanx.tools.Fan', "$workspace/upsFleet/build.fan", 'compile')
$start = [Diagnostics.ProcessStartInfo]::new()
$start.FileName = $java
$start.WorkingDirectory = $runtime
$start.UseShellExecute = $false
$start.CreateNoWindow = $true
$start.RedirectStandardOutput = $true
$start.RedirectStandardError = $true
foreach ($argument in $arguments) { $start.ArgumentList.Add($argument) }
foreach ($name in @('FAN_HOME', 'FAN_ENV', 'FAN_PATH', 'FAN_SUBSTITUTE', 'JAVA_TOOL_OPTIONS', '_JAVA_OPTIONS', 'JDK_JAVA_OPTIONS')) { $start.Environment.Remove($name) | Out-Null }
$start.Environment['UPS_DEV01_OUT'] = $podOutput
$start.Environment['UPS_DEV01_TEST_BUILD'] = $IncludeTests.IsPresent.ToString().ToLowerInvariant()
$process = [Diagnostics.Process]::Start($start)
$stdout = $process.StandardOutput.ReadToEndAsync()
$stderr = $process.StandardError.ReadToEndAsync()
$process.WaitForExit()
$log = $stdout.Result + $stderr.Result
$label = if ($IncludeTests) { 'build-test' } else { 'build' }
$log | Set-Content -LiteralPath "$output/$label.log" -Encoding utf8
Write-Host $log
$sourceFiles = @('upsFleet/build.fan', 'upsFleet/fan/domain/telemetry/QualityEvaluator.fan')
if ($IncludeTests) { $sourceFiles += 'upsFleet/test/domain/QualityEvaluatorTest.fan' }
$sources = foreach ($file in $sourceFiles) {
    [ordered]@{ path = $file; sha256 = (Get-FileHash -LiteralPath (Join-Path $workspace $file)).Hash }
}
$result = [ordered]@{ recordedAtUtc = [DateTime]::UtcNow.ToString('o'); executable = $java; arguments = $arguments; workingDirectory = $runtime;
    exitCode = $process.ExitCode; outputDirectory = $podOutput; sdkInputs = $inputEvidence; sourceFiles = $sources }
$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath "$output/$label.json" -Encoding utf8
if ($process.ExitCode -ne 0) { throw "Fantom compilation failed: exit $($process.ExitCode); see $output/$label.log" }
$pod = Join-Path $podOutput 'upsFleet.pod'
if (-not (Test-Path -LiteralPath $pod)) { throw 'Compiler did not produce upsFleet.pod' }
foreach ($input in $inputEvidence) {
    if ((Get-FileHash -LiteralPath (Join-Path $sdk $input.path)).Hash -ne $input.sha256) { throw "SDK input changed: $($input.path)" }
}
Write-Host "Built $pod SHA256=$((Get-FileHash -LiteralPath $pod).Hash)"
