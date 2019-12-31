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
    this.node = {
      id: '',
      path: '',
      group: '',
      value: 1
    }
    this.edge = {
      source: '',
      target: '',
      sourceWeight: 1,
      targetWeight: 1,
      group: ''
    }
    this.nodes = {}
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
    // const test = this.get_list(this.table.fd,'f_dfile')
    let test = this.paths(params)
    return test
  }

  async paths(p){
    let t = []
    t.push(await this.path(p.source))
    t.push(await this.path(p.target))
    // let sou = {}
    // sou[path.normalize(p.source)] = {}
    // sou[path.normalize(p.target)] = {}
    
    // sou[path.parse(p.source).dir + '/'] = {}
    // sou[path.parse(p.target).dir + '/'] = {}
    return t
  }
  async path(str){
    const path_in = path.normalize(str)
    let t = new Array(path_in)
    let res = []
    
    // add per path - fix-001
    if (path_in.indexOf(".") > 0) {
      // .x file
      console.log('1 ' + path_in)
    }
    else {
      // /x dir
      console.log('2 ' + path_in)
      t.push(path.parse(path_in).dir)
      let list = await this.get_list(this.table.fd,'f_dfile')
      for (let item of list){
        let p = item.f_dfile
        if (p.indexOf(path_in) == 0){
          // x/...
          if(p.slice(path_in.length).indexOf('/') > 1){
            // console.log(p.slice(str.length))
            p = p.slice(0,p.indexOf('/',path_in.length))
            // console.log(p)
          }
          res.push(p)
        }
        else if (p.indexOf(path.parse(path_in).dir) == 0){
          p = p.slice(0,p.indexOf('/'))
          //fix
          res.push(p)
        }
      }
    }
    // else {
    //   // / root
    //   console.log('3 ' + str)

    // }
    const result = await this.unique(res)
    console.log(t)
    // console.log(result)
    return result
  }

  async unique (arr) {
    return Array.from(new Set(arr))
  }

  async per_path(p){
    return path.parse(p).dir + '/'
  }

  async get_list(table,list){
    const sql = `select ${list} from \`${table}\` group by ${list} order by ${list} desc;`
    const flist = await this.app.mysql.query(sql);
    return flist
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

