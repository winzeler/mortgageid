// Knex.js Schema Builder documentation:
// https://knexjs.org/#Schema

exports.up = async (knex) => {
  await knex.schema.createTable('admin_dashboard_rollups', (table) => {
    table.increments();
    table.date('day');
    table.integer('users_count').defaultTo(0);
    table.integer('teams_count').defaultTo(0);
    table.integer('mrr_amount').defaultTo(0); // In cents

    table.unique('day');
  });
};

exports.down = async (knex) => knex.schema.dropTable('admin_dashboard_rollups');
