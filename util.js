// JSON.stringify(req.headers)

function DumpObject(obj)
{    
  var od = new Object;
  var result = "";
  var len = 0;

  for (var property in obj)
  {
      
    var value = obj[property];
    if (typeof value == 'string')
      value = "'" + value + "'";
    else if (typeof value == 'object')
    {        
      if (value instanceof Array)
      {
          
        value = "[ " + value + " ]";
      }
      else
      {     
        var ood = DumpObject(value);
        value = "{ " + ood.dump + " }";
      }
    }
    result += "'" + property + "' : " + value + ", ";
    len++;
  }
  od.dump = result.replace(/, $/, "");
  od.len = len;

  return od.dump;
}

function dir(obj){
    var res = "";
    try{
        var str = JSON.stringify(obj,null,2); // sys.inspect
        res = str;
    } catch (x) {
    }
    return res;
}

exports.dir = dir;