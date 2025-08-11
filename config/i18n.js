import * as path from 'path';
import i18n from 'i18n';
import { fileURLToPath } from 'url';
import * as pathAlias from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathAlias.dirname(__filename);

i18n.configure({
  objectNotation: true,
  locales: ['zh', 'en', 'fr'],
  directory: pathAlias.join(__dirname, '.'),
  defaultLocale: 'zh',
  cookie: 'lang',
  autoReload: true,
  updateFiles: false
});

export default i18n;