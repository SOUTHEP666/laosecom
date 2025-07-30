import mongoose from 'mongoose';

const SkuSchema = new mongoose.Schema({
  skuCode: String,
  spec: Object,        // { color: 'red', size: 'M' }
  price: Number,
  stock: Number
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  spuCode: { type: String, unique: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  description: String,
  images: [String],
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  skus: [SkuSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Product', ProductSchema);
