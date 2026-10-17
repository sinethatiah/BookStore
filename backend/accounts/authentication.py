from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class OptionalJWTAuthentication(JWTAuthentication):
    """
    Treat an invalid or expired token as "no credentials" instead of
    rejecting the request. Public endpoints then work for everyone, and
    protected endpoints still return 401 through their permission classes.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            return None