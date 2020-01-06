'use strict';

const Service = require('egg').Service
const path = require("path")

let data = {
  nodes:[],
  edges:[]
}

class GraphService extends Service {
  constructor(ctx) {
    super(ctx)
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
    // this.edge = {
    //   source: '',
    //   target: '',
    //   sourceWeight: 1,
    //   targetWeight: 1,
    //   group: ''
    // }
    this.data = {
      nodes:[],
      edges:[]
    }
    this.t1 = new Date().getTime();
    this.t2 = this.t1
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

  async test(params) {
    // api/v1/graph  -list()
    // linux_4-15-18_R_x86_64_SLIST
    const { ctx } = this;
    this.table.fd = 'linux_' + params.version + '_R_x86_64_FDLIST';
    this.table.so = 'linux_' + params.version + '_R_x86_64_SOLIST';
    // const result = path.parse(params.source)
    // let t1 = new Date().getTime();
    // let t2 = t1
    this.t1 = process.uptime()
    // const result = await this.app.mysql.select(this.table.fd);
    // return { result };
    // const test = this.get_list(this.table.fd,'f_dfile')
    let test = await this.paths(params)
    
    this.nodes(test)
    this.t2 = process.uptime()
    console.log('get node time ', this.t2 - this.t1)
    
    // this.edges(test)
    await this.edges_async(test)
    
    this.t2 = process.uptime()
    console.log('get edges time ', this.t2 - this.t1)
    // this.tojson()
    // await sleep(1000)
    this.t2 = process.uptime()
    console.log('get all time ', this.t2 - this.t1)
    console.log('node',this.data.nodes.length,data.nodes.length)
    console.log('edge',this.data.edges.length, data.edges.length)
    
    return this.data
  }

  async nodes(list){
    for (let value of list){
      let tmp = {
        id:value,
        groupId:'test'
      }
      this.data.nodes.push(tmp)
      data.nodes.push(tmp)
    }
  }

  async edges(list){
    for (let sou of list){
      for (let tar of list){
        if(sou != tar){
          if (false){
            // tar /x/x.c/fun
          }
          else{
            // tar /x/x /x.c
            let s = sou
            if(sou.indexOf('.') < 0){
              s = sou + '/'
            }
            // console.log(s,tar)
            await this.edge(s,tar)
          }
        }
      }
    }
  }

  async edges_t(list){
    const _s = this
    let promises = []
    for (let sou of list){
      for (let tar of list){
        if(sou != tar){
          if (false){
            // tar /x/x.c/fun
          }
          else{
            // tar /x/x /x.c
            let s = sou
            if(sou.indexOf('.') < 0){
              s = sou + '/'
            }
            promises.push(new Promise(async function(resolve, reject) {
              await _s.edge(s,tar)
              resolve()
            }))
          }
        }
      }
    }
    // console.log(promises.length)
    await Promise.all(promises);
  }

  async edge(sou,tar){
    // console.log(sou,tar)
    let sql_res = await this.sqlget_link(this.table.so,sou.slice(1),tar.slice(1))
    let val = JSON.parse(JSON.stringify(sql_res))[0]['sum(count)']
    if (Number(val)>0){
      // console.log(val)
      let tmp = {
        source: sou,
        target: tar,
        sourceWeight: val,
        targetWeight: 1,
        group: 'test'
      }
      this.data.edges.push(tmp)
      data.edges.push(tmp)
    }
    // console.log(t)

    // this.t2 = process.uptime()
    // console.log('get edge time ', this.t2 - this.t1)
  }

  async sqlget_link(table, path1, path2){
    // SELECT SUM(COUNT) FROM `#{$sql_solist}` USE INDEX(F_path) WHERE F_path='#{$sline[i]}' AND C_path LIKE '#{$sline[j]}%'")
    const sql = `select sum(count) from \`${table}\` use index(f_path) where f_path = '${path1}' and c_path like '${path2}%';`
    const count = await this.app.mysql.query(sql);
    return count
  }

  async tojson(){

  }

  async paths(p){
    let res = []
    if (p.source == '/' && p.target == '/'){
      res = await this.path(p.source)
    }
    else {
      res = res.concat(await this.path(p.source),await this.path(p.target))
    }
    res = await this.unique(res)
    res = res.filter(item => !(this.isrootpath(p.source,item) || this.isrootpath(p.target,item)))

    // let sou = {}
    // sou[path.normalize(p.source)] = {}
    // sou[path.normalize(p.target)] = {}
    
    // sou[path.parse(p.source).dir + '/'] = {}
    // sou[path.parse(p.target).dir + '/'] = {}

    return res
  }

  isrootpath(path,root){
    let res = false
    if(path != '/'  && path.indexOf(root) == 0){
      res = true
    }
    return res
  }

  async path(str){
    const path_input = path.normalize(str)
    let path_per = path.parse(path_input).dir
    let res = []
    
    // add per path - fix-001
    if (path_input.indexOf(".") > 0) {
      // .x file
      // console.log('1 ' + path_input)
    }
    else {
      // /x dir
      // console.log('2 ' + path_input)
      // t.push(path.parse(path_in).dir)
      let list = await this.get_list(this.table.fd,'f_dfile')
      for (let item of list){
        let p = '/' + item.f_dfile
        if (path_input != '/' && p.indexOf(path_input) == 0){
          // x/...
          if(p.slice(path_input.length + 1).indexOf('/') > 1){
            p = p.slice(0,p.indexOf('/',path_input.length + 1))
            // console.log(p)
          }
          // console.log('2.1 ' + p)
          res.push(p)
        }
        else if (p.indexOf(path_per) == 0){
          p = p.slice(0,p.indexOf('/',path_per.length + 1))
          // console.log('2.2 ' + p)
          //fix
          res.push(p)
        }
      }
    }

    const result = await this.unique(res)
    // console.log(res)
    // console.log(result)
    return result
  }

  async unique (arr) {
    return Array.from(new Set(arr))
  }

  async per_path(p){
    return path.parse(path.normalize(p)).dir + '/'
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

