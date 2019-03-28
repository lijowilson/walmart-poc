import mongoose from 'mongoose';

const scrapeboardSchema = mongoose.Schema({
  username : {type:String,required:[ true,'username field is mandatory']},
  status : {type:String,required: [true , 'status field is mandatory' ]},
  orderIdList: {type:Array}
}, { collection: 'scrapeboard' });
module.exports = mongoose.model('scrapeboard', scrapeboardSchema);