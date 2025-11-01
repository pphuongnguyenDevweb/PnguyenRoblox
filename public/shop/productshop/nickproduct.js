

// ✅ Lấy danh sách sản phẩm có category = "Nick" từ backend
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/nick/products`); // ✅ đúng route nick
    const data = await res.json();

    if (!data.success) throw new Error("Không thể tải sản phẩm");

    // Nếu backend chưa lọc, lọc thêm 1 lớp ở client
    const nickProducts = data.products.filter(
      (p) => p.category && p.category.toLowerCase() === "nick"
    );

    renderProducts(nickProducts.length ? nickProducts : data.products); // phòng trường hợp category không có
  } catch (err) {
    console.error("❌ Lỗi tải sản phẩm:", err);
    document.getElementById("product-list").innerHTML = `
      <p class="text-center text-red-500">Không thể tải danh sách nick.</p>
    `;
  }
}

// ✅ Hiển thị danh sách nick
function renderProducts(products) {
  const container = document.getElementById("product-list");
  if (!products.length) {
    container.innerHTML = `<p class="text-center col-span-full text-gray-500">Không có nick nào để bán.</p>`;
    return;
  }

  container.innerHTML = products
    .map(
      (p) => `
      <div class="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
        <img src="${p.image_url || '/images/no-image.png'}" class="w-full h-40 object-cover rounded">
        <h3 class="mt-2 font-semibold text-lg">${p.name}</h3>
            <p class="text-sm text-gray-500 mb-1">🔥ACC GAME ROBLOX🔥</p>
              <p class="text-sm text-gray-500 mb-1">${p.description}</p>

        <p class="text-primary font-bold text-xl mb-3">${p.price.toLocaleString('vi-VN')}₫</p>
        <button 
          class="w-full bg-red-600 hover:bg-red-400 text-white py-2 rounded-lg font-semibold"
          onclick="buyProduct('${p._id}')">
          <i class="fas fa-shopping-cart mr-1"></i> Mua Ngay
        </button>
      </div>
    `
    )
    .join("");
}

// ✅ Mua nick
async function buyProduct(productId) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ Vui lòng đăng nhập trước khi mua!");
    window.location.href = "/auth/login.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/nick/buy/${productId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Mua thất bại");

    // ✅ Hiển thị popup mua thành công
    showPurchasePopup(data.account, data.new_balance);
  } catch (err) {
    console.error("❌ Lỗi khi mua:", err);
    alert(`❌ ${err.message}`);
  }
}

// ✅ Popup thông tin nick sau khi mua
function showPurchasePopup(account, newBalance) {
  const popup = document.createElement("div");
  popup.className =
    "fixed inset-0 flex items-center justify-center bg-black/50 z-50";
  popup.innerHTML = `
    <div class="bg-white p-6 rounded-xl shadow-xl w-96 text-center">
      <h2 class="text-2xl font-bold text-green-600 mb-2">🎉 Mua Nick THÀNH CÔNG!</h2>
      <div class="bg-gray-100 p-4 rounded text-left text-sm font-mono">
        <p><strong>Tên đăng nhập:</strong> ${account.username}</p>
        <p><strong>Mật khẩu:</strong> ${account.password}</p>
        <p><strong>Ghi chú:</strong> ${account.note}</p>
      </div>
      <p class="mt-3 text-gray-700 font-semibold">Số dư còn lại: ${newBalance.toLocaleString()}đ</p>
      <button class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg" onclick="this.closest('.fixed').remove()">Đóng</button>
    </div>
  `;
  document.body.appendChild(popup);
}

document.addEventListener("DOMContentLoaded", loadProducts);
