/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('assessments', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.json('responses').notNullable();
    table.integer('risk_score').notNullable();
    table.string('risk_level', 50).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Foreign key relationship to users table
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('assessments');
};
