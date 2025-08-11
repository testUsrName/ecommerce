const { db } = require('./models/db');

// 查询所有产品
db.all('SELECT id, name, image_url FROM products', [], (err, rows) => {
  if (err) {
    console.error('查询出错:', err.message);
    process.exit(1);
  }

  console.log('产品总数:', rows.length);
  rows.forEach(product => {
    console.log(`产品ID: ${product.id}, 名称: ${product.name}, 图片URL: ${product.image_url || 'NULL'}`);
  });

  // 关闭数据库连接
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接出错:', err.message);
    }
    process.exit(0);
  });
});