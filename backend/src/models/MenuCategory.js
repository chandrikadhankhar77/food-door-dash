import mongoose from 'mongoose';

const menuCategorySchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 80,
    },
    description: { type: String, trim: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuCategorySchema.index({ restaurant: 1, sortOrder: 1 });
menuCategorySchema.index({ restaurant: 1, name: 1 }, { unique: true });

const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);
export default MenuCategory;
