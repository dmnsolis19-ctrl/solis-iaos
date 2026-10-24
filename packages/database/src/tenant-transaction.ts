/** The pool must use a dedicated login with only its own runtime role granted. */
export interface TenantConnection {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  release(destroy?: boolean): void;
}

export interface TenantPool {
  connect(): Promise<TenantConnection>;
}

export type RuntimeRole =
  | "solis_api_runtime"
  | "solis_worker_runtime"
  | "solis_readonly_runtime";

export interface TenantTransactionOptions {
  tenantId: string;
  role: RuntimeRole;
  statementTimeoutMs?: number;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const roles = new Set<RuntimeRole>([
  "solis_api_runtime",
  "solis_worker_runtime",
  "solis_readonly_runtime",
]);

/**
 * Use this boundary for membership/gateway lookup, then authorize before domain SQL.
 * RLS is defense in depth; a tenant UUID supplied by a caller is not authorization.
 * Callback code must not start/finish transactions, change roles, or retain the connection.
 */
export async function withTenantTransaction<T>(
  pool: TenantPool,
  options: TenantTransactionOptions,
  operation: (connection: TenantConnection) => Promise<T>,
): Promise<T> {
  if (!uuidPattern.test(options.tenantId) || !roles.has(options.role)) {
    throw new Error("INVALID_TENANT_CONTEXT");
  }
  const timeout = options.statementTimeoutMs ?? 10_000;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 60_000) {
    throw new Error("INVALID_STATEMENT_TIMEOUT");
  }

  const connection = await pool.connect();
  let transactionOpen = false;
  let destroy = false;
  try {
    // The session login itself must not be the migration owner/superuser.
    const identity = await connection.query(`
      SELECT rolsuper, rolbypassrls
      FROM pg_roles WHERE rolname = session_user
    `);
    const session = identity.rows[0];
    if (session === undefined || session.rolsuper !== false || session.rolbypassrls !== false) {
      destroy = true;
      throw new Error("UNSAFE_DATABASE_LOGIN");
    }

    await connection.query("BEGIN");
    transactionOpen = true;
    // Interpolation is restricted to the fixed runtime-role allowlist above.
    await connection.query(`SET LOCAL ROLE ${options.role}`);
    await connection.query("SET LOCAL row_security = on");
    await connection.query(
      `SELECT set_config('app.tenant_id', $1, true),
              set_config('statement_timeout', $2, true),
              set_config('lock_timeout', '2000', true),
              set_config('idle_in_transaction_session_timeout', '15000', true)`,
      [options.tenantId.toLowerCase(), String(timeout)],
    );
    const effective = await connection.query(`
      SELECT current_user AS role_name, rolsuper, rolbypassrls
      FROM pg_roles WHERE rolname = current_user
    `);
    const role = effective.rows[0];
    if (
      role?.role_name !== options.role ||
      role.rolsuper !== false ||
      role.rolbypassrls !== false
    ) {
      throw new Error("UNSAFE_DATABASE_ROLE");
    }

    const result = await operation(connection);
    try {
      await connection.query("COMMIT");
    } catch (error) {
      // A lost COMMIT response has an unknown outcome. Never reuse that connection.
      destroy = true;
      throw error;
    }
    transactionOpen = false;
    return result;
  } catch (error) {
    if (transactionOpen) {
      try {
        await connection.query("ROLLBACK");
      } catch {
        destroy = true;
      }
    } else {
      destroy = true;
    }
    throw error;
  } finally {
    connection.release(destroy);
  }
}
