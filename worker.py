from asgi import asgi_handler
from server import app

def on_fetch(request, env, ctx):
    return asgi_handler(request, app, env, ctx)