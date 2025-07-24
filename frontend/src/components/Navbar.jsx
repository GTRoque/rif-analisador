import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const usuario = localStorage.getItem('usuario');

  function logout() {
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  return (
    <nav className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between rounded mb-8">
      <div className="font-bold text-lg cursor-pointer" onClick={() => navigate('/dashboard')}>RIF Analisador</div>
      <div className="flex gap-4 items-center">
        <button onClick={() => navigate('/upload')} className="hover:underline">Upload</button>
        <span className="text-sm">{usuario}</span>
        <button onClick={logout} className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-800 transition">Sair</button>
      </div>
    </nav>
  );
} 