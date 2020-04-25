'use strict';

const Service = require('egg').Service
const path = require("path")
const crypto = require('crypto')

const history = {}
const share_data = {}

class GraphService extends Service {
  constructor(ctx) {
    super(ctx)
    this.table = {
      fd : 'test',
      so : 'test'
      // s : 'linux_' + String(params.version) + '_R_x86_64_SLIST'
    }
    this.options = {
      per: true,
      group: true,
      expanded: ''
    }
    this.data = {
      id: '',
      nodes: [],
      edges: []
      // groups:[]
    }
    // this.t1 = new Date().getTime();
    // this.t2 = this.t1
  }

  async show(params) {
    // const result = {}
    console.log(params)
    console.log(Object.keys(share_data))
    // console.log(share_data.data)
    if (share_data.hasOwnProperty(params.id)) {
      // result.config = share_data[params.id].config
      // resule.graph = {
      //   nodes: share_data[params.id].data.nodes,
      //   edges: share_data[params.id].data.edges
      // }
      return share_data[params.id]
    }
    return {}
  }

  async test(params) {
    // api/v1/graph  -list()
    // linux_4-15-18_R_x86_64_SLIST
    const { ctx } = this;

    this.table.fd = 'linux_' + params.version + '_R_x86_64_FDLIST';
    this.table.so = 'linux_' + params.version + '_R_x86_64_SOLIST';
    const id = params.version + ' ' + params.source + ' ' + params.target
    if(params.expand) {
      await this.expands_data(params)
    } else {
      if (this.is_history(id)) {
        ctx.logger.info(id + ' has history')
        return this.get_history(id).data
      }
      await this.normal_data(params)
    }
    
    return this.data
  }

  async create(params) {
    // console.log(params.data.nodes)
    const md5 = crypto.createHash('md5')
    const id = params.config.version + ' ' + params.config.source + ' ' + params.config.target
    const share_kay = md5.update(id).digest('hex')
    share_data[share_kay] = {
      id: id,
      config: params.config,
      data: params.data
    }
    return share_kay;
  }

  async expand_data(config) {
    const { ctx } = this;
    const start = Date.now()

    let list = []
    let log = 'testlog-service'
    // console.log('expand')
    let expanded = []
    const id = config.id
    this.data.id = id
    const nodeid = config.expand
    log = log + ' expand ' + nodeid
    // console.log(config)
    await this.setoptions(config)
    await this.setoptions({ per: false })
    if(this.options.expanded !== '') expanded = this.options.expanded.split(',')

    list = await this.path(nodeid,3)
    this.nodes(list)
    const connect_node = await this.seach_history(id, nodeid, expanded)
    log = log + ' nodes:' + this.data.nodes.length + ' ' + String(Date.now() - start)

    // console.log(connect_node)
    await this.edges_async(list, connect_node.tar)
    await this.edges_async(connect_node.sou, list)
    log = log + ' edges:' + this.data.edges.length + ' ' + String(Date.now() - start)

    ctx.logger.info(log)
  }

  async normal_data(config) {
    const { ctx } = this;
    const start = Date.now()

    let list = []
    let log = 'testlog-service'
    // console.log(config)
    const id = config.version + ' ' + config.source + ' ' + config.target
    
    this.data.id = id
    await this.setoptions(config)
    // console.log(this.options)

    list = await this.paths(config)
    this.nodes(list)
    log = log + ' nodes:' + this.data.nodes.length + ' ' + String(Date.now() - start)

    await this.edges_async(list, list)
    log = log + ' edges:' + this.data.edges.length + ' ' + String(Date.now() - start)

    if(this.options.per) this.save_history(this.data)

    ctx.logger.info(log)
    return this.data
  }

  async expands_data(config) {
    const { ctx } = this;
    const start = Date.now()

    let list = []
    let log = 'testlog-service'
    // console.log('expand')
    let expanded = []
    const id = config.id
    this.data.id = id
    const nodeid = config.expand
    log = log + ' expand ' + nodeid
    // console.log(config)
    await this.setoptions(config)
    await this.setoptions({ per: false })
    if(this.options.expanded !== '') expanded = this.options.expanded.split(',')

    list = await this.path(nodeid,3)
    this.nodes(list)
    const connect_node = await this.seach_history(id, nodeid, expanded)
    log = log + ' nodes:' + this.data.nodes.length + ' ' + String(Date.now() - start)

    // console.log(connect_node)
    await this.edges_async(list, connect_node.tar)
    await this.edges_async(connect_node.sou, list)
    log = log + ' edges:' + this.data.edges.length + ' ' + String(Date.now() - start)

    ctx.logger.info(log)
    this.add_history_expanded(id,nodeid,this.data.nodes)
  }

