require('dotenv').config();
const mongoose = require('mongoose');

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    // We don't want to load all schema models just for a quick check,
    // so we can use a raw collection or load the Product model
    require('./models/Product');
    const Product = mongoose.model('Product');
    
    const products = await Product.find({}, 'name category image images').lean();
    console.log(JSON.stringify(products.slice(0, 5), null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkProducts();
