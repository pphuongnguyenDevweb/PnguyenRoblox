const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    // ID người dùng đặt hàng (Bắt buộc)
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },

    // ID sản phẩm (Không bắt buộc, có thể là null cho các dịch vụ không liên quan đến Product Model)
    product_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        default: null 
    },

    // Tên sản phẩm/dịch vụ đã mua
    product_name: { 
        type: String, 
        required: true 
    },

    // Tổng số tiền giao dịch
    total_amount: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    
    // Thông tin tài khoản/dịch vụ cần xử lý:
    username: { 
        type: String 
    },
    password: { 
        type: String 
    },

    // Trạng thái đơn hàng
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'], 
        default: 'pending',
        index: true
    },

      cookie: { type: String, default: null }, // ✅ THÊM DÒNG NÀY

    category: { type: String, trim: true }, //category định dạng product cần lưu vào lịch sử

    
    // Các trường theo dõi quá trình xử lý:
    note: { 
        type: String 
    },
    admin_note: { 
        type: String 
    },
    processed_by: { 
        type: String 
    },
    processed_at: { 
        type: Date 
    }
}, { 
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } // Sử dụng tên trường mặc định của Mongoose
});

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
