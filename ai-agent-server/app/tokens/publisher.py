"""
Kafka Token Usage Publisher

Emits token usage events for billing and observability.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from aiokafka import AIOKafkaProducer

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_kafka_producer: Optional[AIOKafkaProducer] = None


async def get_kafka_publisher() -> Optional[AIOKafkaProducer]:
    """Get or create Kafka producer."""
    global _kafka_producer
    
    if _kafka_producer is None:
        try:
            _kafka_producer = AIOKafkaProducer(
                bootstrap_servers=settings.kafka_broker,
                client_id=settings.kafka_client_id,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            )
            await _kafka_producer.start()
            logger.info(f"Kafka producer connected to {settings.kafka_broker}")
        except Exception as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            return None
    
    return _kafka_producer


async def emit_token_event(
    org_id: str,
    user_id: str,
    model: str,
    provider: str,
    input_tokens: int,
    output_tokens: int,
    estimated_cost: float,
) -> bool:
    """
    Emit token usage event to Kafka.
    
    Schema:
    {
        "org_id": "string",
        "user_id": "string", 
        "model": "string",
        "provider": "string",
        "input_tokens": int,
        "output_tokens": int,
        "estimated_cost": float,
        "timestamp": "ISO8601"
    }
    """
    producer = await get_kafka_publisher()
    
    if producer is None:
        logger.warning("Kafka unavailable, token event dropped")
        return False
    
    event = {
        "org_id": org_id,
        "user_id": user_id,
        "model": model,
        "provider": provider,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "estimated_cost": estimated_cost,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    
    try:
        await producer.send_and_wait(settings.kafka_token_topic, event)
        logger.debug(f"Token event emitted: {event}")
        return True
    except Exception as e:
        logger.error(f"Failed to emit token event: {e}")
        return False
