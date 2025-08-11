const { db } = require('./db');

// 订单模型
const Order = {
  // 创建订单
  create: (totalAmount, items, callback) => {
    // 使用事务确保数据一致性
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) return callback(err);

      // 创建订单
      db.run(
        'INSERT INTO orders (total_amount) VALUES (?)',
        [totalAmount],
        function(err) {
          if (err) {
            db.run('ROLLBACK', () => callback(err));
            return;
          }

          const orderId = this.lastID;
          let completed = 0;

          // 添加订单项
          items.forEach(item => {
            db.run(
              'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
              [orderId, item.productId, item.quantity, item.price],
              (err) => {
                if (err) {
                  db.run('ROLLBACK', () => callback(err));
                  return;
                }

                completed++;
                if (completed === items.length) {
                  db.run('COMMIT', (err) => {
                    if (err) return callback(err);
                    callback(null, orderId);
                  });
                }
              }
            );
          });
        }
      );
    });
  },

  // 获取所有订单
  getAll: (callback) => {
    db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
      callback(err, rows);
    });
  },

  // 通过ID获取订单及订单项
  getById: (id, callback) => {
    db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
      if (err) return callback(err);
      if (!order) return callback(null, null);

      db.all(
        `SELECT oi.*, p.name, p.model 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [id],
        (err, items) => {
          if (err) return callback(err);
          callback(null, { ...order, items });
        }
      );
    });
  }
};

module.exports = Order;
