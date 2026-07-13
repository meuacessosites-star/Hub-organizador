# PRD - Hub Organizador de Contas e Compras

Este documento de Requisitos de Produto (PRD) descreve os objetivos, funcionalidades, arquitetura e interface do **Hub Organizador**, uma aplicação de gerenciamento unificado de assinaturas, contas de plataformas digitais, perfis de compartilhamento, compras e seus respectivos status de entrega.

---

## 1. Visão Geral do Produto

O **Hub Organizador** é uma solução centralizada voltada para usuários que necessitam gerenciar múltiplas plataformas digitais (como serviços de streaming, e-commerces, ferramentas de desenvolvimento ou produtividade), controlar quem possui acesso a quais perfis dentro dessas plataformas e monitorar de forma visual e intuitiva o status de compras, assinaturas e itens vinculados.

A aplicação utiliza um visual moderno, de alto contraste (com tema escuro refinado e paletas vibrantes de cor), suporte nativo a animações via `motion/react` e sincronização durável em tempo real utilizando **Firebase (Firestore e Authentication)**.

---

## 2. Personas e Casos de Uso

1. **O Compartilhador de Contas**: Usuários que assinam serviços de streaming (como Netflix, Spotify, Prime Video) e compartilham perfis com familiares ou amigos. Precisam registrar os perfis criados e as credenciais de cada um de forma segura e organizada.
2. **O Comprador Frequente**: Usuários que realizam muitas aquisições em diferentes e-commerces (Mercado Livre, Amazon, AliExpress) e desejam unificar o rastreio do status dos pedidos ("Pedido Feito", "Enviado", "Saiu para Entrega", "Entregue") em um único dashboard visual.
3. **O Gestor de Assinaturas**: Usuários com dezenas de assinaturas recorrentes que necessitam categorizá-las e rotulá-las (usando Tags personalizadas como "Trabalho", "Estudos", "Importante") para não perder prazos ou orçamentos.

---

## 3. Funcionalidades Principais

### 3.1. Autenticação e Sincronização em Nuvem
- **Login Seguro**: Suporte nativo para autenticação via Firebase (e-mail/senha ou fluxo de convidado).
- **Persistência em Tempo Real**: Sincronização instantânea com o banco de dados NoSQL **Google Cloud Firestore**.
- **Atualizações Otimistas**: Ações locais são executadas imediatamente na interface e sincronizadas em segundo plano, garantindo uma usabilidade rápida e fluida.

### 3.2. Gerenciamento de Plataformas e Perfis
- **Criação de Plataforma**: O usuário pode adicionar novas plataformas (ex.: Netflix, Amazon, GitLab), associar URLs de acesso e definir categorias.
- **Sugestões Populares**: Interface inteligente que sugere logotipos e domínios de plataformas famosas durante a criação.
- **Perfis Customizados**: Adição de perfis vinculados a cada plataforma com avatares personalizados utilizando emojis ou letras.

### 3.3. Roda de Cores Interativa e Avançada (Color Wheel)
- **Ajuste Fino de Avatares e Cores**: Implementação de uma roda de cores baseada em canvas (`<canvas>`) com conversão matemática de coordenadas de toque/clique para HSV/RGB.
- **Suporte para Usuário e Status**: Disponibilizada de forma idêntica tanto para o gerenciamento de perfis e status de pedidos quanto no **Painel de Perfil do Usuário** (`UserProfileModal`).
- **Ponteiro Dinâmico**: Um indicador gráfico animado (pauzinho/vetor) aponta em tempo real do centro do canvas até o pixel exato selecionado pelo usuário, facilitando a visualização da matiz (hue) e saturação selecionadas.

### 3.4. Gestão de Compras e Itens de Bundle
- **Registro de Compras**: Cadastro detalhado de aquisições contendo nome, data, valor, plataforma de origem, perfil de destino e tags.
- **Suporte a Bundles (Pacotes)**: Possibilidade de cadastrar compras que contêm múltiplos sub-itens (ex.: um pacote de jogos ou múltiplos componentes eletrônicos em um mesmo frete).
- **Ciclo de Status**: Possibilidade de ciclar de forma rápida o status de cada item individual de um bundle simplesmente clicando em seu indicador gráfico direto nos cards ou na visualização geral.

### 3.5. Filtros Dinâmicos e Categorização
- **Filtro Avançado**: Busca textual de plataformas e compras por tags, categorias, perfis associados e status do pedido.
- **Barra Lateral Responsiva**: Organização de categorias criadas de forma dinâmica para facilitar a navegação em dispositivos móveis e desktops.

---

## 4. Arquitetura e Estrutura de Código

A base de código está modularizada para garantir legibilidade e prevenir ultrapassagem de limites de tokens nas compilações:

- `/src/types.ts`: Definição central de todas as interfaces TypeScript (`Platform`, `Profile`, `Purchase`, `Status`, `Category`, `Tag`).
- `/src/hooks/useStorage.ts`: Engine de dados que orquestra a lógica de backup do Firebase Firestore com o estado local do React.
- `/src/components/`:
  - `UserProfileModal.tsx`: Edição do perfil do usuário autenticado contendo a roda de cores avançada com vetor de arrasto.
  - `ManageStatusesModal.tsx` & `RegisterPurchaseModal.tsx`: Registro e manipulação de status com a mesma engine de coloração.
  - `NewPlatformModal.tsx` & `ProfileModal.tsx`: Cadastro de novas ferramentas digitais e gerenciamento de seus sub-perfis.
  - `PurchasesView.tsx`: Dashboard geral para visualização inteligente, filtros de busca e ordenação das compras cadastradas.
  - `PlatformCard.tsx`: Exibição visual rica de cada plataforma, destacando as credenciais de cada perfil e sub-itens de bundles.

---

## 5. Diretrizes de Interface e Design (UI/UX)

1. **Tema Escuro Moderno (Cosmic Dark)**: Utilização de fundos em tons de cinza azulado escuro (`#0e0f14`, `#1a1b26`), combinados com bordas finas e sutis em contraste e sombras elevadas.
2. **Acessibilidade de Contraste**: Cores vivas para tags e status de forma a garantir visibilidade excelente tanto em desktops quanto em displays portáteis de alta densidade de pixels.
3. **Animações Fluidas**: Micro-interações táteis nos botões (efeito de clique rápido `active:scale-95`), transições de abertura de modals com interpolação física (mola) de suavização.
