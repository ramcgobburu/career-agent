"""
Simple static file server for privacy policy
Add this endpoint to serve privacy policy
"""

from fastapi.responses import FileResponse
from fastapi import APIRouter

router = APIRouter()

@router.get("/privacy-policy")
async def privacy_policy():
    """Serve privacy policy page"""
    return FileResponse("privacy_policy.html", media_type="text/html")
















