import re
from collections import defaultdict

def limpa_valor(valor_str):
    try:
        v = float(valor_str.replace('.', '').replace(',', '.').rstrip('.'))
        if v != v:
            return 0.0
        return v
    except Exception:
        return 0.0

def parse_bb(texto):
    resultado = {
        'titular': None,
        'renda_mensal': None,
        'cidade': None,
        'periodo': None,
        'socio_diretor': None,
        'contas': [],
        'creditos': {
            'total': 0.0,
            'tipos': [],
            'principais_depositantes': []
        },
        'debitos': {
            'total': 0.0,
            'tipos': [],
            'principais_destinatarios': []
        },
        'notas': [],
        'informacoes_finais': [],
        'possiveis_crimes': []
    }

    # Titular e cidade
    m = re.search(r'cadastrado como:\s*([\w\s\-]+),.*residente na cidade de ([^\.\n]+)', texto, re.IGNORECASE)
    if m:
        resultado['titular'] = m.group(1).strip()
        resultado['cidade'] = m.group(2).strip()

    # Renda mensal
    m = re.search(r'rendimentos de R\$\s*([\d\.,]+)', texto, re.IGNORECASE)
    if m:
        resultado['renda_mensal'] = limpa_valor(m.group(1))

    # Sócio/Dirigente
    m = re.search(r'Sócio/Dirigente\s*:\s*([\w\s\-\.]+)\s*-\s*([\d\./\-]+)', texto)
    if m:
        resultado['socio_diretor'] = {'nome': m.group(1).strip(), 'cpf_cnpj': m.group(2).strip()}

    # Contas analisadas
    contas = re.findall(r'(\d{4})\s*/\s*([\d\.]+)', texto)
    resultado['contas'] = [f"{ag}/{cc}" for ag, cc in contas]

    # Período
    m = re.search(r'Período analisado: (\d{2}/\d{2}/\d{4}) - (\d{2}/\d{2}/\d{4})', texto)
    if m:
        resultado['periodo'] = {'inicio': m.group(1), 'fim': m.group(2)}

    # Créditos totais
    m = re.search(r'Resumo de lançamentos a crédito.*?Total R\$ ([\d\.,]+):', texto, re.DOTALL)
    if m:
        resultado['creditos']['total'] = limpa_valor(m.group(1))

    # Créditos por tipo
    tipos_credito = re.findall(r'(\d+)\s+([A-Z\s/\(\)]+)\s*-\s*R\$\s*([\d\.,]+)', texto)
    for qtde, tipo, valor in tipos_credito:
        resultado['creditos']['tipos'].append({
            'tipo': tipo.strip(),
            'quantidade': int(qtde),
            'valor': limpa_valor(valor)
        })

    # Principais remetentes/depositantes
    m = re.search(r'Principais remetentes/depositantes identificados:(.+?)Resumo de lançamentos a débito', texto, re.DOTALL)
    if m:
        tabela = m.group(1)
        cpf_cnpj_pattern = r'(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}|\d{2}\.\d{3}\.\d{3}-\d{2}|\d{3}\.\d{3}\.\d{3}/\d{4}-\d{2})'
        linhas = re.findall(rf'(.+?)\s*-\s*{cpf_cnpj_pattern}\s*\(([^)]+)\)\s*-\s*(\d+) lançamento\(s\) no total de: R\$([\d\.,]+)', tabela)
        for nome, cpf_cnpj, profissao, qtde, valor in linhas:
            resultado['creditos']['principais_depositantes'].append({
                'nome': nome.strip(),
                'cpf_cnpj': cpf_cnpj.strip(),
                'profissao': profissao.strip(),
                'quantidade': f"{int(qtde):02d}",
                'valor': limpa_valor(valor)
            })

    # Débitos totais
    m = re.search(r'Resumo de lançamentos a débito.*?Total R\$ ([\d\.,]+):', texto, re.DOTALL)
    if m:
        resultado['debitos']['total'] = limpa_valor(m.group(1))

    # Débitos por tipo
    tipos_debito = re.findall(r'(\d+)\s+([A-Z\s/\(\)]+)\s*-\s*R\$\s*([\d\.,]+)', texto)
    for qtde, tipo, valor in tipos_debito:
        resultado['debitos']['tipos'].append({
            'tipo': tipo.strip(),
            'quantidade': int(qtde),
            'valor': limpa_valor(valor)
        })

    # Principais destinatários
    m = re.search(r'Principais destinatários de recursos identificados:(.+?)Movimentação no período', texto, re.DOTALL)
    if m:
        tabela = m.group(1)
        cpf_cnpj_pattern = r'(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}|\d{2}\.\d{3}\.\d{3}-\d{2}|\d{3}\.\d{3}\.\d{3}/\d{4}-\d{2})'
        linhas = re.findall(rf'(.+?)\s*-\s*{cpf_cnpj_pattern}\s*\(([^)]+)\)\s*-\s*(\d+) lançamento\(s\) no total de: R\$([\d\.,]+)', tabela)
        for nome, cpf_cnpj, profissao, qtde, valor in linhas:
            resultado['debitos']['principais_destinatarios'].append({
                'nome': nome.strip(),
                'cpf_cnpj': cpf_cnpj.strip(),
                'profissao': profissao.strip(),
                'quantidade': f"{int(qtde):02d}",
                'valor': limpa_valor(valor)
            })

    # Notas
    notas = re.findall(r'- ([^-]+)', texto)
    resultado['notas'] = [n.strip() for n in notas]

    # Informações finais
    m = re.search(r'Movimentação no período não é compatível(.+)', texto, re.DOTALL)
    if m:
        resultado['informacoes_finais'].append(m.group(1).strip())

    # Possíveis crimes
    crimes = []
    padroes_crime = [r'agiotagem', r'lavagem', r'fraude', r'crime', r'ilícit[oa]', r'ind[ií]cio', r'suspeita', r'corrupção', r'doleir', r'caixa dois', r'sonega', r'pessoa jurídica em conta de pessoa física']
    for p in padroes_crime:
        if re.search(p, texto, re.IGNORECASE):
            crimes.append(p)
    if crimes:
        resultado['possiveis_crimes'] = list(set([c.lower() for c in crimes]))

    return resultado 