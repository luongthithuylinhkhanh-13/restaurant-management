const express = require("express");
const { Pool } = require("pg");
const client = require("prom-client");


const app = express();
app.disable("x-powered-by");
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
    host: process.env.DB_HOST || "postgres",
    port: 5432,
    database: process.env.DB_NAME || "restaurant_db",
    user: process.env.DB_USER || "restaurant_user",
    password: process.env.DB_PASSWORD
});

// Metrics cho Prometheus
client.collectDefaultMetrics();

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
});

// Kiểm tra hệ thống + database
app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            status: "OK",
            database: "CONNECTED"
        });
    } catch (error) {
        console.error("ERROR database:", error.message);

        res.status(500).json({
            status: "ERROR",
            database: "DISCONNECTED"
        });
    }
});

// Dashboard
app.get("/api/dashboard", async (req, res) => {
    try {
        const dishes =
            await pool.query("SELECT COUNT(*) FROM menu_items");

        const tables =
            await pool.query("SELECT COUNT(*) FROM restaurant_tables");

        const orders =
            await pool.query("SELECT COUNT(*) FROM orders");

        const revenue = await pool.query(`
            SELECT COALESCE(SUM(total_amount),0) AS total
            FROM orders
            WHERE status='PAID'
        `);

        res.json({
            dishes: Number(dishes.rows[0].count),
            tables: Number(tables.rows[0].count),
            orders: Number(orders.rows[0].count),
            revenue: Number(revenue.rows[0].total)
        });

    } catch (error) {
        console.error("ERROR dashboard:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Danh sách món
app.get("/api/menu", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, c.name AS category_name
            FROM menu_items m
            LEFT JOIN categories c
            ON m.category_id = c.id
            ORDER BY m.id
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("ERROR menu:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Thêm món
app.post("/api/menu", async (req, res) => {
    try {
        const { name, price, category_id } = req.body;

        const result = await pool.query(
            `INSERT INTO menu_items(name,price,category_id)
             VALUES($1,$2,$3)
             RETURNING *`,
            [name, price, category_id]
        );

        console.log("Created menu item:", name);

        res.json(result.rows[0]);

    } catch (error) {
        console.error("ERROR create menu:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Xóa món
app.delete("/api/menu/:id", async (req, res) => {
    try {
        await pool.query(
            "DELETE FROM menu_items WHERE id=$1",
            [req.params.id]
        );

        console.log("Deleted menu item:", req.params.id);

        res.json({ message: "Deleted" });

    } catch (error) {
        console.error("ERROR delete menu:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Danh sách bàn
app.get("/api/tables", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM restaurant_tables ORDER BY id"
        );

        res.json(result.rows);

    } catch (error) {
        console.error("ERROR tables:", error.message);
        res.status(500).json({ error: error.message });
    }
});
// Thêm bàn ăn
app.post("/api/tables", async (req, res) => {
    try {
        const { table_number, capacity } = req.body;

        if (!table_number || !capacity) {
            return res.status(400).json({
                error: "Vui lòng nhập đầy đủ số bàn và sức chứa"
            });
        }

        const result = await pool.query(
            `INSERT INTO restaurant_tables
             (table_number, capacity, status)
             VALUES ($1, $2, 'AVAILABLE')
             RETURNING *`,
            [table_number, capacity]
        );

        console.log("Created table:", table_number);
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("ERROR create table:", error.message);
        res.status(500).json({ error: error.message });
    }
});


// Sửa bàn ăn
app.put("/api/tables/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { table_number, capacity, status } = req.body;

        const result = await pool.query(
            `UPDATE restaurant_tables
             SET table_number = $1,
                 capacity = $2,
                 status = $3
             WHERE id = $4
             RETURNING *`,
            [table_number, capacity, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Không tìm thấy bàn"
            });
        }

        console.log("Updated table:", id);
        res.json(result.rows[0]);

    } catch (error) {
        console.error("ERROR update table:", error.message);
        res.status(500).json({ error: error.message });
    }
});


// Xóa bàn ăn
app.delete("/api/tables/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM restaurant_tables
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Không tìm thấy bàn"
            });
        }

        console.log("Deleted table:", id);

        res.json({
            message: "Đã xóa bàn thành công"
        });

    } catch (error) {
        console.error("ERROR delete table:", error.message);

        if (error.code === "23503") {
            return res.status(409).json({
                error: "Bàn đã có đơn hàng nên không thể xóa"
            });
        }

        res.status(500).json({ error: error.message });
    }
});
// Danh sách đơn hàng
app.get("/api/orders", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.*, t.table_number
            FROM orders o
            LEFT JOIN restaurant_tables t
            ON o.table_id=t.id
            ORDER BY o.created_at DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("ERROR orders:", error.message);
        res.status(500).json({ error: error.message });
    }
});
// Chi tiết một đơn hàng
app.get("/api/orders/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const orderResult = await pool.query(
            `SELECT o.*, t.table_number
             FROM orders o
             LEFT JOIN restaurant_tables t ON o.table_id = t.id
             WHERE o.id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                error: "Không tìm thấy đơn hàng"
            });
        }

        const itemResult = await pool.query(
            `SELECT oi.id,
                    oi.menu_item_id,
                    m.name,
                    oi.quantity,
                    oi.price,
                    (oi.quantity * oi.price) AS subtotal
             FROM order_items oi
             JOIN menu_items m ON oi.menu_item_id = m.id
             WHERE oi.order_id = $1
             ORDER BY oi.id`,
            [id]
        );

        res.json({
            ...orderResult.rows[0],
            items: itemResult.rows
        });

    } catch (error) {
        console.error("ERROR order detail:", error.message);
        res.status(500).json({ error: error.message });
    }
});


// Tạo đơn hàng
app.post("/api/orders", async (req, res) => {
    const client = await pool.connect();

    try {
        const { table_id, items } = req.body;

        if (!table_id || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: "Vui lòng chọn bàn và ít nhất một món ăn"
            });
        }

        await client.query("BEGIN");

        // Kiểm tra bàn
        const tableResult = await client.query(
            `SELECT * FROM restaurant_tables
             WHERE id = $1
             FOR UPDATE`,
            [table_id]
        );

        if (tableResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                error: "Không tìm thấy bàn"
            });
        }

        if (tableResult.rows[0].status !== "AVAILABLE") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                error: "Bàn này đang được sử dụng"
            });
        }

        let totalAmount = 0;
        const validatedItems = [];

        // Lấy giá món trực tiếp từ database
        for (const item of items) {
            const quantity = Number(item.quantity);

            if (!Number.isInteger(quantity) || quantity <= 0) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    error: "Số lượng món không hợp lệ"
                });
            }

            const menuResult = await client.query(
                `SELECT id, name, price, status
                 FROM menu_items
                 WHERE id = $1`,
                [item.menu_item_id]
            );

            if (menuResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    error: "Không tìm thấy món ăn"
                });
            }

            const menu = menuResult.rows[0];

            if (menu.status !== "AVAILABLE") {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    error: `Món ${menu.name} hiện không phục vụ`
                });
            }

            const price = Number(menu.price);

            totalAmount += price * quantity;

            validatedItems.push({
                menu_item_id: menu.id,
                quantity,
                price
            });
        }

        // Tạo order
        const orderResult = await client.query(
            `INSERT INTO orders
                (table_id, status, total_amount)
             VALUES ($1, 'OPEN', $2)
             RETURNING *`,
            [table_id, totalAmount]
        );

        const order = orderResult.rows[0];

        // Thêm từng món vào order_items
        for (const item of validatedItems) {
            await client.query(
                `INSERT INTO order_items
                    (order_id, menu_item_id, quantity, price)
                 VALUES ($1, $2, $3, $4)`,
                [
                    order.id,
                    item.menu_item_id,
                    item.quantity,
                    item.price
                ]
            );
        }

        // Chuyển bàn sang đang sử dụng
        await client.query(
            `UPDATE restaurant_tables
             SET status = 'OCCUPIED'
             WHERE id = $1`,
            [table_id]
        );

        await client.query("COMMIT");

        console.log("Created order:", order.id);

        res.status(201).json(order);

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("ERROR create order:", error.message);

        res.status(500).json({
            error: error.message
        });

    } finally {
        client.release();
    }
});


// Thanh toán đơn hàng
app.put("/api/orders/:id/pay", async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query("BEGIN");

        const orderResult = await client.query(
            `SELECT *
             FROM orders
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                error: "Không tìm thấy đơn hàng"
            });
        }

        const order = orderResult.rows[0];

        if (order.status === "PAID") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                error: "Đơn hàng đã được thanh toán"
            });
        }

        const updatedOrder = await client.query(
            `UPDATE orders
             SET status = 'PAID'
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        // Trả bàn về trạng thái trống
        if (order.table_id) {
            await client.query(
                `UPDATE restaurant_tables
                 SET status = 'AVAILABLE'
                 WHERE id = $1`,
                [order.table_id]
            );
        }

        await client.query("COMMIT");

        console.log("Paid order:", id);

        res.json(updatedOrder.rows[0]);

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("ERROR pay order:", error.message);

        res.status(500).json({
            error: error.message
        });

    } finally {
        client.release();
    }
});
app.put('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category_id, status } = req.body;

    const result = await pool.query(
      `UPDATE menu_items
       SET name = $1,
           price = $2,
           description = $3,
           category_id = $4,
           status = $5
       WHERE id = $6
       RETURNING *`,
      [
        name,
        price,
        description || '',
        category_id || null,
        status || 'AVAILABLE',
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({ error: error.message });
  }
});
app.listen(PORT, "0.0.0.0", () => {
    console.log(
        "Restaurant Management running on port " + PORT
    );
});
