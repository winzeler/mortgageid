// Knex.js Schema Builder documentation:
// https://knexjs.org/#Schema
const { head } = require('lodash');

exports.up = async (knex) => {
  // Create teams table
  await knex.schema.createTable('teams', (table) => {
    table.increments();
    table.timestamps(true, true);
    table.string('name').notNullable();
    table.string('currency').notNullable();
    table.string('stripe_customer_id');
  });

  // Create invites table
  await knex.schema.createTable('team_invites', (table) => {
    table.increments();
    table.timestamps(true, true);
    table.integer('team_id').unsigned().notNullable();
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.string('role').notNullable();
    table.string('token').notNullable();

    table.unique(['team_id', 'email']);
    table.foreign('team_id').references('teams.id').onDelete('CASCADE');
  });

  // Create users_teams table
  await knex.schema.createTable('users_teams', (table) => {
    table.integer('user_id').unsigned().notNullable();
    table.integer('team_id').unsigned().notNullable();
    table.timestamps(true, true);
    table.string('role').notNullable();

    table.primary(['user_id', 'team_id']);
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.foreign('team_id').references('teams.id').onDelete('CASCADE');
  });

  // Add nullable `team_id` to subscriptions
  await knex.schema.alterTable('subscriptions', (table) => {
    table.integer('team_id').unsigned();
  });

  // Iterate over every user
  const users = await knex('users').orderBy('id', 'asc');
  for await (let user of users) { // eslint-disable-line
    // Create teams for every user
    const team = head(await knex('teams').insert({
      name: `${user.name}'s Team`,
      currency: user.currency,
      stripe_customer_id: user.stripe_customer_id,
    }).returning('*'));

    // Create users_teams entry for every user as `owner`
    await knex('users_teams').insert({
      user_id: user.id,
      team_id: team.id,
      role: 'owner',
    });

    // For every user, update their subscription's `team_id` to match their team ID
    await knex('subscriptions').where({ user_id: user.id }).update({ team_id: team.id });
  }

  await knex.schema.alterTable('subscriptions', (table) => {
    // Change `team_id` in subscriptions to be not nullable
    table.integer('team_id').unsigned().notNullable().alter();

    // Remove `user_id` from subscriptions
    table.dropColumn('user_id');

    // Add foreign key reference for teams
    table.foreign('team_id').references('teams.id').onDelete('CASCADE');
  });

  // Remove `stripe_customer_id` and `currency` from user
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('stripe_customer_id');
    table.dropColumn('currency');
  });
};

// CAUTION: This rollback will only work if there is one user per team.

exports.down = async (knex) => {
  // Add `stripe_customer_id` and `currency` back to user
  await knex.schema.alterTable('users', (table) => {
    table.string('stripe_customer_id');
    table.string('currency');
  });

  // Add `user_id` back to subscriptions
  await knex.schema.alterTable('subscriptions', (table) => {
    table.integer('user_id').unsigned();
  });

  // Loop over all users
  const users = await knex('users').orderBy('id', 'asc');
  for await (let user of users) { // eslint-disable-line
    const team = head(await knex('teams')
      .join('users_teams', 'teams.id', 'users_teams.team_id')
      .where({ 'users_teams.user_id': user.id })
      .select('teams.*'));

    // Update user's subscription's `user_id`
    await knex('subscriptions').where({ team_id: team.id }).update({ user_id: user.id });

    // Update user's `stripe_customer_id` and `currency`
    await knex('users').where({ id: user.id }).update({
      stripe_customer_id: team.stripe_customer_id,
      currency: team.currency,
    });
  }

  await knex.schema.alterTable('subscriptions', (table) => {
    // Remove `team_id` from subscriptions
    table.dropColumn('team_id');

    // Make `user_id` not nullable any more
    table.integer('user_id').unsigned().notNullable().alter();
  });

  // Make user's currency not nullable
  await knex.schema.alterTable('users', (table) => {
    table.string('currency').notNullable().alter();
  });

  await knex.schema.dropTable('users_teams');
  await knex.schema.dropTable('team_invites');
  await knex.schema.dropTable('teams');
};
