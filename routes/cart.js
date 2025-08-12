import express from 'express';
const router = express.Router();
import Product from '../models/product.js';
import Order from '../models/order.js';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { jsPDF } from 'jspdf';
// 引入中文字体支持
// 注意：在服务器端使用jsPDF时，字体配置需要特殊处理
// 我们将在生成PDF时直接设置字体
const readFileAsync = promisify(fs.readFile);

// 初始化购物车
function initCart(req) {
  if (!req.session.cart) {
    req.session.cart = [];
    console.log('购物车已初始化');
  } else {
    console.log('购物车已有内容:', req.session.cart);
  }
}

// 查看购物车
router.get('/', (req, res) => {
  try {
    initCart(req);
    const cart = req.session.cart;
    console.log('查看购物车 - 商品数量:', cart.length);
    console.log('查看购物车 - 商品详情:', cart);

    // 直接渲染购物车模板
    res.render('cart', {
      title: '购物车',
      cart: cart,
      user: req.session.user,
      layout: 'layout'
    });
  } catch (err) {
    console.error('购物车模板渲染错误:', err);
    res.status(500).send('模板渲染错误: ' + err.message);
  }
});

// 添加商品到购物车
router.post('/add', (req, res) => {
  initCart(req);
  const productId = req.body.productId;
  const quantity = parseInt(req.body.quantity) || 1;

  console.log('尝试添加商品到购物车:', productId, '数量:', quantity);

  if (quantity <= 0) {
    req.flash('error_msg', '数量必须大于0');
    return res.redirect(`/products/${productId}`);
  }

  Product.getById(productId, (err, product) => {
    if (err || !product) {
      req.flash('error_msg', '商品不存在');
      return res.redirect('/');
    }

    if (quantity > product.quantity) {
      req.flash('error_msg', '库存不足');
      return res.redirect(`/products/${productId}`);
    }

    // 检查商品是否已在购物车中
    const existingItemIndex = req.session.cart.findIndex(item => item.productId == productId);
    
    if (existingItemIndex >= 0) {
      // 获取备注信息
      const remark = req.body.remark || '';

      // 更新数量和备注
      req.session.cart[existingItemIndex].quantity += quantity;
      if (remark) {
        req.session.cart[existingItemIndex].remark = remark;
      }
    } else {
      // 获取备注信息
      const remark = req.body.remark || '';

      // 添加新商品
      req.session.cart.push({
        productId: product.id,
        name: product.name,
        model: product.model,
        price: product.price,
        quantity: quantity,
        image_url: product.image_url,
        remark: remark
      });
    }

    req.flash('success_msg', '商品已添加到购物车');
    res.redirect('/cart');
  });
});

// 更新购物车商品数量
router.post('/update', (req, res) => {
  initCart(req);
  const productId = req.body.productId;
  const quantity = parseInt(req.body.quantity) || 0;

  if (quantity <= 0) {
    // 从购物车移除
    req.session.cart = req.session.cart.filter(item => item.productId != productId);
  } else {
    // 更新数量
    const itemIndex = req.session.cart.findIndex(item => item.productId == productId);
    if (itemIndex >= 0) {
      // 检查库存
      Product.getById(productId, (err, product) => {
        if (err || !product) {
          req.flash('error_msg', '商品不存在');
          return res.redirect('/cart');
        }

        if (quantity > product.quantity) {
          req.flash('error_msg', '库存不足');
          return res.redirect('/cart');
        }

        req.session.cart[itemIndex].quantity = quantity;
        req.flash('success_msg', '购物车已更新');
        res.redirect('/cart');
      });
      return;
    }
  }

  req.flash('success_msg', '购物车已更新');
  res.redirect('/cart');
});

// 从购物车移除商品
router.post('/remove', (req, res) => {
  initCart(req);
  const productId = req.body.productId;
  req.session.cart = req.session.cart.filter(item => item.productId != productId);
  req.flash('success_msg', '商品已从购物车移除');
  res.redirect('/cart');
});

// 清空购物车
router.post('/clear', (req, res) => {
  req.session.cart = [];
  req.flash('success_msg', '购物车已清空');
  res.redirect('/cart');
});

