import AsyncRetry from 'async-retry'
import delay from 'delay'
import { Browser,Page } from 'puppeteer'
import { temporaryDirectory } from 'tempy'
import { v4 as uuidv4 } from 'uuid'
import { ChatGPTAPIBrowser, ChatGPTError, ChatGPTPool, AccountInfo, ErrorCodeEnums } from "../../build/index.js";
import { getBrowser, getPage } from '../../build/index.js'

let proxyServer = "brd-customer-hl_bc0fff1c-zone-gs_static-ip-178.171.38.87:zpsdoi01hx7y@zproxy.lum-superproxy.io:22225";
let browser = await getBrowser({
     //proxyServer: proxyServer
})

let page = await getPage(browser, {
     //proxyServer: proxyServer
})
let url1 = "https://bot.sannysoft.com/";
let url2 = "https://www.cloudflare.com/";
let url3 = "https://www.crunchbase.com/";
let url4 = "https://chat.openai.com/chat";
await page.goto(url1, {
    waitUntil: 'networkidle2'
})

console.log("test open a page...");



