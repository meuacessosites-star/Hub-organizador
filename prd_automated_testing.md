# PRD para Testes Automatizados e Auditoria de Segurança (Hub Organizador)

Este documento descreve detalhadamente as especificações de comportamento, esquemas de dados, seletores DOM e regras de segurança do **Hub Organizador**. Ele foi estruturado para ser consumido diretamente por ferramentas de teste automatizado (como Playwright, Cypress, Selenium) e scanners de segurança de aplicação (como OWASP ZAP, Burp Suite, ou agentes de auditoria AI).

---

## 1. Mapeamento de Seletores DOM (Locators para Automação)

Para garantir testes estáveis baseados na interface visual, utilize os seguintes seletores de ID e classe:

### 1.1. Autenticação (`LoginPage`)
* **Container de Login**: `#login-container`
* **Campo de Email**: `input[type="email"]` ou `#login-email`
* **Campo de Senha**: `input[type="password"]` ou `#login-password`
* **Botão de Login**: `#btn-login-submit`
* **Botão "Entrar como Convidado"**: `#btn-guest-login`
* **Mensagem de Erro de Autenticação**: `#auth-error-message`

### 1.2. Painel Lateral e Navegação (`Sidebar`)
* **Botão de Perfil do Usuário**: `#btn-user-profile`
* **Botão de Nova Plataforma**: `#btn-new-platform`
* **Botão "Gerenciar Categorias"**: `#btn-manage-categories`
* **Lista de Categorias**: `#category-list`
* **Item de Categoria**: `[id^="category-item-"]` (Ex: `#category-item-compras`)

### 1.3. Modais Principais
* **Modal de Perfil do Usuário**: `#user-profile-modal`
* **Modal de Nova Plataforma**: `#new-platform-modal`
* **Modal de Registro de Compra**: `#register-purchase-modal`
* **Modal de Gerenciamento de Status**: `#manage-statuses-modal`
* **Modal de Gerenciamento de Categorias**: `#manage-categories-modal`
* **Botão Fechar (Comum aos Modais)**: `button[title="Fechar"]` ou `.btn-close-modal`

### 1.4. Roda de Cores Avançada (`Color Wheel Canvas`)
* **Canvas de Seleção**: `canvas` dentro do contêiner do Color Picker (Ex: `canvas[width="128"]`)
* **Botão de Toggle da Roda**: `button[title="Abrir/Fechar roda de cores"]` ou `.btn-toggle-color-wheel`
* **Input de Texto de Cor Hexadecimal**: `input[placeholder="#000000"]` ou `.color-hex-input`

---

## 2. Fluxos Funcionais de Teste (Test Cases)

### 2.1. Criação e Edição de Plataformas e Perfis
1. **Passo**: Clicar em `#btn-new-platform`.
2. **Ação**: Preencher o nome da plataforma e associar um domínio (ex.: `netflix.com`).
3. **Verificação**: A ferramenta deve buscar logotipos e sugestões populares de domínios.
4. **Ação**: Adicionar Perfis de Acesso informando nomes e escolhendo cores/emojis.
5. **Ação**: Salvar.
6. **Expectativa**: O card da nova plataforma deve aparecer no grid principal com `#plat-{id}`.

### 2.2. Teste da Roda de Cores (Color Wheel Calculation)
* **Objetivo**: Testar se o cálculo trigonométrico converte cliques no canvas em HEX válidos.
* **Automação**:
  1. Localizar o `canvas` da Roda de Cores.
  2. Executar um evento de `mousedown` / `touchstart` nas coordenadas `(x, y)` relativas ao canvas (ex.: `cx + 30`, `cy + 30`).
  3. Verificar se o valor de `selectedColor` (visto no input de texto de cor) foi atualizado para um hexadecimal válido correspondente à área clicada (ex: tons de verde/azul).
  4. Mover o cursor (`mousemove` / `touchmove`) e verificar se a cor do input muda de forma contínua.

### 2.3. Gestão de Bundles (Pacotes de Itens)
* **Objetivo**: Garantir que as compras múltiplas funcionem e permitam alternar status rapidamente.
1. **Ação**: Registrar uma compra marcando a opção "Contém múltiplos itens (Bundle)".
2. **Ação**: Clicar em "+ Adicionar Item", preencher nome e link.
3. **Ação**: Salvar a compra.
4. **Ação**: No card do dashboard ou na aba de compras, clicar em um dos itens individuais do bundle para rotacionar seu status (`cycleBundleItemStatus`).
5. **Expectativa**: O status do item do bundle deve mudar sequencialmente (ex: de pendente para entregue) sem recarregar a página e persistir no banco de dados.

