const { Model } = require('#lib/Model');
const { FieldNumber, FieldString } = require('#lib/Fields');

/**
 * @type {Object} Field configuration.
 */
const ###_UPPER_SNAKE_NAME_###_MODEL_FIELDS = {
  id: new FieldNumber({ label: 'ID' }),
  name: new FieldString({ label: 'Name' }),
};

class ###_PASCAL_NAME_###Model extends Model {
  /**
   * Constructor.
   *
   * @param {Number} id - The ID of this model.
   * @param {String} name - The full name of this model.
   */
  constructor({ id, name } = {}) {
    super(###_UPPER_SNAKE_NAME_###_MODEL_FIELDS);

    this.id = id;
    this.name = name;
  }

  /**
   * Convert model to JSON.
   *
   * @return {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}

module.exports = {
  ###_PASCAL_NAME_###Model,
  ###_UPPER_SNAKE_NAME_###_MODEL_FIELDS,
};
