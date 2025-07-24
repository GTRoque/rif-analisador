import sqlite3
from typing import Optional
from ldap3 import Server, Connection, ALL, NTLM

LDAP_DOMAIN = "pcrn.local"
LDAP_URL = "ldap://10.9.0.4"
LDAP_PORT = 389

# Exemplo: usuario = "usuario", senha = "senha123"
def validar_usuario(usuario: str, senha: str) -> bool:
    user_dn = f"{LDAP_DOMAIN}\\{usuario}"
    try:
        server = Server(LDAP_URL, port=LDAP_PORT, get_info=ALL)
        conn = Connection(server, user=user_dn, password=senha, authentication=NTLM, auto_bind=True)
        conn.unbind()
        return True
    except Exception as e:
        print(f"Erro de autenticação LDAP: {e}")
    return False 