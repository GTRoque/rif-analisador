from fastapi import FastAPI, Depends, UploadFile, File, Form, Path
from fastapi.middleware.cors import CORSMiddleware
from app.parsing_router import router as parsing_router
from app.auth import validar_usuario
import shutil
import os
from fastapi.responses import JSONResponse
import csv
from app.database import get_engine
from app.models import Comunicacao, Envolvido, Ocorrencia, Base
from sqlalchemy.orm import sessionmaker
import chardet
from parsers import bradesco, bb, nubank, parser_generico
import json
from sqlalchemy import func

app = FastAPI(title="RIF Analisador API")

# Configuração de CORS para permitir frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parsing_router, prefix="/api")

@app.get("/ping")
def ping():
    return {"status": "ok"}

@app.post("/login")
def login(usuario: str = Form(...), senha: str = Form(...)):
    if validar_usuario(usuario, senha):
        return {"success": True, "usuario": usuario}
    return {"success": False, "erro": "Usuário ou senha inválidos."}

def detect_encoding(file_path):
    with open(file_path, 'rb') as f:
        result = chardet.detect(f.read())
    return result['encoding'] or 'utf-8'

@app.post("/upload")
def upload_arquivos(
    comunicacoes: UploadFile = File(...),
    envolvidos: UploadFile = File(...),
    ocorrencias: UploadFile = File(...),
    usuario: str = Form(...)
):
    pasta_upload = f"backend/database/uploads/{usuario}"
    os.makedirs(pasta_upload, exist_ok=True)
    for arquivo, nome in zip([comunicacoes, envolvidos, ocorrencias], ["Comunicacoes.csv", "Envolvidos.csv", "Ocorrencias.csv"]):
        caminho = os.path.join(pasta_upload, nome)
        with open(caminho, "wb") as buffer:
            shutil.copyfileobj(arquivo.file, buffer)
    enc_com = detect_encoding(os.path.join(pasta_upload, "Comunicacoes.csv"))
    enc_env = detect_encoding(os.path.join(pasta_upload, "Envolvidos.csv"))
    enc_oco = detect_encoding(os.path.join(pasta_upload, "Ocorrencias.csv"))
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        session.query(Comunicacao).delete()
        session.query(Envolvido).delete()
        session.query(Ocorrencia).delete()
        session.commit()
        # Mapear Envolvidos por Indexador
        envolvido_map = {}
        with open(os.path.join(pasta_upload, "Envolvidos.csv"), encoding=enc_env) as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                indexador = row.get("Indexador", "")
                tipo = (row.get("tipoEnvolvido", "") or "").strip().lower()
                if tipo == "titular":
                    envolvido_map[indexador] = {
                        "nome": row.get("nomeEnvolvido", ""),
                        "cpf": row.get("cpfCnpjEnvolvido", "")
                    }
                envolvido = Envolvido(
                    nome=row.get("nomeEnvolvido", ""),
                    cpf=row.get("cpfCnpjEnvolvido", "")
                )
                session.add(envolvido)
                session.flush()
        session.commit()
        # Ocorrências (sem alteração)
        ocorrencia_map = {}
        with open(os.path.join(pasta_upload, "Ocorrencias.csv"), encoding=enc_oco) as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                ocorrencia = Ocorrencia(descricao=row.get("Ocorrencia", ""))
                session.add(ocorrencia)
                session.flush()
                ocorrencia_map[row.get("idOcorrencia", "")]=ocorrencia.id
        session.commit()
        # Comunicações
        with open(os.path.join(pasta_upload, "Comunicacoes.csv"), encoding=enc_com) as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                indexador = row.get("Indexador", "")
                titular_nome = envolvido_map.get(indexador, {}).get("nome", "")
                titular_cpf = envolvido_map.get(indexador, {}).get("cpf", "")
                envolvido_id = None
                env = session.query(Envolvido).filter_by(nome=titular_nome, cpf=titular_cpf).first()
                if env:
                    envolvido_id = env.id
                ocorrencia_id = None
                num_ocorrencia = row.get("NumeroOcorrenciaBC", "")
                if num_ocorrencia in ocorrencia_map:
                    ocorrencia_id = ocorrencia_map[num_ocorrencia]
                info = row.get("informacoesAdicionais", "")
                banco_nome = (row.get("nomeComunicante") or "").lower().replace(".", "").replace(",", "").replace("-", "").replace("  ", " ").strip()
                # Parsing do campo informacoesAdicionais
                if "bradesco" in banco_nome:
                    parsed = bradesco.parse_bradesco(info)
                elif "banco do brasil" in banco_nome or (banco_nome.split() and banco_nome.split()[0] == "bb"):
                    parsed = bb.parse_bb(info)
                elif "nubank" in banco_nome or "nu pagamentos" in banco_nome:
                    parsed = nubank.parse_nubank(info)
                else:
                    parsed = parser_generico.parse_generico(info)
                # Adicionar período e valor total diretamente do CSV
                periodo = {
                    "inicio": row.get("Data_da_operacao", ""),
                    "fim": row.get("DataFimFato", "")
                }
                valor_total = row.get("CampoA", "0")
                parsed["periodo"] = periodo
                parsed["valor_total"] = valor_total
                comunicacao = Comunicacao(
                    banco=row.get("nomeComunicante", ""),
                    data=row.get("Data_da_operacao", ""),
                    informacoes_adicionais=info,
                    parsing_json=json.dumps(parsed, ensure_ascii=False),
                    envolvido_id=envolvido_id,
                    ocorrencia_id=ocorrencia_id
                )
                session.add(comunicacao)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"Erro ao processar upload: {e}")
        return {"success": False, "msg": f"Erro ao processar arquivos: {e}"}
    finally:
        session.close()
    return {"success": True, "msg": "Arquivos enviados e processados com sucesso."}

