let selectedProduct = null;
let userBalance = 0;

async function verifyToken() {
  const token = localStorage.getItem("token");

  if (!token) {
    // Thay vì redirect, chỉ thông báo
    alert("Bạn chưa đăng nhập!");
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/user/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (res.ok && data.success && data.user) {
      userBalance = data.user.balance || 0;
      const balanceEl = document.getElementById("user-balance");
      if (balanceEl) balanceEl.textContent = userBalance.toLocaleString() + "đ";
      return data.user;
    } else {
      // Thay vì xóa token + redirect, chỉ thông báo lỗi
      console.warn("Token không hợp lệ hoặc hết hạn.");
      return null;
    }
  } catch (err) {
    console.error("Lỗi khi xác thực token:", err);
    return null;
  }
}


// --- Load sản phẩm từ HTML ---
function loadProductsFromHTML() {
  const productEls = document.querySelectorAll(".option-item");
  const selectBox = document.getElementById("service-select");
  const optionsBox = document.getElementById("service-options");

  // Toggle dropdown
  selectBox.addEventListener("click", () => optionsBox.classList.toggle("hidden"));

  // Chọn sản phẩm
  productEls.forEach((el) => {
    el.addEventListener("click", () => {
      selectProduct(el);
      optionsBox.classList.add("hidden");
    });
  });

  // Click ngoài dropdown => ẩn
  document.addEventListener("click", e => {
    if (!selectBox.contains(e.target)) optionsBox.classList.add("hidden");
  });
}

// --- Chọn sản phẩm ---
function selectProduct(el) {
  document.querySelectorAll(".option-item").forEach(e => e.classList.remove("bg-blue-100"));
  el.classList.add("bg-blue-100");

  // Lấy dữ liệu sản phẩm
  selectedProduct = { 
    name: el.dataset.name.trim(), 
    price: Number(el.dataset.price) 
  };

  // Hiển thị sản phẩm đã chọn
  const displayEl = document.getElementById("selected-item-display");
  if (displayEl) {
    displayEl.textContent = `${selectedProduct.name} (${selectedProduct.price.toLocaleString()}đ)`;
    displayEl.classList.remove("hidden");
  }

  // Hiển thị tổng tiền
  const totalEl = document.getElementById("total-price");
  if (totalEl) totalEl.textContent = selectedProduct.price.toLocaleString() + "đ";

}





// --- Tạo đơn hàng ---
async function createOrder() {
  if (!selectedProduct) return alert("Vui lòng chọn sản phẩm!");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Vui lòng đăng nhập!");
    return window.location.href = "/auth.html";
  }

  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const note = document.getElementById("note")?.value.trim()
  const cookie = document.getElementById("cookie")?.value.trim()

  if (!username || !password) return alert("Vui lòng nhập tài khoản và mật khẩu!");
  if (userBalance < selectedProduct.price) return alert("Số dư không đủ.");

  // Disable nút
  const createBtn = document.getElementById("create-order-btn");
  createBtn.disabled = true;
  const originalText = createBtn.textContent;
  createBtn.textContent = "Đang xử lý...";

  // Payload gửi lên server (full info)
  const payload = {
    username,
    password,
    note,
    cookie,                       // tự động = tên sản phẩm
    product_name: selectedProduct.name,
    price: selectedProduct.price
  };

  console.log("Dữ liệu đặt hàng gửi lên server:", payload);

  try {
    const res = await fetch(`${API_BASE}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert(`✅ Đơn hàng #${data.order_id.toString().substring(0, 8)} đã tạo thành công!`);
      userBalance = data.new_balance;

      // Cập nhật số dư
      const balanceEl = document.getElementById("user-balance");
      if (balanceEl) balanceEl.textContent = userBalance.toLocaleString() + "đ";

      // Reset form
      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
      document.getElementById("note").value = "";
      document.getElementById("cookie").value = "";
      const selectedDisplay = document.getElementById("selected-item-display");
      if (selectedDisplay) selectedDisplay.classList.add("hidden");
      selectedProduct = null;

    } else {
      console.error("Lỗi từ server:", data);
      alert(`❌ ${data.error || "Có lỗi xảy ra. Vui lòng thử lại."}`);
    }

  } catch (err) {
    console.error("Lỗi khi gửi đơn hàng:", err);
    alert("Không thể kết nối máy chủ.");
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = originalText;
  }
}

// --- Init khi DOM load ---
document.addEventListener("DOMContentLoaded", async () => {
  await verifyToken();
  loadProductsFromHTML();
  document.getElementById("create-order-btn")?.addEventListener("click", createOrder);
});

