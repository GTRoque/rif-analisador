#!/usr/bin/env python3
"""
Script para inicializar o banco de dados do RIF Analisador
"""

from app.database import init_db
from app.models import Base
from sqlalchemy import create_engine
import os

def main():
    print("Inicializando banco de dados...")
    
    # Criar diretório database se não existir
    os.makedirs('database', exist_ok=True)
    
    # Inicializar banco
    engine = init_db()
    
    print("✅ Banco de dados inicializado com sucesso!")
    print("📁 Arquivo criado: backend/database/dados.db")
    print("🔗 Para acessar: sqlite3 backend/database/dados.db")

if __name__ == "__main__":
    main() 