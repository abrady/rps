// Copyright 2004-present Facebook. All Rights Reserved.

// Licensed under the Apache License, Version 2.0 (the "License"); you may
// not use this file except in compliance with the License. You may obtain
// a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

var UI = (function() {
    function uiElement() {
      return FB.$('ui') || UI.makeBox(FB.$('gameui'),'ui',[0,0],[0,0]);
    }

    function removeTree(name) {
      var cell = document.getElementById(name);
      if (cell) {
        while (cell.childNodes.length >= 1) {
          cell.removeChild(cell.firstChild);       
        } 
        cell.parentNode.removeChild(cell);
      }
    }

    function makeBox(parent,name,pos,size,class_name) {
      if (!parent) {
        parent = uiElement();
      }
      var style='left:'+pos[0]+'px;top:'+pos[1]+'px;width:'+size[0]+'px;height:'+size[1]+'px;position:absolute;z-index:10000;align:top;'
      var el = FB.$(name);
      if (!el) {
        el = document.createElement('div');
        el.id = name;
        el.className = class_name;
        parent.appendChild(el);
        if (!el) {
          console.log('xx');
        }
      }
      el.style.cssText = style;
      return el;
    }

    function uiPos(pos_type,size) {
      var pos = [];
      var winsize = [Browser.w,Browser.h];
      for(var i=0;i<2;i++) {
        switch(pos_type[i]) {
          case 'Start':
            pos[i] = 0;
            break;
          case 'Middle':
            pos[i] = (winsize[i] - size[i])/2;
            break;
          case 'End':
            pos[i] = winsize[i] - size[i];
            break;
          default:
            pos[i] = pos_type[i];
        }
      }
      return pos;
    }

    function button(name, pos_type, cb) {
      var size = [150, 60];
      pos = uiPos(pos_type,size);
      var button = makeBox(uiElement(),name,pos,size,'button_class');
      button.innerHTML = name;
      //var click = Browser.mobile ? 'ontouchstart' : 'onmousedown';
      click = 'onclick';
      button[click] = cb;
    }

    function addHTML(ignore,name,obj) {
      var box = makeBox(uiElement(),name,obj.pos,[obj.width, obj.height],obj.uiclass);
      if (box) {
        box.innerHTML = obj.markup;
      }
    }
    
    function init() {
    }
    
    return {
      removeTree: removeTree,
      makeBox: makeBox,
      uiPos: uiPos,
      button: button,
      addHTML: addHTML,
      init: init
    };
  })();
