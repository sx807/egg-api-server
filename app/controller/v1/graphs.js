'use strict';

const Controller = require('egg').Controller;

class GraphController extends Controller {
  constructor(ctx) {
    super(ctx);

    this.createRule = {
      version: 'string',
      source: 'string',
      target: 'string'
    };
  }

  // async show() {
  //   const { ctx } = this;

  //   ctx.body = await ctx.service.graphs.show({
  //     id: ctx.params.id,
  //     mdrender: ctx.query.mdrender !== 'false',
  //     accesstoken: ctx.query.accesstoken || '',
  //   });
  // }

  async index() {
    const { ctx } = this;

    ctx.validate({
      version: 'string',
      source: 'string',
      target: 'string',
    }, ctx.query);
    
    ctx.body = await ctx.service.graphs.test(ctx.query);
  }

  async create() {
    const { ctx } = this;
    // ctx.validate(this.createRule);

    const id = await ctx.service.graphs.create(ctx.request.body);
    ctx.body = {
      topic_id: id,
    };
    ctx.status = 201;
  }
}

module.exports = GraphController;
