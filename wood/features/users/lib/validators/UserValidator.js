const { Validator } = require('#lib/Validator');
const { Rule, NotRule } = require('#lib/Rules');
const {
  ERROR_EMPTY,
  ERROR_INVALID_EMAIL,
  ERROR_MATCH_FIELD,
  ERROR_MIN_LENGTH,
  ERROR_NOT_IN_LIST,
} = require('#lib/Errors');

const PASSWORD_LENGTH = 8;
const VALID_ACCOUNT_TYPES = ['admin', 'user'];

class UserValidator extends Validator {
  constructor(...args) {
    super(...args);

    this.rules = {
      email: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter an email address.' }),
        new NotRule('isEmail', { code: ERROR_INVALID_EMAIL, title: 'You must enter a valid email address.' }),
      ],
      name: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter a name.' }),
      ],
      password: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter a password.' }),
        new NotRule(
          'isLength',
          {
            code: ERROR_MIN_LENGTH,
            title: `Password must be at least ${PASSWORD_LENGTH} characters.`,
            meta: { minLength: PASSWORD_LENGTH },
          },
          [{ min: PASSWORD_LENGTH }],
        ),
      ],
      password_repeat: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must enter your password twice.' }),
        new NotRule(
          'equalsField',
          { code: ERROR_MATCH_FIELD, title: 'Passwords must match.', meta: { matchField: 'password' } },
          ['password'],
        ),
      ],
      token: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must provide a token.' }),
      ],
      account_type: [
        new Rule('isEmpty', { code: ERROR_EMPTY, title: 'You must provide an account type.' }),
        new NotRule(this.accountTypeInList, {
          code: ERROR_NOT_IN_LIST,
          title: 'You must select a valid account type.',
          meta: { list: VALID_ACCOUNT_TYPES },
        }),
      ],
    };
  }

  /**
   * Validates if provided account type is in the list of valid account types.
   *
   * @param {String} accountType - The account type to check.
   *
   * @return {Boolean}
   */
  accountTypeInList(accountType) {
    return VALID_ACCOUNT_TYPES.includes(accountType);
  }
}

module.exports = {
  UserValidator,

  // Invalid email or password
  ERROR_INVALID_LOGIN: 'ERROR_INVALID_LOGIN',

  // Form fields for user forms
  SIGNUP_FORM_FIELDS: [
    'email',
    'name',
    'password',
    'password_repeat',
  ],
  LOGIN_FORM_FIELDS: [
    'email',
    'password',
  ],
  PASSWORD_RESET_FORM_FIELDS: [
    'email',
  ],
  PASSWORD_CHANGE_FORM_FIELDS: [
    'password',
    'password_repeat',
  ],
  ADMIN_USER_EDIT_FORM_FIELDS: [
    'name',
    'account_type',
  ],
  USER_UPDATE_FORM_FIELDS: [
    'name',
    'password',
    'password_repeat',
  ],
  ACCEPT_INVITE_NEW_USER_FIELDS: [
    'name',
    'password',
    'password_repeat',
  ],
  ACCEPT_INVITE_EXISTING_USER_FIELDS: [
    'password',
  ],
};
