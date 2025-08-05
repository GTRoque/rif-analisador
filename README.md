# RIF Analisador - Sistema de Análise de Relatórios de Investigação Financeira

## Visão Geral
Sistema desenvolvido para a Polícia Civil do RN para análise de Relatórios de Investigação Financeira (RIF). O sistema processa dados bancários de diferentes instituições financeiras e extrai informações estruturadas para análise investigativa.

## Arquitetura
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: React + Tailwind CSS
- **Autenticação**: LDAP integrado
- **Processamento**: Parsers específicos por banco

## Pré-requisitos

### Backend
- Python 3.10+
- Virtual environment já configurado em `backend/venv/`
- Dependências instaladas (ver `backend/requirements.txt`)

### Frontend
- Node.js 16+
- npm ou yarn

## Como Iniciar a Aplicação

### Opção 1: Scripts Automáticos (Recomendado)

#### Windows:
1. **Iniciar Backend**:
   ```bash
   start_backend.bat
   ```

2. **Iniciar Frontend** (em outro terminal):
   ```bash
   start_frontend.bat
   ```

### Opção 2: Comandos Manuais

#### 1. Iniciar Backend
```bash
cd backend
venv\Scripts\activate  # Windows
# ou
source venv/bin/activate  # Linux/Mac

python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

#### 2. Iniciar Frontend
```bash
cd frontend
npm install  # Primeira vez apenas
npm start
```

## Acessos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Documentação API**: http://localhost:8080/docs

## Funcionalidades para Teste

### 1. Autenticação
- Acesse http://localhost:3000
- Use credenciais LDAP válidas do domínio `pcrn.local`
- Ou teste com usuário/senha válidos do sistema

### 2. Upload de Arquivos
O sistema aceita 3 arquivos CSV:
- `Comunicacoes.csv` - Dados das comunicações bancárias
- `Envolvidos.csv` - Pessoas envolvidas
- `Ocorrencias.csv` - Tipos de ocorrências

### 3. Análise de Dados
- Dashboard com resumo estatístico
- Lista de comunicações processadas
- Detalhamento por comunicação
- Parsing específico por banco (Bradesco, BB, Nubank)

## Estrutura de Arquivos CSV

### Comunicacoes.csv
```
Indexador;nomeComunicante;Data_da_operacao;DataFimFato;CampoA;informacoesAdicionais;NumeroOcorrenciaBC
```

### Envolvidos.csv
```
Indexador;nomeEnvolvido;cpfCnpjEnvolvido;tipoEnvolvido
```

### Ocorrencias.csv
```
idOcorrencia;Ocorrencia
```

## Parsers Disponíveis

- **Bradesco**: Parser completo com extração detalhada
- **Banco do Brasil**: Parser específico para formato BB
- **Nubank**: Parser básico
- **Genérico**: Para outros bancos

## APIs Principais

- `POST /login` - Autenticação
- `POST /upload` - Upload de arquivos
- `GET /api/dashboard-resumo` - Resumo estatístico
- `GET /api/comunicacoes` - Lista de comunicações
- `GET /api/comunicacao/{id}` - Detalhes específicos

## Troubleshooting

### Backend não inicia
1. Verifique se o virtual environment está ativo
2. Confirme se as dependências estão instaladas: `pip install -r requirements.txt`
3. Verifique se a porta 8080 está livre

### Frontend não inicia
1. Verifique se Node.js está instalado: `node --version`
2. Instale as dependências: `npm install`
3. Verifique se a porta 3000 está livre

### Problemas de CORS
- O backend já está configurado com CORS para permitir requisições do frontend
- Verifique se as URLs estão corretas no frontend

### Problemas de Autenticação LDAP
- Verifique se o servidor LDAP está acessível
- Confirme as configurações em `backend/app/auth.py`

## Desenvolvimento

### Estrutura do Projeto
```
rif-analisador/
├── backend/
│   ├── app/
│   │   ├── main.py          # API principal
│   │   ├── models.py        # Modelos do banco
│   │   ├── auth.py          # Autenticação LDAP
│   │   └── ...
│   ├── parsers/             # Parsers por banco
│   └── database/            # Banco SQLite
└── frontend/
    ├── src/
    │   ├── pages/           # Páginas React
    │   ├── components/      # Componentes
    │   └── ...
    └── ...
```

### Adicionando Novos Parsers
1. Crie um novo arquivo em `backend/parsers/`
2. Implemente a função `parse_[banco](texto)`
3. Adicione o parser em `backend/app/main.py`

## Suporte
Para dúvidas ou problemas, consulte a documentação da API em http://localhost:8080/docs 