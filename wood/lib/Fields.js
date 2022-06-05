/* eslint-disable max-classes-per-file */

const moment = require('moment');
const numbro = require('numbro');

/**
 * The base class for field display classes.
 */
class FieldDisplay {
  /**
   * Constructor.
   *
   * For all of the "class" values, there exist "desktop" and "mobile" versions, which specifically
   * apply in desktop or mobile contexts.
   *
   * @param {String} label - The label of the field to display.
   * @param {Boolean} isHtml - If the field should be displayed as HTML, or just plain text.
   * @param {Array} labelClasses - Extra CSS classes to apply to label containers.
   * @param {Array} desktopLabelClasses - Extra CSS classes to apply to label containers in desktop
   *                                      mode.
   * @param {Array} mobileLabelClasses - Extra CSS classes to apply to label containers in mobile
   *                                     mode.
   * @param {Array} labelInnerClasses - Extra CSS classes to apply to text inside containers.
   * @param {Array} desktopLabelInnerClasses - Extra CSS classes to apply to text inside containers
   *                                           in desktop mode.
   * @param {Array} mobileLabelInnerClasses - Extra CSS classes to apply to text inside containers
   *                                           in mobile mode.
   * @param {Array} valueClasses - Extra CSS classes to apply to value containers.
   * @param {Array} desktopValueClasses - Extra CSS classes to apply to value containers in desktop
   *                                      mode.
   * @param {Array} mobileValueClasses - Extra CSS classes to apply to value containers in mobile
   *                                      mode.
   * @param {Function} valueClassFn - A function that can calculate per-value classes for
   *                                  containers.
   * @param {Function} desktopValueClassFn - A function that can calculate per-value classes for
   *                                  containers in desktop mode.
   * @param {Function} mobileValueClassFn - A function that can calculate per-value classes for
   *                                  containers in mobile mode.
   * @param {Array} valueInnerClasses - Extra CSS classes to apply to text inside containers.
   * @param {Array} desktopValueInnerClasses - Extra CSS classes to apply to text inside containers
   *                                           in desktop mode.
   * @param {Array} mobileValueInnerClasses - Extra CSS classes to apply to text inside containers
   *                                           in mobile mode.
   * @param {Function} valueInnerClassFn - A function that can calculate per-value classes for text
   *                                       inside containers.
   * @param {Function} desktopValueInnerClassFn - A function that can calculate per-value classes
   *                                              for text inside containers in desktop mode.
   * @param {Function} mobileValueInnerClassFn - A function that can calculate per-value classes
   *                                              for text inside containers in mobile mode.
   *
   * NOTE: Only set a field's isHtml to "true" if you have validated the field content to ensure
   *       it cannot contain content that enables XSS attacks.  For more information, please see:
   *       https://owasp.org/www-community/attacks/xss/
   */
  constructor({
    label,
    isHtml = false,

    labelClasses = [],
    desktopLabelClasses = [],
    mobileLabelClasses = [],

    labelInnerClasses = [],
    desktopLabelInnerClasses = [],
    mobileLabelInnerClasses = [],

    valueClasses = [],
    desktopValueClasses = [],
    mobileValueClasses = [],

    valueClassFn,
    desktopValueClassFn,
    mobileValueClassFn,

    valueInnerClasses = [],
    desktopValueInnerClasses = [],
    mobileValueInnerClasses = [],

    valueInnerClassFn,
    desktopValueInnerClassFn,
    mobileValueInnerClassFn,
  } = {}) {
    this.labelText = label;
    this.isHtml = isHtml;

    this.labelClasses = labelClasses;
    this.desktopLabelClasses = desktopLabelClasses;
    this.mobileLabelClasses = mobileLabelClasses;

    this.labelInnerClasses = labelInnerClasses;
    this.desktopLabelInnerClasses = desktopLabelInnerClasses;
    this.mobileLabelInnerClasses = mobileLabelInnerClasses;

    this.valueClasses = valueClasses;
    this.desktopValueClasses = desktopValueClasses;
    this.mobileValueClasses = mobileValueClasses;

    this.valueClassFn = valueClassFn;
    this.desktopValueClassFn = desktopValueClassFn;
    this.mobileValueClassFn = mobileValueClassFn;

    this.valueInnerClasses = valueInnerClasses;
    this.desktopValueInnerClasses = desktopValueInnerClasses;
    this.mobileValueInnerClasses = mobileValueInnerClasses;

    this.valueInnerClassFn = valueInnerClassFn;
    this.desktopValueInnerClassFn = desktopValueInnerClassFn;
    this.mobileValueInnerClassFn = mobileValueInnerClassFn;
  }

