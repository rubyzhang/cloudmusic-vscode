import { QueueItem, songsItem } from "../constant/type";
import { QueueItemTreeItem } from "../provider/queueProvider";
import { Player } from "./player";

export function solveSongItem(item: songsItem): QueueItem {
  const { name, id, alia, ar } = item;
  let arNames = [];
  for (const i of ar) {
    arNames.push(i.name);
  }
  const arName = arNames.join("/");
  return {
    name,
    id,
    alia: alia ? alia[0] : "",
    arName,
  };
}

export async function playCallback(elements: [number, QueueItemTreeItem][]) {
  Player.load(elements[0][1].url);
}