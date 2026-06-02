import { Injectable } from '@angular/core';
import { Card } from '@udonarium/card';
import { CardStack } from '@udonarium/card-stack';
import { ImageContext, ImageFile } from '@udonarium/core/file-storage/image-file';
import { ImageStorage } from '@udonarium/core/file-storage/image-storage';
import { EventSystem } from '@udonarium/core/system';
import { DiceSymbol, DiceType } from '@udonarium/dice-symbol';
import { GameCharacter } from '@udonarium/game-character';
import { GameTable } from '@udonarium/game-table';
import { GameTableMask } from '@udonarium/game-table-mask';
import { LockeCardType } from '@udonarium/locke-type';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';
import { TableSelecter } from '@udonarium/table-selecter';
import { Terrain } from '@udonarium/terrain';
import { TextNote } from '@udonarium/text-note';

import { ContextMenuAction, ContextMenuSeparator } from './context-menu.service';
import { PointerCoordinate } from './pointer-device.service';
import { TabletopService } from './tabletop.service';

@Injectable({
  providedIn: 'root'
})
export class TabletopActionService {

  constructor(private tabletop: TabletopService) { }

  createGameCharacter(position: PointerCoordinate): GameCharacter {
    let character = GameCharacter.create('新しいキャラクター', 1, '');
    character.location.x = position.x - 25;
    character.location.y = position.y - 25;
    character.posZ = position.z;
    return character;
  }

  createGameTableMask(position: PointerCoordinate): GameTableMask {
    let viewTable = this.getViewTable();
    if (!viewTable) return;

    let tableMask = GameTableMask.create('マップマスク', 5, 5, 100);
    tableMask.location.x = position.x - 25;
    tableMask.location.y = position.y - 25;
    tableMask.posZ = position.z;

    viewTable.appendChild(tableMask);
    return tableMask;
  }

  createTerrain(position: PointerCoordinate): Terrain {
    let url: string = './assets/images/tex.jpg';
    let image: ImageFile = ImageStorage.instance.get(url)
    if (!image) image = ImageStorage.instance.add(url);

    let viewTable = this.getViewTable();
    if (!viewTable) return;

    let terrain = Terrain.create('地形', 2, 2, 2, image.identifier, image.identifier);
    terrain.location.x = position.x - 50;
    terrain.location.y = position.y - 50;
    terrain.posZ = position.z;

    viewTable.appendChild(terrain);
    return terrain;
  }

  createTextNote(position: PointerCoordinate): TextNote {
    let textNote = TextNote.create('共有メモ', 'テキストを入力してください', 5, 4, 3);
    textNote.location.x = position.x;
    textNote.location.y = position.y;
    textNote.posZ = position.z;
    return textNote;
  }

  createDiceSymbol(position: PointerCoordinate, name: string, diceType: DiceType, imagePathPrefix: string): DiceSymbol {
    let diceSymbol = DiceSymbol.create(name, diceType, 1);
    let image: ImageFile = null;

    diceSymbol.faces.forEach(face => {
      let url: string = `./assets/images/dice/${imagePathPrefix}/${imagePathPrefix}[${face}].png`;
      image = ImageStorage.instance.get(url);
      if (!image) { image = ImageStorage.instance.add(url); }
      diceSymbol.imageDataElement.getFirstElementByName(face).value = image.identifier;
    });

    diceSymbol.location.x = position.x - 25;
    diceSymbol.location.y = position.y - 25;
    diceSymbol.posZ = position.z;
    return diceSymbol;
  }

  createTrump(position: PointerCoordinate): CardStack {
    let cardStack = CardStack.create('トランプ山札');
    cardStack.location.x = position.x - 25;
    cardStack.location.y = position.y - 25;
    cardStack.posZ = position.z;

    let back: string = './assets/images/trump/z02.gif';
    if (!ImageStorage.instance.get(back)) {
      ImageStorage.instance.add(back);
    }

    let suits: string[] = ['c', 'd', 'h', 's'];
    let trumps: string[] = [];

    for (let suit of suits) {
      for (let i = 1; i <= 13; i++) {
        trumps.push(suit + (('00' + i).slice(-2)));
      }
    }

    trumps.push('x01');
    trumps.push('x02');

    for (let trump of trumps) {
      let url: string = './assets/images/trump/' + trump + '.gif';
      if (!ImageStorage.instance.get(url)) {
        ImageStorage.instance.add(url);
      }
      let card = Card.create('カード', url, back);
      cardStack.putOnBottom(card);
    }
    return cardStack;
  }

