// header.js
const API_BASE = "https://pnguyenroblox.onrender.com/api";

// --- Lấy dữ liệu user từ server nếu sessionStorage chưa có ---
async function getUser() {
    const token = localStorage.getItem("token");
    console.log("🔑 Token hiện tại:", token);
    if (!token) return null;

    try {
        const res = await fetch(`${API_BASE}/user/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("📡 Response status:", res.status);

        if (!res.ok) {
            const errData = await res.text();
            console.warn("⚠ Server trả lỗi:", errData);
            localStorage.removeItem("token");
            sessionStorage.removeItem('userData');
            return null;
        }

        const data = await res.json();
        console.log("✅ Dữ liệu nhận được:", data);

        if (data?.user) {
            localStorage.setItem('userData', JSON.stringify(data.user));
                sessionStorage.setItem('userData', JSON.stringify(data.user));
            return data.user;
        }

        return null;
    } catch (err) {
        console.error("🔥 Lỗi khi fetch user:", err);
        return null;
    }
}

// --- Cập nhật header UI (Desktop + Mobile) ---
async function showUserHeader() {
  const userBox = document.getElementById("user-display-box");
  const authLink = document.getElementById("auth-link");
  const userNameEl = document.getElementById("user-name");
  const userBalanceEl = document.getElementById("user-balance");
  const userAvatarEl = document.getElementById("user-avatar");

  // Mobile elements
  const mobileAuthLink = document.getElementById("mobile-auth-link");
  const mobileUserDisplay = document.getElementById("mobile-user-display");
  const mobileUserMenu = document.getElementById("mobile-user-menu");
  const mobileUserName = document.getElementById("mobile-user-name");
  const mobileUserBalance = document.getElementById("mobile-user-balance");
  const mobileUserAvatar = document.getElementById("mobile-user-avatar");

  let user = JSON.parse(sessionStorage.getItem('userData')) 
          || JSON.parse(localStorage.getItem('userData'));

  const token = localStorage.getItem("token");

  // 🚫 Nếu chưa có user và chưa có token thì ẩn luôn header user
  if (!user && !token) {
    userBox?.classList.add("hidden");
    authLink?.classList.remove("hidden");
    mobileAuthLink?.classList.remove("hidden");
    mobileUserDisplay?.classList.add("hidden");
    mobileUserMenu?.classList.add("hidden");
        setupMobileMenu(); // 🔧 vẫn gọi setup menu
    return;
  }

  // ✅ Nếu chưa có user nhưng có token → fetch từ server
  if (!user && token) {
    user = await getUser();
    if (user) sessionStorage.setItem('userData', JSON.stringify(user));
            await showUserHeader();
        return;
  }

  // --- Cập nhật giao diện Desktop ---
  if (user) {
    userBox?.classList.remove("hidden");
    authLink?.classList.add("hidden");
    if (userNameEl) userNameEl.textContent = user.display_name || user.username || "Người Dùng";
    if (userBalanceEl) userBalanceEl.textContent = (user.balance || 0).toLocaleString('vi-VN') + '₫';
    if (userAvatarEl) userAvatarEl.src = user.avatar || "https://qhuyroblox.com/images/avatar/av-1.svg";

    // --- Cập nhật giao diện Mobile ---
    mobileAuthLink?.classList.add("hidden");
    mobileUserDisplay?.classList.remove("hidden");
    mobileUserMenu?.classList.remove("hidden");
    if (mobileUserName) mobileUserName.textContent = user.display_name || user.username || "Người Dùng";
    if (mobileUserBalance) {
      const formattedBalance = (user.balance || 0).toLocaleString('vi-VN') + '₫';
      mobileUserBalance.innerHTML = `<i class="fas fa-wallet mr-1 text-xs"></i><span>${formattedBalance}</span>`;
    }
    if (mobileUserAvatar) mobileUserAvatar.src = user.avatar || "https://qhuyroblox.com/images/avatar/av-1.svg";
  } else {
    userBox?.classList.add("hidden");
    authLink?.classList.remove("hidden");
    mobileAuthLink?.classList.remove("hidden");
    mobileUserDisplay?.classList.add("hidden");
    mobileUserMenu?.classList.add("hidden");
  }

  setupDropdown();
  setupLogout();
  setupMobileMenu(); // ✅ Setup mobile menu
}

// --- Dropdown menu Desktop ---
function setupDropdown() {
    const userButton = document.getElementById("user-info-button");
    const dropdown = document.getElementById("user-dropdown");
    if (userButton && dropdown) {
        userButton.addEventListener("click", e => {
            e.stopPropagation();
            dropdown.classList.toggle("hidden");
        });
        document.addEventListener("click", e => {
            if (!userButton.contains(e.target)) dropdown.classList.add("hidden");
        });
    }
}

// --- Setup Mobile Menu ---
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const mobileOverlay = document.getElementById('mobile-overlay');

    if (!mobileMenuBtn || !mobileSidebar || !mobileOverlay) {
        console.warn('⚠️ Không tìm thấy mobile menu elements');
        return;
    }

    function openMobileMenu() {
        console.log('📱 Opening mobile menu...');
        mobileSidebar.classList.remove('translate-x-full');
        mobileOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Animation cho overlay
        setTimeout(() => {
            mobileOverlay.style.opacity = '1';
        }, 10);
    }

    function closeMobileMenu() {
        console.log('📱 Closing mobile menu...');
        mobileSidebar.classList.add('translate-x-full');
        mobileOverlay.style.opacity = '0';
        
        setTimeout(() => {
            mobileOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }

    // Remove old event listeners bằng cách clone
    const newMobileMenuBtn = mobileMenuBtn.cloneNode(true);
    mobileMenuBtn.parentNode.replaceChild(newMobileMenuBtn, mobileMenuBtn);

    const newCloseSidebarBtn = closeSidebarBtn.cloneNode(true);
    closeSidebarBtn.parentNode.replaceChild(newCloseSidebarBtn, closeSidebarBtn);

    const newMobileOverlay = mobileOverlay.cloneNode(true);
    mobileOverlay.parentNode.replaceChild(newMobileOverlay, mobileOverlay);

    // Add new event listeners
    newMobileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openMobileMenu();
    });

    newCloseSidebarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMobileMenu();
    });

    newMobileOverlay.addEventListener('click', () => {
        closeMobileMenu();
    });

    // Đóng menu khi click vào link
    const menuLinks = mobileSidebar.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            setTimeout(closeMobileMenu, 200);
        });
    });

    // Đóng khi nhấn ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mobileSidebar.classList.contains('translate-x-full')) {
            closeMobileMenu();
        }
    });

    // Đóng khi resize về desktop
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth >= 768) {
                closeMobileMenu();
            }
        }, 250);
    });

    console.log('✅ Mobile menu setup complete');
}

// --- Logout (Desktop + Mobile) ---
function setupLogout() {
    const logoutBtn = document.getElementById("logout-btn");
    const mobileLogoutBtn = document.getElementById("mobile-logout-btn");
    
    const handleLogout = () => {
        if (!confirm('Bạn có chắc muốn đăng xuất?')) return;

        localStorage.removeItem("token");
        sessionStorage.removeItem('userData');
        localStorage.removeItem('userData');
        
        // Đóng mobile menu nếu đang mở
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileOverlay = document.getElementById('mobile-overlay');
        if (mobileSidebar && !mobileSidebar.classList.contains('translate-x-full')) {
            mobileSidebar.classList.add('translate-x-full');
            if (mobileOverlay) {
                mobileOverlay.style.opacity = '0';
                setTimeout(() => mobileOverlay.classList.add('hidden'), 300);
            }
            document.body.style.overflow = '';
        }
        
        showToast("✅ Đăng xuất thành công!");
        setTimeout(() => {
            window.location.href = "../index.html";
        }, 500);
    };

    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        newLogoutBtn.addEventListener("click", handleLogout);
    }

    if (mobileLogoutBtn) {
        const newMobileLogoutBtn = mobileLogoutBtn.cloneNode(true);
        mobileLogoutBtn.parentNode.replaceChild(newMobileLogoutBtn, mobileLogoutBtn);
        newMobileLogoutBtn.addEventListener("click", handleLogout);
    }
}

// --- Cập nhật số dư realtime (Desktop + Mobile) ---
function updateHeaderBalance(newBalance) {
    // Desktop
    const balanceEl = document.getElementById("user-balance");
    if (balanceEl) balanceEl.textContent = newBalance.toLocaleString('vi-VN') + '₫';

    // Mobile
    const mobileBalanceEl = document.getElementById("mobile-user-balance");
    if (mobileBalanceEl) {
        const formattedBalance = newBalance.toLocaleString('vi-VN') + '₫';
        mobileBalanceEl.innerHTML = `<i class="fas fa-wallet mr-1 text-xs"></i><span>${formattedBalance}</span>`;
    }

    const userData = JSON.parse(sessionStorage.getItem('userData')) || {};
    userData.balance = newBalance;
    sessionStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('userData', JSON.stringify(userData));

    // ✅ Phát event custom để các phần khác cập nhật
    const event = new CustomEvent("userBalanceUpdated", { detail: newBalance });
    window.dispatchEvent(event);
}

// --- Toast thông báo ---
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-4 right-4 bg-white border border-gray-300 text-black px-4 py-2 rounded-lg shadow-lg z-[9999] transition-opacity duration-500";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- Socket.IO realtime ---
function initSocketRealtime() {
    const token = localStorage.getItem("token");
    if (!token || typeof io === "undefined") {
        console.warn("⚠️ Không có token hoặc Socket.IO chưa được load.");
        return;
    }

    try {
        const socket = io("https://pnguyenroblox.onrender.com", {
            transports: ["websocket"],
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
        });

        socket.on("connect", async () => {
            console.log("✅ Socket realtime connected:", socket.id);

            try {
                const res = await fetch(`${API_BASE}/user/me`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success && data.user) {
                    const user = data.user;
                    const joinId = user.encrypted_yw_id || user._id;

                    if (joinId) {
                        sessionStorage.setItem("userData", JSON.stringify(user));
                        socket.emit("joinUser", joinId);
                        console.log("📡 Joined user room:", joinId.substring(0, 8));
                    } else {
                        console.warn("⚠ Không thể joinUser — thiếu cả encrypted_yw_id và _id");
                    }
                } else {
                    console.warn("⚠ Không thể lấy thông tin user/me");
                }
            } catch (err) {
                console.error("❌ Lỗi khi gọi API /user/me:", err);
            }
        });

        socket.on("recharge_status_update", (data) => {
            console.log("💳 Cập nhật nạp thẻ realtime:", data);
            if (!data) return;

            if (data.status === "completed") {
                updateHeaderBalance(data.new_balance);
                showToast(`💳 Bạn vừa nạp thẻ thành công`);
            } else if (data.status === "failed") {
                showToast("❌ Bạn vừa Nạp thẻ thất bại");
            }
        });

        socket.on("order_status_update", (data) => {
            console.log("🛒 Cập nhật đơn hàng realtime:", data);
            if (!data) return;

            const orderId = data.id || data.order_id || "???";
            const status = data.status || "unknown";

            updateHeaderBalance(data.new_balance);
            if (status === "completed") {
                showToast(`📦 Đơn hàng #${orderId} đã được DUYỆT ✅`);
            } else if (status === "failed") {
                showToast(`❌ Đơn hàng #${orderId} đã bị HỦY.`);
            } else {
                showToast(`📦 Đơn hàng #${orderId} cập nhật trạng thái: ${status}`);
            }
        });

        socket.on("balance_update", (data) => {
            console.log("💰 Đồng bộ số dư realtime:", data);
            if (!data) return;

            updateHeaderBalance(data.new_balance);
            showToast(`💰 Số dư mới: ${data.new_balance.toLocaleString()}đ`);
        });

        socket.on("disconnect", (reason) => {
            console.warn("⚠️ Mất kết nối realtime:", reason);
        });

        socket.on("reconnect", (attempt) => {
            console.log(`🔄 Reconnect thành công sau ${attempt} lần thử.`);
            try {
                const user = JSON.parse(sessionStorage.getItem("userData"));
                if (user) {
                    const joinId = user.encrypted_yw_id || user._id;
                    if (joinId) {
                        socket.emit("joinUser", joinId);
                        console.log("🔁 Rejoined user room sau reconnect:", joinId.substring(0, 8));
                    }
                }
            } catch (err) {
                console.error("⚠️ Lỗi khi reconnect joinUser:", err);
            }
        });

        socket.on("reconnect_failed", () => {
            console.error("❌ Không thể reconnect tới server realtime sau nhiều lần thử.");
        });

    } catch (err) {
        console.error("🔥 Lỗi khi khởi tạo Socket.IO:", err);
        showToast("❌ Lỗi kết nối realtime, vui lòng tải lại trang.");
    }
}

