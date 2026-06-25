# Price Tracker - Monitoramento de Precos (Brasil)

Sistema de monitoramento de precos de produtos em lojas brasileiras com alertas automaticos via Telegram.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Firebase Firestore** — banco de dados
- **Cheerio** — scraping de precos
- **Recharts** — graficos de historico
- **Telegram Bot API** — alertas de queda de preco
- **Vercel Cron** — agendamento automatico

## Funcionalidades

- Monitoramento de precos em Amazon, Mercado Livre, Magazine Luiza e KaBuM!
- Deteccao de preco atual, preco anterior, desconto e cupons
- Alertas automaticos via Telegram quando preco <= meta
- Dashboard com comparacao entre lojas
- Historico de precos com grafico interativo
- Deteccao de menor preco historico
- Anti-spam: nao repete alerta para o mesmo preco em 24h
- User-agent rotativo para evitar bloqueios

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative o **Firestore Database** (modo de producao)
4. Em **Project Settings > General**, copie as credenciais do Web App
5. Crie os indices compostos necessarios no Firestore:
   - Collection `prices`: campos `productId` (Asc), `store` (Asc), `scrapedAt` (Desc)
   - Collection `prices`: campos `productId` (Asc), `scrapedAt` (Asc)
   - Collection `prices`: campos `productId` (Asc), `available` (Asc), `currentPrice` (Asc)
   - Collection `alerts`: campos `productId` (Asc), `store` (Asc), `price` (Asc), `sentAt` (Asc)

### 3. Configurar Telegram Bot

1. Abra o Telegram e fale com [@BotFather](https://t.me/BotFather)
2. Envie `/newbot` e siga as instrucoes
3. Copie o token do bot
4. Para obter seu Chat ID:
   - Envie qualquer mensagem ao seu bot
   - Acesse: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
   - Copie o `chat.id` da resposta

### 4. Configurar variaveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

CRON_SECRET=meu_segredo_aleatorio
```

### 5. Rodar localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

### 6. Adicionar produto exemplo (PS5)

Com o servidor rodando:

```bash
npx tsx scripts/seed-ps5.ts
```

Ou adicione manualmente pelo dashboard clicando em **"+ Adicionar Produto"**.

### 7. Coletar precos manualmente

Clique no botao **"Coletar precos agora"** no dashboard, ou via API:

```bash
curl -X POST http://localhost:3000/api/scrape
```

## Deploy na Vercel

1. Conecte o repositorio na Vercel
2. Configure as variaveis de ambiente no painel da Vercel
3. O cron job roda automaticamente a cada 30 minutos (`vercel.json`)
4. Na Vercel, adicione `CRON_SECRET` e use-o no header de autorizacao

## Estrutura do Projeto

```
src/
  app/
    page.tsx                    # Dashboard principal
    api/
      scrape/route.ts           # Endpoint de scraping (cron + manual)
      products/route.ts         # CRUD de produtos
      products/[id]/history/    # Historico de precos
  lib/
    firebase.ts                 # Config Firebase
    db.ts                       # Camada de banco de dados
    scraper/
      index.ts                  # Orquestrador de scraping
      fetcher.ts                # HTTP client com user-agent rotativo
      stores/                   # Scrapers por loja
        amazon.ts
        mercadolivre.ts
        magazineluiza.ts
        kabum.ts
    notifications/
      telegram.ts               # Envio de alertas Telegram
      index.ts                  # Logica de verificacao de alertas
  components/
    ProductCard.tsx              # Card de produto com precos
    PriceChart.tsx               # Grafico de historico
    AddProductModal.tsx          # Modal para adicionar produto
  types/
    index.ts                    # TypeScript types
```

## Lojas Suportadas

| Loja            | Status  | Metodo                    |
| --------------- | ------- | ------------------------- |
| Amazon BR       | OK      | HTML + JSON-LD            |
| Mercado Livre   | OK      | HTML + meta tags + JSON-LD|
| Magazine Luiza  | OK      | HTML + JSON-LD + regex    |
| KaBuM!          | OK      | HTML + JSON-LD + regex    |

## Notas

- Os scrapers usam Cheerio (parsing HTML estatico). Algumas lojas podem exigir JavaScript para renderizar precos — nesse caso, o scraper tenta extrair de `<script type="application/ld+json">` ou de padroes em scripts inline.
- O sistema inclui delay de 2s entre produtos para evitar rate limiting.
- Alertas Telegram nao repetem para o mesmo preco dentro de 24h.
