import React from 'react';

function formatarValor(valor) {
  if (!valor || valor === 0) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

function formatarData(data) {
  if (!data) return '-';
  return data.replace(/\./g, '/');
}

function Card({ title, value, subtitle = '', color = 'blue', icon = null }) {
  return (
    <div className={`bg-${color}-50 rounded-lg p-4 border border-${color}-100`}>
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-${color}-600 text-sm font-medium`}>{title}</span>
          <div className={`text-lg font-bold text-${color}-800`}>{value}</div>
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
        {icon && <div className={`text-${color}-400 text-2xl`}>{icon}</div>}
      </div>
    </div>
  );
}

function Tabela({ titulo, dados, colunas }) {
  if (!dados || !Array.isArray(dados) || dados.length === 0) return null;
  
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-blue-900 mb-3 text-lg">{titulo}</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              {colunas.map((col, i) => (
                <th key={i} className={`px-4 py-3 text-left font-medium text-gray-700 ${col.width || ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                {colunas.map((col, i) => (
                  <td key={i} className={`px-4 py-3 ${col.width || ''}`}>
                    {col.key === 'valor' 
                      ? formatarValor(item[col.key])
                      : item[col.key] || '-'
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BradescoParser({ dados }) {
  if (!dados) return null;

  const {
    renda_mensal,
    faturamento_mensal,
    periodo,
    creditos,
    debitos,
    boletos,
    vinculos_empresariais,
    atividades_suspeitas,
    resumo_financeiro,
    possiveis_crimes,
    locais_depositos,
    notas,
    informacoes_finais
  } = dados;

  const rendaOuFaturamento = renda_mensal || faturamento_mensal;
  const tipoRenda = renda_mensal ? 'Renda Mensal' : 'Faturamento Mensal';

  return (
    <div className="space-y-6">
      {/* Cabeçalho com informações básicas */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Análise Bradesco</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card 
            title={tipoRenda}
            value={formatarValor(rendaOuFaturamento)}
            color="green"
          />
          <Card 
            title="Período Analisado"
            value={periodo ? `${formatarData(periodo.inicio)} - ${formatarData(periodo.fim)}` : '-'}
            color="blue"
          />
          <Card 
            title="Saldo do Período"
            value={formatarValor(resumo_financeiro?.saldo_periodo)}
            color={resumo_financeiro?.saldo_periodo >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* Indicadores de Risco */}
        {resumo_financeiro?.indicadores_risco?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-red-700 mb-3 text-lg">⚠️ Indicadores de Risco</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {resumo_financeiro.indicadores_risco.map((indicador, idx) => (
                <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <span className="text-red-700 text-sm">• {indicador}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Análise Financeira */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-blue-900 mb-4 text-xl">Análise Financeira</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Créditos */}
          <div>
            <h4 className="font-semibold text-green-700 mb-3">💳 Créditos</h4>
            <div className="space-y-3">
              <Card title="Total" value={formatarValor(creditos?.total)} color="green" />
              <Card title="Depósitos" value={formatarValor(creditos?.depositos?.total)} subtitle={`${creditos?.depositos?.quantidade || 0} transações`} color="green" />
              <Card title="Transferências" value={formatarValor(creditos?.transferencias?.total)} subtitle={`${creditos?.transferencias?.quantidade || 0} transações`} color="green" />
            </div>
          </div>

          {/* Débitos */}
          <div>
            <h4 className="font-semibold text-red-700 mb-3">💸 Débitos</h4>
            <div className="space-y-3">
              <Card title="Total" value={formatarValor(debitos?.total)} color="red" />
              <Card title="Pagamentos" value={formatarValor(debitos?.pagamentos?.total)} subtitle={`${debitos?.pagamentos?.quantidade || 0} transações`} color="red" />
              <Card title="Transferências" value={formatarValor(debitos?.transferencias?.total)} subtitle={`${debitos?.transferencias?.quantidade || 0} transações`} color="red" />
            </div>
          </div>
        </div>

        {/* Detalhamento de Depósitos */}
        {creditos?.depositos && (
          <div className="mt-6">
            <h4 className="font-semibold text-blue-700 mb-3">📊 Detalhamento de Depósitos</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                title="Cheques" 
                value={formatarValor(creditos.depositos.cheque?.valor)} 
                subtitle={`${creditos.depositos.cheque?.quantidade || 0} transações`}
                color="blue" 
              />
              <Card 
                title="Espécie" 
                value={formatarValor(creditos.depositos.especie?.valor)} 
                subtitle={`${creditos.depositos.especie?.quantidade || 0} transações`}
                color="blue" 
              />
              <Card 
                title="Locais" 
                value={`${locais_depositos?.length || 0} cidades`} 
                subtitle={locais_depositos?.join(', ') || '-'}
                color="blue" 
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabelas de Principais Operadores */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-blue-900 mb-4 text-xl">Principais Operadores</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Principais Remetentes */}
          <Tabela
            titulo="Principais Remetentes"
            dados={creditos?.principais_depositantes || []}
            colunas={[
              { key: 'valor', label: 'Valor', width: 'w-24' },
              { key: 'quantidade', label: 'Qtd', width: 'w-16' },
              { key: 'nome', label: 'Nome' },
              { key: 'cpf_cnpj', label: 'CPF/CNPJ', width: 'w-32' }
            ]}
          />

          {/* Principais Favorecidos */}
          <Tabela
            titulo="Principais Favorecidos"
            dados={debitos?.principais_favorecidos || []}
            colunas={[
              { key: 'valor', label: 'Valor', width: 'w-24' },
              { key: 'quantidade', label: 'Qtd', width: 'w-16' },
              { key: 'nome', label: 'Nome' },
              { key: 'cpf_cnpj', label: 'CPF/CNPJ', width: 'w-32' }
            ]}
          />
        </div>
      </div>

      {/* Boletos */}
      {boletos && boletos.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <Tabela
            titulo="Boletos Pagos"
            dados={boletos}
            colunas={[
              { key: 'valor', label: 'Valor', width: 'w-24' },
              { key: 'quantidade', label: 'Qtd', width: 'w-16' },
              { key: 'nome_sacado', label: 'Sacado' },
              { key: 'cpf_cnpj_sacado', label: 'CPF/CNPJ Sacado', width: 'w-32' }
            ]}
          />
        </div>
      )}

      {/* Vínculos e Atividades Suspeitas */}
      {(vinculos_empresariais?.length > 0 || atividades_suspeitas?.length > 0 || possiveis_crimes?.length > 0) && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-red-700 mb-4 text-xl">🚨 Análise de Risco</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vínculos Empresariais */}
            {vinculos_empresariais?.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-700 mb-3">🏢 Vínculos Empresariais</h4>
                <div className="space-y-2">
                  {vinculos_empresariais.map((vinculo, idx) => (
                    <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <span className="text-orange-700 text-sm">• {vinculo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Atividades Suspeitas */}
            {atividades_suspeitas?.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 mb-3">⚠️ Atividades Suspeitas</h4>
                <div className="space-y-2">
                  {atividades_suspeitas.map((atividade, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <span className="text-red-700 text-sm">• {atividade}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Possíveis Crimes */}
          {possiveis_crimes?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-red-700 mb-3">🚨 Crimes Detectados</h4>
              <div className="flex flex-wrap gap-2">
                {possiveis_crimes.map((crime, idx) => (
                  <span key={idx} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                    {crime}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notas e Informações Finais */}
      {(notas?.length > 0 || informacoes_finais?.length > 0) && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-blue-900 mb-4 text-xl">📝 Informações Adicionais</h3>
          
          <div className="space-y-4">
            {/* Notas */}
            {notas?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Notas:</h4>
                <div className="space-y-2">
                  {notas.map((nota, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <span className="text-gray-700 text-sm">• {nota}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informações Finais */}
            {informacoes_finais?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Conclusões:</h4>
                <div className="space-y-2">
                  {informacoes_finais.map((info, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <span className="text-blue-700 text-sm">{info}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BradescoParser; 