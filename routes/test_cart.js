const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const path = require('path');

// 测试购物车模板渲染
router.get('/', (req, res) => {
  try {
    // 模拟购物车数据
    const cart = [
      {
        productId: 1,
        name: '测试商品',
        model: '型号1',
        price: 99.99,
        quantity: 1,
        image_url: '/uploads/test.jpg'
      }
    ];

    // 读取模板片段
    const templatePath = path.join(__dirname, '../views', 'cart.ejs');
    ejs.renderFile(templatePath, { cart: cart }, (err, templateContent) => {
      if (err) {
        console.error('读取购物车模板片段错误:', err);
        return res.status(500).send('读取模板片段错误: ' + err.message);
      }

      console.log('模板片段内容:', templateContent);

      // 尝试提取title和body (假设模板片段使用这种格式)
      const match = templateContent.match(/title:\s*['"]([^'"]+)['"],\s+body:\s*`([\s\S]+?)`/);
      if (!match) {
        // 如果提取失败，直接使用simple模板展示原始内容
        return res.render('simple', {
          title: '购物车测试',
          body: `<pre>${templateContent}</pre>`
        });
      }

      const title = match[1];
      const body = match[2];

      // 渲染完整HTML模板，插入body内容
      res.render('simple', {
        title: title,
        body: body
      });
    });
  } catch (err) {
    console.error('测试购物车模板渲染错误:', err);
    res.status(500).send('测试模板渲染错误: ' + err.message);
  }
});

// 测试添加商品到购物车
router.get('/add', (req, res) => {
  // 初始化购物车
  if (!req.session.cart) {
    req.session.cart = [];
  }

  // 添加测试商品
  const testProduct = {
    productId: 1,
    name: '测试商品',
    model: '测试型号',
    price: 10.99,
    quantity: 2,
    image_url: '/uploads/test-image.jpg',
    remark: '测试备注'
  };

  req.session.cart.push(testProduct);
  req.flash('success_msg', '测试商品已添加到购物车');
  res.redirect('/cart');
});

// 查看购物车数据
router.get('/view', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  res.json(req.session.cart);
});

module.exports = router;