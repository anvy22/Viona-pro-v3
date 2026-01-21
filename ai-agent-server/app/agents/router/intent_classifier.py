"""
Intent Classification

Fast, lightweight intent classification for routing.
Uses small model for speed and cost efficiency.
"""

from typing import Optional
from pydantic import BaseModel, Field

from langchain_core.messages import HumanMessage, SystemMessage

from app.llms import get_model_for_task


class IntentClassification(BaseModel):
    """Structured output for intent classification."""
    intent: str = Field(description="The classified intent category")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score")
    reasoning: str = Field(description="Brief explanation of classification")


INTENT_CLASSIFICATION_PROMPT = """You are an intent classifier for Viona, a business analytics assistant.

Classify the user's message into ONE of these categories:

- analytics: Questions about business status, overview, how's business, performance, trends, reports, metrics, revenue, data, summaries, forecasts, predictions, alerts
- inventory: Questions about products, stock, warehouses, SKUs, low stock, overstock, items. Also: ADD product, UPDATE product, UPDATE stock, TRANSFER stock
- orders: Questions about orders, sales, customers, order status, purchases. Also: CREATE order, UPDATE order, CANCEL order, SEARCH orders, customer history
- insights: Requests for advice, suggestions, recommendations, how to grow, improvements, opportunities
- general: ONLY for greetings like "hi" or "hello" with no question, or questions about what you can do

IMPORTANT ACTION DETECTION:
- "Create an order for..." → orders
- "Add a new product..." → inventory
- "Update stock for..." → inventory
- "Transfer stock..." → inventory
- "Cancel order #..." → orders
- "Update order status..." → orders
- "Search for products..." → inventory
- "Find orders from..." → orders

ANALYTICS DETECTION:
- "How's my business?" → analytics
- "What's the status?" → analytics  
- "Give me an overview" → analytics
- "Show me alerts" → analytics
- "When will SKU run out?" → analytics
- "What should I reorder?" → analytics
- "Generate report" → analytics

If the user asks ANYTHING about their business data OR wants to perform an action, always classify as analytics, inventory, or orders.
Only use 'general' for pure greetings or meta questions about Viona itself.
"""


async def classify_intent(user_message: str) -> IntentClassification:
    """
    Classify user intent using fast model.
    
    Uses small model (llama-3.1-8b-instant) for speed and cost efficiency.
    """
    model, config = get_model_for_task("routing")
    model = model.with_structured_output(IntentClassification)
    
    messages = [
        SystemMessage(content=INTENT_CLASSIFICATION_PROMPT),
        HumanMessage(content=f"User message: {user_message}")
    ]
    
    result = await model.ainvoke(messages)
    return result


# Intent to agent mapping
INTENT_AGENT_MAP = {
    "analytics": "analytics_agent",
    "inventory": "inventory_agent",
    "orders": "orders_agent",
    "insights": "analytics_agent",  # Route insights to analytics for business intelligence
    "general": "general_agent",
}


def get_agent_for_intent(intent: str) -> str:
    """Get the agent name for a given intent."""
    return INTENT_AGENT_MAP.get(intent, "general_agent")
