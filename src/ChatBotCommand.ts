export interface ChatBotCommand {
  //figure out how to use chatbotcommand from
  chatBot: (event: MessageEvent, videoId: string, accessToken: string) => void;
}
