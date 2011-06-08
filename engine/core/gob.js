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

var Gob = (function() {
    var gobs = {};
    var Gob = {};

    function add(id, spriteid, frame, pos, vel, z, scale) {
      var basesprite = spriteid;
      var sprite = Sprites.spritedictionary[spriteid];
      if (!sprite) {
        // go looking for non-sprite sheet version
        sprite = Sprites.spritedictionary[spriteid+"0"];
      }
      if (frame >= sprite.frames || sprite.no_anim) {
        frame = 0;
      }
      scale = (scale || 1.0) * GameFrame.settings.sprite_scale;
      gobs[id] = {id: id, spriteid: basesprite, frame: frame, pos: pos, vel: vel, theta: (vel ? Math.atan2(vel[1],vel[0]) : 0), scale: scale, z: (z ? z : Math.random() * 2000), dirty: true, time: Tick.current, atime: Tick.current, animate: false, discon: true};
      return gobs[id];
    }

    function addSimple(id, spriteid, pos, z, frame, scale) {
      return add(id, spriteid, frame, pos, [0,0], z, scale ? scale : 1);
    }

    function del(id) {
      var gobel = document.getElementById(id);
      if (gobel)
        gobel.parentNode.removeChild(gobel);

      delete gobs[id];
    }

    function delAll() {
      for (var id in gobs) {
        del(id);
      }
      gobs = {};
      Gob.gobs = gobs;
    }

    function numFrames(id) {
      var gob = gobs[id];
      var sprite = Sprites.spritedictionary[gob.spriteid];
      if (!sprite) {
        // go looking for non-sprite sheet version
        sprite = Sprites.spritedictionary[gob.spriteid+"0"];
      }
      return sprite.frames;
    }

    function framedata(id) {
      var gob = gobs[id];
      var spid = gob.spriteid;
      var frame = gob.frame;
      var oframe = gob.frame;
      var animating = true;
      var sprite;
      if (!GameFrame.settings.sprite_sheets) {
        sprite = Sprites.spritedictionary[spid];
        if (!sprite) {
          spid += gob.frame;
          frame = 0;
          animating = true;
          sprite = Sprites.spritedictionary[spid];
        } else {
          animating = sprite.frames > 1 ? true : false;
        }
      } else {
        sprite = Sprites.spritedictionary[spid];
        animating = sprite.frames > 1 ? true : false;
      }
      var offset = sprite.framepos[frame];
      if (!sprite.no_anim) {
        gob.frame++;
      }
      gob.frame = gob.frame % sprite.frames;
      var pos = [gob.pos[0] - sprite.width * 0.5, gob.pos[1] - sprite.height * 0.5];
      if (GameFrame.settings.int_snap) {
        pos = [pos[0]|0,pos[1]|0];
      }

      var retval = {dirty: gob.dirty, animating: animating,
                    pos: pos,
                    theta: gob.theta, discon: gob.discon,
                    scale: gob.scale,
                    size: [sprite.width, sprite.height],
                    x: offset[0] * sprite.width,
                    y: offset[1] * sprite.height,
                    url: sprite.url, spriteid: gob.spriteid,
                    image: sprite.imageel,
                    frame: gob.frame,
                    oframe: oframe,
                    sprite: sprite};
      gob.dirty = false;
      return retval;
    }

    Gob.update = function(gob) {
      gob.dirty = true;
      Partition.gob2grid(gob);
    }

    function move(id, delta, t) {
      var gob = gobs[id];

      if (gob.dirty)
        return;

      if (!gob.discon && GameFrame.settings.css_transitions && (t - gob.time < 0.90 * GameFrame.settings.transition_time))
        return;

      gob.pos[0] += gob.vel[0] * (t - gob.time) * 0.01;
      gob.pos[1] += gob.vel[1] * (t - gob.time) * 0.01;

      if (gob.vel) {
        gob.theta = Math.atan2(gob.vel[1],gob.vel[0]);
      }

      gob.dirty = true;
      gob.discon = false;
      gob.time = t;

      if (gob.pos[0] > Browser.w) {
        gob.pos[0] = 0;
        gob.discon = true;
      } else if (gob.pos[0] < 0) {
        gob.pos[0] = Browser.w - 1;
        gob.discon = true;
      }
      if (gob.pos[1] > Browser.h) {
        gob.pos[1] = 0;
        gob.discon = true;
      } else if (gob.pos[1] < 0) {
        gob.pos[1] = Browser.h - 1;
        gob.discon = true;
      }
    }

    function movegobs(delta) {
      for (var i in gobs) {
        move(i, delta, Tick.current);
      }
    }

    Gob.add = add;
    Gob.addSimple = addSimple;
    Gob.del = del;
    Gob.delAll = delAll;
    Gob.movegobs = movegobs;
    Gob.framedata = framedata;
    Gob.numFrames = numFrames;
    Gob.gobs = gobs;
    return Gob;
  })();
