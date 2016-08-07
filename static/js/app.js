(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
class Person {
    // The 'class' keyword
    constructor(name, age) {
        // Constructors
        this.name = name;
        this.age = age;
    }
}

class Developer extends Person {
    // The 'extends' keyword
    constructor(name, age, ...languages) {
        // Rest parameters
        super(name, age); // Super calls
        this.languages = [...languages]; // The spread operator
    }
    printLanguages() {
        // Short method definitions
        for (let lang of this.languages) {
            // The for..of loop
            console.log(lang);
        }
    }
}

let me = new Developer("James", 23, "ES5", "ES6"); // Block scoping

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWMvanMvYXBwLmVzNiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLE1BQU0sTUFBTixDQUFhO0FBQTJDO0FBQ3BELGdCQUFZLElBQVosRUFBa0IsR0FBbEIsRUFBdUI7QUFBNkI7QUFDaEQsYUFBSyxJQUFMLEdBQVksSUFBWjtBQUNBLGFBQUssR0FBTCxHQUFXLEdBQVg7QUFDSDtBQUpROztBQU9iLE1BQU0sU0FBTixTQUF3QixNQUF4QixDQUErQjtBQUF5QjtBQUNwRCxnQkFBWSxJQUFaLEVBQWtCLEdBQWxCLEVBQXVCLEdBQUcsU0FBMUIsRUFBcUM7QUFBZTtBQUNoRCxjQUFNLElBQU4sRUFBWSxHQUFaLEVBRGlDLENBQ2U7QUFDaEQsYUFBSyxTQUFMLEdBQWlCLENBQUMsR0FBRyxTQUFKLENBQWpCLENBRmlDLENBRWU7QUFDbkQ7QUFDRCxxQkFBaUI7QUFBbUM7QUFDaEQsYUFBSSxJQUFJLElBQVIsSUFBZ0IsS0FBSyxTQUFyQixFQUFnQztBQUFnQjtBQUM1QyxvQkFBUSxHQUFSLENBQVksSUFBWjtBQUNIO0FBQ0o7QUFUMEI7O0FBWS9CLElBQUksS0FBSyxJQUFJLFNBQUosQ0FBYyxPQUFkLEVBQXVCLEVBQXZCLEVBQTJCLEtBQTNCLEVBQWtDLEtBQWxDLENBQVQsQyxDQUF1RCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjbGFzcyBQZXJzb24geyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSAnY2xhc3MnIGtleXdvcmRcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCBhZ2UpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29uc3RydWN0b3JzXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuYWdlID0gYWdlO1xuICAgIH1cbn1cblxuY2xhc3MgRGV2ZWxvcGVyIGV4dGVuZHMgUGVyc29uIHsgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgJ2V4dGVuZHMnIGtleXdvcmRcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCBhZ2UsIC4uLmxhbmd1YWdlcykgeyAgICAgICAgICAgICAgLy8gUmVzdCBwYXJhbWV0ZXJzXG4gICAgICAgIHN1cGVyKG5hbWUsIGFnZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN1cGVyIGNhbGxzXG4gICAgICAgIHRoaXMubGFuZ3VhZ2VzID0gWy4uLmxhbmd1YWdlc107ICAgICAgICAgICAgICAgIC8vIFRoZSBzcHJlYWQgb3BlcmF0b3JcbiAgICB9XG4gICAgcHJpbnRMYW5ndWFnZXMoKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNob3J0IG1ldGhvZCBkZWZpbml0aW9uc1xuICAgICAgICBmb3IobGV0IGxhbmcgb2YgdGhpcy5sYW5ndWFnZXMpIHsgICAgICAgICAgICAgICAvLyBUaGUgZm9yLi5vZiBsb29wXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhsYW5nKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxubGV0IG1lID0gbmV3IERldmVsb3BlcihcIkphbWVzXCIsIDIzLCBcIkVTNVwiLCBcIkVTNlwiKTsgICAgIC8vIEJsb2NrIHNjb3BpbmdcbiJdfQ==
