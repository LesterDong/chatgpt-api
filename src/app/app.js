import { ChatGPTAPIBrowser, ChatGPTError, ChatGPTPool, AccountInfo, ErrorCodeEnums } from "../../build/index.js";
import express from "express";
import os from "os";
import { logger } from "./logConfig.js";

const successCode = 200;
const app = express();
app.use(express.json()); // 启用request的json解析能力

const clientPool = new ChatGPTPool();
function sendError(res, msg, statusCode = ErrorCodeEnums[999].code) {
  const respBody = {
    code: statusCode,
    errMsg: msg
  };
  logger.info(respBody);
  res.send(respBody);
}

function sendSuccess(res, optionalParams = {}) {
  const respBody = {
    code: successCode,
    ...optionalParams
  };
  logger.info(respBody);
  res.send(respBody);
}

function getStateFulProxyInfo(email, proxyServer) {
  if (proxyServer && proxyServer.includes('@')) {
    try {
      let proxyUsername = proxyServer.split('@')[0].split(':')[0];
      let newProxyUsername = proxyUsername + "-country-us-ip-205.237.95.60";
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

function buildAccountInfo(email, password, proxyInfo, nopechaKey) {
  const result = new AccountInfo();
  result.email = email;
  result.password = password;
  result.proxyInfo = proxyInfo;
  result.nopechaKey = nopechaKey;
  return result;
}

function transfer2ErrInfo(err) {
  let errInfo = { "code": ErrorCodeEnums[999].code, "msg": ErrorCodeEnums[999].msg+err.message };
  for (const item of Object.values(ErrorCodeEnums)) {
    if (err.message.includes(item.code)) {
      errInfo.code = item.code;
      errInfo.msg = item.msg + err.message;
      return errInfo;
    }
  }
  return errInfo;
}

function handleErr(resp, err) {
  console.error(err);
  if (err instanceof ChatGPTError) {
    const errMsg = err.statusText ? err.statusText : err.message;
    sendError(resp, errMsg, err.statusCode);
  } else {
    const errInfo = transfer2ErrInfo(err);
    sendError(resp, errInfo.msg, errInfo.code);
  }
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
    if (clientPool.getBroswerClient()) {
      await clientPool.getBroswerClient().closeSession();
      clientPool.deleteClient(req.body.email);
    }
    const stateFullProxyInfo = getStateFulProxyInfo(req.body.email, req.body.proxyServer);
    const browser = new ChatGPTAPIBrowser({
      email: req.body.email,
      password: req.body.password,
      //nopechaKey: req.body.nocaptchaToken,
      proxyServer: stateFullProxyInfo,
      // executablePath: getBrowserExecutePath(),
      debug: true,
      minimize: false
    });
    await browser.initSession();
    clientPool.addClient(
      buildAccountInfo(req.body.email, req.body.password, req.body.email, stateFullProxyInfo),
      browser
    );
    sendSuccess(res);
  } catch (err) {
    handleErr(res, err);
  }
});

app.post("/ask", async (req, res) => {

  try {
    let validateRs = validate(["question", "email"], req, res);
    if (!validateRs) {
      return;
    }
    const browser = clientPool.getBroswerClient(req.body.email);
    if (!browser) {
      return sendError(res, ErrorCodeEnums[401].msg, ErrorCodeEnums[401].code);
    }
    const messageParams = {
      ...(req.body.conversationId && {
        conversationId: req.body.conversationId
      }),
      ...(req.body.parentMsgId && { parentMessageId: req.body.parentMsgId })
    };
    const result = await browser.sendMessage(req.body.question, messageParams);
    sendSuccess(res, {
      ...(result.messageId && { msgId: result.messageId }),
      ...(result.conversationId && { conversationId: result.conversationId }),
      answer: result.response
    });
  } catch (err) {
    handleErr(res, err);
  }
});

app.post("/refreshSession", async (req, res) => {
  try {
    let validateRs = validate(["email"], req, res);
    if (!validateRs) {
      return;
    }
    const browser = clientPool.getBroswerClient(req.body.email);
    if (!browser) {
      return sendError(res, ErrorCodeEnums[401].msg, ErrorCodeEnums[401].code);
    }
    await browser.refreshSession();
    sendSuccess(res);
  } catch (err) {
    clientPool.deleteClient(req.body.email);
    handleErr(res, err);
  }
});


app.post("/closeSession", async (req, res) => {
  try {
    let validateRs = validate(["email"], req, res);
    if (!validateRs) {
      return;
    }
    const browser = clientPool.getBroswerClient(req.body.email);
    if (!browser) {
      sendSuccess(res);
    }
    await browser.closeSession();
    clientPool.deleteClient(req.body.email);
    sendSuccess(res);
  } catch (err) {
    handleErr(res, err);
  }
});

app.post("/resetSession", async (req, res) => {
  try {
    let validateRs = validate(["email"], req, res);
    if (!validateRs) {
      return;
    }
    const browser = clientPool.getBroswerClient(req.body.email);
    if (!browser) {
      return sendError(res, ErrorCodeEnums[401].msg, ErrorCodeEnums[401].code);
    }
    await browser.resetSession();
    sendSuccess(res);
  } catch (err) {
    handleErr(res, err);
  }
});


app.post("/clearConversations", async (req, res) => {
  try {
    let validateRs = validate(["email"], req, res);
    if (!validateRs) {
      return;
    }
    const browser = clientPool.getBroswerClient(req.body.email);
    if (!browser) {
      return sendError(res, ErrorCodeEnums[401].msg, ErrorCodeEnums[401].code);
    }
    await browser.clearConversations();
    sendSuccess(res);
  } catch (err) {
    handleErr(res, err);
  }
});

const hostname = "127.0.0.1";
const port = 8080;
app.listen(port, () => {
  console.log(`Serving running at http://${hostname}:${port}/`);
});
