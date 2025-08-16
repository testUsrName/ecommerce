import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import session from 'express-session';
import flash from 'connect-flash';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import multer from 'multer';
import fs from 'fs';
import i18n from './config/i18n.js';
import cookieParser from 'cookie-parser';

// 初始化数据库
import { db, init } from './models/db.js';
init();

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
app.use(cookieParser());
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
  next();
});

// 全局变量
app.use(function(req, res, next) {
  // 确保即使flash消息为null或undefined，也会被设置为空字符串
  res.locals.success_msg = req.flash('success_msg') || '';
  res.locals.error_msg = req.flash('error_msg') || '';
  res.locals.error = req.flash('error') || '';
  res.locals.user = req.session.user || null;
  // 当前语言
  res.locals.currentLang = req.cookies.lang || 'zh';
  next();
});

// i18n中间件
app.use(i18n.init);

// 语言切换路由
app.get('/lang/:locale', (req, res) => {
  res.cookie('lang', req.params.locale);
  res.redirect('back');
});

// 手动添加i18n的t函数到请求对象
app.use(function(req, res, next) {
  if (!req.t) {
    req.t = function(key) {
      return i18n.__({ phrase: key, locale: req.cookies.lang || 'zh' });
    };
  }
  res.locals.t = req.t;
  next();
});

// 路由
import testI18nRouter from './routes/test_i18n.js';
import indexRouter from './routes/index.js';
import productsRouter from './routes/products.js';
import testRouter from './routes/test_route.js';
import testCartRouter from './routes/test_cart.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import usersRouter from './routes/users.js';
import sessionTestRouter from './routes/session_test.js';

app.use('/test-i18n', testI18nRouter);
app.use('/', indexRouter);
app.use('/products', productsRouter);
app.use('/test', testRouter);
app.use('/test-cart', testCartRouter);
app.use('/cart', cartRouter);
app.use('/orders', ordersRouter);
app.use('/users', usersRouter);
app.use('/session-test', sessionTestRouter);

// 商品上传路由（需要登录）
import { getUploadForm, uploadProduct } from './controllers/productController.js';
app.get('/upload', isAuthenticated, getUploadForm);
  app.post('/upload', isAuthenticated, upload.single('image'), uploadProduct);

// 检查用户是否登录的中间件
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  req.flash('error_msg', req.t('auth.required'));
  res.redirect('/users/login');
}

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 全局未捕获异常处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  // 可以在这里添加日志记录、报警等操作
  // 对于严重错误，可能需要重启服务
  // 但先尝试优雅关闭
  server.close(() => {
    process.exit(1);
  });
});

// 全局未处理Promise拒绝处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason, promise);
  // 同样可以添加日志记录、报警等操作
});

// 处理SIGTERM和SIGINT信号，实现优雅关闭
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('开始优雅关闭服务器...');
  
  // 首先关闭服务器，停止接受新请求
  server.close(() => {
    console.log('HTTP服务器已关闭');
    
    // 然后关闭数据库连接
    try {
      db.close((err) => {
        if (err) {
          console.error('关闭数据库连接出错:', err.message);
          process.exit(1);
        }
        console.log('数据库连接已关闭');
        process.exit(0);
      });
    } catch (dbErr) {
      console.error('关闭数据库连接时发生异常:', dbErr);
      process.exit(1);
    }
  });

  // 设置超时，如果10秒内没有关闭，则强制退出
  setTimeout(() => {
    console.error('强制关闭服务器');
    process.exit(1);
  }, 10000);
}

// 自定义EJS模板编译错误处理中间件
import ejs from 'ejs';

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
