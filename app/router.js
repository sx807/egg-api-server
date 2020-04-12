'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);

  router.resources('topics', '/api/v1/topics', controller.v1.topics);

  router.resources('graphs', '/api/v1/graphs', controller.v1.graphs);

  router.resources('functions', '/api/v1/functions', controller.v1.functions);

  router.resources('options', '/api/v1/options', controller.v1.options);

  router.post('/api/user/login', controller.v1.options.login);

  router.get('/api/user/info', controller.v1.options.info);

};
