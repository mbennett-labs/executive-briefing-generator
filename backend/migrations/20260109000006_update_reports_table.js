/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('reports', (table) => {
    // Add content column for storing generated report JSON
    table.json('content');
    // Rename pdf_url to pdf_path for clarity
    // Note: SQLite doesn't support rename, so we add pdf_path
    table.string('pdf_path', 500);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('reports', (table) => {
    table.dropColumn('content');
    table.dropColumn('pdf_path');
  });
};
