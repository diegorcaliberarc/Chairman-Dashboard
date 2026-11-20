from __future__ import annotations

import socket
import sys
from pathlib import Path
from typing import Any, Generator

import pytest

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.store import STORE  # noqa: E402

SCRUBBED_SECRET_KEYS = (
    "DATABASE_URL",
    "DIRECT_URL",
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GOOGLE_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "PLAID_CLIENT_ID",
    "PLAID_SECRET",
    "GOOGLE_CLIENT_SECRET",
)

ALLOWED_LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1", "testserver"}


@pytest.fixture(autouse=True)
def enforce_production_and_spend_isolation(
    monkeypatch: pytest.MonkeyPatch,
) -> Generator[None, None, None]:
    """
    Keiji Kanazawa Production & Spend Isolation Fixture:
    1. Scrubs live .env credentials from os.environ for every test.
    2. Resets in-memory contract state before each test.
    3. Blocks any non-loopback TCP socket connection so tests can never hit
       live Supabase, Stripe, Plaid, or external LLM inference APIs.
    """
    for key in SCRUBBED_SECRET_KEYS:
        monkeypatch.setenv(key, "")
    monkeypatch.setenv("CHAIRMAN_TEST_ISOLATION", "1")

    STORE.reset()

    original_create_connection = socket.create_connection

    def guarded_create_connection(address: Any, *args: Any, **kwargs: Any) -> socket.socket:
        host = address[0] if isinstance(address, tuple) and address else str(address)
        if host not in ALLOWED_LOOPBACK_HOSTS:
            raise RuntimeError(
                f"[SPEND_ISOLATION_VIOLATION] Blocked live outbound TCP connection to '{host}' during pytest."
            )
        return original_create_connection(address, *args, **kwargs)

    monkeypatch.setattr(socket, "create_connection", guarded_create_connection)
    yield
