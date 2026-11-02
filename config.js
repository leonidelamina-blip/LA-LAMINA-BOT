import 'dotenv/config';

const required = (name, fallback = '') => process.env[name]?.trim() || fallback;

export const config = Object.freeze({
  botName: 'SASUKE',
  edition: 'SHADOW GOD',
  version: '1.0.0 CORE 77',
  prefix: '.',
  language: 'pt-PT',
  ownerNumber: required('OWNER_NUMBER'),
  botNumber: required('BOT_NUMBER'),
  channelUrl: required(
    'CHANNEL_URL',
    'https://whatsapp.com/channel/0029VbBfoWhAO7RJaD9mXy2k'
  ),
  databasePath: required('DATABASE_PATH', './database/sasuke.sqlite'),
  sessionPath: required('SESSION_PATH', './session'),
  logLevel: required('LOG_LEVEL', 'info')
});

export function validateConfig() {
  const errors = [];

  if (!config.ownerNumber) errors.push('OWNER_NUMBER não definido no ficheiro .env.');
  if (!/^\d{8,15}$/.test(config.ownerNumber)) {
    errors.push('OWNER_NUMBER deve conter apenas dígitos, incluindo indicativo do país.');
  }
  if (config.botNumber && !/^\d{8,15}$/.test(config.botNumber)) {
    errors.push('BOT_NUMBER deve conter apenas dígitos, incluindo indicativo do país.');
  }

  return errors;
}
