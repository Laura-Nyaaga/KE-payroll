const rates = require('../config/statutoryRates');
const Decimal = require('decimal.js');

class StatutoryService {
  getCurrentConfigVersion() {
    return 'v1';
  }

  calculateNssf(grossPay) {
    const tier1Limit = new Decimal(8000);
    const tier2Limit = new Decimal(72000);

    const gross = new Decimal(grossPay);

    const tier1Pay = Decimal.min(gross, tier1Limit);
    const tier2Pay = Decimal.max(0, Decimal.min(gross, tier2Limit).minus(tier1Limit));

    const tier1Contribution = tier1Pay.times(rates.nssfRateTier1);
    const tier2Contribution = tier2Pay.times(rates.nssfRateTier2);

    return tier1Contribution.plus(tier2Contribution).toDecimalPlaces(2);
  }

  calculateHousingLevy(grossPay) {
    return new Decimal(grossPay).times(rates.housingLevyRate).toDecimalPlaces(2);
  }

  calculateShif(grossPay) {
    const shifAmount = new Decimal(grossPay).times(rates.shifRate).toDecimalPlaces(2);
    const minimumShif = new Decimal(rates.minimumShif);
  
    return shifAmount.lessThan(minimumShif) ? minimumShif : shifAmount;
  }

  calculatePaye(taxableIncome, personalRelief = rates.personalRelief) {
    const income = new Decimal(taxableIncome);
    const relief = new Decimal(personalRelief);

    let lastLimit = new Decimal(0);
    let paye = new Decimal(0);

    for (const bracket of rates.taxBrackets) {
      const bracketLimit = new Decimal(bracket.limit);
      const bracketRate = new Decimal(bracket.rate);

      if (income.gt(bracketLimit)) {
        paye = paye.plus(bracketLimit.minus(lastLimit).times(bracketRate));
        lastLimit = bracketLimit;
      } else {
        paye = paye.plus(income.minus(lastLimit).times(bracketRate));
        break;
      }
    }

    paye = Decimal.max(0, paye.minus(relief));
    
    return {
      paye: paye.toDecimalPlaces(2),
      relief: relief.toDecimalPlaces(2)
    };
  }
}

module.exports = new StatutoryService();


