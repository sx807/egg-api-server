'use strict';

const Controller = require('egg').Controller;


class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = {
      page: 'hi, egg',
      result: await ctx.service.test.show(),
    };
  }
}

module.exports = HomeController;
