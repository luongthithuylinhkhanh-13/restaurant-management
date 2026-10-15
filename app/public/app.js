async function showDashboard() {
    document.getElementById("page-title").innerText = "Tổng quan";

    const data =
        await fetch("/api/dashboard").then(r => r.json());

    document.getElementById("content").innerHTML = `
        <div class="cards">

            <div class="card">
                <h3>Món ăn</h3>
                <strong>${data.dishes}</strong>
                <p>Tổng số món</p>
            </div>

            <div class="card">
                <h3>Bàn ăn</h3>
                <strong>${data.tables}</strong>
                <p>Tổng số bàn</p>
            </div>

            <div class="card">
                <h3>Đơn hàng</h3>
                <strong>${data.orders}</strong>
                <p>Tổng đơn hàng</p>
            </div>

            <div class="card">
                <h3>Doanh thu</h3>
                <strong>
                    ${Number(data.revenue).toLocaleString("vi-VN")} đ
                </strong>
                <p>Đã thanh toán</p>
            </div>

        </div>
    `;
}

async function showMenu() {
  document.getElementById("page-title").innerText = "Quản lý món ăn";
  const main = document.getElementById('content');

  const response = await fetch('/api/menu');
  const items = await response.json();

  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Quản lý món ăn</h1>
        <p>Thêm, sửa và xóa các món ăn của nhà hàng</p>
      </div>

      <button class="btn-primary" onclick="showAddMenuForm()">
        + Thêm món ăn
      </button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên món</th>
            <th>Giá</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.id}</td>
              <td>${item.name}</td>
              <td>${Number(item.price).toLocaleString('vi-VN')} đ</td>

              <td>
                <span class="status">
                  ${item.status}
                </span>
              </td>

              <td>
                <button
                  class="btn-edit"
                  onclick='showEditMenuForm(${JSON.stringify(item)})'>
                  Sửa
                </button>

                <button
                  class="btn-delete"
                  onclick="deleteMenu(${item.id})">
                  Xóa
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div id="menu-form"></div>
  `;
}
function showAddMenuForm() {
  document.getElementById('menu-form').innerHTML = `
    <div class="form-card">
      <h2>Thêm món ăn</h2>

      <input id="menu-name"
             type="text"
             placeholder="Tên món">

      <input id="menu-price"
             type="number"
             placeholder="Giá">

      <input id="menu-description"
             type="text"
             placeholder="Mô tả">

      <select id="menu-category">
        <option value="1">Món chính</option>
        <option value="2">Đồ uống</option>
        <option value="3">Khai vị</option>
        <option value="4">Tráng miệng</option>
      </select>

      <button class="btn-primary"
              onclick="addMenu()">
        Lưu món ăn
      </button>

      <button class="btn-secondary"
              onclick="showMenu()">
        Hủy
      </button>
    </div>
  `;
}
async function addMenu() {
  const name = document.getElementById('menu-name').value;
  const price = document.getElementById('menu-price').value;
  const description =
    document.getElementById('menu-description').value;
  const category_id =
    document.getElementById('menu-category').value;

  if (!name || !price) {
    alert('Vui lòng nhập tên món và giá');
    return;
  }

  const response = await fetch('/api/menu', {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      name,
      price: Number(price),
      description,
      category_id: Number(category_id),
      status: 'AVAILABLE'
    })
  });

  if (response.ok) {
    alert('Thêm món ăn thành công');
    showMenu();
  } else {
    alert('Không thể thêm món ăn');
  }
}
function showEditMenuForm(item) {
  document.getElementById('menu-form').innerHTML = `
    <div class="form-card">

      <h2>Sửa món ăn</h2>

      <input id="edit-name"
             value="${item.name}">

      <input id="edit-price"
             type="number"
             value="${item.price}">

      <input id="edit-description"
             value="${item.description || ''}"
             placeholder="Mô tả">

      <select id="edit-status">
        <option value="AVAILABLE"
          ${item.status === 'AVAILABLE' ? 'selected' : ''}>
          AVAILABLE
        </option>

        <option value="UNAVAILABLE"
          ${item.status === 'UNAVAILABLE' ? 'selected' : ''}>
          UNAVAILABLE
        </option>
      </select>

      <button class="btn-primary"
              onclick="updateMenu(${item.id}, ${item.category_id || 1})">
        Lưu thay đổi
      </button>

      <button class="btn-secondary"
              onclick="showMenu()">
        Hủy
      </button>

    </div>
  `;
}
async function updateMenu(id, category_id) {
  const name =
    document.getElementById('edit-name').value;

  const price =
    document.getElementById('edit-price').value;

  const description =
    document.getElementById('edit-description').value;

  const status =
    document.getElementById('edit-status').value;

  const response = await fetch(`/api/menu/${id}`, {
    method: 'PUT',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      name,
      price: Number(price),
      description,
      category_id,
      status
    })
  });

  if (response.ok) {
    alert('Cập nhật món ăn thành công');
    showMenu();
  } else {
    alert('Không thể cập nhật món ăn');
  }
}
async function deleteMenu(id) {
  const confirmed =
    confirm('Bạn có chắc chắn muốn xóa món ăn này?');

  if (!confirmed) return;

  const response =
    await fetch(`/api/menu/${id}`, {
      method: 'DELETE'
    });

  if (response.ok) {
    alert('Xóa món ăn thành công');
    showMenu();
  } else {
    alert('Không thể xóa món ăn');
  }
}
async function showTables() {
    document.getElementById("page-title").innerText = "Quản lý bàn ăn";

    const data = await fetch("/api/tables").then(r => r.json());

    document.getElementById("content").innerHTML = `
        <div class="page-header">
            <div>
                <h1>Quản lý bàn ăn</h1>
                <p>Quản lý bàn và trạng thái sử dụng trong nhà hàng</p>
            </div>

            <button class="btn-primary" onclick="showAddTableForm()">
                + Thêm bàn
            </button>
        </div>

        <div class="table-grid">
            ${data.map(table => `
                <div class="table-card">
                    <h2>${table.table_number}</h2>

                    <p>Sức chứa: ${table.capacity} người</p>

                    <strong class="${
                        table.status === "AVAILABLE"
                            ? "available"
                            : "occupied"
                    }">
                        ${
                            table.status === "AVAILABLE"
                                ? "TRỐNG"
                                : "ĐANG SỬ DỤNG"
                        }
                    </strong>

                    <div style="margin-top:20px">
                        <button
                            class="btn-edit"
                            onclick='showEditTableForm(${JSON.stringify(table)})'>
                            Sửa
                        </button>

                        <button
                            class="btn-delete"
                            onclick="deleteTable(${table.id})">
                            Xóa
                        </button>
                    </div>
                </div>
            `).join("")}
        </div>

        <div id="table-form"></div>
    `;
}
function showAddTableForm() {
    document.getElementById("table-form").innerHTML = `
        <div class="form-card">
            <h2>Thêm bàn ăn</h2>

            <input
                id="table-number"
                type="text"
                placeholder="Tên bàn, ví dụ: Bàn 06">

            <input
                id="table-capacity"
                type="number"
                min="1"
                placeholder="Sức chứa">

            <button class="btn-primary" onclick="addTable()">
                Lưu bàn
            </button>

            <button onclick="document.getElementById('table-form').innerHTML=''">
                Hủy
            </button>
        </div>
    `;

    document.getElementById("table-form")
        .scrollIntoView({ behavior: "smooth" });
}


async function addTable() {
    const table_number =
        document.getElementById("table-number").value.trim();

    const capacity =
        Number(document.getElementById("table-capacity").value);

    if (!table_number || capacity <= 0) {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    const response = await fetch("/api/tables", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            table_number,
            capacity
        })
    });

    const result = await response.json();

    if (response.ok) {
        alert("Thêm bàn thành công");
        showTables();
    } else {
        alert(result.error || "Không thể thêm bàn");
    }
}
function showEditTableForm(table) {
    document.getElementById("table-form").innerHTML = `
        <div class="form-card">
            <h2>Sửa bàn ăn</h2>

            <input
                id="edit-table-number"
                type="text"
                value="${table.table_number}">

            <input
                id="edit-table-capacity"
                type="number"
                value="${table.capacity}">

            <select id="edit-table-status">
                <option value="AVAILABLE"
                    ${table.status === "AVAILABLE" ? "selected" : ""}>
                    TRỐNG
                </option>

                <option value="OCCUPIED"
                    ${table.status === "OCCUPIED" ? "selected" : ""}>
                    ĐANG SỬ DỤNG
                </option>
            </select>

            <button
                class="btn-primary"
                onclick="updateTable(${table.id})">
                Lưu thay đổi
            </button>

            <button
                onclick="document.getElementById('table-form').innerHTML=''">
                Hủy
            </button>
        </div>
    `;

    document.getElementById("table-form")
        .scrollIntoView({ behavior: "smooth" });
}


async function updateTable(id) {
    const table_number =
        document.getElementById("edit-table-number").value.trim();

    const capacity =
        Number(document.getElementById("edit-table-capacity").value);

    const status =
        document.getElementById("edit-table-status").value;

    const response = await fetch(`/api/tables/${id}`, {
        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            table_number,
            capacity,
            status
        })
    });

    const result = await response.json();

    if (response.ok) {
        alert("Cập nhật bàn thành công");
        showTables();
    } else {
        alert(result.error || "Không thể cập nhật bàn");
    }
}
async function deleteTable(id) {
    if (!confirm("Bạn có chắc muốn xóa bàn này?")) {
        return;
    }

    const response = await fetch(`/api/tables/${id}`, {
        method: "DELETE"
    });

    const result = await response.json();

    if (response.ok) {
        alert("Xóa bàn thành công");
        showTables();
    } else {
        alert(result.error || "Không thể xóa bàn");
    }
}
async function showOrders() {
    document.getElementById("page-title").innerText = "Quản lý đơn hàng";

    const orders = await fetch("/api/orders").then(r => r.json());

    document.getElementById("content").innerHTML = `
        <div class="page-header">
            <div>
                <h1>Quản lý đơn hàng</h1>
                <p>Tạo đơn, xem chi tiết và thanh toán</p>
            </div>

            <button class="btn-primary" onclick="showCreateOrderForm()">
                + Tạo đơn hàng
            </button>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Mã đơn</th>
                        <th>Bàn</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Thời gian</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>

                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>#${order.id}</td>

                            <td>${order.table_number || "-"}</td>

                            <td>
                                ${Number(order.total_amount)
                                    .toLocaleString("vi-VN")} đ
                            </td>

                            <td>
                                ${order.status === "PAID"
                                    ? "ĐÃ THANH TOÁN"
                                    : "CHƯA THANH TOÁN"}
                            </td>

                            <td>
                                ${new Date(order.created_at)
                                    .toLocaleString("vi-VN")}
                            </td>

                            <td>
                                <button
                                    class="btn-edit"
                                    onclick="showOrderDetail(${order.id})">
                                    Chi tiết
                                </button>

                                ${order.status !== "PAID" ? `
                                    <button
                                        class="btn-primary"
                                        onclick="payOrder(${order.id})">
                                        Thanh toán
                                    </button>
                                ` : ""}
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>

        <div id="order-form"></div>
    `;
}
async function showCreateOrderForm() {

    const tables = await fetch("/api/tables")
        .then(r => r.json());

    const menu = await fetch("/api/menu")
        .then(r => r.json());

    const availableTables =
        tables.filter(t => t.status === "AVAILABLE");

    const availableMenu =
        menu.filter(m => m.status === "AVAILABLE");

    document.getElementById("order-form").innerHTML = `
        <div class="form-card">

            <h2>Tạo đơn hàng mới</h2>

            <label>Chọn bàn</label>

            <select id="order-table">
                <option value="">
                    -- Chọn bàn --
                </option>

                ${availableTables.map(table => `
                    <option value="${table.id}">
                        ${table.table_number}
                        - ${table.capacity} người
                    </option>
                `).join("")}
            </select>

            <h3>Chọn món</h3>

            <div class="order-menu-list">

                ${availableMenu.map(item => `
                    <div class="order-menu-item">

                        <div>
                            <strong>${item.name}</strong>

                            <div>
                                ${Number(item.price)
                                    .toLocaleString("vi-VN")} đ
                            </div>
                        </div>

                        <input
                            class="order-quantity"
                            type="number"
                            min="0"
                            value="0"
                            data-id="${item.id}"
                            data-name="${item.name}"
                            data-price="${item.price}"
                            oninput="calculateOrderTotal()">

                    </div>
                `).join("")}

            </div>

            <div class="order-total">
                Tổng tiền:
                <strong id="order-total">
                    0 đ
                </strong>
            </div>

            <button
                class="btn-primary"
                onclick="createOrder()">
                Tạo đơn
            </button>

            <button
                class="btn-secondary"
                onclick="showOrders()">
                Hủy
            </button>

        </div>
    `;

    document.getElementById("order-form")
        .scrollIntoView({ behavior: "smooth" });
}
function calculateOrderTotal() {

    const inputs =
        document.querySelectorAll(".order-quantity");

    let total = 0;

    inputs.forEach(input => {

        const quantity =
            Number(input.value) || 0;

        const price =
            Number(input.dataset.price);

        total += quantity * price;
    });

    document.getElementById("order-total").innerText =
        total.toLocaleString("vi-VN") + " đ";
}
async function createOrder() {

    const table_id =
        Number(document.getElementById("order-table").value);

    if (!table_id) {
        alert("Vui lòng chọn bàn");
        return;
    }

    const inputs =
        document.querySelectorAll(".order-quantity");

    const items = [];

    inputs.forEach(input => {

        const quantity =
            Number(input.value);

        if (quantity > 0) {
            items.push({
                menu_item_id:
                    Number(input.dataset.id),

                quantity
            });
        }
    });

    if (items.length === 0) {
        alert("Vui lòng chọn ít nhất một món");
        return;
    }

    const response = await fetch("/api/orders", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            table_id,
            items
        })
    });

    const result = await response.json();

    if (response.ok) {

        alert(
            `Tạo đơn #${result.id} thành công`
        );

        showOrders();

    } else {

        alert(
            result.error ||
            "Không thể tạo đơn hàng"
        );
    }
}
async function showOrderDetail(id) {

    const order =
        await fetch(`/api/orders/${id}`)
            .then(r => r.json());

    document.getElementById("order-form").innerHTML = `
        <div class="form-card">

            <h2>Chi tiết đơn hàng #${order.id}</h2>

            <p>
                <strong>Bàn:</strong>
                ${order.table_number}
            </p>

            <p>
                <strong>Trạng thái:</strong>
                ${order.status}
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Món</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>

                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.name}</td>

                            <td>
                                ${Number(item.price)
                                    .toLocaleString("vi-VN")} đ
                            </td>

                            <td>${item.quantity}</td>

                            <td>
                                ${Number(item.subtotal)
                                    .toLocaleString("vi-VN")} đ
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            <h3>
                Tổng cộng:
                ${Number(order.total_amount)
                    .toLocaleString("vi-VN")} đ
            </h3>

            ${order.status !== "PAID" ? `
                <button
                    class="btn-primary"
                    onclick="payOrder(${order.id})">
                    Thanh toán
                </button>
            ` : ""}

            <button
                class="btn-secondary"
                onclick="showOrders()">
                Quay lại
            </button>

        </div>
    `;

    document.getElementById("order-form")
        .scrollIntoView({ behavior: "smooth" });
}
async function payOrder(id) {

    if (!confirm(
        `Xác nhận thanh toán đơn hàng #${id}?`
    )) {
        return;
    }

    const response =
        await fetch(`/api/orders/${id}/pay`, {
            method: "PUT"
        });

    const result =
        await response.json();

    if (response.ok) {

        alert("Thanh toán thành công");

        showOrders();

    } else {

        alert(
            result.error ||
            "Không thể thanh toán"
        );
    }
}
