import mongoose from 'mongoose';

const customerSchema = mongoose.Schema({
    username: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    orderIdList: {
      type: Array
    }
  },
  {
    collection: 'customer',
    versionKey: false
  }
);
module.exports = mongoose.model('customer', customerSchema);