-- ============================================
-- ORDER TRIGGERS
-- Tự động tính line_total và total_amount
-- ============================================

-- Xóa triggers cũ nếu tồn tại (để có thể chạy lại script)
DROP TRIGGER IF EXISTS calculate_line_total_on_insert;
DROP TRIGGER IF EXISTS calculate_line_total_on_update;
DROP TRIGGER IF EXISTS update_order_total_on_insert;
DROP TRIGGER IF EXISTS update_order_total_on_update;
DROP TRIGGER IF EXISTS update_order_total_on_delete;

-- ============================================
-- TRIGGER 1: Tự động tính line_total khi INSERT order_details
-- ============================================
DELIMITER $$
CREATE TRIGGER calculate_line_total_on_insert
BEFORE INSERT ON order_details
FOR EACH ROW
BEGIN
  -- Tự động tính line_total = unit_price * quantity
  SET NEW.line_total = NEW.unit_price * NEW.quantity;
END$$

-- ============================================
-- TRIGGER 2: Tự động tính line_total khi UPDATE order_details
-- ============================================
CREATE TRIGGER calculate_line_total_on_update
BEFORE UPDATE ON order_details
FOR EACH ROW
BEGIN
  -- Chỉ tính lại nếu unit_price hoặc quantity thay đổi
  IF NEW.unit_price != OLD.unit_price OR NEW.quantity != OLD.quantity THEN
    SET NEW.line_total = NEW.unit_price * NEW.quantity;
  END IF;
END$$

-- ============================================
-- TRIGGER 3: Tự động tính total_amount khi INSERT order_details
-- ============================================
CREATE TRIGGER update_order_total_on_insert
AFTER INSERT ON order_details
FOR EACH ROW
BEGIN
  -- Tính total_amount mới (chỉ tính 1 lần)
  SET @new_total = (
    SELECT COALESCE(SUM(line_total), 0)
    FROM order_details
    WHERE order_id = NEW.order_id
  );
  
  -- Lấy total_amount cũ
  SET @old_total = (
    SELECT total_amount
    FROM orders
    WHERE id = NEW.order_id
  );
  
  -- UPDATE chỉ khi giá trị thay đổi (dùng IF)
  IF ABS(@old_total - @new_total) > 0.01 THEN
    UPDATE orders
    SET total_amount = @new_total
    WHERE id = NEW.order_id;
  END IF;
END$$

-- ============================================
-- TRIGGER 4: Tự động tính total_amount khi UPDATE order_details
-- ============================================
CREATE TRIGGER update_order_total_on_update
AFTER UPDATE ON order_details
FOR EACH ROW
BEGIN
  -- Chỉ update nếu line_total thay đổi
  IF NEW.line_total != OLD.line_total THEN
    -- Tính total_amount mới (chỉ tính 1 lần)
    SET @new_total = (
      SELECT COALESCE(SUM(line_total), 0)
      FROM order_details
      WHERE order_id = NEW.order_id
    );
    
    -- Lấy total_amount cũ
    SET @old_total = (
      SELECT total_amount
      FROM orders
      WHERE id = NEW.order_id
    );
    
    -- UPDATE chỉ khi giá trị thay đổi (dùng IF)
    IF ABS(@old_total - @new_total) > 0.01 THEN
      UPDATE orders
      SET total_amount = @new_total
      WHERE id = NEW.order_id;
    END IF;
  END IF;
END$$

-- ============================================
-- TRIGGER 5: Tự động tính total_amount khi DELETE order_details
-- ============================================
CREATE TRIGGER update_order_total_on_delete
AFTER DELETE ON order_details
FOR EACH ROW
BEGIN
  -- Tính total_amount mới (sau khi xóa)
  SET @new_total = COALESCE((
    SELECT SUM(line_total)
    FROM order_details
    WHERE order_id = OLD.order_id
  ), 0);
  
  -- Lấy total_amount cũ
  SET @old_total = (
    SELECT total_amount
    FROM orders
    WHERE id = OLD.order_id
  );
  
  -- UPDATE chỉ khi giá trị thay đổi (dùng IF)
  IF ABS(@old_total - @new_total) > 0.01 THEN
    UPDATE orders
    SET total_amount = @new_total
    WHERE id = OLD.order_id;
  END IF;
END$$
DELIMITER ;

