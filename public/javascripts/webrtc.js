$(function() {

  let ownId = null;
  let teacherId = null;
  let isJoin = false;
  let peer = null;
  let room = null;
  let localStream = null;

  const params = {
    id: $('#params').data('id')
  };
  // ID=1 is Publisher
  const is_teacher = params.id === 1;

  $('#start').click(() => {
    if (isJoin) {
      isJoin = false;

      let element = document.getElementById('video-container');
      while (element.firstChild) element.removeChild(element.firstChild);

      room.close();
    } else {
      isJoin = true;

      peer = new Peer({
        key: '___ENTER_API_KEY___',
        debug: 1
      });

      peer.on('open', () => {
        console.log('[open] peer id:' + peer.id);
        ownId = peer.id;
        if (is_teacher) {
          teacherId = peer.id;
        }
        step1();
      });

      peer.on('error', err => {
        console.error('%o', err);
      });

      peer.on('call', (call) => {
        if (is_teacher) {

          call.answer(localStream);

          call.on('stream', onStream);

          call.on('close', () => {});

          call.on('error', (err) => {
            console.dir(err);
          });

        }
      });

      function step1() {
        const constraints = {
          audio: true,
          video: true
        };
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
          localStream = stream;
          $('#video-container').append($(
            '<div id="owner">' +
            '<video class="remoteVideos" autoplay playsinline width="320px" height="240px" muted>' +
            '</div>'));
          const el = $('#owner').find('video').get(0);
          el.srcObject = localStream;
          el.play();
          const joinArgs = {
            mode: 'mesh'
          };
          if (is_teacher) {
            joinArgs.stream = localStream;
          }
          room = peer.joinRoom('mesh_video_example', joinArgs);
          step3(room);
        }).catch(err => {
          console.error(err);
        });
      }

      function onStream(stream) {
        console.log('[stream] peer id:' + stream.peerId);
        console.log('[stream] own id:' + ownId + ' teacher id:' + teacherId);
        if (ownId == teacherId) {
          const peerId = stream.peerId;
          const id = 'video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '');

          $('#video-container').append($(
            '<div class="video_' + peerId + '" id="' + id + '">' +
            '<video class="remoteVideos" autoplay playsinline width="320px" height="240px">' +
            '</div>'));
          const el = $('#' + id).find('video').get(0);
          el.srcObject = stream;
          el.play();
        } else {
          if (teacherId == stream.peerId) {
            const peerId = stream.peerId;
            const id = 'video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '');

            $('#video-container').append($(
              '<div class="video_' + peerId + '" id="' + id + '">' +
              '<video class="remoteVideos" autoplay playsinline width="320px" height="240px">' +
              '</div>'));
            const el = $('#' + id).find('video').get(0);
            el.srcObject = stream;
            el.play();
            peer.call(teacherId, localStream);
          } else if (is_teacher) {
            const peerId = stream.peerId;
            const id = 'video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '');

            $('#video-container').append($(
              '<div class="video_' + peerId + '" id="' + id + '" style="display:none">' +
              '<video class="remoteVideos">' +
              '</div>'));
            const el = $('#' + id).find('video').get(0);
            el.srcObject = stream;
            el.muted = true;
          }
        }
      }

      function step3(room) {
        // **********************************************************************
        room.on('open', () => {
          const data = {
            type: 'tell_me_teacher'
          };
          room.send(data);
        });

        room.on('stream', onStream);

        room.on('removeStream', function(stream) {
          console.log('[remove] peer id:' + stream.peerId);
          const peerId = stream.peerId;
          $('#video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '')).remove();
        });

        room.on('peerLeave', peerId => {
          $('.video_' + peerId).remove();
        });

        room.on('data', (data) => {
          console.log('[data]');
          console.dir(data);
          if (data.data.type == 'tell_me_teacher') {
            if (teacherId != null) {
              const data = {
                type: 'teacher_id',
                id: teacherId
              };
              room.send(data);
            }
          } else if (data.data.type == 'teacher_id') {
            teacherId = data.data.id;
            console.log('[data] current:' + teacherId + ' source:' + data.data.id);
          }
        });
      }
    }
  });
});

