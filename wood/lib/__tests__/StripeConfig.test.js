const fixtureStripeCoupons = require('@wood/config/stripe/__fixtures__/coupons.json.fixture');
const fixtureStripeProducts = require('@wood/config/stripe/__fixtures__/products.json.fixture');
const fixtureStripeTaxes = require('@wood/config/stripe/__fixtures__/taxes.json.fixture');
const { StripeConfig } = require('#lib/StripeConfig');
const { overrideConfigFile, clearConfigOverrides } = require('#lib/Config');

describe('StripeConfig', () => {
  beforeAll(() => {
    overrideConfigFile('stripe/coupons', fixtureStripeCoupons);
    overrideConfigFile('stripe/products', fixtureStripeProducts);
    overrideConfigFile('stripe/taxes', fixtureStripeTaxes);
  });

  afterAll(() => {
    clearConfigOverrides();
  });

  describe('products', () => {
    it('should only get USD products/prices', () => {
      const config = new StripeConfig({ currency: 'usd' });

      expect(config.products).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should only get CAD products/prices', () => {
      const config = new StripeConfig({ currency: 'cad' });

      expect(config.products).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should get all products/prices', () => {
      const config = new StripeConfig();

      expect(config.products).toMatchSnapshot();
    });
  });
});
