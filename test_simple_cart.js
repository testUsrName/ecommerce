const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// 添加日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}: ${req.method} ${req.url}`);
  next();
});
const PORT = 3001;

// 设置模板引擎为EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'test-secret',
  resave: true,
  saveUninitialized: true
}));

// 初始化购物车
function initCart(req) {
  if (!req.session.cart) {
    req.session.cart = [];
  }
}

// 首页 - 显示添加商品表单
app.get('/', (req, res) => {
  res.render('cart_test', {
    title: '测试购物车',
    cart: req.session.cart || []
  });
});

// 添加商品到购物车
app.post('/add', (req, res) => {
  initCart(req);
  console.log('购物车已初始化');

  const productId = req.body.productId || 1;
  const name = req.body.name || '测试商品';
  const price = parseFloat(req.body.price) || 10.99;
  const quantity = parseInt(req.body.quantity) || 1;

  console.log('接收到的商品信息:', { productId, name, price, quantity });

  // 检查商品是否已在购物车中
  const existingItemIndex = req.session.cart.findIndex(item => item.productId == productId);

  if (existingItemIndex >= 0) {
    // 更新数量
    req.session.cart[existingItemIndex].quantity += quantity;
    console.log(`更新商品数量: ${name} (ID: ${productId}) 新数量: ${req.session.cart[existingItemIndex].quantity}`);
  } else {
    // 添加新商品
    const newItem = {
      productId: productId,
      name: name,
      price: price,
      quantity: quantity
    };
    req.session.cart.push(newItem);
    console.log('添加新商品到购物车:', newItem);
  }

  console.log('当前购物车内容:', req.session.cart);
  res.redirect('/');
});

// 清空购物车
app.post('/clear', (req, res) => {
  req.session.cart = [];
  console.log('购物车已清空');
  res.redirect('/');
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`测试服务器运行在 http://localhost:${PORT}`);
});

console.log('测试应用已启动，请访问 http://localhost:3001');