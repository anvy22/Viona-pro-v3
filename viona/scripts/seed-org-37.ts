/**
 * Seed Script for Viona Database
 * 
 * Generates fake data for org_id: 37, user_id: 6
 * 
 * Usage:
 *   npx ts-node scripts/seed-org-37.ts
 *   OR
 *   npx tsx scripts/seed-org-37.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ORG_ID = BigInt(37);
const USER_ID = BigInt(6);

// Product data
const PRODUCTS = [
    { name: "MacBook Pro 16\"", sku: "MBP-16-2024", price: 2499.00, description: "Apple M3 Pro, 512GB SSD, 18GB RAM" },
    { name: "iPhone 15 Pro Max", sku: "IPH-15PM", price: 1199.00, description: "256GB, Natural Titanium" },
    { name: "AirPods Pro 2", sku: "APP-2-USB", price: 249.00, description: "USB-C, Active Noise Cancellation" },
    { name: "iPad Pro 12.9\"", sku: "IPD-PRO-13", price: 1099.00, description: "M2 chip, 256GB, Wi-Fi + Cellular" },
    { name: "Apple Watch Ultra 2", sku: "AW-ULTRA2", price: 799.00, description: "49mm Titanium, GPS + Cellular" },
    { name: "Samsung Galaxy S24 Ultra", sku: "SG-S24U", price: 1299.00, description: "512GB, Titanium Black" },
    { name: "Sony WH-1000XM5", sku: "SONY-XM5", price: 349.00, description: "Wireless Noise Canceling Headphones" },
    { name: "Dell XPS 15", sku: "DELL-XPS15", price: 1799.00, description: "Intel i7, 16GB RAM, 512GB SSD" },
    { name: "LG 27\" 4K Monitor", sku: "LG-27UK850", price: 449.00, description: "27\" UHD IPS, USB-C, HDR10" },
    { name: "Logitech MX Master 3S", sku: "LOG-MX3S", price: 99.00, description: "Wireless Performance Mouse" },
    { name: "Keychron K8 Pro", sku: "KEY-K8PRO", price: 189.00, description: "Wireless Mechanical Keyboard" },
    { name: "Samsung 870 EVO 1TB", sku: "SAM-EVO1TB", price: 109.00, description: "SATA SSD, 560MB/s Read" },
    { name: "Anker PowerCore 26800", sku: "ANK-26800", price: 65.00, description: "26800mAh Power Bank, 3 USB Ports" },
    { name: "Google Pixel 8 Pro", sku: "GGL-PX8P", price: 999.00, description: "256GB, Obsidian" },
    { name: "Nintendo Switch OLED", sku: "NIN-SWOLED", price: 349.00, description: "7\" OLED Screen, 64GB Storage" },
];

// Warehouse data
const WAREHOUSES = [
    { name: "Main Warehouse", address: "123 Business Park, San Francisco, CA 94102" },
    { name: "East Coast Hub", address: "456 Commerce Drive, New York, NY 10001" },
    { name: "Midwest Distribution", address: "789 Industrial Blvd, Chicago, IL 60601" },
];

// Customer data for orders
const CUSTOMERS = [
    { name: "John Smith", email: "john.smith@example.com", phone: "+1-555-0101" },
    { name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+1-555-0102" },
    { name: "Michael Brown", email: "m.brown@example.com", phone: "+1-555-0103" },
    { name: "Emily Davis", email: "emily.d@example.com", phone: "+1-555-0104" },
    { name: "Robert Wilson", email: "rwilson@example.com", phone: "+1-555-0105" },
    { name: "Jennifer Lee", email: "jlee@example.com", phone: "+1-555-0106" },
    { name: "David Martinez", email: "dmartinez@example.com", phone: "+1-555-0107" },
    { name: "Lisa Anderson", email: "lisa.a@example.com", phone: "+1-555-0108" },
    { name: "James Taylor", email: "jtaylor@example.com", phone: "+1-555-0109" },
    { name: "Amanda White", email: "awhite@example.com", phone: "+1-555-0110" },
];

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number): Date {
    const now = new Date();
    const past = new Date(now.getTime() - randomInt(1, daysBack) * 24 * 60 * 60 * 1000);
    return past;
}

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    console.log("🌱 Starting seed for org_id: 37, user_id: 6...\n");

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { user_id: USER_ID } });
    if (!user) {
        console.log("❌ User with id 6 doesn't exist. Creating...");
        await prisma.user.create({
            data: {
                user_id: USER_ID,
                clerk_id: `seed_user_${USER_ID}`,
                email: `seeduser${USER_ID}@example.com`,
            },
        });
        console.log("✅ User created\n");
    }

    // Check if organization exists
    let org = await prisma.organization.findUnique({ where: { org_id: ORG_ID } });
    if (!org) {
        console.log("❌ Organization 37 doesn't exist. Creating...");
        org = await prisma.organization.create({
            data: {
                org_id: ORG_ID,
                name: "Viona Demo Store",
                created_by: USER_ID,
            },
        });
        console.log("✅ Organization created\n");
    }

    // Create warehouses
    console.log("📦 Creating warehouses...");
    const warehouseRecords = [];
    for (const wh of WAREHOUSES) {
        const existing = await prisma.warehouse.findFirst({
            where: { org_id: ORG_ID, name: wh.name },
        });
        if (!existing) {
            const record = await prisma.warehouse.create({
                data: { ...wh, org_id: ORG_ID },
            });
            warehouseRecords.push(record);
            console.log(`  ✅ Created: ${wh.name}`);
        } else {
            warehouseRecords.push(existing);
            console.log(`  ⏭️  Exists: ${wh.name}`);
        }
    }

    // Create products
    console.log("\n🛍️  Creating products...");
    const productRecords = [];
    for (const prod of PRODUCTS) {
        const existing = await prisma.product.findFirst({
            where: { org_id: ORG_ID, sku: prod.sku },
        });
        if (!existing) {
            const record = await prisma.product.create({
                data: {
                    name: prod.name,
                    sku: prod.sku,
                    description: prod.description,
                    org_id: ORG_ID,
                    created_by: USER_ID,
                    status: "active",
                },
            });

            // Create price
            await prisma.productPrice.create({
                data: {
                    product_id: record.product_id,
                    actual_price: prod.price,
                    retail_price: prod.price * 1.2,
                    market_price: prod.price * 1.1,
                    valid_from: new Date(),
                },
            });

            productRecords.push(record);
            console.log(`  ✅ Created: ${prod.name}`);
        } else {
            productRecords.push(existing);
            console.log(`  ⏭️  Exists: ${prod.name}`);
        }
    }

    // Create product stocks (randomly distribute across warehouses)
    console.log("\n📊 Creating stock levels...");
    for (const product of productRecords) {
        for (const warehouse of warehouseRecords) {
            const existing = await prisma.productStock.findFirst({
                where: {
                    product_id: product.product_id,
                    warehouse_id: warehouse.warehouse_id,
                },
            });

            if (!existing) {
                const qty = randomInt(5, 150);
                await prisma.productStock.create({
                    data: {
                        product_id: product.product_id,
                        warehouse_id: warehouse.warehouse_id,
                        quantity: qty,
                    },
                });
            }
        }
    }
    console.log(`  ✅ Stock created for ${productRecords.length} products across ${warehouseRecords.length} warehouses`);

    // Create orders
    console.log("\n🛒 Creating orders...");
    const ORDER_COUNT = 50;
    let ordersCreated = 0;

    for (let i = 0; i < ORDER_COUNT; i++) {
        const customer = randomElement(CUSTOMERS);
        const status = randomElement(ORDER_STATUSES);
        const orderDate = randomDate(90); // Last 90 days

        // Random items (1-4 products per order)
        const itemCount = randomInt(1, 4);
        const selectedProducts = [...productRecords]
            .sort(() => Math.random() - 0.5)
            .slice(0, itemCount);

        let totalAmount = 0;
        const orderItems = selectedProducts.map(prod => {
            const qty = randomInt(1, 3);
            const price = PRODUCTS.find(p => p.sku === prod.sku)?.price || 99.99;
            totalAmount += price * qty;
            return {
                product_id: prod.product_id,
                quantity: qty,
                price_at_order: price,
            };
        });

        // Create order
        const order = await prisma.order.create({
            data: {
                org_id: ORG_ID,
                placed_by: USER_ID,
                customer_name: customer.name,
                customer_email: customer.email,
                customer_phone: customer.phone,
                status: status,
                order_date: orderDate,
                total_amount: totalAmount,
                shipping_street: `${randomInt(100, 9999)} Main Street`,
                shipping_city: randomElement(["San Francisco", "Los Angeles", "New York", "Chicago", "Seattle"]),
                shipping_state: randomElement(["CA", "NY", "IL", "WA", "TX"]),
                shipping_zip: String(randomInt(10000, 99999)),
                shipping_country: "USA",
                payment_method: randomElement(["credit_card", "debit_card", "paypal", "bank_transfer"]),
                shipping_method: randomElement(["standard", "express", "overnight"]),
                notes: Math.random() > 0.7 ? "Please handle with care" : null,
            },
        });

        // Create order items
        for (const item of orderItems) {
            await prisma.orderItem.create({
                data: {
                    order_id: order.order_id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price_at_order: item.price_at_order,
                },
            });
        }

        ordersCreated++;
    }
    console.log(`  ✅ Created ${ordersCreated} orders`);

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("🎉 SEED COMPLETE!");
    console.log("=".repeat(50));
    console.log(`\n📊 Summary for org_id: 37`);
    console.log(`  • Warehouses: ${warehouseRecords.length}`);
    console.log(`  • Products: ${productRecords.length}`);
    console.log(`  • Stock entries: ${productRecords.length * warehouseRecords.length}`);
    console.log(`  • Orders: ${ordersCreated}`);
    console.log(`\n✅ Ready to use with Viona AI!\n`);
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
