/**
 * SQL Query Validator
 *
 * Validates generated SQL queries for safety before execution
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedSQL?: string;
}

export class QueryValidator {
  // Dangerous SQL keywords that should NEVER appear
  private static FORBIDDEN_KEYWORDS = [
    'DROP',
    'DELETE',
    'TRUNCATE',
    'ALTER',
    'CREATE',
    'GRANT',
    'REVOKE',
    'INSERT',
    'UPDATE',
    'EXEC',
    'EXECUTE',
    '--', // SQL comments can hide malicious code
    ';', // Multiple statements
  ];

  // Allowed operations
  private static ALLOWED_KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'ORDER', 'GROUP', 'HAVING', 'LIMIT'];

  /**
   * Validate SQL query for safety
   */
  static validate(sql: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Normalize SQL (uppercase, remove extra whitespace)
    const normalizedSQL = sql.trim().toUpperCase().replace(/\s+/g, ' ');

    // Check for forbidden keywords
    for (const keyword of this.FORBIDDEN_KEYWORDS) {
      if (normalizedSQL.includes(keyword)) {
        errors.push(`Forbidden keyword detected: ${keyword}`);
      }
    }

    // Must start with SELECT
    if (!normalizedSQL.startsWith('SELECT')) {
      errors.push('Query must start with SELECT');
    }

    // Check for LIMIT clause
    if (!normalizedSQL.includes('LIMIT')) {
      warnings.push('No LIMIT clause - may return large result set');
    }

    // Check for WHERE clause (recommended for most queries)
    if (!normalizedSQL.includes('WHERE') && normalizedSQL.includes('FROM')) {
      warnings.push('No WHERE clause - query will return all rows');
    }

    // Check for multiple statements (;)
    const semicolonCount = (sql.match(/;/g) || []).length;
    if (semicolonCount > 1 || (semicolonCount === 1 && !sql.trim().endsWith(';'))) {
      errors.push('Multiple SQL statements not allowed');
    }

    // Check for SQL injection patterns
    if (this.containsSQLInjectionPattern(sql)) {
      errors.push('Potential SQL injection pattern detected');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitizedSQL: errors.length === 0 ? sql.trim() : undefined,
    };
  }

  /**
   * Detect common SQL injection patterns
   */
  private static containsSQLInjectionPattern(sql: string): boolean {
    const injectionPatterns = [
      /'\s*OR\s*'1'\s*=\s*'1/i,
      /'\s*OR\s*1\s*=\s*1/i,
      /UNION\s+SELECT/i,
      /;\s*DROP/i,
      /xp_cmdshell/i,
    ];

    return injectionPatterns.some((pattern) => pattern.test(sql));
  }

  /**
   * Add LIMIT if not present
   */
  static ensureLimit(sql: string, defaultLimit: number = 100): string {
    if (!sql.toUpperCase().includes('LIMIT')) {
      // Remove trailing semicolon if present
      const cleanSQL = sql.trim().replace(/;$/, '');
      return `${cleanSQL} LIMIT ${defaultLimit}`;
    }
    return sql;
  }

  /**
   * Sanitize table/column names
   */
  static sanitizeIdentifier(identifier: string): string {
    // Only allow alphanumeric, underscore, and dot (for schema.table)
    return identifier.replace(/[^a-zA-Z0-9_.]/g, '');
  }
}
