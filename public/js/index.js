function init() {

  var serverBaseUrl = document.domain;

  // On init, connect to Socket.IO server. May need a port in future iterations
  // (none here since we set up our server to run on port 8080)
  var socket_connection = io.connect(serverBaseUrl);
  var sessionId = '';

  // Helper function to update the participants' list
  function updateParticipants(participants) {
   $('#participants').html('');
   for (var i = 0; i < participants.length; i++) {
      $('#participants').append('<span id="' + participants[i].id + '">' +
        participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)' : '') + '<br /></span>');
    } 
  }

  // Creation of the newUser event
  socket.on('connect', function () {
    sessionId = socket.socket_connection.sessionid;
    socket.emit('newUser', {id: sessionId, name: $('#name').val()});
  });

  // Update participants when newConnection is emitted
  socket.on('newConnection', function (data) {
    updateParticipants(data.participants);
  });

  // Remove span when user logs out
  socket.on('userDisconnected', function(data) {
    $('#' + data.id).remove();
  });

  // Change span when user name changes
  socket.on('nameChanged', function (data) {
    $('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)' : '') + '<br />');
  });

  // Wait for any incomingMessage, add it to the chatroom
  socket.on('incomingMessage', function (data) {
    var message = data.message;
    var name = data.name;
    $('#messages').prepend('<b>' + name + '</b><br />' + message + '<hr />');
  });

  // Handle unable to connect errors
  socket.on('error', function (reason) {
    console.log('Unable to connect to server', reason);
  });

  // AJAX POSTs with the value of the textarea
  function sendMessage() {
    var outgoingMessage = $('#outgoingMessage').val();
    var name = $('#name').val();
    $.ajax({
      url:  '/message',
      type: 'POST',
      dataType: 'json',
      data: {message: outgoingMessage, name: name}
    });
  }

  // trigger sendMessage on 'Enter' key if there's content in the textarea
  function outgoingMessageKeyDown(event) {
    if (event.which == 13) {
      event.preventDefault();
      if ($('#outgoingMessage').val().trim().length <= 0) {
        return;
      }
      sendMessage();
      $('#outgoingMessage').val('');
    }
  }

  // Helper function to disable/enable send button
  function outgoingMessageKeyUp() {
    var outgoingMessageValue = $('#outgoingMessage').val();
    $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true);
  }

  // Emit nameChange
  function nameFocusOut() {
    var name = $('#name').val();
    socket.emit('nameChange', {id: sessionId, name: name});
  }

  // Helper elements
  $('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
  $('#outgoingMessage').on('keyup', outgoingMessageKeyUp);
  $('#name').on('focusout', nameFocusOut);
  $('#send').on('click', sendMessage);

}

$(document).on('ready', init);