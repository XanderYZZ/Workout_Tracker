from fastapi.testclient import TestClient
import sys
from pathlib import Path
import pytest

grandparent_dir = Path(__file__).resolve().parents[1]
sys.path.append(str(grandparent_dir))

import backend.src.app as app # This import has to be right here.

client = TestClient(app.app)

@pytest.mark.skip(reason="Not needed right now.")
def test_signup():
    email_using = "testingtesting32@example.com"
    username_using = "testingtesting32"

    response = client.post(
        "/signup",
        json={"email": email_using, "username": username_using, "password": "password123"}
    )

    assert response.status_code == 201