  createCombat(position: PointerCoordinate): CardStack {
    let cardStack = CardStack.create('コンバットカード');
    let image_url_path = 'https://kurpg.github.io/udonarium-locke-assets/';
    cardStack.location.x = position.x - 25;
    cardStack.location.y = position.y - 25;
    cardStack.posZ = position.z;

    let back: string = image_url_path + 'combat_card/combat_back.png';
    if (!ImageStorage.instance.get(back)) {
      ImageStorage.instance.add(back);
    }

    let combats1: string[] = ['a_4_12', 'a_4_14', 'a_4_16', 'a_4_18', 'a_4_20', 'a_5_25', 'a_5_30', 'a_5_35', 'a_6_40', 'a_6_50', 'a_7_100', 'l_5', 'l_6', 'l_7', 'i_1', 'i_2', 'i_3', 'i_4', 'i_5', 'i_6', 'i_7', 'w'];
    let combats2: string[] = ['a_3_7', 'a_3_8', 'a_3_9', 'a_3_10', 'b_5', 'b_6', 't_1', 't_2', 't_3', 't_4', 't_5', 't_6', 't_7'];
    let combats3: string[] = ['a_2_4', 'a_2_5', 'a_2_6', 'b_3', 'b_4'];
    let combats4: string[] = ['a_1_1', 'a_1_2', 'a_1_3', 'b_1', 'b_2'];
    let combats5: string[] = ['telepath'];

    // 一枚しかないやつを作る
    for (let combat1 of combats1) {
      let url: string = image_url_path + 'combat_card/combat_' + combat1 + '.png';
      if (!ImageStorage.instance.get(url)) {
        ImageStorage.instance.add(url);
      }
      let card = Card.create('コンバットカード', url, back);
      cardStack.putOnBottom(card);
    }

    // 二枚のやつを作る
    for (let combat2 of combats2) {
      for (let i = 1; i <= 2; i++) {
        let url: string = image_url_path + 'combat_card/combat_' + combat2 + '.png';
        if (!ImageStorage.instance.get(url)) {
          ImageStorage.instance.add(url);
        }
        let card = Card.create('コンバットカード', url, back);
        cardStack.putOnBottom(card);
      }
    }

    // 三枚のやつを作る
    for (let combat3 of combats3) {
      for (let i = 1; i <= 3; i++) {
        let url: string = image_url_path + 'combat_card/combat_' + combat3 + '.png';
        if (!ImageStorage.instance.get(url)) {
          ImageStorage.instance.add(url);
        }
        let card = Card.create('コンバットカード', url, back);
        cardStack.putOnBottom(card);
      }
    }

    // //四枚のやつを作る
    for (let combat4 of combats4) {
      for (let i = 1; i <= 4; i++) {
        let url: string = image_url_path + 'combat_card/combat_' + combat4 + '.png';
        if (!ImageStorage.instance.get(url)) {
          ImageStorage.instance.add(url);
        }
        let card = Card.create('コンバットカード', url, back);
        cardStack.putOnBottom(card);
      }
    }

    // 五枚のやつを作る
    for (let combat5 of combats5) {
      for (let i = 1; i <= 5; i++) {
        let url: string = image_url_path + 'combat_card/combat_' + combat5 + '.png';
        if (!ImageStorage.instance.get(url)) {
          ImageStorage.instance.add(url);
        }
        let card = Card.create('コンバットカード', url, back);
        cardStack.putOnBottom(card);
      }
    }

    cardStack.setLockeCardType(LockeCardType.COMBAT);

    return cardStack;
  }

  // 超人ロック用：指定種別のカードを集めて山札を作る
  gatherCards(position: PointerCoordinate, locke_card_type: LockeCardType, name: string): CardStack {
    let cards: Card[] = this.tabletop.cardStacks
      .reduce((all, stack) => all.concat(stack.cards), [] as Card[])
      .concat(this.tabletop.cards)
      .filter(card => card.locke_card_type == locke_card_type);
    if (!cards.length) return;

    let cardStack: CardStack = this.createStackFromCards(position, cards, name);
    if (!cardStack) return;
    cardStack.cards.forEach(card => card.setLockeCardType(LockeCardType.COMBAT));
    this.clean();
    return cardStack;
  }

