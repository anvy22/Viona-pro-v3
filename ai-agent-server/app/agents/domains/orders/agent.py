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
from app.tools.alerts import get_alerts_tools
from app.tools.actions import get_action_tools
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
        
        # Get tools (orders + alerts + actions)
        tools = get_orders_tools(auth) + get_alerts_tools(auth) + get_action_tools(auth)
        messages = self.format_messages(state, memory_messages)
        
        tool_results = await self._execute_tools(state, tools)
        
        # Check for action tool responses that need user interaction
        for tool_name, result in tool_results.items():
            if isinstance(result, dict):
                action_status = result.get("action_status")
                
                # Missing data - ask user for more info
                if action_status == "missing_data":
                    prompt = result.get("prompt", "I need more information to proceed.")
                    missing = result.get("missing_fields", [])
                    
                    analytics = AnalyticsSection(
                        overview=f"📝 **{prompt}**",
                        key_metrics=[],
                        observations=[f"Missing: {', '.join(missing)}"] if missing else [],
                        follow_ups=[]
                    )
                    output = AgentOutput.analytics_response(analytics, confidence=0.95)
                    state["output"] = output.model_dump()
                    await memory.add_message("user", state["input"])
                    await memory.add_message("assistant", output.summary)
                    return state
                
                # Pending confirmation - show preview and ask for confirmation
                elif action_status == "pending_confirmation":
                    confirm_msg = result.get("confirmation_message", "Do you want to proceed?")
                    preview = result.get("preview", {})
                    
                    analytics = AnalyticsSection(
                        overview=f"⚡ **Action Preview**\n\n{confirm_msg}\n\n*Reply with 'yes' to confirm or 'no' to cancel.*",
                        key_metrics=[],
                        observations=[],
                        follow_ups=[]
                    )
                    output = AgentOutput.analytics_response(analytics, confidence=0.95)
                    state["output"] = output.model_dump()
                    state["pending_action"] = {
                        "tool": tool_name,
                        "preview": preview
                    }
                    await memory.add_message("user", state["input"])
                    await memory.add_message("assistant", output.summary)
                    return state
        
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
                    f"Highlight important patterns (pending orders, revenue, top customers).\n\n"
                    f"IMPORTANT: Do NOT use markdown tables (| col | col |). Tables are rendered separately by the UI. "
                    f"Write in natural prose only."
        ))
        
        response, usage = await self.invoke_llm(state, messages)
        
        output = self._parse_response(response, tool_results)
        state["output"] = output.model_dump()
        
        await memory.add_message("user", state["input"])
        await memory.add_message("assistant", output.summary)
        
        return state
    
    async def _execute_tools(self, state: AgentState, tools: list) -> dict:
        """Execute relevant tools."""
        from app.tools.base import ActionTool, ActionStatus
        from app.agents.action_handler import extract_action_params
        
        user_input = state["input"].lower()
        results = {}
        
        tool_mapping = {
            "order": ["get_order_list", "get_order_status_breakdown"],
            "customer": ["get_top_customers", "get_customer_history"],
            "status": ["get_order_status_breakdown"],
            "pending": ["get_order_list"],
            "shipped": ["get_order_list"],
            "recent": ["get_order_list"],
            "top": ["get_top_customers"],
            "revenue": ["get_order_status_breakdown"],
            "sales": ["get_order_list", "get_order_status_breakdown"],
            "search": ["search_orders"],
            "find": ["search_orders"],
            "history": ["get_customer_history"],
            # Alerts keywords
            "anomal": ["sales_anomaly_detection"],
            "unusual": ["sales_anomaly_detection"],
            "spike": ["sales_anomaly_detection"],
            "drop": ["sales_anomaly_detection"],
            "goal": ["revenue_goal_tracking"],
            "target": ["revenue_goal_tracking"],
            "progress": ["revenue_goal_tracking"],
            # Action tool keywords
            "create order": ["create_order"],
            "add order": ["create_order"],
            "new order": ["create_order"],
            "place order": ["create_order"],
            "update status": ["update_order_status"],
            "change status": ["update_order_status"],
            "mark as": ["update_order_status"],
        }
        
        tools_to_run = set()
        for keyword, tool_names in tool_mapping.items():
            if keyword in user_input:
                tools_to_run.update(tool_names)
        
        if not tools_to_run:
            tools_to_run = {"get_order_list", "get_order_status_breakdown"}
        
        for tool in tools:
            if tool.name in tools_to_run:
                # Check if this is an action tool
                if isinstance(tool, ActionTool):
                    # Extract params from user message for action tools
                    kwargs = extract_action_params(state["input"], tool.name)
                    
                    # Run with action workflow (handles missing fields)
                    result = await tool.run_action(confirmed=False, **kwargs)
                    
                    # Handle missing data - ask user for more info
                    if result.status == ActionStatus.MISSING_DATA:
                        results[tool.name] = {
                            "action_status": "missing_data",
                            "missing_fields": result.missing_fields,
                            "prompt": result.prompt_message
                        }
                    elif result.status == ActionStatus.PENDING_CONFIRMATION:
                        results[tool.name] = {
                            "action_status": "pending_confirmation",
                            "preview": result.preview_data,
                            "confirmation_message": result.confirmation_message
                        }
                    else:
                        results[tool.name] = result.data if result.success else {"error": result.error}
                else:
                    # Regular tool execution
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
                    "input": kwargs if 'kwargs' in dir() else {},
                    "output": results.get(tool.name),
                    "duration_ms": getattr(result, 'duration_ms', 0),
                    "error": getattr(result, 'error', None)
                })
        
        return results
    
    def _is_empty_data(self, tool_results: dict) -> bool:
        """Check if results indicate no data - generic check for ALL tools."""
        if not tool_results:
            return True
        
        for tool_name, data in tool_results.items():
            if not isinstance(data, dict):
                continue
            if data.get("error"):
                continue
            
            # Generic check: look for common list keys that indicate data exists
            list_keys = ["orders", "statuses", "customers", "items", "results"]
            for key in list_keys:
                if key in data and isinstance(data[key], list) and len(data[key]) > 0:
                    return False
            
            # Check for count/total fields that indicate data exists
            count_keys = ["count", "total", "total_orders", "total_customers"]
            for key in count_keys:
                if key in data and data[key] and data[key] > 0:
                    return False
            
            # If tool returned data with no error and has content, assume not empty
            if len(data) > 0 and not data.get("error") and not data.get("found") == False:
                # Check if any value is a non-empty list
                for value in data.values():
                    if isinstance(value, list) and len(value) > 0:
                        return False
                    if isinstance(value, (int, float)) and value > 0:
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
