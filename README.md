# SASUKE — SHADOW GOD

**MANGEKYŌ SHARINGAN • CORE 77**

Estrutura inicial do projecto do bot WhatsApp SASUKE — SHADOW GOD.

## Requisitos

- Node.js 20 ou superior
- npm
- Uma conta WhatsApp que tenhas autorização para ligar como dispositivo associado

## Instalação

1. Extrai o ZIP ou cria um repositório GitHub com estes ficheiros.
2. Abre a pasta do projecto no ambiente de desenvolvimento.
3. Instala as dependências:

   ```bash
   npm install
   ```

4. Copia `.env.example` para `.env`.
5. Preenche `OWNER_NUMBER` e `BOT_NUMBER` com números internacionais, apenas dígitos.
6. Verifica a estrutura:

   ```bash
   npm run check
   ```

7. Inicializa a estrutura e a base de dados:

   ```bash
   npm start
   ```

## Estado desta entrega

Esta é a **Etapa 1**: estrutura do projecto, configuração e esquema inicial SQLite.

A ligação ao WhatsApp, o pareamento, os comandos, o período experimental, a publicidade e os alugueres ainda não estão implementados nesta etapa. Serão acrescentados e testados nas etapas seguintes. Não publiques o bot como pronto nesta fase.

## Segurança

- Nunca publiques `.env`, a pasta `session/` ou a base de dados com dados reais.
- Não partilhes códigos de pareamento nem credenciais.
- Usa apenas em contas e grupos onde tens autorização.
- Baileys é um projecto comunitário não oficial e pode sofrer alterações incompatíveis. Consulta a documentação e as notas de migração antes de actualizar a dependência.

## Documentação oficial do Baileys

- GitHub: https://github.com/WhiskeySockets/Baileys
- Guia: https://baileys.wiki
