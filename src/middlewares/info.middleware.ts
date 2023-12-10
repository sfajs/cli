import figlet from "figlet";
import os from "os";
import * as fs from "fs";
import path from "path";
import { DepsService } from "../services/deps.service";
import { Inject } from "@halsp/inject";
import { Middleware } from "@halsp/core";
import chalk from "chalk";
import { createDirname } from "../utils/shims";

const __dirname = createDirname(import.meta.url);

export class InfoMiddleware extends Middleware {
  @Inject
  private readonly depsService!: DepsService;

  get logInfo() {
    return this.logger.info.bind(this.logger);
  }

  override async invoke(): Promise<void> {
    const pkg = JSON.parse(
      await fs.promises.readFile(
        path.join(__dirname, "../../package.json"),
        "utf-8",
      ),
    );

    const text = figlet.textSync("HALSPCLI");
    this.logInfo("\n");
    this.logInfo(chalk.blueBright(text));

    this.logTitle("System Information");
    this.logItems([
      {
        key: "OS Type",
        value: os.type(),
      },
      {
        key: "OS Platform",
        value: os.platform(),
      },
      {
        key: "OS Release",
        value: os.release(),
      },
      {
        key: "NodeJS Version",
        value: process.version,
      },
    ]);

    this.logTitle("Halsp CLI");
    this.logItems([
      {
        key: "Halsp CLI Version",
        value: pkg.version,
      },
    ]);

    this.logTitle("Halsp Packages Version");
    this.logItems(
      this.depsService.getProjectHalspDeps(
        path.join(process.cwd(), "package.json"),
      ),
    );
    await this.next();
  }

  private logTitle(titie: string) {
    this.logInfo("\n" + chalk.bold.blueBright(`[${titie}]`));
  }

  private logItems(items: { key: string; value: string }[]) {
    const keyLen = Math.max(...items.map((item) => item.key.length));
    for (const item of items) {
      this.logInfo(
        item.key.padEnd(keyLen + 1, " ") + ": " + chalk.cyanBright(item.value),
      );
    }
  }
}
