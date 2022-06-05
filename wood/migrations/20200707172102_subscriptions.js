// Knex.js Schema Builder documentation:
// https://knexjs.org/#Schema

exports.up = async (knex) => {
  await knex.schema.createTable('subscriptions', (table) => {
    table.increments();
    table.timestamps(true, true);
    table.integer('user_id').unsigned().notNullable();
    table.string('subscription_id').notNullable();
    table.string('status').notNullable();
    table.string('product_id').notNullable();
    table.string('price_id').notNullable();
    table.jsonb('tax_ids').notNullable();
    table.string('coupon_id');
    table.timestamp('trial_ends_at');
    table.timestamp('next_billing_date').notNullable();
    table.integer('next_invoice_total').notNullable();

    table.foreign('user_id').references('users.id').onDelete('CASCADE');
  });
};

exports.down = async (knex) => knex.schema.dropTable('subscriptions');
