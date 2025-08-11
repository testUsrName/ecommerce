const { db } = require('./models/db');

// 更新产品记录，将image_url设置为NULL
db.run('UPDATE products SET image_url = NULL WHERE id = 1', [], (err) => {
  if (err) {
    console.error('更新出错:', err.message);
    process.exit(1);
  }

  console.log('产品记录已更新，图片URL已设置为NULL');
  process.exit(0);
});