var RPS = (function() {
    var game_state = 'login';
    var old_game_state = "";
    var Start = 'Start', Middle = 'Middle', End = 'End';    

    function gameState() {
      return game_state;
    }    

    function newGameState(state) {
      if (state == game_state) {
        return;
      }
      UI.removeTree('ui');
      game_state = state;
      if (state == 'menu') {
        Publish.getRequests(game_state);
        request_time = 0;
        menu_time = (new Date).getTime();
      }
    }

    function tick() {
      if (game_state == 'login' && Publish.isLoggedIn()) {
        newGameState('menu');
      }
        

      // periodically poll for new requests
      if (game_state == 'menu') {
        var dt = parseInt(((new Date).getTime() - menu_time) / 1000);
        if (dt > request_time) {
          Publish.getRequests(game_state);
          request_time += Math.sqrt(dt);
        }
      }
      
      if (old_game_state != game_state) {
        var size = [300,55];
        old_game_state = game_state;
        switch (game_state) {
          case 'login':
            UI.button('Login',[Start,Start], Publish.fbLogin);
            break;
          case 'menu':
            var markup = '<form name="input" action="cheevo_update" method="get">\
            Achievement: <input type="text" name="cheevo" />\
            Score:       <input type="text" name="score" />\
                <input type="submit" value="Submit" />\
            </form>';
            UI.addHTML(null,'cheevo_update',{ pos: [5, 55], markup: markup })
            break;
        default:
            console.log('unknown state ' + game_state);
            game_state = 'login';
        }
      }
    }
    
    function init() {
      GameFrame.updateSettings({
        render_mode: GameFrame.HTML_ONLY,
        update_existing: true,
        use_div_background: true,
        css_transitions: false,
        css_keyframe: false,
        sprite_sheets: true,
        int_snap: true,
        hidefps: true,
        transform3d:true});

      GameFrame.setXbyY();
      Input.hookEvents('gamebody');
      newGameState('login');
      Publish.fbInit(fb_app_id);
    }

    function resize() {
      old_game_state = '';  // force recalc
    }
               
    function draw() {
    }

    function postLoad() {
    }
               
    Init.setFunctions({app: tick, init: init, draw: draw, resize: resize, postLoad: postLoad, fps:60 });

    function beep() {
      console.log('beep');    
    }

    return {
      newGameState: newGameState,
      gameState : gameState
    }
})();