#!/bin/bash

echo "🔐 Configuração de Credenciais - Helixon WhatsApp Bot"
echo "======================================================"
echo ""
echo "Vou te ajudar a configurar as credenciais necessárias."
echo ""

# Function to update .env
update_env() {
    local key=$1
    local value=$2
    
    if grep -q "^${key}=" .env; then
        # Update existing key
        sed -i '' "s|^${key}=.*|${key}=${value}|" .env
    else
        # Add new key
        echo "${key}=${value}" >> .env
    fi
}

# Database URL
echo "📊 1/3 - DATABASE_URL (PostgreSQL)"
echo "------------------------------------"
echo ""
echo "Você precisa criar um banco no Neon.tech:"
echo "   1. Acesse: https://neon.tech"
echo "   2. Crie uma conta grátis"
echo "   3. Crie um novo projeto"
echo "   4. Copie a DATABASE_URL que aparece"
echo ""
echo -n "Cole a DATABASE_URL aqui: "
read DATABASE_URL

if [ ! -z "$DATABASE_URL" ]; then
    update_env "DATABASE_URL" "$DATABASE_URL"
    echo "✅ DATABASE_URL configurada!"
else
    echo "⚠️  DATABASE_URL não fornecida (você pode configurar depois no .env)"
fi

echo ""
echo ""

# OpenAI API Key
echo "🤖 2/3 - OPENAI_API_KEY"
echo "------------------------"
echo ""
echo "Você precisa de uma chave da OpenAI:"
echo "   1. Acesse: https://platform.openai.com/api-keys"
echo "   2. Faça login"
echo "   3. Clique em 'Create new secret key'"
echo "   4. Copie a chave (começa com sk-proj-...)"
echo ""
echo -n "Cole a OPENAI_API_KEY aqui: "
read OPENAI_API_KEY

if [ ! -z "$OPENAI_API_KEY" ]; then
    update_env "OPENAI_API_KEY" "$OPENAI_API_KEY"
    echo "✅ OPENAI_API_KEY configurada!"
else
    echo "⚠️  OPENAI_API_KEY não fornecida (você pode configurar depois no .env)"
fi

echo ""
echo ""

# MercadoPago (optional)
echo "💳 3/3 - MercadoPago (OPCIONAL para testes iniciais)"
echo "------------------------------------------------------"
echo ""
echo "Para testes de pagamento, você precisa:"
echo "   1. Acesse: https://www.mercadopago.com.br/developers/panel/app"
echo "   2. Crie uma aplicação"
echo "   3. Copie o Access Token e Public Key"
echo ""
echo "⚠️  IMPORTANTE: Você pode pular isso agora e configurar depois."
echo "   O bot funcionará normalmente, exceto pagamentos."
echo ""
echo -n "Deseja configurar MercadoPago agora? (s/N): "
read CONFIGURE_MP

if [[ "$CONFIGURE_MP" =~ ^[Ss]$ ]]; then
    echo ""
    echo -n "Cole o MERCADOPAGO_ACCESS_TOKEN: "
    read MERCADOPAGO_ACCESS_TOKEN
    
    echo -n "Cole o MERCADOPAGO_PUBLIC_KEY: "
    read MERCADOPAGO_PUBLIC_KEY
    
    if [ ! -z "$MERCADOPAGO_ACCESS_TOKEN" ]; then
        update_env "MERCADOPAGO_ACCESS_TOKEN" "$MERCADOPAGO_ACCESS_TOKEN"
        echo "✅ MERCADOPAGO_ACCESS_TOKEN configurado!"
    fi
    
    if [ ! -z "$MERCADOPAGO_PUBLIC_KEY" ]; then
        update_env "MERCADOPAGO_PUBLIC_KEY" "$MERCADOPAGO_PUBLIC_KEY"
        echo "✅ MERCADOPAGO_PUBLIC_KEY configurado!"
    fi
else
    echo "⏭️  Pulando configuração do MercadoPago"
fi

echo ""
echo ""
echo "✅ Configuração concluída!"
echo ""
echo "Arquivo .env atualizado com suas credenciais."
echo ""
echo "Próximos passos:"
echo "   1. Execute: ./setup-test.sh"
echo "   2. Depois: npm run dev"
echo ""
