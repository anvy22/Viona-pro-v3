"""
Base Agent Abstraction

All domain agents inherit from BaseAgent.
Provides common functionality for tool execution, token tracking, and output formatting.
"""

import logging
from abc import ABC, abstractmethod
from typing import Optional, Any
from datetime import datetime, timezone
import time

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from app.agents.base.context import AgentState, ExecutionContext
from app.agents.base.output import AgentOutput
from app.llms import TokenTrackingCallback, create_model
from app.tokens import TokenLimiter, TokenUsage, QuotaExceededError
from app.observability import AgentLogger, AgentLog, ToolCall
from app.memory import RedisMemoryStore

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Abstract base class for all domain agents.
    
    Provides:
    - Token quota checking and tracking
    - Tool execution with logging
    - Memory integration
    - Structured output formatting
    """
    
    # Override in subclasses
    name: str = "base_agent"
    description: str = "Base agent"
    system_prompt: str = ""
    
    # Default model config
    default_provider: str = "groq"
    default_model: str = "llama-3.3-70b-versatile"
    
    def __init__(
        self,
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.provider = provider or self.default_provider
        self.model_name = model or self.default_model
        self.tools: list = []
    
    @abstractmethod
    async def execute(self, state: AgentState) -> AgentState:
        """
        Execute agent logic and return updated state.
        
        Must be implemented by subclasses.
        """
        pass
    
    async def run(self, state: AgentState) -> AgentState:
        """
        Main entry point with quota checking and logging.
        
        Wraps execute() with:
        1. Token quota pre-check
        2. Execution timing
        3. Token usage recording
        4. Observability logging
        """
        context = state["context"]
        start_time = time.time()
        
        # Initialize components
        limiter = TokenLimiter(context.auth.org_id)
        agent_logger = AgentLogger(
            org_id=context.auth.org_id,
            user_id=context.auth.user_id,
            session_id=context.session_id
        )
        
        # Pre-check quota
        try:
            await limiter.check_quota(context.token_budget)
        except QuotaExceededError as e:
            state["error"] = str(e)
            state["output"] = AgentOutput.error_response(str(e)).model_dump()
            return state
        
        # Execute agent
        log = AgentLog(
            org_id=context.auth.org_id,
            user_id=context.auth.user_id,
            session_id=context.session_id,
            message_id=context.message_id,
            agent_name=self.name,
            model=self.model_name,
            provider=self.provider,
            input_message=state["input"]
        )
        
        try:
            state = await self.execute(state)
            log.output = state.get("output")
            
        except Exception as e:
            logger.exception(f"Agent {self.name} execution failed")
            state["error"] = str(e)
            state["output"] = AgentOutput.error_response(
                f"An error occurred: {str(e)}"
            ).model_dump()
            log.error = str(e)
        
        # Finalize timing
        duration_ms = int((time.time() - start_time) * 1000)
        log.completed_at = datetime.now(timezone.utc).isoformat()
        log.duration_ms = duration_ms
        log.tools_used = [
            ToolCall(**t) for t in state.get("tools_called", [])
        ]
        
        # Store log
        await agent_logger.log_execution(log)
        
        return state
    
    async def invoke_llm(
        self,
        state: AgentState,
        messages: list,
        structured_output: Optional[type] = None,
    ) -> tuple[Any, TokenUsage]:
        """
        Invoke LLM with token tracking.
        
        Returns:
            Tuple of (response, token_usage)
        """
        context = state["context"]
        
        # Create model with tracking callback
        callback = TokenTrackingCallback()
        model = create_model(
            provider=self.provider,
            model=self.model_name,
            callbacks=[callback]
        )
        
        # Add structured output if specified
        if structured_output:
            model = model.with_structured_output(structured_output)
        
        # Invoke
        response = await model.ainvoke(messages)
        
        # Get usage
        usage = callback.get_usage(self.provider)
        
        # Record usage
        limiter = TokenLimiter(context.auth.org_id)
        await limiter.record_usage(usage, context.auth.user_id)
        
        # Update context
        context.tokens_used += usage.input_tokens + usage.output_tokens
        
        return response, usage
    
    def get_system_message(self) -> SystemMessage:
        """Get system message for this agent."""
        return SystemMessage(content=self.system_prompt)
    
    def format_messages(
        self,
        state: AgentState,
        memory_messages: Optional[list[dict]] = None
    ) -> list:
        """Format messages for LLM call."""
        messages = [self.get_system_message()]
        
        # Add memory context
        if memory_messages:
            for msg in memory_messages:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
                elif msg["role"] == "system":
                    messages.append(SystemMessage(content=msg["content"]))
        
        # Add current input
        messages.append(HumanMessage(content=state["input"]))
        
        return messages
