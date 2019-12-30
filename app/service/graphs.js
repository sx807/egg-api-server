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
    this.table.fd = 'linux_' + params.version + '_R_x86_64_FDLIST';
    const result = this.pathtojson(params.source)

    // const result = await this.app.mysql.select(ctx.table.fd);
    return { result };
  }

  pathtojson(str) {
    let tmp = str.split('/')
    // let tmp = path.parse(str);
    let root  = {}
    let tree = {}
    let t
    for (let i in tmp){
      if (i == 0) {
        t = tmp[i]
        tree[t]={}
      }
      else {
        tree[tmp[i]]={}
        tree[t] = {tree}
        t = tmp[i]
      }
      
    }

    return tree
  }
}

module.exports = GraphService;

