import React from 'react';

const LocalizacaoMapa = ({ localizacao }) => {
  // Verificar se temos dados de localização válidos
  if (!localizacao || !localizacao.cidade || !localizacao.uf) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <p className="text-gray-500">📍 Localização não disponível</p>
      </div>
    );
  }

  const { cidade, uf } = localizacao;
  const cidadeUF = `${cidade}, ${uf}`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          📍 Localização da Agência
        </h3>
        <p className="text-sm text-gray-600 mt-1">{cidadeUF}</p>
      </div>
      
      <div className="p-4 bg-blue-50">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">🏢</div>
            <div className="text-sm text-gray-600">
              Agência localizada em <strong>{cidade}</strong>, <strong>{uf}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalizacaoMapa; 