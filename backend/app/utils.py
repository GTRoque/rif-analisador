import json
import os

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