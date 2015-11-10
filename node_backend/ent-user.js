(function(){
  'use strict';

  var ihplatform = require('../lib/ih-platform'),
      _config = require('../../config/config'),
      uID;

  exports.index = function(req, res){
    var rest_options = {
      resource: '/users',
      method:'GET',
      json: req.query
    };

    ihplatform(_config, req.session, rest_options, cb).execute();

    function cb(error, response, body){
      res.send(body);
    }
  };

  exports.create = function(req, res){
    var json = req.body;

    // Strip non-word characters out of phone # string for storing on platform
    var newString = json.phone_number.replace(/\W+/g,'');
    json.phone_number = newString;

    // the Platform is expecting an array of strings for roles;
    // this is setting it up in case there is one role in req.body
    if(typeof req.body.roles === 'string'){
      var rArray = [];
      rArray.push(req.body.roles);
      json.roles = rArray;
    }

    if (req.body.enabled === 'true') {
      json.enabled = true;
    } else {
      json.enabled = false;
    }

    var rest_options = {
      resource: '/users',
      method:'POST',
      json: json
    };

    ihplatform(_config, req.session, rest_options, function(error, response, body){

      if (!error && response.statusCode === 201){
        res.send(response);
      } else {
        Log.error('Platform call FAILED => Status: ' + response.statusCode + ' : ' + body);
        res.send(response);
      }

    }).execute();
  };

  exports.show = function(req, res){
    var partial = req.query.partial;
    uID = req.params.id;

    var rest_options = {
      resource: '/user/'+uID,
      method: 'GET'
    };

    ihplatform(_config, req.session, rest_options, function(error, response, body){
      var entUser = JSON.parse(body);

      if(!error && response.statusCode === 200){
        if(partial || req.header('X-PJAX')){
          res.render('users/user-show', {title: 'Organizations', entUser:entUser});
        } else {
          res.render('users/user-show-container', {title: 'Organizations', entUser:entUser});
        }
      } else {
        req.flash('errors', { msg:body, code:response.statusCode });
        Log.error('Platform SHOW call FAILED => Status: ' + response.statusCode + ' : ' + body);
        res.send(response);
      }

    }).execute();
  };

  exports.update = function(req, res){
    var json = req.body;

    if(json.notify_on_events === 'none'){
      json.notify_on_events = [];
    }

    if(json.phone_number){
      // Strip non-word characters out of phone # string for storing on platform
      var newString = json.phone_number.replace(/\W+/g,'');
      json.phone_number = newString;
    }

    var rest_options = {
      resource: '/user/'+req.params.id,
      method: 'PUT',
      json: json
    };

    ihplatform(_config, req.session, rest_options, function(error, response, body){

      if(!error && response.statusCode === 202){
        Log.info('Platform UPDATE call Success => Status: ' + response.statusCode + ' : ' + body);
        res.send(response);
      } else {
        Log.error('Platform UPDATE call FAILED => Status: ' + response.statusCode + ' : ' + body);
        res.send(response);
      }

    }).execute();
  };

  exports.delete = function(req, res){
    var eID = req.body; // jshint ignore: line
    var rest_options = {
      resource: '/user/'+req.params.id,
      method: 'DELETE'
    };

    ihplatform(_config, req.session, rest_options, function(error, response, body){

      if(!error && response.statusCode === 204){
        req.flash('success', { msg:'The user was successfully disabled', code:response.statusCode });
        res.redirect('/enterprise');
      } else {
        req.flash('errors', { msg:body, code:response.statusCode });
        Log.error('Platform DISABLE call FAILED => Status: ' + response.statusCode + ' : ' + body);
        res.redirect('/enterprise');
      }

    }).execute();
  };

  exports.reset_password = function (req, res){
    var userID = req.params.id;

    var rest_options = {
      resource: '/user/'+userID+'/password?email_workflow=true',
      method: 'POST',
    };

    ihplatform(_config, req.session, rest_options, function(error, response, body){

      if(!error && response.statusCode === 202){
        Log.info('Platform POST call Success => Status: ' + response.statusCode + ' : ' + body);
        res.send(response);
      } else {
        Log.error('Platform POST call FAILED => Status: ' + response.statusCode + ' : ' + body);
        res.send(response);
      }
    }).execute();
  };

})();
