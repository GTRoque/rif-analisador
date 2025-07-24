from app.database import get_engine
from app.models import Usuario, Base
from sqlalchemy.orm import sessionmaker
import getpass

def criar_admin():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()
    usuario = input('Usuário admin: ')
    senha = getpass.getpass('Senha: ')
    admin = Usuario(usuario=usuario, senha=senha)
    session.add(admin)
    session.commit()
    print('Usuário admin criado com sucesso!')

if __name__ == '__main__':
    criar_admin() 