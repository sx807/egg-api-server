'use strict';

const Service = require('egg').Service;

class OptionService extends Service {
  constructor(ctx) {
    super(ctx);
    this.history_type = 3;
  }

  async index(){
    // get kern list
    const list = [
      {
        value: '3-5-4',
        label: '3.5.4',
        platform: [
          {
            value: 'x86_32',
            label: '32'
          }
        ]
      },
      {
        value: '4-15-18',
        label: '4.15.18',
        platform: [
          {
            value: 'x86_64',
            label: '64'
          },
          {
            value: 'x86_32',
            label: '32'
          }
        ]
      },
      {
        value: '4-16-18',
        label: '4.16.18',
        platform: [
          {
            value: 'x86_64',
            label: '64'
          },
          {
            value: 'x86_32',
            label: '32'
          }
        ]
      },
    ];
    return list;
  }

  async show(params) {
    // get path list
    const id = params.id + '_' + params.platform

    if(await this.service.history.has_history(id, this.history_type)){
      this.logger.info(id + ' option has history')
      const res = await this.service.history.get_history(id,this.history_type)
      return res.data.list
    }

    const table = 'linux_' + params.id + '_R_' + params.platform + '_SOLIST';
    const list = await this.ctx.service.sqls.get_path_list(table,'f_path');
    let res = [];
    for (let item of list){
      let p = '/' + item.f_path;
      p = p.slice(0,p.lastIndexOf('/'));
      res.push(p);
    }
    let save = {
      id: id,
      list: Array.from(new Set(res))
    }
    this.service.history.save_history(this.history_type,save)
    return save.list;
  }

  async login(params) {
    const result = {
      code: 20000,
      data:{
        token:params.username + '-token'
      }
    }

    return result;
  }

  async info(params) {
    const role = params.toString().split("-")[0];
    const result = {
      code: 20000,
      data:{
        roles:[role]
      }
    }

    return result;
  }
}
 
module.exports = OptionService;
