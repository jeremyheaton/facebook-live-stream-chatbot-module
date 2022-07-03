const blackJack = require('./blackjack');
import axios from 'axios';
import {FaceBookChatBot} from '../..';
import {FaceBookChatBotFactory} from '../../FaceBookChatBotFactory';

export class BlackJackBotFactory extends FaceBookChatBotFactory {
    createBot(videoId : string, accessToken : string) {
        return new BlackJackBot(super.name, videoId, accessToken);
    }
}

class BlackJackBot extends FaceBookChatBot {
    bjGames = new Map();
    constructor(name : string, videoId : string, accessToken : string) {
        super(name, videoId, accessToken);
        this.commandMap.set("!blackjack", {
            chatBot: (event : MessageEvent, videoId : string, accessToken : string) =>
             this.startGameCommand(event)
        });
        this.commandMap.set("!stand", {
            chatBot: (event : MessageEvent, videoId : string, accessToken : string) =>
             this.standCommand(event)
        });
        this.commandMap.set("!hit", {
            chatBot: (event : MessageEvent, videoId : string, accessToken : string) =>
             this.hitCommand(event)
        });
    }

    sendMessage(text : string) {
        axios.post(`graph.facebook.com/v14.0/${
            super.videoId
        }/comments?access_token=${
            super.accessToken
        }`, {
            text
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            console.log(response);
        }).catch(function (error) {
            console.log(error);
        });
    }


    getUnicodeCards(hand : any, mode = 0) {
        let pcards = "";
        let dec = 0;
        let hide = 0;
        hand.forEach((element : any) => {
            if (hide === 0 && mode === 1) {
                pcards = pcards + String.fromCodePoint(0x1F0A0) + " ";
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
                let card_unicode: any = "0x" + dec.toString(16);
                pcards = pcards + String.fromCodePoint(card_unicode) + " ";
            }
        });
        return pcards;
    }

    // check for chatbotcommand
    testCommand = (event : MessageEvent, videoId : string, accessToken : string) => {
        const data = JSON.stringify({message: 'You typed test!'});
        this.sendMessage(data);
    }

