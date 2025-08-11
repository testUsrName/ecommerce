const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// 初始化数据库
const db = require('./models/db');
db.init();

// 创建上传目录
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext);
  }
});

const upload = multer({ storage: storage });

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 设置模板引擎为EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// 禁用EJS模板缓存
app.set('view cache', false);

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// 添加会话调试中间件
app.use((req, res, next) => {
  console.log('会话ID:', req.sessionID);
  console.log('会话内容:', req.session);
  next();
});
app.use(flash());

// 全局变量
app.use(function(req, res, next) {
  // 确保即使flash消息为null或undefined，也会被设置为空字符串
  res.locals.success_msg = req.flash('success_msg') || '';
  res.locals.error_msg = req.flash('error_msg') || '';
  res.locals.error = req.flash('error') || '';
  res.locals.user = req.session.user || null;
  next();
});

// 路由
app.use('/', require('./routes/index'));
app.use('/products', require('./routes/products'));
app.use('/test', require('./routes/test_route'));
app.use('/test-cart', require('./routes/test_cart'));
app.use('/cart', require('./routes/cart'));
app.use('/orders', require('./routes/orders'));
app.use('/users', require('./routes/users'));
app.use('/session-test', require('./routes/session_test'));

// 商品上传路由（需要登录）
const productController = require('./controllers/productController');
app.get('/upload', isAuthenticated, productController.getUploadForm);
app.post('/upload', isAuthenticated, upload.single('image'), productController.uploadProduct);

// 检查用户是否登录的中间件
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  req.flash('error_msg', '请先登录');
  res.redirect('/users/login');
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 自定义EJS模板编译错误处理中间件
const ejs = require('ejs');

// 移除EJS的renderFile方法覆盖，使用默认实现


// 错误处理中间件
app.use((err, req, res, next) => {
    if (err.message && err.message.includes('Could not find matching close tag for "<%-"')) {
        console.error('EJS模板错误，请求路径:', req.path);
        console.error('错误详情:', err);
        res.status(500).send(`EJS模板错误: 未找到匹配的<%-闭合标签。详细信息: ${err.message}`);
    } else {
        console.error('错误发生:', err);
        res.status(500).send('服务器错误');
    }
});
