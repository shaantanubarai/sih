from typing import Protocol


class SignatureProvider(Protocol):
    def sign(self, document_hash: str, signer_id: str, version_id: str) -> str: ...

    def verify(self, document_hash: str, signer_id: str, version_id: str, signature: str) -> bool: ...


class MockHmacSignatureProvider:
    """
    Demonstration-only signature. Not legally valid. Not a qualified electronic signature.
    """

    def __init__(self, secret: str) -> None:
        self.secret = secret

    def sign(self, document_hash: str, signer_id: str, version_id: str) -> str:
        import hmac
        from hashlib import sha256

        msg = f"{document_hash}:{signer_id}:{version_id}".encode()
        return hmac.new(self.secret.encode(), msg, sha256).hexdigest()

    def verify(self, document_hash: str, signer_id: str, version_id: str, signature: str) -> bool:
        expected = self.sign(document_hash, signer_id, version_id)
        import hmac

        return hmac.compare_digest(expected, signature)


def get_signature_provider() -> SignatureProvider:
    from app.core.config import get_settings

    return MockHmacSignatureProvider(get_settings().secret_key)
