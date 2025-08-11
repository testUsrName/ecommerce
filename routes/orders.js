import express from 'express';
const router = express.Router();
import Order from '../models/order.js';
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

// 所有订单
router.get('/', (req, res) => {
  Order.getAll((err, orders) => {
    if (err) {
      req.flash('error_msg', '获取订单列表失败');
      return res.render('orders', { orders: [] });
    }
    res.render('orders', { orders });
  });
});

// 订单详情
router.get('/:id', (req, res) => {
  const orderId = req.params.id;
  Order.getById(orderId, (err, order) => {
    if (err) {
      req.flash('error_msg', '获取订单详情失败');
      return res.redirect('/orders');
    }
    if (!order) {
      req.flash('error_msg', '订单不存在');
      return res.redirect('/orders');
    }
    res.render('order', { order });
  });
});

// 导出PDF
router.get('/:id/export/pdf', (req, res) => {
  const orderId = req.params.id;
  
  Order.getById(orderId, (err, order) => {
    if (err || !order) {
      req.flash('error_msg', '获取订单失败');
      return res.redirect('/orders');
    }

    // 创建PDF
    const doc = new jsPDF();
    
    // 标题
    doc.setFontSize(16);
    doc.text('订单详情', 10, 10);
    doc.setFontSize(12);
    doc.text(`订单编号: ${order.id}`, 10, 25);
    doc.text(`订单日期: ${new Date(order.created_at).toLocaleString()}`, 10, 35);
    
    // 分隔线
    doc.line(10, 45, 200, 45);
    
    // 商品列表标题
    let yPos = 55;
    doc.text('商品', 10, yPos);
    doc.text('型号', 80, yPos);
    doc.text('数量', 130, yPos);
    doc.text('单价', 150, yPos);
    doc.text('小计', 180, yPos);
    
    yPos += 10;
    doc.line(10, yPos, 200, yPos);
    yPos += 10;
    
    // 商品列表
    order.items.forEach(item => {
      const subtotal = item.quantity * item.price;
      
      doc.text(item.name.substring(0, 15), 10, yPos);
      doc.text(item.model || '-', 80, yPos);
      doc.text(item.quantity.toString(), 130, yPos);
      doc.text(`¥${item.price.toFixed(2)}`, 150, yPos);
      doc.text(`¥${subtotal.toFixed(2)}`, 180, yPos);
      
      yPos += 15;
      
      // 分页
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // 分隔线
    yPos += 10;
    doc.line(10, yPos, 200, yPos);
    yPos += 15;
    
    // 总计
    doc.setFontSize(14);
    doc.text(`总计: ¥${order.total_amount.toFixed(2)}`, 140, yPos);
    
    // 保存PDF
    const pdfBuffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="order_${order.id}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  });
});

// 导出CSV
router.get('/:id/export/csv', (req, res) => {
  const orderId = req.params.id;
  
  Order.getById(orderId, (err, order) => {
    if (err || !order) {
      req.flash('error_msg', '获取订单失败');
      return res.redirect('/orders');
    }

    // 创建CSV内容
    let csvContent = '订单编号,订单日期,商品名称,型号,数量,单价,小计\n';
    csvContent += `${order.id},${new Date(order.created_at).toLocaleString()},,,,\n`;
    
    order.items.forEach(item => {
      const subtotal = item.quantity * item.price;
      csvContent += `,,${item.name},${item.model || ''},${item.quantity},${item.price},${subtotal}\n`;
    });
    
    csvContent += `,,,总计,,${order.total_amount}\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="order_${order.id}.csv"`);
    res.send(csvContent);
  });
});

export default router;
