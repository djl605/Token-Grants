(function() {
  const mu = require('./manuscript');
  const util = require('./utility_functions');

  async function validateSupportLogin(ourdotUrl, ourdotToken, supportPerson) {
    if (!await mu.validateToken(ourdotUrl, ourdotToken)) {
      return null;
    }

    let person = await mu.validateUserInfo(ourdotUrl, ourdotToken);
    if (!person || person.name != supportPerson) {
      return null;
    }

    return person;

  }


  async function logAccessGrant(name, url, email, admin, caseNumber, grantDate) {
    const editText = await util.formatLongText('./long_strings/access_granted.txt',
                                                { name: name,
                                                  url: url,
                                                  customer_email: email,
                                                  type: admin ? 'Administrator' : 'Normal',
                                                  case: caseNumber,
                                                  grant_date: grantDate
                                                });
    const editParams = {
      ixBug: caseNumber,
      sEvent: editText
    };
    await mu.editCase(editParams);
  }
  
  module.exports = {
    validateSupportLogin,
    logAccessGrant
  };

}());