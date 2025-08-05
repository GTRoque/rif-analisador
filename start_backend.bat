@echo off
echo Iniciando Backend RIF Analisador...
cd backend
call venv\Scripts\activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
pause 