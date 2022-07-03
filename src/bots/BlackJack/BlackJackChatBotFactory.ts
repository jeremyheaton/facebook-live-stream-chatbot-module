import { FaceBookChatBotFactory } from "../../FaceBookChatBotFactory";
import { BlackJackBot } from "./BlackJackBot";

export class BlackJackBotFactory extends FaceBookChatBotFactory {
    createBot(videoId: string, accessToken: string) {
      return new BlackJackBot(super.name, videoId, accessToken);
    }
  }