const { Validator } = require('#lib/Validator');
const { Rule } = require('#lib/Rules');
const { ERROR_EMPTY } = require('#lib/Errors');

describe('Validator', () => {
  describe('errors', () => {
    let validator;

    beforeEach(() => {
      validator = new Validator(['abc', 'def']);
      validator.rules = {
        abc: [
          new Rule('isEmpty', { code: ERROR_EMPTY, title: 'abc is empty.' }),
        ],
        def: [
          new Rule('isEmpty', { code: ERROR_EMPTY, title: 'def is empty.' }),
        ],
      };
    });

    // ---------------------------------------------------------------------------------------------

    it('should get failing rules for multiple fields', () => {
      const errors = validator.errors({
        abc: '',
        def: '',
      }, {});

      expect(errors).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should get failing rule for single field', () => {
      const errors = validator.errors({
        abc: '',
        def: '',
      }, {}, 'def');

      expect(errors).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should incorporate api errors for multiple fields', () => {
      const errors = validator.errors({
        abc: '',
        def: 'not empty',
      }, {
        abc: [{
          code: 'ERROR_API',
          title: 'An API error for abc.',
        }],
        def: [{
          code: 'ERROR_API',
          title: 'An API error for def.',
        }],
      });

      expect(errors).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should incorporate api errors for single fields with existing error', () => {
      const errors = validator.errors({
        abc: '',
        def: 'not empty',
      }, {
        abc: [{
          code: 'ERROR_API',
          title: 'An API error for abc.',
        }],
        def: [{
          code: 'ERROR_API',
          title: 'An API error for def.',
        }],
      }, 'abc');

      expect(errors).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should incorporate api errors for single fields with no existing error', () => {
      const errors = validator.errors({
        abc: '',
        def: 'not empty',
      }, {
        abc: [{
          code: 'ERROR_API',
          title: 'An API error for abc.',
        }],
        def: [{
          code: 'ERROR_API',
          title: 'An API error for def.',
        }],
      }, 'def');

      expect(errors).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should return empty when no errors', () => {
      const errors = validator.errors({
        abc: 'abc',
        def: 'def',
      }, {
        abc: [],
        def: [],
      });

      expect(errors).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should get failing rules for aliased fields', () => {
      validator = new Validator(['abc', 'def'], { aliases: { an_alias: 'def' } });
      validator.rules = {
        abc: [
          new Rule('isEmpty', { code: ERROR_EMPTY, title: 'abc is empty.' }),
        ],
        def: [
          new Rule('isEmpty', { code: ERROR_EMPTY, title: 'def is empty.' }),
        ],
      };

      const errors = validator.errors({
        abc: 'abc',
        an_alias: '',
      }, {
        abc: [],
        an_alias: [],
      });

      expect(errors).toMatchSnapshot();
    });

    // ---------------------------------------------------------------------------------------------

    it('should return empty when aliased fields have no errors', () => {
      validator = new Validator(['abc', 'def'], { aliases: { an_alias: 'def' } });
      validator.rules = {
        abc: [
          new Rule('isEmpty', { code: ERROR_EMPTY, title: 'abc is empty.' }),
        ],
        def: [
          new Rule('isEmpty', { code: ERROR_EMPTY, title: 'def is empty.' }),
        ],
      };

      const errors = validator.errors({
        abc: 'abc',
        an_alias: 'def',
      }, {
        abc: [],
        an_alias: [],
      });

      expect(errors).toMatchSnapshot();
    });
  });
});
