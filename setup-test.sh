#!/bin/bash

echo "🚀 Helixon WhatsApp Bot - Setup & Test Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    exit 1
fi

# Load .env
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
echo "🔍 Verificando variáveis de ambiente..."
echo ""

MISSING_VARS=()

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL não configurada${NC}"
    MISSING_VARS+=("DATABASE_URL")
else
    echo -e "${GREEN}✅ DATABASE_URL configurada${NC}"
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${RED}❌ OPENAI_API_KEY não configurada${NC}"
    MISSING_VARS+=("OPENAI_API_KEY")
else
    echo -e "${GREEN}✅ OPENAI_API_KEY configurada${NC}"
fi

if [ -z "$MERCADOPAGO_ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  MERCADOPAGO_ACCESS_TOKEN não configurada (pagamentos não funcionarão)${NC}"
else
    echo -e "${GREEN}✅ MERCADOPAGO_ACCESS_TOKEN configurada${NC}"
fi

echo ""

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Variáveis obrigatórias faltando: ${MISSING_VARS[*]}${NC}"
    echo ""
    echo "📝 Por favor, edite o arquivo .env e preencha:"
    echo "   - DATABASE_URL (pegue em https://neon.tech)"
    echo "   - OPENAI_API_KEY (pegue em https://platform.openai.com/api-keys)"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

# Check database connection
echo "🗄️  Verificando conexão com banco de dados..."
npx ts-node -e "
import { query, closePool } from './src/database/connection';
(async () => {
  try {
    await query('SELECT 1');
    console.log('✅ Conexão com banco de dados OK');
    await closePool();
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
    process.exit(1);
  }
})();
" || exit 1
echo ""

# Run migrations
echo "📊 Executando migrations..."
npm run migrate:up
echo ""

# Run seed
echo "🌱 Populando banco de dados..."
npm run seed
echo ""

# Success message
echo -e "${GREEN}✅ Setup completo!${NC}"
echo ""
echo "🎉 Tudo pronto para iniciar o bot!"
echo ""
echo "Para iniciar o bot, execute:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "Depois:"
echo "   1. Escaneie o QR Code que aparecerá no terminal"
echo "   2. Envie uma mensagem para o WhatsApp conectado"
echo "   3. Teste: 'Olá', 'Quais produtos?', etc."
echo ""
