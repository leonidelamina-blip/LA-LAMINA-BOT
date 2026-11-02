import { config, validateConfig } from './config.js';
import { initDatabase } from './database/database.js';

async function main() {
  console.log('');
  console.log('🩸 SASUKE — SHADOW GOD');
  console.log('👁️ MANGEKYŌ SHARINGAN • CORE 77');
  console.log('--------------------------------');

  const errors = validateConfig();
  if (errors.length) {
    console.error('⚠️ Configuração incompleta:');
    for (const error of errors) console.error(`- ${error}`);
    console.error('\nCopia .env.example para .env e preenche os dados necessários.');
    process.exitCode = 1;
    return;
  }

  const database = await initDatabase(config.databasePath);
  console.log('✅ Base de dados inicializada.');
  console.log(`🤖 Bot: ${config.botName} — ${config.edition}`);
  console.log(`⚡ Versão: ${config.version}`);
  console.log('ℹ️ Etapa 1 concluída: estrutura e persistência preparadas.');
  console.log('➡️ A ligação ao WhatsApp será implementada na Etapa 2.');

  await database.close();
}

main().catch((error) => {
  console.error('🩸 Erro de inicialização:', error);
  process.exitCode = 1;
});
