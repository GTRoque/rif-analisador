import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoLab from '../assets/logo_labld.png';
import logoPCRN from '../assets/logo_pcrn.png';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('usuario', usuario);
      formData.append('senha', senha);
      const resp = await fetch('http://10.9.182.21:8080/login', {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();
      if (data.success) {
        localStorage.setItem('usuario', usuario);
        navigate('/upload');
      } else {
        setErro(data.erro || 'Usuário ou senha inválidos.');
      }
    } catch (err) {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tl from-gray-600 via-gray-200 to-gray-100">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg flex overflow-hidden">
        {/* Painel esquerdo com gradiente azul e logos */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-blue-800 via-blue-600 to-blue-400 p-8 relative">
          <img src={logoLab} alt="Logo LAB" className="w-24 mb-6 drop-shadow-lg" />
          <img src={logoPCRN} alt="Logo PCRN" className="w-20 mb-2 drop-shadow-lg" />
          <h2 className="text-white text-2xl font-bold mt-4 mb-2 text-center">Bem-vindo ao RIF Analisador</h2>
          <p className="text-blue-100 text-center text-sm">Sistema de análise de Relatórios de Investigação Financeira<br/>Polícia Civil do RN</p>
        </div>
        {/* Painel direito com formulário */}
        <div className="flex-1 flex flex-col justify-center p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-2 text-center">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Usuário</label>
              <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} required className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50" />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50" />
            </div>
            {erro && <div className="text-red-600 text-sm">{erro}</div>}
            <button type="submit" disabled={loading} className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition disabled:opacity-50 mt-2">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 