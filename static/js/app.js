(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
$(function () {
    var canvas = $('#map-canvas').get(0);
    var latlng = new google.maps.LatLng(35.792621, 139.806513);
    var mapOptions = {
        zoom: 15,
        center: latlng
    };
    var map = new google.maps.Map(canvas, mapOptions);

    setMarker();

    function setMarker() {
        // 現在地表示
        if (!navigator.geolocation) {
            return false;
        }
        navigator.geolocation.getCurrentPosition(function (pos) {
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
                success: function (res) {
                    jQuery.each(res, function (key, val) {
                        var spotPos = new google.maps.LatLng(val.lat, val.long);
                        var distance = google.maps.geometry.spherical.computeDistanceBetween(currentPos, spotPos) / 1000;
                        if (distance <= 1) {
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
                error: function () {
                    alert('登録スポットを取得できませんでした。');
                }
            });
        }, function () {
            alert('GPSデータを取得できませんでした');
            return false;
        });
    }
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWMvanMvYXBwLmVzNiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLEVBQUUsWUFBVztBQUNULFFBQUksU0FBUyxFQUFFLGFBQUYsRUFBaUIsR0FBakIsQ0FBcUIsQ0FBckIsQ0FBYjtBQUNBLFFBQUksU0FBUyxJQUFJLE9BQU8sSUFBUCxDQUFZLE1BQWhCLENBQXVCLFNBQXZCLEVBQW1DLFVBQW5DLENBQWI7QUFDQSxRQUFJLGFBQWE7QUFDWCxjQUFNLEVBREs7QUFFWCxnQkFBUTtBQUZHLEtBQWpCO0FBSUEsUUFBSSxNQUFNLElBQUksT0FBTyxJQUFQLENBQVksR0FBaEIsQ0FBcUIsTUFBckIsRUFBOEIsVUFBOUIsQ0FBVjs7QUFFQTs7QUFFQSxhQUFTLFNBQVQsR0FBc0I7QUFDbEI7QUFDQSxZQUFJLENBQUUsVUFBVSxXQUFoQixFQUE2QjtBQUN6QixtQkFBTyxLQUFQO0FBQ0g7QUFDRCxrQkFBVSxXQUFWLENBQXNCLGtCQUF0QixDQUF5QyxVQUFTLEdBQVQsRUFBYztBQUNuRCxnQkFBSSxhQUFhLElBQUksT0FBTyxJQUFQLENBQVksTUFBaEIsQ0FBdUIsSUFBSSxNQUFKLENBQVcsUUFBbEMsRUFBNEMsSUFBSSxNQUFKLENBQVcsU0FBdkQsQ0FBakI7QUFDQSxnQkFBSSxnQkFBZ0IsSUFBSSxPQUFPLElBQVAsQ0FBWSxNQUFoQixDQUF1QjtBQUNuQywwQkFBVTtBQUR5QixhQUF2QixDQUFwQjtBQUdBLDBCQUFjLE1BQWQsQ0FBcUIsR0FBckI7QUFDQSxnQkFBSSxLQUFKLENBQVUsVUFBVjs7QUFFQTtBQUNBLGNBQUUsSUFBRixDQUFPO0FBQ0gsc0JBQU0sS0FESDtBQUVILHFCQUFLLGlCQUZGO0FBR0gsMEJBQVUsTUFIUDtBQUlILHlCQUFTLFVBQVMsR0FBVCxFQUFjO0FBQ25CLDJCQUFPLElBQVAsQ0FBWSxHQUFaLEVBQWlCLFVBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUI7QUFDaEMsNEJBQUksVUFBVSxJQUFJLE9BQU8sSUFBUCxDQUFZLE1BQWhCLENBQXVCLElBQUksR0FBM0IsRUFBZ0MsSUFBSSxJQUFwQyxDQUFkO0FBQ0EsNEJBQUksV0FBVyxPQUFPLElBQVAsQ0FBWSxRQUFaLENBQXFCLFNBQXJCLENBQStCLHNCQUEvQixDQUFzRCxVQUF0RCxFQUFrRSxPQUFsRSxJQUE2RSxJQUE1RjtBQUNBLDRCQUFJLFlBQVksQ0FBaEIsRUFBbUI7QUFDZixnQ0FBSSxhQUFhLElBQUksT0FBTyxJQUFQLENBQVksVUFBaEIsQ0FBMkIsRUFBM0IsQ0FBakI7QUFDQSxnQ0FBSSxTQUFTLElBQUksT0FBTyxJQUFQLENBQVksTUFBaEIsQ0FBdUI7QUFDNUIscUNBQUs7QUFEdUIsNkJBQXZCLENBQWI7QUFHQSxnQ0FBSSxhQUFhLElBQUksT0FBTyxJQUFQLENBQVksTUFBaEIsQ0FBdUI7QUFDaEMsd0NBQVEsT0FEd0IsRUFDVDtBQUNyQiwyQ0FBVyxTQUZtQixFQUVOO0FBQ3hCLDZDQUFhLEdBSGlCLEVBR047QUFDeEIscUNBQUssR0FKeUIsRUFJUjtBQUN0Qix3Q0FBUSxFQUxzQixFQUtUO0FBQ3JCLDZDQUFhLFNBTmlCLEVBTU47QUFDeEIsK0NBQWUsQ0FQZSxFQU9OO0FBQ3hCLDhDQUFjLENBUmdCLEVBUUw7QUFDekIsdUNBQU8sSUFBSSxJQVRtQjtBQVU5Qiw2Q0FBYSxJQUFJO0FBVmEsNkJBQXZCLENBQWpCO0FBWUksbUNBQU8sSUFBUCxDQUFZLEtBQVosQ0FBa0IsV0FBbEIsQ0FBOEIsVUFBOUIsRUFBMEMsV0FBMUMsRUFBdUQsWUFBWTtBQUMvRCxvQ0FBSSxPQUFPLEtBQUssS0FBWixLQUFzQixXQUExQixFQUF1QztBQUNuQywyQ0FBTyxXQUFQLENBQW1CLEtBQUssU0FBTCxFQUFuQjtBQUNBLCtDQUFXLFVBQVgsQ0FBc0IsUUFBUSxLQUFLLEtBQWIsR0FBcUIsa0JBQXJCLEdBQTBDLEtBQUssV0FBL0MsR0FBNkQsTUFBbkY7QUFDQSwrQ0FBVyxJQUFYLENBQWdCLEdBQWhCLEVBQXFCLE1BQXJCO0FBQ0EsMkNBQU8sVUFBUCxDQUFrQixLQUFsQjtBQUNKO0FBQ0gsNkJBUEQ7QUFRQSxtQ0FBTyxJQUFQLENBQVksS0FBWixDQUFrQixXQUFsQixDQUE4QixVQUE5QixFQUEwQyxVQUExQyxFQUFzRCxZQUFZO0FBQzlELDJDQUFXLEtBQVg7QUFDSCw2QkFGRDtBQUdQO0FBQ0oscUJBaENEO0FBaUNILGlCQXRDRTtBQXVDSCx1QkFBTyxZQUFXO0FBQ2QsMEJBQU0sb0JBQU47QUFDSDtBQXpDRSxhQUFQO0FBMkNILFNBcERELEVBb0RHLFlBQVc7QUFDVixrQkFBTSxtQkFBTjtBQUNBLG1CQUFPLEtBQVA7QUFDSCxTQXZERDtBQXdESDtBQUNKLENBekVEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9ICQoJyNtYXAtY2FudmFzJykuZ2V0KDApO1xuICAgIHZhciBsYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDM1Ljc5MjYyMSAsIDEzOS44MDY1MTMpO1xuICAgIHZhciBtYXBPcHRpb25zID0ge1xuICAgICAgICAgIHpvb206IDE1LFxuICAgICAgICAgIGNlbnRlcjogbGF0bG5nICxcbiAgICAgICAgfTtcbiAgICB2YXIgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcCggY2FudmFzICwgbWFwT3B0aW9ucyApIDtcblxuICAgIHNldE1hcmtlcigpO1xuXG4gICAgZnVuY3Rpb24gc2V0TWFya2VyICgpIHtcbiAgICAgICAgLy8g54++5Zyo5Zyw6KGo56S6XG4gICAgICAgIGlmICghIG5hdmlnYXRvci5nZW9sb2NhdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oZnVuY3Rpb24ocG9zKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudFBvcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcocG9zLmNvb3Jkcy5sYXRpdHVkZSwgcG9zLmNvb3Jkcy5sb25naXR1ZGUpO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRNYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGN1cnJlbnRQb3NcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0TWFwKG1hcCk7XG4gICAgICAgICAgICBtYXAucGFuVG8oY3VycmVudFBvcyk7XG5cbiAgICAgICAgICAgIC8vIOeZu+mMsuOCueODneODg+ODiOihqOekulxuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBwL2FwaS9zcG90cy8nLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeS5lYWNoKHJlcywgZnVuY3Rpb24oa2V5LCB2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcG90UG9zID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyh2YWwubGF0LCB2YWwubG9uZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGlzdGFuY2UgPSBnb29nbGUubWFwcy5nZW9tZXRyeS5zcGhlcmljYWwuY29tcHV0ZURpc3RhbmNlQmV0d2VlbihjdXJyZW50UG9zLCBzcG90UG9zKSAvIDEwMDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmZvd2luZG93ID0gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coe30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcDogbWFwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcG90Q2lyY2xlID0gbmV3IGdvb2dsZS5tYXBzLkNpcmNsZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOOAgOOAgOOAgCBjZW50ZXI6IHNwb3RQb3MsICAgICAgIC8vIOS4reW/g+eCuShnb29nbGUubWFwcy5MYXRMbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGxDb2xvcjogJyNmZjAwMDAnLCAgIC8vIOWhl+OCiuOBpOOBtuOBl+iJslxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsT3BhY2l0eTogMC41LCAgICAgICAvLyDloZfjgorjgaTjgbbjgZfpgI/pgY7luqbvvIgwOiDpgI/mmI4g4oeUIDE65LiN6YCP5piO77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcDogbWFwLCAgICAgICAgICAgICAvLyDooajnpLrjgZXjgZvjgovlnLDlm7PvvIhnb29nbGUubWFwcy5NYXDvvIlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiA1MCwgICAgICAgICAgLy8g5Y2K5b6E77yI772N77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAnI2ZmMDAwMCcsIC8vIOWkluWRqOiJslxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2VPcGFjaXR5OiAxLCAgICAgICAvLyDlpJblkajpgI/pgY7luqbvvIgwOiDpgI/mmI4g4oeUIDE65LiN6YCP5piO77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdlaWdodDogMSwgICAgICAgICAvLyDlpJblkajlpKrjgZXvvIjjg5Tjgq/jgrvjg6vvvIlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHZhbC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFjaF9jb3VudDogdmFsLnJlYWNoX2NvdW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihzcG90Q2lyY2xlLCAnbW91c2VvdmVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnRpdGxlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLnNldFBvc2l0aW9uKHRoaXMuZ2V0Q2VudGVyKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm93aW5kb3cuc2V0Q29udGVudChcIjxiPlwiICsgdGhpcy50aXRsZSArIFwiPC9iPjxicj48Yj7nmbropovkurrmlbDvvJpcIiArIHRoaXMucmVhY2hfY291bnQgKyBcIjwvYj5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mb3dpbmRvdy5vcGVuKG1hcCwgbWFya2VyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuc2V0VmlzaWJsZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHNwb3RDaXJjbGUsICdtb3VzZW91dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm93aW5kb3cuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgn55m76Yyy44K544Od44OD44OI44KS5Y+W5b6X44Gn44GN44G+44Gb44KT44Gn44GX44Gf44CCJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYWxlcnQoJ0dQU+ODh+ODvOOCv+OCkuWPluW+l+OBp+OBjeOBvuOBm+OCk+OBp+OBl+OBnycpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG59KTsiXX0=
