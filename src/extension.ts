import { ACCOUNT_KEY, COOKIE_KEY, SETTING_DIR, TMP_DIR } from "./constant";
import { AccountManager, ButtonManager } from "./manager";
import { LyricCache, MusicCache, Player } from "./util";
import {
  initAccount,
  initCache,
  initCommand,
  initLocal,
  initPlayer,
  initPlaylist,
  initQueue,
  initRadio,
  initStatusBar,
} from "./activate";
import type { ExtensionContext } from "vscode";
import { workspace } from "vscode";

export async function activate(context: ExtensionContext): Promise<void> {
  void context.globalState.update(ACCOUNT_KEY, undefined);
  void context.globalState.update(COOKIE_KEY, undefined);
  await Promise.all([
    workspace.fs.createDirectory(SETTING_DIR),
    workspace.fs.createDirectory(TMP_DIR),
  ]);
  AccountManager.context = context;
  ButtonManager.context = context;
  Player.context = context;
  initPlayer();
  initQueue();
  initPlaylist();
  initRadio();
  initCommand(context);
  initStatusBar();
  initAccount(context);
  void initCache(context);
  initLocal(context);
}

export function deactivate(): void {
  Player.stop();
  MusicCache.verify();
  LyricCache.verify();
  void workspace.fs.delete(TMP_DIR, { recursive: true, useTrash: false });
}
