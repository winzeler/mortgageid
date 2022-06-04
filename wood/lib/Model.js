class Model {
  /**
   * Constructor.
   *
   * @param {Object} fields - Fields configuration for this model.
   */
  constructor(fields) {
    this.fields = fields;
  }

  /**
   * Returns the value of the model for the provided key.
   *
   * @param {String} key - The key to retrieve the value for.
   *
   * @return {Mixed}
   */
  keyValue(key) {
    return this[key];
  }

  label(key) {
    return this.fields[key].label();
  }

  labelClass(key, { desktop = false, mobile = false } = {}) {
    return this.fields[key].labelClass({ desktop, mobile });
  }

  labelInnerClass(key, { desktop = false, mobile = false } = {}) {
    return this.fields[key].labelInnerClass({ desktop, mobile });
  }

  value(key) {
    return this.fields[key].value(this.keyValue(key), this);
  }

  valueClass(key, { desktop = false, mobile = false } = {}) {
    return this.fields[key].valueClass(this.keyValue(key), this, { desktop, mobile });
  }

  valueInnerClass(key, { desktop = false, mobile = false } = {}) {
    return this.fields[key].valueInnerClass(this.keyValue(key), this, { desktop, mobile });
  }

  isHtml(key) {
    return this.fields[key].isHtml;
  }
}

module.exports = {
  Model,
};
