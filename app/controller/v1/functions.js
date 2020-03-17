'use strict';

const Controller = require('egg').Controller;

class FunctionController extends Controller {
  constructor(ctx) {
    super(ctx);
  }

    async index() {
        const { ctx } = this;

        ctx.validate({
        version: 'string',
        source: 'string',
        target: 'string',
        }, ctx.query);
        
        ctx.body = await ctx.service.functions.test(ctx.query);
    }

    // async show() {
    //     const { ctx } = this;

    //     ctx.body = await ctx.service.function.show();
    // }

}
module.exports = FunctionController;