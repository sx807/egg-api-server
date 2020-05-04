'use strict';

const Controller = require('egg').Controller;

class GraphController extends Controller {
  constructor(ctx) {
    super(ctx);

    this.createRule = {
      version: 'string',
      platform: 'string',
      source: 'string',
      target: 'string'
    };
  }

  async show() {
    const { ctx } = this;

    ctx.body = await ctx.service.graphs.show({
      id: ctx.params.id
    });
  }

  async index() {
    const { ctx } = this;

    ctx.validate({
      version: 'string',
      platform: 'string',
      source: 'string',
      target: 'string',
    }, ctx.query);
    
    ctx.body = await ctx.service.graphs.test(ctx.query);
  }

  async create() {
    const { ctx } = this;
    // ctx.validate(this.createRule);

    const key = await ctx.service.graphs.create(ctx.request.body);
    ctx.body = {
      share_key: key,
    };
    ctx.status = 201;
  }
}

module.exports = GraphController;
