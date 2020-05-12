'use strict';

const Service = require('egg').Service
const path = require("path")

class FunctionService extends Service {
  constructor(ctx) {
    super(ctx)
    this.table = {
      fd : '',
      so : '',
      s : ''
      // s : 'linux_' + String(params.version) + '_R_x86_64_SLIST'
    }
    this.options = {
      per: true,
      group: true
    }
    this.data = {
      info: {},
      list: []
    }
  }

  async show(params) {
    const { ctx } = this;
    console.log(params)
    this.set_sql_table(params.version, params.platform)
    const sql = await this.service.sqls.get_fun(this.table.fd, params.id, params.file)
    return sql[0]
  }

  async test(params) {
    // api/v1/graph  -list()
    // linux_4-15-18_R_x86_64_SLIST
    const { ctx } = this;
    let list = []
    const start = Date.now()
    let log = 'testlog-service'
    const id = params.version + ' ' + params.platform + ' ' + params.source + ' ' + params.target
    this.set_sql_table(params.version, params.platform)

    list = await this.get_call_list(params)
    list = await this.get_fun_info(list)
    list = await this.get_call_info(list)

    this.data.id = id
    this.data.list = list

    log = log + String(Date.now() - start)
    ctx.logger.info(log)
    return this.data
  }

  has_history(id) {
    console.log(Object.keys(history))
    // console.log(history.hasOwnProperty(id))
    if (history.hasOwnProperty(id))return true
    return false
  }

  get_history(id) {
    return history[id]
  }

  async seach_history(id, nodeID) {
    let tmp = {
      sou: [],
      tar: []
    }
    let edges = this.get_history(id).data.edges
    // console.log(edges)
    // console.log(nodeID)
    for (let edge of edges) {
      if (edge.source == nodeID) {
        // console.log(edge)
        tmp.tar.push({
          id: edge.target,
          type: edge.type
        })
      }
      if (edge.target == nodeID) {
        // console.log(edge)
        tmp.sou.push({
          id: edge.source,
          type: edge.type
        })
      }
    }
    return tmp
  }

  async save_history(data) {
    // console.log(Object.keys(history))
    history[data.id] = {}
    history[data.id].data = data
  }

  async set_sql_table(ver, plat) {
    this.table.fd = 'linux_' + ver + '_R_' + plat + '_FDLIST';
    this.table.so = 'linux_' + ver + '_R_' + plat + '_SOLIST';
    this.table.s = 'linux_' + ver + '_R_' + plat + '_SLIST';
  }

  async set_options(set) {
    const keys = Object.keys(set)
    for (let key of keys) {
      if(this.options.hasOwnProperty(key)) {
        this.options[key] = JSON.parse(set[key])
      }
    }
  }

  async get_call_list(val) {
    let res = []
    if (val.source == '/' || val.target == '/') {
      return []
    }
    else {
      // console.log('val', val.source)
      let sou = val.source.slice(1)
      let tar = val.target.slice(1)
      // console.log(sou, tar, path.parse(sou), sou.indexOf('.'))
      if (sou.indexOf('.') < 0 ){
        // /xx
        sou = sou + '%.%/%'
      }
      else if (path.parse(sou).ext !== ''){
        // /xx/xx.x
        sou = sou + '/%'
      }
      let sql = await this.service.sqls.get_tar_fun(this.table.so, sou, tar)
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
        }
        res.push(tmp)
      }
    }
    return res
  }

  async get_fun_info(list) {
    if (list.length > 0) {
      for (let call of list) {
        // console.log('call', call)
        let sql = await this.service.sqls.get_fun(this.table.fd, call.s_fun, call.s_file)
        // console.log('sql1', sql)
        call.s_line = sql[0].f_dline
        call.s_id = sql[0].f_id
        sql = await this.service.sqls.get_fun(this.table.fd, call.t_fun, call.t_file)
        // console.log('sql2', sql)
        call.t_line = sql[0].f_dline
        call.t_id = sql[0].f_id
        // console.log(call)
      }
    }
    return list
  }

  async get_call_info(list) {
    if (list.length > 0) {
      for (let call of list) {
        let sql = await this.service.sqls.get_call_by_id(this.table.s, call.s_id, call.t_id)
        for (let item of sql) {
          call.call_line.push(item.cd_line)
        }
      }
    }
    return list
  }

  async edges_async(sou_list, tar_list){
    const _t = this
    let promises = []
    for (let sou of sou_list){
      for (let tar of tar_list){
        if(sou.id != tar.id){
          promises.push(new Promise(async function(resolve, reject) {
            await _t.edge(sou,tar)
            resolve()
          }))
        }
      }
    }
    // console.log(promises.length)
    await Promise.all(promises);
  }

  isrootpath(path,root){
    let res = false
    if(path != '/'  && path.indexOf(root) == 0){
      res = true
    }
    return res
  }

  async path(str,type){
    const path_input = path.normalize(str)

    let path_per = path.parse(path_input).dir
    let res = []
    
    if (path.parse(path_input).ext != '') {
      // .x file
      // console.log('1 ' + path_input)
      let list = await this.service.sqls.get_fun_list(this.table.fd,'f_dfile, f_name', path_input.slice(1))
      for (let item of list) {
        let tmp = {}
        tmp.id = '/' + item.f_dfile + '/' + item.f_name,
        tmp.type = type,
        // tmp.groupId = path.parse(tmp.id).dir
        // this.group(tmp.groupId)
        // let p = '/' + item.f_dfile + '/' + item.f_name
        
        res.push(tmp)
      }
      //per path
      if(this.options.per){
        res = res.concat(await this.path(path_per,2))
      }

    } else {
      // /x dir
      // console.log('2 ' + path_input)
      // t.push(path.parse(path_in).dir)
      let list = await this.service.sqls.get_path_list(this.table.fd,'f_dfile')
      for (let item of list){
        let p = '/' + item.f_dfile
        let tmp = {}
        if (path_input != '/' && p.indexOf(path_input) == 0){
          // x/...
          if(p.slice(path_input.length + 1).indexOf('/') > 1){
            p = p.slice(0,p.indexOf('/',path_input.length + 1))
            // console.log(p)
          }
          tmp.id = p
          tmp.type = type
          // tmp.groupId = path.parse(tmp.id).dir
          // console.log('2.1 ' + p)

        }
        else if (p.indexOf(path_per) == 0 && this.options.per){

          tmp.id = p.slice(0,p.indexOf('/',path_per.length + 1))
          tmp.type = 2
          // console.log(path.parse(tmp.id))
          // tmp.groupId = path.parse(tmp.id).dir
          // console.log('2.2 ' + p)
        }

        if(Object.keys(tmp).length > 0 && res.findIndex((item) => item.id === tmp.id) < 0){
          // this.group(tmp.groupId)
          res.push(tmp)
        }
      }
    }

    const result = await this.unique_obj(res)
    // console.log(res)
    // console.log(result)
    return result
  }

  async unique (arr) {
    return Array.from(new Set(arr))
  }

   async unique_obj (arr) {
    let obj ={}
    return arr.reduce((cur,next) => {
      obj[next.id] ? "" : obj[next.id] = true && cur.push(next);
      return cur;
    },[])
  }

  async per_path(p){
    return path.parse(path.normalize(p)).dir + '/'
  }

}

module.exports = FunctionService;

