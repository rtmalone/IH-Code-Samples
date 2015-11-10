/* jshint expr: true */

(function(){

  $(document).ready(init);

  // Checking to see if IH namespace exists
  IH = typeof(IH) == 'undefined' ? {} : IH;
  IH.worklist = {};
  IH.worklist.returnBtnColor;

  var filterJSON = {},
      $overlay = $('.waveform-loader'),
      $chosenFilter,
      saveType,
      $filterBar = $('#filterList button:first-of-type'),
      filterID;

  function init(){
    getUserFilters();
    $('#filterName').keyup(function(){
      $('#saveFilterModal .error-msg').addClass('hidden');
    });
    $('#filter-btns').on('click', 'button:contains(Save Filter)', saveFilterPrep);
    $('#filter-btns').on('click', 'button:contains(Save as)', saveFilterPrep);
    $('#saveFilterModal button:contains(Save Filter)').click(filterNameCheck);
    $('#saveFilterModal button:contains(Cancel)').click(function(){
      $('#saveFilterModal h5.error-msg').remove();
    });
    $('#filterList').on('click', 'i.fa-trash', deleteFilter);
    $('#filterList').on('click', 'ul li', function(){
      selectFilter($(this));
    });
    $('#sidebar select').on('change', function(){
      submitFilterForm(function(){$('#search').val('');});
      indicateChange();
      changeBtnColor();
    });
    $('#filter-btns button:contains(Clear Filter)').click(clearFilter);
  }

  function getUserFilters(){
    var stickyFilter = $('#stickyFilter').data('id');
    $.ajax({
      url: '/user/filter',
      method: 'GET',
      success: function(data){
        var $ul = $('#filterList ul');
        for(var i=0; i<data.length; i++){
          $ul.append($('<li class="filter-li" id="'+data[i].id+'"><span>'+data[i].name+
                       '<i class="fa fa-trash fa-fw pull-right "></i></span></li>')
                       .data('criteria', data[i].criteria)
                       .data('sort', data[i].display_options)
                       .data('id', data[i].id));
        }
        // In order to be more thorough in catching cases when the Sticky Filter ID does not exist or the filter
        // has been deleted, check if the Sticky Filter can be found in the list and if so programmatically
        // select it. Prevents the funky collapsed filter selector on load if Sticky Filter is not available
        if($('#filterList ul li[id='+stickyFilter+']').attr('id')){
          filterID = stickyFilter;
          selectFilter($('#filterList').find('li[id="'+filterID+'"]'));
        }
      }
    });
  }

  function saveFilterPrep(){
    // if attribute of data-id exists on element following if statement will evaluate false,
    // therefore calling the PUT function
    // Must also stay as is to catch the case when the variable 'chosenFilter' is undefined
    var filterCriteria = $('#sidebar form').serializeArray();
    saveType = $(this).text();
    filterJSON.criteria = {};

    // iterate over each Obj in filterCriteria and add it to the filterJSON.criteria object
    for(var i=0; i < filterCriteria.length; i++){
      filterJSON.criteria[filterCriteria[i].name] = filterCriteria[i].value;
    }

    if(!filterID || saveType === 'Save as'){
      var $filterName = $('#filterName');

      $('#saveFilterModal').modal();

      // Checking window to to autofocus on input appropriately according to device
      if($(window).width() > 1024){
        $('#saveFilterModal').on('shown.bs.modal', function (e) {
          $filterName.focus();
        });
      }

      // Bind ENTER to filter name input
      $filterName.keyup(function(e){
        if(e.keyCode === 13){
          filterNameCheck();
        }
      });
    } else{
      saveFilter();
    }
  }

  function filterNameCheck(){
    var $filterName = $('#filterName').val(),
        $errorMsg = $('#saveFilterModal .error-msg');

    if(!$filterName.trim().length){
      $errorMsg.removeClass('hidden');
    } else {
      saveFilter($filterName);
    }
  }

  function saveFilter(fName){
    var saveBtnText = $('#save-filter-btn').text();

    // add the filter name to the filterJSON Object
    if(!fName){
      filterJSON.name = $filterBar.data('name');
    } else {
      filterJSON.name = fName;
    }

    if(!filterID || saveBtnText === 'Save as'){
      ajaxPOSTfilter(filterJSON, function(returnedData){
        // data being returned is rendered HTML from alert.jade for a message
        // the alert must be appended in the callback though, if you want to display alert for action
        $filterBar.text(returnedData.name).data('id', returnedData.id);
        $filterBar.data('name', returnedData.name);
        filterID = returnedData.id;
        IH.worklist.returnBtnColor();

        $('#saveFilterModal').modal('hide');

        if(returnedData.code === 201){
          $('#filterList ul').append($('<li class="filter-li" id="'+filterID+'"><span>'+filterJSON.name+
                       '<i class="fa fa-trash fa-fw pull-right "></i></span></li>')
                       .data('criteria', filterJSON.criteria)
                       .data('id', returnedData.id)
                       .data('name', filterJSON.name));
        }
        appendAlert(returnedData);
      });
    } else {
      ajaxPUTfilter(filterJSON, function(returnedData){
        // data being returned is rendered HTML from alert.jade for a message
        // the alert must be appended in the callback though, if you want to display alert for action
        $filterBar.text(returnedData.name);
        IH.worklist.returnBtnColor(); // return save btn to default

        $('#saveFilterModal').modal('hide');
        $('#filterList ul li[id="'+filterID+'"]').data('criteria', filterJSON.criteria);

        appendAlert(returnedData);

      });
    }
  }

  function deleteFilter(event){

    event.stopPropagation();

    var $this = $(this),
        $li = $this.closest('li'),
        id = $li.data('id'),
        $deleteModal = $('#deleteFilterModal');

    $('#deleteFilterModal').on('show.bs.modal', function(e){
      var name = $li.text(),
          $modal = $(this);
      $modal.find('h4 span').text(name);
    });

    $deleteModal.modal('show');

    $('#deleteFilterModal button:contains(Delete)').click(function(){

      $.ajax({
        data: filterJSON,
        url: '/user/filter/'+id,
        method: 'DELETE',
        success: function(data){
          // data being returned is rendered HTML from alert.jade for a message
          if(data.code === 204){
            // removing li element and name from dropdown
            if($li.text() === $filterBar.text()){
              clearFilter(event);
            }
            $li.remove();
          }

          $deleteModal.modal('hide');
          appendAlert(data);

        }
      });
    });
  }

  function selectFilter(thisLI){
    var $chosenFilter = thisLI;

    var liText = $chosenFilter.find('span').text(),
        selectedCriteria = $chosenFilter.data('criteria');

    $filterBar.html(liText).data('id', $chosenFilter.data('id'));
    $filterBar.data('sort', $chosenFilter.data('sort'));
    filterID = $chosenFilter.data('id');
    IH.worklist.returnBtnColor();

    // what I thought was gonna be elegant, became not so...
    // this could use some closer refactor once DOB is not a part of "filter"; without the possibility of patient_dob
    // as a key the 'else' of the first if block will never run
    $.each(selectedCriteria, function(key, value){
      if(key != 'patient_dob'){
        if(value !== ''){
          $('#sidebar form [name='+key+']').find('[value="'+value+'"]').prop('selected', 'selected');
        } else {
          // really not liking the .find() here
          $('#sidebar form [name='+key+']').find('option:first-of-type').prop('selected', 'selected');
        }
      } else {
        $('#sidebar form [name='+key+']').val(value);
      }
    });

    submitFilterForm(function(){
      saveLastFilter();
      $('#search').val('');
      // retrieve sort order from chosen filter to pass to dataTables
      var sortOrder = $filterBar.data('sort');

      if(sortOrder){
        IH.table.tableInstance.order(sortOrder).draw();
      }

    });
  }

  // saves the chosen filter to user preferences obj so we can reload last used filter when returning to list
  function saveLastFilter(){
    var json = {'id': filterID};
    $.ajax({
      data: json,
      url: '/user/preferences/filter',
      method: 'POST',
      success: function(data){
      }
    });
  }

  function saveSort(){
    // getting the data of the column and order it is sorted; then setting on an Obj
    var sortOrder = IH.table.tableInstance.order(),
        json = {'display_options': sortOrder};

    ajaxPUTfilter(json, function(){
      $('#'+filterID).data('sort', sortOrder);
      $filterBar.text($chosenFilter.text()); // without this line the previous empties the name of the filter
    });
  }

  function indicateChange(){
    if ($filterBar.find('em').length) return false;
    var text = $filterBar.text().toUpperCase();

    if(text !== 'Default Filter - captured in last month'){
      $filterBar.html('<em>(Edited) - </em>'+text);
    } else {
      $filterBar.html('<em>(Unsaved Filter)</em>');
    }
  }

  function clearFilter(event){

    $('#sidebar select:not([name="collected_after"])').find('option:first-of-type').prop('selected', 'selected');
    $('#sidebar select[name="collected_after"]').find('option[value="1 month"]').prop('selected', 'selected');
    $('#sidebar input').val('');
    $('#search').val('');

    // variables global to this file used in checks elsewhere; setting them to null for correct expected functionality later
    $chosenFilter = null;
    filterID = null;

    // return "dropdown" filter list to default; empty data-id and data-sort
    $filterBar.text('Default Filter - captured in last month').data('id', '').data('sort', '');
    IH.worklist.returnBtnColor();
    IH.table.fnECGList(event, 'default');
  }

  function changeBtnColor(){
    // any input change on the filter criteria fires this function, so this is where we
    // change the button color to indicate save is possible
    $('#save-filter-btn').removeClass('btn-default').addClass('btn-success');
    $('#filter-btns button[data-toggle]').removeClass('btn-default').addClass('btn-success');
  }

  IH.worklist.returnBtnColor = function(){
    $('#save-filter-btn').removeClass('btn-success').addClass('btn-default');
    $('#filter-btns button[data-toggle]').removeClass('btn-success').addClass('btn-default');
  };

  function submitFilterForm(callback){
    IH.table.filterAttrs = $('#sidebar form').serializeArray();

    $overlay.fadeIn(300);
    $('.FixedHeader_Cloned').remove();
    $('#load-container').load('/worklist #load-container > *', IH.table.filterAttrs, function(){
      $overlay.fadeOut(300);
      IH.table.fnSetupDataTable();
      $('th').click(saveSort);
      IH.time.formatDob('.dob');
      IH.time.formatCapture('.ecg-cap');
      IH.time.timezone('.timezone');
      $('#worklist').on('click', 'tr', IH.table.fnGoToContent);
      if (typeof callback === 'function') callback();
    });
  }

  function ajaxPOSTfilter(filterData, callback){
    $.ajax({
      data: filterData,
      url: '/user/filter',
      method: 'POST',
      success: function(data){
        data.name = filterData.name;
        if (typeof callback === 'function') callback(data);
      }
    });
  }

  function ajaxPUTfilter(filterData, callback){
    $.ajax({
      data: filterData,
      url: '/user/filter/'+filterID,
      method: 'PUT',
      success: function(data){
        data.name = filterData.name;
        if (typeof callback === 'function') callback(data);
      }
    });
  }

  function appendAlert(data){
    // the jQuery to append an alert must be placed in the callback of ajaxPUTfilter or ajaxPOSTfilter
    $('#alertArea').append(data.html);
    setTimeout(function(){
      $('.alert').removeClass('in').addClass('shrink');
    }, 4000);
  }

})();
