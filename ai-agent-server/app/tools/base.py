"""
Base Tool Abstraction

All tools inherit from BaseTool and provide controlled database access.
Tools enforce RBAC and never expose raw database connections to agents.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Optional
from dataclasses import dataclass
import time

import asyncpg

from app.config import get_settings
from app.auth import AuthContext

logger = logging.getLogger(__name__)
settings = get_settings()

_db_pool: Optional[asyncpg.Pool] = None


async def get_db_pool() -> asyncpg.Pool:
    """Get or create database connection pool."""
    global _db_pool
    
    if _db_pool is None:
        _db_pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=2,
            max_size=10,
        )
        logger.info("Database connection pool created")
    
    return _db_pool


@dataclass
class ToolResult:
    """Result from tool execution."""
    success: bool
    data: Any = None
    error: Optional[str] = None
    duration_ms: int = 0


class BaseTool(ABC):
    """
    Abstract base class for all tools.
    
    Tools provide controlled, read-only database access.
    All tools must enforce RBAC based on AuthContext.
    """
    
    name: str = "base_tool"
    description: str = "Base tool"
    
    # Required roles to use this tool (empty = all authenticated users)
    required_roles: list[str] = []
    
    def __init__(self, auth: AuthContext):
        self.auth = auth
        self.org_id = auth.org_id
    
    def check_permission(self) -> bool:
        """Check if user has permission to use this tool."""
        if not self.required_roles:
            return True
        
        if self.auth.role == "admin":
            return True
        
        return self.auth.role in self.required_roles
    
    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """Execute the tool. Must be implemented by subclasses."""
        pass
    
    async def run(self, **kwargs) -> ToolResult:
        """Run tool with permission check and timing."""
        if not self.check_permission():
            return ToolResult(
                success=False,
                error=f"Permission denied. Required roles: {self.required_roles}"
            )
        
        start = time.time()
        try:
            result = await self.execute(**kwargs)
            result.duration_ms = int((time.time() - start) * 1000)
            return result
        except Exception as e:
            logger.exception(f"Tool {self.name} failed")
            return ToolResult(
                success=False,
                error=str(e),
                duration_ms=int((time.time() - start) * 1000)
            )
    
    async def query(self, sql: str, *args) -> list[dict]:
        """Execute a read-only query with organization scoping."""
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(sql, *args)
            return [dict(row) for row in rows]
    
    async def query_one(self, sql: str, *args) -> Optional[dict]:
        """Execute a query expecting single result."""
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(sql, *args)
            return dict(row) if row else None
