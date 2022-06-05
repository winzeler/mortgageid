const { Validator } = require('#lib/Validator');
const { Rule, NotRule } = require('#lib/Rules');
const { ERROR_EMPTY, ERROR_INVALID_INTEGER } = require('#lib/Errors');

/**
 * Use Validator to validate query fields for list requests (page, per, search).
 */
class ListRequestValidator extends Validator {
  constructor() {
    super([
      'page',
      'per',
    ]);

    this.rules = {
      page: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter a page number.' }),
        new NotRule(
          'isInt',
          { code: ERROR_INVALID_INTEGER, title: 'You must enter a valid page number.' },
        ),
      ],
      per: [
        new Rule(
          'isEmpty',
          { code: ERROR_EMPTY, title: 'You must specify a number of entries per page.' },
        ),
        new NotRule(
          'isInt',
          { code: ERROR_INVALID_INTEGER, title: 'You must enter a valid number of entries per page.' },
        ),
      ],
    };
  }
}

module.exports = {
  ListRequestValidator,
};
