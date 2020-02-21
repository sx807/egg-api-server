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
    // this.t1 = new Date().getTime();
    // this.t2 = this.t1
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

    let test = await this.paths(params)
    
    this.nodes(test)
    
    await this.edges_async(test)
    
    return this.data
  }

  async nodes(list){
    for (let item of list){
      if (item.id != '') {
        this.data.nodes.push(item)
      }
      // data.nodes.push(tmp)
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

  async edges_async(list){
    const _s = this
    let promises = []
    for (let sou of list){
      for (let tar of list){
        if(sou.id != tar.id){
          promises.push(new Promise(async function(resolve, reject) {
            await _s.edge(sou,tar)
            resolve()
          }))
        }
      }
    }
    // console.log(promises.length)
    await Promise.all(promises);
  }

  async edge(sou,tar){
    // console.log(sou,tar)
    let s = sou.id
    let t = tar.id
    if(s.indexOf('.') < 0){
      s = s + '/'
    }
    let sql_res = await this.service.sqls.get_edge_num(this.table.so,s.slice(1),t.slice(1))
    let val = JSON.parse(JSON.stringify(sql_res))[0]['sum(count)']
    if (Number(val)>0){
      // console.log(val)
      let tmp = {
        source: sou.id,
        target: tar.id,
        sourceWeight: val,
        type: tar.type
        // groupId: 'test'
      }
      this.data.edges.push(tmp)
      // data.edges.push(tmp)
    }
    // console.log(t)
  }

  async tojson(){

  }

  async paths(p){
    let res = []
    if (p.source == '/' && p.target == '/'){
      res = await this.path(p.source,2)
    }
    else {
      res = res.concat(await this.path(p.source,0),await this.path(p.target,1))
    }
    res = await this.unique_obj(res)
    
    res = res.filter(item => !(this.isrootpath(p.source,item.id) || this.isrootpath(p.target,item.id)))
    // console.log(res)
    return res
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
    // const path_input = str
    // console.log(path.parse(path_input))
    let path_per = path.parse(path_input).dir
    let res = []
    
    if (path.parse(path_input).ext != '') {
      // .x file
      // console.log('1 ' + path_input)
      let list = await this.service.sqls.get_fun_list(this.table.fd,'f_dfile, f_name', path_input.slice(1))
      for (let item of list) {
        let p = '/' + item.f_dfile + '/' + item.f_name
        res.push({id:p,type:type})
      }
      // need per path
      res = res.concat(await this.path(path_per,2))
    } else {
      // /x dir
      // console.log('2 ' + path_input)
      // t.push(path.parse(path_in).dir)
      let list = await this.service.sqls.get_path_list(this.table.fd,'f_dfile')
      for (let item of list){
        let p = '/' + item.f_dfile
        if (path_input != '/' && p.indexOf(path_input) == 0){
          // x/...
          if(p.slice(path_input.length + 1).indexOf('/') > 1){
            p = p.slice(0,p.indexOf('/',path_input.length + 1))
            // console.log(p)
          }
          // console.log('2.1 ' + p)
          res.push({id:p,type:type})
        }
        else if (p.indexOf(path_per) == 0){
          p = p.slice(0,p.indexOf('/',path_per.length + 1))
          // console.log('2.2 ' + p)
          //fix
          res.push({id:p,type:2})
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

