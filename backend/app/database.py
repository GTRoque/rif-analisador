from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base
import os

def get_engine(db_path='backend/database/dados.db'):
    return create_engine(f'sqlite:///{db_path}', connect_args={"check_same_thread": False})

def init_db():
    os.makedirs('backend/database', exist_ok=True)
    engine = get_engine()
    Base.metadata.create_all(engine)
    return engine

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine()) 