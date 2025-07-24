from fastapi import APIRouter, HTTPException
from typing import Dict
from parsers import bradesco, bb, nubank, parser_generico

router = APIRouter()

@router.post("/parse/{banco}")
def parse_informacoes(banco: str, payload: Dict[str, str]):
    texto = payload.get("texto", "")
    if not texto:
        raise HTTPException(status_code=400, detail="Campo 'texto' é obrigatório.")
    if banco.lower() == "bradesco":
        return bradesco.parse_bradesco(texto)
    elif banco.lower() in ["bb", "banco do brasil"]:
        return bb.parse_bb(texto)
    elif banco.lower() == "nubank":
        return nubank.parse_nubank(texto)
    else:
        return parser_generico.parse_generico(texto) 