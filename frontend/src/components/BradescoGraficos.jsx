import React from 'react';

function GraficoPizza({ titulo, dados, cores = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'] }) {
  if (!dados || dados.length === 0) return null;

  const total = dados.reduce((sum, item) => sum + (item.valor || 0), 0);
  
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="font-semibold text-blue-900 mb-4 text-lg">{titulo}</h3>
      <div className="flex flex-col space-y-3">
        {dados.map((item, index) => {
          const percentual = total > 0 ? ((item.valor || 0) / total * 100).toFixed(1) : 0;
          return (
            <div key={index} className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: cores[index % cores.length] }}
              ></div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.nome}</span>
                  <span className="text-sm text-gray-500">{percentual}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${percentual}%`,
                      backgroundColor: cores[index % cores.length]
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  R$ {new Intl.NumberFormat('pt-BR').format(item.valor || 0)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GraficoBarras({ titulo, dados, cores = ['#3B82F6', '#EF4444'] }) {
  if (!dados || dados.length === 0) return null;

  const maxValor = Math.max(...dados.map(item => item.valor || 0));
  
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="font-semibold text-blue-900 mb-4 text-lg">{titulo}</h3>
      <div className="space-y-3">
        {dados.map((item, index) => {
          const percentual = maxValor > 0 ? ((item.valor || 0) / maxValor * 100) : 0;
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-24 text-sm text-gray-600 truncate">{item.nome}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">R$ {new Intl.NumberFormat('pt-BR').format(item.valor || 0)}</span>
                  <span className="text-xs text-gray-500">{item.quantidade || 0} trans.</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${percentual}%`,
                      backgroundColor: cores[index % cores.length]
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardMetrica({ titulo, valor, subtitulo = '', cor = 'blue', icone = null }) {
  return (
    <div className={`bg-${cor}-50 rounded-lg p-4 border border-${cor}-100`}>
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-${cor}-600 text-sm font-medium`}>{titulo}</span>
          <div className={`text-lg font-bold text-${cor}-800`}>{valor}</div>
          {subtitulo && <span className="text-xs text-gray-500">{subtitulo}</span>}
        </div>
        {icone && <div className={`text-${cor}-400 text-2xl`}>{icone}</div>}
      </div>
    </div>
  );
}

function BradescoGraficos({ dados }) {
  if (!dados) return null;

  const { creditos, debitos, resumo_financeiro, locais_depositos } = dados;

  // Preparar dados para gráficos
  const dadosDepositos = creditos?.depositos ? [
    { nome: 'Cheques', valor: creditos.depositos.cheque?.valor || 0 },
    { nome: 'Espécie', valor: creditos.depositos.especie?.valor || 0 }
  ].filter(item => item.valor > 0) : [];

  const dadosTransferencias = creditos?.transferencias ? [
    { nome: 'TED/DOC/PIX', valor: creditos.transferencias.total || 0 }
  ].filter(item => item.valor > 0) : [];

  const dadosPagamentos = debitos?.pagamentos ? [
    { nome: 'Pagamentos', valor: debitos.pagamentos.total || 0 },
    { nome: 'Cobrança', valor: debitos.pagamentos.cobranca || 0 }
  ].filter(item => item.valor > 0) : [];

  // Top depositantes e favorecidos
  const topDepositantes = creditos?.principais_depositantes?.slice(0, 5) || [];
  const topFavorecidos = debitos?.principais_favorecidos?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardMetrica 
          titulo="Total Créditos" 
          valor={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(creditos?.total || 0)}
          cor="green"
          icone="💳"
        />
        <CardMetrica 
          titulo="Total Débitos" 
          valor={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(debitos?.total || 0)}
          cor="red"
          icone="💸"
        />
        <CardMetrica 
          titulo="Saldo" 
          valor={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo_financeiro?.saldo_periodo || 0)}
          cor={resumo_financeiro?.saldo_periodo >= 0 ? 'green' : 'red'}
          icone={resumo_financeiro?.saldo_periodo >= 0 ? "📈" : "📉"}
        />
        <CardMetrica 
          titulo="Mov. Diária Média" 
          valor={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo_financeiro?.movimentacao_diaria_media || 0)}
          cor="blue"
          icone="📊"
        />
      </div>

      {/* Gráficos de distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dadosDepositos.length > 0 && (
          <GraficoPizza 
            titulo="Distribuição de Depósitos" 
            dados={dadosDepositos}
            cores={['#10B981', '#F59E0B']}
          />
        )}
        
        {dadosTransferencias.length > 0 && (
          <GraficoPizza 
            titulo="Transferências" 
            dados={dadosTransferencias}
            cores={['#3B82F6']}
          />
        )}
      </div>

      {/* Gráficos de barras para principais operadores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {topDepositantes.length > 0 && (
          <GraficoBarras 
            titulo="Principais Depositantes" 
            dados={topDepositantes}
            cores={['#10B981']}
          />
        )}
        
        {topFavorecidos.length > 0 && (
          <GraficoBarras 
            titulo="Principais Favorecidos" 
            dados={topFavorecidos}
            cores={['#EF4444']}
          />
        )}
      </div>

      {/* Mapa de calor de localidades */}
      {locais_depositos && locais_depositos.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-blue-900 mb-4 text-lg">📍 Locais de Depósitos</h3>
          <div className="flex flex-wrap gap-2">
            {locais_depositos.map((local, index) => (
              <span 
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {local}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Indicadores de risco visuais */}
      {resumo_financeiro?.indicadores_risco?.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-red-700 mb-4 text-lg">⚠️ Indicadores de Risco</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resumo_financeiro.indicadores_risco.map((indicador, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700 text-sm">{indicador}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BradescoGraficos; 