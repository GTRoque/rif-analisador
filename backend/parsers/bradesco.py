import re
from collections import defaultdict

def limpa_valor(valor_str):
    try:
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
    resultado = {
        'conjuge': None,
        'renda_mensal': None,
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
        'possiveis_crimes': []
    }

    # Cônjuge
    m = re.search(r'cônjuge,\s*([\w\s\.\-]+),\s*CPF\s*([\d\-\.]+)', texto, re.IGNORECASE)
    if m:
        resultado['conjuge'] = {'nome': m.group(1).strip(), 'cpf': m.group(2).strip()}

    # Renda mensal
    m = re.search(r'renda mensal de R\$\s*([\d\.,]+)', texto, re.IGNORECASE)
    if m:
        resultado['renda_mensal'] = limpa_valor(m.group(1))

    # Período
    m = re.search(r'Entre (\d{2}\.\d{2}\.\d{4}) e (\d{2}\.\d{2}\.\d{4})', texto)
    if m:
        resultado['periodo'] = {'inicio': m.group(1), 'fim': m.group(2)}

    # Créditos totais
    m = re.search(r'os créditos somaram R\$\s*([\d\.,]+)', texto)
    if m:
        resultado['creditos']['total'] = limpa_valor(m.group(1))

    # Detalhamento depósitos
    m = re.search(r'sendo R\$ ([\d\.,]+) por meio de (\d+) depósitos realizados nas praças de ([^,]+(?:, [^,]+)*),? destes, R\$ ([\d\.,]+) efetuados em terminais de autoatendimento através de (\d+) transações \(Efetuados em cheques\), R\$ ([\d\.,]+) constando como efetuados em espécie através de (\d+) transações', texto)
    if m:
        resultado['creditos']['depositos']['total'] = limpa_valor(m.group(1))
        resultado['creditos']['depositos']['quantidade'] = int(m.group(2))
        locais = [l.strip() for l in m.group(3).split(',')]
        resultado['creditos']['depositos']['locais'] = locais
        resultado['locais_depositos'] = locais
        resultado['creditos']['depositos']['cheque']['valor'] = limpa_valor(m.group(4))
        resultado['creditos']['depositos']['cheque']['quantidade'] = int(m.group(5))
        resultado['creditos']['depositos']['especie']['valor'] = limpa_valor(m.group(6))
        resultado['creditos']['depositos']['especie']['quantidade'] = int(m.group(7))

    # Transferências (TED, DOC, PIX, etc)
    m = re.search(r'R\$ ([\d\.,]+) provenientes de (\d+) Teds, Docs, Pixs e transferências entre contas', texto, re.IGNORECASE)
    if m:
        resultado['creditos']['transferencias']['total'] = limpa_valor(m.group(1))
        resultado['creditos']['transferencias']['quantidade'] = int(m.group(2))

    # Principais depositantes/remetentes
    m = re.search(r'Demonstramos os principais depositantes e remetentes:(.+?)Os débitos', texto, re.DOTALL)
    if m:
        tabela = m.group(1)
        padrao = r'([\d\.,]+)\s+(\d+)\s+([\w\s\.\-]+?)\s+([\d\-/\.]+)\s+[\w\s\(\)/-]+'
        resultado['creditos']['principais_depositantes'] = extrai_tabela(tabela, padrao)

    # Débitos totais
    m = re.search(r'Os débitos, em igual período, totalizaram R\$ ([\d\.,]+)', texto)
    if m:
        resultado['debitos']['total'] = limpa_valor(m.group(1))

    # Pagamentos diversos
    m = re.search(r'R\$ ([\d\.,]+) utilizados para pagamentos diversos através de (\d+) transações \(Sendo R\$ ([\d\.,]+) para pagamento de cobrança\)', texto)
    if m:
        resultado['debitos']['pagamentos']['total'] = limpa_valor(m.group(1))
        resultado['debitos']['pagamentos']['quantidade'] = int(m.group(2))
        resultado['debitos']['pagamentos']['cobranca'] = limpa_valor(m.group(3))

    # Débitos transferências
    m = re.search(r'R\$ ([\d\.,]+) destinados para quitação de (\d+) Teds, Docs, Pixs, transferências e depósitos em contas', texto)
    if m:
        resultado['debitos']['transferencias']['total'] = limpa_valor(m.group(1))
        resultado['debitos']['transferencias']['quantidade'] = int(m.group(2))

    # Principais favorecidos
    m = re.search(r'Demonstramos os principais favorecidos:(.+?)Notas:', texto, re.DOTALL)
    if m:
        tabela = m.group(1)
        padrao = r'([\d\.,]+)\s+(\d+)\s+([\w\s\.\-]+?)\s+([\d\-/\.]+)\s+[\w\s\(\)/-]+'
        resultado['debitos']['principais_favorecidos'] = extrai_tabela(tabela, padrao)

    # Pagamentos de boletos
    m = re.search(r'pagamentos de boletos do próprio cliente e em benefícios de terceiros, conforme abaixo:(.+?)- De acordo', texto, re.DOTALL)
    if m:
        tabela = m.group(1)
        padrao = r'([\d\.,]+)\s+(\d{2})\s+([\w\s\.\-]+?)\s+([\d\-/\.]+)'
        boletos = extrai_tabela(tabela, padrao)
        for b in boletos:
            resultado['boletos'].append({
                'valor': b['valor'],
                'quantidade': b['quantidade'],
                'nome_sacado': b['nome'],
                'cpf_cnpj_sacado': b['cpf_cnpj']
            })

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

    return resultado 