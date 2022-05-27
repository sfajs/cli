//{filter
import { HttpContext } from "@sfajs/core";
import { ActionFilter } from "@sfajs/filter";

export class GlobalActionFilter implements ActionFilter {
  onActionExecuted(ctx: HttpContext): void | Promise<void> {
    ctx.res.setHeader("excuted", 1);
  }
  onActionExecuting(
    ctx: HttpContext
  ): boolean | void | Promise<void> | Promise<boolean> {
    ctx.res.setHeader("action", 1);
    return true;
    // return false to intercept
  }
}
//}