  createStackFromCards(position: PointerCoordinate, cards: Card[], name: string): CardStack {
    if (!cards.length) return null;
    let cardStack = CardStack.create(name);
    cardStack.location.x = position.x - 25;
    cardStack.location.y = position.y - 25;
    cardStack.posZ = position.z;

    cards.forEach(card => cardStack.putOnBottom(card));
    cardStack.faceDownAll();
    cardStack.shuffle();
    this.clean();
    return cardStack;
  }

  // 空になった山札を削除する
  clean() {
    for (let stack of this.tabletop.cardStacks) {
      if (!stack.cards.length) {
        stack.destroy();
      }
    }
  }

  makeDefaultTable() {
    let gameTable = new GameTable('gameTable');
    let testBgFile: ImageFile = null;
    let bgFileContext = ImageFile.createEmpty('testTableBackgroundImage_image').toContext();
    bgFileContext.url = './assets/images/BG10a_80.jpg';
    testBgFile = ImageStorage.instance.add(bgFileContext);
    gameTable.name = '最初のテーブル';
    gameTable.imageIdentifier = testBgFile.identifier;
    gameTable.width = 20;
    gameTable.height = 15;
    gameTable.initialize();

    TableSelecter.instance.viewTableIdentifier = gameTable.identifier;
  }

