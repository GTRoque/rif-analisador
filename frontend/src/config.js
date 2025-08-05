// Configuração centralizada da aplicação
const config = {
  // URL da API - pode ser alterada conforme ambiente
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  
  // Timeout para requisições (em ms)
  REQUEST_TIMEOUT: 30000,
  
  // Configurações de upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.csv'],
  
  // Configurações de paginação
  ITEMS_PER_PAGE: 20,
  
  // Configurações de cache
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
};

// Exportar API_BASE_URL diretamente para compatibilidade
export const API_BASE_URL = config.API_BASE_URL;

export default config; 