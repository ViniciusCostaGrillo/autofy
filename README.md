# 🚗 Autofy

<p align="center">
  <img src="assets/images/autofy_app_mockup.png" alt="Autofy App Mockup" width="100%" max-width="800px" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  <strong>O co-piloto inteligente e premium para a gestão completa do seu veículo.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK%2054-000000?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-20232a?style=for-the-badge&logo=react&logoColor=61dafb" alt="React Native" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-NativeWind-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Jest-Tests-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
</p>

---

## 🌟 Sobre o Projeto

O **Autofy** é um aplicativo mobile desenvolvido com **Expo (React Native)** e **TypeScript** que ajuda proprietários de veículos a monitorarem e otimizarem todos os custos operacionais do seu carro. 

Inspirado em uma estética premium e moderna baseada no padrão de design do Spotify (Dark Mode, Glassmorphism, e verde/azul vibrantes), o aplicativo entrega uma experiência de usuário polida e fluida para o controle de gastos, planejamento de trajetos e acompanhamento de manutenções preventivas.

---

## ✨ Recursos Principais

### 📊 1. Dashboard Inteligente (Home)
- Visualização rápida dos principais indicadores de performance (KPIs).
- Estatísticas de **Consumo Médio** e **Gasto Total em Combustível**.
- Estimativa dinâmica de **Custo por Quilômetro Rodado** com base no último abastecimento registrado.
- Acesso a atalhos rápidos e alertas prioritários de manutenção.

### 🗺️ 2. Planejador Inteligente de Viagens
- Estimativa automatizada de rota e tempo de viagem utilizando a API pública de mapas **Photon Komoot** e roteamento **OSRM**.
- Sugestão automática do **Preço Médio de Combustível** com base na cidade de origem (dataset oficial ANP).
- Suporte a trajetos de **Ida** ou **Ida e Volta** (com duplicação automática da distância calculada).
- Cálculo exato de custo por passageiro dividindo o gasto total de pedágio + combustível.

### 🔧 3. Gestão e Controle de Manutenções
- **Controle de Trocas de Óleo:** Alertas inteligentes baseados em limite de tempo (data) ou quilometragem restante.
- **Registro de Despesas:** Categorização de gastos (pneus, seguro, serviços, peças, outros).
- **Despesas Recorrentes:** Rateio mensal automático de taxas anuais ou parceladas (ex: seguro automotivo) para exibir o custo fixo real por mês do automóvel.

### 🌍 4. Internacionalização (i18n) e Adaptação
- Tradução completa da interface para 3 idiomas: **Português (pt-BR)**, **Inglês (en)** e **Espanhol (es)**.
- Formatação automática de moedas (R$, $, €), distância (km, milhas) e consumo (km/l, L/100km, MPG) com base no país e preferências do usuário.

---

## 🛠️ Stack Tecnológica

- **Framework:** [Expo SDK 54](https://expo.dev/) (React Native 0.81)
- **Roteamento:** Expo Router (Roteamento baseado em arquivos)
- **Estilização:** NativeWind (Tailwind CSS adaptado para mobile nativo)
- **Banco de Dados & Autenticação:** [Supabase](https://supabase.com/) com políticas estritas de RLS (Row Level Security) e envio de login OTP.
- **Persistência de Dados Offline:** React Native AsyncStorage e Expo SecureStore (utilizando chunking para contornar o limite de 2KB).
- **Testes Unitários:** Jest (testes de cálculos matemáticos de custo e algoritmos de alertas).

---

## 🏗️ Estrutura do Código

```
autofy/
├── app/                        # Expo Router — Rotas e Telas
│   ├── _layout.tsx             # Root layout: Providers + Auth Guards
│   ├── (tabs)/                 # Navegação por Abas (Dashboard, Históricos, Frota)
│   └── (modals)/               # Formulários Modais (Nova Viagem, Novo Abastecimento)
├── components/                 # Componentes Genéricos e UI Kit do Design System
├── hooks/                      # Custom Hooks para chamadas e regras de negócio
├── lib/                        # Integração de serviços (Auth, Supabase, LocalStore, i18n)
├── types/                      # Definições de tipagem TypeScript
└── utils/                      # Funções utilitárias puras e isoladas
```

---

## 🚦 Configuração Local

### Requisitos Prévios
- Node.js instalado (v18+)
- Conta Expo criada para execução de builds remotas (EAS CLI)

### 1. Clonar o repositório
```bash
git clone https://github.com/ViniciusCostaGrillo/autofy.git
cd autofy/autofy
```

### 2. Configurar as Variáveis de Ambiente
Duplique o arquivo `.env.example` para `.env` e preencha as credenciais do seu projeto Supabase:
```bash
cp .env.example .env
```
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 3. Instalar as dependências
```bash
npm install
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run start
```
Pressione `a` para abrir no emulador Android ou `i` para o simulador iOS.

---

## 🧪 Testes de Unidade

Para rodar os testes unitários da lógica matemática de manutenção, consumo e alertas de óleo:
```bash
npm run test
```

Para validar a tipagem estática do TypeScript:
```bash
npm run typecheck
```

---

## 📦 Geração de Releases (Build)

O projeto está configurado para builds via **Expo Application Services (EAS)**:

### Gerar APK Instalável (Para Testes)
```bash
npx eas-cli build --platform android --profile preview
```

### Gerar AAB (Para Envio à Google Play Store)
```bash
npx eas-cli build --platform android --profile production
```
