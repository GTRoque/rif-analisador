import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LocalizacaoMapa from '../components/LocalizacaoMapa';
import BradescoParser from '../components/BradescoParser';
import BradescoGraficos from '../components/BradescoGraficos';

function Card({ title, value, color = 'blue' }) {
  return (
    <div className={`bg-${color}-50 rounded-lg p-4 flex flex-col items-start border border-${color}-100 w-full`}>
      <span className={`text-${color}-600 text-sm mb-1`}>{title}</span>
      <span className={`text-lg font-bold text-${color}-800`}>{value}</span>
    </div>
  );
}

function formatarValor(valor) {
  if (!valor || valor === '0' || valor === 'undefined') return '0,00';
  
  // Converter para string e limpar
  let valorStr = valor.toString().trim();
  
  // Se já está no formato brasileiro (com vírgula), apenas formatar
  if (valorStr.includes(',')) {
    // Remover pontos de milhares existentes e adicionar novamente
    valorStr = valorStr.replace(/\./g, '').replace(',', '.');
    const numero = parseFloat(valorStr);
    if (isNaN(numero)) return '0,00';
    return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  // Se está no formato americano (com ponto), converter
  const numero = parseFloat(valorStr);
  if (isNaN(numero)) return '0,00';
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Tabela({ titulo, dados, colunas }) {
  if (!dados || !Array.isArray(dados) || dados.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-blue-900 mb-2 text-lg">{titulo}</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full bg-gray-50 rounded text-sm min-w-[600px]">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {colunas.map((col, i) => (
                <th key={i} className={`px-3 py-2 text-left ${col.width || ''}`}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                {colunas.map((col, i) => (
                  <td key={i} className={`px-3 py-2 whitespace-nowrap ${col.width || ''}`}>
                    {col.key === 'valor'
                      ? Number(item[col.key] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : item[col.key]}
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

export default function DetalheComunicacao() {
  const { id } = useParams();
  const [comunicacao, setComunicacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('detalhes'); // 'detalhes' ou 'graficos'
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDetalhe() {
      setLoading(true);
      setErro('');
      try {
        const resp = await fetch(`http://10.9.182.21:8080/api/comunicacao/${id}`);
        if (!resp.ok) throw new Error('Não encontrado');
        const data = await resp.json();
        setComunicacao(data);
      } catch (err) {
        setErro('Erro ao buscar detalhes da comunicação.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetalhe();
  }, [id]);

  const json = comunicacao?.parsing_json || {};
  const banco = (comunicacao?.banco || '').toLowerCase();
  const codigoSegmento = comunicacao?.codigo_segmento;

  // Renderização específica para Bradesco (segmento 41)
  if (banco.includes('bradesco') && codigoSegmento === "41") {
    return (
      <div className="min-h-screen bg-gradient-to-tl from-gray-600 via-gray-200 to-gray-100">
        <div className="w-full px-4 md:px-6 lg:px-8 pt-8">
          <Navbar />
          <button onClick={() => navigate(-1)} className="mb-4 text-blue-700 hover:underline">← Voltar</button>
          <h1 className="text-2xl font-bold text-blue-900 mb-4">Detalhes da Comunicação - Bradesco</h1>
          {loading && <div>Carregando...</div>}
          {erro && <div className="text-red-600 mb-4">{erro}</div>}
          {comunicacao && (
            <div className="space-y-6">
              {/* Cabeçalho básico */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="mb-4">
                  <div className="text-xl font-bold text-blue-900">{comunicacao.titular}</div>
                  <div className="text-gray-600 text-sm">CPF/CNPJ: {comunicacao.cpf}</div>
                  <div className="text-gray-600 text-sm">Banco: {comunicacao.banco}</div>
                  <div className="text-gray-600 text-sm">Segmento: {codigoSegmento}</div>
                </div>

                {/* Abas */}
                <div className="flex space-x-1 border-b border-gray-200">
                  <button
                    onClick={() => setAbaAtiva('detalhes')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      abaAtiva === 'detalhes'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📋 Detalhes
                  </button>
                  <button
                    onClick={() => setAbaAtiva('graficos')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      abaAtiva === 'graficos'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📊 Gráficos
                  </button>
                </div>
              </div>

              {/* Conteúdo das abas */}
              {abaAtiva === 'detalhes' ? (
                <BradescoParser dados={json} />
              ) : (
                <BradescoGraficos dados={json} />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderização específica para segmentos 42 e outros (SFN-Espécie e outros segmentos)
  if (codigoSegmento === "42" || (codigoSegmento && codigoSegmento !== "41")) {
    // Para segmentos 42+, os valores estão diretamente no json (campo_a, campo_b, etc.)
    const valores = {
      campo_a: json.campo_a,
      campo_b: json.campo_b,
      campo_c: json.campo_c,
      campo_d: json.campo_d,
      campo_e: json.campo_e
    };
    
    // Os significados vêm do backend na resposta da API
    const significados = comunicacao.significados || {};
    
    // Filtrar apenas campos com valores
    const camposComValores = [];
    const cores = ["green", "blue", "purple", "orange", "red"];
    
    Object.entries(valores).forEach(([campo, valor], index) => {
      // Verificar se o valor é válido (não vazio, não zero, não undefined)
      if (valor && 
          valor !== "0" && 
          valor !== "0,00" && 
          valor !== "undefined" && 
          valor !== "") {
        
        // Converter valor brasileiro para número para verificar se é maior que 0
        let valorNumerico = 0;
        try {
          const valorStr = valor.toString().trim();
          if (valorStr.includes(',')) {
            // Formato brasileiro: "50.000,00" -> 50000.00
            valorNumerico = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
          } else {
            // Formato americano: "50000.00" -> 50000.00
            valorNumerico = parseFloat(valorStr);
          }
        } catch (e) {
          valorNumerico = 0;
        }
        
        if (valorNumerico > 0) {
          camposComValores.push({
            campo,
            valor,
            significado: significados[campo] || campo.toUpperCase(),
            cor: cores[index]
          });
        }
      }
    });
    
    return (
      <div className="min-h-screen bg-gradient-to-tl from-gray-600 via-gray-200 to-gray-100">
        <div className="w-full px-4 md:px-6 lg:px-8 pt-8">
          <Navbar />
          <button onClick={() => navigate(-1)} className="mb-4 text-blue-700 hover:underline">← Voltar</button>
          <h1 className="text-2xl font-bold text-blue-900 mb-4">Detalhes da Comunicação</h1>
          {loading && <div>Carregando...</div>}
          {erro && <div className="text-red-600 mb-4">{erro}</div>}
          {comunicacao && (
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
              {/* Cabeçalho do titular */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-xl font-bold text-blue-900">{comunicacao.titular}</div>
                  <div className="text-gray-600 text-sm">CPF: {comunicacao.cpf}</div>
                  <div className="text-gray-600 text-sm">Comunicante: {comunicacao.banco}</div>
                  <div className="text-gray-600 text-sm">Tipo: {comunicacao.tipo}</div>
                </div>
                {camposComValores.length > 0 ? (
                  <div className="flex gap-4 flex-wrap">
                    {camposComValores.map(({ campo, valor, significado, cor }) => (
                      <Card 
                        key={campo}
                        title={significado} 
                        value={`R$ ${formatarValor(valor)}`} 
                        color={cor} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Nenhum valor específico disponível para este segmento.</div>
                )}
              </div>

              {/* Mapa de Localização */}
              {comunicacao.localizacao && (
                <div className="mb-6">
                  <LocalizacaoMapa localizacao={comunicacao.localizacao} />
                </div>
              )}

              {/* Informações adicionais */}
              {comunicacao.informacoes_adicionais && (
                <div className="mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2 text-lg">Informações Adicionais</h3>
                  <div className="text-gray-700 text-sm whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                    {comunicacao.informacoes_adicionais}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderização específica para Banco do Brasil
  if (banco.includes('banco do brasil') || banco.includes('bb')) {
    const creditos = json.creditos || {};
    const debitos = json.debitos || {};
    return (
      <div className="min-h-screen bg-gradient-to-tl from-gray-600 via-gray-200 to-gray-100">
        <div className="w-full px-4 md:px-6 lg:px-8 pt-8">
          <Navbar />
          <button onClick={() => navigate(-1)} className="mb-4 text-blue-700 hover:underline">← Voltar</button>
          <h1 className="text-2xl font-bold text-blue-900 mb-4">Detalhes da Comunicação</h1>
          {loading && <div>Carregando...</div>}
          {erro && <div className="text-red-600 mb-4">{erro}</div>}
          {comunicacao && (
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
              {/* Cabeçalho do titular */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-xl font-bold text-blue-900">{comunicacao.titular || json.titular}</div>
                  {json.cidade && <div className="text-gray-600 text-sm">Cidade: {json.cidade.split('.')[0].trim()}</div>}
                  {json.socio_diretor && <div className="text-gray-600 text-sm">Sócio/Dirigente: {json.socio_diretor.nome} (CNPJ/CPF: {json.socio_diretor.cpf_cnpj})</div>}
                  {json.renda_mensal && <div className="text-gray-600 text-sm">Renda mensal declarada: R$ {json.renda_mensal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>}
                  {json.periodo && <div className="text-gray-600 text-sm">Período analisado: {json.periodo.inicio} a {json.periodo.fim}</div>}
                </div>
                <div className="flex gap-4 flex-wrap">
                  <Card title="Total de Créditos" value={`R$ ${creditos.total?.toLocaleString('pt-BR', {minimumFractionDigits:2})}`} color="green" />
                  <Card title="Total de Débitos" value={`R$ ${debitos.total?.toLocaleString('pt-BR', {minimumFractionDigits:2})}`} color="red" />
                </div>
              </div>

              {/* Tabela de tipos de crédito */}
              <Tabela
                titulo="Tipos de Lançamentos a Crédito"
                dados={creditos.tipos}
                colunas={[
                  { key: 'tipo', label: 'Tipo' },
                  { key: 'quantidade', label: 'Qtde' },
                  { key: 'valor', label: 'Valor (R$)' },
                ]}
              />
              {/* Principais remetentes/depositantes */}
              <Tabela
                titulo="Principais Remetentes/Depositantes"
                dados={creditos.principais_depositantes}
                colunas={[
                  { key: 'nome', label: 'Nome', width: 'w-2/5' },
                  { key: 'cpf_cnpj', label: 'CPF/CNPJ', width: 'w-1/4' },
                  { key: 'quantidade', label: 'Qtde', width: 'w-1/6' },
                  { key: 'valor', label: 'Valor (R$)', width: 'w-1/6' },
                ]}
              />
              {/* Tabela de tipos de débito */}
              <Tabela
                titulo="Tipos de Lançamentos a Débito"
                dados={debitos.tipos}
                colunas={[
                  { key: 'tipo', label: 'Tipo' },
                  { key: 'quantidade', label: 'Qtde' },
                  { key: 'valor', label: 'Valor (R$)' },
                ]}
              />
              {/* Principais destinatários */}
              <Tabela
                titulo="Principais Destinatários de Recursos"
                dados={debitos.principais_destinatarios}
                colunas={[
                  { key: 'nome', label: 'Nome', width: 'w-2/5' },
                  { key: 'cpf_cnpj', label: 'CPF/CNPJ', width: 'w-1/4' },
                  { key: 'quantidade', label: 'Qtde', width: 'w-1/6' },
                  { key: 'valor', label: 'Valor (R$)', width: 'w-1/6' },
                ]}
              />
              {/* Notas */}
              {json.notas && json.notas.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2 text-lg">Notas</h3>
                  <ul className="list-disc pl-6 text-gray-700 text-sm">
                    {json.notas.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                </div>
              )}
              {/* Mapa de Localização */}
              {comunicacao.localizacao && (
                <div className="mb-6">
                  <LocalizacaoMapa localizacao={comunicacao.localizacao} />
                </div>
              )}

              {/* Informações finais */}
              {json.informacoes_finais && json.informacoes_finais.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2 text-lg">Informações Finais</h3>
                  <div className="text-gray-700 text-sm whitespace-pre-line">{json.informacoes_finais.join('\n')}</div>
                </div>
              )}
              {/* Possíveis crimes */}
              {json.possiveis_crimes && json.possiveis_crimes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-red-700 mb-2 text-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-700"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 4.5h.008v.008H12v-.008zm9-4.5A9 9 0 11 3 12a9 9 0 0118 0z" /></svg>
                    Possíveis Crimes/Irregularidades Identificados
                  </h3>
                  <ul className="list-disc pl-6 text-red-700 text-sm">
                    {json.possiveis_crimes.map((crime, i) => <li key={i}>{crime}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderização padrão para Bradesco e outros bancos
  const creditos = json.creditos || {};
  const debitos = json.debitos || {};
  const boletos = json.boletos || [];
  const notas = json.notas || [];
  const locais = json.locais_depositos || [];
  const infoFinais = json.informacoes_finais || [];
  const conjuge = json.conjuge;
  const periodo = json.periodo;

  return (
    <div className="min-h-screen bg-gradient-to-tl from-gray-600 via-gray-200 to-gray-100">
      <div className="w-full px-4 md:px-6 lg:px-8 pt-8">
        <Navbar />
        <button onClick={() => navigate(-1)} className="mb-4 text-blue-700 hover:underline">← Voltar</button>
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Detalhes da Comunicação</h1>
        {loading && <div>Carregando...</div>}
        {erro && <div className="text-red-600 mb-4">{erro}</div>}
        {comunicacao && (
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            {/* Cabeçalho do titular */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-xl font-bold text-blue-900">{comunicacao.titular}</div>
                <div className="text-gray-600 text-sm">CPF: {comunicacao.cpf}</div>
                <div className="text-gray-600 text-sm">Comunicante: {comunicacao.banco}</div>
                {conjuge && (
                  <div className="text-gray-600 text-sm">Cônjuge: {conjuge.nome} (CPF: {conjuge.cpf})</div>
                )}
                {json.renda_mensal && (
                  <div className="text-gray-600 text-sm">Renda mensal declarada: R$ {json.renda_mensal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
                )}
                {periodo && (
                  <div className="text-gray-600 text-sm">Período analisado: {periodo.inicio} a {periodo.fim}</div>
                )}
              </div>
              <div className="flex gap-4 flex-wrap">
                <Card title="Total de Créditos" value={`R$ ${creditos.total?.toLocaleString('pt-BR', {minimumFractionDigits:2})}`} color="green" />
                <Card title="Total de Débitos" value={`R$ ${debitos.total?.toLocaleString('pt-BR', {minimumFractionDigits:2})}`} color="red" />
              </div>
            </div>

            {/* Mapa de Localização */}
            {comunicacao.localizacao && (
              <div className="mb-6">
                <LocalizacaoMapa localizacao={comunicacao.localizacao} />
              </div>
            )}

            {/* Locais das transações */}
            {locais.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-blue-900 mb-2 text-lg flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-700"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.5-7.5 11.25-7.5 11.25S4.5 18 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  Locais dos Depósitos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {locais.map((l, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Tabelas principais */}
            <Tabela
              titulo="Principais Depositantes/Remetentes"
              dados={creditos.principais_depositantes}
              colunas={[
                { key: 'nome', label: 'Nome' },
                { key: 'cpf_cnpj', label: 'CPF/CNPJ' },
                { key: 'valor', label: 'Valor (R$)' },
                { key: 'quantidade', label: 'Qtde' },
              ]}
            />
            <Tabela
              titulo="Principais Favorecidos"
              dados={debitos.principais_favorecidos}
              colunas={[
                { key: 'nome', label: 'Nome' },
                { key: 'cpf_cnpj', label: 'CPF/CNPJ' },
                { key: 'valor', label: 'Valor (R$)' },
                { key: 'quantidade', label: 'Qtde' },
              ]}
            />
            <Tabela
              titulo="Pagamentos de Boletos"
              dados={boletos}
              colunas={[
                { key: 'nome_sacado', label: 'Nome Sacado' },
                { key: 'cpf_cnpj_sacado', label: 'CPF/CNPJ Sacado' },
                { key: 'valor', label: 'Valor (R$)' },
                { key: 'quantidade', label: 'Qtde' },
              ]}
            />

            {/* Notas */}
            {notas.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-blue-900 mb-2 text-lg">Notas</h3>
                <ul className="list-disc pl-6 text-gray-700 text-sm">
                  {notas.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            )}

            {/* Informações finais */}
            {infoFinais.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-blue-900 mb-2 text-lg">Informações Finais</h3>
                <div className="text-gray-700 text-sm whitespace-pre-line">{infoFinais.join('\n')}</div>
              </div>
            )}
            {/* Possíveis crimes */}
            {json.possiveis_crimes && json.possiveis_crimes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-red-700 mb-2 text-lg flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-700"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 4.5h.008v.008H12v-.008zm9-4.5A9 9 0 11 3 12a9 9 0 0118 0z" /></svg>
                  Possíveis Crimes/Irregularidades Identificados
                </h3>
                <ul className="list-disc pl-6 text-red-700 text-sm">
                  {json.possiveis_crimes.map((crime, i) => <li key={i}>{crime}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 