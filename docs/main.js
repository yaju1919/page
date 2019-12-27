(function() {
    'use strict';
    function BaseN(base){ // N進数を作成するクラス
        var len = base.length, reg = /^0+(?=.+$)/;
        this.encode = function(num){ // 10進数をN進数に変換
            if(isNaN(num)) return NaN;
            var str = "", v = num;
            while(v !== 0){
                v = Math.floor(v);
                str = base[v % len] + str;
                v /= len;
            }
            return str.replace(reg,"");
        };
        this.decode = function(str){ // N進数を10進数に変換
            return String(str).replace(reg,"").split("").reverse().map(function(v,i){
                return base.indexOf(v) * Math.pow(len, i);
            }).reduce(function(total, v){
                return total + v;
            });
        };
    }
    // 0 : 0~9 a~z A~Z → 無圧縮、左端に_(アンダーバー)を追加する
    // 1 : 62進数の一桁、左端に-(ハイフン)を追加する
    // 2 : 62進数の二桁、左端に.(ドット)を追加する
    // 3 : 62進数の三桁、左端に~(チルダ)を追加する
    var rule = {
        1: '-',
        2: '.',
        3: '~'
    };
    var base_str = [
        '0123456789',
        'abcdefghijklmnopqrstuvwxyz',
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    ].join('');
    var to62 = new BaseN(base_str);
    function repeat(char,count) {
        return Array(count*1+1).join(char);
    };
    function encode(str){
        return str.split('').map(function(v){
            if(base_str.indexOf(v) !== -1) return '_' + v + '_';
            else {
                var str = to62.encode(v.charCodeAt(0));
                var len = str.length;
                return rule[len] + (repeat('0',len) + str).slice(-len) + rule[len];
            }
        }).join('').replace(/(_|-|\.|~)\1/g,"").replace(/(_|-|\.|~)(?=(_|-|\.|~))/g,"").slice(0,-1);
    }
    function decode(str){
        return str.replace(/(_|-|\.|~)[^_\-\.~]*/g, function(v){
            var s = v.slice(1);
            if(v[0] === '_') return s;
            else {
                var digit;
                for(var k in rule){
                    if(v[0] === rule[k]){
                        digit = k;
                        break;
                    }
                }
                return s.replace(new RegExp(".{" + digit + "}", 'g'), function(n){
                    return String.fromCharCode(to62.decode(n));
                });
            }
        });
    }
    //---------------------------------------------------------------------------------
    var h = $("<div>").appendTo($("body").css({
        "text-align": "center"
    }));
    var q = {}, q_copy = {}; // クエリ
    location.search.slice(1).split('&').map(function(v){
        var ar = v.split('=');
        if(ar.length !== 2) return;
        q[ar[0]] = decode(ar[1]);
        q_copy[ar[0]] = q[ar[0]];
    });
    var reg_URL = /(https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)/g;
    //---------------------------------------------------------------------------------
    (q.edit === '0' ? view_mode : edit_mode)();
    function view_mode(){ // 閲覧モード
        if(reg_URL.test(q.img)) {
            $("body").css({
                "background-image": "url(" + q.img + ")",
                "background-color": "#464646", // 背景画像が読み込まれる前に表示される背景のカラー
            });
        }
        else $("body").css({"background-color": q.img});
        $("body").css({
            "color": q.font,
            "text-align": !q.pos || q.pos === "2" ? "center" : q.pos === "3" ? "right" : "left",
            padding: "1em"
        });
        if(!q.repeat || q.repeat === '0') {
            $("body").css({
                "background-attachment": "fixed", // コンテンツの高さが画像の高さより大きい時、動かないように固定
                "background-position": "center center",// 画像を常に天地左右の中央に配置
                "background-size": "cover", // 表示するコンテナの大きさに基づいて、背景画像を調整
                "background-repeat": "no-repeat", // 画像をタイル状に繰り返し表示しない
            });
        }
        var color = $("<span>").css("background-color",q.color).appendTo(h).hide().css('background-color').match(/[0-9]+/g);
        var rgba = "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + q.alpha + ")";
        h.css({
            background: rgba,
            padding: "1em",
            "border-radius": "20px 20px 20px 20px",
        });
        $("title").text(q.ttl ? q.ttl : "untitled");
        $("<h1>",{text: q.ttl}).appendTo(h);
        var MAX = 50;
        $("<div>").html(String(q.text).replace(/\n/g, "<br>").replace(reg_URL, function(url){
            if(q.auto && q.auto !== '0') return url;
            var url2 = url;
            if(url.length > MAX) url2 = url.slice(0,MAX) + '…';
            var a = $("<a>",{text: url2, href: url, src: url, target: "_blank"}).css({"max-width":"90%"});
            var btm = url.match(/\.[0-9a-zA-Z]+?$/);
            if(btm) {
                var btm2 = btm[0].slice(1);
                if([
                    "jpg","JPG","jpeg","JPEG","gif","png","bmp","svg","ico"
                ].indexOf(btm2) !== -1) $("<img>",{src: url, alt: url}).appendTo(a.text(''));
                else if([
                    "mp3","wma","wav","aac","ogg","m4a","flac"
                ].indexOf(btm2) !== -1) $("<audio>",{src: url, alt: url, controls: true}).appendTo(a.text(''));
                else if([
                    "mov","mp4","mpg","mpeg","avi","m4v","flv","wmv"
                ].indexOf(btm2) !== -1) $("<video>",{src: url, alt: url, controls: true, preload: "none"}).appendTo(a.text(''));
            }
            var Domain = getDomain(url), m, sub;
            switch(Domain){
                case "youtu.be": // YouTube
                    m = url.match(/youtu\.be\/([A-Za-z0-9_\-]+)/);
                case "youtube.com":
                    if(!m) m = url.match(/\?v=([A-Za-z0-9_\-]+)/);
                    if(!m) break;
                    sub = url.match(/t(=[0-9]+)/);
                    sub = sub ? "?start" + sub[1] : "";
                    $("<iframe>",{src: "//www.youtube.com/embed/" + m[1] + sub}).appendTo(a.text(''));
                    break;
                case "nicovideo.jp": // ニコニコ動画
                case "nico.ms":
                    m = url.match(/sm[0-9]+/);
                    if(!m) break;
                    sub = url.match(/from(=[0-9]+)/);
                    sub = sub ? "?from" + sub[1] : "";
                    $("<iframe>",{src: "//embed.nicovideo.jp/watch/" + m[0] + sub}).appendTo(a.text(''));
                    break;
            }
            return (a).prop("outerHTML");
        })).appendTo(h);
    }
    function getFQDN(url){ // urlのホストを抽出
        return url.replace(/^.+?\/\/|\/.*$/g,"");
    }
    function getDomain(url){ // urlのドメインを抽出(サードレベルドメイン非対応)
        return getFQDN(url).split(".").slice(-2).join(".");
    }
    //---------------------------------------------------------------------------------
    function edit_mode(){ // 編集モード
        $("title").text("簡易ホームページ作成ツール");
        $("<h1>",{text:"簡単な文書ページが作成できます。"}).appendTo(h);
        $("<h2>",{text:"どこからでもアクセスできるURLを生成し、他人と共有しましょう。"}).appendTo(h);
        $("<small>").appendTo(h).html("作品ページのURLの「https://yaju1919.github.io/docs/?edit=0」を「?edit=1」に変えて再度アクセスすると再編集ができます。");
        h.append("<br>");
        $("<a>",{target:"_blank",href:"https://www2.x-feeder.info/docs/",text:"作品はこちらで公開&保管できます。"}).appendTo(h);
        h.append("<br>");
        h.append("<br>");
        h.append("<br>");
        q.ttl = addInput("タイトル", "文書ページのタイトル");
        q.img = addInput("下層背景の色or画像", "カラーコードor画像のURL").val("https://i.imgur.com/iJ16x8q.jpg");
        q.repeat = addBtn_toggle("背景の画像を並べて表示する");
        q.color = addInput("上層背景の色", "RGB形式カラーコード").val("#000000");
        q.alpha = addInput("上層背景の透過度", "0~1").attr({
            type: "range",
            min: 0,
            max: 1,
            step: 0.01,
            value: 0.4
        });
        q.font = addInput("文字の色", "RGB形式カラーコード").val("#FFFFFF");
        q.pos = $("<select>").appendTo($("<span>",{text:"配置:"}).appendTo(h));
        $("<option>",{text:"左寄り"}).val(1).appendTo(q.pos);
        $("<option>",{text:"真ん中"}).val(2).appendTo(q.pos);
        $("<option>",{text:"右寄り"}).val(3).appendTo(q.pos);
        q.pos.val(2);
        h.append("<br>");
        q.auto = addBtn_toggle("自動的なURLのリンク化を無効");
        h.append("<br>");
        h.append("<br>");
        function shape(){
            var text = q.text.val();
            q.text.height((text.split('\n').length + 2) + "em");
            show_length.text("現在の文字数:"+text.length);
        }
        q.text = $("<textarea>", {
            placeholder: "本文の内容をここに書いてください。\n画像の拡張子が付いているURLは画像化されます。\nHTMLが使用できます。scriptタグは1行で記述してください。"
        }).appendTo(h).keyup(shape).click(shape).css({
            width: "70%",
            height: "3em"
        });
        var show_length = $("<div>").appendTo(h);
        var url = "";
        addBtn("URLを生成", function(){
            var array = [];
            array.push(["edit","0"]);
            for(var k in q) {
                if(!q[k].val) continue;
                var value = q[k].val();
                if(value.length === 0) continue;
                array.push([k, encode(value)]);
            }
            url = location.href.replace(/\?.*$/g,"") + '?' + array.map(function(v){
                return v.join('=');
            }).join('&');
            $("<div>",{text: "URLの長さ:"+url.length}).appendTo(show_url.empty());
            $("<a>",{text: url, href: url, target: "_blank"}).appendTo(show_url);
        });
        addBtn("コピー", function(){
            copy(url);
        });
        var show_url = $("<div>").appendTo(h);
        //---------------------------------------------------------------------
        if(location.search.length){
            for(var k in q) {
                if(q[k].val) q[k].val(q_copy[k]);
            }
        }
        //---------------------------------------------------------------------
        function addInput(title, placeholder){
            return $("<input>",{
                placeholder: placeholder
            }).appendTo($("<div>",{text: title + ':'}).appendTo(h));
        }
        function addBtn(title, func){
            return $("<button>",{text:title}).click(func).appendTo(h);
        }
        function addBtn_toggle(title, func, default_flag){
            var flag;
            function set(bool){
                flag = bool;
                btn.css("background-color", flag ? "orange" : "gray");
                check.prop("checked", flag);
                if(func) func(flag);
            }
            var btn = addBtn(title, function(){
                set(!flag);
            });
            var check = $("<input>",{type:"checkbox"}).prependTo(btn);
            set(default_flag);
            return {
                val: function(bool){
                    if(typeof bool === "string") set(bool !== '0');
                    else return flag ? '1' : '0';
                }
            };
        }
        function copy(str){
            var e = document.createElement("textarea");
            e.textContent = str;
            var body = document.getElementsByTagName("body")[0];
            body.appendChild(e);
            e.select();
            document.execCommand('copy');
            body.removeChild(e);
        }
    }
    //---------------------------------------------------------------------------------
})();
