import { readFileSync } from 'fs';
import { join } from 'path';
import { sequelize } from '../config/database';

/**
 * Apply database triggers từ SQL file
 * Chạy các triggers được định nghĩa trong database/triggers/order_triggers.sql
 */
export async function applyOrderTriggers(): Promise<void> {
  try {
    const sqlFilePath = join(process.cwd(), 'database', 'triggers', 'order_triggers.sql');
    
    // Kiểm tra file có tồn tại không
    try {
      readFileSync(sqlFilePath, 'utf-8');
    } catch (fileError) {
      console.error(` SQL file not found: ${sqlFilePath}`);
      throw new Error(`SQL trigger file not found: ${sqlFilePath}`);
    }
    
    const sql = readFileSync(sqlFilePath, 'utf-8');
    
    // Parse SQL file: tách các trigger riêng biệt
    // MySQL triggers sử dụng DELIMITER $$ để thay đổi delimiter
    // Sequelize.query() không hỗ trợ DELIMITER, nên cần parse thủ công
    
    // Tách thành các phần: DROP statements và CREATE TRIGGER statements
    const lines = sql.split('\n');
    const statements: string[] = [];
    let currentStatement = '';
    let inTriggerBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? '';
      
      // Bỏ qua comments
      if (line.startsWith('--') || line === '') {
        continue;
      }
      
      // Bắt đầu trigger block (DELIMITER $$)
      if (line.includes('DELIMITER $$')) {
        inTriggerBlock = true;
        continue;
      }
      
      // Kết thúc trigger block (DELIMITER ;)
      if (line.includes('DELIMITER ;')) {
        inTriggerBlock = false;
        // Nếu còn statement chưa được xử lý, thêm vào
        if (currentStatement) {
          const cleanedStatement = currentStatement.trim().replace(/END\$\$/g, 'END;');
          statements.push(cleanedStatement);
          currentStatement = '';
        }
        continue;
      }
      
      // Nếu đang trong trigger block
      if (inTriggerBlock) {
        currentStatement += line + ' ';
        
        // Nếu gặp END$$, đây là kết thúc của một trigger
        // Tách trigger này ra và tiếp tục với trigger tiếp theo
        if (line.includes('END$$')) {
          const cleanedStatement = currentStatement.trim().replace(/END\$\$/g, 'END;');
          statements.push(cleanedStatement);
          currentStatement = '';
        }
      } else {
        // DROP TRIGGER statements (ngoài DELIMITER block)
        if (line.includes('DROP TRIGGER')) {
          statements.push(line);
        }
      }
    }
    
    // Thêm statement cuối cùng nếu còn (trường hợp không có DELIMITER ; ở cuối)
    if (currentStatement) {
      const cleanedStatement = currentStatement.trim().replace(/END\$\$/g, 'END;');
      statements.push(cleanedStatement);
    }

    // Chạy từng statement
    for (const statement of statements) {
      if (statement && (statement.includes('DROP TRIGGER') || statement.includes('CREATE TRIGGER'))) {
        try {
          await sequelize.query(statement);
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        } catch (queryError) {
          console.error(`❌ Error executing statement: ${statement.substring(0, 50)}...`);
          console.error('Full error:', queryError);
          throw queryError;
        }
      }
    }

    console.log('✅ Order triggers applied successfully');
  } catch (error) {
    console.error('❌ Error applying order triggers:', error);
    throw error;
  }
}

/**
 * Check xem triggers đã tồn tại chưa
 */
export async function checkTriggersExist(): Promise<boolean> {
  try {
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM information_schema.TRIGGERS
      WHERE TRIGGER_SCHEMA = DATABASE()
      AND TRIGGER_NAME IN (
        'calculate_line_total_on_insert',
        'calculate_line_total_on_update',
        'update_order_total_on_insert',
        'update_order_total_on_update',
        'update_order_total_on_delete'
      )
    `) as any[];
    
    return results[0]?.count >= 5;
  } catch (error) {
    console.error('Error checking triggers:', error);
    return false;
  }
}

