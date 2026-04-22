# Integração da Página de Ponto no Site da Inova

## Arquivos principais

- `frontend/index.html`
- `frontend/styles.css`
- `frontend/app.js`
- `frontend/logo-inova-white.png`
- `frontend/manifest.webmanifest`
- `frontend/sw.js`
- `frontend/icons/`

## Objetivo desta entrega

Esta estrutura foi ajustada para funcionar como uma página dedicada de `Portal do Colaborador`, com visual alinhado ao site institucional da Inova.

## Sugestão de implantação

Publicar a aplicação em uma rota exclusiva, por exemplo:

- `/colaborador/ponto`
- `/portal/cartao-ponto`
- `/area-restrita/ponto`

## Versão para celular

Esta entrega agora também está preparada como `PWA`:

- pode ser instalada no Android e no iPhone como aplicativo
- usa `manifest.webmanifest`
- usa `service worker`
- tem ícones próprios para instalação

Para isso funcionar corretamente, o T.I. deve publicar a aplicação em:

- `HTTPS`

ou em ambiente corporativo equivalente que permita instalação de app web.

### Arquivos da versão instalável

- `frontend/manifest.webmanifest`
- `frontend/sw.js`
- `frontend/icons/icon-192.png`
- `frontend/icons/icon-512.png`
- `frontend/icons/apple-touch-icon.png`

### Resultado esperado no celular

Depois de publicada, a aplicação poderá ser:

- adicionada à tela inicial
- aberta em modo standalone
- usada com aparência próxima de aplicativo

## Formas de integração

### 1. Publicação direta como página própria

Recomendado quando o T.I. puder servir `index.html`, `styles.css`, `app.js` e os assets como uma página independente dentro do domínio.

### 2. Integração dentro de um template do site

Se o site principal usar CMS ou template próprio, o ideal é:

- manter o miolo da aplicação
- preservar os `id`s usados em `app.js`
- adaptar apenas header, footer e eventual breadcrumb do portal

## Atenções importantes

### Estrutura JavaScript

O arquivo `app.js` depende de elementos com IDs específicos, como:

- `loginScreen`
- `appScreen`
- `portalEntry`
- `dashboardMetrics`
- `employeeList`
- `punchSummary`
- `reportSummary`

Se esses IDs forem alterados, a aplicação precisa ser ajustada junto.

### Estado atual da aplicação

Hoje esta versão opera localmente com `localStorage`.

Para produção real no portal corporativo, o ideal é o T.I. substituir:

- autenticação local
- persistência em `localStorage`
- exportação/importação local

por:

- login integrado ao ambiente interno
- API do sistema de ponto
- banco centralizado
- controle de perfis e auditoria

## Direção visual aplicada

- cabeçalho institucional
- portal do colaborador em destaque
- hero com linguagem corporativa
- cards claros com navegação objetiva
- marca da Inova em branco sobre fundo profundo

## Observação final

Esta entrega já serve como base visual e estrutural para implantação. Caso o T.I. vá conectar a aplicação a backend real, o reaproveitamento principal deve acontecer em:

- HTML da página
- CSS do portal
- organização das áreas funcionais
