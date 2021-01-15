'use strict';

const Service = require('egg').Service;
const path = require("path");

class FunctionService extends Service {
  constructor(ctx) {
    super(ctx);
    this.table = {
      fd : '',
      so : '',
      s : ''
      // s : 'linux_' + String(params.version) + '_R_x86_64_SLIST'
    };
    this.data = {
      id: '',
      list: []
    };
    this.history_type = 2;
  }

  async show(params) {
    const { ctx } = this;
    console.log(params);
    this.set_sql_table(params.version, params.platform);
    const sql = await this.service.sqls.get_fun(this.table.fd, params.id, params.file);
    return sql[0];
  }

  async test(params) {
    // api/v1/graph  -list()
    // linux_4-15-18_R_x86_64_SLIST
    let list = [];
    const start = Date.now();
    let log = 'testlog-service';
    const id = params.version + ' ' + params.platform + ' ' + params.source + ' ' + params.target;
    
    if(await this.service.history.has_history(id, this.history_type)){
      this.logger.info(id + ' fun has history')
      const res = await this.service.history.get_history(id,this.history_type)
      return res.data
    }
    
    this.set_sql_table(params.version, params.platform);

    list = await this.get_call_list(params);
    list = await this.get_fun_info(list);
    list = await this.get_call_info(list);

    this.data.id = id;
    this.data.list = list;

    this.service.history.save_history(this.history_type, this.data)

    log = log + String(Date.now() - start);
    this.logger.info(log);
    return this.data;
  }

  async set_sql_table(ver, plat) {
    this.table.fd = 'linux_' + ver + '_R_' + plat + '_FDLIST';
    this.table.so = 'linux_' + ver + '_R_' + plat + '_SOLIST';
    this.table.s = 'linux_' + ver + '_R_' + plat + '_SLIST';
  }

  async get_call_list(val) {
    let res = [];
    if (val.source == '/' || val.target == '/') {
      return [];
    }
    else {
      // console.log('val', val.source)
      let sou = val.source.slice(1);
      let tar = val.target.slice(1);
      // console.log(sou, tar, path.parse(sou), sou.indexOf('.'))
      if (sou.indexOf('.') < 0 ){
        // /xx
        sou = sou + '%.%/%';
      }
      else if (path.parse(sou).ext !== ''){
        // /xx/xx.x
        sou = sou + '/%';
      }
      let sql = await this.service.sqls.get_tar_fun(this.table.so, sou, tar);
      for (let item of sql) {
        // {
        //   F_path: 'xx/xx.c/xx',
        //   C_path: 'xx/xx.c/xx',
        //   COUNT: 1
        // }
        // console.log(item, path.parse(item.F_path))
        let tmp = {
          s_fun: path.parse(item.F_path).base,
          s_file: path.parse(item.F_path).dir,
          t_fun: path.parse(item.C_path).base,
          t_file: path.parse(item.C_path).dir,
          num: item.COUNT,
          call_line: []
        };
        res.push(tmp);
      }
    }
    return res;
  }

  async get_fun_info(list) {
    if (list.length > 0) {
      for (let call of list) {
        // console.log('call', call)
        let sql = await this.service.sqls.get_fun(this.table.fd, call.s_fun, call.s_file);
        // console.log('sql1', sql)
        call.s_line = sql[0].f_dline;
        call.s_id = sql[0].f_id;
        sql = await this.service.sqls.get_fun(this.table.fd, call.t_fun, call.t_file);
        // console.log('sql2', sql)
        call.t_line = sql[0].f_dline;
        call.t_id = sql[0].f_id;
        // console.log(call)
      }
    }
    return list;
  }

  async get_call_info(list) {
    if (list.length > 0) {
      for (let call of list) {
        let sql = await this.service.sqls.get_call_by_id(this.table.s, call.s_id, call.t_id);
        for (let item of sql) {
          call.call_line.push(item.cd_line);
        }
      }
    }
    return list;
  }

}

module.exports = FunctionService;

