import Product from '../models/product.js';

// 显示商品上传表单
export const getUploadForm = (req, res) => {
  res.render('upload');
};

// 处理商品上传
export const uploadProduct = (req, res) => {
  const { name, model, description, price, quantity, notes } = req.body;
  const imageUrl = req.file ? '/uploads/' + req.file.filename : null;
  
  // 验证表单
  if (!name || !price || !quantity) {
    req.flash('error_msg', '请填写必填字段');
    return res.redirect('/upload');
  }
  
  // 创建商品
  const product = {
    name,
    model: model || '',
    description: description || '',
    price: parseFloat(price),
    quantity: parseInt(quantity),
    image_url: imageUrl,
    notes: notes || ''
  };
  
  Product.create(product, (err, productId) => {
    if (err) {
      req.flash('error_msg', '商品上传失败: ' + err.message);
      return res.redirect('/upload');
    }
    
    req.flash('success_msg', '商品上传成功');
    res.redirect('/');
  });
};
