$(function() {

    function getCookie(name) {
      var cookieValue = null;
      if (document.cookie && document.cookie != '') {
          var cookies = document.cookie.split(';');
          for (var i = 0; i < cookies.length; i++) {
              var cookie = jQuery.trim(cookies[i]);
              // Does this cookie string begin with the name we want?
              if (cookie.substring(0, name.length + 1) == (name + '=')) {
                  cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                  break;
              }
          }
      }
      return cookieValue;
    }
    var csrftoken = getCookie('csrftoken');

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    $.ajaxSetup({
        crossDomain: false, // obviates need for sameOrigin test
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    var canvas = $('#map-canvas').get(0);
    var latlng = new google.maps.LatLng(35.792621 , 139.806513);
    var mapOptions = {
          zoom: 15,
          center: latlng ,
        };
    var map = new google.maps.Map( canvas , mapOptions ) ;
    var circle_list = new google.maps.MVCArray();
    var current_marker_list = new google.maps.MVCArray();

    setMarker();

    // ボタンクリックで現在位置更新 & 発見確認
    $('#btn').click(function(e) {
        markerUpdate();
    });

    function setMarker () {
        // 現在地表示
        if (! navigator.geolocation) {
            return false;
        }
        navigator.geolocation.getCurrentPosition(function(pos) {
            // var currentPos = new google.maps.LatLng(pos.coords.latitude + Math.random() * 0.005 + 0.001, pos.coords.longitude + Math.random() * 0.005 + 0.001);
            var currentPos = new google.maps.LatLng(35.476025 + Math.random() * 0.008 + 0.001, 133.047518 + Math.random() * 0.008 + 0.001);
            var currentMarker = new google.maps.Marker({
                    position: currentPos
                });
            currentMarker.setMap(map);
            current_marker_list.push(currentMarker);
            map.panTo(currentPos);

            // 登録スポット表示
            $.ajax({
                type: 'GET',
                url: '/app/api/spots/',
                dataType: 'json',
                success: function(res) {
                    jQuery.each(res, function(key, val) {
                        var spotPos = new google.maps.LatLng(val.lat, val.long);
                        var distance = google.maps.geometry.spherical.computeDistanceBetween(currentPos, spotPos) / 1000;

                        // 現在位置からの距離が 500m 以内かつ 発見回数が 5回 未満の場合エリア表示
                        if (distance <= 1.5 && val.count < 20) {
                            var color = '#ffffff';
                            switch(true) {
                                case val.count > 5:
                                    color = '#FF1493'
                                break;
                                case val.count > 4:
                                    color = '#FFDAB9'
                                break;
                                case val.count > 3:
                                    color = '#FFF8DC'
                                break;
                                default:
                                    color = '#00BFFF'
                                break;
                            }
                            var infowindow = new google.maps.InfoWindow({});
                            var marker = new google.maps.Marker({
                                    map: map
                                });
                            var spotCircle = new google.maps.Circle({
                                　　　 center: spotPos,       // 中心点(google.maps.LatLng)
                                      fillColor: color,   // 塗りつぶし色
                                      fillOpacity: 0.5,       // 塗りつぶし透過度（0: 透明 ⇔ 1:不透明）
                                      map: map,             // 表示させる地図（google.maps.Map）
                                      radius: 50,          // 半径（ｍ）
                                      strokeColor: color, // 外周色
                                      strokeOpacity: 1,       // 外周透過度（0: 透明 ⇔ 1:不透明）
                                      strokeWeight: 1,         // 外周太さ（ピクセル）
                                      title: val.name,
                                      count: val.count,
                                      id: val.id
                                });
                            circle_list.push(spotCircle);
                            google.maps.event.addListener(spotCircle, 'mouseover', function () {
                                if (typeof this.title !== "undefined") {
                                    marker.setPosition(this.getCenter());
                                    infowindow.setContent("<b>" + this.title + "</b><br><b>発見人数：" + this.count + "</b>");
                                    infowindow.open(map, marker);
                                    marker.setVisible(false);
                                }
                            });
                            google.maps.event.addListener(spotCircle, 'mouseout', function () {
                                infowindow.close();
                            });

                            if (distance <= 0.3) {
                                foundSpot(spotCircle);
                            }
                        }
                    });
                },
                error: function() {
                    console.log('登録スポットを取得できませんでした。');
                }
            });
        }, function() {
            alert('GPSデータを取得できませんでした');
            return false;
        });
    }

    function foundSpot(spot) {
        // 登録スポット表示
        $.ajax({
            type: 'POST',
            url: '/app/api/counts/',
            dataType: 'json',
            data : {spot : spot.id, ipaddr : "127.0.0.1" },
            success: function (res) {
                spot.count++;
                $('#message').html("スポット：" + spot.title + " にたどり着きました！");
                $('#count').html("発見人数は " + spot.count + " になりました。");
                spot.setMap(map);
            },
            error: function () {
                console.log('発見登録に失敗しました。');
            }
        });
    }

    function markerUpdate() {
        // マーカー更新
        circle_list.forEach(function(marker, idx) {
            marker.setMap(null);
        });
        current_marker_list.forEach(function(marker, idx) {
            marker.setMap(null);
        });
        setMarker();
    }
});