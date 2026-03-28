import { GAMEMODE } from "../../../core/constants/game/gameMode";
import { PLAYER_KEYMAP } from "../../../core/constants/game/playerKeymap";
import { Engine } from "../engine/engine";
import { AIInput } from "../engine/inputs/AIInput";
import { HumanInput } from "../engine/inputs/humanInput";
import { InputManager } from "../engine/inputs/inputManager";
import { SystemInput } from "../engine/inputs/systemInput";

export class EngineFactory{
    static createEngine(settings, onUpdate, mode, ia1Level = {defense: 50, attack: 50}, ia2Level = {defense: 50, attack: 50}) {
        let inputManager;
        const systemInput = new SystemInput();
        let player1;
        let player2;
        const createAI = (isP1, level) => new AIInput(isP1, settings, level.defense, level.attack);

        if (mode === GAMEMODE.playerVsPlayer) {
            player1 = new HumanInput(systemInput, PLAYER_KEYMAP.zsMap);
            player2= new HumanInput(systemInput, PLAYER_KEYMAP.arrowMap);
        }else if (mode === GAMEMODE.playerVsComputer) {
            player1 = new HumanInput(systemInput, PLAYER_KEYMAP.arrowMap);
            player2= createAI(false, ia1Level);
        } else if (mode === GAMEMODE.computerVsPlayer) {
            player1 =createAI(true, ia1Level);
            player2= new HumanInput(systemInput, PLAYER_KEYMAP.arrowMap);
        }else if (mode === GAMEMODE.computerVsComputer) {
            player1 = createAI(true, ia1Level);
            player2 = createAI(false, ia2Level);
        } else throw new Error('unknown gameMode');

        inputManager= new InputManager(systemInput, player1, player2);
        return new Engine(settings, onUpdate, inputManager);
    }
}