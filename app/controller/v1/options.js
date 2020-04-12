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

    async login() {
      const { ctx } = this;
      ctx.validate({
        username: 'string',
        password: 'string'
      });
      ctx.body = await ctx.service.options.login(ctx.request.body);

      ctx.status = 200;
    }

    async info() {
      const { ctx } = this;
      ctx.validate({
        token: 'string'
      }, ctx.query);
      ctx.body = await ctx.service.options.info(ctx.query.token);
    }
  
}
module.exports = OptionController;
