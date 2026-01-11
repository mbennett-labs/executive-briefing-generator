/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('assessments', (table) => {
    // Add organization details
    table.string('organization_name', 255);
    table.string('organization_type', 100);
    table.string('employee_count', 50);

    // Add category scores (JSON object with scores per category)
    table.json('scores');

    // Rename risk_score to overall_score for clarity
    // Note: SQLite doesn't support column rename, so we add a new column
    table.integer('overall_score');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('assessments', (table) => {
    table.dropColumn('organization_name');
    table.dropColumn('organization_type');
    table.dropColumn('employee_count');
    table.dropColumn('scores');
    table.dropColumn('overall_score');
  });
};
