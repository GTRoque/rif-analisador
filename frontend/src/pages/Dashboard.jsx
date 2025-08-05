import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import Estatisticas from '../components/Estatisticas';
import GeradorI2 from '../components/GeradorI2';

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [comunicacoes, setComunicacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [mostrarI2, setMostrarI2] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDados() {
      setLoading(true);
      setErro('');
      try {
        const [resumoData, comunicacoesData] = await Promise.all([
          apiService.getDashboardResumo(),
          apiService.getComunicacoes()
        ]);
        setResumo(resumoData);
        setComunicacoes(comunicacoesData);
      } catch (err) {
        setErro('Erro ao buscar dados do dashboard.');
      } finally {
        setLoading(false);
      }
    }
    fetchDados();
  }, []);

  // Soma dos valores da coluna Valor
  const somaValores = comunicacoes.reduce((acc, c) => acc + (c.valor || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-tl from-gray-600 via-gray-200 to-gray-100">
      <div className="w-full px-4 md:px-6 lg:px-8 pt-8">
        <Navbar />
        <h1 className="text-3xl font-bold text-blue-900 mb-4 mt-2">Dashboard</h1>
        {loading && <div>Carregando...</div>}
        {erro && <div className="text-red-600 mb-4">{erro}</div>}
        
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 w-full">
          <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-start justify-center border border-gray-100 w-full">
            <div className="text-gray-500 text-base mb-1">Volume Analisado</div>
            <div className="text-2xl font-bold text-blue-900">R$ {somaValores.toLocaleString('pt-BR')}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-start justify-center border border-gray-100 w-full">
            <div className="text-gray-500 text-base mb-1">Comunicações</div>
            <div className="text-2xl font-bold text-blue-900">{resumo?.num_comunicacoes}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-center justify-center border border-gray-100 w-full">
            <button
              onClick={() => setMostrarI2(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Gerar arquivo para I2
            </button>
            <div className="text-gray-500 text-xs mt-2 text-center">Converter CSV para Excel</div>
          </div>
        </div>
        
        {/* Componente de estatísticas */}
        <Estatisticas />
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 w-full">
          <h2 className="text-xl font-bold mb-3">Comunicações</h2>
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full bg-white text-base">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Titular</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[140px]">CPF/CNPJ</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[180px]">Banco</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[170px]">Período</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[120px]">Valor</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {comunicacoes.map((c, idx) => (
                  <tr key={c.id} className={"transition hover:bg-blue-50 " + (idx === comunicacoes.length-1 ? '' : 'border-b border-gray-100') }>
                    <td className="px-4 py-2 whitespace-nowrap">{c.titular}</td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[140px]">{c.cpf}</td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[180px]">{c.banco}</td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[170px]">{c.periodo ? `${c.periodo.inicio || ''} - ${c.periodo.fim || ''}` : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[120px]">R$ {c.valor?.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => navigate(`/comunicacao/${c.id}`)} className="bg-blue-600 text-white px-4 py-1 rounded shadow-sm hover:bg-blue-700 transition">Detalhes</button>
                    </td>
                  </tr>
                ))}
                {comunicacoes.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-6 text-gray-500">Nenhuma comunicação encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal do Gerador I2 */}
        {mostrarI2 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-blue-900">Gerador de Arquivo para I2 Analyst</h2>
                  <button
                    onClick={() => setMostrarI2(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <GeradorI2 />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 