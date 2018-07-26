(function() {
  const mu = require('./manuscript');
  const db = require('./db');
  const util = require('./utility_functions');
  
  
  function normalizeUrl(url) {
    url = url.toLowerCase();
    if (url.search('http://') == -1 && url.search('https://') == -1) {
      return 'https://' + url;
    }
    url = url.replace('kilnhg.com', 'manuscript.com');
    return url;
  }

  async function validateEntries(url, email, token, ourdotCaseNumber, type, response) {
    try {
      var shouldBeAdmin = util.isAdmin(type);
    } catch (e) {
      response.render("index", {error_text: "Something went wrong. Please click the link sent by Fog Creek Support again."});
      return null;
    }

    if (!await mu.validateToken(url, token)) {
      const errorText = 'Invalid token was provided. Please try again.';
      response.render("index", {site: url, email: email, token: token, case_number: ourdotCaseNumber, type: type, error_text: errorText});
      return null;
    }
    let person = await mu.validateUserInfo(url, token);
    if (shouldBeAdmin && !person.admin) {
      const errorText = "Fog Creek Support needs administrative access to diagnose this issue. Please have a Manuscript administrator generate the token.";
      response.render("index", {site: url, email: email, token: token, case_number: ourdotCaseNumber, type: type, error_text: errorText});
      return null;
    }

    if (!await mu.confirmValidSupportCase(ourdotCaseNumber)) {
      const errorText = 'Case ' + ourdotCaseNumber + ' is not a valid case number. Please grant to a valid case.';
      response.render("index", {site: url, email: email, token: token, case_number: ourdotCaseNumber, type: type, error_text: errorText});
      return null;
    }

    return person;
  }


  async function processGrant(url, person, email, ourdotCaseNumber, token, type, response) {
    const grantDate = new Date();
    const existingGrant = await db.findRecord({case: ourdotCaseNumber, revoke_date: null});
    if (existingGrant) {
      renderGrant(existingGrant, person, response);
      return;
    }

    const record = new db.Record({url: url, name: person.name, email: email, admin: person.admin, case: ourdotCaseNumber, support_url: process.env.SUPPORT_URL, token: util.encrypt(token), uid: util.generateId(16)});
    try {
      await db.save(record);
      await confirmGrant(record);
    }
    catch (error) {
      const errorText = 'Something went wrong. Please try again. If the problem persists, please contact us';
      response.render("index", {site: url, email: email, token: token, case_number: ourdotCaseNumber, type: type, error_text: errorText});
      return;
    }

    renderGrant(record, person, response);
  }


  async function confirmGrant(record) {
    const messageValues = {url: record.url,
                           email: record.email,
                           type: record.admin ? 'Administrator' : 'Normal',
                           case: record.case,
                           grant_date: record.grant_date.toUTCString(),
                           uid: record.uid
                          };

    await mu.reopenCase(record.case);
    await sendConfirmationEmail(messageValues);
    await editCaseWithAccessDetails(messageValues);
  }


  async function sendConfirmationEmail(messageValues) {
    const emailText = await util.formatLongText('./long_strings/grant_email.txt', messageValues);
    const emailParams = {
      ixBug: messageValues.case,
      sFrom: process.env.SUPPORT_EMAIL,
      sTo: messageValues.email,
      sSubject: "Granted Fog Creek access to your site and data",
      sEvent: emailText
    };
    await mu.sendEmail(emailParams);
  }


  async function editCaseWithAccessDetails(messageValues) {
    const editText = await util.formatLongText('./long_strings/grant_case_edit.txt', messageValues);
    const editParams = {
      ixBug: messageValues.case,
      sEvent: editText
    };
    await mu.editCase(editParams);
  }


  function renderGrant(record, person, response) {
    response.render("grant", {url: record.url,
                              status: 'Granted and submitted to case',
                              user_name: person.name,
                              type: person.admin ? "Administrator" : "Normal",
                              case_number: record.case,
                              grant_time: record.grant_date});

  }

  
  module.exports = {
    normalizeUrl,
    validateEntries,
    processGrant
  };

}());