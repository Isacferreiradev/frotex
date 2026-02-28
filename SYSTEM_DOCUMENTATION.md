# FROTEX Master System Documentation v1.0
**Project Cockpit & Engineering Manifesto**

---

## 1. Visão Geral (Executive Summary)
O FROTEX é uma plataforma SaaS multi-tenant de alta performance projetada para a gestão de ativos e locação de equipamentos. O sistema centraliza operações financeiras, controle de inventário inteligente e inteligência de negócios (BI) em uma interface de usuário "Elite" (premium).

### Objetivo do Produto
Transformar a gestão de locadoras físicas em uma operação digital data-driven, otimizando o ROI (Return on Investment) de cada ativo e eliminando fricções operacionais.

---

## 2. Arquitetura Técnica (Core Stack)
O sistema foi construído com foco em **resiliência, escalabilidade e segurança**.

- **Frontend**: React (Next.js 14+) com TypeScript.
- **Styling**: Tailwind CSS & Componentes Customizados (Design System FROTEX).
- **Backend**: Node.js & Express.
- **Database**: PostgreSQL operado via Drizzle ORM (Type-safe).
- **Segurança**: Autenticação via JWT (JSON Web Tokens) com isolamento Multi-tenant.
- **Animações**: Micro-interações otimizadas via CSS Native Transitions.

---

## 3. Modelo de Dados (Schema & Multi-tenancy)
O FROTEX utiliza um padrão de **Silo de Dados por Tenant**. Cada registro no sistema (`users`, `tools`, `rentals`, `payments`) é vinculado a um `tenantId`, garantindo que um cliente nunca visualize dados de outro.

### Principais Entidades:
1. **Tenants**: Empresas/Locadoras cadastradas.
2. **Users**: Colaboradores (Proprietários ou Equipe).
3. **Tools (Equipamentos)**: O coração do inventário.
4. **Rentals (Locações)**: Contratos e fluxo de saída/entrada.
5. **Finance (Payments/Expenses)**: Fluxo de caixa detalhado.

---

## 4. Algoritmos & Lógica de Negócio

### 4.1. Motor de Inteligência (ROI Engine)
O FROTEX não apenas lista itens; ele analisa a saúde financeira de cada ativo.
- **Cálculo de ROI**: `Receita Total / (Custo de Aquisição + Custos de Manutenção)`.
- **Taxa de Utilização**: `Dias Locados / Dias de Propriedade`.
- **Lógica de Sugestão**:
    - **Replace (Substituir)**: Acionado se o custo de manutenção exceder 40% da receita do item.
    - **Optimized Pricing**: Sugere aumento de diária se a ocupação for > 80% e ROI for saudável.
    - **Zombie Alert**: Identifica itens ociosos (utilização < 20%) para promoções.

### 4.2. Fluxo de Recebimentos (Dashboard Flow)
- **Receita Mensal**: Soma de todos os pagamentos com status `completed` no mês atual.
- **Previsão (A Receber)**: Soma de pagamentos com status `pending`.
- **Lucro Líquido**: `(Receita Bruta - Despesas Operacionais)`.

### 4.3. Máquina de Estados da Locação
As ferramentas transitam entre estados rigorosamente controlados:
- `available` (Disponível)
- `rented` (Alugado)
- `maintenance` (Em Manutenção)

**Lógica de Check-out/Check-in**:
- **Check-out**: Bloqueia o item, gera um `rentalCode` único e cria a entrada financeira pendente.
- **Check-in**: Libera o item, calcula multas por atraso automaticamente e confirma a transação financeira.

---

## 5. Módulos Operacionais de Valor

### 5.1. Gestão de Orçamentos (Quotes)
O sistema permite a criação de orçamentos prévios sem reserva de estoque, facilitando a negociação comercial. Orçamentos podem ser convertidos em Locações ativas com um clique, mantendo o histórico de negociação.

### 5.2. Checklists de Inspeção
Garantia de qualidade na saída e entrada. O sistema exige a validação de itens críticos (estado físico, limpeza, acessórios) através de checklists digitais, vinculando a responsabilidade ao operador e ao cliente.

### 5.3. Gerador de PDF & Documentos
Motor interno de geração de documentos em tempo real.
- **Contratos de Locação**: Preenchimento automático com dados do cliente e cláusulas do tenant.
- **Comprovantes de Recebimento**: Gerados instantaneamente após confirmação de pagamento.

### 5.4. Comunicações & Notificações
Módulo preparado para alertas de manutenção e avisos de atraso de devolução, mantendo a equipe sempre informada sobre o fluxo operacional.

---

## 6. Experiência do Usuário (Elite UX)

### 6.1. Onboarding de Primeiro Voo
Ao entrar pela primeira vez, o usuário é guiado por um modal dinâmico que introduz os conceitos de Frota, Inteligência e Segurança, garantindo que a curva de aprendizado seja zero.

### 6.2. Visual Identity & Polish
- **Glassmorphism**: Uso de transparências e borrões (backdrop-blur) para profundidade.
- **Skeleton Screens**: Substituem loaders tradicionais, aumentando a percepção de performance.
- **Avatar System**: Personalização de perfil com identidades visuais pré-definidas.

---

## 7. Segurança & Infraestrutura
- **Isolamento de Tenant**: Middleware de segurança verifica o `tenantId` em cada requisição ao banco.
- **Escopo**: Focado em pequenos e médios locadores, removendo burocracias de gestão de equipe e contratos complexos para máxima agilidade.
- **Validação Rigorosa**: Todos os inputs são validados via **Zod schemas** no Front e Back.

---

## 8. Próximos Passos (Roadmap de Escala)
- **Fase 1**: Integração com Notas Fiscais (NFS-e) e Gateway de Pagamento.
- **Fase 2**: Aplicativo Mobile Nativo para inspeção de frota offline e assinatura digital.
- **Fase 3**: Motor de IA Preditiva para prever quebra de equipamentos com base no histórico de manutenção.

---
**Assinado:** 
*Master Architect & Lead Production Engineer - FROTEX Team*
