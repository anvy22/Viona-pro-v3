"""
Orders Domain Tools

Tools for querying orders and customer data.
All queries are org-scoped and read-only.
"""

from typing import Optional
from datetime import datetime, timedelta

from app.tools import BaseTool, ToolResult
from app.auth import AuthContext


class GetOrderListTool(BaseTool):
    """Get list of orders with filtering."""
    
    name = "get_order_list"
    description = "Get orders with optional status, date, and customer filters"
    
    async def execute(
        self,
        status: Optional[str] = None,
        days: int = 30,
        customer_email: Optional[str] = None,
        limit: int = 50
    ) -> ToolResult:
        """
        Get order list.
        
        Args:
            status: Filter by status (pending, completed, shipped, etc)
            days: Look back period
            customer_email: Filter by customer
            limit: Max results
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        query = '''
            SELECT 
                o.order_id,
                o.customer_name,
                o.customer_email,
                o.status,
                o.total_amount,
                o.order_date,
                o.shipping_city,
                o.shipping_state,
                COUNT(oi.order_item_id) as item_count
            FROM "Order" o
            LEFT JOIN "OrderItem" oi ON oi.order_id = o.order_id
            WHERE o.org_id = $1 AND o.order_date >= $2
        '''
        args = [int(self.org_id), cutoff]
        param_idx = 3
        
        if status:
            query += f' AND o.status = ${param_idx}'
            args.append(status)
            param_idx += 1
        
        if customer_email:
            query += f' AND o.customer_email ILIKE ${param_idx}'
            args.append(f'%{customer_email}%')
            param_idx += 1
        
        query += f''' 
            GROUP BY o.order_id, o.customer_name, o.customer_email, 
                     o.status, o.total_amount, o.order_date,
                     o.shipping_city, o.shipping_state
            ORDER BY o.order_date DESC
            LIMIT ${param_idx}
        '''
        args.append(limit)
        
        results = await self.query(query, *args)
        
        orders = []
        for row in results:
            orders.append({
                "order_id": str(row["order_id"]),
                "customer_name": row["customer_name"],
                "customer_email": row["customer_email"],
                "status": row["status"],
                "total_amount": float(row["total_amount"]) if row["total_amount"] else 0,
                "order_date": row["order_date"].isoformat() if row["order_date"] else None,
                "shipping_location": f"{row['shipping_city'] or ''}, {row['shipping_state'] or ''}".strip(", "),
                "item_count": row["item_count"]
            })
        
        return ToolResult(success=True, data={
            "orders": orders,
            "total_count": len(orders),
            "period_days": days
        })


class GetOrderDetailsTool(BaseTool):
    """Get detailed order information."""
    
    name = "get_order_details"
    description = "Get full details of a specific order including items"
    
    async def execute(self, order_id: int) -> ToolResult:
        """Get order details with items."""
        # Get order
        order_query = '''
            SELECT 
                o.*,
                u.email as placed_by_email
            FROM "Order" o
            LEFT JOIN "User" u ON u.user_id = o.placed_by
            WHERE o.order_id = $1 AND o.org_id = $2
        '''
        
        order = await self.query_one(order_query, order_id, int(self.org_id))
        
        if not order:
            return ToolResult(success=False, error="Order not found")
        
        # Get items
        items_query = '''
            SELECT 
                oi.order_item_id,
                oi.quantity,
                oi.price_at_order,
                p.name as product_name,
                p.sku
            FROM "OrderItem" oi
            JOIN "Product" p ON p.product_id = oi.product_id
            WHERE oi.order_id = $1
        '''
        
        items = await self.query(items_query, order_id)
        
        return ToolResult(success=True, data={
            "order": {
                "order_id": str(order["order_id"]),
                "customer_name": order["customer_name"],
                "customer_email": order["customer_email"],
                "customer_phone": order["customer_phone"],
                "status": order["status"],
                "total_amount": float(order["total_amount"]) if order["total_amount"] else 0,
                "order_date": order["order_date"].isoformat() if order["order_date"] else None,
                "shipping_address": {
                    "street": order["shipping_street"],
                    "city": order["shipping_city"],
                    "state": order["shipping_state"],
                    "zip": order["shipping_zip"],
                    "country": order["shipping_country"]
                },
                "notes": order["notes"],
                "placed_by": order["placed_by_email"]
            },
            "items": [
                {
                    "product_name": i["product_name"],
                    "sku": i["sku"],
                    "quantity": i["quantity"],
                    "price": float(i["price_at_order"]) if i["price_at_order"] else 0
                }
                for i in items
            ]
        })


class GetOrderStatusBreakdownTool(BaseTool):
    """Get breakdown of orders by status."""
    
    name = "get_order_status_breakdown"
    description = "Get count and value of orders grouped by status"
    
    async def execute(self, days: int = 30) -> ToolResult:
        """Get order status breakdown."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        query = '''
            SELECT 
                status,
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as total_value,
                COALESCE(AVG(total_amount), 0) as avg_value
            FROM "Order"
            WHERE org_id = $1 AND order_date >= $2
            GROUP BY status
            ORDER BY order_count DESC
        '''
        
        results = await self.query(query, int(self.org_id), cutoff)
        
        statuses = []
        for row in results:
            statuses.append({
                "status": row["status"] or "Unknown",
                "order_count": row["order_count"],
                "total_value": float(row["total_value"]),
                "avg_value": float(row["avg_value"])
            })
        
        return ToolResult(success=True, data={
            "statuses": statuses,
            "period_days": days
        })


class GetTopCustomersTool(BaseTool):
    """Get top customers by order value or count."""
    
    name = "get_top_customers"
    description = "Get top customers ranked by total spend or order count"
    
    async def execute(
        self,
        days: int = 90,
        limit: int = 10,
        sort_by: str = "value"  # "value" or "count"
    ) -> ToolResult:
        """Get top customers."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        order_by = "total_spent DESC" if sort_by == "value" else "order_count DESC"
        
        query = f'''
            SELECT 
                customer_email,
                customer_name,
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as total_spent,
                MAX(order_date) as last_order
            FROM "Order"
            WHERE org_id = $1 AND order_date >= $2 AND customer_email IS NOT NULL
            GROUP BY customer_email, customer_name
            ORDER BY {order_by}
            LIMIT $3
        '''
        
        results = await self.query(query, int(self.org_id), cutoff, limit)
        
        customers = []
        for row in results:
            customers.append({
                "email": row["customer_email"],
                "name": row["customer_name"] or "N/A",
                "order_count": row["order_count"],
                "total_spent": float(row["total_spent"]),
                "last_order": row["last_order"].isoformat() if row["last_order"] else None
            })
        
        return ToolResult(success=True, data={
            "customers": customers,
            "period_days": days,
            "sort_by": sort_by
        })


# Export all tools
ORDERS_TOOLS = [
    GetOrderListTool,
    GetOrderDetailsTool,
    GetOrderStatusBreakdownTool,
    GetTopCustomersTool,
]


def get_orders_tools(auth: AuthContext) -> list[BaseTool]:
    """Get instantiated orders tools for user."""
    return [ToolClass(auth) for ToolClass in ORDERS_TOOLS]
