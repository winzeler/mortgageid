const { snakeCase, isArray, isUndefined, isObject, pick } = require('lodash');
const { NotFoundError, Standard400Error } = require('#lib/Errors');

class Service {
  /**
   * The constructor.
   *
   * @param {MassiveJS} db - The database to use to create the user.
   * @param {String} tableName - If provided, the name of the table to use for this service.
   *                             If not provided, strip "Service" from class name and use that.
   * @param {Nodemailer} mailer - The mailer to use to send mail.
   */
  constructor({ db, tableName, mailer } = {}) {
    this.db = db;
    this.mailer = mailer;

    if (this.db) {
      this.tableName = tableName || snakeCase(this.constructor.name.slice(0, -7));
    }
  }

  /**
   * Modifies array data to a format that can be inserted into a JSONB column.
   *
   * @param {Array} data - The data to  modify.
   *
   * @return {Object}
   */
  toArrayColumn(data) {
    return {
      data,
      rawType: true,
      toPostgres: (p) => this.db.pgp.as.format('$1::jsonb', [JSON.stringify(p.data)]),
    };
  }

  /**
   * Returns a reference to the MassiveJS table object within the provided transaction.
   *
   * If no transaction provided (null tx), run query through database without a transaction.
   *
   * @param {Transaction} tx - The transaction to work within.
   *
   * @return {Entity}
   */
  table(tx) {
    const table = tx ? tx[this.tableName] : this.db[this.tableName];

    if (! table) {
      // In development, display error to user in client
      if (process.env.NODE_ENV === 'development') {
        throw new Standard400Error([{
          code: 'MIGRATIONS_MISSING',
          title: `Table '${this.tableName}' does not exist.  Have migrations been run?`,
        }]);
      }

      // In production, output error in logs only
      throw new Error(`Table '${this.tableName}' does not exist.  Have migrations been run?`);
    }

    return table;
  }

  /**
   * Find an instance of a model with a specific ID.
   *
   * NOTE: Requires "this.model" to be set in constructor.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} id - ID of table row to find instance of.
   *
   * @return {Model}
   */
  async find(tx, id) {
    if (! this.db) {
      throw new Error('DB not configured for this service.');
    }

    if (isObject(id)) {
      throw new Error('Provided \'id\' is an object.  Did you mean to use `findBy()`?');
    }

    const row = await this.table(tx).findOne({ id });

    if (! row) {
      throw new NotFoundError(`Could not find entry for ${this.tableName} with ID #${id}.`);
    }

    return new this.model(row);
  }

  /**
   * Find instances of a model with specific values.
   *
   * NOTE: Requires "this.model" to be set in constructor.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Object} query - Query for table row to find instances of.
   * @param {Number} page - The page of the list to display.
   * @param {Number} per - The number of entries per page.
   * @param {Object} options - Additional options to pass.
   *
   * @return {Array<Model>}
   */
  async findBy(tx, query, { page, per, ...options } = {}) {
    if (! this.db) {
      throw new Error('DB not configured for this service.');
    }

    if (! isUndefined(page) && ! isUndefined(per)) {
      options.offset = (page - 1) * per;
      options.limit = parseInt(per, 10);
    }

    return (await this.table(tx).find(query, options)).map((instance) => new this.model(instance));
  }

  /**
   * Get a count of the number of instances would be returned for the specified query.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Object} query - Query for table row to find instances of.
   *
   * @return {Number}
   */
  async count(tx, query) {
    if (! this.db) {
      throw new Error('DB not configured for this service.');
    }

    return this.table(tx).count(query);
  }

  /**
   * Gets the search query for searching for users.
   *
   * @param {String} search - The term to search for.
   *
   * @return {Object}
   */
  getSearchQuery(search) {
    return search ? { 'name ilike': `%${search}%` } : {};
  }

  /**
   * Insert an instance.
   *
   * For security, you must ALWAYS pass the keys you wish to update.  This way, you can't just
   * pass req.body and potentially allow people to update any key they wish.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Object} values - The values to update.
   * @param {Array} keys - The keys to pick from the values.
   *
   * @return {Model}
   */
  async insert(tx, values, keys) {
    if (! this.db) {
      throw new Error('DB not configured for this service.');
    }

    if (! keys) {
      throw new Error('The `keys` parameter is missing.');
    }

    return new this.model(await this.table(tx).insert(pick(values, keys)));
  }

  /**
   * Inserts an instance of a model.
   *
   * NOTE: Requires "this.model" to be set in constructor, and requires that the model to be
   * inserted matches.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Model} model - The model to insert.
   *
   * @return {Model} - The updated model, with key(s).
   */
  async insertModel(tx, model) {
    if (model.constructor.name !== this.model.name) {
      throw new Error(`Model to insert (${model.constructor.name}) does not match service model (${this.model.name}).`); // eslint-disable-line max-len
    }

    return this.insert(tx, model.toJSON(), Object.keys(model.toJSON()));
  }

  /**
   * Update an instance.
   *
   * For security, you must ALWAYS pass the keys you wish to update.  This way, you can't just
   * pass req.body and potentially allow people to update any key they wish.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} id - The ID of or query for the instance or instances to update.
   * @param {Object} values - The values to update.
   * @param {Array} keys - The keys to pick from the values.
   *
   * @return {Array<Model>}
   */
  async update(tx, id, values, keys) {
    if (! this.db) {
      throw new Error('DB not configured for this service.');
    }

    if (! keys) {
      throw new Error('The `keys` parameter is missing.');
    }

    const updated = await this.table(tx).update(id, pick(values, keys));

    return isArray(updated)
      ? updated.map((row) => new this.model(row))
      : new this.model(updated);
  }

  /**
   * Delete an instance, removing it from the DB.
   *
   * @param {Transaction} tx - The transaction to work within.
   * @param {Number} id - The ID of the instance being deleted.
   *
   * @return {Array|Object} https://massivejs.org/docs/persistence#destroy
   */
  async delete(tx, id) {
    return this.table(tx).destroy(id);
  }
}

module.exports = {
  Service,
};