  is_history(id) {
    console.log(Object.keys(history))
    // console.log(history.hasOwnProperty(id))
    if (history.hasOwnProperty(id))return true
    return false
  }

  get_history(id) {
    // console.log(history[id].data.nodes.length)
    return history[id]
  }

  async seach_history(id, nodeID, expanded) {
    let tmp = {
      sou: [],
      tar: []
    }

    let history = this.get_history(id)
    // console.log(edges)
    // console.log(expanded)
    for (let edge of history.data.edges) {
      if (edge.source === nodeID) {
        // console.log(edge.source, expanded.includes(edge.source))
        if (expanded.includes(edge.target)) {
          // console.log(edge.target, expanded.includes(edge.target))
          tmp.tar = tmp.tar.concat(history.expanded[edge.target].nodes)
        } else {
          tmp.tar.push({
          id: edge.target,
          type: edge.type
        })
        }
        
      }
      if (edge.target === nodeID) {
        // console.log(edge)
        if (expanded.includes(edge.source)) {
          // console.log(edge.source, expanded.includes(edge.source))
          tmp.sou = tmp.sou.concat(history.expanded[edge.source].nodes)
        } else {
          tmp.sou.push({
          id: edge.source,
          type: edge.type
        })
        }
        
      }
    }
    // console.log(tmp)
    return tmp
  }

  async save_history(data) {
    // console.log(Object.keys(history))
    history[data.id] = {}
    history[data.id].data = data
  }

  async add_history_expanded(id,nodeid,data) {
    // console.log(id,Object.keys(history[id].expanded))
    if (!history[id].hasOwnProperty('expanded')){
      history[id].expanded = {}
    }
    console.log(id,Object.keys(history[id].expanded))
    history[id].expanded[nodeid] = {}
    history[id].expanded[nodeid].nodes = data
  }

  async setoptions(set){
    const keys = Object.keys(set)
    for (let key of keys) {
      if(this.options.hasOwnProperty(key)) {
        console.log(key,this.options[key],set[key])
        this.options[key] = JSON.parse(JSON.stringify(set[key]))
      }
    }
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

  async edges_async(sou_list, tar_list){
    const _s = this
    let promises = []
    for (let sou of sou_list){
      for (let tar of tar_list){
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
      res = res.filter(item => !(this.isrootpath(p.source,item.id) || this.isrootpath(p.target,item.id)))
    }
    else {
      let path1 = await this.path(p.source,0)
      path1 = path1.filter(item => !(this.isrootpath(p.target,item.id)))
      let path2 = await this.path(p.target,1)
      path2 = path2.filter(item => !(this.isrootpath(p.source,item.id)))
      res = res.concat(path1, path2)
    }
    res = await this.unique_obj(res)
    
    // res = res.filter(item => !(this.isrootpath(p.source,item.id) || this.isrootpath(p.target,item.id)))
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

    let path_per = path.parse(path_input).dir
    let res = []
    
    if (path.parse(path_input).ext != '') {
      // .x file
      console.log('1 ' + path_input)
      let list = await this.service.sqls.get_fun_list(this.table.fd,'f_dfile, f_name', path_input.slice(1))
      for (let item of list) {
        let tmp = {}
        tmp.id = '/' + item.f_dfile + '/' + item.f_name
        tmp.type = type
        // tmp.groupId = path.parse(tmp.id).dir
        // this.group(tmp.groupId)
        // let p = '/' + item.f_dfile + '/' + item.f_name
        
        res.push(tmp)
      }
      //per path
      if(this.options.per){
        res = res.concat(await this.path(path_per,2))
      }

    } else if (path.parse(path_per).ext === '') {
      // /x dir
      console.log('2 ' + path_input)
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
    } else {
      // /xx/xx.x/xxxx
      console.log('3 ' + path_input)
      let tmp = {}
        tmp.id = path_input
        tmp.type = type
        res.push(tmp)
    }

    const result = await this.unique_obj(res)
    // console.log(res)
    // console.log(result)
    return result
  }

  async group(id) {
    if (this.data.groups.findIndex((item) => item.id === id) < 0) {
      let tmp = {
        id: id,
        title: id
      }
      // if (this.options.per) {
      //   tmp.parentId = path.parse(id).dir
      // }
      this.data.groups.push(tmp)
    }
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

