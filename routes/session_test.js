import express from 'express';
const router = express.Router();

// 测试会话设置
router.get('/set', (req, res) => {
  req.session.test = '测试会话数据';
  res.send('会话数据已设置: ' + req.session.test);
});

// 测试会话读取
router.get('/get', (req, res) => {
  res.send('会话数据: ' + (req.session.test || '未找到'));
});

// 测试购物车数据设置
router.get('/set-cart', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  req.session.cart.push({
    productId: 1,
    name: '测试商品',
    price: 10.99,
    quantity: 2
  });
  res.send('购物车数据已设置: ' + JSON.stringify(req.session.cart));
});

// 测试购物车数据读取
router.get('/get-cart', (req, res) => {
  res.send('购物车数据: ' + JSON.stringify(req.session.cart || []));
});

export default router;