@app.get("/api/dashboard-resumo")
def dashboard_resumo():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        # Total de comunicações = total de Indexadores únicos
        indexadores = session.query(Comunicacao).with_entities(Comunicacao.data).all()
        total_comunicacoes = len(set([c.data for c in indexadores if c.data]))
        # Volume total analisado (soma dos valores dos campos CampoA, CampoB, etc, se existirem no parsing_json)
        comunicacoes = session.query(Comunicacao).all()
        volume_total = 0.0
        for c in comunicacoes:
            try:
                parsed = json.loads(c.parsing_json) if c.parsing_json else {}
                for campo in ["CampoA", "CampoB", "CampoC", "CampoD", "CampoE"]:
                    valor = parsed.get(campo)
                    if valor:
                        try:
                            volume_total += float(str(valor).replace('.', '').replace(',', '.'))
                        except:
                            pass
            except:
                pass
        return {
            "volume_total": volume_total,
            "num_comunicacoes": total_comunicacoes
        }
    finally:
        session.close()

@app.get("/api/comunicacoes")
def listar_comunicacoes():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        comunicacoes = session.query(Comunicacao).all()
        agrupadas = {}
        for c in comunicacoes:
            indexador = c.data
            if not indexador:
                continue
            if indexador not in agrupadas:
                envolvido = session.query(Envolvido).filter_by(id=c.envolvido_id).first()
                parsed = json.loads(c.parsing_json) if c.parsing_json else {}
                periodo = parsed.get("periodo")
                valor_total = parsed.get("valor_total")
                try:
                    valor_total = float(str(valor_total).replace('.', '').replace(',', '.'))
                except:
                    valor_total = 0.0
                agrupadas[indexador] = {
                    "id": c.id,
                    "titular": envolvido.nome if envolvido else None,
                    "cpf": envolvido.cpf if envolvido else None,
                    "banco": c.banco,
                    "periodo": periodo,
                    "valor": valor_total,
                    "data": indexador
                }
        return list(agrupadas.values())
    finally:
        session.close()

@app.get("/api/comunicacao/{id}")
def detalhe_comunicacao(id: int = Path(...)):
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        c = session.query(Comunicacao).filter_by(id=id).first()
        if not c:
            return {"erro": "Comunicação não encontrada"}
        envolvido = session.query(Envolvido).filter_by(id=c.envolvido_id).first()
        parsed = json.loads(c.parsing_json) if c.parsing_json else {}
        periodo = parsed.get("periodo")
        valor_total = parsed.get("valor_total")
        try:
            valor_total = float(str(valor_total).replace('.', '').replace(',', '.'))
        except:
            valor_total = 0.0
        return {
            "id": c.id,
            "titular": envolvido.nome if envolvido else None,
            "cpf": envolvido.cpf if envolvido else None,
            "banco": c.banco,
            "periodo": periodo,
            "valor": valor_total,
            "parsing_json": parsed
        }
    finally:
        session.close() 