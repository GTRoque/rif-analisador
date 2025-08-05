import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function GeradorI2() {
  const [arquivos, setArquivos] = useState({
    comunicacoes: null,
    envolvidos: null,
    ocorrencias: null
  });
  const [processando, setProcessando] = useState(false);
  const [validacao, setValidacao] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleFileChange = (tipo, file) => {
    setArquivos(prev => ({
      ...prev,
      [tipo]: file
    }));
    setValidacao(null);
    setErro('');
    setSucesso('');
  };

  const validarArquivos = async () => {
    if (!arquivos.comunicacoes || !arquivos.envolvidos || !arquivos.ocorrencias) {
      setErro('Por favor, selecione todos os 3 arquivos CSV');
      return;
    }

    setProcessando(true);
    setErro('');

    try {
      const formData = new FormData();
      formData.append('comunicacoes', arquivos.comunicacoes);
      formData.append('envolvidos', arquivos.envolvidos);
      formData.append('ocorrencias', arquivos.ocorrencias);

      const response = await fetch(`${API_BASE_URL}/api/i2/validar-arquivos`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro ao validar arquivos');
      }

      const resultado = await response.json();
      setValidacao(resultado);
      
      if (resultado.status_geral.valido) {
        setSucesso('Arquivos validados com sucesso! Prontos para processamento.');
      } else {
        setErro('Alguns arquivos contêm erros. Verifique os detalhes acima.');
      }
    } catch (error) {
      setErro(`Erro na validação: ${error.message}`);
    } finally {
      setProcessando(false);
    }
  };

  const gerarArquivoI2 = async () => {
    if (!arquivos.comunicacoes || !arquivos.envolvidos || !arquivos.ocorrencias) {
      setErro('Por favor, selecione todos os 3 arquivos CSV');
      return;
    }

    setProcessando(true);
    setErro('');
    setSucesso('');

    try {
      const formData = new FormData();
      formData.append('comunicacoes', arquivos.comunicacoes);
      formData.append('envolvidos', arquivos.envolvidos);
      formData.append('ocorrencias', arquivos.ocorrencias);

      const response = await fetch(`${API_BASE_URL}/api/i2/gerar-arquivo`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro: ${errorText}`);
      }

      // Download do arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Extrair nome do arquivo do header se disponível
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'RIF_InformacoesAdicionais_I2.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSucesso(`Arquivo ${filename} gerado e baixado com sucesso!`);
    } catch (error) {
      setErro(`Erro ao gerar arquivo: ${error.message}`);
    } finally {
      setProcessando(false);
    }
  };

  const renderValidacao = () => {
    if (!validacao) return null;

    return (
      <div className="mt-4 space-y-3">
        <h3 className="font-semibold text-lg text-blue-900">Resultado da Validação</h3>
        
        {/* Status Geral */}
        <div className={`p-3 rounded-lg ${validacao.status_geral.valido ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center">
            {validacao.status_geral.valido ? (
              <div className="flex items-center text-green-700">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Arquivos válidos - Pronto para processamento
              </div>
            ) : (
              <div className="flex items-center text-red-700">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Arquivos contêm erros
              </div>
            )}
          </div>
        </div>

        {/* Detalhes por arquivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(validacao).filter(([key]) => key !== 'status_geral').map(([arquivo, dados]) => (
            <div key={arquivo} className={`p-3 rounded-lg border ${dados.valido ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h4 className="font-semibold capitalize">{arquivo}</h4>
              {dados.valido ? (
                <div className="text-sm text-green-700 space-y-1">
                  <p>✓ Válido</p>
                  <p>Linhas: {dados.linhas || 'N/A'}</p>
                  {dados.bancos_encontrados && (
                    <p>Bancos: {dados.bancos_encontrados.join(', ')}</p>
                  )}
                  {dados.tipos_envolvidos && (
                    <p>Tipos: {dados.tipos_envolvidos.slice(0, 2).join(', ')}</p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-700">
                  <p>✗ Erro: {dados.erro}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center mb-6">
        <div className="bg-blue-100 p-3 rounded-lg mr-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-blue-900">Gerador de Arquivo para I2 Analyst</h2>
          <p className="text-gray-600 text-sm">Converta os arquivos CSV em formato Excel compatível com I2 Analyst</p>
        </div>
      </div>

      {/* Upload de Arquivos */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-blue-900">1. Selecione os Arquivos CSV</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Comunicações */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange('comunicacoes', e.target.files[0])}
              className="hidden"
              id="comunicacoes-file"
            />
            <label htmlFor="comunicacoes-file" className="cursor-pointer">
              <div className="text-blue-600 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-sm font-medium text-gray-700">Comunicações.csv</div>
              <div className="text-xs text-gray-500 mt-1">
                {arquivos.comunicacoes ? arquivos.comunicacoes.name : 'Clique para selecionar'}
              </div>
            </label>
          </div>

          {/* Envolvidos */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange('envolvidos', e.target.files[0])}
              className="hidden"
              id="envolvidos-file"
            />
            <label htmlFor="envolvidos-file" className="cursor-pointer">
              <div className="text-blue-600 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-sm font-medium text-gray-700">Envolvidos.csv</div>
              <div className="text-xs text-gray-500 mt-1">
                {arquivos.envolvidos ? arquivos.envolvidos.name : 'Clique para selecionar'}
              </div>
            </label>
          </div>

          {/* Ocorrências */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange('ocorrencias', e.target.files[0])}
              className="hidden"
              id="ocorrencias-file"
            />
            <label htmlFor="ocorrencias-file" className="cursor-pointer">
              <div className="text-blue-600 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-sm font-medium text-gray-700">Ocorrências.csv</div>
              <div className="text-xs text-gray-500 mt-1">
                {arquivos.ocorrencias ? arquivos.ocorrencias.name : 'Clique para selecionar'}
              </div>
            </label>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={validarArquivos}
            disabled={processando || !arquivos.comunicacoes || !arquivos.envolvidos || !arquivos.ocorrencias}
            className="flex-1 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {processando ? 'Validando...' : '2. Validar Arquivos'}
          </button>
          
          <button
            onClick={gerarArquivoI2}
            disabled={processando || !validacao?.status_geral?.valido}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {processando ? 'Gerando...' : '3. Gerar Arquivo I2'}
          </button>
        </div>

        {/* Mensagens */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm">{erro}</p>
            </div>
          </div>
        )}

        {sucesso && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-700 text-sm">{sucesso}</p>
            </div>
          </div>
        )}

        {/* Resultado da Validação */}
        {renderValidacao()}

        {/* Informações sobre o formato */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Sobre o Arquivo Gerado</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>Formato:</strong> Excel (.xlsx) compatível com I2 Analyst</p>
            <p>• <strong>Conteúdo:</strong> Entidades, transações, ocorrências e dados brutos</p>
            <p>• <strong>Parsers:</strong> Suporte para Banco do Brasil, Bradesco, Caixa Econômica Federal</p>
            <p>• <strong>Melhorias:</strong> Parser aprimorado para Caixa Econômica Federal (resolve problema do indexador 6)</p>
          </div>
        </div>
      </div>
    </div>
  );
}