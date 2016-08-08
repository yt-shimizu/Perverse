(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
$(function () {

    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == name + '=') {
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
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method)
        );
    }
    $.ajaxSetup({
        crossDomain: false, // obviates need for sameOrigin test
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

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
                            var color = '#ffffff';
                            switch (true) {
                                case val.count > 5:
                                    color = '#FF1493';
                                    break;
                                case val.count > 4:
                                    color = '#FFDAB9';
                                    break;
                                case val.count > 3:
                                    color = '#FFF8DC';
                                    break;
                                default:
                                    color = '#00BFFF';
                                    break;
                            }
                            var infowindow = new google.maps.InfoWindow({});
                            var marker = new google.maps.Marker({
                                map: map
                            });
                            var spotCircle = new google.maps.Circle({
                                center: spotPos, // 中心点(google.maps.LatLng)
                                fillColor: color, // 塗りつぶし色
                                fillOpacity: 0.5, // 塗りつぶし透過度（0: 透明 ⇔ 1:不透明）
                                map: map, // 表示させる地図（google.maps.Map）
                                radius: 50, // 半径（ｍ）
                                strokeColor: color, // 外周色
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWMvanMvYXBwLmVzNiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLEVBQUUsWUFBVzs7QUFFVCxhQUFTLFNBQVQsQ0FBbUIsSUFBbkIsRUFBeUI7QUFDdkIsWUFBSSxjQUFjLElBQWxCO0FBQ0EsWUFBSSxTQUFTLE1BQVQsSUFBbUIsU0FBUyxNQUFULElBQW1CLEVBQTFDLEVBQThDO0FBQzFDLGdCQUFJLFVBQVUsU0FBUyxNQUFULENBQWdCLEtBQWhCLENBQXNCLEdBQXRCLENBQWQ7QUFDQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFFBQVEsTUFBNUIsRUFBb0MsR0FBcEMsRUFBeUM7QUFDckMsb0JBQUksU0FBUyxPQUFPLElBQVAsQ0FBWSxRQUFRLENBQVIsQ0FBWixDQUFiO0FBQ0E7QUFDQSxvQkFBSSxPQUFPLFNBQVAsQ0FBaUIsQ0FBakIsRUFBb0IsS0FBSyxNQUFMLEdBQWMsQ0FBbEMsS0FBeUMsT0FBTyxHQUFwRCxFQUEwRDtBQUN0RCxrQ0FBYyxtQkFBbUIsT0FBTyxTQUFQLENBQWlCLEtBQUssTUFBTCxHQUFjLENBQS9CLENBQW5CLENBQWQ7QUFDQTtBQUNIO0FBQ0o7QUFDSjtBQUNELGVBQU8sV0FBUDtBQUNEO0FBQ0QsUUFBSSxZQUFZLFVBQVUsV0FBVixDQUFoQjs7QUFFQSxhQUFTLGNBQVQsQ0FBd0IsTUFBeEIsRUFBZ0M7QUFDNUI7QUFDQSxlQUFRLDhCQUE2QixJQUE3QixDQUFrQyxNQUFsQztBQUFSO0FBQ0g7QUFDRCxNQUFFLFNBQUYsQ0FBWTtBQUNSLHFCQUFhLEtBREwsRUFDWTtBQUNwQixvQkFBWSxVQUFTLEdBQVQsRUFBYyxRQUFkLEVBQXdCO0FBQ2hDLGdCQUFJLENBQUMsZUFBZSxTQUFTLElBQXhCLENBQUwsRUFBb0M7QUFDaEMsb0JBQUksZ0JBQUosQ0FBcUIsYUFBckIsRUFBb0MsU0FBcEM7QUFDSDtBQUNKO0FB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SUFBSSxpQkFBSixDQUFzQixPQUF0QixFQUErQixnQkFBL0IsQ0FBVDs7QUFFQSxpQkFBUyxlQUFULENBQXlCLFNBQXpCLEVBQW1DO0FBQy9CO0FBQ0EsZ0JBQUksV0FBVyxnRUFBZjtBQUNBLGdCQUFJLFVBQVUsU0FBUyxJQUFULENBQWMsU0FBZCxFQUF5QixDQUF6QixDQUFkOztBQUVBO0FBQ0EsZ0JBQUcsUUFBUSxPQUFSLE1BQXFCLFNBQXhCLEVBQ0ksU0FBUyxPQUFUOztBQUVKLG9CQUFRLE9BQVIsSUFBbUIsSUFBbkI7QUFDSDs7QUFFRDtBQUNBLFdBQUcsY0FBSCxHQUFvQixVQUFTLEdBQVQsRUFBYTs7QUFFN0I7QUFDQSxnQkFBRyxJQUFJLFNBQVAsRUFDSSxnQkFBZ0IsSUFBSSxTQUFKLENBQWMsU0FBOUI7QUFDUCxTQUxEOztBQU9BO0FBQ0EsV0FBRyxpQkFBSCxDQUFxQixFQUFyQjs7QUFFQTtBQUNBLFdBQUcsV0FBSCxDQUFlLFVBQVMsTUFBVCxFQUFnQjs7QUFFM0I7QUFDQSxlQUFHLG1CQUFILENBQXVCLE1BQXZCLEVBQStCLFlBQVUsQ0FBRSxDQUEzQyxFQUE2QyxZQUFVLENBQUUsQ0FBekQ7QUFFSCxTQUxELEVBS0csWUFBVSxDQUFFLENBTGY7O0FBT0E7QUFDQSxtQkFBVyxZQUFVO0FBQ2pCO0FBQ0EsZ0JBQUksUUFBUSxHQUFHLGdCQUFILENBQW9CLEdBQXBCLENBQXdCLEtBQXhCLENBQThCLElBQTlCLENBQVo7O0FBRUEsa0JBQU0sT0FBTixDQUFjLFVBQVMsSUFBVCxFQUFjO0FBQ3hCLG9CQUFHLEtBQUssT0FBTCxDQUFhLGNBQWIsTUFBaUMsQ0FBcEMsRUFDSSxnQkFBZ0IsSUFBaEI7QUFDUCxhQUhEO0FBSUgsU0FSRCxFQVFHLElBUkg7QUFTSDtBQUVKLENBL09EIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiQoZnVuY3Rpb24oKSB7XG5cbiAgICBmdW5jdGlvbiBnZXRDb29raWUobmFtZSkge1xuICAgICAgdmFyIGNvb2tpZVZhbHVlID0gbnVsbDtcbiAgICAgIGlmIChkb2N1bWVudC5jb29raWUgJiYgZG9jdW1lbnQuY29va2llICE9ICcnKSB7XG4gICAgICAgICAgdmFyIGNvb2tpZXMgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb2tpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgdmFyIGNvb2tpZSA9IGpRdWVyeS50cmltKGNvb2tpZXNbaV0pO1xuICAgICAgICAgICAgICAvLyBEb2VzIHRoaXMgY29va2llIHN0cmluZyBiZWdpbiB3aXRoIHRoZSBuYW1lIHdlIHdhbnQ/XG4gICAgICAgICAgICAgIGlmIChjb29raWUuc3Vic3RyaW5nKDAsIG5hbWUubGVuZ3RoICsgMSkgPT0gKG5hbWUgKyAnPScpKSB7XG4gICAgICAgICAgICAgICAgICBjb29raWVWYWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudChjb29raWUuc3Vic3RyaW5nKG5hbWUubGVuZ3RoICsgMSkpO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY29va2llVmFsdWU7XG4gICAgfVxuICAgIHZhciBjc3JmdG9rZW4gPSBnZXRDb29raWUoJ2NzcmZ0b2tlbicpO1xuXG4gICAgZnVuY3Rpb24gY3NyZlNhZmVNZXRob2QobWV0aG9kKSB7XG4gICAgICAgIC8vIHRoZXNlIEhUVFAgbWV0aG9kcyBkbyBub3QgcmVxdWlyZSBDU1JGIHByb3RlY3Rpb25cbiAgICAgICAgcmV0dXJuICgvXihHRVR8SEVBRHxPUFRJT05TfFRSQUNFKSQvLnRlc3QobWV0aG9kKSk7XG4gICAgfVxuICAgICQuYWpheFNldHVwKHtcbiAgICAgICAgY3Jvc3NEb21haW46IGZhbHNlLCAvLyBvYnZpYXRlcyBuZWVkIGZvciBzYW1lT3JpZ2luIHRlc3RcbiAgICAgICAgYmVmb3JlU2VuZDogZnVuY3Rpb24oeGhyLCBzZXR0aW5ncykge1xuICAgICAgICAgICAgaWYgKCFjc3JmU2FmZU1ldGhvZChzZXR0aW5ncy50eXBlKSkge1xuICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiWC1DU1JGVG9rZW5cIiwgY3NyZnRva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGNhbnZhcyA9ICQoJyNtYXAtY2FudmFzJykuZ2V0KDApO1xuICAgIHZhciBsYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDM1Ljc5MjYyMSAsIDEzOS44MDY1MTMpO1xuICAgIHZhciBtYXBPcHRpb25zID0ge1xuICAgICAgICAgIHpvb206IDE1LFxuICAgICAgICAgIGNlbnRlcjogbGF0bG5nICxcbiAgICAgICAgfTtcbiAgICB2YXIgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcCggY2FudmFzICwgbWFwT3B0aW9ucyApIDtcbiAgICB2YXIgY2lyY2xlX2xpc3QgPSBuZXcgZ29vZ2xlLm1hcHMuTVZDQXJyYXkoKTtcbiAgICB2YXIgY3VycmVudE1hcmtlciA9IG51bGxcblxuICAgIHNldE1hcmtlcigpO1xuXG4gICAgLy8g44Oc44K/44Oz44Kv44Oq44OD44Kv44Gn54++5Zyo5L2N572u5pu05pawICYg55m66KaL56K66KqNXG4gICAgJCgnI2J0bicpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgbWFya2VyVXBkYXRlKCk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBzZXRNYXJrZXIgKCkge1xuICAgICAgICAvLyDnj77lnKjlnLDooajnpLpcbiAgICAgICAgaWYgKCEgbmF2aWdhdG9yLmdlb2xvY2F0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihmdW5jdGlvbihwb3MpIHtcbiAgICAgICAgICAgIC8vIHZhciBjdXJyZW50UG9zID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhwb3MuY29vcmRzLmxhdGl0dWRlICsgTWF0aC5yYW5kb20oKSAqIDAuMDA1ICsgMC4wMDEsIHBvcy5jb29yZHMubG9uZ2l0dWRlICsgTWF0aC5yYW5kb20oKSAqIDAuMDA1ICsgMC4wMDEpO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRQb3MgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDM1LjQ3NTAxNSArIE1hdGgucmFuZG9tKCkgKiAwLjAwNSArIDAuMDAxLCAxMzMuMDY3NTE4ICsgTWF0aC5yYW5kb20oKSAqIDAuMDA1ICsgMC4wMDEpO1xuICAgICAgICAgICAgY3VycmVudE1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogY3VycmVudFBvc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRNYXAobWFwKTtcbiAgICAgICAgICAgIG1hcC5wYW5UbyhjdXJyZW50UG9zKTtcblxuICAgICAgICAgICAgLy8g55m76Yyy44K544Od44OD44OI6KGo56S6XG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogJy9hcHAvYXBpL3Nwb3RzLycsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5LmVhY2gocmVzLCBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNwb3RQb3MgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKHZhbC5sYXQsIHZhbC5sb25nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXN0YW5jZSA9IGdvb2dsZS5tYXBzLmdlb21ldHJ5LnNwaGVyaWNhbC5jb21wdXRlRGlzdGFuY2VCZXR3ZWVuKGN1cnJlbnRQb3MsIHNwb3RQb3MpIC8gMTAwMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g54++5Zyo5L2N572u44GL44KJ44Gu6Led6Zui44GMIDUwMG0g5Lul5YaF44GL44GkIOeZuuimi+WbnuaVsOOBjCA15ZueIOacqua6gOOBruWgtOWQiOOCqOODquOCouihqOekulxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codmFsLmNvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSA8PSAxLjUgJiYgdmFsLmNvdW50IDwgMjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbG9yID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2godHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgdmFsLmNvdW50ID4gNTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yID0gJyNGRjE0OTMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSB2YWwuY291bnQgPiA0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSAnI0ZGREFCOSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHZhbC5jb3VudCA+IDM6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA9ICcjRkZGOERDJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA9ICcjMDBCRkZGJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZm93aW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdyh7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwOiBtYXBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNwb3RDaXJjbGUgPSBuZXcgZ29vZ2xlLm1hcHMuQ2lyY2xlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg44CA44CA44CAIGNlbnRlcjogc3BvdFBvcywgICAgICAgLy8g5Lit5b+D54K5KGdvb2dsZS5tYXBzLkxhdExuZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbENvbG9yOiBjb2xvciwgICAvLyDloZfjgorjgaTjgbbjgZfoibJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbE9wYWNpdHk6IDAuNSwgICAgICAgLy8g5aGX44KK44Gk44G244GX6YCP6YGO5bqm77yIMDog6YCP5piOIOKHlCAxOuS4jemAj+aYju+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXA6IG1hcCwgICAgICAgICAgICAgLy8g6KGo56S644GV44Gb44KL5Zyw5Zuz77yIZ29vZ2xlLm1hcHMuTWFw77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhZGl1czogNTAsICAgICAgICAgIC8vIOWNiuW+hO+8iO+9je+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvcjogY29sb3IsIC8vIOWkluWRqOiJslxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VPcGFjaXR5OiAxLCAgICAgICAvLyDlpJblkajpgI/pgY7luqbvvIgwOiDpgI/mmI4g4oeUIDE65LiN6YCP5piO77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdlaWdodDogMSwgICAgICAgICAvLyDlpJblkajlpKrjgZXvvIjjg5Tjgq/jgrvjg6vvvIlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHZhbC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogdmFsLmNvdW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNpcmNsZV9saXN0LnB1c2goc3BvdENpcmNsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIoc3BvdENpcmNsZSwgJ21vdXNlb3ZlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnRpdGxlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuc2V0UG9zaXRpb24odGhpcy5nZXRDZW50ZXIoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvd2luZG93LnNldENvbnRlbnQoXCI8Yj5cIiArIHRoaXMudGl0bGUgKyBcIjwvYj48YnI+PGI+55m66KaL5Lq65pWw77yaXCIgKyB0aGlzLmNvdW50ICsgXCI8L2I+XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mb3dpbmRvdy5vcGVuKG1hcCwgbWFya2VyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5zZXRWaXNpYmxlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHNwb3RDaXJjbGUsICdtb3VzZW91dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mb3dpbmRvdy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlIDw9IDAuMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRJUHMoZnVuY3Rpb24oaXApe2ZvdW5kU3BvdCh2YWwuaWQsIGlwLCB2YWwubmFtZSk7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ+eZu+mMsuOCueODneODg+ODiOOCkuWPluW+l+OBp+OBjeOBvuOBm+OCk+OBp+OBl+OBn+OAgicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGFsZXJ0KCdHUFPjg4fjg7zjgr/jgpLlj5blvpfjgafjgY3jgb7jgZvjgpPjgafjgZfjgZ8nKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm91bmRTcG90KHNwb3RJZCwgaXAsIG5hbWUpIHtcbiAgICAgICAgLy8g55m76Yyy44K544Od44OD44OI6KGo56S6XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICB1cmw6ICcvYXBwL2FwaS9jb3VudHMvJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBkYXRhIDoge3Nwb3QgOiBzcG90SWQsIGlwYWRkciA6IGlwIH0sXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoXCLjgrnjg53jg4Pjg4jvvJpcIiArIG5hbWUgKyBcIiDjgavjgZ/jganjgornnYDjgY3jgb7jgZfjgZ/vvIFcIilcbiAgICAgICAgICAgICAgICBtYXJrZXJVcGRhdGUoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfnmbropovnmbvpjLLjgavlpLHmlZfjgZfjgb7jgZfjgZ/jgIInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFya2VyVXBkYXRlKCkge1xuICAgICAgICAvLyDjg57jg7zjgqvjg7zmm7TmlrBcbiAgICAgICAgY2lyY2xlX2xpc3QuZm9yRWFjaChmdW5jdGlvbihtYXJrZXIsIGlkeCkge1xuICAgICAgICAgICAgbWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICBzZXRNYXJrZXIoKTtcbiAgICB9XG5cbiAgICAvL2dldCB0aGUgSVAgYWRkcmVzc2VzIGFzc29jaWF0ZWQgd2l0aCBhbiBhY2NvdW50XG4gICAgZnVuY3Rpb24gZ2V0SVBzKGNhbGxiYWNrKXtcbiAgICAgICAgdmFyIGlwX2R1cHMgPSB7fTtcblxuICAgICAgICAvL2NvbXBhdGliaWxpdHkgZm9yIGZpcmVmb3ggYW5kIGNocm9tZVxuICAgICAgICB2YXIgUlRDUGVlckNvbm5lY3Rpb24gPSB3aW5kb3cuUlRDUGVlckNvbm5lY3Rpb25cbiAgICAgICAgfHwgd2luZG93Lm1velJUQ1BlZXJDb25uZWN0aW9uXG4gICAgICAgIHx8IHdpbmRvdy53ZWJraXRSVENQZWVyQ29ubmVjdGlvbjtcbiAgICAgICAgdmFyIHVzZVdlYktpdCA9ICEhd2luZG93LndlYmtpdFJUQ1BlZXJDb25uZWN0aW9uO1xuXG4gICAgICAgIC8vYnlwYXNzIG5haXZlIHdlYnJ0YyBibG9ja2luZyB1c2luZyBhbiBpZnJhbWVcbiAgICAgICAgaWYoIVJUQ1BlZXJDb25uZWN0aW9uKXtcbiAgICAgICAgICAgIC8vTk9URTogeW91IG5lZWQgdG8gaGF2ZSBhbiBpZnJhbWUgaW4gdGhlIHBhZ2UgcmlnaHQgYWJvdmUgdGhlIHNjcmlwdCB0YWdcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLzxpZnJhbWUgaWQ9XCJpZnJhbWVcIiBzYW5kYm94PVwiYWxsb3ctc2FtZS1vcmlnaW5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmVcIj48L2lmcmFtZT5cbiAgICAgICAgICAgIC8vPHNjcmlwdD4uLi5nZXRJUHMgY2FsbGVkIGluIGhlcmUuLi5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICB2YXIgd2luID0gaWZyYW1lLmNvbnRlbnRXaW5kb3c7XG4gICAgICAgICAgICBSVENQZWVyQ29ubmVjdGlvbiA9IHdpbi5SVENQZWVyQ29ubmVjdGlvblxuICAgICAgICAgICAgfHwgd2luLm1velJUQ1BlZXJDb25uZWN0aW9uXG4gICAgICAgICAgICB8fCB3aW4ud2Via2l0UlRDUGVlckNvbm5lY3Rpb247XG4gICAgICAgICAgICB1c2VXZWJLaXQgPSAhIXdpbi53ZWJraXRSVENQZWVyQ29ubmVjdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vbWluaW1hbCByZXF1aXJlbWVudHMgZm9yIGRhdGEgY29ubmVjdGlvblxuICAgICAgICB2YXIgbWVkaWFDb25zdHJhaW50cyA9IHtcbiAgICAgICAgICAgIG9wdGlvbmFsOiBbe1J0cERhdGFDaGFubmVsczogdHJ1ZX1dXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHNlcnZlcnMgPSB7aWNlU2VydmVyczogW3t1cmxzOiBcInN0dW46c3R1bi5zZXJ2aWNlcy5tb3ppbGxhLmNvbVwifV19O1xuXG4gICAgICAgIC8vY29uc3RydWN0IGEgbmV3IFJUQ1BlZXJDb25uZWN0aW9uXG4gICAgICAgIHZhciBwYyA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbihzZXJ2ZXJzLCBtZWRpYUNvbnN0cmFpbnRzKTtcblxuICAgICAgICBmdW5jdGlvbiBoYW5kbGVDYW5kaWRhdGUoY2FuZGlkYXRlKXtcbiAgICAgICAgICAgIC8vbWF0Y2gganVzdCB0aGUgSVAgYWRkcmVzc1xuICAgICAgICAgICAgdmFyIGlwX3JlZ2V4ID0gLyhbMC05XXsxLDN9KFxcLlswLTldezEsM30pezN9fFthLWYwLTldezEsNH0oOlthLWYwLTldezEsNH0pezd9KS9cbiAgICAgICAgICAgIHZhciBpcF9hZGRyID0gaXBfcmVnZXguZXhlYyhjYW5kaWRhdGUpWzFdO1xuXG4gICAgICAgICAgICAvL3JlbW92ZSBkdXBsaWNhdGVzXG4gICAgICAgICAgICBpZihpcF9kdXBzW2lwX2FkZHJdID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soaXBfYWRkcik7XG5cbiAgICAgICAgICAgIGlwX2R1cHNbaXBfYWRkcl0gPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9saXN0ZW4gZm9yIGNhbmRpZGF0ZSBldmVudHNcbiAgICAgICAgcGMub25pY2VjYW5kaWRhdGUgPSBmdW5jdGlvbihpY2Upe1xuXG4gICAgICAgICAgICAvL3NraXAgbm9uLWNhbmRpZGF0ZSBldmVudHNcbiAgICAgICAgICAgIGlmKGljZS5jYW5kaWRhdGUpXG4gICAgICAgICAgICAgICAgaGFuZGxlQ2FuZGlkYXRlKGljZS5jYW5kaWRhdGUuY2FuZGlkYXRlKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvL2NyZWF0ZSBhIGJvZ3VzIGRhdGEgY2hhbm5lbFxuICAgICAgICBwYy5jcmVhdGVEYXRhQ2hhbm5lbChcIlwiKTtcblxuICAgICAgICAvL2NyZWF0ZSBhbiBvZmZlciBzZHBcbiAgICAgICAgcGMuY3JlYXRlT2ZmZXIoZnVuY3Rpb24ocmVzdWx0KXtcblxuICAgICAgICAgICAgLy90cmlnZ2VyIHRoZSBzdHVuIHNlcnZlciByZXF1ZXN0XG4gICAgICAgICAgICBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKHJlc3VsdCwgZnVuY3Rpb24oKXt9LCBmdW5jdGlvbigpe30pO1xuXG4gICAgICAgIH0sIGZ1bmN0aW9uKCl7fSk7XG5cbiAgICAgICAgLy93YWl0IGZvciBhIHdoaWxlIHRvIGxldCBldmVyeXRoaW5nIGRvbmVcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy9yZWFkIGNhbmRpZGF0ZSBpbmZvIGZyb20gbG9jYWwgZGVzY3JpcHRpb25cbiAgICAgICAgICAgIHZhciBsaW5lcyA9IHBjLmxvY2FsRGVzY3JpcHRpb24uc2RwLnNwbGl0KCdcXG4nKTtcblxuICAgICAgICAgICAgbGluZXMuZm9yRWFjaChmdW5jdGlvbihsaW5lKXtcbiAgICAgICAgICAgICAgICBpZihsaW5lLmluZGV4T2YoJ2E9Y2FuZGlkYXRlOicpID09PSAwKVxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVDYW5kaWRhdGUobGluZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxuXG59KTtcbiJdfQ==
