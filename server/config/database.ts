import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  acquireTimeout: number;
  timeout: number;
  reconnect: boolean;
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'booch_buddie',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create connection pool
export const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Execute query helper
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

// Execute single row query helper
export async function executeQuerySingle<T = any>(
  query: string, 
  params: any[] = []
): Promise<T | null> {
  const results = await executeQuery<T>(query, params);
  return results.length > 0 ? results[0] : null;
}

// Execute insert query and return inserted ID
export async function executeInsert(
  query: string, 
  params: any[] = []
): Promise<number> {
  try {
    const [result] = await pool.execute(query, params) as any;
    return result.insertId;
  } catch (error) {
    console.error('Insert execution error:', error);
    throw error;
  }
}

// Execute update/delete query and return affected rows
export async function executeUpdate(
  query: string, 
  params: any[] = []
): Promise<number> {
  try {
    const [result] = await pool.execute(query, params) as any;
    return result.affectedRows;
  } catch (error) {
    console.error('Update execution error:', error);
    throw error;
  }
}