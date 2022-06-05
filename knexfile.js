module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: 'postgres',
      database: 'nodewood',
      user: 'nodewood',
      password: 'nodewood',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      stub: 'migrations.stub',
      directory: [
        './wood/migrations',
        './app/migrations',
      ],
    },
  },

  test: {
    client: 'postgresql',
    connection: {
      host: 'postgres',
      database: 'test',
      user: 'test',
      password: 'test',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      stub: 'migrations.stub',
      directory: [
        './wood/migrations',
        './app/migrations',
      ],
    },
  },
};
