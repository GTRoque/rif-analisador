from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form, Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, sessionmaker
from typing import List, Optional
import json
import csv
import io
import os
import shutil
from datetime import datetime

from .database import get_engine
from .models import Usuario, ParsingCorrecao
from .auth import validar_usuario
from .utils import (
    detect_encoding, validate_csv_structure, validate_comunicacoes_csv,
    validate_envolvidos_csv, validate_ocorrencias_csv, validate_file_size,
    limpa_valor
)
from parsers import bradesco, bb, nubank, parser_generico

def get_significados_campos(codigo_segmento):
    """Retorna os significados dos campos baseado no código do segmento"""
    significados = {
        "41": {
            "campo_a": "Total",
            "campo_b": "Valor do Crédito",
            "campo_c": "Valor do Débito",
            "campo_d": "Valor do Provisionamento",
            "campo_e": "Valor da Proposta"
        },
        "42": {
            "campo_a": "Total",
            "campo_b": "Valor do Crédito",
            "campo_c": "Valor do Débito",
            "campo_d": "Valor do Provisionamento",
            "campo_e": "Valor da Proposta"
        },
        "37": {
            "campo_a": "Total",
            "campo_b": "Valor do Crédito",
            "campo_c": "Valor do Débito",
            "campo_d": "Valor do Provisionamento",
            "campo_e": "Valor da Proposta"
        }
    }
    return significados.get(codigo_segmento, {
        "campo_a": "Campo A",
        "campo_b": "Campo B",
        "campo_c": "Campo C",
        "campo_d": "Campo D",
        "campo_e": "Campo E"
    })

app = FastAPI(title="RIF Analisador API")

# Configuração de CORS para permitir frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Armazenamento temporário em memória (apenas para demonstração)
# Em produção, isso deveria ser persistido de forma adequada
comunicacoes_data = {}

@app.get("/ping")
def ping():
    return {"status": "ok"}

@app.post("/login")
def login(usuario: str = Form(...), senha: str = Form(...)):
    if validar_usuario(usuario, senha):
        return {"success": True, "usuario": usuario}
    return {"success": False, "erro": "Usuário ou senha inválidos."}

