// Knex.js Schema Builder documentation:
// https://knexjs.org/#Schema

const secureFlags = [
  'creationToken',
  'creationTokenGeneratedAt',
  'passwordResetToken',
  'passwordResetTokenGeneratedAt',
];

exports.up = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.jsonb('secure_flags').notNullable().defaultTo({});
  });

  const users = await knex('users').orderBy('id', 'asc');
  for await (let user of users) { // eslint-disable-line
    secureFlags.forEach((secureFlag) => {
      if (user.flags[secureFlag]) {
        user.secure_flags[secureFlag] = user.flags[secureFlag];
        delete user.flags[secureFlag];
      }
    });

    await knex.table('users')
      .where({ id: user.id })
      .update({
        flags: JSON.stringify(user.flags),
        secure_flags: JSON.stringify(user.secure_flags),
      });
  }

  await knex.schema.alterTable('teams', (table) => {
    table.jsonb('secure_flags').notNullable().defaultTo({});
  });
};

exports.down = async (knex) => {
  const users = await knex('users').orderBy('id', 'asc');
  for await (let user of users) { // eslint-disable-line
    secureFlags.forEach((secureFlag) => {
      if (user.secure_flags[secureFlag]) {
        user.flags[secureFlag] = user.secure_flags[secureFlag];
        delete user.secure_flags[secureFlag];
      }
    });

    await knex.table('users')
      .where({ id: user.id })
      .update({
        flags: JSON.stringify(user.flags),
        secure_flags: JSON.stringify(user.secure_flags),
      });
  }

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('secure_flags');
  });

  await knex.schema.alterTable('teams', (table) => {
    table.dropColumn('secure_flags');
  });
};
