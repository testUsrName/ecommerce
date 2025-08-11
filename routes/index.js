const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// 首页路由 - 使用新模板
router.get('/', async (req, res) => {
  try {
    const products = await Product.getAll();
    res.render('home', {
      title: '商品列表',
      products,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg'),
      user: req.session.user
    });
  } catch (err) {
    console.error('获取商品列表失败:', err);
    req.flash('error_msg', '获取商品失败');
    res.render('home', { products: [] });
  }
});

// 测试原始模板的路由
router.get('/old-index', async (req, res) => {
  try {
    const products = await Product.getAll();
    res.render('index', {
      title: '商品列表',
      products,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg'),
      user: req.session.user
    });
  } catch (err) {
    console.error('获取商品列表失败:', err);
    req.flash('error_msg', '获取商品失败');
    res.render('index', { products: [] });
  }
});

// 测试简单模板的路由
router.get('/simple-index', async (req, res) => {
  try {
    const products = await Product.getAll();
    res.render('index_simple', {
      title: '简单商品列表',
      products,
      user: req.session.user
    });
  } catch (err) {
    console.error('获取商品列表失败:', err);
    res.render('index_simple', {
      title: '简单商品列表',
      products: [],
      user: req.session.user
    });
  }
});

module.exports = router;
