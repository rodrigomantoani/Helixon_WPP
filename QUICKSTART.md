# 🚀 Quick Start Guide

## ✅ Checklist: O que você precisa fazer agora

### 1. Configure o Banco de Dados PostgreSQL

**Opção A: PostgreSQL Local**
```bash
# Se ainda não tem PostgreSQL instalado:
brew install postgresql@16
brew services start postgresql@16

# Crie o banco de dados:
createdb helixon_wpp
```

**Opção B: PostgreSQL Gerenciado (Recomendado para testes)**
- Crie uma conta no [Neon](https://neon.tech) ou [Supabase](https://supabase.com)
- Copie a `DATABASE_URL` fornecida

### 2. Preencha o arquivo `.env`

Abra o arquivo `.env` e preencha as variáveis obrigatórias:

```env
# Database - OBRIGATÓRIO
DATABASE_URL=postgresql://user:pass@host:5432/helixon_wpp

# OpenAI - OBRIGATÓRIO
OPENAI_API_KEY=sk-proj-xxxxxx

# MercadoPago - OBRIGATÓRIO
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxx

# Para testes locais, deixe assim:
WEBHOOK_URL=http://localhost:3000
```

### 3. Execute as Migrações do Banco

```bash
npm run migrate:up
```

### 4. Popule o Catálogo de Produtos

```bash
npm run seed
```

### 5. Inicie o Bot

```bash
npm run dev
```

### 6. Escaneie o QR Code

Quando o bot iniciar, um **QR Code** aparecerá no terminal.

1. Abra o WhatsApp no seu celular (número dedicado)
2. Vá em **Configurações** > **Aparelhos conectados**
3. Toque em **Conectar um aparelho**
4. Escaneie o QR Code que apareceu no terminal

✅ **Pronto!** Seu bot está funcionando!

---

## 🧪 Testando o Bot

### Envie uma mensagem no WhatsApp:

```
Olá
```

O bot deve responder com uma saudação e informações.

### Peça a lista de produtos:

```
Quais produtos vocês têm?
```

### Simule uma compra:

```
Quero comprar Tirzepatida 2.5mg
```

O bot irá guiá-lo pelo processo de compra.

---

## 🔧 Troubleshooting

### QR Code não aparece
- Verifique se todas as dependências foram instaladas: `npm install`
- Certifique-se de que a porta 3000 está livre

### Erro de banco de dados
- Verifique se o PostgreSQL está rodando
- Confirme que a `DATABASE_URL` no `.env` está correta
- Execute as migrações novamente: `npm run migrate:up`

### Erro OpenAI
- Confirme que sua `OPENAI_API_KEY` está correta
- Verifique se você tem créditos na sua conta OpenAI

### Bot não responde mensagens
- Verifique os logs no terminal para ver erros
- Confirme que o WhatsApp foi conectado corretamente (QR escaneado)

---

## 🌐 Webhooks Locais (Para testar pagamentos)

Para testar pagamentos localmente, você precisa expor seu localhost:

### Instale o ngrok:
```bash
brew install ngrok
```

### Inicie um túnel:
```bash
ngrok http 3000
```

### Atualize o `.env`:
```env
WEBHOOK_URL=https://abc123.ngrok.io
```

### Configure no MercadoPago:
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em **Webhooks**
3. Adicione: `https://abc123.ngrok.io/webhooks/mercadopago`

---

## 📦 Deploy no Railway (Produção)

Quando estiver pronto para produção, siga o README.md completo para instruções de deploy no Railway.

---

## 📞 Suporte

Se tiver problemas, verifique:
1. Logs no terminal
2. Arquivo README.md completo
3. Variáveis de ambiente no `.env`

**Boa sorte! 🚀**
