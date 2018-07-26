// server.js
// where your node app starts

// init project
const express = require('express');
const exphbs  = require('express-handlebars');
const app = express();
const bodyParser = require('body-parser');

const mu = require('./manuscript');
const db = require('./db');
const util = require('./utility_functions');

const grantSubmitter = require('./grant_submission');
const grantRevoker = require('./grant_revocation');
const login = require('./login');
  

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


app.get("/", (request, response) => {
  response.send("Please follow link provided in email");
});

//////////////////////////////////////////////////////////////////////
// Grant form submission
//////////////////////////////////////////////////////////////////////

app.post("/", async (request, response) => {
  let url = request.body.account;
  const email = request.body.email;
  const token = request.body.token;
  const ourdotCaseNumber = request.body.ixBug;
  const type = request.body.type;
  url = grantSubmitter.normalizeUrl(url);
  console.log(url);
  const person = await grantSubmitter.validateEntries(url, email, token, ourdotCaseNumber, type, response);
  if (!person) {
      return;
  }
  
  await grantSubmitter.processGrant(url, person, email, ourdotCaseNumber, token, type, response);
});



//////////////////////////////////////////////////////////////////////
// Grant form request
//////////////////////////////////////////////////////////////////////

app.get("/grant/:type/:caseNumber", (request, response) => {
  let caseNumber = request.params['caseNumber'];
  caseNumber = caseNumber.replace(/\D/g,''); // Strip out non-numeric characters (because {case} in snippets includes the case prefix)
  response.render("index", {case_number: caseNumber, type: request.params['type']});
});


//////////////////////////////////////////////////////////////////////
// Token revocation
//////////////////////////////////////////////////////////////////////
app.get('/revoke/:uid', async (request, response) => {
  try {
    var record = await db.findRecord({uid: request.params['uid']});
  }
  catch (error) {
    response.send("Did not find record of token grant");
    return;
  }
  if (!record.revoke_date) {
    await mu.logoff(record.url, util.decrypt(record.token));
    record.revoke_date = new Date();
    await db.save(record);

  }
  await grantRevoker.confirmRevoke(record);
  response.render("grant", {url: record.url,
                            status: 'Revoked',
                            user_name: record.name,
                            type: record.admin ? 'Administrator' : 'Normal',
                            case_number: record.case,
                            grant_time: record.grant_date,
                            revoke_time: record.revoke_date
                           });
});


//////////////////////////////////////////////////////////////////////
// Support login form
//////////////////////////////////////////////////////////////////////

app.get('/access/:uid', async (request, response) => {
  const uid = request.params['uid'];
  try {
    var record = await db.findRecord({uid: uid});
  }
  catch (error) {
    response.send('Did not find record of token grant');
    return;
  }
  
  const caseNumber = record.case;
  const supportPerson = await mu.verifySupportPerson(caseNumber);
  if (!supportPerson) {
    response.send('Could not identify the intended support person');
    return;
  }
  response.render("supportlogin", {
    supportperson: supportPerson.name,
    uid: uid,
    casenumber: caseNumber
  });
  return;
});


//////////////////////////////////////////////////////////////////////
// Support login form submission
//////////////////////////////////////////////////////////////////////

app.post("/login", async (request, response) => {
  const supportPerson = request.body.name;
  const ourdotToken = request.body.token;
  const ourdotCaseNumber = request.body.ixBug;
  const uid = request.body.uid;
  const ourdotUrl = process.env.SUPPORT_URL;
  
  const person = await login.validateSupportLogin(ourdotUrl, ourdotToken, supportPerson);
  if (!person) {
    const errorText = "Invalid token was provided. Please try again.";
    response.render("supportlogin", {supportperson: supportPerson, casenumber: ourdotCaseNumber, uid: uid, error_text: errorText});
    return;
  }
  
  // Successfully validated as the assigned support person
  try {
    const record = await db.findRecord({uid: uid});
    const customerName = record.name;
    const url = record.url;
    const email = record.email;
    const admin = record.admin;
    const caseNumber = record.case;
    const supportUrl = record.support_url;
    const token = util.decrypt(record.token);
    const grantDate = record.grant_date;
    const revokeDate = record.revoke_date;
    
    const revoked = !!revokeDate;
    
    if (!revoked) {
      await login.logAccessGrant(supportPerson, url, email, admin, caseNumber, grantDate);
    }
    
    response.render("supportview", {
      status: revoked ? "Revoked" : "Granted and submitted to case",
      url: url,
      user_name: customerName,
      type: admin ? 'Administrator' : 'Normal',
      case_number: caseNumber,
      grant_time: grantDate,
      revokeDate: revokeDate,
      token: token
    });
    return;
  }
  catch (error) {
    console.log(error);
    const errorText = 'Something went wrong. Please try again.';
    response.render("supportlogin", {supportperson: supportPerson, casenumber: ourdotCaseNumber, uid: uid, error_text: errorText});
    return;
  }
});



// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});