    startGameCommand = (event : MessageEvent) => {

        let obj = JSON.parse(event.data)
        console.log(obj);
        let user_id = obj.from.id;
        let user_name = obj.from.name;
        let myArray = obj.message.split(" ");
        let bet = 25;
        if (!this.bjGames.get(user_id)) { // Game doesn't exist yet
            if (myArray[1]) {
                bet = myArray[1]
            }
            this.bjGames.set(user_id, blackJack.getGameObject());
            this.bjGames.get(user_id).start(bet);
            let result = this.bjGames.get(user_id).check().winner;
            if (result === null) { // No winner yet
                let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer, 1);
                let showing = this.bjGames.get(user_id).dealer[1].n;
                if (showing === 1) {
                    showing = "Ace"
                } else if (showing === 11) {
                    showing = "Jack"
                } else if (showing === 12) {
                    showing = "Queen"
                } else if (showing === 13) {
                    showing = "King"
                }
                const data = JSON.stringify({
                    message: "Dealer: " + dcards + "showing " + showing + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints + " - !hit or !stand"
                });
                this.sendMessage(data);
            } else if (result === 0) {
                let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer);
                const data = JSON.stringify({
                    message: "Dealer: " + dcards + this.bjGames.get(user_id).dpoints + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints + " - " + this.bjGames.get(user_id).check().message + " +" + this.bjGames.get(user_id).amount_bet + "px"
                });
                this.sendMessage(data);
                const command = JSON.stringify({
                    message: "!pixels add " + user_name + " " + this.bjGames.get(user_id).amount_bet
                });
                this.sendMessage(command);
                this.bjGames.delete(user_id);
            } else if (result === 1) {
                let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer);
                const data = JSON.stringify({
                    message: "Dealer: " + dcards + this.bjGames.get(user_id).dpoints + " - " + this.bjGames.get(user_id).check().message + " -" + this.bjGames.get(user_id).amount_bet + "px" + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints
                });
                this.sendMessage(data);
                const command = JSON.stringify({
                    message: "!pixels remove " + user_name + " " + this.bjGames.get(user_id).amount_bet
                });
                this.sendMessage(command);
                this.bjGames.delete(user_id);
            } else if (result === 2) {
                let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer);
                const data = JSON.stringify({
                    message: "Dealer: " + dcards + this.bjGames.get(user_id).dpoints + " - " + this.bjGames.get(user_id).check().message + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints
                });
                this.sendMessage(data);
                this.bjGames.delete(user_id);
            }
        } else { // Player is already in a game
            let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
            let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer, 1);
            let showing = this.bjGames.get(user_id).dealer[1].n;
            if (showing === 1) {
                showing = "Ace"
            } else if (showing === 11) {
                showing = "Jack"
            } else if (showing === 12) {
                showing = "Queen"
            } else if (showing === 13) {
                showing = "King"
            }
            const data = JSON.stringify({
                message: "Dealer: " + dcards + "showing " + showing + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints + " - !hit or !stand"
            });
            this.sendMessage(data);
        }
    }

    hitCommand(event : MessageEvent) {
        let obj = JSON.parse(event.data)
        console.log(obj);
        let user_id = obj.from.id;
        let user_name = obj.from.name;
        let myArray = obj.message.split(" ");
        if (!this.bjGames.get(user_id)) { // Game doesn't exist
            const data = JSON.stringify({message: "Type !blackjack to start a game."});
            this.sendMessage(data);
        } else { // Player is already in a game
            if (this.bjGames.get(user_id).turn === 1) {
                let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer);
                const data = JSON.stringify({
                    message: "Dealer: " + dcards + this.bjGames.get(user_id).dpoints + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints + " - Not your turn."
                });
                this.sendMessage(data);
            } else {
                this.bjGames.get(user_id).hit();
                let result = this.bjGames.get(user_id).check().winner
                if (result === null) { // No winner yet
                    let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                    let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer, 1);
                    let showing = this.bjGames.get(user_id).dealer[1].n;
                    if (showing === 1) {
                        showing = "Ace"
                    } else if (showing === 11) {
                        showing = "Jack"
                    } else if (showing === 12) {
                        showing = "Queen"
                    } else if (showing === 13) {
                        showing = "King"
                    }
                    const data = JSON.stringify({
                        message: "Dealer: " + dcards + "showing " + showing + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints + " - !hit or !stand"
                    });
                    this.sendMessage(data);
                } else if (result === 0) {
                    let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                    let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer);
                    const data = JSON.stringify({
                        message: "Dealer: " + dcards + this.bjGames.get(user_id).dpoints + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints + " - " + this.bjGames.get(user_id).check().message + " +" + this.bjGames.get(user_id).amount_bet + "px"
                    });
                    this.sendMessage(data);
                    const command = JSON.stringify({
                        message: "!pixels add " + user_name + " " + this.bjGames.get(user_id).amount_bet
                    });
                    this.sendMessage(command);
                    this.bjGames.delete(user_id);
                } else if (result === 1) {
                    let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                    let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer);
                    const data = JSON.stringify({
                        message: "Dealer: " + dcards + this.bjGames.get(user_id).dpoints + " - " + this.bjGames.get(user_id).check().message + " -" + this.bjGames.get(user_id).amount_bet + "px" + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints
                    });
                    this.sendMessage(data);
                    const command = JSON.stringify({
                        message: "!pixels remove " + user_name + " " + this.bjGames.get(user_id).amount_bet
                    });
                    this.sendMessage(command);
                    this.bjGames.delete(user_id);
                } else if (result === 2) {
                    let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                    let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer);
                    const data = JSON.stringify({
                        message: "Dealer: " + dcards + this.bjGames.get(user_id).dpoints + " - " + this.bjGames.get(user_id).check().message + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints
                    });
                    this.sendMessage(data);
                    this.bjGames.delete(user_id);
                }
            }
        }
    }
    standCommand(event : MessageEvent) {
        let obj = JSON.parse(event.data)
        console.log(obj);
        let user_id = obj.from.id;
        let user_name = obj.from.name;
        let myArray = obj.message.split(" ");
        if (!this.bjGames.get(user_id)) { // Game doesn't exist
            const data = JSON.stringify({message: "Type !blackjack to start a game."});
            this.sendMessage(data);
        } else { // Player is already in a game
            if (this.bjGames.get(user_id).turn === 1) {
                let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer);
                const data = JSON.stringify({
                    message: "Dealer: " + dcards + this.bjGames.get(user_id).dpoints + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints + " - Not your turn."
                });
                this.sendMessage(data);
            } else {
                this.bjGames.get(user_id).stand();
                let result = this.bjGames.get(user_id).check().winner
                if (result === null) { // No winner yet
                    let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                    let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer, 1);
                    let showing = this.bjGames.get(user_id).dealer[1].n;
                    if (showing === 1) {
                        showing = "Ace"
                    } else if (showing === 11) {
                        showing = "Jack"
                    } else if (showing === 12) {
                        showing = "Queen"
                    } else if (showing === 13) {
                        showing = "King"
                    }
                    const data = JSON.stringify({
                        message: "Dealer: " + dcards + "showing " + showing + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints + " - !hit or !stand"
                    });
                    this.sendMessage(data);
                } else if (result === 0) {
                    let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                    let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer);
                    const data = JSON.stringify({
                        message: "Dealer: " + dcards + this.bjGames.get(user_id).dpoints + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints + " - " + this.bjGames.get(user_id).check().message + " +" + this.bjGames.get(user_id).amount_bet + "px"
                    });
                    this.sendMessage(data);
                    const command = JSON.stringify({
                        message: "!pixels add " + user_name + " " + this.bjGames.get(user_id).amount_bet
                    });
                    this.sendMessage(command);
                    this.bjGames.delete(user_id);
                } else if (result === 1) {
                    let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                    let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer);
                    const data = JSON.stringify({
                        message: "Dealer: " + dcards + this.bjGames.get(user_id).dpoints + " - " + this.bjGames.get(user_id).check().message + " -" + this.bjGames.get(user_id).amount_bet + "px" + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints
                    });
                    this.sendMessage(data);
                    const command = JSON.stringify({
                        message: "!pixels remove " + user_name + " " + this.bjGames.get(user_id).amount_bet
                    });
                    this.sendMessage(command);
                    this.bjGames.delete(user_id);
                } else if (result === 2) {
                    let pcards = this.getUnicodeCards(this.bjGames.get(user_id).player);
                    let dcards = this.getUnicodeCards(this.bjGames.get(user_id).dealer);
                    const data = JSON.stringify({
                        message: "Dealer: " + dcards + this.bjGames.get(user_id).dpoints + " - " + this.bjGames.get(user_id).check().message + "\n" + user_name + ": " + pcards + this.bjGames.get(user_id).ppoints
                    });
                    this.sendMessage(data);
                    this.bjGames.delete(user_id);
                }
            }
        }
    }
}
