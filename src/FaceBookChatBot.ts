// The interface that the chat bots must follow
import { ChatBotCommand } from "./ChatBotCommand";
export class FaceBookChatBot {
  name: String;
  commandMap!: Map<string, ChatBotCommand>;
  videoId: string;
  accessToken:string;
  constructor(name: string, videoId: string, accessToken: string) {
    this.name = name;
    this.videoId = videoId;
    this.accessToken = accessToken;
  }

  setCommandMap(commandMap: Map<string, ChatBotCommand>) {
      this.commandMap = commandMap;
  }

  processCommand(command: string, event: MessageEvent) {
    this.commandMap.get(command)?.chatBot(event, this.videoId, this.accessToken);
  }
}