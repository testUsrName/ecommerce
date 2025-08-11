const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

// 模拟数据
const data = {
  title: '商品列表',
  products: [{
    id: 1,
    name: '测试商品',
    model: '1',
    description: '这是一个测试商品',
    price: 99.99,
    quantity: 100,
    image_url: null
  }],
  user: { username: 'testuser' },
  success_msg: null,
  error_msg: null
};
// 确保变量已定义，即使它们的值是null或undefined
const renderOptions = {
  ...data,
  success_msg: data.success_msg || '',
  error_msg: data.error_msg || ''
};


// 读取home.ejs模板
const templatePath = path.join(__dirname, 'views', 'home.ejs');
const template = fs.readFileSync(templatePath, 'utf8');

// 渲染模板
try {
  const result = ejs.render(template, renderOptions);
  console.log('渲染成功!');
} catch (error) {
  console.error('渲染错误:', error);
}