# CLAUDE.md

Udonarium（Angular 製のオンラインセッションツール）に、超人ロック用のカスタム要素を追加したフォークです。

## ダイスボット

- カスタムダイスボットは `src/app/class/dice-bot.ts` で登録しています。
- 「超人ロック40th」ダイスボット（`src/app/class/Locke40thDice.ts`、`Locke40thDiceTable.ts`）に関する作業は、
  **必ず先に `docs/wiki/Locke40th-DiceBot.md` を読み、その手順に従ってください。**
- 既存の「超人ロック」（`LockeDice.ts`、`LockeDiceTable.ts`）は、明示的に依頼されない限り変更しないでください。

## 確認

- ビルド: `npm run build`（CSS/bundle の budget 警告は既存のもので無視してよい）
- 起動: `npm start` → http://localhost:4200
