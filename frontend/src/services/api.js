import config from '../config';

class ApiService {
  constructor() {
    this.baseURL = config.API_BASE_URL;
    this.timeout = config.REQUEST_TIMEOUT;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Se o body for FormData, não definir Content-Type
    if (options.body instanceof FormData) {
      delete defaultOptions.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Autenticação
  async login(usuario, senha) {
    const formData = new FormData();
    formData.append('usuario', usuario);
    formData.append('senha', senha);
    
    return this.request('/login', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type para FormData
    });
  }

  // Upload de arquivos
  async uploadFiles(comunicacoes, envolvidos, ocorrencias, usuario) {
    const formData = new FormData();
    formData.append('comunicacoes', comunicacoes);
    formData.append('envolvidos', envolvidos);
    formData.append('ocorrencias', ocorrencias);
    formData.append('usuario', usuario);
    
    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type para FormData
    });
  }

  // Dashboard
  async getDashboardResumo() {
    return this.request('/api/dashboard-resumo');
  }

  async getComunicacoes() {
    return this.request('/api/comunicacoes');
  }

  async getComunicacaoDetalhe(id) {
    return this.request(`/api/comunicacao/${id}`);
  }

  // Parsing
  async parseInformacoes(banco, texto) {
    return this.request(`/api/parse/${banco}`, {
      method: 'POST',
      body: JSON.stringify({ texto }),
    });
  }

  // Health check
  async ping() {
    return this.request('/ping');
  }

  // Estatísticas
  async getEstatisticas() {
    return this.request('/api/estatisticas');
  }
}

export default new ApiService(); 