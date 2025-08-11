const express = require('express');
const router = express.Router();
const User = require('../models/user');

// 登录页面
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login');
});

// 处理登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    req.flash('error_msg', '请输入用户名和密码');
    return res.redirect('/users/login');
  }
  
  User.findByUsername(username, (err, user) => {
    if (err) {
      req.flash('error_msg', '登录失败');
      return res.redirect('/users/login');
    }
    
    if (!user) {
      req.flash('error_msg', '用户名或密码不正确');
      return res.redirect('/users/login');
    }
    
    User.verifyPassword(user, password, (err, isMatch) => {
      if (err) {
        req.flash('error_msg', '登录失败');
        return res.redirect('/users/login');
      }
      
      if (isMatch) {
        req.session.user = {
          id: user.id,
          username: user.username,
          email: user.email
        };
        req.flash('success_msg', '登录成功');
        res.redirect('/');
      } else {
        req.flash('error_msg', '用户名或密码不正确');
        res.redirect('/users/login');
      }
    });
  });
});

// 注册页面
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('register');
});

// 处理注册
router.post('/register', (req, res) => {
  const { username, password, email, confirmPassword } = req.body;
  
  // 验证表单
  if (!username || !password || !email || !confirmPassword) {
    req.flash('error_msg', '请填写所有字段');
    return res.redirect('/users/register');
  }
  
  if (password !== confirmPassword) {
    req.flash('error_msg', '两次密码输入不一致');
    return res.redirect('/users/register');
  }
  
  // 检查用户名是否已存在
  User.findByUsername(username, (err, user) => {
    if (err) {
      req.flash('error_msg', '注册失败');
      return res.redirect('/users/register');
    }
    
    if (user) {
      req.flash('error_msg', '用户名已存在');
      return res.redirect('/users/register');
    }
    
    // 创建新用户
    User.create(username, password, email, (err, userId) => {
      if (err) {
        req.flash('error_msg', '注册失败: ' + err.message);
        return res.redirect('/users/register');
      }
      
      req.flash('success_msg', '注册成功，请登录');
      res.redirect('/users/login');
    });
  });
});

// 登出
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/');
  });
});

module.exports = router;
