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
        platform: 'string',
        source: 'string',
        target: 'string',
        }, ctx.query);
        
        ctx.body = await ctx.service.functions.test(ctx.query);
    }

    async show() {
        const { ctx } = this;

        ctx.validate({
          version: 'string',
          platform: 'string',
          file: 'string'
          }, ctx.query);

        ctx.body = await ctx.service.functions.show({
          id: ctx.params.id,
          version: ctx.query.version,
          platform: ctx.query.platform,
          file: ctx.query.file
        });
    }

}
module.exports = FunctionController;