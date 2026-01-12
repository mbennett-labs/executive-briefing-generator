/**
 * Thread-Based Engineering Validator
 * Boris Chalk method - Run THICKER, LONGER threads with validation loops
 *
 * Ensures data persistence through multi-thread validation:
 * - Thread 1: Generate (external API call)
 * - Thread 2: Save (database insert)
 * - Thread 3: Verify (SELECT to confirm save)
 * - Thread 4: Validate (check all fields populated)
 * - Self-Heal: Auto-fix schema issues and retry
 */

const db = require('../db');

class ThreadValidator {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.threads = {};
    this.startTime = Date.now();
  }

  /**
   * Record thread completion
   */
  recordThread(threadName, status, details = {}) {
    this.threads[threadName] = {
      status,
      duration_ms: Date.now() - this.startTime,
      ...details
    };
    console.log(`[Thread ${this.getThreadNumber(threadName)} ${status}] ${threadName}`, {
      duration_ms: this.threads[threadName].duration_ms,
      ...details
    });
  }

  getThreadNumber(threadName) {
    const threadMap = { generate: 1, save: 2, verify: 3, validate: 4 };
    return threadMap[threadName] || '?';
  }

  /**
   * Thread 2: Save to database with error handling
   */
  async saveToDatabase(Report, data, retryCount = 0) {
    console.log(`[Thread 2 START] Inserting report to database`, {
      assessment_id: data.assessment_id,
      contentSize: data.content ? JSON.stringify(data.content).length : 0,
      attempt: retryCount + 1
    });

    try {
      const report = await Report.create(data);
      this.recordThread('save', '✅', { reportId: report.id });
      return { success: true, report };
    } catch (error) {
      console.error(`[Thread 2 FAILED] Database insert error`, {
        error: error.message,
        code: error.code,
        attempt: retryCount + 1
      });

      // Attempt self-healing if we have retries left
      if (retryCount < this.maxRetries) {
        const healed = await this.selfHeal(error);
        if (healed) {
          console.log(`[Self-Heal] Schema fix applied, retrying save...`);
          return this.saveToDatabase(Report, data, retryCount + 1);
        }
      }

      this.recordThread('save', '❌', { error: error.message, code: error.code });
      return { success: false, error };
    }
  }

  /**
   * Thread 3: Verify report exists in database
   */
  async verifyInDatabase(Report, reportId) {
    console.log(`[Thread 3 START] Verifying report in database`, { reportId });

    try {
      const report = await Report.findById(reportId);

      if (!report) {
        const error = new Error(`Report ${reportId} not found in database after save`);
        error.code = 'VERIFY_NOT_FOUND';
        this.recordThread('verify', '❌', { error: error.message });
        return { success: false, error };
      }

      this.recordThread('verify', '✅', { reportId: report.id });
      return { success: true, report };
    } catch (error) {
      console.error(`[Thread 3 FAILED] Verification query error`, {
        reportId,
        error: error.message
      });
      this.recordThread('verify', '❌', { error: error.message });
      return { success: false, error };
    }
  }

  /**
   * Thread 4: Validate data integrity
   */
  validateDataIntegrity(report) {
    console.log(`[Thread 4 START] Validating data integrity`, { reportId: report.id });

    const validationErrors = [];

    // Check: assessment_id exists
    if (!report.assessment_id) {
      validationErrors.push('assessment_id is missing');
    }

    // Check: content is valid JSON (if present)
    if (report.content) {
      try {
        const content = typeof report.content === 'string'
          ? JSON.parse(report.content)
          : report.content;
        if (!content || typeof content !== 'object') {
          validationErrors.push('content is not valid JSON object');
        }
      } catch (e) {
        validationErrors.push(`content JSON parse error: ${e.message}`);
      }
    }

    // Check: created_at timestamp exists
    if (!report.created_at) {
      validationErrors.push('created_at timestamp is missing');
    }

    // Check: id is valid
    if (!report.id || report.id <= 0) {
      validationErrors.push('id is invalid');
    }

    if (validationErrors.length > 0) {
      this.recordThread('validate', '❌', { errors: validationErrors });
      return { success: false, errors: validationErrors };
    }

    this.recordThread('validate', '✅', {
      reportId: report.id,
      assessment_id: report.assessment_id,
      hasContent: !!report.content,
      created_at: report.created_at
    });
    return { success: true };
  }

  /**
   * Self-Healing Logic
   * Attempts to fix schema issues and return true if fixed
   */
  async selfHeal(error) {
    const errorMsg = error.message || '';
    const errorCode = error.code || '';

    console.log(`[Self-Heal] Analyzing error for auto-fix`, {
      message: errorMsg,
      code: errorCode
    });

    try {
      // Handle "no such column" errors - add missing column
      if (errorMsg.includes('no such column') || errorMsg.includes('Unknown column')) {
        const columnMatch = errorMsg.match(/column[:\s]+['"]?(\w+)['"]?/i) ||
                           errorMsg.match(/['"](\w+)['"]\s+column/i);

        if (columnMatch) {
          const columnName = columnMatch[1];
          console.log(`[Self-Heal] Attempting to add missing column: ${columnName}`);

          // Determine column type based on common patterns
          let columnType = 'TEXT';
          if (columnName.includes('_id')) columnType = 'INTEGER';
          if (columnName.includes('_at') || columnName.includes('date')) columnType = 'DATETIME';
          if (columnName.includes('is_') || columnName.includes('_sent')) columnType = 'BOOLEAN DEFAULT 0';
          if (columnName === 'content') columnType = 'JSON';

          await db.raw(`ALTER TABLE reports ADD COLUMN ${columnName} ${columnType}`);
          console.log(`[Self-Heal] Successfully added column: ${columnName} (${columnType})`);
          return true;
        }
      }

      // Handle foreign key constraint errors
      if (errorMsg.includes('FOREIGN KEY constraint failed') ||
          errorMsg.includes('foreign key constraint')) {
        console.log(`[Self-Heal] Foreign key constraint issue detected`);
        // For SQLite, we can't easily fix FK issues without recreating the table
        // Log detailed info for manual investigation
        console.error(`[Self-Heal] FK constraint - check that assessment_id exists in assessments table`);
        return false;
      }

      // Handle SQLITE_CONSTRAINT errors
      if (errorCode === 'SQLITE_CONSTRAINT' || errorMsg.includes('UNIQUE constraint')) {
        console.log(`[Self-Heal] Constraint violation - likely duplicate entry`);
        return false;
      }

      // Handle table doesn't exist
      if (errorMsg.includes('no such table') || errorMsg.includes("doesn't exist")) {
        console.log(`[Self-Heal] Table missing - running migrations may be required`);
        // Cannot auto-create table - would need full schema
        return false;
      }

      console.log(`[Self-Heal] No automatic fix available for this error type`);
      return false;
    } catch (healError) {
      console.error(`[Self-Heal] Fix attempt failed`, {
        originalError: errorMsg,
        healError: healError.message
      });
      return false;
    }
  }

  /**
   * Run full validation pipeline (Threads 2-4)
   * Thread 1 (Generate) should be called separately before this
   */
  async runValidationPipeline(Report, data) {
    const result = {
      success: false,
      reportId: null,
      threads: this.threads,
      errors: []
    };

    // Thread 2: Save to database
    const saveResult = await this.saveToDatabase(Report, data);
    if (!saveResult.success) {
      result.errors.push(`Save failed: ${saveResult.error.message}`);
      result.threads = this.threads;
      return result;
    }

    const reportId = saveResult.report.id;

    // Thread 3: Verify in database
    const verifyResult = await this.verifyInDatabase(Report, reportId);
    if (!verifyResult.success) {
      result.errors.push(`Verify failed: ${verifyResult.error.message}`);
      result.threads = this.threads;
      return result;
    }

    // Thread 4: Validate data integrity
    const validateResult = this.validateDataIntegrity(verifyResult.report);
    if (!validateResult.success) {
      result.errors.push(`Validation failed: ${validateResult.errors.join(', ')}`);
      result.threads = this.threads;
      return result;
    }

    // All threads passed!
    result.success = true;
    result.reportId = reportId;
    result.report = verifyResult.report;
    result.threads = this.threads;

    console.log(`[ThreadValidator] ALL FOUR THREADS PASSED`, {
      reportId,
      totalDuration_ms: Date.now() - this.startTime
    });

    return result;
  }

  /**
   * Get summary of all threads
   */
  getSummary() {
    return {
      threads: this.threads,
      allPassed: Object.values(this.threads).every(t => t.status === '✅'),
      totalDuration_ms: Date.now() - this.startTime
    };
  }
}

module.exports = ThreadValidator;
