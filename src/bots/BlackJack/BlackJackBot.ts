import BlackJackGame from './BlackJackGame';
import axios from 'axios';
import { FaceBookChatBot } from '../..';
import { debug } from 'util';

export class BlackJackBot extends FaceBookChatBot {
  bjGames = new Map();
  constructor(name: string, videoId: string, accessToken: string) {
    super(name, videoId, accessToken);
    this.commandMap.set('!blackjack', {
      chatBot: (event: MessageEvent) => this.startGameCommand(event),
    });
    this.commandMap.set('!stand', {
      chatBot: (event: MessageEvent) => this.standCommand(event),
    });
    this.commandMap.set('!hit', {
      chatBot: (event: MessageEvent) => this.hitCommand(event),
    });
  }

  sendMessage(text: string) {
    axios
      .post(
        `graph.facebook.com/v14.0/${super.videoId}/comments?access_token=${super.accessToken}`,
        {
          text,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .then((response) => {
        debug(response.data);
      })
      .catch((error) => {
        debug(error);
      });
  }

  getUnicodeCards(hand: any, mode = 0) {
    let pcards = '';
    let dec = 0;
    let hide = 0;
    hand.forEach((element: any) => {
      if (hide === 0 && mode === 1) {
        pcards = pcards + String.fromCodePoint(0x1f0a0) + ' ';
        hide = 1;
      } else {
        if (element.s === 0) {
          dec = 127152 + element.n;
        } else if (element.s === 1) {
          dec = 127168 + element.n;
        } else if (element.s === 2) {
          dec = 127184 + element.n;
        } else if (element.s === 3) {
          dec = 127136 + element.n;
        }
        const cardUnicode: any = '0x' + dec.toString(16);
        pcards = pcards + String.fromCodePoint(cardUnicode) + ' ';
      }
    });
    return pcards;
  }

  // check for chatbotcommand
  testCommand = (event: MessageEvent, videoId: string, accessToken: string) => {
    const data = JSON.stringify({ message: 'You typed test!' });
    this.sendMessage(data);
  };

  startGameCommand = (event: MessageEvent) => {
    const obj = JSON.parse(event.data);
    const userId = obj.from.id;
    const userName = obj.from.name;
    const myArray = obj.message.split(' ');
    let bet = 25;
    if (!this.bjGames.get(userId)) {
      // Game doesn't exist yet
      if (myArray[1]) {
        bet = myArray[1];
      }
      this.bjGames.set(userId, BlackJackGame());
      this.bjGames.get(userId).start(bet);
      const result = this.bjGames.get(userId).check().winner;
      if (result === null) {
        // No winner yet
        const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
        const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer, 1);
        let showing = this.bjGames.get(userId).dealer[1].n;
        if (showing === 1) {
          showing = 'Ace';
        } else if (showing === 11) {
          showing = 'Jack';
        } else if (showing === 12) {
          showing = 'Queen';
        } else if (showing === 13) {
          showing = 'King';
        }
        const data = JSON.stringify({
          message:
            'Dealer: ' +
            dcards +
            'showing ' +
            showing +
            '\n' +
            userName +
            ': ' +
            pcards +
            this.bjGames.get(userId).ppoints +
            ' - !hit or !stand',
        });
        this.sendMessage(data);
      } else if (result === 0) {
        const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
        const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer);
        const data = JSON.stringify({
          message:
            'Dealer: ' +
            dcards +
            this.bjGames.get(userId).dpoints +
            '\n' +
            userName +
            ': ' +
            pcards +
            this.bjGames.get(userId).ppoints +
            ' - ' +
            this.bjGames.get(userId).check().message +
            ' +' +
            this.bjGames.get(userId).amount_bet +
            'px',
        });
        this.sendMessage(data);
        const command = JSON.stringify({
          message: '!pixels add ' + userName + ' ' + this.bjGames.get(userId).amount_bet,
        });
        this.sendMessage(command);
        this.bjGames.delete(userId);
      } else if (result === 1) {
        const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
        const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer);
        const data = JSON.stringify({
          message:
            'Dealer: ' +
            dcards +
            this.bjGames.get(userId).dpoints +
            ' - ' +
            this.bjGames.get(userId).check().message +
            ' -' +
            this.bjGames.get(userId).amount_bet +
            'px' +
            '\n' +
            userName +
            ': ' +
            pcards +
            this.bjGames.get(userId).ppoints,
        });
        this.sendMessage(data);
        const command = JSON.stringify({
          message: '!pixels remove ' + userName + ' ' + this.bjGames.get(userId).amount_bet,
        });
        this.sendMessage(command);
        this.bjGames.delete(userId);
      } else if (result === 2) {
        const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
        const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer);
        const data = JSON.stringify({
          message:
            'Dealer: ' +
            dcards +
            this.bjGames.get(userId).dpoints +
            ' - ' +
            this.bjGames.get(userId).check().message +
            '\n' +
            userName +
            ': ' +
            pcards +
            this.bjGames.get(userId).ppoints,
        });
        this.sendMessage(data);
        this.bjGames.delete(userId);
      }
    } else {
      // Player is already in a game
      const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
      const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer, 1);
      let showing = this.bjGames.get(userId).dealer[1].n;
      if (showing === 1) {
        showing = 'Ace';
      } else if (showing === 11) {
        showing = 'Jack';
      } else if (showing === 12) {
        showing = 'Queen';
      } else if (showing === 13) {
        showing = 'King';
      }
      const data = JSON.stringify({
        message:
          'Dealer: ' +
          dcards +
          'showing ' +
          showing +
          '\n' +
          userName +
          ': ' +
          pcards +
          this.bjGames.get(userId).ppoints +
          ' - !hit or !stand',
      });
      this.sendMessage(data);
    }
  };

  hitCommand(event: MessageEvent) {
    const obj = JSON.parse(event.data);
    const userId = obj.from.id;
    const userName = obj.from.name;
    if (!this.bjGames.get(userId)) {
      // Game doesn't exist
      const data = JSON.stringify({ message: 'Type !blackjack to start a game.' });
      this.sendMessage(data);
    } else {
      // Player is already in a game
      if (this.bjGames.get(userId).turn === 1) {
        const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
        const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer);
        const data = JSON.stringify({
          message:
            'Dealer: ' +
            dcards +
            this.bjGames.get(userId).dpoints +
            '\n' +
            userName +
            ': ' +
            pcards +
            this.bjGames.get(userId).ppoints +
            ' - Not your turn.',
        });
        this.sendMessage(data);
      } else {
        this.bjGames.get(userId).hit();
        const result = this.bjGames.get(userId).check().winner;
        if (result === null) {
          // No winner yet
          const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
          const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer, 1);
          let showing = this.bjGames.get(userId).dealer[1].n;
          if (showing === 1) {
            showing = 'Ace';
          } else if (showing === 11) {
            showing = 'Jack';
          } else if (showing === 12) {
            showing = 'Queen';
          } else if (showing === 13) {
            showing = 'King';
          }
          const data = JSON.stringify({
            message:
              'Dealer: ' +
              dcards +
              'showing ' +
              showing +
              '\n' +
              userName +
              ': ' +
              pcards +
              this.bjGames.get(userId).ppoints +
              ' - !hit or !stand',
          });
          this.sendMessage(data);
        } else if (result === 0) {
          const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
          const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer);
          const data = JSON.stringify({
            message:
              'Dealer: ' +
              dcards +
              this.bjGames.get(userId).dpoints +
              '\n' +
              userName +
              ': ' +
              pcards +
              this.bjGames.get(userId).ppoints +
              ' - ' +
              this.bjGames.get(userId).check().message +
              ' +' +
              this.bjGames.get(userId).amount_bet +
              'px',
          });
          this.sendMessage(data);
          const command = JSON.stringify({
            message: '!pixels add ' + userName + ' ' + this.bjGames.get(userId).amount_bet,
          });
          this.sendMessage(command);
          this.bjGames.delete(userId);
        } else if (result === 1) {
          const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
          const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer);
          const data = JSON.stringify({
            message:
              'Dealer: ' +
              dcards +
              this.bjGames.get(userId).dpoints +
              ' - ' +
              this.bjGames.get(userId).check().message +
              ' -' +
              this.bjGames.get(userId).amount_bet +
              'px' +
              '\n' +
              userName +
              ': ' +
              pcards +
              this.bjGames.get(userId).ppoints,
          });
          this.sendMessage(data);
          const command = JSON.stringify({
            message: '!pixels remove ' + userName + ' ' + this.bjGames.get(userId).amount_bet,
          });
          this.sendMessage(command);
          this.bjGames.delete(userId);
        } else if (result === 2) {
          const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
          const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer);
          const data = JSON.stringify({
            message:
              'Dealer: ' +
              dcards +
              this.bjGames.get(userId).dpoints +
              ' - ' +
              this.bjGames.get(userId).check().message +
              '\n' +
              userName +
              ': ' +
              pcards +
              this.bjGames.get(userId).ppoints,
          });
          this.sendMessage(data);
          this.bjGames.delete(userId);
        }
      }
    }
  }
  standCommand(event: MessageEvent) {
    const obj = JSON.parse(event.data);
    debug(obj);
    const userId = obj.from.id;
    const userName = obj.from.name;
    if (!this.bjGames.get(userId)) {
      // Game doesn't exist
      const data = JSON.stringify({ message: 'Type !blackjack to start a game.' });
      this.sendMessage(data);
    } else {
      // Player is already in a game
      if (this.bjGames.get(userId).turn === 1) {
        const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
        const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer);
        const data = JSON.stringify({
          message:
            'Dealer: ' +
            dcards +
            this.bjGames.get(userId).dpoints +
            '\n' +
            userName +
            ': ' +
            pcards +
            this.bjGames.get(userId).ppoints +
            ' - Not your turn.',
        });
        this.sendMessage(data);
      } else {
        this.bjGames.get(userId).stand();
        const result = this.bjGames.get(userId).check().winner;
        if (result === null) {
          // No winner yet
          const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
          const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer, 1);
          let showing = this.bjGames.get(userId).dealer[1].n;
          if (showing === 1) {
            showing = 'Ace';
          } else if (showing === 11) {
            showing = 'Jack';
          } else if (showing === 12) {
            showing = 'Queen';
          } else if (showing === 13) {
            showing = 'King';
          }
          const data = JSON.stringify({
            message:
              'Dealer: ' +
              dcards +
              'showing ' +
              showing +
              '\n' +
              userName +
              ': ' +
              pcards +
              this.bjGames.get(userId).ppoints +
              ' - !hit or !stand',
          });
          this.sendMessage(data);
        } else if (result === 0) {
          const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
          const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer);
          const data = JSON.stringify({
            message:
              'Dealer: ' +
              dcards +
              this.bjGames.get(userId).dpoints +
              '\n' +
              userName +
              ': ' +
              pcards +
              this.bjGames.get(userId).ppoints +
              ' - ' +
              this.bjGames.get(userId).check().message +
              ' +' +
              this.bjGames.get(userId).amount_bet +
              'px',
          });
          this.sendMessage(data);
          const command = JSON.stringify({
            message: '!pixels add ' + userName + ' ' + this.bjGames.get(userId).amount_bet,
          });
          this.sendMessage(command);
          this.bjGames.delete(userId);
        } else if (result === 1) {
          const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
          const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer);
          const data = JSON.stringify({
            message:
              'Dealer: ' +
              dcards +
              this.bjGames.get(userId).dpoints +
              ' - ' +
              this.bjGames.get(userId).check().message +
              ' -' +
              this.bjGames.get(userId).amount_bet +
              'px' +
              '\n' +
              userName +
              ': ' +
              pcards +
              this.bjGames.get(userId).ppoints,
          });
          this.sendMessage(data);
          const command = JSON.stringify({
            message: '!pixels remove ' + userName + ' ' + this.bjGames.get(userId).amount_bet,
          });
          this.sendMessage(command);
          this.bjGames.delete(userId);
        } else if (result === 2) {
          const pcards = this.getUnicodeCards(this.bjGames.get(userId).player);
          const dcards = this.getUnicodeCards(this.bjGames.get(userId).dealer);
          const data = JSON.stringify({
            message:
              'Dealer: ' +
              dcards +
              this.bjGames.get(userId).dpoints +
              ' - ' +
              this.bjGames.get(userId).check().message +
              '\n' +
              userName +
              ': ' +
              pcards +
              this.bjGames.get(userId).ppoints,
          });
          this.sendMessage(data);
          this.bjGames.delete(userId);
        }
      }
    }
  }
}
