'use strict';

const Controller = require('egg').Controller;

class GraphController extends Controller {
  constructor(ctx) {
    super(ctx);

    this.createRule = {
      version: 'string',
      source: 'string',
      target: 'string',
      tab: { type: 'enum', values: [ 'ask', 'share', 'job' ], required: false }
    };
  }

  async show() {
    const { ctx } = this;

    ctx.body = await ctx.service.graphs.show({
      id: ctx.params.id,
      mdrender: ctx.query.mdrender !== 'false',
      accesstoken: ctx.query.accesstoken || '',
    });
  }

  async index() {
    const { ctx } = this;

    ctx.validate({
      version: 'string',
      source: 'string',
      target: 'string',
    }, ctx.query);

    ctx.body = await ctx.service.graphs.list(ctx.query);
  }

}

module.exports = GraphController;
