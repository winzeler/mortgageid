// Knex.js Schema Builder documentation:
// https://knexjs.org/#Schema

exports.up = async (knex) => {
  await knex.schema.alterTable('teams', (table) => {
    table.jsonb('flags').notNullable().defaultTo({});
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('teams', (table) => {
    table.dropColumn('flags');
  });
};
