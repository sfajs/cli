//{ router
import { UseFilters } from "@sfajs/filter";
import { Inject } from "@sfajs/inject";
import { Header } from "@sfajs/pipe";
import { Action } from "@sfajs/router";
//{filter
import { AuthFilter } from "../filters/auth.filter";
//}
//{inject
import { UserService } from "../services/user.service";
//}

//{swagger
/**
 * @openapi
 * /user:
 *   get:
 *     tags:
 *       - user
 *     description: Get user info
 *     responses:
 *       200:
 *         description: success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/user'
 *     security:
 *       - password: []
 */
//}
//{filter
@UseFilters(AuthFilter)
//}
export default class extends Action {
  //{inject
  @Inject
  private readonly userService!: UserService;
  //}

  //{pipe
  @Header("host")
  private readonly host!: string;
  //}

  async invoke(): Promise<void> {
    //!
    {
      //{inject
      const userInfo = this.userService.getUserInfo();
      ///{ view && !mva
      await this.view("user", userInfo);
      ///}
      ///{!view || mva
      this.ok(userInfo);
      ///}
      //}
      //!
    }

    //!
    {
      //{!inject
      const userInfo = {
        id: 1,
        email: "hi@hal.wang",
      };
      ///{ view && !mva
      await this.view("user", userInfo);
      ///}
      ///{!view || mva
      this.ok(userInfo);
      ///}
      //}
      //!
    }
  }
}
//}