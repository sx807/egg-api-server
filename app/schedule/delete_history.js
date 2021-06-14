const Subscription = require('egg').Subscription;

class DeleteHistory extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      // interval: '1m',
      cron: '0 0 23 * * *', 
      type: 'worker', // 指定所有的 worker 都需要执行
    }
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const days = 1
    let now = Math.floor(Date.now()/1000)
    console.log('delete history befor', now)
    this.service.sqls.del_history(now - days * 24 * 60 * 60)
  }
}

module.exports = DeleteHistory;