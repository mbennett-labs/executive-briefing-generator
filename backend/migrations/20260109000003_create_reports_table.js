/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('reports', (table) => {
    table.increments('id').primary();
    table.integer('assessment_id').unsigned().notNullable();
    table.string('pdf_url', 500);
    table.boolean('email_sent').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Foreign key relationship to assessments table
    table.foreign('assessment_id').references('id').inTable('assessments').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('reports');
};
