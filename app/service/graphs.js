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
    this.table.so = 'linux_' + params.version + '_R_x86_64_SOLIST';
    // const result = path.parse(params.source)

    // const result = await this.app.mysql.select(this.table.fd);
    // return { result };
    const test = this.node(params.source)
    return test
  }

  node(path){
    const results = await this.app.mysql.select(this.table.fd, { // 搜索表
      where: { f_dfile: path+'%' }, // WHERE 条件
      columns: ['f_dfile'], // 要查询的表字段
      orders: [['created_at','desc'], ['id','desc']], // 排序方式
    });
    return results
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
      else if (i%2){
        // root[tmp[i]] = tree
        tree[tmp[i]] = root
      }
      else{
        // tree[tmp[i]] = root
        root[tmp[i]] = tree
      }
      
    }
    return root
  }

}

module.exports = GraphService;

