
(function() {
  const mongoose = require('mongoose');
  const dbUrl = 'mongodb://' + process.env.DB_USER + ':' + process.env.DB_PASSWORD + '@' + process.env.DB_URL;
  const Schema = mongoose.Schema;
  const recordSchema = new Schema({
    url: {type: String, required: true},
    name: {type: String, required: true},
    email: {type: String, required: true},
    admin: {type: Boolean, required: true},
    case: {type: Number, required: true},
    grant_date: { type: Date, default: Date.now, required: true },
    revoke_date: { type: Date },
    support_url: {type: String, required: true},
    token: {type: String, required: true},
    uid: {type: String, required: true, unique: true}
  });
  const Record = mongoose.model('Record', recordSchema);
  
  async function save(record) {
    mongoose.connect(dbUrl);
    await record.save();
  }
  
  async function findRecord(query) {
    mongoose.connect(dbUrl);
    return await Record.findOne(query);
  }
  
  async function findRecords(query) {
    mongoose.connect(dbUrl);
    return await Record.find(query);
  }

  
  module.exports = {
    Record,
    save,
    findRecord
  };

}());