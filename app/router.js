'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);

  router.resources('topics', '/api/v1/topics', controller.v1.topics);

  router.resources('graphs', '/api/v1/graphs', controller.v1.graphs);

};
