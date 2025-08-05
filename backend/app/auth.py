import sqlite3
from typing import Optional
from ldap3 import Server, Connection, ALL, NTLM

LDAP_DOMAIN = "pcrn.local"
LDAP_URL = "ldap://10.9.0.4"
LDAP_PORT = 389

# Credenciais de teste para desenvolvimento
TEST_USERS = {
    "admin": "admin123",
    "usuario": "senha123",
    "teste": "teste123",
    "gustavo": "gustavo123",
    "antonio": "antonio123",
    "fabio": "fabio123",
    "oscar": "oscar123"
}

def validar_usuario(usuario: str, senha: str) -> bool:
    # Primeiro, verificar se é um usuário de teste
    if usuario in TEST_USERS and TEST_USERS[usuario] == senha:
        print(f"✅ Usuário de teste autenticado: {usuario}")
        return True
    
    # Se não for usuário de teste, tentar LDAP
    user_dn = f"{LDAP_DOMAIN}\\{usuario}"
    try:
        server = Server(LDAP_URL, port=LDAP_PORT, get_info=ALL)
        conn = Connection(server, user=user_dn, password=senha, authentication=NTLM, auto_bind=True)
        conn.unbind()
        print(f"✅ Usuário LDAP autenticado: {usuario}")
        return True
    except Exception as e:
        print(f"❌ Erro de autenticação LDAP: {e}")
    return False 