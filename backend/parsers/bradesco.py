import re
from collections import defaultdict

def limpa_valor(valor_str):
    try:
        if not valor_str:
            return 0.0
        # Garantir que é string
        valor_str = str(valor_str)
        # Remover underscores e outros caracteres especiais
        valor_str = valor_str.replace('_', '').replace(' ', '')
        v = float(valor_str.replace('.', '').replace(',', '.').rstrip('.'))
        if v != v:  # NaN check
            return 0.0
        return v
    except Exception:
        return 0.0

def extrai_tabela(texto, padrao):
    linhas = []
    for m in re.finditer(padrao, texto):
        valor = limpa_valor(m.group(1))
        qtde = f"{int(m.group(2)):02d}"
        nome = m.group(3).strip()
        cpf_cnpj = m.group(4).strip()
        linhas.append({'valor': valor, 'quantidade': qtde, 'nome': nome, 'cpf_cnpj': cpf_cnpj})
    return linhas

def parse_bradesco(texto):
    # Normalizar o texto (remover quebras de linha extras e espaços múltiplos)
    texto = re.sub(r'\s+', ' ', texto).strip()
    
    resultado = {
        'titular': None,
        'conjuge': None,
        'renda_mensal': None,
        'faturamento_mensal': None,
        'periodo': None,
        'creditos': {
            'total': 0.0,
            'depositos': {'total': 0.0, 'quantidade': 0, 'locais': [], 'cheque': {'valor': 0.0, 'quantidade': 0}, 'especie': {'valor': 0.0, 'quantidade': 0}},
            'transferencias': {'total': 0.0, 'quantidade': 0, 'tipos': {'TED': 0, 'DOC': 0, 'PIX': 0, 'OUTROS': 0}},
            'principais_depositantes': []
        },
        'debitos': {
            'total': 0.0,
            'pagamentos': {'total': 0.0, 'quantidade': 0, 'cobranca': 0.0},
            'transferencias': {'total': 0.0, 'quantidade': 0, 'tipos': {'TED': 0, 'DOC': 0, 'PIX': 0, 'OUTROS': 0}},
            'principais_favorecidos': []
        },
        'boletos': [],
        'notas': [],
        'locais_depositos': [],
        'informacoes_finais': [],
        'possiveis_crimes': [],
        'vinculos_empresariais': [],
        'atividades_suspeitas': [],
        'resumo_financeiro': {
            'saldo_periodo': 0.0,
            'movimentacao_diaria_media': 0.0,
            'incompatibilidade_renda': False,
            'indicadores_risco': []
        }
    }

    # Cônjuge
    m = re.search(r'cônjuge,\s*([\w\s\.\-]+),\s*CPF\s*([\d\-\.]+)', texto, re.IGNORECASE)
    if m:
        resultado['conjuge'] = {'nome': m.group(1).strip(), 'cpf': m.group(2).strip()}

    # Renda mensal (pessoas físicas) - padrão mais flexível
    m = re.search(r'renda mensal de R\$\s*([\d\.,]+)', texto, re.IGNORECASE)
    if m:
        resultado['renda_mensal'] = limpa_valor(m.group(1))

    # Faturamento mensal (empresas) - padrão mais flexível
    m = re.search(r'faturamento (?:médio )?mensal de R\$\s*([\d\.,]+)', texto, re.IGNORECASE)
    if m:
        resultado['faturamento_mensal'] = limpa_valor(m.group(1))

    # Período - padrão mais flexível
    m = re.search(r'Entre (\d{2}\.\d{2}\.\d{4}) e (\d{2}\.\d{2}\.\d{4})', texto)
    if m:
        resultado['periodo'] = {'inicio': m.group(1), 'fim': m.group(2)}

    # Créditos totais - padrão mais flexível
    m = re.search(r'os créditos somaram R\$\s*([\d\.,]+)', texto)
    if m:
        resultado['creditos']['total'] = limpa_valor(m.group(1))

    # Detalhamento depósitos - múltiplos padrões para diferentes formatos
    # Padrão 1: formato original
    m = re.search(r'sendo R\$ ([\d\.,]+) por meio de (\d+) depósitos realizados nas praças de ([^,]+(?:, [^,]+)*),? destes, R\$ ([\d\.,]+) depositados em cheques, (\d+) transações', texto)
    if m:
        resultado['creditos']['depositos']['total'] = limpa_valor(m.group(1))
        resultado['creditos']['depositos']['quantidade'] = int(m.group(2))
        locais = [l.strip() for l in m.group(3).split(',')]
        resultado['creditos']['depositos']['locais'] = locais
        resultado['locais_depositos'] = locais
        resultado['creditos']['depositos']['cheque']['valor'] = limpa_valor(m.group(4))
        resultado['creditos']['depositos']['cheque']['quantidade'] = int(m.group(5))
    
    # Padrão 2: formato simplificado (novo modelo)
    if resultado['creditos']['depositos']['total'] == 0:
        m = re.search(r'sendo R\$ ([\d\.,]+) por meio de (\d+) depósitos realizados nas praças de ([^,]+(?:, [^,]+)*)', texto)
        if m:
            resultado['creditos']['depositos']['total'] = limpa_valor(m.group(1))
            resultado['creditos']['depositos']['quantidade'] = int(m.group(2))
            locais = [l.strip() for l in m.group(3).split(',')]
            resultado['creditos']['depositos']['locais'] = locais
            resultado['locais_depositos'] = locais
    
    # Depósitos em espécie - padrão mais flexível
    m = re.search(r'R\$ ([\d\.,]+) constando como efetuados em espécie, (\d+) transação', texto)
    if m:
        resultado['creditos']['depositos']['especie']['valor'] = limpa_valor(m.group(1))
        resultado['creditos']['depositos']['especie']['quantidade'] = int(m.group(2))

    # Depósitos em cheques - padrão separado para novo formato
    if resultado['creditos']['depositos']['cheque']['valor'] == 0:
        m = re.search(r'R\$ ([\d\.,]+) depositados em cheques, (\d+) transações', texto)
        if m:
            resultado['creditos']['depositos']['cheque']['valor'] = limpa_valor(m.group(1))
            resultado['creditos']['depositos']['cheque']['quantidade'] = int(m.group(2))

    # Transferências (TED, DOC, PIX, etc) - padrão mais flexível
    m = re.search(r'R\$ ([\d\.,]+) provenientes de (\d+) TEDs, DOCs, PIXs e transferências entre contas', texto, re.IGNORECASE)
    if m:
        resultado['creditos']['transferencias']['total'] = limpa_valor(m.group(1))
        resultado['creditos']['transferencias']['quantidade'] = int(m.group(2))

    # Principais depositantes/remetentes - regex específico
    m = re.search(r'Demonstramos os principais remetentes:(.+?)(?:Os débitos|Notas:)', texto, re.DOTALL)
    if m:
        tabela = m.group(1)
        # Regex específico para capturar valores completos
        padrao = r'(\d{1,3}(?:\.\d{3})*(?:,\d{2})*)\s+(\d+)\s+([\w\s\.\-]+?)\s+([\d\-/\.]+)\s+[\w\s\(\)/-]+'
        resultado['creditos']['principais_depositantes'] = extrai_tabela(tabela, padrao)

    # Débitos totais - padrão mais flexível
    m = re.search(r'Os débitos, em igual período, totalizaram R\$ ([\d\.,]+)', texto)
    if m:
        resultado['debitos']['total'] = limpa_valor(m.group(1))

    # Pagamentos diversos - padrão mais flexível
    m = re.search(r'R\$ ([\d\.,]+) utilizados para pagamentos diversos, (\d+) transações', texto)
    if m:
        resultado['debitos']['pagamentos']['total'] = limpa_valor(m.group(1))
        resultado['debitos']['pagamentos']['quantidade'] = int(m.group(2))

    # Débitos transferências - padrão mais flexível
    m = re.search(r'R\$ ([\d\.,]+) destinados para quitação de (\d+) TEDs, DOCs, PIXs, transferências e depósitos em contas', texto)
    if m:
        resultado['debitos']['transferencias']['total'] = limpa_valor(m.group(1))
        resultado['debitos']['transferencias']['quantidade'] = int(m.group(2))

    # Principais favorecidos - regex específico
    m = re.search(r'Demonstramos os principais favorecidos:(.+?)(?:Notas:|Diante do exposto)', texto, re.DOTALL)
    if m:
        tabela = m.group(1)
        # Regex específico para capturar valores completos, incluindo underscores
        padrao = r'(\d{1,3}(?:\.\d{3})*(?:,\d{2})*(?:___\d{2})?)\s+(\d+)\s+([\w\s\.\-]+?)\s+([\d\-/\.]+)\s+[\w\s\(\)/-]+'
        resultado['debitos']['principais_favorecidos'] = extrai_tabela(tabela, padrao)

    # Pagamentos de boletos - padrão mais flexível
    m = re.search(r'pagamentos de boletos de cobrança a terceiros e por amostragem, demonstramos os principais pagadores/sacados registrados na emissão dos boletos:(.+?)Cliente informou', texto, re.DOTALL)
    if m:
        tabela = m.group(1)
        padrao = r'R\$([\d\.,]+)\s+(\d+)\s+([\w\s\.\-]+?)\s+([\d\-/\.]+)'
        boletos = extrai_tabela(tabela, padrao)
        for b in boletos:
            resultado['boletos'].append({
                'valor': b['valor'],
                'quantidade': b['quantidade'],
                'nome_sacado': b['nome'],
                'cpf_cnpj_sacado': b['cpf_cnpj']
            })

    # Vínculos empresariais - padrão mais flexível
    vinculos = re.findall(r'vínculo empregatício com a empresa ([^,]+)', texto, re.IGNORECASE)
    resultado['vinculos_empresariais'] = vinculos

    # Atividades suspeitas
    atividades = []
    if re.search(r'agiotagem', texto, re.IGNORECASE):
        atividades.append('Agiotagem')
    if re.search(r'lavagem', texto, re.IGNORECASE):
        atividades.append('Lavagem de dinheiro')
    if re.search(r'sonegação', texto, re.IGNORECASE):
        atividades.append('Sonegação fiscal')
    if re.search(r'conta pessoal para movimentar recursos de terceiros', texto, re.IGNORECASE):
        atividades.append('Uso de conta pessoal para recursos de terceiros')
    if re.search(r'pagamentos de boletos tendo terceiros como pagadores/sacados', texto, re.IGNORECASE):
        atividades.append('Pagamentos de boletos para terceiros')
    resultado['atividades_suspeitas'] = atividades

    # Notas e informações finais
    notas = re.findall(r'- ([^-]+)', texto)
    resultado['notas'] = [n.strip() for n in notas]

    # Informações finais (último parágrafo)
    m = re.search(r'Diante do exposto,(.+)', texto, re.DOTALL)
    if m:
        resultado['informacoes_finais'].append(m.group(1).strip())

    # Possíveis crimes
    crimes = []
    padroes_crime = [r'agiotagem', r'lavagem', r'fraude', r'crime', r'ilícit[oa]', r'ind[ií]cio', r'suspeita', r'corrupção', r'doleir', r'caixa dois']
    for p in padroes_crime:
        if re.search(p, texto, re.IGNORECASE):
            crimes.append(p)
    if crimes:
        resultado['possiveis_crimes'] = list(set([c.lower() for c in crimes]))

    # Resumo financeiro
    credito_total = resultado['creditos']['total']
    debito_total = resultado['debitos']['total']
    resultado['resumo_financeiro']['saldo_periodo'] = credito_total - debito_total
    
    # Calcular movimentação diária média (se período disponível)
    if resultado['periodo']:
        try:
            from datetime import datetime
            inicio = datetime.strptime(resultado['periodo']['inicio'], '%d.%m.%Y')
            fim = datetime.strptime(resultado['periodo']['fim'], '%d.%m.%Y')
            dias = (fim - inicio).days
            if dias > 0:
                resultado['resumo_financeiro']['movimentacao_diaria_media'] = (credito_total + debito_total) / dias
        except:
            pass
    
    # Verificar incompatibilidade com renda/faturamento
    renda_ou_faturamento = resultado.get('renda_mensal') or resultado.get('faturamento_mensal')
    if renda_ou_faturamento:
        renda_anual = renda_ou_faturamento * 12
        movimentacao_total = credito_total + debito_total
        if movimentacao_total > renda_anual * 3:  # Se movimentação > 3x renda anual
            resultado['resumo_financeiro']['incompatibilidade_renda'] = True
            resultado['resumo_financeiro']['indicadores_risco'].append('Movimentação incompatível com renda/faturamento declarado')
    
    # Outros indicadores de risco
    if len(resultado['boletos']) > 5:
        resultado['resumo_financeiro']['indicadores_risco'].append('Muitos boletos pagos')
    
    # Verificar depósitos em espécie elevados (só se tiver renda/faturamento)
    if renda_ou_faturamento and resultado['creditos']['depositos']['especie']['valor'] > renda_ou_faturamento * 2:
        resultado['resumo_financeiro']['indicadores_risco'].append('Depósitos em espécie elevados')
    
    if len(resultado['locais_depositos']) > 3:
        resultado['resumo_financeiro']['indicadores_risco'].append('Depósitos em múltiplas localidades')

    return resultado 