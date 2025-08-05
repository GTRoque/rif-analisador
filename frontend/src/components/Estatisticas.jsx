import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

export default function Estatisticas() {
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function fetchEstatisticas() {
      setLoading(true);
      setErro('');
      try {
        const data = await apiService.getEstatisticas();
        setEstatisticas(data);
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        setErro('Erro ao buscar estatísticas.');
      } finally {
        setLoading(false);
      }
    }
    fetchEstatisticas();
  }, []);

  if (loading) return <div className="text-center py-4">Carregando estatísticas...</div>;
  if (erro) return <div className="text-red-600 text-center py-4">{erro}</div>;
  if (!estatisticas) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 w-full mb-6">
      <h2 className="text-xl font-bold mb-4 text-blue-900">Estatísticas Detalhadas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="text-blue-600 text-sm mb-1">Total de Comunicações</div>
          <div className="text-2xl font-bold text-blue-900">{estatisticas.total_comunicacoes}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="text-green-600 text-sm mb-1">Volume Total</div>
          <div className="text-2xl font-bold text-green-900">
            R$ {estatisticas.total_valor?.toLocaleString('pt-BR')}
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="text-purple-600 text-sm mb-1">Valor Médio</div>
          <div className="text-2xl font-bold text-purple-900">
            R$ {estatisticas.media_valor?.toLocaleString('pt-BR')}
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
          <div className="text-orange-600 text-sm mb-1">Bancos Diferentes</div>
          <div className="text-2xl font-bold text-orange-900">
            {Object.keys(estatisticas.bancos || {}).length}
          </div>
        </div>
      </div>

      {estatisticas.bancos && Object.keys(estatisticas.bancos).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Distribuição por Banco</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-semibold">Banco</th>
                  <th className="px-4 py-2 text-left font-semibold">Comunicações</th>
                  <th className="px-4 py-2 text-left font-semibold">Volume Total</th>
                  <th className="px-4 py-2 text-left font-semibold">% do Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(estatisticas.bancos).map(([banco, dados], idx) => (
                  <tr key={banco} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 font-medium">{banco}</td>
                    <td className="px-4 py-2">{dados.count}</td>
                    <td className="px-4 py-2">
                      R$ {dados.valor_total?.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2">
                      {estatisticas.total_valor > 0 
                        ? ((dados.valor_total / estatisticas.total_valor) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 