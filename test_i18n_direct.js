import i18n from 'i18n';
import { fileURLToPath } from 'url';
import * as pathAlias from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathAlias.dirname(__filename);

i18n.configure({
  objectNotation: true,
  locales: ['zh', 'en', 'fr'],
  directory: pathAlias.join(__dirname, 'config'),
  defaultLocale: 'zh',
  cookie: 'lang'
});

// 测试i18n功能
console.log('测试i18n翻译:');
console.log('nav.upload:', i18n.__('nav.upload'));
console.log('nav.cart:', i18n.__('nav.cart'));
console.log('language.zh:', i18n.__('language.zh'));

// 测试切换语言
console.log('\n切换到英语:');
i18n.setLocale('en');
console.log('nav.upload:', i18n.__('nav.upload'));
console.log('nav.cart:', i18n.__('nav.cart'));
console.log('language.en:', i18n.__('language.en'));

console.log('\ni18n配置:', i18n.getCatalog());