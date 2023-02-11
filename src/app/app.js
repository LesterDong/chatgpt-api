import { ChatGPTAPIBrowser,ChatGPTError } from "../../build/index.js";
import express from "express";
import ip from "ip";
import os from "os";

const ipAdress = ip.address();
const successCode = 200;
const defaultErrCode = 999;
const app = express();
app.use(express.json()); // 启用request的json解析能力

const apiMap = {};
function sendError(res, msg, statusCode = defaultErrCode) {
  res.send({
    code: statusCode,
    errMsg: msg
  });
}

function sendSuccess(res, obj = {}) {
  res.send({
    code: successCode,
    ...obj
  });
}

function getStateFulProxyInfo(proxyServer) {
  if (proxyServer && proxyServer.includes('@')) {
    try {
      let proxyUsername = proxyServer.split('@')[0].split(':')[0];
      let newProxyUsername = proxyUsername + "-country-us-session-" + ipAdress;
      let result = proxyServer.replace(proxyUsername, newProxyUsername);
      console.log('proxy server info:' + result);
      return result;
    } catch (err) {
      console.error('Illegal format for proxy server info.', err.toString());
    }
  }
}

function getBrowserExecutePath() {
  let typeVal = os.type();
  if (typeVal.indexOf("Window") === -1 && typeVal.indexOf("Mac") === -1) {
    return "/usr/bin/chromium-browser";
  }
}

function validate(checkParamArr, request, response) {
  if (!checkParamArr || checkParamArr.length === 0) {
    throw new Error('empty checkParamArr');
  }
  if (!request.body) {
    sendError(response, 'empty request body');
    return false;
  }
  for (const item of checkParamArr) {
    if (!request.body[item]) {
      sendError(response, `need request param ${item}`);
      return false;
    }
  }
  return true;
}

app.get("/vi/health", async (req, res) => {
  sendSuccess(res);
});

app.post("/initSession", async (req, res) => {
  
  try {
    let validateRs = validate(["email", "password", "proxyServer"], req, res);
    if (!validateRs) {
      return;
    }
    const api = new ChatGPTAPIBrowser({
      email: req.body.email,
      password: req.body.password,
      //nopechaKey: req.body.nocaptchaToken,
      proxyServer: getStateFulProxyInfo(req.body.proxyServer),
      // executablePath: getBrowserExecutePath(),
      debug: true,
      minimize: false
    });
    await api.initSession();
    sendSuccess(res);
  } catch (e) {
    console.error(e);
    sendError(res, "started failed: " + e.message);
  }
});

app.post("/ask", async (req, res) => {
  const checkArr = ["question", "email"];
  for (const item of checkArr) {
    if (!req.body[item]) {
      return sendError(res, `need req.${item}`);
    }
  }
  try {
    const email = req.body.email;
    const api = apiMap[email];
    if (!api) {
      return sendError(res, "no user email, need login");
    }
    const messageParams = {
      ...(req.body.conversationId && {
        conversationId: req.body.conversationId
      }),
      ...(req.body.parentMsgId && { parentMessageId: req.body.parentMsgId })
    };
    const result = await api.sendMessage(req.body.question, messageParams);
    sendSuccess(res, {
      ...(result.messageId && { msgId: result.messageId }),
      ...(result.conversationId && { conversationId: result.conversationId }),
      answer: result.response
    });
  } catch (e) {
    console.error(e);
    if (e instanceof ChatGPTError) {
      sendError(res, e.statusText, e.statusCode);
    } else {
      sendError(res, "unknown error occurred. " + e.message);
    }
  }
});

app.post("/refreshSession", async (req, res) => {
  const email = req.body.email;
  if (!email) {
    return sendError(res, "need emil");
  }
  const api = apiMap[email];
  if (!api) {
    return sendError(res, "no user email, need login");
  }
  try {
    await api.refreshSession();
    sendSuccess(res);
  } catch (e) {
    console.error(e);
    delete apiMap[email];
    sendError(res, "unknown error occurred.");
  }
});


app.post("/closeSession", async (req, res) => {
  const email = req.body.email;
  if (!email) {
    return sendError(res, "need emil");
  }
  const api = apiMap[email];
  if (!api) {
    return sendSuccess(res);
  }
  try {
    await api.closeSession();
    sendSuccess(res);
  } catch (e) {
    console.error(e);
    sendError(res, "Error occurred!" + e.message);
  } finally {
    delete apiMap[email];
  }
});

const hostname = "127.0.0.1";
const port = 8080;
app.listen(port, () => {
  console.log(`Serving running at http://${hostname}:${port}/`);
});
