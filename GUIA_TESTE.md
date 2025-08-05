# 🚀 Guia Rápido para Testar a Aplicação RIF Analisador

## Passo a Passo para Teste

### 1. Preparação Inicial

#### Verificar Pré-requisitos:
```bash
# Verificar Python
python --version  # Deve ser 3.10+

# Verificar Node.js
node --version    # Deve ser 16+

# Verificar npm
npm --version
```

### 2. Inicializar Banco de Dados (Primeira vez)
```bash
cd backend
python init_db.py
```

### 3. Iniciar Backend
```bash
# Opção 1: Script automático
start_backend.bat

# Opção 2: Comando manual
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

### 4. Iniciar Frontend (em outro terminal)
```bash
# Opção 1: Script automático
start_frontend.bat

# Opção 2: Comando manual
cd frontend
npm install  # Primeira vez apenas
npm start
```

### 5. Testar Aplicação
```bash
# Executar script de teste
python test_app.py
```

### 6. Acessar Aplicação
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Documentação API**: http://localhost:8080/docs

## Teste Completo

### 1. Login
- Acesse http://localhost:3000
- Use credenciais LDAP válidas ou teste com usuário/senha do sistema

### 2. Upload de Arquivos
- Após login, você será redirecionado para a tela de upload
- Use os arquivos de exemplo em `exemplos/`:
  - `exemplos/Comunicacoes.csv`
  - `exemplos/Envolvidos.csv`
  - `exemplos/Ocorrencias.csv`

### 3. Dashboard
- Após upload, você será redirecionado para o dashboard
- Verifique:
  - Volume total analisado
  - Número de comunicações
  - Lista de comunicações

### 4. Detalhes
- Clique em "Detalhes" em qualquer comunicação
- Verifique o parsing específico por banco
- Analise as informações extraídas

## Arquivos de Exemplo

### Comunicacoes.csv
Contém dados de comunicações bancárias com:
- Informações do Bradesco (parser completo)
- Informações do Banco do Brasil (parser específico)

### Envolvidos.csv
Contém pessoas envolvidas nas operações:
- Titulares das contas
- Cônjuges
- Sócios/Dirigentes

### Ocorrencias.csv
Contém tipos de ocorrências:
- Movimentação bancária suspeita
- Transferências de alto valor

## Verificações Importantes

### Backend Funcionando:
- ✅ http://localhost:8080/ping retorna `{"status": "ok"}`
- ✅ http://localhost:8080/docs mostra documentação da API

### Frontend Funcionando:
- ✅ http://localhost:3000 carrega a tela de login
- ✅ Interface responsiva e moderna

### Banco de Dados:
- ✅ Arquivo `backend/database/dados.db` existe
- ✅ Tabelas criadas corretamente

## Troubleshooting

### Backend não inicia:
```bash
# Verificar virtual environment
cd backend
venv\Scripts\activate

# Verificar dependências
pip install -r requirements.txt

# Verificar porta
netstat -an | findstr :8080
```

### Frontend não inicia:
```bash
# Verificar Node.js
node --version

# Instalar dependências
cd frontend
npm install

# Verificar porta
netstat -an | findstr :3000
```

### Problemas de CORS:
- Backend já está configurado com CORS
- Verificar se URLs estão corretas no frontend

### Problemas de Autenticação:
- Verificar configurações LDAP em `backend/app/auth.py`
- Testar com credenciais válidas do domínio

## Logs Úteis

### Backend:
- Logs aparecem no terminal onde o backend está rodando
- Erros de parsing aparecem no console

### Frontend:
- Logs aparecem no terminal onde o frontend está rodando
- Console do navegador (F12) mostra erros de rede

## Próximos Passos

1. **Teste com dados reais**: Use arquivos CSV reais da sua instituição
2. **Personalize parsers**: Adicione parsers para outros bancos
3. **Configure LDAP**: Ajuste configurações para seu ambiente
4. **Deploy**: Configure para produção

## Suporte

- 📖 Documentação completa: `README.md`
- 🔧 Script de teste: `test_app.py`
- 📁 Exemplos: Pasta `exemplos/`
- 🌐 API Docs: http://localhost:8080/docs 