const express = require('express');
const ejs = require('ejs');
const path = require('path');
const router = express.Router();
const Product = require('../models/product');

// 获取商品详情
router.get('/:id', (req, res) => {
    const productId = req.params.id;
    Product.getById(productId, (err, product) => {
        if (err) {
            console.error('获取商品详情错误:', err);
            return res.status(500).json({ error: '获取商品详情失败' });
        }

        if (!product) {
            return res.status(404).json({ error: '商品不存在' });
        }

        console.log('成功获取商品详情:', product);

        // 使用ejs.renderFile渲染简化的模板
        const templatePath = path.join(__dirname, '../views', 'simple_test.ejs');
        ejs.renderFile(templatePath, { product: product, user: req.user }, (err, html) => {
            if (err) {
                console.error('EJS模板错误，请求路径:', req.path, '错误:', err);
                return res.status(500).json({ error: '渲染模板失败' });
            }
            res.send(html);
        });
    });
});

module.exports = router;
