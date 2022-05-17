import * as fs from "fs";
import path from "path";

export class ReadService {
  existAny(names: string[]) {
    for (const name of names) {
      const file = path.resolve(process.cwd(), name);
      if (fs.existsSync(file)) {
        return name;
      }
    }
  }

  readTxt(name: string): string | undefined {
    const file = path.resolve(process.cwd(), name);
    if (fs.existsSync(file)) {
      return fs.readFileSync(file, "utf-8");
    }
  }
}
