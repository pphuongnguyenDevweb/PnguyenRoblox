// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        required: true, 
        unique: true, // 👈 Đảm bảo tên là duy nhất
        trim: true      // 👈 Tự động cắt khoảng trắng thừa
    },
    category: { 
        type: String, 
        required: true, 
        trim: true 
  
    },
    price: { 
        type: Number, 
        required: true, 
        default: 0
    },

   inventory_count: {
     type: Number,
      default: 0 
    },

    sold: {
       type: Number,
       default: 0 
      },

    description: { 
        type: String 
    },

      username: { type: String, trim: true },
  password: { type: String, trim: true },
  note_admin: { type: String, trim: true },

  
    image_url: { 
        type: String 
    },
    is_active: { 
        type: Boolean, 
        default: true 
    },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
module.exports = Product;