  makeDefaultTabletopObjects() {
    // 超人ロック用：起動時のテストオブジェクト生成を無効化（差分を小さくするためコメントアウトせず早期return）
    return;

    let testCharacter: GameCharacter = null;
    let testFile: ImageFile = null;
    let fileContext: ImageContext = null;

    testCharacter = new GameCharacter('testCharacter_1');
    fileContext = ImageFile.createEmpty('testCharacter_1_image').toContext();
    fileContext.url = './assets/images/mon_052.gif';
    testFile = ImageStorage.instance.add(fileContext);
    testCharacter.location.x = 5 * 50;
    testCharacter.location.y = 9 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('モンスターA', 1, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_2');
    testCharacter.location.x = 8 * 50;
    testCharacter.location.y = 8 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('モンスターB', 1, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_3');
    fileContext = ImageFile.createEmpty('testCharacter_3_image').toContext();
    fileContext.url = './assets/images/mon_128.gif';
    testFile = ImageStorage.instance.add(fileContext);
    testCharacter.location.x = 4 * 50;
    testCharacter.location.y = 2 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('モンスターC', 3, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_4');
    fileContext = ImageFile.createEmpty('testCharacter_4_image').toContext();
    fileContext.url = './assets/images/mon_150.gif';
    testFile = ImageStorage.instance.add(fileContext);
    testCharacter.location.x = 6 * 50;
    testCharacter.location.y = 11 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('キャラクターA', 1, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_5');
    fileContext = ImageFile.createEmpty('testCharacter_5_image').toContext();
    fileContext.url = './assets/images/mon_211.gif';
    testFile = ImageStorage.instance.add(fileContext);
    testCharacter.location.x = 12 * 50;
    testCharacter.location.y = 12 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('キャラクターB', 1, testFile.identifier);

    testCharacter = new GameCharacter('testCharacter_6');
    fileContext = ImageFile.createEmpty('testCharacter_6_image').toContext();
    fileContext.url = './assets/images/mon_135.gif';
    testFile = ImageStorage.instance.add(fileContext);
    testCharacter.location.x = 5 * 50;
    testCharacter.location.y = 13 * 50;
    testCharacter.initialize();
    testCharacter.createTestGameDataElement('キャラクターC', 1, testFile.identifier);
  }

  makeDefaultContextMenuActions(position: PointerCoordinate): ContextMenuAction[] {
    return [
      this.getCreateCharacterMenu(position),
      this.getCreateTableMaskMenu(position),
      this.getCreateTerrainMenu(position),
      this.getCreateTextNoteMenu(position),
      this.getCreateTrumpMenu(position),
      this.getCreateDiceSymbolMenu(position),
      ContextMenuSeparator,
      this.getGatherCombatMenu(position),
      ContextMenuSeparator,
      this.getCreateCombatMenu(position),
      this.getCleanMenu(),
      ContextMenuSeparator,
      this.setInitiative(),
    ];
  }

  private getCreateCombatMenu(position: PointerCoordinate): ContextMenuAction {
    return {
      name: 'コンバットカードの山札を作成', action: () => {
        this.createCombat(position);
        SoundEffect.play(PresetSound.cardPut);
      }
    }
  }

  private getGatherCombatMenu(position: PointerCoordinate): ContextMenuAction {
    return {
      name: 'コンバットカードを集める', action: () => {
        this.gatherCards(position, LockeCardType.COMBAT, 'コンバットカード');
        this.clean();
      }
    }
  }

  private setInitiative(): ContextMenuAction {
    return {
      name: 'イニシアをセットする', action: () => {
        EventSystem.trigger('SET_INITIATIVE', {});
        SoundEffect.play(PresetSound.diceRoll2);
      }
    }
  }

  private getCleanMenu(): ContextMenuAction {
    return {
      name: 'お掃除', action: () => {
        this.clean();
      }
    }
  }

  private getCreateCharacterMenu(position: PointerCoordinate): ContextMenuAction {
    return {
      name: 'キャラクターを作成', action: () => {
        let character = this.createGameCharacter(position);
        EventSystem.trigger('SELECT_TABLETOP_OBJECT', { identifier: character.identifier, className: character.aliasName });
        SoundEffect.play(PresetSound.piecePut);
      }
    }
  }

  private getCreateTableMaskMenu(position: PointerCoordinate): ContextMenuAction {
    return {
      name: 'マップマスクを作成', action: () => {
        this.createGameTableMask(position);
        SoundEffect.play(PresetSound.cardPut);
      }
    }
  }

  private getCreateTerrainMenu(position: PointerCoordinate): ContextMenuAction {
    return {
      name: '地形を作成', action: () => {
        this.createTerrain(position);
        SoundEffect.play(PresetSound.blockPut);
      }
    }
  }

  private getCreateTextNoteMenu(position: PointerCoordinate): ContextMenuAction {
    return {
      name: '共有メモを作成', action: () => {
        this.createTextNote(position);
        SoundEffect.play(PresetSound.cardPut);
      }
    }
  }

  private getCreateTrumpMenu(position: PointerCoordinate): ContextMenuAction {
    return {
      name: 'トランプの山札を作成', action: () => {
        this.createTrump(position);
        SoundEffect.play(PresetSound.cardPut);
      }
    }
  }

  private getCreateDiceSymbolMenu(position: PointerCoordinate): ContextMenuAction {
    let dices: { menuName: string, diceName: string, type: DiceType, imagePathPrefix: string }[] = [
      { menuName: 'D4', diceName: 'D4', type: DiceType.D4, imagePathPrefix: '4_dice' },
      { menuName: 'D6', diceName: 'D6', type: DiceType.D6, imagePathPrefix: '6_dice' },
      { menuName: 'D8', diceName: 'D8', type: DiceType.D8, imagePathPrefix: '8_dice' },
      { menuName: 'D10', diceName: 'D10', type: DiceType.D10, imagePathPrefix: '10_dice' },
      { menuName: 'D10 (00-90)', diceName: 'D10', type: DiceType.D10_10TIMES, imagePathPrefix: '100_dice' },
      { menuName: 'D12', diceName: 'D12', type: DiceType.D12, imagePathPrefix: '12_dice' },
      { menuName: 'D20', diceName: 'D20', type: DiceType.D20, imagePathPrefix: '20_dice' },
    ];
    let subMenus: ContextMenuAction[] = [];

    dices.forEach(item => {
      subMenus.push({
        name: item.menuName, action: () => {
          this.createDiceSymbol(position, item.diceName, item.type, item.imagePathPrefix);
          SoundEffect.play(PresetSound.dicePut);
        }
      });
    });
    return { name: 'ダイスを作成', action: null, subActions: subMenus };
  }

  private getViewTable(): GameTable {
    return TableSelecter.instance.viewTable;
  }
}
