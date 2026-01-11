/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('questions', (table) => {
    table.increments('id').primary();
    table.string('category', 50).notNullable();
    table.text('question_text').notNullable();
    table.string('answer_type', 30).notNullable();
    table.json('answer_options').notNullable();
    table.integer('weight').defaultTo(1);
    table.integer('order_index').notNullable();

    // Index for efficient category-based queries
    table.index('category');
    table.index('order_index');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('questions');
};
