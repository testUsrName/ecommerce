const { db } = require('./db');
const bcrypt = require('bcryptjs');

// 用户模型
const User = {
  // 创建新用户
  create: (username, password, email, callback) => {
    // 加密密码
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return callback(err);
      
      db.run(
        'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
        [username, hash, email],
        function(err) {
          if (err) return callback(err);
          callback(null, this.lastID);
        }
      );
    });
  },

  // 通过用户名查找用户
  findByUsername: (username, callback) => {
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (err, row) => {
        callback(err, row);
      }
    );
  },

  // 验证密码
  verifyPassword: (user, password, callback) => {
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return callback(err);
      callback(null, isMatch);
    });
  }
};

module.exports = User;
