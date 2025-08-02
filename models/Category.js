import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  sortOrder: { type: Number, default: 0 },
  isShow: { type: Boolean, default: true }
});

export default mongoose.model('Category', CategorySchema);
