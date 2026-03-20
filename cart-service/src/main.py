"""
Punto de entrada del cart-service.
FastAPI con lifespan para inicializar la base de datos al arrancar.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .routes.cart import router as cart_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Cart Service",
    description="Microservicio de carrito de compras — consume product-service internamente",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cart_router)


@app.get("/cart/health")
async def health():
    return {"status": "ok", "service": "cart-service"}
