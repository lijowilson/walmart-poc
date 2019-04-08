import mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;
const orderSchema = mongoose.Schema({
    customerId: {
      type: ObjectId,
      required: true
    },
    orderId: {
      type: Number,
      required: true
    },
    productList: {
      type: Array
    }
  },
  {
    collection: 'orders',
    versionKey: false
  }
);
module.exports = mongoose.model('orders', orderSchema);