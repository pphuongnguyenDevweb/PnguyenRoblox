// seed.js
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Lỗi: Không tìm thấy MONGO_URI trong file .env');
  process.exit(1);
}

async function seedProducts() {
  let connection;
  try {
    connection = await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công!');

    // === Danh sách sản phẩm cần seed ===
    const allProducts = [

///  { "name": "Graipuss Medussi - 1M/1s", "price": 24000, "category": "Dịch vụ - Cày thuê", "inventory_count": 8566663, "sold": 0, "is_active": true },
 // { "name": "Nuclearo Dinossauro - 15M/1s", "price": 85000, "category": "Dịch vụ - Cày thuê", "inventory_count": 26575678, "sold": 0, "is_active": true },
//  { "name": "La Grande Combinasion - 10M/1s", "price": 70000, "category": "Dịch vụ - Cày thuê", "inventory_count": 4356789, "sold": 0, "is_active": true },
 /// { "name": "Garama and Madundung - 50M/1s", "price": 250000, "category": "Dịch vụ - Cày thuê", "inventory_count": 4543590, "sold": 0, "is_active": true },
 // { "name": "Chicleteira Bicicleteira - 3.5M/1s", "price": 35000, "category": "Dịch vụ - Cày thuê", "inventory_count": 565765501, "sold": 0, "is_active": true },
//  { "name": "Pot Hotspot - 2.5M/1s", "price": 28000, "category": "Dịch vụ - Cày thuê", "inventory_count": 678901662, "sold": 0, "is_active": true },
//  { "name": "Los Tralaleritas - 500k/1s", "price": 20000, "category": "Dịch vụ - Cày thuê", "inventory_count": 65765123, "sold": 0, "is_active": true },
//  { "name": "Las Tralaleritas - 650k/1s", "price": 20000, "category": "Dịch vụ - Cày thuê", "inventory_count": 785673, "sold": 0, "is_active": true },
  //{ "name": "La Vacca Staturno Saturnita	 - 250k/1s", "price": 12000, "category": "Dịch vụ - Cày thuê", "inventory_count": 7890547, "sold": 0, "is_active": true },
//  { "name": "Chimpanzini Spiderini - 325k/1s", "price": 15000, "category": "Dịch vụ - Cày thuê", "inventory_count": 786276, "sold": 0, "is_active": true },
//  { "name": "Tortuginni Dragonfruitini - 350k/1s", "price": 15000, "category": "Dịch vụ - Cày thuê", "inventory_count": 863096, "sold": 0, "is_active": true },
//  { "name": "??RANDOM SECRET 1M - 10M??", "price": 35000, "category": "Dịch vụ - Cày thuê", "inventory_count": 863096, "sold": 0, "is_active": true },


  // MỤC TRÁI PREM BLOX FRUITT

  //{ "name": "Trái Gas - 675.999đ", "price": 675999, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
  //{ "name": "Trái Yeti - 830.000đ", "price": 830000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
  //{ "name": "Trái Dragon - 1.400.000đ", "price": 1400000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
  //{ "name": "Trái Control - 650.000đ", "price": 650000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
//  { "name": "Trái Venom - 680.000đ", "price": 680000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
//  { "name": "Trái Shadow - 680.000đ", "price": 680000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
  //{ "name": "Trái Dough - 655.000đ", "price": 655000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
//  { "name": "Trái Gravity - 636.000đ", "price": 636000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
//  { "name": "Trái Rumble - 599.000đ", "price": 599000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
//  { "name": "Trái Buddha - 445.000đ", "price": 445000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
//  { "name": "Trái Phoenix - 555.000đ", "price": 555000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
///  { "name": "Trái Leopard - 840.000đ", "price": 840000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
//  { "name": "Trái Spirit - 710.000đ", "price": 710000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
///  { "name": "Trái Mammoth - 650.000đ", "price": 650000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
/////  { "name": "Trái Kitsune - 1.150.000đ", "price": 1150000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
////  { "name": "Trái Dark - 260.000đ", "price": 260000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
////  { "name": "Trái Blizzard - 632.000đ", "price": 632000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
////  { "name": "Trái Pain - 615.000đ", "price": 615000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
///  { "name": "Trái T-rex - 650.000đ", "price": 650000, "category": "Gamepass", "inventory_count": 863096, "sold": 0, "is_active": true },
///  { "name": "Trái Sound - 530.000đ", "price": 530000, "category": "Gamepass", "inventory_count": 8631231096, "sold": 0, "is_active": true },
///  { "name": "Trái Love - 470.000đ", "price": 470000, "category": "Gamepass", "inventory_count": 31096, "sold": 0, "is_active": true },

//    { "name": "Trái Light - 300.000đ", "price": 300000, "category": "Gamepass", "inventory_count": 8631532231096, "sold": 0, "is_active": true },
//  { "name": "Trái Magma - 350.000đ", "price": 350000, "category": "Gamepass", "inventory_count": 313424096, "sold": 0, "is_active": true },




//MỤC CÀY THUÊ BOUNTY 
  //{ "name": "Cày Thêm 1M Bounty", "price": 25000, "category": "Dịch vụ - Cày thuê", "inventory_count": 8566663, "sold": 0, "is_active": true },
////  { "name": "Cày Thêm 3M Bounty", "price": 70000, "category": "Dịch vụ - Cày thuê", "inventory_count": 26575678, "sold": 0, "is_active": true },
///  { "name": "Cày thêm 5M Bounty", "price": 90000, "category": "Dịch vụ - Cày thuê", "inventory_count": 4356789, "sold": 0, "is_active": true },
///  { "name": "Cày thêm 10M Bounty", "price": 1750000, "category": "Dịch vụ - Cày thuê", "inventory_count": 4543590, "sold": 0, "is_active": true },
  //Mục Cày thuê DEAD RAILS
///  { "name": "1000 Bone - 1.000đ", "price": 10000, "category": "Dịch vụ - Cày thuê", "inventory_count": 8566663, "sold": 0, "is_active": true },
//  { "name": "5000 Bone - 20.000đ", "price": 20000, "category": "Dịch vụ - Cày thuê", "inventory_count": 26575678, "sold": 0, "is_active": true },
// { "name": "50000 Bone - 50.000đ", "price": 50000, "category": "Dịch vụ - Cày thuê", "inventory_count": 4543590, "sold": 0, "is_active": true },
//
  // Mục Kim cương Free fire 
//  { "name": "113 Kim cương - 30.000đ", "price": 30000, "category": "Gamepass", "inventory_count": 85574577, "sold": 0, "is_active": true },
///  { "name": "189 Kim cương - 50.000đ", "price": 50000, "category": "Gamepass", "inventory_count": 382384678, "sold": 0, "is_active": true },
////  { "name": "283 Kim cương - 70.000đ", "price": 70000, "category": "Gamepass", "inventory_count": 499999789, "sold": 0, "is_active": true },
///  { "name": "421 Kim cương - 100.000đ", "price": 100000, "category": "Gamepass", "inventory_count": 78590, "sold": 0, "is_active": true },
////  { "name": "900 Kim cương - 200.000đ", "price": 200000, "category": "Gamepass", "inventory_count": 56556464501, "sold": 0, "is_active": true },
///  { "name": "2264 Kim cương - 500.000đ", "price": 500000, "category": "Gamepass", "inventory_count": 61222232, "sold": 0, "is_active": true },
  // Mục Liên quân Mobile
//  { "name": "40 Quân huy - 30.000đ", "price": 30000, "category": "Gamepass", "inventory_count": 851234324237, "sold": 0, "is_active": true },
//  { "name": "102 Quân huy - 79.999đ", "price": 79999, "category": "Gamepass", "inventory_count": 3827868745678, "sold": 0, "is_active": true },
//  { "name": "204 Quân huy - 135.000đ", "price": 135000, "category": "Gamepass", "inventory_count": 45666689, "sold": 0, "is_active": true },
//  { "name": "408 Quân huy - 250.000đ", "price": 450000, "category": "Gamepass", "inventory_count": 78593240, "sold": 0, "is_active": true },
 // { "name": "1020 Quân huy - 610.000đ", "price": 610000, "category": "Gamepass", "inventory_count": 56556501, "sold": 0, "is_active": true },

  // Cày thuê 99 Night in the Forest
//  { "name": "Cày 50 Day - 50.000đ", "price": 50000, "category": "Dịch vụ - Cày thuê", "inventory_count": 8537, "sold": 0, "is_active": true },
//  { "name": "Cày 100 Day - 100.000đ", "price": 100000, "category": "Dịch vụ - Cày thuê", "inventory_count": 388745678, "sold": 0, "is_active": true },
//  { "name": "Cày 200 Day  - 195.000đ", "price": 195000, "category": "Dịch vụ - Cày thuê", "inventory_count": 6689, "sold": 0, "is_active": true },
//  { "name": "Cày 10 Day - 10.000đ", "price": 10000, "category": "Dịch vụ - Cày thuê", "inventory_count": 785650, "sold": 0, "is_active": true },
  
  // Mục
  //  { "name": "Acc grow a garden", "note_admin": "ACC TTT Login là vào nha","username":"Phnguyen2x2so2","password":"Phnguyen2222", "image_url":"https://i.postimg.cc/ydq8XTQ2/nickgag1.png",
   //    "price": 70500,"description": "Acc có Pet xịn, Cây Boneblossm !", "category": "Nick", "inventory_count": 740, "sold": false, "is_active": true },
//Game pass blox fruit
// { "name": "Dark Blade - 320.000đ", "price": 345000, "category": "Gamepass", "inventory_count": 6663, "sold": 0, "is_active": true },
// { "name": "X2 Mastery vĩnh viễn - 105.000đ", "price": 105000, "category": "Gamepass", "inventory_count": 75678, "sold": 0, "is_active": true },
//  { "name": "X2 Beli vĩnh viễn - 105.000đ", "price": 105000, "category": "Gamepass", "inventory_count": 4389, "sold": 0, "is_active": true },
//   { "name": "X2 Drop vĩnh viễn - 95.000đ", "price": 95000, "category": "Gamepass", "inventory_count": 450, "sold": 0, "is_active": true },
//  { "name": "+ 1 Fruit Storage - 100.000đ", "price": 100000, "category": "Gamepass", "inventory_count": 65501, "sold": 0, "is_active": true },
//  { "name": "Máy tìm Trái ác quỷ - 575.000đ", "price": 575000, "category": "Gamepass", "inventory_count": 6762, "sold": 0, "is_active": true },
//  { "name": "Fast Boat Vĩnh viễn - 95.000đ", "price": 95000, "category": "Gamepass", "inventory_count": 65501, "sold": 0, "is_active": true },
  // Plant VS Brainnot

 //   { "name": "Combo 5 Plant Tomatrio - 15.000đ", "price": 15000, "category": "Dịch vụ - Cày thuê", "inventory_count": 6663, "sold": 0, "is_active": true },
//  { "name": "Combo 5 Plant Mr Carrot - 15.000đ", "price": 15000, "category": "Dịch vụ - Cày thuê", "inventory_count": 75678, "sold": 0, "is_active": true },
//    { "name": "Combo 5 Plant Shroombino - 19.000đ", "price": 19000, "category": "Dịch vụ - Cày thuê", "inventory_count": 75678, "sold": 0, "is_active": true },
//  { "name": "Random Plant 50k DPS - 50.000đ", "price": 50000, "category": "Dịch vụ - Cày thuê", "inventory_count": 4389, "sold": 0, "is_active": true },
///  { "name": "Random Plant 100k DPS - 100.000đ", "price": 95000, "category": "Dịch vụ - Cày thuê", "inventory_count": 450, "sold": 0, "is_active": true },
///  { "name": "Random Plant 200K DPS - 175.000đ", "price": 175000, "category": "Dịch vụ - Cày thuê", "inventory_count": 65576876801, "sold": 0, "is_active": true },
  ///  { "name": "Random Plant 500k DPS - 350.000đ", "price": 350000, "category": "Dịch vụ - Cày thuê", "inventory_count": 6663, "sold": 0, "is_active": true },

  // BLUE BLOCK GAMEPASS
  //  { "name": "Vip - 90.000đ", "price": 90000, "category": "Gamepass", "inventory_count": 7686663, "sold": 0, "is_active": true },
 // { "name": "Private Server - 27.000đ ", "price": 27000, "category": "Gamepass", "inventory_count": 767585678, "sold": 0, "is_active": true },
   // { "name": "Toxic Emote - 40.000đ", "price": 40000, "category": "Gamepass", "inventory_count": 67575678, "sold": 0, "is_active": true },
  ///{ "name": "Skip Spin - 27.000đđ", "price": 27000, "category": "Gamepass", "inventory_count": 4386576579, "sold": 0, "is_active": true },
   // { "name": "Anime Emote - 85.000đ", "price": 85000, "category": "Gamepass", "inventory_count": 450676, "sold": 0, "is_active": true },

   


]




    console.log('🔍 Đang kiểm tra sản phẩm hiện tại trong DB...');
    const existingProducts = await Product.find({
      name: { $in: allProducts.map(p => p.name) }
    }).select('name');

    const existingNames = existingProducts.map(p => p.name);
    const newProducts = allProducts.filter(p => !existingNames.includes(p.name));

    if (newProducts.length > 0) {
      const inserted = await Product.insertMany(newProducts, { ordered: false });
      console.log(`✅ Đã thêm ${inserted.length} sản phẩm mới:`);
      inserted.forEach(p =>
        console.log(`   ➕ ${p.name} (${p.price.toLocaleString()}đ)`)
      );
    } else {
      console.log('✅ Không có sản phẩm mới cần thêm.');
    }

    // Hiển thị danh sách sản phẩm hiện tại
    const allActive = await Product.find({ is_active: true })
      .select('name price category inventory_count sold')
      .sort({ category: 1, name: 1 });

    console.log('\n📋 Danh sách sản phẩm active:');
    allActive.forEach(p => {
      console.log(`   - ${p.name} | ${p.price.toLocaleString()}đ | ${p.category} | Tồn kho: ${p.inventory_count}`);
    });
    console.log(`   Tổng cộng: ${allActive.length} sản phẩm active.`);

  } catch (err) {
    console.error('❌ Lỗi khi seed products:', err.message);
  } finally {
    if (connection) await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB.');
  }
}

seedProducts();
