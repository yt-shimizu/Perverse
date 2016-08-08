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
            data: { spot: spot.id, ipaddr: "127.0.0.1" },
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWMvanMvYXBwLmVzNiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLEVBQUUsWUFBVzs7QUFFVCxhQUFTLFNBQVQsQ0FBbUIsSUFBbkIsRUFBeUI7QUFDdkIsWUFBSSxjQUFjLElBQWxCO0FBQ0EsWUFBSSxTQUFTLE1BQVQsSUFBbUIsU0FBUyxNQUFULElBQW1CLEVBQTFDLEVBQThDO0FBQzFDLGdCQUFJLFVBQVUsU0FBUyxNQUFULENBQWdCLEtBQWhCLENBQXNCLEdBQXRCLENBQWQ7QUFDQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFFBQVEsTUFBNUIsRUFBb0MsR0FBcEMsRUFBeUM7QUFDckMsb0JBQUksU0FBUyxPQUFPLElBQVAsQ0FBWSxRQUFRLENBQVIsQ0FBWixDQUFiO0FBQ0E7QUFDQSxvQkFBSSxPQUFPLFNBQVAsQ0FBaUIsQ0FBakIsRUFBb0IsS0FBSyxNQUFMLEdBQWMsQ0FBbEMsS0FBeUMsT0FBTyxHQUFwRCxFQUEwRDtBQUN0RCxrQ0FBYyxtQkFBbUIsT0FBTyxTQUFQLENBQWlCLEtBQUssTUFBTCxHQUFjLENBQS9CLENBQW5CLENBQWQ7QUFDQTtBQUNIO0FBQ0o7QUFDSjtBQUNELGVBQU8sV0FBUDtBQUNEO0FBQ0QsUUFBSSxZQUFZLFVBQVUsV0FBVixDQUFoQjs7QUFFQSxhQUFTLGNBQVQsQ0FBd0IsTUFBeEIsRUFBZ0M7QUFDNUI7QUFDQSxlQUFRLDhCQUE2QixJQUE3QixDQUFrQyxNQUFsQztBQUFSO0FBQ0g7QUFDRCxNQUFFLFNBQUYsQ0FBWTtBQUNSLHFCQUFhLEtBREwsRUFDWTtBQUNwQixvQkFBWSxVQUFTLEdBQVQsRUFBYyxRQUFkLEVBQXdCO0FBQ2hDLGdCQUFJLENBQUMsZUFBZSxTQUFTLElBQXhCLENBQUwsRUFBb0M7QUFDaEMsb0JBQUksZ0JBQUosQ0FBcUIsYUFBckIsRUFBb0MsU0FBcEM7QUFDSDtBQUNKO0FB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QUdILHNCQUFVLE1BSFA7QUFJSCxrQkFBTyxFQUFDLE1BQU8sS0FBSyxFQUFiLEVBQWlCLFFBQVMsV0FBMUIsRUFKSjtBQUtILHFCQUFTLFVBQVUsR0FBVixFQUFlO0FBQ3BCLHFCQUFLLEtBQUw7QUFDQSxrQkFBRSxVQUFGLEVBQWMsSUFBZCxDQUFtQixVQUFVLEtBQUssS0FBZixHQUF1QixhQUExQztBQUNBLGtCQUFFLFFBQUYsRUFBWSxJQUFaLENBQWlCLFdBQVcsS0FBSyxLQUFoQixHQUF3QixVQUF6QztBQUNBLHFCQUFLLE1BQUwsQ0FBWSxHQUFaO0FBQ0gsYUFWRTtBQVdILG1CQUFPLFlBQVk7QUFDZix3QkFBUSxHQUFSLENBQVksY0FBWjtBQUNIO0FBYkUsU0FBUDtBQWVIOztBQUVELGFBQVMsWUFBVCxHQUF3QjtBQUNwQjtBQUNBLG9CQUFZLE9BQVosQ0FBb0IsVUFBUyxNQUFULEVBQWlCLEdBQWpCLEVBQXNCO0FBQ3RDLG1CQUFPLE1BQVAsQ0FBYyxJQUFkO0FBQ0gsU0FGRDtBQUdBLDRCQUFvQixPQUFwQixDQUE0QixVQUFTLE1BQVQsRUFBaUIsR0FBakIsRUFBc0I7QUFDOUMsbUJBQU8sTUFBUCxDQUFjLElBQWQ7QUFDSCxTQUZEO0FBR0E7QUFDSDtBQUNKLENBdEtEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiQoZnVuY3Rpb24oKSB7XG5cbiAgICBmdW5jdGlvbiBnZXRDb29raWUobmFtZSkge1xuICAgICAgdmFyIGNvb2tpZVZhbHVlID0gbnVsbDtcbiAgICAgIGlmIChkb2N1bWVudC5jb29raWUgJiYgZG9jdW1lbnQuY29va2llICE9ICcnKSB7XG4gICAgICAgICAgdmFyIGNvb2tpZXMgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb2tpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgdmFyIGNvb2tpZSA9IGpRdWVyeS50cmltKGNvb2tpZXNbaV0pO1xuICAgICAgICAgICAgICAvLyBEb2VzIHRoaXMgY29va2llIHN0cmluZyBiZWdpbiB3aXRoIHRoZSBuYW1lIHdlIHdhbnQ/XG4gICAgICAgICAgICAgIGlmIChjb29raWUuc3Vic3RyaW5nKDAsIG5hbWUubGVuZ3RoICsgMSkgPT0gKG5hbWUgKyAnPScpKSB7XG4gICAgICAgICAgICAgICAgICBjb29raWVWYWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudChjb29raWUuc3Vic3RyaW5nKG5hbWUubGVuZ3RoICsgMSkpO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY29va2llVmFsdWU7XG4gICAgfVxuICAgIHZhciBjc3JmdG9rZW4gPSBnZXRDb29raWUoJ2NzcmZ0b2tlbicpO1xuXG4gICAgZnVuY3Rpb24gY3NyZlNhZmVNZXRob2QobWV0aG9kKSB7XG4gICAgICAgIC8vIHRoZXNlIEhUVFAgbWV0aG9kcyBkbyBub3QgcmVxdWlyZSBDU1JGIHByb3RlY3Rpb25cbiAgICAgICAgcmV0dXJuICgvXihHRVR8SEVBRHxPUFRJT05TfFRSQUNFKSQvLnRlc3QobWV0aG9kKSk7XG4gICAgfVxuICAgICQuYWpheFNldHVwKHtcbiAgICAgICAgY3Jvc3NEb21haW46IGZhbHNlLCAvLyBvYnZpYXRlcyBuZWVkIGZvciBzYW1lT3JpZ2luIHRlc3RcbiAgICAgICAgYmVmb3JlU2VuZDogZnVuY3Rpb24oeGhyLCBzZXR0aW5ncykge1xuICAgICAgICAgICAgaWYgKCFjc3JmU2FmZU1ldGhvZChzZXR0aW5ncy50eXBlKSkge1xuICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiWC1DU1JGVG9rZW5cIiwgY3NyZnRva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGNhbnZhcyA9ICQoJyNtYXAtY2FudmFzJykuZ2V0KDApO1xuICAgIHZhciBsYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDM1Ljc5MjYyMSAsIDEzOS44MDY1MTMpO1xuICAgIHZhciBtYXBPcHRpb25zID0ge1xuICAgICAgICAgIHpvb206IDE1LFxuICAgICAgICAgIGNlbnRlcjogbGF0bG5nICxcbiAgICAgICAgfTtcbiAgICB2YXIgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcCggY2FudmFzICwgbWFwT3B0aW9ucyApIDtcbiAgICB2YXIgY2lyY2xlX2xpc3QgPSBuZXcgZ29vZ2xlLm1hcHMuTVZDQXJyYXkoKTtcbiAgICB2YXIgY3VycmVudF9tYXJrZXJfbGlzdCA9IG5ldyBnb29nbGUubWFwcy5NVkNBcnJheSgpO1xuXG4gICAgc2V0TWFya2VyKCk7XG5cbiAgICAvLyDjg5zjgr/jg7Pjgq/jg6rjg4Pjgq/jgafnj77lnKjkvY3nva7mm7TmlrAgJiDnmbropovnorroqo1cbiAgICAkKCcjYnRuJykuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBtYXJrZXJVcGRhdGUoKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHNldE1hcmtlciAoKSB7XG4gICAgICAgIC8vIOePvuWcqOWcsOihqOekulxuICAgICAgICBpZiAoISBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGZ1bmN0aW9uKHBvcykge1xuICAgICAgICAgICAgLy8gdmFyIGN1cnJlbnRQb3MgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKHBvcy5jb29yZHMubGF0aXR1ZGUgKyBNYXRoLnJhbmRvbSgpICogMC4wMDUgKyAwLjAwMSwgcG9zLmNvb3Jkcy5sb25naXR1ZGUgKyBNYXRoLnJhbmRvbSgpICogMC4wMDUgKyAwLjAwMSk7XG4gICAgICAgICAgICB2YXIgY3VycmVudFBvcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMzUuNDc2MDI1ICsgTWF0aC5yYW5kb20oKSAqIDAuMDA4ICsgMC4wMDEsIDEzMy4wNDc1MTggKyBNYXRoLnJhbmRvbSgpICogMC4wMDggKyAwLjAwMSk7XG4gICAgICAgICAgICB2YXIgY3VycmVudE1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogY3VycmVudFBvc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRNYXAobWFwKTtcbiAgICAgICAgICAgIGN1cnJlbnRfbWFya2VyX2xpc3QucHVzaChjdXJyZW50TWFya2VyKTtcbiAgICAgICAgICAgIG1hcC5wYW5UbyhjdXJyZW50UG9zKTtcblxuICAgICAgICAgICAgLy8g55m76Yyy44K544Od44OD44OI6KGo56S6XG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogJy9hcHAvYXBpL3Nwb3RzLycsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5LmVhY2gocmVzLCBmdW5jdGlvbihrZXksIHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNwb3RQb3MgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKHZhbC5sYXQsIHZhbC5sb25nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXN0YW5jZSA9IGdvb2dsZS5tYXBzLmdlb21ldHJ5LnNwaGVyaWNhbC5jb21wdXRlRGlzdGFuY2VCZXR3ZWVuKGN1cnJlbnRQb3MsIHNwb3RQb3MpIC8gMTAwMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g54++5Zyo5L2N572u44GL44KJ44Gu6Led6Zui44GMIDUwMG0g5Lul5YaF44GL44GkIOeZuuimi+WbnuaVsOOBjCA15ZueIOacqua6gOOBruWgtOWQiOOCqOODquOCouihqOekulxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlIDw9IDEuNSAmJiB2YWwuY291bnQgPCAyMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2xvciA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2godHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHZhbC5jb3VudCA+IDU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvciA9ICcjRkYxNDkzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSB2YWwuY291bnQgPiA0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSAnI0ZGREFCOSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgdmFsLmNvdW50ID4gMzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yID0gJyNGRkY4REMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3IgPSAnIzAwQkZGRidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmZvd2luZG93ID0gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coe30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcDogbWFwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcG90Q2lyY2xlID0gbmV3IGdvb2dsZS5tYXBzLkNpcmNsZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOOAgOOAgOOAgCBjZW50ZXI6IHNwb3RQb3MsICAgICAgIC8vIOS4reW/g+eCuShnb29nbGUubWFwcy5MYXRMbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGxDb2xvcjogY29sb3IsICAgLy8g5aGX44KK44Gk44G244GX6ImyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGxPcGFjaXR5OiAwLjUsICAgICAgIC8vIOWhl+OCiuOBpOOBtuOBl+mAj+mBjuW6pu+8iDA6IOmAj+aYjiDih5QgMTrkuI3pgI/mmI7vvIlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwOiBtYXAsICAgICAgICAgICAgIC8vIOihqOekuuOBleOBm+OCi+WcsOWbs++8iGdvb2dsZS5tYXBzLk1hcO+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYWRpdXM6IDUwLCAgICAgICAgICAvLyDljYrlvoTvvIjvvY3vvIlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlQ29sb3I6IGNvbG9yLCAvLyDlpJblkajoibJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlT3BhY2l0eTogMSwgICAgICAgLy8g5aSW5ZGo6YCP6YGO5bqm77yIMDog6YCP5piOIOKHlCAxOuS4jemAj+aYju+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VXZWlnaHQ6IDEsICAgICAgICAgLy8g5aSW5ZGo5aSq44GV77yI44OU44Kv44K744Or77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiB2YWwubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHZhbC5jb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHZhbC5pZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaXJjbGVfbGlzdC5wdXNoKHNwb3RDaXJjbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHNwb3RDaXJjbGUsICdtb3VzZW92ZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy50aXRsZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLnNldFBvc2l0aW9uKHRoaXMuZ2V0Q2VudGVyKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mb3dpbmRvdy5zZXRDb250ZW50KFwiPGI+XCIgKyB0aGlzLnRpdGxlICsgXCI8L2I+PGJyPjxiPueZuuimi+S6uuaVsO+8mlwiICsgdGhpcy5jb3VudCArIFwiPC9iPlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm93aW5kb3cub3BlbihtYXAsIG1hcmtlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuc2V0VmlzaWJsZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihzcG90Q2lyY2xlLCAnbW91c2VvdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm93aW5kb3cuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSA8PSAwLjMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRTcG90KHNwb3RDaXJjbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfnmbvpjLLjgrnjg53jg4Pjg4jjgpLlj5blvpfjgafjgY3jgb7jgZvjgpPjgafjgZfjgZ/jgIInKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhbGVydCgnR1BT44OH44O844K/44KS5Y+W5b6X44Gn44GN44G+44Gb44KT44Gn44GX44GfJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvdW5kU3BvdChzcG90KSB7XG4gICAgICAgIC8vIOeZu+mMsuOCueODneODg+ODiOihqOekulxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgdXJsOiAnL2FwcC9hcGkvY291bnRzLycsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgZGF0YSA6IHtzcG90IDogc3BvdC5pZCwgaXBhZGRyIDogXCIxMjcuMC4wLjFcIiB9LFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgICAgIHNwb3QuY291bnQrKztcbiAgICAgICAgICAgICAgICAkKCcjbWVzc2FnZScpLmh0bWwoXCLjgrnjg53jg4Pjg4jvvJpcIiArIHNwb3QudGl0bGUgKyBcIiDjgavjgZ/jganjgornnYDjgY3jgb7jgZfjgZ/vvIFcIik7XG4gICAgICAgICAgICAgICAgJCgnI2NvdW50JykuaHRtbChcIueZuuimi+S6uuaVsOOBryBcIiArIHNwb3QuY291bnQgKyBcIiDjgavjgarjgorjgb7jgZfjgZ/jgIJcIik7XG4gICAgICAgICAgICAgICAgc3BvdC5zZXRNYXAobWFwKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCfnmbropovnmbvpjLLjgavlpLHmlZfjgZfjgb7jgZfjgZ/jgIInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFya2VyVXBkYXRlKCkge1xuICAgICAgICAvLyDjg57jg7zjgqvjg7zmm7TmlrBcbiAgICAgICAgY2lyY2xlX2xpc3QuZm9yRWFjaChmdW5jdGlvbihtYXJrZXIsIGlkeCkge1xuICAgICAgICAgICAgbWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGN1cnJlbnRfbWFya2VyX2xpc3QuZm9yRWFjaChmdW5jdGlvbihtYXJrZXIsIGlkeCkge1xuICAgICAgICAgICAgbWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNldE1hcmtlcigpO1xuICAgIH1cbn0pOyJdfQ==
