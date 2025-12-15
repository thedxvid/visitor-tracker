# Visitor Tracker - Instruções de Deploy

## MongoDB Atlas Setup (OBRIGATÓRIO)

1. Acesse https://www.mongodb.com/cloud/atlas/register
2. Crie uma conta gratuita
3. Crie um cluster (escolha a opção FREE - M0)
4. Em "Database Access", crie um usuário com senha
5. Em "Network Access", adicione `0.0.0.0/0` (permitir de qualquer IP)
6. Clique em "Connect" → "Connect your application"
7. Copie a connection string (algo como: `mongodb+srv://usuario:senha@cluster.mongodb.net/`)

## Deploy na Vercel

1. Acesse https://vercel.com/dashboard
2. Vá em seu projeto `visitor-tracker`
3. Clique em "Settings" → "Environment Variables"
4. Adicione:
   - **Name**: `MONGODB_URI`
   - **Value**: Cole a connection string do MongoDB Atlas
   - Substitua `<password>` pela sua senha
   - Adicione `/visitor-tracker` no final da URL
5. Clique em "Save"
6. Vá em "Deployments" → clique nos 3 pontinhos do último deploy → "Redeploy"

## Exemplo de MONGODB_URI:
```
mongodb+srv://usuario:SuaSenha123@cluster0.xxxxx.mongodb.net/visitor-tracker?retryWrites=true&w=majority
```

Após o redeploy, os visitantes serão salvos permanentemente no MongoDB!
