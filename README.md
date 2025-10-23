# 🤖 Helixon WhatsApp Bot

Bot inteligente de WhatsApp para vendas de Tirzepatida com integração MercadoPago e OpenAI.

## 🌟 Funcionalidades

- ✅ **Conexão WhatsApp** via whatsapp-web.js (sem API oficial)
- ✅ **Respostas Inteligentes** com OpenAI GPT-4o-mini
- ✅ **Pagamentos** via MercadoPago Checkout Pro
- ✅ **Webhooks** para confirmação automática de pagamentos
- ✅ **Banco de Dados** PostgreSQL para armazenar clientes e pedidos
- ✅ **Contexto de Conversação** para experiência natural
- ✅ **Rate Limiting** para controle de custos
- ✅ **Disclaimers Médicos** e avisos de segurança

## ⚠️ Avisos Importantes

1. **Uso Não Oficial**: whatsapp-web.js não é uma API oficial do WhatsApp e pode violar os Termos de Serviço, resultando em banimento do número.
2. **Use Número Dedicado**: Sempre use um número exclusivo para o bot, nunca seu número pessoal.
3. **Conteúdo de Saúde**: As informações sobre Tirzepatida são educacionais. Sempre inclua disclaimers médicos.
4. **Regulamentação**: Verifique as leis locais sobre venda de medicamentos online antes de usar em produção.

## 📋 Pré-requisitos

### Contas Necessárias:

1. **OpenAI**: Conta com créditos e API Key
   - Acesse: https://platform.openai.com/api-keys

2. **MercadoPago**: Conta ativa no Brasil
   - Acesse: https://www.mercadopago.com.br/developers
   - Habilite Checkout Pro
   - Configure Webhooks

3. **Railway** (Recomendado para hospedagem)
   - Acesse: https://railway.app
   - Crie conta gratuita
   - Plano Hobby: $5/mês

4. **WhatsApp**: Número dedicado para o bot
   - Chip ativo e verificado no WhatsApp

5. **PostgreSQL**: Banco de dados
   - Pode usar o plugin do Railway (gratuito até 100MB)
   - Alternativas: Neon, Supabase, ou local

## 🚀 Instalação Local

### 1. Clone o Repositório

```bash
git clone https://github.com/rodrigomantoani/Helixon_WPP.git
cd Helixon_WPP
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
NODE_ENV=development
PORT=3000

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=700
RATE_LIMIT_OPENAI_PER_MINUTE=10

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxx

# Database (Local PostgreSQL ou serviço gerenciado)
DATABASE_URL=postgresql://user:password@localhost:5432/helixon_wpp

# Webhook (use ngrok para desenvolvimento local)
WEBHOOK_URL=https://your-ngrok-url.ngrok.io

# WhatsApp
WWEBJS_AUTH_DIR=.wwebjs_auth

# Bot
BOT_NAME=Helixon
STORE_NAME=Helixon Saúde
CURRENCY=BRL

# Security
QR_ROUTE_TOKEN=seu_token_secreto_aqui
```

### 4. Configure o Banco de Dados

#### Opção A: PostgreSQL Local

```bash
# Instale PostgreSQL
brew install postgresql@16  # macOS
# ou apt-get install postgresql  # Linux

# Inicie o serviço
brew services start postgresql@16

# Crie o banco
createdb helixon_wpp
```

#### Opção B: PostgreSQL Gerenciado (Railway/Neon/Supabase)

Copie a `DATABASE_URL` fornecida pelo serviço e cole no `.env`.

### 5. Execute as Migrações

```bash
npm run migrate:up
```

### 6. Popule o Catálogo de Produtos

```bash
npm run seed
```

### 7. Configure Webhooks Locais com ngrok

```bash
# Instale ngrok
brew install ngrok  # macOS

# Inicie um túnel na porta 3000
ngrok http 3000

# Copie a URL fornecida (ex: https://abc123.ngrok.io)
# Atualize WEBHOOK_URL no .env com essa URL
```

### 8. Inicie o Bot

```bash
npm run dev
```

### 9. Escaneie o QR Code

Quando o bot iniciar, um QR Code aparecerá no terminal. Escaneie com o WhatsApp do número dedicado:

1. Abra o WhatsApp no celular
2. Vá em **Configurações** > **Aparelhos conectados**
3. Toque em **Conectar um aparelho**
4. Escaneie o QR Code no terminal

## 📦 Deploy no Railway

### 1. Crie uma Conta no Railway

