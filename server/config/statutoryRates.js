module.exports = {
    nssfRateTier1: 0.06,
    nssfRateTier2: 0.06,
    housingLevyRate: 0.015,
    shifRate: 0.0275,
    minimumShif: 300,
    personalRelief: 2400,
    taxBrackets: [
      { limit: 24000, rate: 0.10 },
      { limit: 32333, rate: 0.25 },
      { limit: 500000, rate: 0.30 },
      { limit: 800000, rate: 0.325 },
      { limit: Number.POSITIVE_INFINITY, rate: 0.35 }
    ]
  };
  