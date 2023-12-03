import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { PackageManagerService } from "../../services/package-manager.service";
import path from "path";
import { ChalkService } from "../../services/chalk.service";
import { PluginService } from "../../services/plugin.service";

export class AddPluginMiddleware extends Middleware {
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly chalkService!: ChalkService;
  @Inject
  private readonly pluginService!: PluginService;

  async invoke() {
    const cliDir = path.join(__dirname, "../../..");
    const name = this.ctx.commandArgs.name;

    const plugins = this.pluginService.get();
    if (plugins.filter((p) => p.package == name).length) {
      this.logger.error(`This plugin has already been added.`);
      return;
    }

    const installResult = await this.packageManagerService.add(
      name,
      undefined,
      cliDir,
    );
    if (installResult.status != 0) {
      return;
    }

    this.logger.info(
      "Add plugin " + this.chalkService.bold.greenBright(name) + " success.",
    );
  }
}