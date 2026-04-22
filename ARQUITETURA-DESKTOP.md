# Arquitetura Atual

## Modelo adotado

O sistema agora é `browser-first`:

- abre como página web local
- funciona sem API local
- não depende de PostgreSQL
- grava os dados no `localStorage` do navegador

## Fluxo recomendado no desktop

1. o usuário abre `index.html` ou usa o atalho do desktop
2. o navegador carrega a aplicação em `frontend/`
3. os dados são lidos e gravados localmente no navegador
4. o administrador pode exportar backup em JSON quando quiser

## Consequências dessa arquitetura

- simples de abrir e distribuir
- não exige instalação de Python nem banco
- ideal para uso local em uma única máquina
- não compartilha automaticamente dados entre navegadores ou computadores

## Quando usar backend novamente

Uma arquitetura com servidor e banco central volta a ser recomendada quando houver necessidade de:

- multiusuário em máquinas diferentes
- base única da empresa
- auditoria centralizada
- permissões mais rígidas
- relatórios consolidados fora do navegador
