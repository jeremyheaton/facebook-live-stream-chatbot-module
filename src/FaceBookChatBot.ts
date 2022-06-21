export class FaceBookChatBot {
  command: string;
  chatBot: (event: MessageEvent) => void;
  constructor(command: string, chatBot: (a: MessageEvent) => boolean) {
    this.command = command;
    this.chatBot = chatBot;
  }
}
