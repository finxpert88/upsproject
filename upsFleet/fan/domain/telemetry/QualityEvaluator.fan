** DEV-01 / SF-02 / FT-01: freshness of an already validated source timestamp.
** Does not implement other quality priorities or manufacture acquisition evidence.
const class QualityEvaluator
{
  ** Cache reads supply the original sourceTs; they are not new samples.
  ** At the exact cutoff the sample is still fresh (FSD 6.4).
  static Bool isStale(DateTime sourceTs, DateTime now, Duration staleAfter)
  {
    return now - sourceTs > staleAfter
  }
}