// --- Lắng nghe storage để đồng bộ userData giữa các tab ---
window.addEventListener('storage', (event) => {
    if (event.key === 'userData') {
        const userBox = document.getElementById("user-display-box");
        const authLink = document.getElementById("auth-link");
        const mobileAuthLink = document.getElementById("mobile-auth-link");
        const mobileUserDisplay = document.getElementById("mobile-user-display");
        const mobileUserMenu = document.getElementById("mobile-user-menu");

        if (!event.newValue || event.newValue === "null") {
            userBox?.classList.add("hidden");
            authLink?.classList.remove("hidden");
            mobileAuthLink?.classList.remove("hidden");
            mobileUserDisplay?.classList.add("hidden");
            mobileUserMenu?.classList.add("hidden");
        } else {
            const userData = JSON.parse(event.newValue);
            sessionStorage.setItem('userData', event.newValue);
            if (userData?.balance != null) updateHeaderBalance(userData.balance);
            showUserHeader();
        }
    }
});

// --- Load header từ file header.html ---
async function loadHeader() {
    const container = document.getElementById('header-container');
    if (!container) return;

    try {
        const res = await fetch('/header/header.html');
        const html = await res.text();
        container.innerHTML = html;

        await showUserHeader();
        initSocketRealtime();
    } catch (err) {
        console.error("Không thể load header:", err);
    }
}

// --- Chạy khi DOM sẵn sàng ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadHeader();
});

// ✅ Cập nhật UI khi số dư thay đổi
window.addEventListener("userBalanceUpdated", (e) => {
    const newBalance = e.detail;
    
    const el = document.getElementById("user-balance");
    if (el) el.textContent = newBalance.toLocaleString('vi-VN') + '₫';
    
    const mobileEl = document.getElementById("mobile-user-balance");
    if (mobileEl) {
        const formattedBalance = newBalance.toLocaleString('vi-VN') + '₫';
        mobileEl.innerHTML = `<i class="fas fa-wallet mr-1 text-xs"></i><span>${formattedBalance}</span>`;
    }
});
