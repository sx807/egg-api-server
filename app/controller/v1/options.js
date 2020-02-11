'use strict';

const Controller = require('egg').Controller;

class OptionController extends Controller {
  constructor(ctx) {
    super(ctx);
  }

    async index() {
        const { ctx } = this;
        
        ctx.body = await ctx.service.options.index();
    }

    async show() {
        const { ctx } = this;

        ctx.body = await ctx.service.options.show({
            id: ctx.params.id
        });
    }

}
module.exports = OptionController;