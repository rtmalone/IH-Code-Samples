var home = require('../app/controllers/home'),
    users = require('../app/controllers/users'),
    healthcheck = require('../app/controllers/health-check'),
    system = require('../app/controllers/system'),
    enterprise = require('../app/controllers/enterprise'),
    entUser = require('../app/controllers/ent-user');

module.exports = function(app){
  // APP ROUTES
  app.get('/', home.index);
  app.post('/login', users.login);
  app.post('/logout', users.logout);
  app.get('/health_check', healthcheck.health_check);

  // ORGANIZATION ROUTES
  app.get('/enterprise/:id', enterprise.show);
  app.get('/enterprise', enterprise.index);
  app.post('/enterprise/:id', enterprise.disable);
  app.post('/enterprise', enterprise.create);
  app.put('/enterprise/:id', enterprise.update);
  app.post('/enterprise/:id/add-physician', enterprise.addPhysician);
  app.post('/enterprise/:id/delete-physician', enterprise.deletePhysician);
  app.put('/enterprise/:id/update-array', enterprise.updateEntArray);

  // USER ROUTES
  app.get('/users', entUser.index);
  app.post('/users', entUser.create);
  app.get('/user/:id', entUser.show);
  app.put('/user/:id', entUser.update);
  app.post('/user/:id', entUser.delete);
  app.post('/user/resetPassword/:id', entUser.reset_password);

  // SYSTEM CONFIG ROUTES
  app.get('/tricons', system.tricons);
  app.get('/email-templates', system.email_templates);
  app.post('/email-template', system.createEmailTemplate);
  app.put('/email-template/:type', system.updateEmailTemplate);
  app.put('/system/configuration', system.update_tricons);

};
