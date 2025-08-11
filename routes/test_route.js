import express from 'express';
const router = express.Router();
import ejs from 'ejs';
import path from 'path';
import Product from '../models/product.js';

// 测试路由 - 直接使用ejs.renderFile
router.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  console.log('测试路由 - 获取商品详情，ID:', productId);
  
  Product.getById(productId, (err, product) => {
    if (err) {
      console.error('测试路由 - 获取商品详情错误:', err);
      res.status(500).send('获取商品详情失败');
      return;
    }
    
    if (!product) {
      console.log('测试路由 - 商品不存在，ID:', productId);
      res.status(404).send('商品不存在');
      return;
    }
    
    console.log('测试路由 - 成功获取商品详情:', product);
    
    // 直接使用ejs.renderFile渲染简单模板
    const templatePath = path.join(__dirname, '..', 'views', 'simple_test.ejs');
    ejs.renderFile(templatePath, { product: product }, (err, str) => {
      if (err) {
        console.error('测试路由 - 渲染模板文件错误:', err);
        res.status(500).send('渲染模板失败: ' + err.message);
      } else {
        console.log('测试路由 - 渲染模板成功');
        res.send(str);
      }
    });
  });
});

export default router;