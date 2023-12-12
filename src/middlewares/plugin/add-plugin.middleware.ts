import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { PackageManagerService } from "../../services/package-manager.service";
import path from "path";
import chalk from "chalk";
import { PluginService } from "../../services/plugin.service";
import { createDirname } from "../../utils/shims";

const __dirname = createDirname(import.meta.url);

export class AddPluginMiddleware extends Middleware {
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly pluginService!: PluginService;

  async invoke() {
    const name = this.ctx.commandArgs.name;

    const plugins = await this.pluginService.get();
    if (plugins.filter((p) => p.package == name).length) {
      this.logger.error(`This plugin has already been added.`);
      return;
    }

    if (!(await this.installPlugin(name))) return;
    if (!(await this.installBaseOn(name))) return;

    this.logger.info(
      "Add plugin " + chalk.bold.greenBright(name) + " success.",
    );
  }

  private async installPlugin(name: string) {
    const cliDir = path.join(__dirname, "../../..");
    const installResult = await this.packageManagerService.add(
      name,
      undefined,
      cliDir,
    );
    return installResult.status == 0;
  }

  private async installBaseOn(name: string) {
    const plugins = await this.pluginService.get();
    const plugin = plugins.filter((p) => p.package == name)[0];
    if (!plugin) return false;

    const baseOn = Array.isArray(plugin.config.baseOn)
      ? plugin.config.baseOn
      : [plugin.config.baseOn];
    for (const pkg in baseOn) {
      await this.installPlugin(pkg);
    }
  }
}
