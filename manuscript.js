
(function() {
  const manuscript = require('manuscript-api')
  
  async function validateToken(url, token) {
    let mAPI = manuscript(url, token);
    try {
      await mAPI.logon();
      return true;
    }
    catch (error) {
      console.log(error);
      return false;
    }
  }
  
  async function validateUserInfo(url, token) {
    let mAPI = manuscript(url, token);
    try {
      let person = (await mAPI.viewPerson()).person;
      return {name: person.sFullName, admin: person.fAdministrator};
    }
    catch (error) {
      console.log(error);
      return false;
    }
  }
  
  async function verifySupportPerson(caseNumber) {
    const mAPI = manuscript(process.env.SUPPORT_URL, process.env.SUPPORT_TOKEN);
    const ixPerson = (await mAPI.viewCase({ixBug: caseNumber, cols: "ixPersonAssignedTo"})).case.ixPersonAssignedTo;
    try {
      const person = (await mAPI.viewPerson({ixPerson: ixPerson})).person;
      return {name: person.sFullName, admin: person.fAdministrator};
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  
  async function sendEmail(emailParams, url=process.env.SUPPORT_URL, token=process.env.SUPPORT_TOKEN) {
    const mAPI = manuscript(url, token);
    try {
      await mAPI.email(emailParams);
    } catch (error) {
      console.log(error);
      console.log('trying reply');
      try {
        await mAPI.reply(emailParams);
      } catch (error) {
        console.log(error);
      }
    }
  }
  
  async function reopenCase(caseNumber) {
    const mAPI = manuscript(process.env.SUPPORT_URL, process.env.SUPPORT_TOKEN);
    try {
      await mAPI.reopen({ixBug: caseNumber});
    } catch (error) {
      console.log(error);
    }
  }
  
  async function editCase(editParams, url=process.env.SUPPORT_URL, token=process.env.SUPPORT_TOKEN) {
    const mAPI = manuscript(url, token);
    try {
      await mAPI.edit(editParams);
    } catch (error) {
      console.log(error);
    }
  }
  
  async function logoff(url, token) {
    const mAPI = manuscript(url, token);
    await mAPI.logoff();
  }
  
  async function confirmValidSupportCase(caseNumber) {
    const mAPI = manuscript(process.env.SUPPORT_URL, process.env.SUPPORT_TOKEN);
    try {
      const bug = await mAPI.viewCase({ixBug: caseNumber, cols: "ixProject"});
      const ixProject = parseInt(bug.case.ixProject);
      return ixProject == process.env.SUPPORT_IX_PROJECT;
    } catch(e) {
      console.log(e);
      return false;
    }
  }


  module.exports = {
    validateToken,
    validateUserInfo,
    verifySupportPerson,
    sendEmail,
    reopenCase,
    editCase,
    logoff,
    confirmValidSupportCase
  }

}());