@app.post("/upload")
def upload_arquivos(
    comunicacoes: UploadFile = File(...),
    envolvidos: UploadFile = File(...),
    ocorrencias: UploadFile = File(...),
    usuario: str = Form(...)
):
    print(f"[DEBUG] Iniciando upload para usuário: {usuario}")
    pasta_upload = f"backend/database/uploads/{usuario}"
    os.makedirs(pasta_upload, exist_ok=True)
    
    # Salvar arquivos
    arquivos_info = []
    for arquivo, nome in zip([comunicacoes, envolvidos, ocorrencias], ["Comunicacoes.csv", "Envolvidos.csv", "Ocorrencias.csv"]):
        caminho = os.path.join(pasta_upload, nome)
        print(f"[DEBUG] Salvando arquivo: {caminho}")
        with open(caminho, "wb") as buffer:
            shutil.copyfileobj(arquivo.file, buffer)
        
        # Validar tamanho do arquivo
        print(f"[DEBUG] Validando tamanho do arquivo: {caminho}")
        size_validation = validate_file_size(caminho)
        if not size_validation['valid']:
            return {"success": False, "msg": size_validation['error']}
        
        arquivos_info.append((caminho, nome))
    
    # Validar estrutura dos arquivos
    comunicacoes_path = os.path.join(pasta_upload, "Comunicacoes.csv")
    envolvidos_path = os.path.join(pasta_upload, "Envolvidos.csv")
    ocorrencias_path = os.path.join(pasta_upload, "Ocorrencias.csv")
    
    print(f"[DEBUG] Validando estrutura dos arquivos")
    # Validar cada arquivo
    validacoes = {
        'comunicacoes': validate_comunicacoes_csv(comunicacoes_path),
        'envolvidos': validate_envolvidos_csv(envolvidos_path),
        'ocorrencias': validate_ocorrencias_csv(ocorrencias_path)
    }
    
    # Verificar se há erros de validação
    for nome, validacao in validacoes.items():
        if not validacao['valid']:
            return {"success": False, "msg": f"Erro no arquivo {nome}: {validacao['error']}"}
    
    print(f"[DEBUG] Detectando encoding dos arquivos")
    # Detectar encoding dos arquivos
    enc_com = detect_encoding(comunicacoes_path)
    enc_env = detect_encoding(envolvidos_path)
    enc_oco = detect_encoding(ocorrencias_path)
    print(f"[DEBUG] Encodings detectados - Comunicacoes: {enc_com}, Envolvidos: {enc_env}, Ocorrencias: {enc_oco}")
    
    try:
        print(f"[DEBUG] Iniciando processamento dos dados")
        
        # Mapear Envolvidos por Indexador
        envolvido_map = {}
        print(f"[DEBUG] Processando arquivo de envolvidos")
        with open(os.path.join(pasta_upload, "Envolvidos.csv"), encoding=enc_env) as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                # Pular linhas que são comentários ou não têm dados válidos
                indexador = row.get("Indexador", "")
                if not indexador or indexador.startswith('#') or indexador.strip() == "":
                    print(f"[DEBUG] Pulando linha inválida de envolvidos: {indexador}")
                    continue
                
                # Pular linhas que contêm texto descritivo em vez de dados numéricos
                if ":" in indexador or "=" in indexador or "CampoA" in indexador or "CampoB" in indexador:
                    print(f"[DEBUG] Pulando linha descritiva de envolvidos: {indexador}")
                    continue
                
                # Pular linhas que são hashes MD5 (32 caracteres hexadecimais)
                if len(indexador.strip()) == 32 and all(c in '0123456789abcdefABCDEF' for c in indexador.strip()):
                    print(f"[DEBUG] Pulando hash MD5 de envolvidos: {indexador}")
                    continue
                    
                tipo = (row.get("tipoEnvolvido", "") or "").strip().lower()
                if tipo == "titular":
                    envolvido_map[indexador] = {
                        "nome": row.get("nomeEnvolvido", ""),
                        "cpf": row.get("cpfCnpjEnvolvido", "")
                    }
        
        # Ocorrências
        ocorrencia_map = {}
        print(f"[DEBUG] Processando arquivo de ocorrências")
        with open(os.path.join(pasta_upload, "Ocorrencias.csv"), encoding=enc_oco) as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                # Pular linhas que são comentários ou não têm dados válidos
                indexador = row.get("Indexador", "")
                if not indexador or indexador.startswith('#') or indexador.strip() == "":
                    print(f"[DEBUG] Pulando linha inválida de ocorrências: {indexador}")
                    continue
                
                # Pular linhas que contêm texto descritivo em vez de dados numéricos
                if ":" in indexador or "=" in indexador or "CampoA" in indexador or "CampoB" in indexador:
                    print(f"[DEBUG] Pulando linha descritiva de ocorrências: {indexador}")
                    continue
                
                # Pular linhas que são hashes MD5 (32 caracteres hexadecimais)
                if len(indexador.strip()) == 32 and all(c in '0123456789abcdefABCDEF' for c in indexador.strip()):
                    print(f"[DEBUG] Pulando hash MD5 de ocorrências: {indexador}")
                    continue
                    
                ocorrencia_map[row.get("idOcorrencia", "")] = row.get("Ocorrencia", "")
        
        # Comunicações
        comunicacoes_processadas = []
        print(f"[DEBUG] Processando arquivo de comunicações")
        with open(os.path.join(pasta_upload, "Comunicacoes.csv"), encoding=enc_com) as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                # Pular linhas que são comentários ou não têm dados válidos
                indexador = row.get("Indexador", "")
                if not indexador or indexador.startswith('#') or indexador.strip() == "":
                    print(f"[DEBUG] Pulando linha inválida: {indexador}")
                    continue
                
                # Pular linhas que contêm texto descritivo em vez de dados numéricos
                if ":" in indexador or "=" in indexador or "CampoA" in indexador or "CampoB" in indexador:
                    print(f"[DEBUG] Pulando linha descritiva: {indexador}")
                    continue
                
                # Pular linhas que são hashes MD5 (32 caracteres hexadecimais)
                if len(indexador.strip()) == 32 and all(c in '0123456789abcdefABCDEF' for c in indexador.strip()):
                    print(f"[DEBUG] Pulando hash MD5: {indexador}")
                    continue
                    
                print(f"[DEBUG] Processando linha de comunicação: {row.get('Indexador', 'N/A')}")
                titular_nome = envolvido_map.get(indexador, {}).get("nome", "")
                titular_cpf = envolvido_map.get(indexador, {}).get("cpf", "")
                
                info = row.get("informacoesAdicionais", "")
                banco_nome = (row.get("nomeComunicante") or "").lower().replace(".", "").replace(",", "").replace("-", "").replace("  ", " ").strip()
                # Parsing do campo informacoesAdicionais baseado no código do segmento
                codigo_segmento = row.get("CodigoSegmento", "41")
                
                if codigo_segmento == "41":
                    # SFN-Atípicas: Usar parser bancário individual
                    if "bradesco" in banco_nome:
                        parsed = bradesco.parse_bradesco(info)
                    elif "banco do brasil" in banco_nome or (banco_nome.split() and banco_nome.split()[0] == "bb"):
                        parsed = bb.parse_bb(info)
                    elif "nubank" in banco_nome or "nu pagamentos" in banco_nome:
                        parsed = nubank.parse_nubank(info)
                    else:
                        parsed = parser_generico.parse_generico(info)
                else:
                    # Outros segmentos: Extrair campos específicos
                    parsed = {
                        "campo_a": row.get("CampoA", "0"),
                        "campo_b": row.get("CampoB", "0"),
                        "campo_c": row.get("CampoC", "0"),
                        "campo_d": row.get("CampoD", "0"),
                        "campo_e": row.get("CampoE", "0"),
                        "codigo_segmento": codigo_segmento
                    }
                
                # Adicionar período e valor total diretamente do CSV
                periodo = {
                    "inicio": row.get("Data_da_operacao", ""),
                    "fim": row.get("DataFimFato", "")
                }
                valor_total = str(row.get("CampoA", "0"))
                print(f"[DEBUG] Valor total extraído: {valor_total} (tipo: {type(valor_total)})")
                parsed["periodo"] = periodo
                parsed["valor_total"] = valor_total
                
                # Informações de localização da agência
                cidade_agencia = row.get("CidadeAgencia", "")
                uf_agencia = row.get("UFAgencia", "")
                
                comunicacao = {
                    "id": len(comunicacoes_processadas) + 1,
                    "banco": row.get("nomeComunicante", ""),
                    "data": row.get("Data_da_operacao", ""),
                    "informacoes_adicionais": info,
                    "parsing_json": parsed,
                    "codigo_segmento": row.get("CodigoSegmento", ""),
                    "cidade_agencia": cidade_agencia,
                    "uf_agencia": uf_agencia,
                    "titular": titular_nome,
                    "cpf": titular_cpf,
                    "ocorrencia": ocorrencia_map.get(row.get("NumeroOcorrenciaBC", ""), "")
                }
                comunicacoes_processadas.append(comunicacao)
        
        # Armazenar dados processados para o usuário
        comunicacoes_data[usuario] = comunicacoes_processadas
        
        print(f"[DEBUG] Processamento concluído. {len(comunicacoes_processadas)} comunicações processadas.")
        
    except Exception as e:
        print(f"Erro ao processar upload: {e}")
        return {"success": False, "msg": f"Erro ao processar arquivos: {e}"}
    
    return {"success": True, "msg": "Arquivos enviados e processados com sucesso."}

