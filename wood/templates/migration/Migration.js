// Knex.js Schema Builder documentation:
// https://knexjs.org/#Schema

exports.up = async (knex) => {
  await knex.schema.createTable('###_SNAKE_PLURAL_NAME_###', (table) => {
    table.increments();
    table.timestamps(true, true);
    table.string('name').notNullable();
  });
};

exports.down = async (knex) => knex.schema.dropTable('###_SNAKE_PLURAL_NAME_###');
