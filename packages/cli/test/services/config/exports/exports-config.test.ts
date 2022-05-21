import { ConfigService } from "../../../../src/services/config.service";
import { runin } from "@sfajs/testing";
import { CliStartup } from "../../../../src/cli-startup";
import { parseInject } from "@sfajs/inject";

test(`config module.exports`, async () => {
  let worked = false;
  await runin("test/services/config/exports", async () => {
    await new CliStartup()
      .use(async (ctx) => {
        const service = await parseInject(ctx, ConfigService);
        expect(service.value["exports"]).toBe(1);
        worked = true;
      })
      .run();
  });
  expect(worked).toBeTruthy();
});