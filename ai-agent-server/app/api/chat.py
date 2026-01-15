"""
WebSocket Chat Endpoint

Production WebSocket handler for real-time AI chat.
Supports streaming, cancellation, and error propagation.
"""

import logging
import json
import uuid
from typing import Optional
from enum import Enum

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.auth import authenticate_websocket, AuthContext
from app.agents import execute_router, AgentState, ExecutionContext
from app.agents.base import create_initial_state
from app.memory import RedisMemoryStore

logger = logging.getLogger(__name__)
router = APIRouter()


class MessageType(str, Enum):
    """WebSocket message types."""
    # Client -> Server
    MESSAGE = "message"
    CANCEL = "cancel"
    
    # Server -> Client
    STREAM = "stream"
    COMPLETE = "complete"
    TOOL_UPDATE = "tool_update"
    ERROR = "error"
    CONNECTED = "connected"


class ConnectionManager:
    """Manages active WebSocket connections."""
    
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.cancelled: set[str] = set()
    
    async def connect(self, connection_id: str, websocket: WebSocket) -> None:
        """Accept and register connection."""
        await websocket.accept()
        self.active_connections[connection_id] = websocket
    
    def disconnect(self, connection_id: str) -> None:
        """Remove connection."""
        self.active_connections.pop(connection_id, None)
        self.cancelled.discard(connection_id)
    
    async def send_json(self, connection_id: str, data: dict) -> None:
        """Send JSON message."""
        if ws := self.active_connections.get(connection_id):
            await ws.send_json(data)
    
    def cancel(self, connection_id: str) -> None:
        """Mark connection as cancelled."""
        self.cancelled.add(connection_id)
    
    def is_cancelled(self, connection_id: str) -> bool:
        """Check if connection is cancelled."""
        return connection_id in self.cancelled


manager = ConnectionManager()


@router.websocket("/chat")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint for AI chat.
    
    Connection: ws://host/ws/chat?token=xxx&org_id=123
    
    Client -> Server messages:
    - {"type": "message", "content": "Hello"}
    - {"type": "cancel"}
    
    Server -> Client messages:
    - {"type": "connected", "session_id": "xxx"}
    - {"type": "stream", "delta": "text chunk"}
    - {"type": "tool_update", "tool": "name", "status": "running|complete"}
    - {"type": "complete", "output": {...structured output...}}
    - {"type": "error", "message": "error text"}
    """
    connection_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    auth: Optional[AuthContext] = None
    
    try:
        # Authenticate
        auth = await authenticate_websocket(websocket)
        
        # Register connection
        await manager.connect(connection_id, websocket)
        
        # Send connected confirmation
        await manager.send_json(connection_id, {
            "type": MessageType.CONNECTED,
            "session_id": session_id,
            "org_id": auth.org_id,
            "user_id": auth.user_id,
        })
        
        logger.info(f"WebSocket connected: {connection_id}, user={auth.user_id}")
        
        # Message loop
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == MessageType.CANCEL:
                manager.cancel(connection_id)
                await manager.send_json(connection_id, {
                    "type": MessageType.ERROR,
                    "message": "Request cancelled"
                })
                continue
            
            if msg_type == MessageType.MESSAGE:
                content = data.get("content", "").strip()
                
                if not content:
                    await manager.send_json(connection_id, {
                        "type": MessageType.ERROR,
                        "message": "Empty message"
                    })
                    continue
                
                # Process message
                await process_message(
                    connection_id=connection_id,
                    session_id=session_id,
                    auth=auth,
                    content=content,
                )
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {connection_id}")
    except Exception as e:
        logger.exception(f"WebSocket error: {connection_id}")
        try:
            await manager.send_json(connection_id, {
                "type": MessageType.ERROR,
                "message": str(e)
            })
        except:
            pass
    finally:
        manager.disconnect(connection_id)


async def process_message(
    connection_id: str,
    session_id: str,
    auth: AuthContext,
    content: str,
) -> None:
    """Process a chat message through the agent pipeline."""
    message_id = str(uuid.uuid4())
    
    try:
        # Check for cancellation
        if manager.is_cancelled(connection_id):
            return
        
        # Create execution context
        context = ExecutionContext(
            auth=auth,
            session_id=session_id,
            message_id=message_id,
        )
        
        # Create initial state
        state = create_initial_state(content, context)
        
        # Send tool update
        await manager.send_json(connection_id, {
            "type": MessageType.TOOL_UPDATE,
            "tool": "router",
            "status": "classifying intent"
        })
        
        # Execute router
        result = await execute_router(state)
        
        # Check for cancellation
        if manager.is_cancelled(connection_id):
            return
        
        # Check for errors
        if result.get("error"):
            await manager.send_json(connection_id, {
                "type": MessageType.ERROR,
                "message": result["error"]
            })
            return
        
        # Send complete response
        await manager.send_json(connection_id, {
            "type": MessageType.COMPLETE,
            "message_id": message_id,
            "output": result.get("output", {})
        })
        
        logger.info(f"Message processed: {message_id}")
    
    except Exception as e:
        logger.exception(f"Error processing message: {message_id}")
        await manager.send_json(connection_id, {
            "type": MessageType.ERROR,
            "message": f"Processing error: {str(e)}"
        })
