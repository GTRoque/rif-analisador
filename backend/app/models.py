from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class Usuario(Base):
    __tablename__ = 'usuarios'
    id = Column(Integer, primary_key=True)
    usuario = Column(String, unique=True, nullable=False)
    senha = Column(String, nullable=False)

class Comunicacao(Base):
    __tablename__ = 'comunicacoes'
    id = Column(Integer, primary_key=True)
    banco = Column(String)
    data = Column(String)
    informacoes_adicionais = Column(Text)
    parsing_json = Column(Text)  # JSON estruturado extraído
    codigo_segmento = Column(String)  # Código do segmento (41, 42, 37, etc.)
    cidade_agencia = Column(String)  # Cidade da agência
    uf_agencia = Column(String)  # UF da agência
    envolvido_id = Column(Integer, ForeignKey('envolvidos.id'))
    ocorrencia_id = Column(Integer, ForeignKey('ocorrencias.id'))
    envolvido = relationship('Envolvido', back_populates='comunicacoes')
    ocorrencia = relationship('Ocorrencia', back_populates='comunicacoes')

class Envolvido(Base):
    __tablename__ = 'envolvidos'
    id = Column(Integer, primary_key=True)
    nome = Column(String)
    cpf = Column(String)
    comunicacoes = relationship('Comunicacao', back_populates='envolvido')

class Ocorrencia(Base):
    __tablename__ = 'ocorrencias'
    id = Column(Integer, primary_key=True)
    descricao = Column(Text)
    comunicacoes = relationship('Comunicacao', back_populates='ocorrencia')

class ParsingCorrecao(Base):
    __tablename__ = 'parsing_correcoes'
    id = Column(Integer, primary_key=True)
    comunicacao_id = Column(Integer, ForeignKey('comunicacoes.id'))
    json_corrigido = Column(Text)  # Armazena o JSON corrigido como string
    usuario_id = Column(Integer, ForeignKey('usuarios.id'))
    data = Column(String) 