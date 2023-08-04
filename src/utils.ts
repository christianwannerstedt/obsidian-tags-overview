import * as fs from "fs";
import moment from "moment";

export function getLastModifiedDate(filepath: string): string {
  const stats = fs.statSync(filepath);
  return moment(stats.mtime).calendar();
}