// 从购物车创建订单
router.post('/checkout', (req, res) => {
  initCart(req);
  
  if (req.session.cart.length === 0) {
    req.flash('error_msg', '购物车为空，无法结算');
    return res.redirect('/cart');
  }

  // 计算总金额
  const totalAmount = req.session.cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // 准备订单项
  const orderItems = req.session.cart.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.price
  }));

  // 创建订单
  Order.create(totalAmount, orderItems, (err, orderId) => {
    if (err) {
      req.flash('error_msg', '创建订单失败');
      return res.redirect('/cart');
    }

    // 清空购物车
    req.session.cart = [];
    
    req.flash('success_msg', '订单创建成功');
    res.redirect(`/orders/${orderId}`);
  });
});

// 生成订单PDF
router.post('/generate-pdf', async (req, res) => {
  console.log('接收到生成PDF的请求');
    initCart(req);
    console.log('购物车已有内容:', req.session.cart);
    console.log('购物车商品数量:', req.session.cart.length);
    
    // 检查购物车是否为空
    if (req.session.cart.length === 0) {
      console.log('购物车为空，返回400错误');
      return res.status(400).json({ success: false, message: '购物车为空，无法生成订单' });
    }
    
    // 检查用户是否已登录
    console.log('检查用户是否已登录:', !!req.session.user);
    if (!req.session.user) {
      console.log('用户未登录，返回401错误');
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    console.log('用户已登录:', req.session.user.username);

  try {
    // 计算总金额
    const totalAmount = req.session.cart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // 准备订单项数据
    const orderItems = req.session.cart.map(item => ({
      name: item.name,
      model: item.model,
      price: item.price,
      quantity: item.quantity,
      subtotal: (item.price * item.quantity).toFixed(2)
    }));

    // 创建PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 注意：在服务器端使用jsPDF时，中文字体支持需要特殊处理
    // 这里我们使用默认字体，实际项目中可能需要额外配置
    // doc.setFont('simsun', 'normal');

    // 添加标题
    doc.setFontSize(20);
    doc.text(req.t('pdf.orderDetails'), 105, 20, { align: 'center' });

    // 添加用户信息
    doc.setFontSize(12);
    doc.text(`${req.t('pdf.username')}: ${req.session.user.username}`, 20, 35);
    doc.text(`${req.t('pdf.orderDate')}: ${new Date().toLocaleString()}`, 20, 45);

    // 添加表格标题
    doc.setFontSize(14);
    doc.text(req.t('pdf.productInfo'), 20, 60);
    doc.text(req.t('pdf.unitPrice'), 100, 60);
    doc.text(req.t('pdf.quantity'), 130, 60);
    doc.text(req.t('pdf.subtotal'), 160, 60);

    // 添加表格分隔线
    doc.line(20, 65, 190, 65);

    // 添加商品列表
    doc.setFontSize(12);
    let yPosition = 75;
    orderItems.forEach((item, index) => {
      // 商品名称和型号
      doc.text(`${index + 1}. ${item.name}`, 20, yPosition);
      if (item.model) {
        doc.text(`${req.t('pdf.model')}: ${item.model}`, 20, yPosition + 6);
        yPosition += 12;
      } else {
        yPosition += 6;
      }

      // 单价、数量、小计
      doc.text(`¥${item.price.toFixed(2)}`, 100, yPosition - 6);
      doc.text(item.quantity.toString(), 130, yPosition - 6);
      doc.text(`¥${item.subtotal}`, 160, yPosition - 6);

      yPosition += 10;
    });

    // 添加总计
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
    doc.setFontSize(14);
    doc.text(`${req.t('pdf.total')}: ¥${totalAmount.toFixed(2)}`, 160, yPosition);

    // 添加页脚
    yPosition = doc.internal.pageSize.height - 20;
    doc.setFontSize(10);
    doc.text(req.t('pdf.thankYou'), 105, yPosition, { align: 'center' });
    doc.text(req.t('pdf.autoGenerated'), 105, yPosition + 6, { align: 'center' });

    try {
      // 生成PDF并发送给客户端
      const pdfBytes = doc.output('arraybuffer');
      res.setHeader('Content-Type', 'application/pdf');
      // 对中文文件名进行URL编码
      const encodedFilename = encodeURIComponent(req.t('pdf.order')) + '_' + Date.now() + '.pdf';
      res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error('生成PDF失败:', error);
      res.status(500).json({ success: false, message: '生成PDF失败，请稍后再试' });
    }
    } catch (error) {
      console.error('生成PDF失败:', error);
      res.status(500).json({ success: false, message: '生成PDF失败，请稍后再试' });
    }
  });
// 原代码此处的单个 } 可能是多余的，已移除。下面正常导出路由
export default router;
