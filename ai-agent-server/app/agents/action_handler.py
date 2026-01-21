"""
Action Handler Module

Handles the execution of action tools with confirmation workflow.
This module provides utilities for agents to:
1. Detect if user wants to perform an action
2. Handle the confirmation workflow
3. Execute confirmed actions
"""

import re
from typing import Optional
from dataclasses import dataclass

from app.tools import ActionTool, ActionResult, ActionStatus


@dataclass
class ActionIntent:
    """Detected action intent from user message."""
    action_type: str  # create_order, update_stock, etc.
    is_confirmation: bool  # User said "yes" to previous action
    is_cancellation: bool  # User said "no" to previous action
    extracted_params: dict  # Any parameters extracted from message


# Patterns for detecting action intents
ACTION_PATTERNS = {
    "create_order": [
        r"create\s+(?:an?\s+)?order",
        r"place\s+(?:an?\s+)?order",
        r"new\s+order\s+for",
        r"order\s+(?:for|from)",
    ],
    "update_order_status": [
        r"update\s+order\s+(?:status|#?\d+)",
        r"change\s+order\s+status",
        r"mark\s+order\s+(?:as\s+)?(?:shipped|delivered|pending)",
        r"ship\s+order",
    ],
    "cancel_order": [
        r"cancel\s+order",
        r"cancel\s+#?\d+",
    ],
    "add_product": [
        r"add\s+(?:a\s+)?(?:new\s+)?product",
        r"create\s+(?:a\s+)?(?:new\s+)?product",
        r"new\s+product",
    ],
    "update_product": [
        r"update\s+product",
        r"change\s+product",
        r"modify\s+product",
        r"edit\s+product",
    ],
    "update_stock": [
        r"update\s+stock",
        r"set\s+stock",
        r"change\s+stock",
        r"adjust\s+(?:stock|inventory)",
        r"add\s+stock",
        r"remove\s+stock",
    ],
    "transfer_stock": [
        r"transfer\s+(?:stock|inventory)",
        r"move\s+(?:stock|inventory)",
        r"transfer\s+\d+\s+(?:units|items)",
    ],
}

CONFIRMATION_PATTERNS = [
    r"^yes$",
    r"^yes[,!.]",
    r"^yeah",
    r"^yep",
    r"^sure",
    r"^confirm",
    r"^do it",
    r"^proceed",
    r"^go ahead",
    r"^ok\s*$",
    r"^okay",
]

CANCELLATION_PATTERNS = [
    r"^no$",
    r"^no[,!.]",
    r"^nope",
    r"^cancel",
    r"^don't",
    r"^never\s*mind",
    r"^stop",
]


def detect_action_intent(user_message: str, pending_action: Optional[str] = None) -> Optional[ActionIntent]:
    """
    Detect if user message indicates an action intent.
    
    Args:
        user_message: The user's message
        pending_action: If there's a pending action awaiting confirmation
        
    Returns:
        ActionIntent if action detected, None otherwise
    """
    message_lower = user_message.lower().strip()
    
    # Check for confirmation/cancellation if there's a pending action
    if pending_action:
        for pattern in CONFIRMATION_PATTERNS:
            if re.search(pattern, message_lower, re.IGNORECASE):
                return ActionIntent(
                    action_type=pending_action,
                    is_confirmation=True,
                    is_cancellation=False,
                    extracted_params={}
                )
        
        for pattern in CANCELLATION_PATTERNS:
            if re.search(pattern, message_lower, re.IGNORECASE):
                return ActionIntent(
                    action_type=pending_action,
                    is_confirmation=False,
                    is_cancellation=True,
                    extracted_params={}
                )
    
    # Check for new action intents
    for action_type, patterns in ACTION_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, message_lower, re.IGNORECASE):
                params = extract_action_params(message_lower, action_type)
                return ActionIntent(
                    action_type=action_type,
                    is_confirmation=False,
                    is_cancellation=False,
                    extracted_params=params
                )
    
    return None


def extract_action_params(message: str, action_type: str) -> dict:
    """Extract parameters from message for a specific action type."""
    params = {}
    
    # Extract email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', message)
    if email_match:
        params['customer_email'] = email_match.group()
    
    # Extract order ID
    order_id_match = re.search(r'(?:order\s*#?\s*|#)(\d+)', message, re.IGNORECASE)
    if order_id_match:
        params['order_id'] = int(order_id_match.group(1))
    
    # Extract SKU
    sku_match = re.search(r'(?:sku[:\s]*|sku-)([a-zA-Z0-9-]+)', message, re.IGNORECASE)
    if sku_match:
        params['sku'] = sku_match.group(1).upper()
    
    # Extract quantity
    qty_match = re.search(r'(\d+)\s*(?:units?|items?|pcs?)', message, re.IGNORECASE)
    if qty_match:
        params['quantity'] = int(qty_match.group(1))
    
    # Extract status for order updates
    for status in ['pending', 'processing', 'shipped', 'delivered', 'cancelled']:
        if status in message.lower():
            params['new_status'] = status
            break
    
    # Extract warehouse IDs
    wh_match = re.search(r'warehouse\s*#?\s*(\d+)', message, re.IGNORECASE)
    if wh_match:
        params['warehouse_id'] = int(wh_match.group(1))
    
    from_wh = re.search(r'from\s+warehouse\s*#?\s*(\d+)', message, re.IGNORECASE)
    to_wh = re.search(r'to\s+warehouse\s*#?\s*(\d+)', message, re.IGNORECASE)
    if from_wh:
        params['from_warehouse_id'] = int(from_wh.group(1))
    if to_wh:
        params['to_warehouse_id'] = int(to_wh.group(1))
    
    # Extract product name (quoted text)
    name_match = re.search(r'"([^"]+)"|\'([^\']+)\'', message)
    if name_match:
        params['name'] = name_match.group(1) or name_match.group(2)
    
    # Extract price
    price_match = re.search(r'\$?([\d,]+(?:\.\d{2})?)', message)
    if price_match:
        price_str = price_match.group(1).replace(',', '')
        params['actual_price'] = float(price_str)
    
    return params


def format_action_response(result: ActionResult) -> str:
    """Format action result for display to user."""
    if result.status == ActionStatus.MISSING_DATA:
        return result.prompt_message or f"I need more information: {', '.join(result.missing_fields)}"
    
    elif result.status == ActionStatus.PENDING_CONFIRMATION:
        return result.confirmation_message or "Do you want me to proceed with this action?"
    
    elif result.status == ActionStatus.EXECUTED:
        return result.result_message or "Action completed successfully!"
    
    elif result.status == ActionStatus.CANCELLED:
        if result.error:
            return f"Action cancelled: {result.error}"
        return "Okay, I've cancelled that action."
    
    return str(result.data or result.error or "Action result unknown")


def get_action_tool(action_type: str, auth) -> Optional[ActionTool]:
    """Get the appropriate action tool for an action type."""
    from app.tools.actions import get_action_tools
    
    # Get all action tools
    tools = get_action_tools(auth)
    
    for tool in tools:
        if tool.name == action_type:
            return tool
    
    return None

