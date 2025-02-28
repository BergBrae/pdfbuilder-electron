"""
Main API router that includes all endpoint routers.
"""

from fastapi import APIRouter

from app.api.endpoints import documents, files, pdf_builder, rpt_extraction


api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(pdf_builder.router, prefix="/pdf", tags=["pdf"])
api_router.include_router(rpt_extraction.router, prefix="/rpt", tags=["rpt"])
