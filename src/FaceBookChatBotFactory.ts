// The interface that the chat bots must follow
import { FaceBookChatBot } from ".";
import { ChatBotCommand } from "./ChatBotCommand";
export class FaceBookChatBotFactory {
    commandMap: Map<string, ChatBotCommand>;
    name: string;
    constructor(commandMap: Map<string, ChatBotCommand>, name: string) {
      this.commandMap = commandMap;
      this.name = name;
    }
  
    createBot(videoId: string, accessToken: string) {
      const bot =  new FaceBookChatBot(this.name,videoId, accessToken);
      bot.setCommandMap(this.commandMap);
      return bot;
    }
  }
  