  /**
   * By default, just display the label.
   *
   * @return {String}
   */
  label() {
    return this.labelText;
  }

  /**
   * By default, just display the raw value.
   *
   * @param {String} value - The value to display.
   * @param {Model} instance - The current instance of the model we are displaying a field for.
   *
   * @return {String}
   */
  value(value, instance) {
    return value;
  }

  /**
   * Return the classes for the label container for this field, joined by a space.
   *
   * @param {Boolean} desktop - If we should include desktop classes.
   * @param {Boolean} mobile - If we should include mobile classes.
   *
   * @return {String}
   */
  labelClass({ desktop = false, mobile = false } = {}) {
    let classes = this.labelClasses;

    if (desktop) {
      classes = classes.concat(this.desktopLabelClasses);
    }

    if (mobile) {
      classes = classes.concat(this.mobileLabelClasses);
    }

    return classes.join(' ');
  }

  /**
   * Return the classes for the label text for this field, joined by a space.
   *
   * @param {Boolean} desktop - If we should include desktop classes.
   * @param {Boolean} mobile - If we should include mobile classes.
   *
   * @return {String}
   */
  labelInnerClass({ desktop = false, mobile = false } = {}) {
    let classes = this.labelInnerClasses;

    if (desktop) {
      classes = classes.concat(this.desktopLabelInnerClasses);
    }

    if (mobile) {
      classes = classes.concat(this.mobileLabelInnerClasses);
    }

    return classes.join(' ');
  }

  /**
   * Return the classes for the value container for this field, joined by a space.
   *
   * If a custom value class function has been defined for this field, use it instead.
   *
   * @param {String} value - The value for this field, may be used to modify the classes.
   * @param {Model} instance - The current instance of the model we are displaying a field for.
   * @param {Boolean} desktop - If we should include desktop classes.
   * @param {Boolean} mobile - If we should include mobile classes.
   *
   * @return {String}
   */
  valueClass(value, instance, { desktop = false, mobile = false } = {}) {
    let classes = this.valueClasses;

    if (this.valueClassFn) {
      classes = classes.concat(this.valueClassFn(value, instance));
    }

    if (desktop) {
      classes = classes.concat(this.desktopValueClasses);

      if (this.desktopValueClassFn) {
        classes = classes.concat(this.desktopValueClassFn(value, instance));
      }
    }

    if (mobile) {
      classes = classes.concat(this.mobileValueClasses);

      if (this.mobileValueClassFn) {
        classes = classes.concat(this.mobileValueClassFn(value, instance));
      }
    }

    return classes.join(' ');
  }

  /**
   * Return the classes for the value text inside the container for this field, joined by a space.
   *
   * If a custom value class function has been defined for this field, use it instead.
   *
   * @param {String} value - The value for this field, may be used to modify the classes.
   * @param {Model} instance - The current instance of the model we are displaying a field for.
   * @param {Boolean} desktop - If we should include desktop classes.
   * @param {Boolean} mobile - If we should include mobile classes.
   *
   * @return {String}
   */
  valueInnerClass(value, instance, { desktop = false, mobile = false } = {}) {
    let classes = this.valueInnerClasses;

    if (this.valueInnerClassFn) {
      classes = classes.concat(this.valueInnerClassFn(value, instance));
    }

    if (desktop) {
      classes = classes.concat(this.desktopValueInnerClasses);

      if (this.desktopValueInnerClassFn) {
        classes = classes.concat(this.desktopValueInnerClassFn(value, instance));
      }
    }

    if (mobile) {
      classes = classes.concat(this.mobileValueInnerClasses);

      if (this.mobileValueInnerClassFn) {
        classes = classes.concat(this.mobileValueInnerClassFn(value, instance));
      }
    }

    return classes.join(' ');
  }
}

/**
 * Displays the field without modification.
 */
class FieldString extends FieldDisplay { }

/**
 * Displays the field as a formatted number.
 */
class FieldNumber extends FieldDisplay {
  /**
   * Constructor.
   *
   * @param {String} numberFormat - The number format. (https://numbrojs.com/format.html)
   * @param {Object} options - Remaining options to pass to super.
   */
  constructor({ numberFormat, ...options } = {}) {
    super(options);
    this.numberFormat = numberFormat;
  }

  /**
   * Replace the value with a formatted number value.
   *
   * @param {String} value - The value to replace.
   * @param {Model} instance - The current instance of the model we are displaying a field for.
   *
   * @return {String}
   */
  value(value, instance) {
    return numbro(value).format(this.numberFormat);
  }
}

/**
 * Displays the field as a currency.
 */
