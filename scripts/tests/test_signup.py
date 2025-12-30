from fastapi.testclient import TestClient
import sys
from pathlib import Path
import pytest

grandparent_dir = Path(__file__).resolve().parents[1]
sys.path.append(str(grandparent_dir))

import api # This import has to be right here.

client = TestClient(api.app)

@pytest.mark.skip(reason="Not needed right now.")
def test_signup():
    email_using = "testingtesting32@example.com"

    response = client.post(
        "/signup",
        json={"email": email_using, "password": "password123"}
    )

    assert response.status_code == 201