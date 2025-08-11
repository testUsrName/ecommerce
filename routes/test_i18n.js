import express from 'express';
const router = express.Router();

// 测试i18n路由
router.get('/', (req, res) => {
  try {
    // 尝试使用i18n的t函数
    const testTranslation = req.t('nav.upload');
    res.send({
      success: true,
      message: 'i18n测试成功',
      translation: testTranslation,
      reqTExists: !!req.t,
      resLocalsTExists: !!res.locals.t
    });
  } catch (error) {
    res.send({
      success: false,
      message: 'i18n测试失败',
      error: error.message,
      reqTExists: !!req.t,
      resLocalsTExists: !!res.locals.t
    });
  }
});

export default router;