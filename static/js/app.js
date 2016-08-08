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
    var current_marker_list = new google.maps.MVCArray();
    var l = 8;

    var str = "abcdefghijklmnopqrstuvwxyz0123456789";
    var strl = str.length;
    var code = "";
    for (var i = 0; i < 8; i++) {
        code += str[Math.floor(Math.random() * strl)];
    }

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
                success: function (res) {
                    jQuery.each(res, function (key, val) {
                        var spotPos = new google.maps.LatLng(val.lat, val.long);
                        var distance = google.maps.geometry.spherical.computeDistanceBetween(currentPos, spotPos) / 1000;

                        // 現在位置からの距離が 500m 以内かつ 発見回数が 5回 未満の場合エリア表示
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
                                count: val.count,
                                id: val.id,
                                description: val.description
                            });
                            circle_list.push(spotCircle);
                            google.maps.event.addListener(spotCircle, 'mouseover', function () {
                                if (typeof this.title !== "undefined") {
                                    marker.setPosition(this.getCenter());
                                    infowindow.setContent("<b>" + this.title + "</b><br><b>発見人数：" + this.count + "</b><br><b>説明：" + this.description + "</b>");
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
                error: function () {
                    console.log('登録スポットを取得できませんでした。');
                }
            });
        }, function () {
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
            data: { spot: spot.id, ipaddr: code },
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
        circle_list.forEach(function (marker, idx) {
            marker.setMap(null);
        });
        current_marker_list.forEach(function (marker, idx) {
            marker.setMap(null);
        });
        setMarker();
    }
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWMvanMvYXBwLmVzNiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLEVBQUUsWUFBVzs7QUFFVCxhQUFTLFNBQVQsQ0FBbUIsSUFBbkIsRUFBeUI7QUFDdkIsWUFBSSxjQUFjLElBQWxCO0FBQ0EsWUFBSSxTQUFTLE1BQVQsSUFBbUIsU0FBUyxNQUFULElBQW1CLEVBQTFDLEVBQThDO0FBQzFDLGdCQUFJLFVBQVUsU0FBUyxNQUFULENBQWdCLEtBQWhCLENBQXNCLEdBQXRCLENBQWQ7QUFDQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFFBQVEsTUFBNUIsRUFBb0MsR0FBcEMsRUFBeUM7QUFDckMsb0JBQUksU0FBUyxPQUFPLElBQVAsQ0FBWSxRQUFRLENBQVIsQ0FBWixDQUFiO0FBQ0E7QUFDQSxvQkFBSSxPQUFPLFNBQVAsQ0FBaUIsQ0FBakIsRUFBb0IsS0FBSyxNQUFMLEdBQWMsQ0FBbEMsS0FBeUMsT0FBTyxHQUFwRCxFQUEwRDtBQUN0RCxrQ0FBYyxtQkFBbUIsT0FBTyxTQUFQLENBQWlCLEtBQUssTUFBTCxHQUFjLENBQS9CLENBQW5CLENBQWQ7QUFDQTtBQUNIO0FBQ0o7QUFDSjtBQUNELGVBQU8sV0FBUDtBQUNEO0FBQ0QsUUFBSSxZQUFZLFVBQVUsV0FBVixDQUFoQjs7QUFFQSxhQUFTLGNBQVQsQ0FBd0IsTUFBeEIsRUFBZ0M7QUFDNUI7QUFDQSxlQUFRLDhCQUE2QixJQUE3QixDQUFrQyxNQUFsQztBQUFSO0FBQ0g7QUFDRCxNQUFFLFNBQUYsQ0FBWTtBQUNSLHFCQUFhLEtBREwsRUFDWTtBQUNwQixvQkFBWSxVQUFTLEdBQVQsRUFBYyxRQUFkLEVBQXdCO0FBQ2hDLGdCQUFJLENBQUMsZUFBZSxTQUFTLElBQXhCLENBQUwsRUFBb0M7QUFDaEMsb0JBQUksZ0JBQUosQ0FBcUIsYUFBckIsRUFBb0MsU0FBcEM7QUFDSDtBQUNKO0FB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QVY7QUFDSDtBQUNKO0FBQ0oscUJBeEREO0FBeURILGlCQTlERTtBQStESCx1QkFBTyxZQUFXO0FBQ2QsNEJBQVEsR0FBUixDQUFZLG9CQUFaO0FBQ0g7QUFqRUUsYUFBUDtBQW1FSCxTQTlFRCxFQThFRyxZQUFXO0FBQ1Ysa0JBQU0sbUJBQU47QUFDQSxtQkFBTyxLQUFQO0FBQ0gsU0FqRkQ7QUFrRkg7O0FBRUQsYUFBUyxTQUFULENBQW1CLElBQW5CLEVBQXlCO0FBQ3JCO0FBQ0EsVUFBRSxJQUFGLENBQU87QUFDSCxrQkFBTSxNQURIO0FBRUgsaUJBQUssa0JBRkY7QUFHSCxzQkFBVSxNQUhQO0FBSUgsa0JBQU8sRUFBQyxNQUFPLEtBQUssRUFBYixFQUFpQixRQUFTLElBQTFCLEVBSko7QUFLSCxxQkFBUyxVQUFVLEdBQVYsRUFBZTtBQUNwQixxQkFBSyxLQUFMO0FBQ0Esa0JBQUUsVUFBRixFQUFjLElBQWQsQ0FBbUIsVUFBVSxLQUFLLEtBQWYsR0FBdUIsYUFBMUM7QUFDQSxrQkFBRSxRQUFGLEVBQVksSUFBWixDQUFpQixXQUFXLEtBQUssS0FBaEIsR0FBd0IsVUFBekM7QUFDQSxxQkFBSyxNQUFMLENBQVksR0FBWjtBQUNILGFBVkU7QUFXSCxtQkFBTyxZQUFZO0FBQ2Ysd0JBQVEsR0FBUixDQUFZLGNBQVo7QUFDSDtBQWJFLFNBQVA7QUFlSDs7QUFFRCxhQUFTLFlBQVQsR0FBd0I7QUFDcEI7QUFDQSxvQkFBWSxPQUFaLENBQW9CLFVBQVMsTUFBVCxFQUFpQixHQUFqQixFQUFzQjtBQUN0QyxtQkFBTyxNQUFQLENBQWMsSUFBZDtBQUNILFNBRkQ7QUFHQSw0QkFBb0IsT0FBcEIsQ0FBNEIsVUFBUyxNQUFULEVBQWlCLEdBQWpCLEVBQXNCO0FBQzlDLG1CQUFPLE1BQVAsQ0FBYyxJQUFkO0FBQ0gsU0FGRDtBQUdBO0FBQ0g7QUFDSixDQWhMRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIkKGZ1bmN0aW9uKCkge1xuXG4gICAgZnVuY3Rpb24gZ2V0Q29va2llKG5hbWUpIHtcbiAgICAgIHZhciBjb29raWVWYWx1ZSA9IG51bGw7XG4gICAgICBpZiAoZG9jdW1lbnQuY29va2llICYmIGRvY3VtZW50LmNvb2tpZSAhPSAnJykge1xuICAgICAgICAgIHZhciBjb29raWVzID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7Jyk7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb29raWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIHZhciBjb29raWUgPSBqUXVlcnkudHJpbShjb29raWVzW2ldKTtcbiAgICAgICAgICAgICAgLy8gRG9lcyB0aGlzIGNvb2tpZSBzdHJpbmcgYmVnaW4gd2l0aCB0aGUgbmFtZSB3ZSB3YW50P1xuICAgICAgICAgICAgICBpZiAoY29va2llLnN1YnN0cmluZygwLCBuYW1lLmxlbmd0aCArIDEpID09IChuYW1lICsgJz0nKSkge1xuICAgICAgICAgICAgICAgICAgY29va2llVmFsdWUgPSBkZWNvZGVVUklDb21wb25lbnQoY29va2llLnN1YnN0cmluZyhuYW1lLmxlbmd0aCArIDEpKTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGNvb2tpZVZhbHVlO1xuICAgIH1cbiAgICB2YXIgY3NyZnRva2VuID0gZ2V0Q29va2llKCdjc3JmdG9rZW4nKTtcblxuICAgIGZ1bmN0aW9uIGNzcmZTYWZlTWV0aG9kKG1ldGhvZCkge1xuICAgICAgICAvLyB0aGVzZSBIVFRQIG1ldGhvZHMgZG8gbm90IHJlcXVpcmUgQ1NSRiBwcm90ZWN0aW9uXG4gICAgICAgIHJldHVybiAoL14oR0VUfEhFQUR8T1BUSU9OU3xUUkFDRSkkLy50ZXN0KG1ldGhvZCkpO1xuICAgIH1cbiAgICAkLmFqYXhTZXR1cCh7XG4gICAgICAgIGNyb3NzRG9tYWluOiBmYWxzZSwgLy8gb2J2aWF0ZXMgbmVlZCBmb3Igc2FtZU9yaWdpbiB0ZXN0XG4gICAgICAgIGJlZm9yZVNlbmQ6IGZ1bmN0aW9uKHhociwgc2V0dGluZ3MpIHtcbiAgICAgICAgICAgIGlmICghY3NyZlNhZmVNZXRob2Qoc2V0dGluZ3MudHlwZSkpIHtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlgtQ1NSRlRva2VuXCIsIGNzcmZ0b2tlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBjYW52YXMgPSAkKCcjbWFwLWNhbnZhcycpLmdldCgwKTtcbiAgICB2YXIgbGF0bG5nID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZygzNS43OTI2MjEgLCAxMzkuODA2NTEzKTtcbiAgICB2YXIgbWFwT3B0aW9ucyA9IHtcbiAgICAgICAgICB6b29tOiAxNSxcbiAgICAgICAgICBjZW50ZXI6IGxhdGxuZyAsXG4gICAgICAgIH07XG4gICAgdmFyIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoIGNhbnZhcyAsIG1hcE9wdGlvbnMgKSA7XG4gICAgdmFyIGNpcmNsZV9saXN0ID0gbmV3IGdvb2dsZS5tYXBzLk1WQ0FycmF5KCk7XG4gICAgdmFyIGN1cnJlbnRfbWFya2VyX2xpc3QgPSBuZXcgZ29vZ2xlLm1hcHMuTVZDQXJyYXkoKTtcbiAgICB2YXIgbCA9IDg7XG5cblxuICAgIHZhciBzdHIgPSBcImFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OVwiO1xuICAgIHZhciBzdHJsID0gc3RyLmxlbmd0aDtcbiAgICB2YXIgY29kZSA9IFwiXCI7XG4gICAgZm9yKHZhciBpPTA7IGk8ODsgaSsrKXtcbiAgICAgICAgY29kZSArPSBzdHJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKnN0cmwpXTtcbiAgICB9XG5cbiAgICBzZXRNYXJrZXIoKTtcblxuICAgIC8vIOODnOOCv+ODs+OCr+ODquODg+OCr+OBp+ePvuWcqOS9jee9ruabtOaWsCAmIOeZuuimi+eiuuiqjVxuICAgICQoJyNidG4nKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIG1hcmtlclVwZGF0ZSgpO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gc2V0TWFya2VyICgpIHtcbiAgICAgICAgLy8g54++5Zyo5Zyw6KGo56S6XG4gICAgICAgIGlmICghIG5hdmlnYXRvci5nZW9sb2NhdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oZnVuY3Rpb24ocG9zKSB7XG4gICAgICAgICAgICAvLyB2YXIgY3VycmVudFBvcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcocG9zLmNvb3Jkcy5sYXRpdHVkZSArIE1hdGgucmFuZG9tKCkgKiAwLjAwNSArIDAuMDAxLCBwb3MuY29vcmRzLmxvbmdpdHVkZSArIE1hdGgucmFuZG9tKCkgKiAwLjAwNSArIDAuMDAxKTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50UG9zID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZygzNS40NzYwMjUgKyBNYXRoLnJhbmRvbSgpICogMC4wMDggKyAwLjAwMSwgMTMzLjA0NzUxOCArIE1hdGgucmFuZG9tKCkgKiAwLjAwOCArIDAuMDAxKTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50TWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBjdXJyZW50UG9zXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldE1hcChtYXApO1xuICAgICAgICAgICAgY3VycmVudF9tYXJrZXJfbGlzdC5wdXNoKGN1cnJlbnRNYXJrZXIpO1xuICAgICAgICAgICAgbWFwLnBhblRvKGN1cnJlbnRQb3MpO1xuXG4gICAgICAgICAgICAvLyDnmbvpjLLjgrnjg53jg4Pjg4jooajnpLpcbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnL2FwcC9hcGkvc3BvdHMvJyxcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgICAgICAgICBqUXVlcnkuZWFjaChyZXMsIGZ1bmN0aW9uKGtleSwgdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3BvdFBvcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcodmFsLmxhdCwgdmFsLmxvbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpc3RhbmNlID0gZ29vZ2xlLm1hcHMuZ2VvbWV0cnkuc3BoZXJpY2FsLmNvbXB1dGVEaXN0YW5jZUJldHdlZW4oY3VycmVudFBvcywgc3BvdFBvcykgLyAxMDAwO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDnj77lnKjkvY3nva7jgYvjgonjga7ot53pm6LjgYwgNTAwbSDku6XlhoXjgYvjgaQg55m66KaL5Zue5pWw44GMIDXlm54g5pyq5rqA44Gu5aC05ZCI44Ko44Oq44Ki6KGo56S6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgPD0gMS41ICYmIHZhbC5jb3VudCA8IDIwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbG9yID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCh0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgdmFsLmNvdW50ID4gNTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yID0gJyNGRjE0OTMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHZhbC5jb3VudCA+IDQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA9ICcjRkZEQUI5J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSB2YWwuY291bnQgPiAzOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSAnI0ZGRjhEQydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA9ICcjMDBCRkZGJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZm93aW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdyh7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwOiBtYXBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNwb3RDaXJjbGUgPSBuZXcgZ29vZ2xlLm1hcHMuQ2lyY2xlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg44CA44CA44CAIGNlbnRlcjogc3BvdFBvcywgICAgICAgLy8g5Lit5b+D54K5KGdvb2dsZS5tYXBzLkxhdExuZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbENvbG9yOiBjb2xvciwgICAvLyDloZfjgorjgaTjgbbjgZfoibJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbE9wYWNpdHk6IDAuNSwgICAgICAgLy8g5aGX44KK44Gk44G244GX6YCP6YGO5bqm77yIMDog6YCP5piOIOKHlCAxOuS4jemAj+aYju+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXA6IG1hcCwgICAgICAgICAgICAgLy8g6KGo56S644GV44Gb44KL5Zyw5Zuz77yIZ29vZ2xlLm1hcHMuTWFw77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhZGl1czogNTAsICAgICAgICAgIC8vIOWNiuW+hO+8iO+9je+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VDb2xvcjogY29sb3IsIC8vIOWkluWRqOiJslxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VPcGFjaXR5OiAxLCAgICAgICAvLyDlpJblkajpgI/pgY7luqbvvIgwOiDpgI/mmI4g4oeUIDE65LiN6YCP5piO77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdlaWdodDogMSwgICAgICAgICAvLyDlpJblkajlpKrjgZXvvIjjg5Tjgq/jgrvjg6vvvIlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHZhbC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogdmFsLmNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdmFsLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdmFsLmRlc2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNpcmNsZV9saXN0LnB1c2goc3BvdENpcmNsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIoc3BvdENpcmNsZSwgJ21vdXNlb3ZlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnRpdGxlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuc2V0UG9zaXRpb24odGhpcy5nZXRDZW50ZXIoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvd2luZG93LnNldENvbnRlbnQoXCI8Yj5cIiArIHRoaXMudGl0bGUgKyBcIjwvYj48YnI+PGI+55m66KaL5Lq65pWw77yaXCIgKyB0aGlzLmNvdW50ICsgXCI8L2I+PGJyPjxiPuiqrOaYju+8mlwiICsgdGhpcy5kZXNjcmlwdGlvbiArIFwiPC9iPlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm93aW5kb3cub3BlbihtYXAsIG1hcmtlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuc2V0VmlzaWJsZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihzcG90Q2lyY2xlLCAnbW91c2VvdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm93aW5kb3cuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSA8PSAwLjMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRTcG90KHNwb3RDaXJjbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfnmbvpjLLjgrnjg53jg4Pjg4jjgpLlj5blvpfjgafjgY3jgb7jgZvjgpPjgafjgZfjgZ/jgIInKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhbGVydCgnR1BT44OH44O844K/44KS5Y+W5b6X44Gn44GN44G+44Gb44KT44Gn44GX44GfJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvdW5kU3BvdChzcG90KSB7XG4gICAgICAgIC8vIOeZu+mMsuOCueODneODg+ODiOihqOekulxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgdXJsOiAnL2FwcC9hcGkvY291bnRzLycsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgZGF0YSA6IHtzcG90IDogc3BvdC5pZCwgaXBhZGRyIDogY29kZSB9LFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgICAgIHNwb3QuY291bnQrKztcbiAgICAgICAgICAgICAgICAkKCcjbWVzc2FnZScpLmh0bWwoXCLjgrnjg53jg4Pjg4jvvJpcIiArIHNwb3QudGl0bGUgKyBcIiDjgavjgZ/jganjgornnYDjgY3jgb7jgZfjgZ/vvIFcIik7XG4gICAgICAgICAgICAgICAgJCgnI2NvdW50JykuaHRtbChcIueZuuimi+S6uuaVsOOBryBcIiArIHNwb3QuY291bnQgKyBcIiDjgavjgarjgorjgb7jgZfjgZ/jgIJcIik7XG4gICAgICAgICAgICAgICAgc3BvdC5zZXRNYXAobWFwKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfnmbropovnmbvpjLLjgavlpLHmlZfjgZfjgb7jgZfjgZ/jgIInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFya2VyVXBkYXRlKCkge1xuICAgICAgICAvLyDjg57jg7zjgqvjg7zmm7TmlrBcbiAgICAgICAgY2lyY2xlX2xpc3QuZm9yRWFjaChmdW5jdGlvbihtYXJrZXIsIGlkeCkge1xuICAgICAgICAgICAgbWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRfbWFya2VyX2xpc3QuZm9yRWFjaChmdW5jdGlvbihtYXJrZXIsIGlkeCkge1xuICAgICAgICAgICAgbWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNldE1hcmtlcigpO1xuICAgIH1cbn0pOyJdfQ==
