"""
Conexión a PostgreSQL usando asyncpg.
Inicializa la tabla cart_items al arrancar.
"""
import os
import asyncpg

_pool = None

DB_DSN = (
    f"postgresql://{os.environ['DB_USER']}:{os.environ['DB_PASSWORD']}"
    f"@{os.environ['DB_HOST']}:{os.environ.get('DB_PORT', '5432')}/{os.environ['DB_NAME']}"
)


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(dsn=DB_DSN, min_size=1, max_size=5)
    return _pool


async def init_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS cart_items (
                id          SERIAL PRIMARY KEY,
                user_id     INTEGER NOT NULL,
                product_id  INTEGER NOT NULL,
                quantity    INTEGER NOT NULL CHECK (quantity > 0),
                created_at  TIMESTAMP DEFAULT NOW(),
                UNIQUE (user_id, product_id)
            )
        """)
    print("Base de datos inicializada")
