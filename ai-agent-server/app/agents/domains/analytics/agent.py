"""
Analytics Agent

Specialist agent for business analytics queries.
Uses tools to fetch data and LLM to generate insights.
"""

import logging
import json
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from app.agents.base import (
    BaseAgent, AgentState, AgentOutput, 
    ChartData, TableData, ChartBlock, AnalyticsSection
)
from app.agents.prompts import ANALYTICS_AGENT_PROMPT
from app.tools.analytics import get_analytics_tools
from app.tools.forecasting import get_forecasting_tools
from app.tools.alerts import get_alerts_tools
from app.memory import RedisMemoryStore

logger = logging.getLogger(__name__)


class AnalyticsAgent(BaseAgent):
    """Analytics specialist agent."""
    
    name = "analytics_agent"
    description = "Handles business analytics questions"
    system_prompt = ANALYTICS_AGENT_PROMPT
    
    async def execute(self, state: AgentState) -> AgentState:
        """Execute analytics query."""
        context = state["context"]
        auth = context.auth
        
        # Get memory context
        memory = RedisMemoryStore(
            org_id=auth.org_id,
            user_id=auth.user_id,
            session_id=context.session_id
        )
        memory_messages = await memory.get_context_messages()
        
        # Get tools (analytics + forecasting + alerts)
        tools = get_analytics_tools(auth) + get_forecasting_tools(auth) + get_alerts_tools(auth)
        
        # Build messages
        messages = self.format_messages(state, memory_messages)
        
        # Execute relevant tools based on query
        tool_results = await self._execute_tools(state, tools)
        
        # Check for empty data
        if self._is_empty_data(tool_results):
            output = self._create_empty_data_response()
            state["output"] = output.model_dump()
            await memory.add_message("user", state["input"])
            await memory.add_message("assistant", output.summary)
            return state
        
        # Detect if this is an advice/recommendation query
        user_input = state["input"].lower()
        is_advice_query = any(kw in user_input for kw in [
            "advice", "recommend", "grow", "improve", "suggest", "help",
            "optimize", "should i", "how can", "what can", "opportunity"
        ])
        
        # Build context for LLM
        messages.append(AIMessage(content="I'll analyze your business data."))
        
        if is_advice_query:
            messages.append(HumanMessage(
                content=f"User is asking for business advice: '{state['input']}'\n\n"
                        f"Here's their current data:\n{json.dumps(tool_results, indent=2)}\n\n"
                        f"Give them actionable, specific recommendations based on this data. "
                        f"Be conversational and warm - like a trusted business advisor. "
                        f"Focus on 3-5 concrete actions they can take. "
                        f"Don't just list metrics - tell them what the data MEANS for their business.\n\n"
                        f"IMPORTANT: Do NOT use markdown tables (| col | col |). Tables are rendered separately by the UI. "
                        f"Write in natural prose only."
            ))
        else:
            messages.append(HumanMessage(
                content=f"User query: '{state['input']}'\n\n"
                        f"Data:\n{json.dumps(tool_results, indent=2)}\n\n"
                        f"Provide a clear, helpful response. Lead with the key insight, then supporting details.\n\n"
                        f"IMPORTANT: Do NOT use markdown tables (| col | col |). Tables are rendered separately by the UI. "
                        f"Write in natural prose only."
            ))
        
        # Generate response with LLM
        response, usage = await self.invoke_llm(state, messages)
        
        # Parse response and create structured output
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
        
        # Determine which tools to run based on keywords
        tool_mapping = {
            "order": ["get_order_summary"],
            "revenue": ["get_order_summary", "get_revenue_by_period"],
            "sales": ["get_order_summary", "get_product_performance"],
            "product": ["get_product_performance"],
            "inventory": ["get_inventory_summary"],
            "stock": ["get_inventory_summary"],
            "trend": ["get_revenue_by_period", "trend_analysis"],
            "summary": ["get_order_summary", "get_inventory_summary"],
            "overview": ["get_order_summary", "get_inventory_summary"],
            "performance": ["get_product_performance"],
            "top": ["get_product_performance"],
            # Least selling product keywords
            "least": ["get_least_selling_products"],
            "worst": ["get_least_selling_products"],
            "bottom": ["get_least_selling_products"],
            "lowest": ["get_least_selling_products"],
            "slow": ["get_least_selling_products"],
            "underperform": ["get_least_selling_products"],
            "poor": ["get_least_selling_products"],
            # Forecasting keywords
            "forecast": ["demand_forecast", "reorder_point_calculator"],
            "predict": ["demand_forecast", "trend_analysis"],
            "demand": ["demand_forecast"],
            "seasonal": ["seasonality_detection"],
            "pattern": ["seasonality_detection", "trend_analysis"],
            "reorder": ["reorder_point_calculator"],
            # Alerts keywords
            "anomal": ["sales_anomaly_detection"],
            "unusual": ["sales_anomaly_detection"],
            "goal": ["revenue_goal_tracking"],
            "target": ["revenue_goal_tracking"],
            # Business advice keywords - fetch comprehensive data
            "advice": ["get_order_summary", "get_inventory_summary", "get_product_performance", "get_least_selling_products", "get_revenue_by_period", "trend_analysis"],
            "recommend": ["get_order_summary", "get_inventory_summary", "get_product_performance", "get_least_selling_products", "get_revenue_by_period", "demand_forecast"],
            "grow": ["get_order_summary", "get_inventory_summary", "get_product_performance", "get_least_selling_products", "get_revenue_by_period", "trend_analysis"],
            "improve": ["get_order_summary", "get_inventory_summary", "get_product_performance", "get_least_selling_products", "get_revenue_by_period"],
            "suggest": ["get_order_summary", "get_inventory_summary", "get_product_performance", "get_revenue_by_period"],
            "insight": ["get_order_summary", "get_inventory_summary", "get_product_performance", "trend_analysis"],
            "opportunit": ["get_order_summary", "get_inventory_summary", "get_product_performance"],
            "optimi": ["get_order_summary", "get_inventory_summary", "get_product_performance"],
            "what should": ["get_order_summary", "get_inventory_summary", "get_product_performance", "demand_forecast"],
            "how can i": ["get_order_summary", "get_inventory_summary", "get_product_performance"],
        }
        
        tools_to_run = set()
        for keyword, tool_names in tool_mapping.items():
            if keyword in user_input:
                tools_to_run.update(tool_names)
        
        # Default to comprehensive summary if no specific keywords
        if not tools_to_run:
            tools_to_run = {"get_order_summary", "get_inventory_summary"}
        
        # Execute tools
        for tool in tools:
            if tool.name in tools_to_run:
                result = await tool.run()
                results[tool.name] = result.data if result.success else {"error": result.error}
                
                # Track tool call
                state["tools_called"].append({
                    "name": tool.name,
                    "input": {},
                    "output": result.data,
                    "duration_ms": result.duration_ms,
                    "error": result.error
                })
        
        return results
    
    def _is_empty_data(self, tool_results: dict) -> bool:
        """Check if all tool results indicate no data - generic check for ALL tools."""
        if not tool_results:
            return True
        
        for tool_name, data in tool_results.items():
            if not isinstance(data, dict):
                continue
            if data.get("error"):
                continue
            
            # Generic check: look for common list keys that indicate data exists
            list_keys = ["products", "forecasts", "data", "items", "trends", "patterns", "anomalies", "alerts"]
            for key in list_keys:
                if key in data and isinstance(data[key], list) and len(data[key]) > 0:
                    return False
            
            # Check for count/total fields that indicate data exists
            count_keys = ["total_orders", "total_products", "total_revenue", "count", "total_products_analyzed"]
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
        """Create response for when no data exists."""
        analytics = AnalyticsSection(
            overview="No business data found for this organization yet.",
            key_metrics=[],
            observations=[
                "Your organization doesn't have any orders or products set up yet."
            ],
            follow_ups=[
                "Add products to your catalog to start tracking inventory",
                "Once orders are created, I can provide revenue and sales analytics"
            ]
        )
        return AgentOutput.analytics_response(analytics, confidence=0.95)
    
    def _parse_response(self, llm_response, tool_results: dict) -> AgentOutput:
        """Parse LLM response - keep it simple to avoid duplication."""
        content = llm_response.content if hasattr(llm_response, 'content') else str(llm_response)
        
        # For conversational responses, just return the LLM's prose
        # The LLM has been instructed to write naturally without robotic formatting
        # Only add charts/tables when they genuinely add value
        
        charts = []
        table = None
        
        # Only add revenue chart if there's actual trend data worth showing
        if "get_revenue_by_period" in tool_results:
            period_data = tool_results["get_revenue_by_period"]
            if period_data and "data" in period_data and len(period_data.get("data", [])) >= 3:
                data_points = period_data["data"]
                # Only show chart if there's meaningful variation
                revenues = [p.get("revenue", 0) for p in data_points]
                if max(revenues) > 0:  # Has actual revenue data
                    charts.append(ChartBlock(
                        chart_type="line",
                        title="Revenue Trend",
                        x=[p.get("period", "")[:10] for p in data_points],
                        y=revenues,
                        x_label="Date",
                        y_label="Revenue ($)"
                    ))
        
        # Only show product table if user asked for product data AND there are sales
        if "get_product_performance" in tool_results:
            perf_data = tool_results["get_product_performance"]
            if perf_data and "products" in perf_data:
                products = perf_data["products"]
                # Only show table if there are products with actual sales
                products_with_sales = [p for p in products if p.get("total_quantity", 0) > 0]
                if products_with_sales:
                    table = TableData(
                        title="Top Selling Products",
                        columns=["Product", "Units Sold", "Revenue"],
                        rows=[
                            [
                                p["name"],
                                str(p["total_quantity"]),
                                f"${p['total_revenue']:,.2f}"
                            ]
                            for p in products_with_sales[:5]  # Top 5 only
                        ]
                    )
        
        # Build simple response - let the LLM content be the star
        analytics = AnalyticsSection(
            overview=content,  # Full LLM response as the overview
            key_metrics=[],    # Skip metrics cards - they duplicate LLM content
            detailed_breakdown=table,
            charts=charts,
            observations=[],   # Skip - LLM already includes insights
            follow_ups=[]
        )
        
        return AgentOutput.analytics_response(analytics, confidence=0.9)

