'use strict';

const Service = require('egg').Service;

class OptionService extends Service {
  constructor(ctx) {
    super(ctx);
  }

  async index(){
    // get kern list
    const list = [{
      value: '4-15-18',
      label: '4.15.18'
    }];
    return list;
  }

  async show(params) {
    // get path list
    const table = 'linux_' + params.id + '_R_x86_64_SOLIST'
    const list = await this.ctx.service.sqls.get_path_list(table,'f_path')
    let res = []
    for (let item of list){
      let p = '/' + item.f_path
      if(p.indexOf('.') < 0){
        p = p.slice(0,p.lastIndexOf('/'))
      }
      res.push({
        value: p
        // label: p
      })
    }
    return res
  }
}
 
module.exports = OptionService;