# Vehicle Sales Service

Serviço responsável pelo inventário público de veículos, registro de vendas e processamento de webhooks de pagamento da plataforma.

## Requisitos

- Node.js 18+
- npm 10+

## Instalação

```bash
npm install
```

## Scripts

- `npm run dev` – executa o projeto com `ts-node-dev`.
- `npm run lint` – verifica o TypeScript (`tsc --noEmit`).
- `npm test` / `npm run test:coverage` – roda a suíte de testes com Vitest.
- `npm run build` – compila para `dist/`.
- `npm start` – inicia a versão compilada.

## Variáveis de ambiente

Monte um `.env` com:

```env
PORT=4000
INTERNAL_SYNC_TOKEN=local-sync-token
CORE_SERVICE_URL=http://core:3000/api
CORE_SERVICE_TOKEN=local-sync-token
```

`INTERNAL_SYNC_TOKEN` protege os endpoints internos consumidos pelo Core. Configure o mesmo valor em `vehicle-platform` (`SALES_SERVICE_TOKEN`).
`CORE_SERVICE_URL` e `CORE_SERVICE_TOKEN` permitem devolver ao Core o status final da venda (`isSold` e comprador) após o webhook.

## Endpoints principais

A API expõe os recursos em `/api` (com exceção do healthcheck).

### Infra

| Método | Caminho   | Descrição                          |
| ------ | --------- | ---------------------------------- |
| GET    | `/health` | Healthcheck do serviço (`status`). |
| GET    | `/api`    | Healthcheck do serviço (`status`). |

### Públicos

| Método | Caminho                   | Descrição                                             |
| ------ | ------------------------- | ----------------------------------------------------- |
| GET    | `/vehicles/available`     | Lista veículos disponíveis (status `AVAILABLE`).      |
| GET    | `/vehicles/sold`          | Lista veículos vendidos (`SOLD`).                     |
| POST   | `/sales`                  | Inicia uma venda (`vehicleId`, `buyerCpf`).           |
| POST   | `/sales/payments/webhook` | Recebe notificações de pagamento (`PAID`/`CANCELED`). |

### Internos (`x-internal-token`)

| Método | Caminho                  | Descrição                                                 |
| ------ | ------------------------ | --------------------------------------------------------- |
| POST   | `/internal/vehicles`     | Cria/atualiza projeção local de um veículo vindo do Core. |
| PUT    | `/internal/vehicles/:id` | Atualiza dados do veículo sincronizado.                   |
| DELETE | `/internal/vehicles/:id` | Remove veículo do inventário local.                       |

### Payloads úteis

#### POST /api/sales

```json
{
  "vehicleId": "3a1a4a17-4f0c-4d8a-aa1e-6c35bf4f7d54",
  "buyerCpf": "12345678901",
  "totalAmount": 320000
}
```

#### POST /api/sales/payments/webhook

```json
{
  "paymentCode": "e04f1876-faed-4ba6-a56b-4536342bb1ab",
  "status": "PAID",
  "payload": {
    "processor": "mock-payments",
    "transactionId": "txn-123"
  }
}
```

#### POST /api/internal/vehicles

```json
{
  "vehicleId": "3a1a4a17-4f0c-4d8a-aa1e-6c35bf4f7d54",
  "brand": "Tesla",
  "model": "Model 3",
  "version": "Performance",
  "year": 2024,
  "color": "Midnight Silver",
  "price": 329000,
  "isSold": false
}
```

#### PUT /api/internal/vehicles/:vehicleId

```json
{
  "vehicleId": "3a1a4a17-4f0c-4d8a-aa1e-6c35bf4f7d54",
  "brand": "Tesla",
  "model": "Model 3",
  "year": 2024,
  "color": "Preto",
  "price": 319000,
  "isSold": true
}
```

## Fluxo resumido

1. O Core chama `POST /internal/vehicles` após cadastrar/atualizar um carro.
2. Clientes consomem `GET /vehicles/available` / `GET /vehicles/sold`.
3. `POST /sales` marca o item como `PENDING_PAYMENT` e gera um `paymentCode`.
4. O provedor de pagamento envia o webhook para `/sales/payments/webhook`.
   - `PAID` → venda é marcada como `PAID` e o inventário vira `SOLD`.
   - `CANCELED` → venda vira `CANCELED` e o inventário volta para `AVAILABLE`.
5. Após `PAID`/`CANCELED`, o Sales notifica o Core em `/api/internal/vehicles/:id/sale-status`.

## Testes

```bash
npm test
```

O teste `tests/sales.service.spec.ts` cobre:

- Ordenação/estado do inventário.
- Prevenção de dupla venda simultânea.
- Atualização via webhooks.

## Deploy na AWS

O workflow `.github/workflows/deploy.yml` também publica a imagem e força o deploy no ECS. Configure os seguintes secrets/variáveis no GitHub antes de rodar:

| Tipo     | Nome                    | Descrição                                                                 |
| -------- | ----------------------- | ------------------------------------------------------------------------- |
| Secret   | `AWS_ACCESS_KEY_ID`     | Access key com permissão para ECR/ECS (mesma conta usada pelo Terraform). |
| Secret   | `AWS_SECRET_ACCESS_KEY` | Secret correspondente.                                                    |
| Secret   | `AWS_ACCOUNT_ID`        | ID da conta AWS para montar a URL do ECR.                                 |
| Variable | `ECR_REPOSITORY`        | Nome do repositório ECR do Sales (ex.: `postech-app-sales`).              |
| Variable | `ECS_CLUSTER_NAME`      | Nome do cluster ECS (ex.: `postech-app-cluster`).                         |
| Variable | `ECS_SERVICE_NAME`      | Serviço ECS do Sales (ex.: `postech-app-sales-svc`).                      |
| Variable | `AWS_REGION` (opcional) | Região usada pelo workflow (padrão `us-east-1`).                          |

Além disso:

1. Provisione os recursos via `vehicle-infra/terraform` (ALB, ECS, ECR, etc.).
2. Garanta que o `INTERNAL_SYNC_TOKEN` esteja sincronizado com o `SALES_SERVICE_TOKEN` do Core.
3. Execute um `docker build`/`npm run build` localmente se quiser validar antes do CI.
