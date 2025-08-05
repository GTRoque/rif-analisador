import React from 'react';

function CardEstatistica({ titulo, valor, subtitulo = '', cor = 'blue', icone = null }) {
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

function BradescoResumo({ comunicacoes }) {
  if (!comunicacoes || comunicacoes.length === 0) return null;

  // Filtrar apenas comunicações do Bradesco
  const bradescoComunicacoes = comunicacoes.filter(c => 
    c.banco && c.banco.toLowerCase().includes('bradesco')
  );

  if (bradescoComunicacoes.length === 0) return null;

  // Calcular estatísticas
  const totalComunicacoes = bradescoComunicacoes.length;
  
  let totalCreditos = 0;
  let totalDebitos = 0;
  let totalRenda = 0;
  let totalFaturamento = 0;
  let comunicacoesComRisco = 0;
  let comunicacoesComCrimes = 0;
  let totalDepositosEspecie = 0;
  let totalLocais = 0;

  bradescoComunicacoes.forEach(comunicacao => {
    const json = comunicacao.parsing_json || {};
    
    // Valores financeiros
    totalCreditos += json.creditos?.total || 0;
    totalDebitos += json.debitos?.total || 0;
    totalRenda += json.renda_mensal || 0;
    totalFaturamento += json.faturamento_mensal || 0;
    
    // Depósitos em espécie
    totalDepositosEspecie += json.creditos?.depositos?.especie?.valor || 0;
    
    // Locais de depósitos
    if (json.locais_depositos) {
      totalLocais += json.locais_depositos.length;
    }
    
    // Indicadores de risco
    if (json.resumo_financeiro?.indicadores_risco?.length > 0) {
      comunicacoesComRisco++;
    }
    
    // Crimes detectados
    if (json.possiveis_crimes?.length > 0) {
      comunicacoesComCrimes++;
    }
  });

  const saldoTotal = totalCreditos - totalDebitos;
  const rendaOuFaturamento = totalRenda + totalFaturamento;
  const mediaLocais = totalComunicacoes > 0 ? (totalLocais / totalComunicacoes).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
      <h2 className="text-xl font-bold text-blue-900 mb-4">📊 Resumo Bradesco</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardEstatistica 
          titulo="Comunicações"
          valor={totalComunicacoes}
          subtitulo="Total analisadas"
          cor="blue"
          icone="📋"
        />
        
        <CardEstatistica 
          titulo="Volume Total"
          valor={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCreditos + totalDebitos)}
          subtitulo="Créditos + Débitos"
          cor="green"
          icone="💰"
        />
        
        <CardEstatistica 
          titulo="Saldo"
          valor={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoTotal)}
          subtitulo="Créditos - Débitos"
          cor={saldoTotal >= 0 ? 'green' : 'red'}
          icone={saldoTotal >= 0 ? "📈" : "📉"}
        />
        
        <CardEstatistica 
          titulo="Renda/Faturamento"
          valor={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rendaOuFaturamento)}
          subtitulo="Total declarado"
          cor="purple"
          icone="💼"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <CardEstatistica 
          titulo="Depósitos Espécie"
          valor={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDepositosEspecie)}
          subtitulo="Total em espécie"
          cor="orange"
          icone="💵"
        />
        
        <CardEstatistica 
          titulo="Locais Média"
          valor={mediaLocais}
          subtitulo="Por comunicação"
          cor="indigo"
          icone="📍"
        />
        
        <CardEstatistica 
          titulo="Com Risco"
          valor={comunicacoesComRisco}
          subtitulo={`${((comunicacoesComRisco / totalComunicacoes) * 100).toFixed(1)}% do total`}
          cor="red"
          icone="⚠️"
        />
        
        <CardEstatistica 
          titulo="Com Crimes"
          valor={comunicacoesComCrimes}
          subtitulo={`${((comunicacoesComCrimes / totalComunicacoes) * 100).toFixed(1)}% do total`}
          cor="red"
          icone="🚨"
        />
      </div>

      {/* Gráfico de distribuição de risco */}
      {comunicacoesComRisco > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">Distribuição de Risco</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Com risco</span>
                <span className="text-gray-600">{comunicacoesComRisco}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(comunicacoesComRisco / totalComunicacoes) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Sem risco</span>
                <span className="text-gray-600">{totalComunicacoes - comunicacoesComRisco}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${((totalComunicacoes - comunicacoesComRisco) / totalComunicacoes) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BradescoResumo; 