---

## 3. Esquema de Validação de Dados (Schema Boundary Limits)

Ferramentas de teste de robustez (fuzzing) devem injetar payloads para tentar estourar estes limites:

| Entidade | Campo | Tipo / Formato | Limite de Entrada esperado | Ação de Falha Esperada |
| :--- | :--- | :--- | :--- | :--- |
| **Plataforma** | `name` | String | Mín 1, Máx 100 caracteres | Bloquear submit / Erro visual |
| | `domain` | URL / Domínio | String sem espaços, ex.: `sub.domain.com` | Limpar espaços / Autocompletar |
| **Compra** | `name` | String | Mín 1, Máx 150 caracteres | Bloquear submit |
| | `price` | Number | `>= 0` (Decimais até 2 casas) | Impedir valores negativos |
| | `date` | ISO 8601 String | Data válida menor ou igual à atual | Rejeitar datas inválidas |
| **Status / Tag** | `color` | Hexadecimal | Regex: `^#[0-9A-Fa-f]{6}$` | Fallback para `#6366f1` se inválido |
| | `emoji` | Emoji UTF-8 | 1 único caractere de emoji | Impedir mais de 1 caractere |
| **Imagens** | `file` | Blob/File | Máx 10MB, formatos: PNG, JPG, WEBP | Redimensionamento client-side para 600x600px |

---

## 4. Vetores de Segurança e Testes de Vulnerabilidade (Threat Modeling)

As seguintes regras de proteção e segurança estão implementadas e devem ser validadas por ferramentas de DAST (Dynamic Application Security Testing) e auditoria de regras do Firestore:

### 4.1. Prevenção de XSS (Cross-Site Scripting)
* **Vetor**: Injeção de scripts maliciosos nos campos de texto como `name` da plataforma, nomes de itens de bundle, URLs e apelidos de perfis.
* **Payload de Teste**: `<script>alert('XSS')</script>` ou `<img src=x onerror=alert(1)>`.
* **Comportamento Esperado**: Todos os dados renderizados no DOM devem ser tratados como texto puro pelo React (uso seguro de JSX sem `dangerouslySetInnerHTML`).

### 4.2. Insegurança de IDOR (Insecure Direct Object Reference)
* **Vetor**: Usuário `User_A` tenta ler ou modificar recursos do `User_B` utilizando APIs do Firestore diretamente a partir do client-side do navegador.
* **Expectativa de Segurança**: As regras de segurança do Firestore (`firestore.rules`) barram qualquer operação em caminhos que não contenham o UID do próprio usuário logado.
* **Payload de Automação de Teste**:
  ```js
  // Tentativa do User A ler dados do User B via console / script injetado
  getDoc(doc(db, "platforms", "plat-user-B-id"));
  ```
  *Resultado Esperado*: Retornar erro `FirebaseError: Missing or insufficient permissions`.

### 4.3. Regras de Segurança do Firestore (Invariants)
A ferramenta de teste deve verificar as seguintes regras de segurança aplicadas sobre o banco de dados de produção:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regra Global de Usuário
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Coleções aninhadas de plataformas, compras e configurações
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Coleções Globais / Compartilhadas (se houver, ex.: tags do sistema)
    match /tags/{tagId} {
      allow read: if request.auth != null;
      allow write: if false; // Somente leitura pelo app client
    }
  }
}
```

### 4.4. Prevenção de Injeção de Dados e Colisões de ID
* **Problema**: Geradores de ID baseados apenas em `Date.now()` podem colidir sob concorrência rápida ou automações intensas de lote.
* **Proteção**: Todos os IDs gerados dinamicamente no app contêm um sufixo aleatório adicional (ex.: `Date.now() + '-' + Math.random().toString(36).substring(2, 9)`), mitigando colisões de identificadores.

---

## 5. Como Executar os Testes Automatizados no Ambiente de Desenvolvimento

Se você estiver rodando um runner local ou um container de testes, a aplicação está configurada sob as seguintes variáveis e portas:

* **Porta de Ingress**: A aplicação dev e produção roda obrigatoriamente na porta `3000`.
* **API de Backend**: Todas as rotas de servidor e intermediação estão sob o prefixo `/api/*`.
* **Autenticação**: Use a conta padrão de testes configurada no Firebase Authentication ou o modo Convidado (`Guest Mode`) para bypassar o fluxo de login em testes rápidos de interface.
