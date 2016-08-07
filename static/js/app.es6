$(function() {
    var canvas = $('#map-canvas').get(0);
    var latlng = new google.maps.LatLng(35.792621 , 139.806513);
    var mapOptions = {
          zoom: 15,
          center: latlng ,
        };
    var map = new google.maps.Map( canvas , mapOptions ) ;

    setMarker();

    function setMarker () {
        // 現在地表示
        if (! navigator.geolocation) {
            return false;
        }
        navigator.geolocation.getCurrentPosition(function(pos) {
            var currentPos = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            var currentMarker = new google.maps.Marker({
                    position: currentPos
                });
            currentMarker.setMap(map);
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
                        if (distance <= 1) {
                            var infowindow = new google.maps.InfoWindow({});
                            var marker = new google.maps.Marker({
                                    map: map
                                });
                            var spotCircle = new google.maps.Circle({
                                　　　 center: spotPos,       // 中心点(google.maps.LatLng)
                                      fillColor: '#ff0000',   // 塗りつぶし色
                                      fillOpacity: 0.5,       // 塗りつぶし透過度（0: 透明 ⇔ 1:不透明）
                                      map: map,             // 表示させる地図（google.maps.Map）
                                      radius: 50,          // 半径（ｍ）
                                      strokeColor: '#ff0000', // 外周色
                                      strokeOpacity: 1,       // 外周透過度（0: 透明 ⇔ 1:不透明）
                                      strokeWeight: 1,         // 外周太さ（ピクセル）
                                      title: val.name,
                                      reach_count: val.reach_count
                                });
                                google.maps.event.addListener(spotCircle, 'mouseover', function () {
                                    if (typeof this.title !== "undefined") {
                                        marker.setPosition(this.getCenter());
                                        infowindow.setContent("<b>" + this.title + "</b><br><b>発見人数：" + this.reach_count + "</b>");
                                        infowindow.open(map, marker);
                                        marker.setVisible(false);
                                   }
                                });
                                google.maps.event.addListener(spotCircle, 'mouseout', function () {
                                    infowindow.close();
                                });
                        }
                    });
                },
                error: function() {
                    alert('登録スポットを取得できませんでした。');
                }
            });
        }, function() {
            alert('GPSデータを取得できませんでした');
            return false;
        });
    }
});