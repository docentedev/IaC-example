"""
Rutas del carrito de compras.

Patrón clave: GET /cart llama internamente a products-java para enriquecer
cada ítem con los datos reales del producto (nombre, precio).
Esto demuestra comunicación inter-microservicio dentro del cluster de Kubernetes.
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import httpx

from .db import get_pool
from .auth import get_current_user

router = APIRouter(prefix="/cart", tags=["cart"])

# URL interna del microservicio de productos (DNS de Kubernetes).
# Dentro del cluster, 'products-java' resuelve al Service del mismo nombre.
PRODUCTS_BASE_URL = os.environ.get("PRODUCTS_SERVICE_URL", "http://products-java:4020")


# ── Schemas ──────────────────────────────────────────────────────────────────

class AddItemRequest(BaseModel):
    product_id: int
    quantity: int = 1

class UpdateQuantityRequest(BaseModel):
    quantity: int


# ── Helper: obtener un producto de products-java ──────────────────────────────

async def fetch_product(product_id: int) -> dict | None:
    """
    Llama a products-java internamente para obtener nombre y precio.
    Retorna None si el producto no existe.
    """
    async with httpx.AsyncClient(timeout=3.0) as client:
        try:
            r = await client.get(f"{PRODUCTS_BASE_URL}/api/products/{product_id}")
            if r.status_code == 200:
                return r.json()
        except httpx.RequestError:
            pass
    return None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/items", status_code=201)
async def add_item(
    body: AddItemRequest,
    user: dict = Depends(get_current_user),
):
    """Agrega o incrementa la cantidad de un producto en el carrito."""
    # Verificar que el producto existe antes de agregarlo.
    product = await fetch_product(body.product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    user_id = int(user["sub"])
    pool = await get_pool()

    async with pool.acquire() as conn:
        # INSERT ... ON CONFLICT actualiza la cantidad si ya existe el ítem.
        row = await conn.fetchrow("""
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, product_id)
            DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
            RETURNING id, product_id, quantity
        """, user_id, body.product_id, body.quantity)

    return {
        "message": "Producto agregado al carrito",
        "item": dict(row),
        "product": product,
    }


@router.get("")
async def get_cart(user: dict = Depends(get_current_user)):
    """
    Devuelve el carrito completo enriquecido con datos del producto.

    Para cada ítem llama a products-java:4020 (comunicación inter-microservicio).
    Incluye subtotal por ítem y total general.
    """
    user_id = int(user["sub"])
    pool    = await get_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, product_id, quantity FROM cart_items WHERE user_id = $1 ORDER BY id",
            user_id,
        )

    items = []
    total = 0.0

    for row in rows:
        product  = await fetch_product(row["product_id"])
        price    = float(product["price"]) if product else 0.0
        subtotal = round(price * row["quantity"], 2)
        total   += subtotal

        items.append({
            "id":         row["id"],
            "product_id": row["product_id"],
            "quantity":   row["quantity"],
            "product":    product,
            "subtotal":   subtotal,
        })

    return {
        "user": {
            "id":       user["sub"],
            "username": user.get("username"),
            "email":    user.get("email"),
        },
        "items": items,
        "total": round(total, 2),
    }


@router.patch("/items/{product_id}")
async def update_quantity(
    product_id: int,
    body: UpdateQuantityRequest,
    user: dict = Depends(get_current_user),
):
    """Actualiza la cantidad de un ítem específico del carrito."""
    if body.quantity < 1:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")

    user_id = int(user["sub"])
    pool    = await get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE cart_items SET quantity = $1
            WHERE user_id = $2 AND product_id = $3
            RETURNING id, product_id, quantity
        """, body.quantity, user_id, product_id)

    if row is None:
        raise HTTPException(status_code=404, detail="Ítem no encontrado en el carrito")

    return {"message": "Cantidad actualizada", "item": dict(row)}


@router.delete("/items/{product_id}", status_code=204)
async def remove_item(
    product_id: int,
    user: dict = Depends(get_current_user),
):
    """Elimina un producto específico del carrito."""
    user_id = int(user["sub"])
    pool    = await get_pool()

    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2",
            user_id, product_id,
        )

    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Ítem no encontrado en el carrito")


@router.delete("", status_code=204)
async def clear_cart(user: dict = Depends(get_current_user)):
    """Vacía completamente el carrito del usuario."""
    user_id = int(user["sub"])
    pool    = await get_pool()

    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM cart_items WHERE user_id = $1",
            user_id,
        )
