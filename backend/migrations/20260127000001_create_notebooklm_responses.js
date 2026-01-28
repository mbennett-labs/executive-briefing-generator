/**
 * Create notebooklm_responses table
 * Stores NotebookLM query responses for assessments
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('notebooklm_responses', table => {
    table.increments('id').primary();
    table.integer('assessment_id').unsigned().references('id').inTable('assessments');
    table.string('query_id', 50).notNullable(); // 'data_sensitivity', 'encryption', 'compliance', 'executive_synthesis'
    table.text('response_text');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');

    // Unique constraint to prevent duplicate responses for same assessment/query
    table.unique(['assessment_id', 'query_id']);

    // Index for faster lookups
    table.index(['assessment_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('notebooklm_responses');
};
