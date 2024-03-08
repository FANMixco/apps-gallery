String.prototype.format = function() {
    let formatted = this;
    for (let arg in arguments)
        formatted = formatted.replace(`{${arg}}`, arguments[arg]);
    return formatted;
 };
 
 String.prototype.replaceAll = function(search, replacement) {
     var target = this;
     return target.replace(new RegExp(search, 'g'), replacement);
 };