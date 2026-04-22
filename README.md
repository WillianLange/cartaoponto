# Inova Soluções | Cartão Ponto no Navegador

Versão reconstruída para funcionar direto no navegador, sem backend obrigatório e sem banco externo.

## Como abrir

Você pode usar qualquer uma destas opções:

- abrir `index.html` na raiz do projeto
- abrir `frontend/index.html`
- executar `.\Abrir-Sistema.ps1`
- dar duplo clique em `Iniciar-Sistema.bat`
- executar `.\install.ps1` para criar o atalho no desktop e abrir o sistema

## Uso no celular

A aplicação também foi preparada como `PWA` instalável.

Isso significa que, quando o T.I. publicar a pasta `frontend/` em `HTTPS`, o colaborador poderá:

- abrir a página no navegador do celular
- adicionar à tela inicial
- usar em modo semelhante a aplicativo

## Credenciais iniciais

- Login: `admin`
- Senha: `123456`

## O que esta versão faz

- login local no navegador
- cadastro e edição de colaboradores com tipo de jornada (Integral ou Meio Período)
- registro de entrada, saída almoço, retorno almoço e saída
- inserção manual de apontamentos pelo administrador
- reversão de apontamentos
- cálculo de horas previstas, trabalhadas, extras e déficit
- feriados nacionais brasileiros, incluindo móveis
- relatório por período com exportação em CSV
- backup e restauração em JSON

## Como os dados são salvos

Esta versão usa `localStorage`.

Isso significa que:

- os dados ficam no navegador e no computador onde o sistema foi aberto
- limpar os dados do navegador apaga os registros locais
- outro navegador ou outro computador terá uma base diferente
- o backup em JSON deve ser usado para preservar ou migrar os dados

## Estrutura atual

- `index.html`: ponto de entrada na raiz
- `frontend/`: interface web, regras de negócio e persistência local
- `Abrir-Sistema.ps1`: abre a aplicação no navegador
- `Criar-Atalho-Desktop.ps1`: cria o atalho no desktop
- `install.ps1`: cria o atalho e abre o sistema

## Observação importante

Se você precisar de:

- dados compartilhados entre vários computadores
- acesso simultâneo por vários usuários em máquinas diferentes
- autenticação corporativa
- backup centralizado

então será necessário voltar para uma arquitetura com backend e base central.