class FieldCurrency extends FieldDisplay {
  /**
   * Constructor.
   *
   * @param {String} currencyFormat - The currency format. (https://numbrojs.com/format.html#currency)
   * @param {Object} options - Remaining options to pass to super.
   */
  constructor({ currencyFormat, ...options } = {}) {
    super(options);
    this.currencyFormat = currencyFormat;
  }

  /**
   * Replace the value with a formatted currency.
   *
   * @param {String} value - The value to replace.
   * @param {Model} instance - The current instance of the model we are displaying a field for.
   *
   * @return {String}
   */
  value(value, instance) {
    return numbro(value).formatCurrency(this.currencyFormat);
  }
}

class FieldBoolean extends FieldDisplay {
  /**
   * Constructor.
   *
   * @param {String} trueValue - The value to display when true.
   * @param {String} falseValue - The value to display when false.
   * @param {Object} options - Remaining options to pass to super.
   */
  constructor({ trueValue = 'Yes', falseValue = 'No', ...options } = {}) {
    super(options);
    this.trueValue = trueValue;
    this.falseValue = falseValue;
  }

  /**
   * Replace the value with a string representation.
   *
   * @param {boolean} value - The value to replace.
   * @param {Model} instance - The current instance of the model we are displaying a field for.
   *
   * @return {String}
   */
  value(value, instance) {
    return value ? this.trueValue : this.falseValue;
  }
}

/**
 * Displays a formatted date.
 */
class FieldDate extends FieldDisplay {
  /**
   * Constructor.
   *
   * Default date format: "Jan 25 2020, 10:24:59 pm"
   *
   * @param {String} dateFormat - The date format. (https://momentjs.com/docs/#/displaying/format)
   * @param {String} nullValue - The value to display if null.
   * @param {Object} options - Remaining options to pass to super.
   */
  constructor({ dateFormat = 'MMM D YYYY, h:mm:ss a', nullValue = '-', ...options } = {}) {
    super(options);
    this.dateFormat = dateFormat;
    this.nullValue = nullValue;
  }

  /**
   * Replace the value with a formatted date value.
   *
   * @param {String} value - The value to replace.
   * @param {Model} instance - The current instance of the model we are displaying a field for.
   *
   * @return {String}
   */
  value(value, instance) {
    return value
      ? moment(value).format(this.dateFormat)
      : this.nullValue;
  }
}

/**
 * Displays an enumerated list of values.
 */
class FieldEnum extends FieldDisplay {
  /**
   * Constructor.
   *
   * @param {Object} enumList - The enumeration list of keys and their display values.
   * @param {Object} options - Remaining options to pass to super.
   */
  constructor({ enumList, ...options } = {}) {
    super(options);
    this.enumList = enumList;
  }

  /**
   * Replace the value with the defined enum value.
   *
   * @param {String} value - The value to replace.
   * @param {Model} instance - The current instance of the model we are displaying a field for.
   *
   * @return {String}
   */
  value(value, instance) {
    return this.enumList[value];
  }
}

/**
 * Displays an email link.
 *
 * NOTE: In order to display email links correctly, you must display the contents of "value()" using
 * a `v-html` directive. This can lead to XSS attacks if you have not properly validated the
 * field contents to contain only email addresses! For an example, refer to UserModel's use of the
 * "isEmail" validator. For more information about XSS attacks, please visit:
 *
 * https://owasp.org/www-community/attacks/xss/
 */
class FieldEmail extends FieldDisplay {
  /**
   * Constructor.
   *
   * @param {Object} options - Remaining options to pass to super.
   */
  constructor({ ...options } = {}) {
    super({ isHtml: true, ...options });
  }

  /**
   * Replace the value with the defined enum value.
   *
   * @param {String} value - The value to replace.
   * @param {Model} instance - The current instance of the model we are displaying a field for.
   *
   * @return {String}
   */
  value(value, instance) {
    return `<a href="mailto:${value}">${value}</value>`;
  }
}

/**
 * Calculates the value with a custom value function.
 */
class FieldCustom extends FieldDisplay {
  /**
   * Constructor.
   *
   * @param {Function} valueFn - The custom function to calculate the value with.
   * @param {Object} options - Remaining options to pass to super.
   */
  constructor({ valueFn, ...options } = {}) {
    super(options);
    this.valueFn = valueFn;
  }

  /**
   * Replace the value with the one calculated from the custom function..
   *
   * @param {String} value - The value to replace.
   * @param {Model} instance - The current instance of the model we are displaying a field for.
   *
   * @return {String}
   */
  value(value, instance) {
    return this.valueFn(value, instance);
  }
}

module.exports = {
  FieldDisplay,
  FieldNumber,
  FieldCurrency,
  FieldString,
  FieldBoolean,
  FieldDate,
  FieldEnum,
  FieldEmail,
  FieldCustom,
};
