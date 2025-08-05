import re
from collections import defaultdict

def limpa_valor(valor_str):
    try:
        if not valor_str:
            return 0.0
        # Garantir que é string
        valor_str = str(valor_str)
        v = float(valor_str.replace('.', '').replace(',', '.').rstrip('.'))
        if v != v:  # NaN check
            return 0.0
        return v
    except Exception:
        return 0.0

def parse_nubank(texto):
    resultado = {
        'titular': None,
        'renda_mensal': None,
        'periodo': None,
        'creditos': {
            'total': 0.0,
            'tipos': [],
            'principais_depositantes': []
        },
        'debitos': {
            'total': 0.0,
            'tipos': [],
            'principais_favorecidos': []
        },
        'notas': [],
        'informacoes_finais': [],
        'possiveis_crimes': []
    }

    # Extrair informações básicas
    # Titular
    m = re.search(r'em nome de ([^,]+)', texto, re.IGNORECASE)
    if m:
        resultado['titular'] = m.group(1).strip()

    # CPF
    m = re.search(r'CPF\s*([\d\-\.]+)', texto, re.IGNORECASE)
    if m:
        resultado['cpf'] = m.group(1).strip()

    # Período
    m = re.search(r'Entre (\d{2}/\d{2}/\d{4}) e (\d{2}/\d{2}/\d{4})', texto)
    if m:
        resultado['periodo'] = {'inicio': m.group(1), 'fim': m.group(2)}

    # Renda mensal
    m = re.search(r'renda.*?R\$\s*([\d\.,]+)', texto, re.IGNORECASE)
    if m:
        resultado['renda_mensal'] = limpa_valor(m.group(1))

    # Créditos totais
    m = re.search(r'créditos.*?R\$\s*([\d\.,]+)', texto, re.IGNORECASE)
    if m:
        resultado['creditos']['total'] = limpa_valor(m.group(1))

    # Débitos totais
    m = re.search(r'débitos.*?R\$\s*([\d\.,]+)', texto, re.IGNORECASE)
    if m:
        resultado['debitos']['total'] = limpa_valor(m.group(1))

    # Extrair valores de campos específicos
    for campo in ['CampoA', 'CampoB', 'CampoC', 'CampoD', 'CampoE']:
        m = re.search(rf'{campo}.*?R\$\s*([\d\.,]+)', texto, re.IGNORECASE)
        if m:
            resultado[campo.lower()] = limpa_valor(m.group(1))

    # Adicionar nota sobre parser básico
    resultado['notas'].append('Parser básico - informações limitadas extraídas')
    resultado['informacoes_finais'].append('Este relatório foi processado com parser básico do Nubank')

    return resultado 