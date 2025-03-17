import { supabase } from "@/integrations/supabase/client";
import { debugDB } from "@/lib/utils/debug.service";

export type DatabaseError = {
  message: string;
  code?: string;
  details?: string;
};

export type DatabaseResponse<T> = {
  exists: boolean;
  data: T | null;
  error: DatabaseError | null;
};

/**
 * Service for database operations with error handling and debugging
 */
export class DatabaseService {
  /**
   * Insert a record into a database table
   */
  static async insertRecord<T extends Record<string, unknown>>(table: string, data: T): Promise<{ data: T | null; error: DatabaseError | null }> {
    try {
      debugDB.step(`Starting ${table} record insertion`, data);

      const { data: insertedData, error } = await supabase
        .from(table)
        .insert([data])
        .select()
        .single();

      if (error) {
        debugDB.error(`${table} insertion failed`, error as DatabaseError);
        return { data: null, error: error as DatabaseError };
      }

      debugDB.info(`${table} insertion result`, insertedData);

      // Verify the insertion
      const { exists, data: verifiedData, error: verifyError } = await DatabaseVerificationService.verifyRecord<T>(table, insertedData.id);

      if (!exists || verifyError) {
        const error: DatabaseError = {
          message: 'Verification failed',
          details: verifyError?.message
        };
        debugDB.error(`${table} verification failed`, error);
        return { data: null, error };
      }

      return { data: verifiedData, error: null };
    } catch (error) {
      const dbError = error as DatabaseError;
      debugDB.error(`${table} insertion error`, dbError);
      return { data: null, error: dbError };
    }
  }

  /**
   * Get a record by ID
   */
  static async getRecord<T>(table: string, id: string): Promise<{ data: T | null; error: DatabaseError | null }> {
    try {
      debugDB.step(`Getting record from ${table}`, { id });
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        debugDB.error(`${table} get record failed`, error as DatabaseError);
        return { data: null, error: error as DatabaseError };
      }
      
      debugDB.info(`${table} get record result`, data);
      return { data: data as T, error: null };
    } catch (error) {
      const dbError = error as DatabaseError;
      debugDB.error(`${table} get record error`, dbError);
      return { data: null, error: dbError };
    }
  }

  /**
   * Delete a record by ID
   */
  static async deleteRecord(table: string, id: string): Promise<{ success: boolean; error: DatabaseError | null }> {
    try {
      debugDB.step(`Deleting record from ${table}`, { id });
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
        
      if (error) {
        debugDB.error(`${table} delete record failed`, error as DatabaseError);
        return { success: false, error: error as DatabaseError };
      }
      
      debugDB.info(`${table} record deleted successfully`, { id });
      return { success: true, error: null };
    } catch (error) {
      const dbError = error as DatabaseError;
      debugDB.error(`${table} delete record error`, dbError);
      return { success: false, error: dbError };
    }
  }

  /**
   * Query records with filters
   */
  static async queryRecords<T>(
    table: string, 
    filters: Record<string, string | number | boolean | null>,
    options: { 
      orderBy?: string; 
      ascending?: boolean;
      limit?: number;
    } = {}
  ): Promise<{ data: T[] | null; error: DatabaseError | null }> {
    try {
      debugDB.step(`Querying ${table} records`, { filters, options });
      
      let query = supabase.from(table).select('*');
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.ascending ?? false 
        });
      }
      
      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        debugDB.error(`${table} query failed`, error as DatabaseError);
        return { data: null, error: error as DatabaseError };
      }
      
      debugDB.info(`${table} query results`, { 
        count: data?.length,
        data 
      });
      
      return { data: data as T[], error: null };
    } catch (error) {
      const dbError = error as DatabaseError;
      debugDB.error(`${table} query error`, dbError);
      return { data: null, error: dbError };
    }
  }
}

/**
 * Service for verifying database records and operations
 */
export class DatabaseVerificationService {
  /**
   * Verify if a record exists by ID
   */
  static async verifyRecord<T>(table: string, id: string): Promise<DatabaseResponse<T>> {
    try {
      debugDB.step(`Verifying record exists in ${table}`, { id });
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      debugDB.info('Record verification result', { data, error });
      
      return {
        exists: !!data,
        data: data as T,
        error: error as DatabaseError
      };
    } catch (error) {
      const dbError = error as DatabaseError;
      debugDB.error('Record verification failed', dbError);
      return { exists: false, data: null, error: dbError };
    }
  }

  /**
   * Count records in a table
   */
  static async countRecords(table: string): Promise<number> {
    try {
      debugDB.step(`Counting records in ${table}`);
      
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      debugDB.info('Table record count', { count, error });
      
      return count || 0;
    } catch (error) {
      const dbError = error as DatabaseError;
      debugDB.error('Count records failed', dbError);
      return 0;
    }
  }

  /**
   * Verify table exists and check its structure
   */
  static async verifyTableExists(tableName: string): Promise<boolean> {
    debugDB.step(`Verifying ${tableName} table exists`);
    
    try {
      const { error } = await supabase
        .from(tableName)
        .select("id")
        .limit(1);
        
      if (error) {
        debugDB.error('Table verification failed', error);
        return false;
      }
      
      debugDB.info(`Table ${tableName} exists and is accessible`);
      return true;
    } catch (error) {
      debugDB.error('Table verification error', error);
      return false;
    }
  }
} 