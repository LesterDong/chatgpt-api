import { ChatGPTAPIBrowser } from './chatgpt-api-browser'
import { AccountInfo, ChatGPTClient } from './types'

export class ChatGPTPool {
  clientPool: Map<string, ChatGPTClient> = new Map()

  addClient(accountInfo: AccountInfo, browser: ChatGPTAPIBrowser) {
    if (!accountInfo || !browser) {
      console.log('illegal accountInfo or browser')
      return
    }
    const client = new ChatGPTClient()
    client.account = accountInfo
    client.browser = browser
    this.clientPool.set(accountInfo.email, client)
  }
  deleteClient(email: string) {
    if (!email || !this.clientPool.has(email)) {
      return
    }
    this.clientPool.delete(email)
  }
  getBroswerClient(email: string) {
    if (!email || !this.clientPool.has(email)) {
      return
    }
    return this.clientPool.get(email).browser
  }
  getAccountInfo(email: string) {
    if (!email || !this.clientPool.has(email)) {
      return
    }
    return this.clientPool.get(email).account
  }
  logPoolAccountInfo() {
    this.clientPool.forEach((value, key) => {
      console.log(`email[${key}] active...`)
    })
  }
}
