(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
$(function () {
    var canvas = $('#map-canvas').get(0);
    var latlng = new google.maps.LatLng(35.792621, 139.806513);
    var mapOptions = {
        zoom: 15,
        center: latlng
    };
    var map = new google.maps.Map(canvas, mapOptions);
    var circle_list = new google.maps.MVCArray();
    var currentMarker = null;

    setMarker();

    // ボタンクリックで現在位置更新 & 発見確認
    $('#btn').click(function (e) {
        markerUpdate();
    });

    function setMarker() {
        // 現在地表示
        if (!navigator.geolocation) {
            return false;
        }
        navigator.geolocation.getCurrentPosition(function (pos) {
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
                success: function (res) {
                    jQuery.each(res, function (key, val) {
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
                                center: spotPos, // 中心点(google.maps.LatLng)
                                fillColor: '#ff0000', // 塗りつぶし色
                                fillOpacity: 0.5, // 塗りつぶし透過度（0: 透明 ⇔ 1:不透明）
                                map: map, // 表示させる地図（google.maps.Map）
                                radius: 50, // 半径（ｍ）
                                strokeColor: '#ff0000', // 外周色
                                strokeOpacity: 1, // 外周透過度（0: 透明 ⇔ 1:不透明）
                                strokeWeight: 1, // 外周太さ（ピクセル）
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
                                getIPs(function (ip) {
                                    foundSpot(val.id, ip, val.name);
                                });
                            }
                        }
                    });
                },
                error: function () {
                    console.log('登録スポットを取得できませんでした。');
                }
            });
        }, function () {
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
            data: { spot: spotId, ipaddr: ip },
            success: function (res) {
                alert("スポット：" + name + " にたどり着きました！");
                markerUpdate();
            },
            error: function () {
                console.log('発見登録に失敗しました。');
            }
        });
    }

    function markerUpdate() {
        // マーカー更新
        circle_list.forEach(function (marker, idx) {
            marker.setMap(null);
        });
        currentMarker.setMap(null);
        setMarker();
    }

    //get the IP addresses associated with an account
    function getIPs(callback) {
        var ip_dups = {};

        //compatibility for firefox and chrome
        var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        var useWebKit = !!window.webkitRTCPeerConnection;

        //bypass naive webrtc blocking using an iframe
        if (!RTCPeerConnection) {
            //NOTE: you need to have an iframe in the page right above the script tag
            //
            //<iframe id="iframe" sandbox="allow-same-origin" style="display: none"></iframe>
            //<script>...getIPs called in here...
            //
            var win = iframe.contentWindow;
            RTCPeerConnection = win.RTCPeerConnection || win.mozRTCPeerConnection || win.webkitRTCPeerConnection;
            useWebKit = !!win.webkitRTCPeerConnection;
        }

        //minimal requirements for data connection
        var mediaConstraints = {
            optional: [{ RtpDataChannels: true }]
        };

        var servers = { iceServers: [{ urls: "stun:stun.services.mozilla.com" }] };

        //construct a new RTCPeerConnection
        var pc = new RTCPeerConnection(servers, mediaConstraints);

        function handleCandidate(candidate) {
            //match just the IP address
            var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
            var ip_addr = ip_regex.exec(candidate)[1];

            //remove duplicates
            if (ip_dups[ip_addr] === undefined) callback(ip_addr);

            ip_dups[ip_addr] = true;
        }

        //listen for candidate events
        pc.onicecandidate = function (ice) {

            //skip non-candidate events
            if (ice.candidate) handleCandidate(ice.candidate.candidate);
        };

        //create a bogus data channel
        pc.createDataChannel("");

        //create an offer sdp
        pc.createOffer(function (result) {

            //trigger the stun server request
            pc.setLocalDescription(result, function () {}, function () {});
        }, function () {});

        //wait for a while to let everything done
        setTimeout(function () {
            //read candidate info from local description
            var lines = pc.localDescription.sdp.split('\n');

            lines.forEach(function (line) {
                if (line.indexOf('a=candidate:') === 0) handleCandidate(line);
            });
        }, 1000);
    }
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWMvanMvYXBwLmVzNiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLEVBQUUsWUFBVztBQUNULFFBQUksU0FBUyxFQUFFLGFBQUYsRUFBaUIsR0FBakIsQ0FBcUIsQ0FBckIsQ0FBYjtBQUNBLFFBQUksU0FBUyxJQUFJLE9BQU8sSUFBUCxDQUFZLE1BQWhCLENBQXVCLFNBQXZCLEVBQW1DLFVBQW5DLENBQWI7QUFDQSxRQUFJLGFBQWE7QUFDWCxjQUFNLEVBREs7QUFFWCxnQkFBUTtBQUZHLEtBQWpCO0FBSUEsUUFBSSxNQUFNLElBQUksT0FBTyxJQUFQLENBQVksR0FBaEIsQ0FBcUIsTUFBckIsRUFBOEIsVUFBOUIsQ0FBVjtBQUNBLFFBQUksY0FBYyxJQUFJLE9BQU8sSUFBUCxDQUFZLFFBQWhCLEVBQWxCO0FBQ0EsUUFBSSxnQkFBZ0IsSUFBcEI7O0FBRUE7O0FBRUE7QUFDQSxNQUFFLE1BQUYsRUFBVSxLQUFWLENBQWdCLFVBQVMsQ0FBVCxFQUFZO0FBQ3hCO0FBQ0gsS0FGRDs7QUFJQSxhQUFTLFNBQVQsR0FBc0I7QUFDbEI7QUFDQSxZQUFJLENBQUUsVUFBVSxXQUFoQixFQUE2QjtBQUN6QixtQkFBTyxLQUFQO0FBQ0g7QUFDRCxrQkFBVSxXQUFWLENBQXNCLGtCQUF0QixDQUF5QyxVQUFTLEdBQVQsRUFBYztBQUNuRDtBQUNBLGdCQUFJLGFBQWEsSUFBSSxPQUFPLElBQVAsQ0FBWSxNQUFoQixDQUF1QixZQUFZLEtBQUssTUFBTCxLQUFnQixLQUE1QixHQUFvQyxLQUEzRCxFQUFrRSxhQUFhLEtBQUssTUFBTCxLQUFnQixLQUE3QixHQUFxQyxLQUF2RyxDQUFqQjtBQUNBLDRCQUFnQixJQUFJLE9BQU8sSUFBUCxDQUFZLE1BQWhCLENBQXVCO0FBQy9CLDBCQUFVO0FBRHFCLGFBQXZCLENBQWhCO0FBR0EsMEJBQWMsTUFBZCxDQUFxQixHQUFyQjtBQUNB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LGdCQUFJLFVBQVUsU0FBUyxJQUFULENBQWMsU0FBZCxFQUF5QixDQUF6QixDQUFkOztBQUVBO0FBQ0EsZ0JBQUcsUUFBUSxPQUFSLE1BQXFCLFNBQXhCLEVBQ0ksU0FBUyxPQUFUOztBQUVKLG9CQUFRLE9BQVIsSUFBbUIsSUFBbkI7QUFDSDs7QUFFRDtBQUNBLFdBQUcsY0FBSCxHQUFvQixVQUFTLEdBQVQsRUFBYTs7QUFFN0I7QUFDQSxnQkFBRyxJQUFJLFNBQVAsRUFDSSxnQkFBZ0IsSUFBSSxTQUFKLENBQWMsU0FBOUI7QUFDUCxTQUxEOztBQU9BO0FBQ0EsV0FBRyxpQkFBSCxDQUFxQixFQUFyQjs7QUFFQTtBQUNBLFdBQUcsV0FBSCxDQUFlLFVBQVMsTUFBVCxFQUFnQjs7QUFFM0I7QUFDQSxlQUFHLG1CQUFILENBQXVCLE1BQXZCLEVBQStCLFlBQVUsQ0FBRSxDQUEzQyxFQUE2QyxZQUFVLENBQUUsQ0FBekQ7QUFFSCxTQUxELEVBS0csWUFBVSxDQUFFLENBTGY7O0FBT0E7QUFDQSxtQkFBVyxZQUFVO0FBQ2pCO0FBQ0EsZ0JBQUksUUFBUSxHQUFHLGdCQUFILENBQW9CLEdBQXBCLENBQXdCLEtBQXhCLENBQThCLElBQTlCLENBQVo7O0FBRUEsa0JBQU0sT0FBTixDQUFjLFVBQVMsSUFBVCxFQUFjO0FBQ3hCLG9CQUFHLEtBQUssT0FBTCxDQUFhLGNBQWIsTUFBaUMsQ0FBcEMsRUFDSSxnQkFBZ0IsSUFBaEI7QUFDUCxhQUhEO0FBSUgsU0FSRCxFQVFHLElBUkg7QUFTSDtBQUNKLENBaE1EIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9ICQoJyNtYXAtY2FudmFzJykuZ2V0KDApO1xuICAgIHZhciBsYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDM1Ljc5MjYyMSAsIDEzOS44MDY1MTMpO1xuICAgIHZhciBtYXBPcHRpb25zID0ge1xuICAgICAgICAgIHpvb206IDE1LFxuICAgICAgICAgIGNlbnRlcjogbGF0bG5nICxcbiAgICAgICAgfTtcbiAgICB2YXIgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcCggY2FudmFzICwgbWFwT3B0aW9ucyApIDtcbiAgICB2YXIgY2lyY2xlX2xpc3QgPSBuZXcgZ29vZ2xlLm1hcHMuTVZDQXJyYXkoKTtcbiAgICB2YXIgY3VycmVudE1hcmtlciA9IG51bGxcblxuICAgIHNldE1hcmtlcigpO1xuXG4gICAgLy8g44Oc44K/44Oz44Kv44Oq44OD44Kv44Gn54++5Zyo5L2N572u5pu05pawICYg55m66KaL56K66KqNXG4gICAgJCgnI2J0bicpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgbWFya2VyVXBkYXRlKCk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBzZXRNYXJrZXIgKCkge1xuICAgICAgICAvLyDnj77lnKjlnLDooajnpLpcbiAgICAgICAgaWYgKCEgbmF2aWdhdG9yLmdlb2xvY2F0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihmdW5jdGlvbihwb3MpIHtcbiAgICAgICAgICAgIC8vIHZhciBjdXJyZW50UG9zID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhwb3MuY29vcmRzLmxhdGl0dWRlICsgTWF0aC5yYW5kb20oKSAqIDAuMDA1ICsgMC4wMDEsIHBvcy5jb29yZHMubG9uZ2l0dWRlICsgTWF0aC5yYW5kb20oKSAqIDAuMDA1ICsgMC4wMDEpO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRQb3MgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDM1LjQ3NTAxNSArIE1hdGgucmFuZG9tKCkgKiAwLjAwNSArIDAuMDAxLCAxMzMuMDY3NTE4ICsgTWF0aC5yYW5kb20oKSAqIDAuMDA1ICsgMC4wMDEpO1xuICAgICAgICAgICAgY3VycmVudE1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogY3VycmVudFBvc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRNYXAobWFwKTtcbiAgICAgICAgICAgIG1hcC5wYW5UbyhjdXJyZW50UG9zKTtcblxuICAgICAgICAgICAgLy8g55m76Yyy44K544Od44OD44OI6KGo56S6XG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogJy9hcHAvYXBpL3Nwb3RzLycsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5LmVhY2gocmVzLCBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNwb3RQb3MgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKHZhbC5sYXQsIHZhbC5sb25nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXN0YW5jZSA9IGdvb2dsZS5tYXBzLmdlb21ldHJ5LnNwaGVyaWNhbC5jb21wdXRlRGlzdGFuY2VCZXR3ZWVuKGN1cnJlbnRQb3MsIHNwb3RQb3MpIC8gMTAwMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g54++5Zyo5L2N572u44GL44KJ44Gu6Led6Zui44GMIDUwMG0g5Lul5YaF44GL44GkIOeZuuimi+WbnuaVsOOBjCA15ZueIOacqua6gOOBruWgtOWQiOOCqOODquOCouihqOekulxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codmFsLmNvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSA8PSAxLjUgJiYgdmFsLmNvdW50IDwgMjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5mb3dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXA6IG1hcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3BvdENpcmNsZSA9IG5ldyBnb29nbGUubWFwcy5DaXJjbGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDjgIDjgIDjgIAgY2VudGVyOiBzcG90UG9zLCAgICAgICAvLyDkuK3lv4PngrkoZ29vZ2xlLm1hcHMuTGF0TG5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsQ29sb3I6ICcjZmYwMDAwJywgICAvLyDloZfjgorjgaTjgbbjgZfoibJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbE9wYWNpdHk6IDAuNSwgICAgICAgLy8g5aGX44KK44Gk44G244GX6YCP6YGO5bqm77yIMDog6YCP5piOIOKHlCAxOuS4jemAj+aYju+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXA6IG1hcCwgICAgICAgICAgICAgLy8g6KGo56S644GV44Gb44KL5Zyw5Zuz77yIZ29vZ2xlLm1hcHMuTWFw77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhZGl1czogNTAsICAgICAgICAgIC8vIOWNiuW+hO+8iO+9je+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvcjogJyNmZjAwMDAnLCAvLyDlpJblkajoibJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlT3BhY2l0eTogMSwgICAgICAgLy8g5aSW5ZGo6YCP6YGO5bqm77yIMDog6YCP5piOIOKHlCAxOuS4jemAj+aYju+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VXZWlnaHQ6IDEsICAgICAgICAgLy8g5aSW5ZGo5aSq44GV77yI44OU44Kv44K744Or77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiB2YWwubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHZhbC5jb3VudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaXJjbGVfbGlzdC5wdXNoKHNwb3RDaXJjbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHNwb3RDaXJjbGUsICdtb3VzZW92ZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy50aXRsZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLnNldFBvc2l0aW9uKHRoaXMuZ2V0Q2VudGVyKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mb3dpbmRvdy5zZXRDb250ZW50KFwiPGI+XCIgKyB0aGlzLnRpdGxlICsgXCI8L2I+PGJyPjxiPueZuuimi+S6uuaVsO+8mlwiICsgdGhpcy5jb3VudCArIFwiPC9iPlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm93aW5kb3cub3BlbihtYXAsIG1hcmtlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuc2V0VmlzaWJsZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihzcG90Q2lyY2xlLCAnbW91c2VvdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm93aW5kb3cuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSA8PSAwLjEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0SVBzKGZ1bmN0aW9uKGlwKXtmb3VuZFNwb3QodmFsLmlkLCBpcCwgdmFsLm5hbWUpO30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfnmbvpjLLjgrnjg53jg4Pjg4jjgpLlj5blvpfjgafjgY3jgb7jgZvjgpPjgafjgZfjgZ/jgIInKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhbGVydCgnR1BT44OH44O844K/44KS5Y+W5b6X44Gn44GN44G+44Gb44KT44Gn44GX44GfJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvdW5kU3BvdChzcG90SWQsIGlwLCBuYW1lKSB7XG4gICAgICAgIC8vIOeZu+mMsuOCueODneODg+ODiOihqOekulxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgdXJsOiAnL2FwcC9hcGkvY291bnRzLycsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgZGF0YSA6IHtzcG90IDogc3BvdElkLCBpcGFkZHIgOiBpcCB9LFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgICAgIGFsZXJ0KFwi44K544Od44OD44OI77yaXCIgKyBuYW1lICsgXCIg44Gr44Gf44Gp44KK552A44GN44G+44GX44Gf77yBXCIpXG4gICAgICAgICAgICAgICAgbWFya2VyVXBkYXRlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn55m66KaL55m76Yyy44Gr5aSx5pWX44GX44G+44GX44Gf44CCJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hcmtlclVwZGF0ZSgpIHtcbiAgICAgICAgLy8g44Oe44O844Kr44O85pu05pawXG4gICAgICAgIGNpcmNsZV9saXN0LmZvckVhY2goZnVuY3Rpb24obWFya2VyLCBpZHgpIHtcbiAgICAgICAgICAgIG1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjdXJyZW50TWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgc2V0TWFya2VyKCk7XG4gICAgfVxuXG4gICAgLy9nZXQgdGhlIElQIGFkZHJlc3NlcyBhc3NvY2lhdGVkIHdpdGggYW4gYWNjb3VudFxuICAgIGZ1bmN0aW9uIGdldElQcyhjYWxsYmFjayl7XG4gICAgICAgIHZhciBpcF9kdXBzID0ge307XG5cbiAgICAgICAgLy9jb21wYXRpYmlsaXR5IGZvciBmaXJlZm94IGFuZCBjaHJvbWVcbiAgICAgICAgdmFyIFJUQ1BlZXJDb25uZWN0aW9uID0gd2luZG93LlJUQ1BlZXJDb25uZWN0aW9uXG4gICAgICAgIHx8IHdpbmRvdy5tb3pSVENQZWVyQ29ubmVjdGlvblxuICAgICAgICB8fCB3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb247XG4gICAgICAgIHZhciB1c2VXZWJLaXQgPSAhIXdpbmRvdy53ZWJraXRSVENQZWVyQ29ubmVjdGlvbjtcblxuICAgICAgICAvL2J5cGFzcyBuYWl2ZSB3ZWJydGMgYmxvY2tpbmcgdXNpbmcgYW4gaWZyYW1lXG4gICAgICAgIGlmKCFSVENQZWVyQ29ubmVjdGlvbil7XG4gICAgICAgICAgICAvL05PVEU6IHlvdSBuZWVkIHRvIGhhdmUgYW4gaWZyYW1lIGluIHRoZSBwYWdlIHJpZ2h0IGFib3ZlIHRoZSBzY3JpcHQgdGFnXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy88aWZyYW1lIGlkPVwiaWZyYW1lXCIgc2FuZGJveD1cImFsbG93LXNhbWUtb3JpZ2luXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lXCI+PC9pZnJhbWU+XG4gICAgICAgICAgICAvLzxzY3JpcHQ+Li4uZ2V0SVBzIGNhbGxlZCBpbiBoZXJlLi4uXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgdmFyIHdpbiA9IGlmcmFtZS5jb250ZW50V2luZG93O1xuICAgICAgICAgICAgUlRDUGVlckNvbm5lY3Rpb24gPSB3aW4uUlRDUGVlckNvbm5lY3Rpb25cbiAgICAgICAgICAgIHx8IHdpbi5tb3pSVENQZWVyQ29ubmVjdGlvblxuICAgICAgICAgICAgfHwgd2luLndlYmtpdFJUQ1BlZXJDb25uZWN0aW9uO1xuICAgICAgICAgICAgdXNlV2ViS2l0ID0gISF3aW4ud2Via2l0UlRDUGVlckNvbm5lY3Rpb247XG4gICAgICAgIH1cblxuICAgICAgICAvL21pbmltYWwgcmVxdWlyZW1lbnRzIGZvciBkYXRhIGNvbm5lY3Rpb25cbiAgICAgICAgdmFyIG1lZGlhQ29uc3RyYWludHMgPSB7XG4gICAgICAgICAgICBvcHRpb25hbDogW3tSdHBEYXRhQ2hhbm5lbHM6IHRydWV9XVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBzZXJ2ZXJzID0ge2ljZVNlcnZlcnM6IFt7dXJsczogXCJzdHVuOnN0dW4uc2VydmljZXMubW96aWxsYS5jb21cIn1dfTtcblxuICAgICAgICAvL2NvbnN0cnVjdCBhIG5ldyBSVENQZWVyQ29ubmVjdGlvblxuICAgICAgICB2YXIgcGMgPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oc2VydmVycywgbWVkaWFDb25zdHJhaW50cyk7XG5cbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlQ2FuZGlkYXRlKGNhbmRpZGF0ZSl7XG4gICAgICAgICAgICAvL21hdGNoIGp1c3QgdGhlIElQIGFkZHJlc3NcbiAgICAgICAgICAgIHZhciBpcF9yZWdleCA9IC8oWzAtOV17MSwzfShcXC5bMC05XXsxLDN9KXszfXxbYS1mMC05XXsxLDR9KDpbYS1mMC05XXsxLDR9KXs3fSkvXG4gICAgICAgICAgICB2YXIgaXBfYWRkciA9IGlwX3JlZ2V4LmV4ZWMoY2FuZGlkYXRlKVsxXTtcblxuICAgICAgICAgICAgLy9yZW1vdmUgZHVwbGljYXRlc1xuICAgICAgICAgICAgaWYoaXBfZHVwc1tpcF9hZGRyXSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGlwX2FkZHIpO1xuXG4gICAgICAgICAgICBpcF9kdXBzW2lwX2FkZHJdID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vbGlzdGVuIGZvciBjYW5kaWRhdGUgZXZlbnRzXG4gICAgICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gZnVuY3Rpb24oaWNlKXtcblxuICAgICAgICAgICAgLy9za2lwIG5vbi1jYW5kaWRhdGUgZXZlbnRzXG4gICAgICAgICAgICBpZihpY2UuY2FuZGlkYXRlKVxuICAgICAgICAgICAgICAgIGhhbmRsZUNhbmRpZGF0ZShpY2UuY2FuZGlkYXRlLmNhbmRpZGF0ZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy9jcmVhdGUgYSBib2d1cyBkYXRhIGNoYW5uZWxcbiAgICAgICAgcGMuY3JlYXRlRGF0YUNoYW5uZWwoXCJcIik7XG5cbiAgICAgICAgLy9jcmVhdGUgYW4gb2ZmZXIgc2RwXG4gICAgICAgIHBjLmNyZWF0ZU9mZmVyKGZ1bmN0aW9uKHJlc3VsdCl7XG5cbiAgICAgICAgICAgIC8vdHJpZ2dlciB0aGUgc3R1biBzZXJ2ZXIgcmVxdWVzdFxuICAgICAgICAgICAgcGMuc2V0TG9jYWxEZXNjcmlwdGlvbihyZXN1bHQsIGZ1bmN0aW9uKCl7fSwgZnVuY3Rpb24oKXt9KTtcblxuICAgICAgICB9LCBmdW5jdGlvbigpe30pO1xuXG4gICAgICAgIC8vd2FpdCBmb3IgYSB3aGlsZSB0byBsZXQgZXZlcnl0aGluZyBkb25lXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vcmVhZCBjYW5kaWRhdGUgaW5mbyBmcm9tIGxvY2FsIGRlc2NyaXB0aW9uXG4gICAgICAgICAgICB2YXIgbGluZXMgPSBwYy5sb2NhbERlc2NyaXB0aW9uLnNkcC5zcGxpdCgnXFxuJyk7XG5cbiAgICAgICAgICAgIGxpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZSl7XG4gICAgICAgICAgICAgICAgaWYobGluZS5pbmRleE9mKCdhPWNhbmRpZGF0ZTonKSA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlQ2FuZGlkYXRlKGxpbmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH1cbn0pOyJdfQ==