Acesse [railway.app](https://railway.app) e crie uma conta.

### 2. Crie um Novo Projeto

```bash
# Instale o Railway CLI
npm install -g @railway/cli

# Faça login
railway login

# Inicialize o projeto
railway init
```

### 3. Adicione PostgreSQL

No dashboard do Railway:
1. Clique em **+ New**
2. Selecione **Database** > **PostgreSQL**
3. Copie a `DATABASE_URL` gerada

### 4. Configure as Variáveis de Ambiente

No dashboard do Railway, adicione todas as variáveis do `.env`:

```
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=...
MERCADOPAGO_ACCESS_TOKEN=...
DATABASE_URL=... (copie do PostgreSQL do Railway)
WEBHOOK_URL=https://seu-app.railway.app
WWEBJS_AUTH_DIR=/data/wwebjs_auth
QR_ROUTE_TOKEN=...
```

### 5. Adicione um Volume Persistente

No Railway, vá em **Settings** > **Volumes**:
- Adicione um volume montado em `/data`
- Isso garante que a sessão do WhatsApp persista entre deploys

### 6. Faça o Deploy

```bash
# Commit suas mudanças
git add .
git commit -m "Initial setup"

# Push para o Railway
railway up
```

### 7. Configure o Webhook no MercadoPago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **Webhooks**
4. Adicione: `https://seu-app.railway.app/webhooks/mercadopago`
5. Selecione eventos: `payment` e `merchant_order`

### 8. Escaneie o QR Code em Produção

Acesse: `https://seu-app.railway.app/qr?token=seu_token_secreto`

## 🛠️ Scripts Disponíveis

```bash
npm run dev          # Inicia em modo desenvolvimento
npm run build        # Compila TypeScript
npm start            # Inicia em produção
npm run migrate:up   # Executa migrações
npm run migrate:down # Reverte migrações
npm run seed         # Popula produtos
npm run lint         # Verifica código
npm run format       # Formata código
```

## 📊 Estrutura do Projeto

```
Helixon_WPP/
├── src/
│   ├── index.ts              # Entry point
│   ├── bot/                  # WhatsApp bot logic
│   │   ├── whatsapp.ts
│   │   ├── messageHandler.ts
│   │   └── qr.ts
│   ├── ai/                   # OpenAI integration
│   │   ├── openai.ts
│   │   ├── prompts.ts
│   │   └── context.ts
│   ├── payment/              # MercadoPago
│   │   ├── mercadopago.ts
│   │   ├── webhook.ts
│   │   └── paymentLink.ts
│   ├── database/             # Database
│   │   ├── connection.ts
│   │   ├── models/
│   │   └── migrations/
│   ├── services/             # Business logic
│   │   ├── customerService.ts
│   │   ├── orderService.ts
│   │   └── conversationService.ts
│   ├── config/               # Configuration
│   │   ├── products.ts
│   │   └── constants.ts
│   └── utils/                # Utilities
│       ├── logger.ts
│       └── validators.ts
├── .env.example
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## 🔐 Segurança

- ✅ Nunca commite `.env` no Git
- ✅ Use variáveis de ambiente para secrets
- ✅ Valide webhooks do MercadoPago
- ✅ Rate limiting por IP e telefone
- ✅ Sanitização de inputs
- ✅ Logs estruturados sem dados sensíveis

## 💰 Custos Estimados

- **Railway**: $5/mês (Hobby plan)
- **OpenAI**: ~$0.001-0.002 por mensagem (gpt-4o-mini)
- **MercadoPago**: Taxa por transação (~4%)
- **PostgreSQL**: Incluído no Railway (até 100MB)

**Estimativa mensal** (100 conversas/dia): ~$10-15/mês

## 🐛 Troubleshooting

### QR Code não aparece
- Verifique se as portas estão liberadas
- Confirme que Chromium está instalado (Docker)

### Webhook não recebe pagamentos
- Teste a URL: `curl https://seu-app.railway.app/health`
- Verifique logs do MercadoPago
- Confirme que a notification_url está correta

### Bot desconecta frequentemente
- Use volume persistente para `/data`
- Verifique conexão com internet
- Considere usar número com chip melhor

### Número banido
- Use outro número dedicado
- Evite spam e muitas mensagens simultâneas
- Respeite limites de mensagens do WhatsApp

## 📚 Documentação Adicional

- [whatsapp-web.js](https://wwebjs.dev/)
- [OpenAI API](https://platform.openai.com/docs)
- [MercadoPago API](https://www.mercadopago.com.br/developers)
- [Railway Docs](https://docs.railway.app/)

## 📄 Licença

MIT

## 👤 Autor

**Helixon**

---

**⚠️ DISCLAIMER**: Este projeto é apenas para fins educacionais. O uso de whatsapp-web.js pode violar os Termos de Serviço do WhatsApp. Use por sua conta e risco. As informações sobre Tirzepatida são educacionais e não substituem orientação médica profissional.
