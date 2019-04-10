import {persistInformation} from '../actions/mongoServices';
import {initPuppeteerForSession} from '../actions/postmanServices';


export const invokeAPIWithPostman = async (baseURL, loginURL, username, password, sessionId, accountURL, promiseRequest, scpResponseTemp) => {
  
  try {
    
    const loginResponse = await invokeLogin(loginURL, username, password, sessionId, promiseRequest);
    if (loginResponse.statusCode === 412) {
      //this means the sessionid is invalid.call to get renewed sessionid
      sessionId = await initPuppeteerForSession(baseURL);
      await invokeLogin(loginURL, username, password, sessionId, promiseRequest);
      return invokeOrderAPI(accountURL, promiseRequest);
    } else if (loginResponse.statusCode === 200) {
      //invoke account page to get orderinfo
      console.log('inside the 200 status code flow.calling orderapi');
      return invokeOrderAPI(accountURL, promiseRequest);
    } else {
      console.log(`Error while invoking API for login flow => ${loginResponse.statusMessage}`);
      throw new Error(loginResponse.statusMessage);
    }
    
    
  } catch (err) {
    console.log(`error while calling method invokeAPIWithPostman() with err ${err.message}`);
    if (err.message === 'Invalid Credentials Entered') {
      scpResponseTemp.status = 'Invalid Credentials';
      scpResponseTemp.orderIdList = [];
      scpResponseTemp.statusCode = 403;
      await persistInformation(scpResponseTemp);
      return scpResponseTemp;
    } else {
      throw err;
    }
    
  }
  
};

export const invokeLogin = async (loginURL, username, password, sessionId, promiseRequest) => {
  const apiResponse = {
    statusCode: '',
    orderInfo: '',
    statusMessage: ''
  };
  try {
    
    const formData = {
      captcha: {
        sensorData: sessionId
      },
      username: username
      , password: password
      , rememberme: false
      , showRememberme: false
    };
    
    const request = promiseRequest.defaults({jar: true})
    
    let loginResponse = await request.post({
      url: loginURL,
      json: true,
      body: formData,
      resolveWithFullResponse: true
    });
    
    //check if there is some error
    let statusCode = loginResponse.statusCode;
    console.log('login statuscode = ', statusCode);
    //this means the sessionID is either valid or some other status
    apiResponse.statusCode = statusCode;
    apiResponse.orderInfo = [];
    apiResponse.statusMessage = JSON.stringify(loginResponse.body);
    
    
  } catch (err) {
    if (err.message.includes('403')) {
      throw new Error('Invalid Credentials Entered');
    }
    if (err.message.includes('412')) {
      apiResponse.statusCode = 412;
      apiResponse.orderInfo = [];
      apiResponse.statusMessage = err.message;
    }else{
      console.log(`error while invoking API with postman ${err.message}`);
      throw err;
    }
   
  }
  return apiResponse;
};


export const invokeOrderAPI = async (accountURL, promiseRequest) => {
  const apiResponse = {
    statusCode: '',
    orderInfo: '',
    statusMessage: ''
  };
  try {
    
    let acctPageResponse = await promiseRequest.get({
      url: accountURL,
      json: true,
      resolveWithFullResponse: true
    });
    // console.log(`before ->> accountURL -> ${accountURL} orderAPI response  ${JSON.stringify(acctPageResponse)}`);
    let statusCode = await acctPageResponse.statusCode;
    console.log(`accountURL -> ${accountURL} orderAPI response statusCode ${statusCode}`);
    if (statusCode === 200) {
      apiResponse.statusCode = statusCode;
      apiResponse.orderInfo = await acctPageResponse.body;
    } else {
      apiResponse.statusCode = statusCode;
      apiResponse.statusMessage = await acctPageResponse.body;
    }
  } catch (err) {
    console.log(`error while invoking API with postman  invokeOrderAPI ${err.message}`);
    if (err.message.includes(401)) {
      // This is unauthorized code
      //retry with login
      let sessionIdTemp = await initPuppeteerForSession(baseURL);
      loginResponse = await invokeLogin(loginURL, username, password, sessionIdTemp, promiseRequest);
      let acctPageResponse = await promiseRequest.get({
        url: accountURL,
        json: true,
        resolveWithFullResponse: true
      });
      let tempAcctJson = JSON.parse(acctPageResponse);
      statusCode = tempAcctJson.statusCode;
      apiResponse.statusCode = statusCode;
      if (statusCode === 200) {
        apiResponse.orderInfo = tempAcctJson.body;
      }
    }else{
      throw err;
    }
  }
  console.log('returning apiresponse', apiResponse)
  return apiResponse;
};