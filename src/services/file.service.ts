import path from "path";
import * as fs from "fs";
import { Inject } from "@halsp/inject";
import { InquirerService } from "./inquirer.service";

export class FileService {
  @Inject
  private readonly inquirerService!: InquirerService;

  public async isOverwrite(message: string): Promise<boolean> {
    const { overwrite } = await this.inquirerService.prompt([
      {
        type: "confirm",
        message: message,
        name: "overwrite",
        default: false,
      },
    ]);
    return overwrite as boolean;
  }

  public async createDir(filePath: string) {
    const dirname = path.dirname(filePath);

    if (!fs.existsSync(dirname)) {
      await fs.promises.mkdir(dirname, {
        recursive: true,
      });
    }
  }

  public existAny(names: string[]) {
    for (const name of names) {
      const file = path.resolve(process.cwd(), name);
      if (fs.existsSync(file)) {
        return name;
      }
    }
  }
}
