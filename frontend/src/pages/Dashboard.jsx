import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [comunicacoes, setComunicacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDados() {
      setLoading(true);
      setErro('');
      try {
        const r1 = await fetch('http://10.9.182.21:8080/api/dashboard-resumo');
        const r2 = await fetch('http://10.9.182.21:8080/api/comunicacoes');
        const resumoData = await r1.json();
        const comunicacoesData = await r2.json();
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
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-tl from-gray-600 via-gray-200 to-gray-100">
      <div className="w-full max-w-6xl mx-auto pt-8 px-2 md:px-6">
        <Navbar />
        <h1 className="text-3xl font-bold text-blue-900 mb-4 mt-2">Dashboard</h1>
        {loading && <div>Carregando...</div>}
        {erro && <div className="text-red-600 mb-4">{erro}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 w-full">
          <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-start justify-center border border-gray-100 w-full">
            <div className="text-gray-500 text-base mb-1">Volume Analisado</div>
            <div className="text-2xl font-bold text-blue-900">R$ {somaValores.toLocaleString('pt-BR')}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-start justify-center border border-gray-100 w-full">
            <div className="text-gray-500 text-base mb-1">Comunicações</div>
            <div className="text-2xl font-bold text-blue-900">{resumo?.num_comunicacoes}</div>
          </div>
        </div>
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
      </div>
    </div>
  );
} 