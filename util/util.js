var sprintf = require('./sprintf');

function inRange(idx, array) {
  return idx >= 0 && idx < array.length;
}


// ========================================
// modifying javascript global behavior
// NOTE: doesn't work outside of this function.
function addFormatToString() {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        console.log("match num" + match + " " + number);
        return typeof args[number] != 'undefined'
          ? args[number]
          : '{' + number + '}'
          ;
      });
  };
  console.log("string.prototype:{0}".format('yes'));
}



exports.inRange = inRange;
exports.addFormatToString = addFormatToString;
exports.sprintf = sprintf.sprintf;
