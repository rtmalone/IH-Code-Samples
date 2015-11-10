var ihplatform = require('../lib/ih-platform'),
    _config = require('../../config/config'),
    utilities = require('../lib/utilities');


exports.tricons = function(req, res){
  var partial = req.query.partial,
      rest_options = {
        resource: '/system/configuration',
        method: 'GET'
      };

  ihplatform(_config, req.session, rest_options, function(error, response, body){
    var tricons = JSON.parse(body);

    if(!error && !utilities.httpError(response.statusCode)){
      if (partial || req.header('X-PJAX')){
        res.render('system/sys-tricons', {title:'System Tricons', system:tricons});
      } else {
        res.render('system/sys-tricons-container', {title:'System Tricons', system:tricons});
      }
    } else {
      Log.error('Platform GET call FAILED => Status: ' + response.statusCode + ' : ' + body);
    }

  }).execute();

};

exports.update_tricons = function(req, res){
  var rest_options = {
    resource: '/system/configuration',
    method: 'PUT',
    json: JSON.parse(req.body.sysConfig)
  };

  ihplatform(_config, req.session, rest_options, function(error, response, body){

    if(!error && !utilities.httpError(response.statusCode)){
      req.flash('success', {msg: 'Saved successfully.'});
      res.redirect('/tricons');
    } else {
      req.flash('errors', {msg: body, code: response.statusCode});
      res.redirect('/tricons');
      Log.error('Platform PUT TRICON call FAILED => Status: ' + response.statusCode + ' : ' + body);
    }

  }).execute();

};

exports.email_templates = function(req, res) {
  var partial = req.query.partial,
      rest_options = {
        resource: '/system/configuration',
        method:'GET'
      };

  ihplatform(_config, req.session, rest_options, function(error, response, body){
    var json = JSON.parse(body);

    if(!error && !utilities.httpError(response.statusCode)){
      if (partial || req.header('X-PJAX')){
        res.render('system/email-templates', {title:'System Emails', templates:json.email_templates});
      } else {
        res.render('system/email-templates-container', {title:'System Emails', templates:json.email_templates});
      }
    }
  }).execute();
};

exports.createEmailTemplate = function (req, res) {

  // expiration_window is not needed for Welcome template
  if (req.body.template_type === 'Welcome') {
    req.body.expiration_window = null;
  }

  var rest_options = {
    resource: '/system/configuration/emailtemplate',
    method: 'POST',
    json: req.body
  };

  ihplatform(_config, req.session, rest_options, function(error, response, body){

    if(!error && !utilities.httpError(response.statusCode)){

      req.flash('success', {msg: req.params.type + ' template has been created.'});
      res.redirect('/email-templates');

    } else {

      req.flash('errors', {msg: body, code: response.statusCode});
      res.redirect('/email-templates');

    }
  }).execute();
};

exports.updateEmailTemplate = function(req, res) {

  if (req.body.template_type === 'Welcome') {
    req.body['expiration_window'] = null; // jshint ignore:line
  }

  var rest_options = {
    resource: '/system/configuration/emailtemplate/' + req.params.type,
    method: 'PUT',
    json: req.body
  };

  ihplatform(_config, req.session, rest_options, function(error, response, body){
    if (!error && !utilities.httpError(response.statusCode)) {

      req.flash('success', {msg: req.params.type + ' has been updated'});
      res.redirect('/email-templates');

    } else {

      req.flash('errors', {msg: body, code: response.statusCode});
      res.redirect('/email-templates');

    }
  }).execute();
};
