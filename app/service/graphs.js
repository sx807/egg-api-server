'use strict';

const Service = require('egg').Service;
const path = require("path")

class GraphService extends Service {
  constructor(ctx) {
    super(ctx);
    this.table = {
      fd : 'test',
      so : 'test'
      // s : 'linux_' + String(params.version) + '_R_x86_64_SLIST'
    }
  }

  async show(params) {
    const result = await this.request(`/graph/${params.id}`, {
      data: {
        mdrender: params.mdrender,
        accesstoken: params.accesstoken,
      },
    });
    this.checkSuccess(result);

    return result.data.data;
  }

  async list(params) {
    // api/v1/graph  -list()
    // linux_4-15-18_R_x86_64_SLIST
    const { ctx } = this;
    ctx.table.fd = 'linux_' + params.version + '_R_x86_64_FDLIST';
    const result = path.normalize(params.source)

    // const result = await this.app.mysql.select(ctx.table.fd);
    return { result };
  }

}

module.exports = GraphService;