@app.get("/api/dashboard-resumo")
def dashboard_resumo():
    # Para simplificar, vamos usar os dados do primeiro usuário disponível
    if not comunicacoes_data:
        return {"volume_total": 0, "num_comunicacoes": 0}
    
    # Pegar dados do primeiro usuário (em produção, seria baseado no usuário logado)
    usuario = list(comunicacoes_data.keys())[0]
    comunicacoes = comunicacoes_data[usuario]
    
    # Total de comunicações
    total_comunicacoes = len(comunicacoes)
    
    # Volume total analisado
    volume_total = 0.0
    for c in comunicacoes:
        try:
            parsed = c["parsing_json"]
            for campo in ["campo_a", "campo_b", "campo_c", "campo_d", "campo_e"]:
                valor = parsed.get(campo)
                if valor:
                    try:
                        volume_total += limpa_valor(valor)
                    except:
                        pass
        except:
            pass
    
    return {
        "volume_total": volume_total,
        "num_comunicacoes": total_comunicacoes
    }

@app.get("/api/comunicacoes")
def listar_comunicacoes():
    # Para simplificar, vamos usar os dados do primeiro usuário disponível
    if not comunicacoes_data:
        return []
    
    # Pegar dados do primeiro usuário (em produção, seria baseado no usuário logado)
    usuario = list(comunicacoes_data.keys())[0]
    comunicacoes = comunicacoes_data[usuario]
    
    agrupadas = {}
    for c in comunicacoes:
        indexador = c["data"]
        if not indexador:
            continue
        if indexador not in agrupadas:
            periodo = c["parsing_json"].get("periodo")
            valor_total = c["parsing_json"].get("valor_total", "0")
            try:
                valor_total = limpa_valor(valor_total)
            except:
                valor_total = 0.0
            agrupadas[indexador] = {
                "id": c["id"],
                "titular": c["titular"],
                "cpf": c["cpf"],
                "banco": c["banco"],
                "codigo_segmento": c["codigo_segmento"] or "41",
                "periodo": periodo,
                "valor": valor_total,
                "data": indexador,
                "localizacao": {
                    "cidade": c["cidade_agencia"],
                    "uf": c["uf_agencia"]
                }
            }
    return list(agrupadas.values())

