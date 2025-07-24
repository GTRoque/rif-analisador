import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TableComunicacoes({ comunicacoes }) {
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  const filtradas = comunicacoes.filter(c =>
    (c.banco || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.nome_envolvido || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.data || '').includes(busca)
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar por banco, envolvido ou data..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="mb-2 px-3 py-2 border rounded w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <div className="overflow-x-auto">
        <table className="w-full bg-white text-base">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Banco</th>
              <th className="px-4 py-2 border">Envolvido</th>
              <th className="px-4 py-2 border">Data</th>
              <th className="px-4 py-2 border">Valor</th>
              <th className="px-4 py-2 border">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map(c => (
              <tr key={c.id} className="hover:bg-blue-50">
                <td className="px-4 py-2 border">{c.banco}</td>
                <td className="px-4 py-2 border">{c.nome_envolvido}</td>
                <td className="px-4 py-2 border">{c.data}</td>
                <td className="px-4 py-2 border">R$ {c.valor?.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-2 border">
                  <button onClick={() => navigate(`/comunicacao/${c.id}`)} className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 transition">Detalhes</button>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr><td colSpan={5} className="text-center py-4 text-gray-500">Nenhuma comunicação encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 