$(function() {
    var canvas = $('#map-canvas').get(0);
    var latlng = new google.maps.LatLng(35.792621 , 139.806513);
    var mapOptions = {
          zoom: 15,
          center: latlng ,
        };
    var map = new google.maps.Map( canvas , mapOptions ) ;
    var circle_list = new google.maps.MVCArray();
    var currentMarker = null

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
            var currentPos = new google.maps.LatLng(35.475015 + Math.random() * 0.005 + 0.001, 133.067518 + Math.random() * 0.005 + 0.001);
            currentMarker = new google.maps.Marker({
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

                        // 現在位置からの距離が 500m 以内かつ 発見回数が 5回 未満の場合エリア表示
                        console.log(val.count);
                        if (distance <= 1.5 && val.count < 20) {
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
                                      count: val.count
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

                            if (distance <= 0.1) {
                                getIPs(function(ip){foundSpot(val.id, ip, val.name);});
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

    function foundSpot(spotId, ip, name) {
        // 登録スポット表示
        $.ajax({
            type: 'POST',
            url: '/app/api/counts/',
            dataType: 'json',
            data : {spot : spotId, ipaddr : ip },
            success: function (res) {
                alert("スポット：" + name + " にたどり着きました！")
                markerUpdate();
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
        currentMarker.setMap(null);
        setMarker();
    }

    //get the IP addresses associated with an account
    function getIPs(callback){
        var ip_dups = {};

        //compatibility for firefox and chrome
        var RTCPeerConnection = window.RTCPeerConnection
        || window.mozRTCPeerConnection
        || window.webkitRTCPeerConnection;
        var useWebKit = !!window.webkitRTCPeerConnection;

        //bypass naive webrtc blocking using an iframe
        if(!RTCPeerConnection){
            //NOTE: you need to have an iframe in the page right above the script tag
            //
            //<iframe id="iframe" sandbox="allow-same-origin" style="display: none"></iframe>
            //<script>...getIPs called in here...
            //
            var win = iframe.contentWindow;
            RTCPeerConnection = win.RTCPeerConnection
            || win.mozRTCPeerConnection
            || win.webkitRTCPeerConnection;
            useWebKit = !!win.webkitRTCPeerConnection;
        }

        //minimal requirements for data connection
        var mediaConstraints = {
            optional: [{RtpDataChannels: true}]
        };

        var servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};

        //construct a new RTCPeerConnection
        var pc = new RTCPeerConnection(servers, mediaConstraints);

        function handleCandidate(candidate){
            //match just the IP address
            var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
            var ip_addr = ip_regex.exec(candidate)[1];

            //remove duplicates
            if(ip_dups[ip_addr] === undefined)
                callback(ip_addr);

            ip_dups[ip_addr] = true;
        }

        //listen for candidate events
        pc.onicecandidate = function(ice){

            //skip non-candidate events
            if(ice.candidate)
                handleCandidate(ice.candidate.candidate);
        };

        //create a bogus data channel
        pc.createDataChannel("");

        //create an offer sdp
        pc.createOffer(function(result){

            //trigger the stun server request
            pc.setLocalDescription(result, function(){}, function(){});

        }, function(){});

        //wait for a while to let everything done
        setTimeout(function(){
            //read candidate info from local description
            var lines = pc.localDescription.sdp.split('\n');

            lines.forEach(function(line){
                if(line.indexOf('a=candidate:') === 0)
                    handleCandidate(line);
            });
        }, 1000);
    }
});