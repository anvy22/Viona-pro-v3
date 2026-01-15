"""
Orders Agent

Specialist agent for order and customer queries.
"""

import logging
import json

from langchain_core.messages import HumanMessage, AIMessage

from app.agents.base import (
    BaseAgent, AgentState, AgentOutput, 
    TableData, ChartBlock, AnalyticsSection
)
from app.agents.prompts import ORDERS_AGENT_PROMPT
from app.tools.orders import get_orders_tools
from app.memory import RedisMemoryStore

logger = logging.getLogger(__name__)


class OrdersAgent(BaseAgent):
    """Orders specialist agent."""
    
    name = "orders_agent"
    description = "Handles orders and customer questions"
    system_prompt = ORDERS_AGENT_PROMPT
    
    async def execute(self, state: AgentState) -> AgentState:
        """Execute orders query."""
        context = state["context"]
        auth = context.auth
        
        memory = RedisMemoryStore(
            org_id=auth.org_id,
            user_id=auth.user_id,
            session_id=context.session_id
        )
        memory_messages = await memory.get_context_messages()
        
        tools = get_orders_tools(auth)
        messages = self.format_messages(state, memory_messages)
        
        tool_results = await self._execute_tools(state, tools)
        
        # Check for empty data explicitly
        if self._is_empty_data(tool_results):
            output = self._create_empty_data_response()
            state["output"] = output.model_dump()
            await memory.add_message("user", state["input"])
            await memory.add_message("assistant", output.summary)
            return state
        
        messages.append(AIMessage(content="Let me check your orders."))
        messages.append(HumanMessage(
            content=f"User query: '{state['input']}'\n\n"
                    f"Order data:\n{json.dumps(tool_results, indent=2)}\n\n"
                    f"Give a helpful, conversational response about their orders. "
                    f"Highlight important patterns (pending orders, revenue, top customers)."
        ))
        
        response, usage = await self.invoke_llm(state, messages)
        
        output = self._parse_response(response, tool_results)
        state["output"] = output.model_dump()
        
        await memory.add_message("user", state["input"])
        await memory.add_message("assistant", output.summary)
        
        return state
    
    async def _execute_tools(self, state: AgentState, tools: list) -> dict:
        """Execute relevant tools."""
        user_input = state["input"].lower()
        results = {}
        
        tool_mapping = {
            "order": ["get_order_list", "get_order_status_breakdown"],
            "customer": ["get_top_customers"],
            "status": ["get_order_status_breakdown"],
            "pending": ["get_order_list"],
            "shipped": ["get_order_list"],
            "recent": ["get_order_list"],
            "top": ["get_top_customers"],
            "revenue": ["get_order_status_breakdown"],
            "sales": ["get_order_list", "get_order_status_breakdown"],
        }
        
        tools_to_run = set()
        for keyword, tool_names in tool_mapping.items():
            if keyword in user_input:
                tools_to_run.update(tool_names)
        
        if not tools_to_run:
            tools_to_run = {"get_order_list", "get_order_status_breakdown"}
        
        for tool in tools:
            if tool.name in tools_to_run:
                kwargs = {}
                
                # Handle status filter
                for status in ["pending", "completed", "shipped", "cancelled"]:
                    if status in user_input:
                        kwargs["status"] = status
                        break
                
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
        """Check if results indicate no orders."""
        for tool_name, data in tool_results.items():
            if isinstance(data, dict):
                if data.get("error"):
                    continue
                if tool_name == "get_order_list":
                    if data.get("orders") and len(data["orders"]) > 0:
                        return False
                if tool_name == "get_order_status_breakdown":
                    if data.get("statuses") and len(data["statuses"]) > 0:
                        total = sum(s.get("order_count", 0) for s in data["statuses"])
                        if total > 0:
                            return False
        return True
    
    def _create_empty_data_response(self) -> AgentOutput:
        """Response for no orders."""
        analytics = AnalyticsSection(
            overview="No orders found for this organization yet.",
            key_metrics=[],
            observations=[
                "Once you start receiving orders, I can show you sales trends, customer insights, and revenue analytics."
            ],
            follow_ups=[]
        )
        return AgentOutput.analytics_response(analytics, confidence=0.95)
    
    def _parse_response(self, llm_response, tool_results: dict) -> AgentOutput:
        """Simplified response - LLM prose + one supporting table."""
        content = llm_response.content if hasattr(llm_response, 'content') else str(llm_response)
        
        table = None
        
        # Show order list table if available
        if "get_order_list" in tool_results:
            order_data = tool_results["get_order_list"]
            if order_data and "orders" in order_data and order_data["orders"]:
                orders = order_data["orders"]
                table = TableData(
                    title="Recent Orders",
                    columns=["Customer", "Status", "Amount", "Date"],
                    rows=[
                        [
                            o.get("customer_name") or o.get("customer_email") or "—",
                            o.get("status") or "—",
                            f"${o.get('total_amount', 0):,.2f}",
                            o.get("order_date", "")[:10] if o.get("order_date") else "—"
                        ]
                        for o in orders[:10]  # Limit to 10 rows
                    ]
                )
        
        # If no orders table but has customers, show that
        if not table and "get_top_customers" in tool_results:
            cust_data = tool_results["get_top_customers"]
            if cust_data and "customers" in cust_data and cust_data["customers"]:
                customers = cust_data["customers"]
                table = TableData(
                    title="Top Customers",
                    columns=["Name", "Orders", "Total Spent"],
                    rows=[
                        [
                            c.get("name", "—"),
                            str(c.get("order_count", 0)),
                            f"${c.get('total_spent', 0):,.2f}"
                        ]
                        for c in customers[:8]
                    ]
                )
        
        # Simple response - LLM content is the star
        analytics = AnalyticsSection(
            overview=content,
            key_metrics=[],
            detailed_breakdown=table,
            charts=[],
            observations=[],
            follow_ups=[]
        )
        
        return AgentOutput.analytics_response(analytics, confidence=0.9)
