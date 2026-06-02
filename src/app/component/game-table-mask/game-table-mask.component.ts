import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy
} from '@angular/core';
import { Card } from '@udonarium/card';
import { ImageFile } from '@udonarium/core/file-storage/image-file';
import { EventSystem } from '@udonarium/core/system';
import { MathUtil } from '@udonarium/core/system/util/math-util';
import { GameTableMask } from '@udonarium/game-table-mask';
import { LockeAreaType, LockeCardType } from '@udonarium/locke-type';
import { PresetSound, SoundEffect } from '@udonarium/sound-effect';
import { GameCharacterSheetComponent } from 'component/game-character-sheet/game-character-sheet.component';
import { InputHandler } from 'directive/input-handler';
import { MovableOption } from 'directive/movable.directive';
import { ContextMenuAction, ContextMenuSeparator, ContextMenuService } from 'service/context-menu.service';
import { CoordinateService } from 'service/coordinate.service';
import { PanelOption, PanelService } from 'service/panel.service';
import { PointerDeviceService } from 'service/pointer-device.service';
import { TabletopActionService } from 'service/tabletop-action.service';
import { TabletopService } from 'service/tabletop.service';
import { SelectionState, TabletopSelectionService } from 'service/tabletop-selection.service';

@Component({
  selector: 'game-table-mask',
  templateUrl: './game-table-mask.component.html',
  styleUrls: ['./game-table-mask.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameTableMaskComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() gameTableMask: GameTableMask = null;
  @Input() is3D: boolean = false;

  get name(): string { return this.gameTableMask.name; }
  get width(): number { return MathUtil.clampMin(this.gameTableMask.width); }
  get height(): number { return MathUtil.clampMin(this.gameTableMask.height); }
  get opacity(): number { return this.gameTableMask.opacity; }
  get imageFile(): ImageFile { return this.gameTableMask.imageFile; }
  get isLock(): boolean { return this.gameTableMask.isLock; }
  set isLock(isLock: boolean) { this.gameTableMask.isLock = isLock; }

  get selectionState(): SelectionState { return this.selectionService.state(this.gameTableMask); }
  get isSelected(): boolean { return this.selectionState !== SelectionState.NONE; }
  get isMagnetic(): boolean { return this.selectionState === SelectionState.MAGNETIC; }

  gridSize: number = 50;

  movableOption: MovableOption = {};

  private input: InputHandler = null;

  constructor(
    private ngZone: NgZone,
    private tabletopService: TabletopService,
    private tabletopActionService: TabletopActionService,
    private contextMenuService: ContextMenuService,
    private elementRef: ElementRef<HTMLElement>,
    private panelService: PanelService,
    private changeDetector: ChangeDetectorRef,
    private selectionService: TabletopSelectionService,
    private pointerDeviceService: PointerDeviceService,
    private coordinateService: CoordinateService,
  ) { }

  ngOnChanges(): void {
    EventSystem.unregister(this);
    EventSystem.register(this)
      .on(`UPDATE_GAME_OBJECT/identifier/${this.gameTableMask?.identifier}`, event => {
        this.changeDetector.markForCheck();
      })
      .on(`UPDATE_OBJECT_CHILDREN/identifier/${this.gameTableMask?.identifier}`, event => {
        this.changeDetector.markForCheck();
      })
      .on('SYNCHRONIZE_FILE_LIST', event => {
        this.changeDetector.markForCheck();
      })
      .on('UPDATE_FILE_RESOURE', event => {
        this.changeDetector.markForCheck();
      })
      .on(`UPDATE_SELECTION/identifier/${this.gameTableMask?.identifier}`, event => {
        this.changeDetector.markForCheck();
      });
    this.movableOption = {
      tabletopObject: this.gameTableMask,
      transformCssOffset: 'translateZ(0.15px)',
      colideLayers: ['terrain']
    };
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.input = new InputHandler(this.elementRef.nativeElement);
    });
    this.input.onStart = this.onInputStart.bind(this);
  }

  ngOnDestroy() {
    this.input.destroy();
    EventSystem.unregister(this);
  }

  @HostListener('dragstart', ['$event'])
  onDragstart(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  onInputStart(e: any) {
    this.input.cancel();

    // TODO:もっと良い方法考える
    if (this.isLock) {
      EventSystem.trigger('DRAG_LOCKED_OBJECT', { srcEvent: e });
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) {
    e.stopPropagation();
    e.preventDefault();

    if (!this.pointerDeviceService.isAllowedToOpenContextMenu) return;
    let menuPosition = this.pointerDeviceService.pointers[0];

    let menuActions: ContextMenuAction[] = [];
    menuActions = menuActions.concat(this.makeSelectionContextMenu());
    menuActions = menuActions.concat(this.makeContextMenu());

    this.contextMenuService.open(menuPosition, menuActions, this.name);
  }

  onMove() {
    this.contextMenuService.close();
    SoundEffect.play(PresetSound.cardPick);
  }

  onMoved() {
    SoundEffect.play(PresetSound.cardPut);
  }

  private makeSelectionContextMenu(): ContextMenuAction[] {
    if (this.selectionService.objects.length < 1) return [];

    let actions: ContextMenuAction[] = [];

    let objectPosition = this.coordinateService.calcTabletopLocalCoordinate();
    actions.push({ name: 'ここに集める', action: () => this.selectionService.congregate(objectPosition) });

    if (this.isSelected) {
      let selectedGameTableMasks = () => this.selectionService.objects.filter(object => object.aliasName === this.gameTableMask.aliasName) as GameTableMask[];
      actions.push(
        {
          name: '選択したマップマスク', action: null, subActions: [
            {
              name: 'すべて固定する', action: () => {
                selectedGameTableMasks().forEach(gameTableMask => gameTableMask.isLock = true);
                SoundEffect.play(PresetSound.lock);
              }
            },
            {
              name: 'すべてのコピーを作る', action: () => {
                selectedGameTableMasks().forEach(gameTableMask => {
                  let cloneObject = gameTableMask.clone();
                  cloneObject.location.x += this.gridSize;
                  cloneObject.location.y += this.gridSize;
                  cloneObject.isLock = false;
                  if (gameTableMask.parent) gameTableMask.parent.appendChild(cloneObject);
                });
                SoundEffect.play(PresetSound.cardPut);
              }
            },
          ]
        }
      );
    }
    actions.push(ContextMenuSeparator);
    return actions;
  }

  private makeContextMenu(): ContextMenuAction[] {
    let objectPosition = this.coordinateService.calcTabletopLocalCoordinate();
    let actions: ContextMenuAction[] = [];
    actions.push((this.isLock
      ? {
        name: '固定解除', action: () => {
          this.isLock = false;
          SoundEffect.play(PresetSound.unlock);
        }
      }
      : {
        name: '固定する', action: () => {
          this.isLock = true;
          SoundEffect.play(PresetSound.lock);
        }
      }
    ));
    if (!this.isLock) {
      actions.push(ContextMenuSeparator);
      actions.push({
        name: '重なり順を一番上に', action: () => {
          let parent = this.gameTableMask.parent;
          if (parent) parent.appendChild(this.gameTableMask);
        }
      });
      actions.push({
        name: '重なり順を一番下に', action: () => {
          let parent = this.gameTableMask.parent;
          if (parent) parent.prependChild(this.gameTableMask);
        }
      });
    }
    actions.push(ContextMenuSeparator);
    actions.push({ name: 'マップマスクを編集', action: () => { this.showDetail(this.gameTableMask); } });
    actions.push({
      name: 'コピーを作る', action: () => {
        let cloneObject = this.gameTableMask.clone();
        cloneObject.location.x += this.gridSize;
        cloneObject.location.y += this.gridSize;
        cloneObject.isLock = false;
        if (this.gameTableMask.parent) this.gameTableMask.parent.appendChild(cloneObject);
        SoundEffect.play(PresetSound.cardPut);
      }
    });
    actions.push({
      name: '削除する', action: () => {
        this.gameTableMask.destroy();
        SoundEffect.play(PresetSound.sweep);
      }
    });
    actions.push(ContextMenuSeparator);
    actions.push({ name: 'オブジェクト作成', action: null, subActions: this.tabletopActionService.makeDefaultContextMenuActions(objectPosition) });
    actions.push(ContextMenuSeparator);
    actions.push({
      name: '場所種別割当', action: null, subActions: [
        {
          name: '捨て札置き場', action: () => {
            this.gameTableMask.setLockeAreaType(LockeAreaType.COMBAT_TRASH);
          }
        },
        {
          name: '宇宙/秘密基地', action: () => {
            this.gameTableMask.setLockeAreaType(LockeAreaType.SPACE);
          }
        },
        {
          name: '割り当て解除', action: () => {
            this.gameTableMask.setLockeAreaType(LockeAreaType.NONE);
          }
        }
      ]
    });
    actions.push(ContextMenuSeparator);
    actions.push({
      name: '捨て札を集める(捨て札置き場)',
      action:
        this.gameTableMask.locke_area_type == LockeAreaType.COMBAT_TRASH ?
          (
            () => {
              this.gatherTrash(objectPosition);
              SoundEffect.play(PresetSound.cardPut);
            }
          ) : null
    });
    actions.push({
      name: '配置をすこしずらす(宇宙/秘密基地)',
      action:
        this.gameTableMask.locke_area_type == LockeAreaType.SPACE ?
          (
            () => {
              this.randomizeItemPositionOnThis();
              SoundEffect.play(PresetSound.cardPut);
            }
          ) : null
    });
    return actions;
  }

  isOnThis(card: Card): boolean {
    // table maskの上にカードの中心位置が含まれるか判定
    let gridSize = this.gridSize;

    // マスクの範囲計算
    let mask = this.gameTableMask;
    let mask_width = mask.width * this.gridSize;
    let mask_height = mask.height * gridSize;

    let xmin = mask.location.x;
    let xmax = mask.location.x + mask_width;

    let ymin = mask.location.y;
    let ymax = mask.location.y + mask_height;

    // card.size    : 設定のところのサイズ
    // aspect_ratio : アスペクト比。 height/width
    let scale = gridSize * card.size;
    let aspect_ratio = 1.5;  // height/width

    // カード中心位置
    let x = card.location.x + scale / 2;
    let y = card.location.y + scale / 2 * aspect_ratio;
    return (
      (xmin < x) && (x < xmax) && (ymin < y) && (y < ymax)
    );
  }

  randomizeItemPositionOnThis() {
    let gridSize = this.gridSize;
    let move = function (card: Card) {
      let moveScale = gridSize / 5;
      let dx = moveScale * (1 - 2 * Math.random());
      let dy = moveScale * (1 - 2 * Math.random());

      card.location.x = card.location.x + dx;
      card.location.y = card.location.y + dy;
      return card;
    }
    let rotate = function (card: Card) {
      let toRotate = Math.random();
      if (toRotate >= 0.5) card.rotate += 180;
      return card;
    }

    this.tabletopService.cards
      .filter(card => card.locke_card_type == LockeCardType.ITEM)
      .filter(card => this.isOnThis(card))
      .map(move)
      .map(rotate)
      .forEach(card => card.update());
  }

  gatherTrash(position) {
    if (this.gameTableMask.locke_area_type != LockeAreaType.COMBAT_TRASH) return;
    let trash = this.tabletopService.cards
      .filter(card => card.locke_card_type == LockeCardType.COMBAT)
      .filter(card => this.isOnThis(card));
    this.tabletopActionService.createStackFromCards(position, trash, 'コンバットカード');
  }

  private showDetail(gameObject: GameTableMask) {
    let coordinate = this.pointerDeviceService.pointers[0];
    let title = 'マップマスク設定';
    if (gameObject.name.length) title += ' - ' + gameObject.name;
    let option: PanelOption = { title: title, left: coordinate.x - 200, top: coordinate.y - 150, width: 400, height: 300 };
    let component = this.panelService.open<GameCharacterSheetComponent>(GameCharacterSheetComponent, option);
    component.tabletopObject = gameObject;
  }
}
