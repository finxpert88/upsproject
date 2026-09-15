using build

class Build : BuildPod
{
  new make()
  {
    // The wrapper creates and validates this isolated directory before launch.
    output := Env.cur.vars["UPS_DEV01_OUT"]
    if (output == null) throw Err("Use scripts/build.ps1 with an isolated output directory")
    outPodDir = File.os(output).normalize.uri
    outDocDir = outPodDir + `doc/`
    podName = "upsFleet"
    summary = "UPS Fleet DEV-01 source-sample freshness"
    version = Version("0.0.1")
    depends = ["sys 1.0"]
    docApi = false
    docSrc = false
    srcDirs = [`fan/domain/telemetry/`]
    if (Env.cur.vars["UPS_DEV01_TEST_BUILD"] == "true")
      srcDirs.add(`test/domain/`)
  }
}
