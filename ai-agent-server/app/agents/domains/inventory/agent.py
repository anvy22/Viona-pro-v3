"""
Inventory Agent

Specialist agent for inventory and warehouse queries.
"""

import logging
import json

from langchain_core.messages import HumanMessage, AIMessage

from app.agents.base import (
    BaseAgent, AgentState, AgentOutput, 
    TableData, ChartBlock, AnalyticsSection
)
from app.agents.prompts import INVENTORY_AGENT_PROMPT
from app.tools.inventory import get_inventory_tools
from app.tools.alerts import get_alerts_tools
from app.tools.forecasting import get_forecasting_tools
from app.memory import RedisMemoryStore

logger = logging.getLogger(__name__)


class InventoryAgent(BaseAgent):
    """Inventory specialist agent."""
    
    name = "inventory_agent"
    description = "Handles inventory and warehouse questions"
    system_prompt = INVENTORY_AGENT_PROMPT
    
    async def execute(self, state: AgentState) -> AgentState:
        """Execute inventory query."""
        context = state["context"]
        auth = context.auth
        
        # Get memory context
        memory = RedisMemoryStore(
            org_id=auth.org_id,
            user_id=auth.user_id,
            session_id=context.session_id
        )
        memory_messages = await memory.get_context_messages()
        
        # Get tools (inventory + alerts + forecasting)
        tools = get_inventory_tools(auth) + get_alerts_tools(auth) + get_forecasting_tools(auth)
        
        # Build messages
        messages = self.format_messages(state, memory_messages)
        
        # Execute relevant tools
        tool_results = await self._execute_tools(state, tools)
        
        # Check for empty data
        if self._is_empty_data(tool_results):
            output = self._create_empty_data_response()
            state["output"] = output.model_dump()
            await memory.add_message("user", state["input"])
            await memory.add_message("assistant", output.summary)
            return state
        
        # Generate response with conversational prompt
        messages.append(AIMessage(content="Let me check your inventory."))
        messages.append(HumanMessage(
            content=f"User query: '{state['input']}'\n\n"
                    f"Inventory data:\n{json.dumps(tool_results, indent=2)}\n\n"
                    f"Give a helpful, conversational response. Highlight any issues (low stock, imbalances). "
                    f"Don't just list data - tell them what they need to know.\n\n"
                    f"IMPORTANT: Do NOT use markdown tables (| col | col |). Tables are rendered separately by the UI. "
                    f"Write in natural prose only."
        ))
        
        response, usage = await self.invoke_llm(state, messages)
        
        # Parse response
        output = self._parse_response(response, tool_results)
        state["output"] = output.model_dump()
        
        # Store in memory
        await memory.add_message("user", state["input"])
        await memory.add_message("assistant", output.summary)
        
        return state
    
    async def _execute_tools(self, state: AgentState, tools: list) -> dict:
        """Execute relevant tools based on the query."""
        user_input = state["input"].lower()
        results = {}
        
        tool_mapping = {
            "stock": ["get_product_stock"],
            "inventory": ["get_product_stock", "get_warehouse_list"],
            "warehouse": ["get_warehouse_list"],
            "product": ["get_product_catalog", "search_products"],
            "catalog": ["get_product_catalog"],
            "low": ["get_product_stock"],
            "movement": ["get_stock_movement"],
            "sold": ["get_stock_movement"],
            "level": ["get_product_stock"],
            "all": ["get_product_stock", "get_warehouse_list"],
            "search": ["search_products"],
            "find": ["search_products"],
            "overstock": ["get_overstock_detection"],
            "imbalance": ["get_overstock_detection"],
            # Alerts and forecasting keywords
            "alert": ["low_stock_alerts"],
            "critical": ["low_stock_alerts"],
            "urgent": ["low_stock_alerts"],
            "reorder": ["reorder_point_calculator"],
            "health": ["inventory_health_report"],
            "report": ["inventory_health_report"],
            "score": ["inventory_health_report"],
            "forecast": ["demand_forecast", "reorder_point_calculator"],
            "predict": ["demand_forecast"],
        }
        
        tools_to_run = set()
        for keyword, tool_names in tool_mapping.items():
            if keyword in user_input:
                tools_to_run.update(tool_names)
        
        if not tools_to_run:
            tools_to_run = {"get_product_stock", "get_warehouse_list"}
        
        for tool in tools:
            if tool.name in tools_to_run:
                # Special handling for low stock queries
                kwargs = {}
                if tool.name == "get_product_stock" and "low" in user_input:
                    kwargs["low_stock_only"] = True
                
                result = await tool.run(**kwargs)
                results[tool.name] = result.data if result.success else {"error": result.error}
                
                state["tools_called"].append({
                    "name": tool.name,
                    "input": kwargs,
                    "output": result.data,
                    "duration_ms": result.duration_ms,
                    "error": result.error
                })
        
        return results
    
    def _is_empty_data(self, tool_results: dict) -> bool:
        """Check if tool results indicate no data - generic check for ALL tools."""
        if not tool_results:
            return True
        
        for tool_name, data in tool_results.items():
            if not isinstance(data, dict):
                continue
            if data.get("error"):
                continue
            
            # Generic check: look for common list keys that indicate data exists
            list_keys = ["items", "warehouses", "products", "alerts", "recommendations", "forecasts"]
            for key in list_keys:
                if key in data and isinstance(data[key], list) and len(data[key]) > 0:
                    return False
            
            # Check for count/total fields that indicate data exists
            count_keys = ["total", "count", "total_products", "total_stock"]
            for key in count_keys:
                if key in data and data[key] and data[key] > 0:
                    return False
            
            # If tool returned data with no error and has content, assume not empty
            if len(data) > 0 and not data.get("error"):
                for value in data.values():
                    if isinstance(value, list) and len(value) > 0:
                        return False
                    if isinstance(value, (int, float)) and value > 0:
                        return False
        
        return True
    
    def _create_empty_data_response(self) -> AgentOutput:
        """Create response for when no inventory data exists."""
        analytics = AnalyticsSection(
            overview="No inventory data found for this organization yet.",
            key_metrics=[],
            observations=[
                "Your organization doesn't have any products or warehouses set up yet."
            ],
            follow_ups=[]
        )
        return AgentOutput.analytics_response(analytics, confidence=0.95)
    
    def _parse_response(self, llm_response, tool_results: dict) -> AgentOutput:
        """Simplified response - let LLM prose be the star, add one supporting table."""
        content = llm_response.content if hasattr(llm_response, 'content') else str(llm_response)
        
        table = None
        
        # Only show stock table if there's stock data
        if "get_product_stock" in tool_results:
            stock_data = tool_results["get_product_stock"]
            if stock_data and "items" in stock_data and stock_data["items"]:
                items = stock_data["items"]
                table = TableData(
                    title="Stock Levels",
                    columns=["Product", "Warehouse", "Qty", "Status"],
                    rows=[
                        [
                            i.get("product_name") or "N/A",
                            i.get("warehouse_name") or "—",
                            str(i.get("quantity", 0)),
                            "⚠️ Low" if i.get("is_low_stock") else "✅"
                        ]
                        for i in items[:15]  # Limit to 15 rows
                    ]
                )
        
        # Simple response - LLM content + one table if relevant
        analytics = AnalyticsSection(
            overview=content,      # Full LLM response
            key_metrics=[],        # Skip - LLM already mentions key info
            detailed_breakdown=table,
            charts=[],             # Skip chart - table is more useful
            observations=[],       # Skip - LLM already includes insights
            follow_ups=[]
        )
        
        return AgentOutput.analytics_response(analytics, confidence=0.9)

