import { WAMessage } from '@whiskeysockets/baileys';
import { replyMessage } from './whatsapp';

// Adapter to make Baileys messages compatible with old whatsapp-web.js interface
export class BaileysMessageAdapter {
  private msg: WAMessage;
  
  constructor(msg: WAMessage) {
    this.msg = msg;
  }
  
  get from(): string {
    return this.msg.key.remoteJid || '';
  }
  
  get body(): string {
    return this.msg.message?.conversation ||
           this.msg.message?.extendedTextMessage?.text ||
           '';
  }
  
  get type(): string {
    if (this.msg.message?.conversation || this.msg.message?.extendedTextMessage) {
      return 'chat';
    }
    return 'unknown';
  }
  
  async getContact() {
    const jid = this.msg.key.remoteJid || '';
    const number = jid.split('@')[0];
    
    return {
      number,
      pushname: this.msg.pushName || number,
    };
  }
  
  async reply(text: string) {
    await replyMessage(this.msg, text);
  }
}
