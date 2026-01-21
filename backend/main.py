# Cloudflare Workers Python backend

async def on_fetch(request, env, ctx):
    # Simple API response
    if request.url.path == "/api":
        return Response.json({"message": "Etho Parts API", "version": "1.0.0"})
    return Response.json({"error": "Not found"}, status=404)