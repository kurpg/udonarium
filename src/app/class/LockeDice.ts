
// original version from
// https://gist.github.com/h-mikisato/b5753689483b02b19585365b8ce5940f
// and
// https://github.com/blhsrwznrghfzpr/bcdice-js/blob/extend-samlpe/examples/ts/custom_dicebot.ts

import Base from 'bcdice/lib/base';
import { BaseInstance } from 'bcdice/lib/internal/types/base';
import Result from 'bcdice/lib/result';
import { tableFromCommand } from './LockeDiceTable';


export default class LockeDice extends Base {
    static readonly ID = 'Locke';
    static readonly NAME = '超人ロック';
    static readonly SORT_KEY = 'ちようしんろつく';
    static readonly COMMAND_PATTERN = /^S?([+\-(]*\d+|\d+B\d+|C[+\-(]*\d+|choice|D66|(repeat|rep|x)\d+|\d+R\d+|\d+U\d+|BCDiceVersion|ARR|REV|ZS|TF|SHIP|SHIP_BM|SHIP_MS|PLUG|T1\-3|T1\-4|T[1-4]|GEO|IGEO|HYB|BTL|WPN|GENE|RA|MNS|\d*RG|\d*BL|\d*BZ|\d*BC|DMG\d+|JAIL\d*)/i;

    static readonly WEAPON_PATTERN = /(\d*)(RG|BL|BZ|BC)/i;
    static readonly TABLE_PATTERN = /.*(ARR|REV|ZS|TF|SHIP_BM|SHIP_MS|SHIP|PLUG|T1\-3|T1\-4|T[1-4]|^IGEO|^GEO|HYB|BTL|WPN|GENE|RA|MNS).*/i;
    static readonly DAMAGE_PATTERN = /DMG(\d+)/i;
    static readonly JAIL_PATTERN = /JAIL(\d*)/i;
    // 下記は標準ダイスのコマンドパターンマッチするように書き加える
    /*
      /^S?([+\-(]*\d+|\d+B\d+|C[+\-(]*\d+|choice|D66|(repeat|rep|x)\d+|\d+R\d+|\d+U\d+|BCDiceVersion)/i
    */

    static readonly HELP_MESSAGE = `
ARR そこに居たチェック
REV 実は生きていたチェック
ZS  残留思念チェック

JAILn 逮捕チェック (出目+n)
BTL   戦闘チャート
WPN   武器決定チャート

SHIP    船
SHIP_BM ブラックメイデン
SHIP_MS マウス

nRG レイガン  n:攻撃回数（以下同様）
nBL ブラスター
nBZ バズーカ
nBC ビームキャノン

GEO  ジオイド弾 (キャラクター)
IGEO ジオイド弾 (アイテム)
HYB  亜空間ビーム

DMGn n:1 のダメージ (n = 0 のときは 1:2 のダメージ)

Tn   トラップn
T1-3 トラップ1-3
T1-4 トラップ1-4

GENE 遺伝子再編成
PLUG プラグチェック
RA   ランダムアクシデント
TF   変身チェック

MNS  大臣の特権
`.trim();

    private command: string;
    private commandWithoutRepeat: string;
    private repeat: number;

    private matchDMG: RegExpMatchArray;
    private matchWeapon: RegExpMatchArray;
    private matchJAIL: RegExpMatchArray;
    private matchTables: RegExpMatchArray;

    static eval(command: string): Result | null {
        return new LockeDice(command).eval();
    }

    constructor(command: string, internal?: BaseInstance) {
        const commandUpperCase = command.toUpperCase()
        const found = commandUpperCase.replace(/^repeat/i, 'x').replace(/^rep/i, 'x').match(/^x([0-9]+)\s+(.*)/i);
        const repeat: number = (found !== null) ? Math.max(1, parseInt(found[1])) : 1;
        const commandWithoutRepeat: string = (found !== null) ? found[2] : commandUpperCase;


        const matchWeapon = commandWithoutRepeat.match(LockeDice.WEAPON_PATTERN);
        const matchDMG = commandWithoutRepeat.match(LockeDice.DAMAGE_PATTERN);
        const matchJAIL = commandWithoutRepeat.match(LockeDice.JAIL_PATTERN);
        const matchTables = commandWithoutRepeat.match(LockeDice.TABLE_PATTERN);

        let diceText = (repeat > 1) ? `x${repeat} ${commandWithoutRepeat}` : commandWithoutRepeat;
        if (matchWeapon) {
            const diceCount = matchWeapon[1] ? parseInt(matchWeapon[1]) : 1;
            diceText = `${diceCount}D6`;
        }
        if (matchDMG || matchJAIL || matchTables) {
            diceText = "2D6";
        }

        super(diceText, internal);

        this.command = commandUpperCase;
        this.commandWithoutRepeat = commandWithoutRepeat;
        this.repeat = repeat;

        this.matchWeapon = matchWeapon;
        this.matchDMG = matchDMG;
        this.matchJAIL = matchJAIL;
        this.matchTables = matchTables;
    }

    eval(): Result | null {
        if (this.matchTables) {
            return this.rollTables();
        }

        if (this.matchWeapon) {
            return this.rollWeapon();
        }

        if (this.matchDMG) {
            return this.rollDamage();
        }

        if (this.matchJAIL) {
            return this.rollJail();
        }
        return super.eval();
    }

    private roll() {
        const result = super.eval();
        const diceValues = result.detailedRands.map(detail => detail.value);
        const totalValue = diceValues.reduce((a, b) => a + b);
        return { result, diceValues, totalValue };
    }


    private rollTables(): Result {
        const tableCommand = this.matchTables[1];

        const result = tableFromCommand(tableCommand).roll();
        const diceValues = result.detailedRands.map(detail => detail.value);
        const totalValue = diceValues.reduce((a, b) => a + b);

        // before: (2)
        // after : (2[1,1])
        const text = result.text.replace(/\([0-9]+\)/i, `(${totalValue}[${diceValues}])`);
        return { ...result, text: text };
    }



    private rollDamage(): Result {
        const damageRateTable = [
            [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0],
            [2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0],
            [3, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0],
            [3, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0],
            [3, 3, 2, 2, 1, 1, 1, 1, 0, 0, 0],
            [3, 3, 3, 2, 2, 1, 1, 1, 1, 0, 0],
            [4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 0],
            [4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1],
            [4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1],
            [5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 1]
        ]

        const damageRate: number = parseInt(this.matchDMG[1]);
        if (damageRate < 0 || damageRate > 10) {
            return;
        }

        const { result, diceValues, totalValue } = this.roll();
        const damage = damageRateTable[damageRate][totalValue - 2];


        const damageRateText = (damageRate == 0) ? "1:2" : `${damageRate}:1`;
        const TFText = (totalValue == 2 || totalValue == 12) ? " 変身チェック（コマンド TF）" : "";

        let text = `${damageRateText} ダメージ (${totalValue}[${diceValues}]) → ${damage} ダメージ` + TFText;
        return { ...result, text: text };
    }


    private rollWeapon(): Result {
        type Weapon = { fireRate: number[], name: string };
        const getWeapon = (weaponType: string): Weapon => {
            const WEAPONS = {
                "RG": {
                    fireRate: [0, 1, 2, 2, 3, 4],
                    name: "レイガン"
                },
                "BL": {
                    fireRate: [3, 4, 5, 5, 6, 7],
                    name: "ブラスター"
                },
                "BZ": {
                    fireRate: [6, 7, 8, 9, 10, 11],
                    name: "バズーカ"
                },
                "BC": {
                    fireRate: [10, 12, 14, 16, 18, 20],
                    name: "ビームキャノン"
                }
            }
            return WEAPONS[weaponType];
        }
        const fireWeapon = (weapon: Weapon, dice: number): number => weapon.fireRate[dice - 1];


        const { result, diceValues } = this.roll();

        const weapon = getWeapon(this.matchWeapon[2]);
        const fires = diceValues.map(dice => fireWeapon(weapon, dice));
        const totalFire = fires.reduce((a, b) => a + b, 0);

        const text = `${weapon.name} 火力 (${fires}[${diceValues}]) → 火力 ${totalFire}`;

        return { ...result, text: text };
    }

    private rollJail(): Result {
        const { result, diceValues, totalValue } = this.roll();

        const offset: number = this.matchJAIL[1] ? parseInt(this.matchJAIL[1]) : 0;
        let effectText = "";
        switch (totalValue + offset) {
            case 6:
                effectText = "Lv4以上なら脱出成功";
                break;
            case 7:
                effectText = "Lv5以上なら脱出成功";
                break;
            case 8:
                effectText = "Lv6以上なら脱出成功";
                break;
            case 9:
            case 10:
                effectText = "戦闘発生 コマンドBTLの結果を適用。逃避カードで戦闘から抜けると再び逮捕される。";
                break;
            case 11:
                effectText = "TRAP1 コマンドT1の結果を適用。適用後、釈放。";
                break;
            default:
                effectText = "プルーブ Lvが0になる。毎ターン1D6を振り、1か2が出るとLvが元に戻る。";
                break;
        }

        if (2 <= totalValue && totalValue <= 5) {
            effectText = "脱出成功"
        }

        const additionalText = (offset > 0 && totalValue >= 6) ? `+${offset}=${totalValue + offset}` : "";

        const text = `逮捕チェック (${totalValue}[${diceValues}]${additionalText}) ${effectText}`
        return { ...result, text: text };
    }
}