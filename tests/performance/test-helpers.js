/**
 * Artillery Test Helpers
 * Provides utility functions for performance tests
 */

const propertyIds = [
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439012',
  '507f1f77bcf86cd799439013',
  '507f1f77bcf86cd799439014',
  '507f1f77bcf86cd799439015',
];

module.exports = {
  setRandomPropertyId: (requestParams, context, ee, next) => {
    const randomId = propertyIds[Math.floor(Math.random() * propertyIds.length)];
    context.vars.randomPropertyId = randomId;
    return next();
  },

  setAuthToken: (requestParams, response, context, ee, next) => {
    if (response.body && response.body.token) {
      context.vars.authToken = response.body.token;
    }
    return next();
  },

  logResponse: (requestParams, response, context, ee, next) => {
    console.log('Response:', {
      statusCode: response.statusCode,
      duration: response.timings.phases.total,
    });
    return next();
  },
};
