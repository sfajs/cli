import { Inject } from "@halsp/inject";
import path from "path";
import { DepsService } from "./deps.service";
import { Command } from "commander";
import { createDirname } from "../utils/shims";

const __dirname = createDirname(import.meta.url);

type PluginHook = (command: Command) => void;
interface PluginConfig {
  register: PluginHook;
  baseOn: string | string[];
}

export class PluginService {
  @Inject
  private readonly depsService!: DepsService;

  public async get() {
    const pkgPath = path.join(__dirname, "../..");
    const localList = (
      await this.depsService.getPlugins<PluginConfig>("halspCliPlugin", pkgPath)
    ).map((item) => ({
      ...item,
      cwd: false,
    }));
    const currentList = (
      await this.depsService.getPlugins<PluginConfig>(
        "halspCliPlugin",
        undefined,
      )
    ).map((item) => ({
      ...item,
      cwd: true,
    }));

    return [...localList, ...currentList]
      .map((item) => ({
        package: item.package,
        cwd: item.cwd,
        config: item.interface,
      }))
      .reduce<
        {
          package: string;
          config: PluginConfig;
          cwd: boolean;
        }[]
      >((pre, cur) => {
        if (!pre.filter((p) => p.package == cur.package).length) {
          pre.push(cur);
        }
        return pre;
      }, []);
  }
}

export function getPluginsWithOut() {
  const service = new PluginService();
  Object.defineProperty(service, "depsService", {
    value: new DepsService(),
  });
  return service.get();
}
