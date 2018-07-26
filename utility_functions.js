(function () {
  const fs = require('fs-extra');
  const sprintf = require('sprintf-js').sprintf;
  const crypto = require('crypto'),
        algorithm = 'aes-256-ctr',
        password = process.env.ENCRYPTION_PASSWORD;

  
  function isAdmin(type) {
    if (type == 'N') {
      return false;
    } else if (type == 'A') {
      return true;
    } else {
      throw "Invalid type";
    }
  }
  
  
  async function formatLongText(filePath, values) {
    let text = (await fs.readFile(filePath)).toString();
    text = sprintf(text, values);
    return text;
  }

  
  function generateId(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  function encrypt(text){
    var cipher = crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
  }

  function decrypt(text){
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
  }

  
  
  module.exports.isAdmin = isAdmin;
  module.exports.formatLongText = formatLongText;
  module.exports.generateId = generateId;
  module.exports.encrypt = encrypt;
  module.exports.decrypt = decrypt;
}());