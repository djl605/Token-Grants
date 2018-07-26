(function() {
  const mu = require('./manuscript');
  const util = require('./utility_functions');

  async function confirmRevoke(record) {
    const messageValues = {url: record.url,
                           email: record.email,
                           type: record.type == 'A' ? 'Administrator' : 'Normal',
                           case: record.case,
                           grant_date: record.grant_date.toUTCString(),
                           revoke_date: record.revoke_date.toUTCString()
                          };
    const emailText = await util.formatLongText('./long_strings/revoke_email.txt', messageValues);
    const emailParams = {
      ixBug: record.case,
      sFrom: process.env.SUPPORT_EMAIL,
      sTo: record.email,
      sSubject: "Revoked Fog Creek access to your site and data",
      sEvent: emailText
    };

    await mu.sendEmail(emailParams);

  }
  
  module.exports = {
    confirmRevoke
  };

  
}());