import mongoose from 'mongoose';

const secretSchema = mongoose.Schema({
    secretId: {
      type: Number,
      required: true
    },
    secretKey: {
      type: String,
      required: true
    },
    activationTime: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'secret',
    versionKey: false
  }
);
module.exports = mongoose.model('secret', secretSchema);