class QualityEvaluatorTest : Test
{
  ** FT-01 / AC-02: repeated cache reads cannot renew an unchanged sample.
  Void testCachedSampleFreshness()
  {
    expectedPod := File.os(Env.cur.vars["UPS_DEV01_TEST_POD"]).normalize
    verifyEq(Env.cur.findPodFile("upsFleet").normalize, expectedPod)

    sourceTs := DateTime("2026-09-15T00:00:00Z UTC")
    originalTs := sourceTs
    for (seconds := 0; seconds <= 28; seconds += 2)
    {
      verifyFalse(QualityEvaluator.isStale(sourceTs, sourceTs + 1sec * seconds, 30sec))
      verifyEq(sourceTs, originalTs)
    }
    verifyFalse(QualityEvaluator.isStale(sourceTs, sourceTs + 29sec, 30sec))
    verifyFalse(QualityEvaluator.isStale(sourceTs, sourceTs + 30sec, 30sec))
    verify(QualityEvaluator.isStale(sourceTs, sourceTs + 31sec, 30sec))
    verify(QualityEvaluator.isStale(sourceTs, sourceTs + 32sec, 30sec))
    verifyEq(sourceTs, originalTs)
  }
}
