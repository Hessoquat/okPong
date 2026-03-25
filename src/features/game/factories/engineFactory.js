import { GAMEMODE } from "../../../constants/game/gameMode";
import { PLAYER_KEYMAP } from "../../../constants/game/playerKeyMap";
import { Engine } from "../engine/engine";
import { AIInput } from "../engine/inputs/AIInput";
import { HumanInput } from "../engine/inputs/humanInput";
import { InputManager } from "../engine/inputs/inputManager";
import { SystemInput } from "../engine/inputs/systemInput";

export class EngineFactory{
    static createEngine(settings, onUpdate, mode) {
        let inputManager;
        const systemInput = new SystemInput();
        let player1;
        let player2;

        if (mode === GAMEMODE.playerVsPlayer) {
            player1 = new HumanInput(systemInput, PLAYER_KEYMAP.zsMap);
            player2= new HumanInput(systemInput, PLAYER_KEYMAP.arrowMap);
        }else if (mode === GAMEMODE.playerVsComputer) {
            player1 = new HumanInput(systemInput, PLAYER_KEYMAP.arrowMap);
            player2= new AIInput(false);
        } else if (mode === GAMEMODE.computerVsPlayer) {
            player1 = new AIInput(true);
            player2= new HumanInput(systemInput, PLAYER_KEYMAP.arrowMap);
        }else if (mode === GAMEMODE.computerVsComputer) {
            player1 = new AIInput(true);
            player2= new AIInput(false);
        } else throw new Error('unknown gameMode');

        inputManager= new InputManager(systemInput, player1, player2);
        return new Engine(settings, onUpdate, inputManager);
    }
}