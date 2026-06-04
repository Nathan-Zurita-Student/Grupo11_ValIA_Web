# ValIA Web — Gestão de Validade Inteligente

Versão web do ValIA: backend Node.js + Express + Sequelize (PostgreSQL) e frontend
em **Next.js + Tailwind CSS**, com OCR no navegador via Tesseract.js.

```
valia-web/
├── backend/   API REST (a mesma do projeto, com CORS habilitado)
└── web/       Frontend Next.js + Tailwind
```

## 1. Backend

```bash
cd backend
npm install
# crie o .env (veja .env.example) com a senha do seu PostgreSQL
npm test     # 14 testes
npm start    # API em http://localhost:3000/api
```

Requer PostgreSQL com os bancos `valia_dev` e `valia_test`.

## 2. Frontend (web)

Em **outro terminal**, com o backend rodando:

```bash
cd web
npm install
npm run dev   # site em http://localhost:3000  (Next escolhe 3001 se a 3000 estiver ocupada)
```

> Importante: o backend usa a porta 3000. Quando você rodar o `web`, o Next.js vai
> detectar que a 3000 está ocupada e subir em **3001** automaticamente. O endereço da
> API já aponta para `http://localhost:3000/api` por padrão. Para mudar, defina a
> variável `NEXT_PUBLIC_API_URL`.

### Funcionalidades
- Login e cadastro (JWT)
- Despensa ordenada por vencimento, com indicador de urgência (verde/amarelo/vermelho/vencido)
- Cadastro de produto com leitura da validade por foto (OCR — Tesseract.js)
- Filtro por categoria
- Marcar consumido/descartado
- Relatório de desperdício (consumido vs descartado)

## Tecnologias
Backend: Node.js, Express, Sequelize, PostgreSQL, JWT, bcryptjs, express-validator, cors, Jest.
Frontend: Next.js (App Router), React, Tailwind CSS, axios, Tesseract.js, lucide-react.
