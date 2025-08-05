import json
import os
import csv
from typing import List, Dict, Any
import chardet

def salvar_correcoes(comunicacao_id: int, novo_json: dict, path='backend/database/correcoes.json'):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            dados = json.load(f)
    else:
        dados = {}
    dados[str(comunicacao_id)] = novo_json
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

def registrar_log(mensagem: str, path='backend/database/logs.txt'):
    with open(path, 'a', encoding='utf-8') as f:
        f.write(mensagem + '\n')

def detect_encoding(file_path: str) -> str:
    """Detecta a codificação de um arquivo"""
    try:
        if not os.path.exists(file_path):
            return 'utf-8'
        with open(file_path, 'rb') as f:
            content = f.read()
            if not content:
                return 'utf-8'
            result = chardet.detect(content)
            encoding = result.get('encoding')
            if not encoding or not isinstance(encoding, str):
                return 'utf-8'
            return encoding
    except Exception:
        return 'utf-8'

def validate_csv_structure(file_path: str, expected_headers: List[str]) -> Dict[str, Any]:
    """Valida a estrutura de um arquivo CSV"""
    try:
        if not os.path.exists(file_path):
            return {
                'valid': False,
                'error': f'Arquivo não encontrado: {file_path}'
            }
        
        encoding = detect_encoding(file_path)
        with open(file_path, encoding=encoding) as f:
            reader = csv.DictReader(f, delimiter=';')
            headers = reader.fieldnames or []

            # Verificar se todos os headers esperados estão presentes
            missing_headers = [h for h in expected_headers if h not in headers]

            if missing_headers:
                return {
                    'valid': False,
                    'error': f'Headers obrigatórios não encontrados: {", ".join(missing_headers)}',
                    'found_headers': headers,
                    'expected_headers': expected_headers
                }

            # Contar linhas
            rows = list(reader)
            row_count = len(rows)

            return {
                'valid': True,
                'row_count': row_count,
                'headers': headers,
                'encoding': encoding
            }

    except Exception as e:
        return {
            'valid': False,
            'error': f'Erro ao validar arquivo: {str(e)}'
        }

def validate_comunicacoes_csv(file_path: str) -> Dict[str, Any]:
    """Valida arquivo de comunicações"""
    expected_headers = [
        'Indexador', 'idComunicacao', 'NumeroOcorrenciaBC', 'Data_do_Recebimento', 'Data_da_operacao', 'DataFimFato', 'cpfCnpjComunicante', 'nomeComunicante', 'CidadeAgencia', 'UFAgencia', 'NomeAgencia', 'NumeroAgencia', 'informacoesAdicionais', 'CampoA', 'CampoB', 'CampoC', 'CampoD', 'CampoE', 'CodigoSegmento'
    ]
    return validate_csv_structure(file_path, expected_headers)

def validate_envolvidos_csv(file_path: str) -> Dict[str, Any]:
    """Valida arquivo de envolvidos"""
    expected_headers = [
        'Indexador', 'cpfCnpjEnvolvido', 'nomeEnvolvido', 'tipoEnvolvido'
    ]
    return validate_csv_structure(file_path, expected_headers)

def validate_ocorrencias_csv(file_path: str) -> Dict[str, Any]:
    """Valida arquivo de ocorrências"""
    expected_headers = ['Indexador', 'idOcorrencia', 'Ocorrencia']
    return validate_csv_structure(file_path, expected_headers)

def limpa_valor(valor_str) -> float:
    print(f'[DEBUG] limpa_valor recebeu: {valor_str} (tipo: {type(valor_str)})')
    try:
        if not valor_str:
            return 0.0
        # Garantir que é string
        valor_str = str(valor_str)
        v = float(valor_str.replace('.', '').replace(',', '.').rstrip('.'))
        if v != v:  # NaN check
            return 0.0
        return v
    except Exception as e:
        print(f'[DEBUG] limpa_valor erro: {e}')
        return 0.0

def format_currency(value: float) -> str:
    """Formata valor como moeda brasileira"""
    return f"R$ {value:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

def validate_file_size(file_path: str, max_size_mb: int = 10) -> Dict[str, Any]:
    """Valida tamanho do arquivo"""
    try:
        if not os.path.exists(file_path):
            return {
                'valid': False,
                'error': f'Arquivo não encontrado: {file_path}'
            }
        
        size_bytes = os.path.getsize(file_path)
        size_mb = size_bytes / (1024 * 1024)

        if size_mb > max_size_mb:
            return {
                'valid': False,
                'error': f'Arquivo muito grande: {size_mb:.2f}MB (máximo: {max_size_mb}MB)'
            }

        return {
            'valid': True,
            'size_mb': size_mb,
            'size_bytes': size_bytes
        }
    except Exception as e:
        return {
            'valid': False,
            'error': f'Erro ao verificar tamanho do arquivo: {str(e)}'
        }

 