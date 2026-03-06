# audit_service/db/engine.py  ← MOCK VERSION
import logging
from contextlib import contextmanager
from typing import Generator

logger = logging.getLogger(__name__)

@contextmanager
def get_db() -> Generator[None, None, None]:
    """
    Fake DB session — just yields None but keeps FastAPI happy.
    """
    logger.info("[MOCK DB] get_db() called")
    try:
        yield None
    finally:
        logger.info("[MOCK DB] session closed")

def init_db() -> None:
    """
    Pretend to create tables.
    """
    logger.info("[MOCK DB] init_db() — tables would be created")