@app.get("/api/comunicacao/{id}")
def detalhe_comunicacao(id: int = Path(...)):
    # Para simplificar, vamos usar os dados do primeiro usuário disponível
    if not comunicacoes_data:
        return {"erro": "Comunicação não encontrada"}
    
    # Pegar dados do primeiro usuário (em produção, seria baseado no usuário logado)
    usuario = list(comunicacoes_data.keys())[0]
    comunicacoes = comunicacoes_data[usuario]
    
    c = next((com for com in comunicacoes if com["id"] == id), None)
    if not c:
        return {"erro": "Comunicação não encontrada"}
    
    parsed = c["parsing_json"]
    codigo_segmento = c["codigo_segmento"] or "41"  # Default para compatibilidade
    
    # Estrutura base da resposta
    response = {
        "id": c["id"],
        "titular": c["titular"],
        "cpf": c["cpf"],
        "banco": c["banco"],
        "codigo_segmento": codigo_segmento,
        "informacoes_adicionais": c["informacoes_adicionais"],
        "parsing_json": parsed,
        "localizacao": {
            "cidade": c["cidade_agencia"],
            "uf": c["uf_agencia"]
        }
    }
    
    # Tratamento específico por código de segmento
    if codigo_segmento == "41":
        # SFN-Atípicas: Usar parser bancário individual
        periodo = parsed.get("periodo")
        valor_total = parsed.get("valor_total", "0")
        try:
            valor_total = limpa_valor(valor_total)
        except:
            valor_total = 0.0
        
        response.update({
            "tipo": "SFN-Atípicas",
            "periodo": periodo,
            "valor": valor_total,
            "detalhes_parsing": parsed
        })
        
    elif codigo_segmento == "42":
        # SFN-Espécie: Detalhar valores e informações
        campo_a = parsed.get("campo_a", "0")
        campo_b = parsed.get("campo_b", "0")
        campo_c = parsed.get("campo_c", "0")
        campo_d = parsed.get("campo_d", "0")
        campo_e = parsed.get("campo_e", "0")
        
        response.update({
            "tipo": "SFN-Espécie",
            "valores": {
                "campo_a": campo_a,
                "campo_b": campo_b,
                "campo_c": campo_c,
                "campo_d": campo_d,
                "campo_e": campo_e
            },
            "significados": get_significados_campos(codigo_segmento)
        })
        
    else:
        # Outros códigos: Seguir padrão do código 42
        campo_a = parsed.get("campo_a", "0")
        campo_b = parsed.get("campo_b", "0")
        campo_c = parsed.get("campo_c", "0")
        campo_d = parsed.get("campo_d", "0")
        campo_e = parsed.get("campo_e", "0")
        
        response.update({
            "tipo": f"Segmento {codigo_segmento}",
            "valores": {
                "campo_a": campo_a,
                "campo_b": campo_b,
                "campo_c": campo_c,
                "campo_d": campo_d,
                "campo_e": campo_e
            },
            "significados": get_significados_campos(codigo_segmento)
        })
    
    return response

@app.get("/api/estatisticas")
def estatisticas():
    """Retorna estatísticas detalhadas das comunicações"""
    # Para simplificar, vamos usar os dados do primeiro usuário disponível
    if not comunicacoes_data:
        return {
            "total_comunicacoes": 0,
            "total_valor": 0,
            "bancos": {},
            "media_valor": 0
        }
    
    # Pegar dados do primeiro usuário (em produção, seria baseado no usuário logado)
    usuario = list(comunicacoes_data.keys())[0]
    comunicacoes = comunicacoes_data[usuario]
    
    # Estatísticas por banco
    bancos = {}
    total_valor = 0.0
    total_comunicacoes = len(comunicacoes)
    
    for c in comunicacoes:
        banco = c["banco"] or "Não identificado"
        if banco not in bancos:
            bancos[banco] = {"count": 0, "valor_total": 0.0}
        
        bancos[banco]["count"] += 1
        
        try:
            parsed = c["parsing_json"]
            valor = parsed.get("valor_total", 0)
            if isinstance(valor, str):
                valor = limpa_valor(valor)
            elif isinstance(valor, (int, float)):
                valor = float(valor)
            else:
                valor = 0.0
            bancos[banco]["valor_total"] += valor
            total_valor += valor
        except:
            pass
    
    return {
        "total_comunicacoes": total_comunicacoes,
        "total_valor": total_valor,
        "bancos": bancos,
        "media_valor": total_valor / total_comunicacoes if total_comunicacoes > 0 else 0
    }

@app.get("/api/health")
def health_check():
    """Verifica a saúde da aplicação"""
    try:
        # Testar se há dados processados
        total_comunicacoes = sum(len(comunicacoes) for comunicacoes in comunicacoes_data.values())
        
        return {
            "status": "healthy",
            "database": "not_used",
            "registros": {
                "comunicacoes": total_comunicacoes,
                "usuarios": len(comunicacoes_data)
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        } 