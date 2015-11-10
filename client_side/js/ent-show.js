(function(){
  'use strict';

  $(document).ready(initialize);

  var eID,
      params = {};

  function initialize(){
    $('form').parsley();
    eID = $('#ent-id').val();
    showUsers();
    setEditables();
    setEditablesArray();
    setAlgorithmData();
    setIntegrationData();
    $('[data-toggle="popover"]').popover();
    $('#enterpriseEnabled').on('click', updateEnt);
    $('#enterpriseComments').click(updateEnt);
    $('#enterpriseNotifications').click(updateEnt);
    $('#enterpriseAutocomplete').click(updateEnt);
    $('#authIH').click(updateEnt);
    $('#authLDAP').click(updateEnt);
    $('#faxEnabled').click(updateIntegrations);
    $('#addUserBtn').click(userFormToggle);
    $('.close-form-btn').click(closeForm);
    $('#newUserForm').submit(createUser);
    $('#addLocationBtn').click(locationFormToggle);
    $('a:contains("Add Another Location")').click(addLocationInput);
    $('body').on('click', '.delete-location', removeLocation);
    $('#newLocationForm').submit(addLocations);
    $('body').on('submit', '#addPhysician', createAndLoad);
    $('body').on('click', '.delete-phys', deletePhys);
    $('#algorithmForm input').click(algorithmCheck);
    $('#algorithmBtn').click(gatherAlgorithms);
  }

  toastr.options = Radar.toastrOptions;

  function showUsers(){
    var params = {};
    params.enterprise_id = eID;

    $.ajax({
       type: 'GET',
       url: '/users',
       dataType: 'json',
       data: params,
       success: function(response){
         $('#ent-user-table').dataTable({
           'data': response,
           'destroy': true,
           'columns': [
             {'data':'first_name'},
             {'data':'last_name'},
             {'data':'username'},
             {'data':'email'},
             {'data':'phone_number'},
             {'data':'roles'}
           ],
           'columnDefs':[{
             'width': '15%',
             'targets': 2
           },
           {
             'targets': [2],
             render: function(data, type, full, meta){return '<a href="/user/'+full.id+'" data-id="'+full.id+'"data-pjax>'+data+'</a>';}
           },
           {
             'targets': [4],
             render: function(data, type, full, meta){return '<span class="phone_us">'+data+'</span>';}
           }]
         });
       }
    });
  }

  function setEditables(){
    $('.editable').editable({
      success: function(response, newValue){
        updateSuccess(response, newValue);
      },
      params: function(params){
        if ($(this).hasClass('entName')) {
          params.name = params.value;
          delete params.value;
          delete params.pk;
          return params;
        } else {
          params.route = params.pk;
          params.payload = {};
          params.payload[params.name] = params.value;
          delete params.pk;
          delete params.name;
          delete params.value;
          return params;
        }
      }
    });
  }

  function setEditablesArray(){
    $('.editable-array').editable({
      url: function(params) {
        updateEntArray($(this), params);
      },
      params: function(params){
        params.id = params.pk;
        params.key = params.name;
        return params;
      }
    });
  }

  function updateEntArray($this, params) {
    var $data = $this.closest('.dataTables_wrapper').siblings('.data-array'),
        array = $data.data('array'),
        property = $data.data('property');

    var newArray = array.filter(function(obj, index) {
      if (obj.id === params.id.toString()) {
        obj[params.key] = params.value;
      }
      return true;
    });

    var json = {
      id: params.id,
      payload: newArray,
    };

    $.ajax({
       type: 'PUT',
       url: '/enterprise/' + eID + '/update-array',
       data: json,
       success: function(response){
         if(response.statusCode == 202){
           toastr.success('The Organization has been updated', 'Success!');
         } else {
           toastr.error('Unable to update the Organization', 'Oh No!');
         }
       }
    });
  }

  function updateSuccess(response, newValue){
    if(response.statusCode === 202){
      toastr.success('Updated Successfully!');
    } else {
      toastr.error('Unable to update the Organization', 'Oh No!');
    }
  }

  function updateEnt(e){
    var $clicked = $(this),
        key = $clicked.attr('name');
        params[key] = $clicked.val();

    if(!$clicked.is(':checked') && key === 'enabled'){

      e.preventDefault();
      $('#confirm-ent-disable').modal('show');
      $('#continue-disable').on('click.disable', function(){
        updateAjax(params);
        $(this).off('click.disable');
        $clicked.prop('checked', false);
        $clicked.prop('value', 'true');
      });

    } else if($clicked.is(':checked') && key === 'enabled'){

      updateAjax(params);
      updateProp($clicked);

    } else {

      updateAjax(params);
      updateProp($clicked);

    }
    params = {};
  }

  // As integrations grow in complexity this fn will need to be refactored; I attempted to keep some
  // flexibility in as it stands now in as simple terms possible
  function updateIntegrations(){
    var intArray = [];

    $('#entIntegrations input').each(function(i, input){
      var $this = $(this);

      if ($this.is(':checked')){
        intArray.push({'type': $this.attr('name')});
      }
    });

    if (intArray.length) {
      params['integrations'] = intArray;
    } else {
      params['integrations'] = 'none';
    }

    updateAjax(params);
    params = {};
  }

  function updateAjax(json){
    $.ajax({
       type: 'PUT',
       url: '/enterprise/'+eID,
       data: json,
       success: function(response){
         if(response.statusCode === 202){
           toastr.success('The Organization has been updated', 'Success!');
         } else {
           toastr.error('Unable to update the Organization', 'Oh No!');
         }
       }
    });
    params = {};
  }

  function updateProp(clicked){

    if(!clicked.is(':checked')){

      clicked.prop('checked', false);
      clicked.prop('value', 'true');

    } else {

      clicked.prop('checked', true);
      clicked.prop('value', 'false');

    }
  }

  function createUser(e){
    e.preventDefault();
    var $form = $(this);

    if($form.parsley().isValid()){
    var params = $('#newUserForm').serialize();
      $.ajax({
        type: 'POST',
        url: '/users',
        data: params,
        success: function(response){
          if(response.statusCode === 201){
            toastr.success('The User has been added', 'Success!');
            userFormToggle();
            $('#newUserForm .form-control').val('');
            $('#newUserForm input[type=checkbox]').prop('checked', false);
            $form.parsley().reset();
            showUsers();
          } else if(response.statusCode === 409){
            toastr.error('Please choose another username', 'Username Already Exists');
          } else {
            toastr.error('Unable to add the User', 'Oh No!');
          }
        }
      });
    }
  }

  function addLocations(e){

    e.preventDefault();

    if($(this).parsley().isValid()){
      var array = $('#newLocationForm').serializeArray(),
          json = {};

      if(!array.length){

        json['locations'] = ['none'];

      } else {

        json['locations'] = array.map(function(location){
          return {location: location.value};
        });

      }

      updateAjax(json);
    }
  }

  function userFormToggle(){
    $('#newUserForm').slideToggle(100);
  }

  function locationFormToggle(){
    $('#newLocationForm').slideToggle(100);
  }

  function closeForm(){
    var $form = $(this).closest('form');
    $form.slideToggle(100);
  }

  function addLocationInput(){
    $('#newLocationForm  .form-group:last').clone().insertAfter('#newLocationForm  .form-group:last');
    $('#newLocationForm  input:last-of-type').focus();
  }

  function removeLocation(){
    $(this).closest('.form-group').remove();
  }

  function gatherAlgorithms(e){

    e.preventDefault();

    var algArray = [];
    $('#algorithmForm input').each(function(i, input){
      var $this = $(this);
      if($this.is(':checked')){
        algArray.push($this.val());
      }
    });

    if(!algArray.length){
      toastr.error('Please select an algorithm or "None".');
      return false;
    }

    params['ecg_algorithms'] = algArray;
    updateAjax(params);
    params = {};
  }

  function algorithmCheck(){
    var $this = $(this),
        $inputs = $('#algorithmForm input');

    if($this.val() === 'none' && $this.is(':checked')){
      $inputs.not('#no-algorithm').prop('checked', false);
    } else {
      $('#no-algorithm').prop('checked', false);
    }
  }

  function setAlgorithmData(){
    // entAlgorithms is defined and set in the ent-show.jade
    /* jshint ignore:start */
    if(entAlgorithms.length){
      for(var i=0; i<entAlgorithms.length; i++){
        $('input[value='+entAlgorithms[i]+']').prop('checked', true);
      }
    } else {
      $('#no-algorithm').prop('checked', true);
    }
    /* jshint ignore:end */
  }

  // Checks the appropriate checkboxes for integrations based on data in Organization object
  function setIntegrationData(){
    // intData in the jquery selector is defined and assigned in the view
    var $intData = $(intData); // jshint ignore:line
    
    $intData.each(function(){
      var $input = $('#entIntegrations input[name='+this.type+']');
      $input.prop('checked', true);
    });
  }

})();
