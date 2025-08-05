import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

export default function Upload() {
  const [comunicacoes, setComunicacoes] = useState(null);
  const [envolvidos, setEnvolvidos] = useState(null);
  const [ocorrencias, setOcorrencias] = useState(null);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const usuario = localStorage.getItem('usuario');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErro(''); setLoading(true);
    try {
      const data = await apiService.uploadFiles(comunicacoes, envolvidos, ocorrencias, usuario);
      if (data.success) {
        setMsg('Arquivos enviados com sucesso!');
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        setErro(data.msg || 'Erro ao enviar arquivos.');
      }
    } catch (err) {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tl from-gray-600 via-gray-200 to-gray-100">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center">
        {/* Ícone de upload */}
        <div className="bg-blue-100 rounded-full p-4 mb-4">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
        </div>
        <h2 className="text-3xl font-extrabold mb-2 text-center text-blue-900 tracking-tight">Análise de RIF</h2>
        <p className="text-gray-500 mb-8 text-center">Faça o upload dos três arquivos necessários para análise do Relatório de Investigação Financeira.</p>
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Comunicacoes.csv</label>
            <input type="file" accept=".csv" required onChange={e => setComunicacoes(e.target.files[0])} className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Envolvidos.csv</label>
            <input type="file" accept=".csv" required onChange={e => setEnvolvidos(e.target.files[0])} className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Ocorrencias.csv</label>
            <input type="file" accept=".csv" required onChange={e => setOcorrencias(e.target.files[0])} className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition" />
          </div>
          {msg && <div className="text-green-600 text-sm text-center">{msg}</div>}
          {erro && <div className="text-red-600 text-sm text-center">{erro}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold text-lg shadow hover:bg-blue-800 transition disabled:opacity-50 mt-4">
            {loading ? 'Analisando...' : 'Analisar RIF'}
          </button>
        </form>
      </div>
    </div>
  );
} 