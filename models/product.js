import { db } from './db.js';

// 商品模型
const Product = {
  // 获取所有商品
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // 通过ID获取商品
  getById: (id, callback) => {
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
      callback(err, row);
    });
  },

  // 创建商品
  create: (product, callback) => {
    const { name, model, description, price, quantity, image_url, notes } = product;
    db.run(
      `INSERT INTO products 
       (name, model, description, price, quantity, image_url, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, model, description, price, quantity, image_url, notes],
      function(err) {
        if (err) return callback(err);
        callback(null, this.lastID);
      }
    );
  },

  // 更新商品
  update: (id, product, callback) => {
    const { name, model, description, price, quantity, image_url, notes } = product;
    db.run(
      `UPDATE products SET 
       name = ?, model = ?, description = ?, price = ?, 
       quantity = ?, image_url = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, model, description, price, quantity, image_url, notes, id],
      (err) => {
        callback(err);
      }
    );
  },

  // 删除商品
  delete: (id, callback) => {
    db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
      callback(err);
    });
  }
};

export default Product;
