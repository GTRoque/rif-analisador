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

def parse_generico(texto):
    resultado = {
        'titular': None,
        'cpf': None,
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

    # Padrões genéricos para extração
    padroes = {
        'titular': [
            r'em nome de ([^,]+)',
            r'titular[:\s]+([^,\n]+)',
            r'conta.*?([^,\n]+)',
        ],
        'cpf': [
            r'CPF[:\s]*([\d\-\.]+)',
            r'CPF/CNPJ[:\s]*([\d\-\.\/]+)',
        ],
        'periodo': [
            r'Entre (\d{2}[/\.]\d{2}[/\.]\d{4}) e (\d{2}[/\.]\d{2}[/\.]\d{4})',
            r'Período[:\s]*(\d{2}[/\.]\d{2}[/\.]\d{4})[^\d]*(\d{2}[/\.]\d{2}[/\.]\d{4})',
        ],
        'renda': [
            r'renda.*?R\$\s*([\d\.,]+)',
            r'salário.*?R\$\s*([\d\.,]+)',
            r'remuneração.*?R\$\s*([\d\.,]+)',
        ],
        'creditos': [
            r'créditos.*?R\$\s*([\d\.,]+)',
            r'entradas.*?R\$\s*([\d\.,]+)',
            r'depósitos.*?R\$\s*([\d\.,]+)',
        ],
        'debitos': [
            r'débitos.*?R\$\s*([\d\.,]+)',
            r'saídas.*?R\$\s*([\d\.,]+)',
            r'pagamentos.*?R\$\s*([\d\.,]+)',
        ]
    }

    # Extrair informações usando padrões genéricos
    for campo, lista_padroes in padroes.items():
        for padrao in lista_padroes:
            m = re.search(padrao, texto, re.IGNORECASE)
            if m:
                if campo == 'titular':
                    resultado['titular'] = m.group(1).strip()
                elif campo == 'cpf':
                    resultado['cpf'] = m.group(1).strip()
                elif campo == 'periodo':
                    resultado['periodo'] = {'inicio': m.group(1), 'fim': m.group(2)}
                elif campo == 'renda':
                    resultado['renda_mensal'] = limpa_valor(m.group(1))
                elif campo == 'creditos':
                    resultado['creditos']['total'] = limpa_valor(m.group(1))
                elif campo == 'debitos':
                    resultado['debitos']['total'] = limpa_valor(m.group(1))
                break

    # Extrair valores de campos específicos (CampoA, CampoB, etc.)
    for campo in ['CampoA', 'CampoB', 'CampoC', 'CampoD', 'CampoE']:
        m = re.search(rf'{campo}.*?R\$\s*([\d\.,]+)', texto, re.IGNORECASE)
        if m:
            resultado[campo.lower()] = limpa_valor(m.group(1))

    # Tentar extrair informações de transferências
    transferencias = re.findall(r'(\d+)\s+(?:TED|DOC|PIX|transferência)', texto, re.IGNORECASE)
    if transferencias:
        resultado['creditos']['tipos'].append({
            'tipo': 'Transferências',
            'quantidade': sum(int(x) for x in transferencias),
            'valor': resultado['creditos']['total'] * 0.3  # Estimativa
        })

    # Adicionar informações sobre parser genérico
    resultado['notas'].append('Parser genérico - extração limitada de informações')
    resultado['notas'].append('Recomenda-se implementar parser específico para melhor precisão')
    resultado['informacoes_finais'].append('Este relatório foi processado com parser genérico')
    resultado['informacoes_finais'].append('Para melhor análise, considere implementar parser específico para este banco')

    return resultado 