import * as fs from "fs";
import { CreateTemplateService } from "../services/create.services/create-template.service";
import { Inject } from "@halsp/inject";
import { FileService } from "../services/file.service";
import { CreateEnvService } from "../services/create.services/create-env.service";
import { PluginSelectService } from "../services/create.services/plugin-select.service";
import { CreatePackageService } from "../services/create.services/create-package.service";
import { CommandService } from "../services/command.service";
import { CopyBaseService } from "../services/create.services/copy-base-files.service";
import inquirer from "inquirer";
import { RunnerService } from "../services/runner.service";
import { Middleware } from "@halsp/core";
import { PackageManagerService } from "../services/package-manager.service";
import { SortPluginsService } from "../services/create.services/sort-plugins.service";
import { ChalkService } from "../services/chalk.service";

export class CreateMiddleware extends Middleware {
  @Inject
  private readonly createTemplateService!: CreateTemplateService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly createPackageService!: CreatePackageService;
  @Inject
  private readonly pluginSelectService!: PluginSelectService;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly copyBaseService!: CopyBaseService;
  @Inject
  private readonly runnerService!: RunnerService;
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly sortPluginsService!: SortPluginsService;
  @Inject
  private readonly chalkService!: ChalkService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  override async invoke(): Promise<void> {
    await this.checkName();

    if (fs.existsSync(this.targetDir)) {
      const force = this.commandService.getOptionVlaue<boolean>("force");
      if (force) {
        await fs.promises.rm(this.targetDir, {
          force: true,
          recursive: true,
        });
      } else {
        const y = this.commandService.getOptionVlaue<boolean>("y");
        if (!y) {
          const message = `Target directory ${this.targetDir} already exists. Overwrite?`;
          if (!(await this.fileService.isOverwrite(message))) {
            return;
          }
        }
      }
    }

    if (!fs.existsSync(this.targetDir)) {
      await fs.promises.mkdir(this.targetDir, {
        recursive: true,
      });
    }

    const pm = await this.getPackageManager();
    if (!pm) return;

    const templateInitResult = await this.createTemplateService.init(pm);
    if (!templateInitResult) return;

    const env = await this.createEnvService.create();
    const plugins = await this.getPlugins(env);
    await this.logPlugins(plugins);

    await this.createPackageService.create(plugins);
    await this.copyBaseService.copy();
    await this.createTemplateService.create(plugins);

    const installResult = await this.install(pm);
    if (!installResult) return;

    this.initGit();
    this.runApp();
  }

  private initGit() {
    if (this.commandService.getOptionVlaue<boolean>("skipGit")) {
      return;
    }

    this.runnerService.run("git", "init", {
      cwd: this.targetDir,
    });
  }

  private async install(pm: string) {
    if (this.commandService.getOptionVlaue<boolean>("skipInstall")) {
      return true;
    }

    const installResult = this.packageManagerService.install(
      pm,
      this.targetDir
    );
    return installResult.status == 0;
  }

  private runApp() {
    if (this.commandService.getOptionVlaue<boolean>("skipInstall")) {
      return;
    }
    if (this.commandService.getOptionVlaue<boolean>("skipRun")) {
      return;
    }

    this.runnerService.run("npm", "start", {
      cwd: this.targetDir,
    });
  }

  private async getPlugins(env?: string) {
    let plugins: string[];
    if (this.commandService.getOptionVlaue<boolean>("skipPlugins")) {
      plugins = [];
    } else {
      const argPlugins = this.commandService.getOptionVlaue<string>("plugins");
      if (argPlugins) {
        plugins = argPlugins
          .split(/\_|\,|\s/)
          .map((item) => item.trim())
          .filter((item) => !!item);
      } else {
        plugins = await this.pluginSelectService.select(env);
      }
    }
    if (!plugins.includes("core")) {
      plugins.push("core");
    }
    if (env) {
      plugins.push(env);
    }
    plugins = await this.sortPluginsService.sortPlugins(plugins, true);
    return plugins;
  }

  private async checkName(): Promise<void> {
    if (this.ctx.commandArgs.name) {
      return;
    }

    const { name } = await inquirer.prompt([
      {
        type: "input",
        message: "Project name:",
        name: "name",
        default: "halsp-project",
        validate: (input) => {
          const result = /^[^?v\*|""<>:/]{1,256}$/.test(input.trim());
          if (result) {
            return true;
          } else {
            return "Illegal name, please try again.";
          }
        },
      },
    ]);
    this.ctx.commandArgs.name = name.trim();
  }

  private async getPackageManager() {
    let pm = this.commandService.getOptionVlaue<string>("packageManager");
    if (!pm) {
      pm = await this.packageManagerService.pickPackageManager();
    }
    return pm;
  }

  private async logPlugins(plugins: string[]) {
    const existPlugins = await this.sortPluginsService.filterExistPlugins(
      plugins
    );
    const consolePlugins = existPlugins
      .filter((p) => p != "common")
      .map((p) => `@halsp/${p}`);
    this.logger.info("\n");
    this.logger.info(
      this.chalkService.bold("Sorted plugins"),
      this.chalkService.greenBright(consolePlugins.join(", "))
    );
    this.logger.info("\n");
  }
}
