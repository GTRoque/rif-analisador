#!/usr/bin/env python3
"""
Script para atualizar o banco de dados existente com o novo campo codigo_segmento
"""

import sqlite3
import os

def update_database():
    """Atualiza o banco de dados para incluir o campo codigo_segmento"""
    
    # Caminho do banco de dados
    db_path = "backend/database/dados.db"
    
    if not os.path.exists(db_path):
        print(f"Banco de dados não encontrado em: {db_path}")
        return
    
    try:
        # Conectar ao banco
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(comunicacoes)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'codigo_segmento' not in columns:
            print("Adicionando coluna codigo_segmento...")
            cursor.execute("ALTER TABLE comunicacoes ADD COLUMN codigo_segmento TEXT")
            
            # Definir valor padrão "41" para registros existentes
            cursor.execute("UPDATE comunicacoes SET codigo_segmento = '41' WHERE codigo_segmento IS NULL")
            
            conn.commit()
            print("Coluna codigo_segmento adicionada com sucesso!")
        else:
            print("Coluna codigo_segmento já existe.")
        
        # Verificar estrutura atual da tabela
        cursor.execute("PRAGMA table_info(comunicacoes)")
        print("\nEstrutura atual da tabela comunicacoes:")
        for column in cursor.fetchall():
            print(f"  {column[1]} ({column[2]})")
        
        conn.close()
        print("\nAtualização concluída!")
        
    except Exception as e:
        print(f"Erro ao atualizar banco de dados: {e}")

if __name__ == "__main__":
    update_database() 