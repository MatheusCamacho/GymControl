# GymControl — Trabalho 3
Matheus Camacho e Erick Peter | UniSenac Pelotas | 26/11/2026

## Executar no Windows
Instale Node.js 22.13 ou superior (preferencialmente LTS). Extraia o ZIP, abra a pasta no VS Code e abra um terminal.
1. `npm install`
2. `npm run server` (deixe aberto)
3. Em outro terminal: `npm run dev`
4. Abra http://localhost:5173 (ou o endereço exibido pelo Vite).
O arquivo gym.db será criado automaticamente. `npm test` executa o teste de banco e regras de pagamento.

## Demonstração
Cadastre Ana Silva (ana@example.com), escolha Mensal, edite o nome, pesquise, registre o pagamento, altere o mês e confira a pendência. Crie um plano adicional. Recarregue a página para verificar persistência. Exclua um aluno fictício apenas ao final: a exclusão também remove seus pagamentos.

Clique em “Visão geral” para abrir o calendário mensal com o resumo de pagamentos. O mês pode ser digitado no formato `AAAA-MM`; meses fora de 01 a 12 são indicados como inválidos.

## Arquitetura
src/main.jsx: interface React, estados, formulários e fetch. server.js: rotas REST Express e validação. db.js: SQLite nativo do Node, tabelas e regra de pagamento. Valores em centavos; UNIQUE impede duplicidade por aluno/mês. Dois planos iniciais fictícios. O sistema considera todos os alunos cadastrados devidos em qualquer mês selecionado; não há datas de matrícula, autenticação, estorno ou edição/exclusão de planos. Uso acadêmico local.

## Resultados reais
O teste automatizado de banco passou, incluindo cadastro, edição, pagamento, rejeição de duplicidade, mês inválido, aluno inexistente e exclusão em cascata. Veja testes.txt. A instalação de dependências falhou neste ambiente por DNS (EAI_AGAIN no registry.npmjs.org). Portanto API HTTP, build e interface ainda precisam ser testados no computador dos integrantes. Não apresentar esses itens como aprovados antes de executar. SQLite nativo em Node 22 emite aviso experimental. Confirmar com o professor/colega se a stack corresponde à usada em aula.
