import unittest
from fastapi import HTTPException
from backend.app.core.security import (
    UserPayload,
    verify_firebase_token,
    get_current_user,
    require_admin,
)

class TestSecurityModule(unittest.TestCase):
    def test_dev_token_researcher_resolution(self):
        claims = verify_firebase_token("dev-token-researcher")
        self.assertEqual(claims["role"], "RESEARCHER")
        self.assertIn("researcher", claims["email"])

    def test_dev_token_admin_resolution(self):
        claims = verify_firebase_token("dev-token-admin")
        self.assertEqual(claims["role"], "ADMIN")
        self.assertIn("admin", claims["email"])

    def test_require_admin_guard_blocks_researcher(self):
        researcher = UserPayload(
            firebase_uid="res-01",
            email="researcher@pharmalens.io",
            role="RESEARCHER",
        )
        self.assertFalse(researcher.is_admin)
        with self.assertRaises(HTTPException) as ctx:
            require_admin(researcher)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("privilege", ctx.exception.detail.lower())

    def test_require_admin_guard_permits_admin(self):
        admin = UserPayload(
            firebase_uid="adm-01",
            email="admin@pharmalens.io",
            role="ADMIN",
        )
        self.assertTrue(admin.is_admin)
        passed_user = require_admin(admin)
        self.assertEqual(passed_user.firebase_uid, "adm-01")
        self.assertEqual(passed_user.role, "ADMIN")


if __name__ == "__main__":
    unittest.main()
