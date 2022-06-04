exports.up = async (knex) => {
  await knex.schema.createTable('users', (table) => {
    table.increments();
    table.timestamps(true, true);
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.boolean('email_confirmed').defaultTo(false);
    table.string('password');
    table.string('account_type').notNullable();
    table.datetime('last_logged_in_at');
    table.jsonb('flags').notNullable();
    table.integer('jwt_series').defaultTo(1);
    table.string('currency').notNullable();
    table.string('stripe_customer_id');

    table.unique('email');
  });
};

exports.down = async (knex) => knex.schema.dropTable('users');
