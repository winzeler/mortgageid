const { PriceModel } = require('#features/subscriptions/lib/models/PriceModel');

describe('PriceModel', () => {
  describe('constructor()', () => {
    // ---------------------------------------------------------------------------------------------

    it('should properly display monthly prices', () => {
      const price = new PriceModel({
        unit_amount: 9999,
        currency: 'usd',
        interval: 'month',
        interval_count: 1,
      });

      expect(price.intervalPrice).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should properly display multi-interval prices', () => {
      const price = new PriceModel({
        unit_amount: 9999,
        currency: 'usd',
        interval: 'month',
        interval_count: 3,
      });

      expect(price.intervalPrice).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should properly display GBP', () => {
      const price = new PriceModel({
        unit_amount: 9999,
        currency: 'gbp',
        interval: 'month',
        interval_count: 1,
      });

      expect(price.intervalPrice).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should properly display euros', () => {
      const price = new PriceModel({
        unit_amount: 9999,
        currency: 'eur',
        interval: 'month',
        interval_count: 1,
      });

      expect(price.intervalPrice).toMatchSnapshot();
    });
  });
});
