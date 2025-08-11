const ejs = require('ejs');

// 测试简单的EJS模板
const template = '<h1><%= name %></h1><p>价格: ¥<%= price.toFixed(2) %></p>';
const data = { name: '测试商品', price: 99.99 };

try {
    const result = ejs.render(template, data);
    console.log('渲染成功:');
    console.log(result);
} catch (error) {
    console.error('渲染错误:', error);
}