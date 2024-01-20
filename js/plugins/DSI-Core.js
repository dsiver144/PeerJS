//=======================================================================
// * Plugin Name  : DSI-Core.js
// * Last Updated : 9/22/2023
//========================================================================
/*:
 * @plugindesc v2.01 A helper plugin for DSI plugins.
 * @author dsiver144
 * 
 * @param showDevTool:bool
 * @text Show Dev Tool On Startup
 * @default true
 * @type boolean
 * @desc true : Show | false: Hide
 * 
 * 
*/
/*~struct~PositionObject:
 * @param x:num
 * @desc X position
 * 
 * @param y:num
 * @desc Y Position
 * ex: {"x:num":"228","y:num":"661"}
 */
// Parse SE
var Imported = Imported || {};

Imported.DSI_Core = {};
Imported.DSI_Core.version = "2.0";

DSI_CORE = {};

DSI_CORE.parseArgs = function(types, args, defaultValues) {
    var result = JSON.parse(JSON.stringify(args));
    for (var i = 0; i < types.length; i++) {
        const type = types[i];
        switch(type) {
            case 's':
                result[i] = result[i] ? String(result[i]) : defaultValues[i];
                break;
            case 'i':
                result[i] = result[i] ? parseInt(result[i]) : defaultValues[i];
                break;
            case 'f':
                result[i] = result[i] ? parseInt(result[i]) : defaultValues[i];
                break;
        }
    }
    return result;
}

aS = function(bitmap, properties) {
    var sprite = new Sprite(bitmap);
    sprite.followMouse(true);
    SceneManager._scene.addChild(sprite);
    SceneManager._scene._lastSprite = sprite;
    for (k in properties) {
        sprite[k] = properties[k];
    }
    return sprite;
}

lS = function() {
    return SceneManager._scene._lastSprite;
};

gS = function() {
    return SceneManager._scene;
}

DSI_CORE.uuid = function () {
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

getWindows = function(name, recursive) {
    let scene = gS();
    let result = {};
    findWindows(result, scene, name, recursive);
    console.log(result);
}

DSI_CORE.drawSpriteToBitmap = function(sprite, targetBitmap, x, y) {
    const renderTexture = PIXI.RenderTexture.create(sprite.width, sprite.height);
    const renderer = Graphics.app.renderer;
    renderer.render(sprite, renderTexture);
    const canvas = renderer.extract.canvas(renderTexture);
    targetBitmap.context.drawImage(canvas, x, y);
}

findWindows = function(result, target, name, recursive) {
    for (k in target) {
        if (target[k] instanceof Window_Base) {
            result[name] = result[name] || {};
            result[name][k] = target[k];
            if (recursive) {
                findWindows(result, target[k], k, false);
            }
        }
    }
}

// Update To Lastest Version.
DSI_CORE.checkForNewVersion = function() {
    if (!Utils.isNwjs()) return;
    
    const http = require('https');
    const fs = require('fs');
    const path = require("path");
    const base = path.dirname(process.mainModule.filename);
    const versionPath = path.join(base, "js/") + "dsi_core.version";
    const downloadPath = path.join(base, "js/plugins/") + "DSI-Core2.js";
    const pluginPath = path.join(base, "js/plugins/") + "DSI-Core.js";

    const download = function(url, dest, cb) {
        var file = fs.createWriteStream(dest);
        http.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                if (cb)
                    cb.call(this, file);
                file.close();
            });
        }).on("error", function(err) {
            console.log(err);
            fs.rmSync(downloadPath);
        });
        file.on('error', function (err) {
            console.log(err);
        });
    };

    download('https://raw.githubusercontent.com/dsiver144/mz-snipets/main/DSI-Core.js', downloadPath, ()=>{
        console.warn("UPDATED: DSI-Core to version: " + version);
        fs.copyFileSync(downloadPath, pluginPath);
        fs.rmSync(downloadPath);
    });
};
// Parse Plugin Parameters
PluginManager.processParameters = function(paramObject) {
    paramObject = JsonEx.makeDeepCopy(paramObject);
    for (k in paramObject) {
        if (k.match(/(.+):(\w+)/i)) {
            var value = paramObject[k];
            delete paramObject[k];
            const paramName = RegExp.$1;
            const paramType = RegExp.$2;
            switch(paramType) {
                case 'struct':
                    value = JSON.parse(value);
                    value = PluginManager.processParameters(value);
                    break;
                case 'arr_struct':
                    var array = JSON.parse(value);
                    value = [];
                    for (let i = 0; i < array.length; i++) {
                        var rawStruct = JSON.parse(array[i]);
                        rawStruct = PluginManager.processParameters(rawStruct);
                        value.push(rawStruct)
                    }
                    break;
                case 'num': case 'number':
                    value = Number(value);
                    break;
                case 'arr': case 'note': case 'array':
                    value = JSON.parse(value);
                    break;
                case 'arr_num':
                    value = JSON.parse(value).map(n => Number(n));
                    break;
                case 'bool': case 'boolean':
                    value = value === 'true';
                    break;
                case 'vec': case 'vector':
                    value = value.split(",").map(n => Number(n));
                    break;
                case 'vec_str':
                    value = value.split(",");
                    break;
            }
            paramObject[paramName] = value;
        }
    }
    return paramObject;
};

Imported.DSI_Core.params = PluginManager.processParameters(PluginManager.parameters('DSI-Core'));

// Show Dev Tools
Imported.DSI_Core.params.showDevTool = Imported.DSI_Core.params.showDevTool || true;
if (Imported.DSI_Core.params.showDevTool) {
    if (Utils.isNwjs() && Utils.isOptionValid("test")) {
        nw.Window.get().showDevTools();
    }
}

// Return An Random Item From Array
Array.prototype.randomizeItem = function() {
    return this[Math.floor(Math.random() * this.length)];
};
 
var Easing = Easing || {}
Easing.easeInOutExpo = function(t, b, c, d) {
    if (t==0) return b;
    if (t==d) return b+c;
    if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
    return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
}
Easing.easeOutExpo = function(t, b, c, d) {
    return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
}
Easing.easeInOutQuad = function(t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t + b;
    return -c/2 * ((--t)*(t-2) - 1) + b;
}
Easing.easeLinear = function(t, b, c, d) {
    return c * t / d + b;
}
Easing.easeOutSine = function(t, b, c, d) {
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
}
Easing.easeInCirc = function(t, b, c, d) {
    return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
}
Easing.easeInCubic = function(t, b, c, d) {
    return c * (t /= d) * t * t + b;
}
Easing.easeInOutCubic = function(t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t + 2) + b;
}
Easing.easeInOutBack = function(t, b, c, d) {
    s = 1.70158;
    if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
    return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
}

// ==========================================================================
// MV Exclusive
// ==========================================================================

if (Utils.RPGMAKER_NAME === "MV") {

    Game_Message.prototype.setupCustomChoices = function(choices, callback, cancelType = 1, defaultType = 0, positionType = 1, background = 0) {
        $gameMessage.setChoices(choices, defaultType, cancelType);
        $gameMessage.setChoiceBackground(background);
        $gameMessage.setChoicePositionType(positionType);
        $gameMessage.setChoiceCallback(function(n) {
            callback(n);
        }.bind(this));
    };
    
	var DSI_Core_Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        this.loadCustomNotetags();
		DSI_Core_Scene_Boot_start.call(this);        
    };

    Scene_Boot.prototype.loadCustomNotetags = function() {
        // Alias this method.
    };

    TouchInput._onMouseMove = function(event) {
        if (this._mousePressed || window['forceMouseMove']) {
            var x = Graphics.pageToCanvasX(event.pageX);
            var y = Graphics.pageToCanvasY(event.pageY);
            this._onMove(x, y);
        }
    };

    Sprite_Button.prototype.canvasToLocalX = function(x) {
        var node = this;
        while (node) {
            x -= node.x * (node.parent ? node.parent.scale.x : 1);
            node = node.parent;
        }
        return x;
    };
    
    Sprite_Button.prototype.canvasToLocalY = function(y) {
        var node = this;
        while (node) {
            y -= node.y * (node.parent ? node.parent.scale.y : 1);
            node = node.parent;
        }
        return y;
    };
}
// ==========================================================================
// MZ Exclusive
// ==========================================================================

if (Utils.RPGMAKER_NAME === "MZ") {
    var DSI_Core_Scene_Boot_start2 = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        this.loadCustomNotetags();
		DSI_Core_Scene_Boot_start2.call(this);        
    };

    Scene_Boot.prototype.loadCustomNotetags = function() {
        // Alias this method.
    };
}

Bitmap.prototype.drawIcon = function(iconIndex, x, y) {
    const bitmap = ImageManager.loadSystem("IconSet");
    const pw = ImageManager.iconWidth;
    const ph = ImageManager.iconHeight;
    const sx = (iconIndex % 16) * pw;
    const sy = Math.floor(iconIndex / 16) * ph;
    this.blt(bitmap, sx, sy, pw, ph, x, y);
};

PIXI.Text.prototype.update = function() {
    
}

Easing.classes = [Sprite, Window, PIXI.Text];
Easing.classes.forEach(className => {

    className.prototype.followMouse = function(value) {
        if (value === undefined) 
            value = true;
        this._followMouse = value;
    };

    className.prototype.readDotProperty = function(dotProperties) {
        var result = null;
        for (var i = 0; i < dotProperties.length - 1; i++) {
            if (!result) {
                result = this[dotProperties[i]];
            } else {
                result = result[dotProperties[i]];
            }
        }
        return [result, dotProperties[dotProperties.length - 1]];
    };

    className.prototype.popAnimation = function(scaleValueX, scaleValueY, duration, callback) {
        var originScaleX = this.scale.x;
        var originScaleY = this.scale.y;
        var adjustAnchor = false;
        var lastX = this.x;
        var lastY = this.y;
        if (this.anchor.x !== 0.5) {
            this.anchor.x = 0.5;
            this.anchor.y = 0.5;
            this.x += this.width / 2;
            this.y += this.height / 2;

            adjustAnchor = true;
        }
        this.startTween({"scale.x": scaleValueX, "scale.y": scaleValueY}, duration / 2).onFinish(()=>{
            this.startTween({"scale.x": originScaleX, "scale.y": originScaleY}, duration / 2).onFinish(()=>{
                if (adjustAnchor) {
                    this.anchor.x = 0.0;
                    this.anchor.y = 0.0;
                    this.x = lastX;
                    this.y = lastY;
                    this.scale.x = originScaleX;
                    this.scale.y = originScaleY;
                }
                if (callback) callback();
            });
        });
    };

    className.prototype.startTween = function(settings, duration, onFinishCallBack, easingFunction, repeat) {
        if (!easingFunction) {
            easingFunction = Easing.easeOutExpo;
        }
        if (!repeat) repeat = false;
        var tween = {}
        tween.properties = {}
        for (key in settings) {
            var dotProperties = key.split('.');
            if (dotProperties.length > 1) {
                var dotObj = this.readDotProperty(dotProperties);
                const b = dotObj[0][dotObj[1]];
                const c = settings[key] - b;
                tween.properties[key] = {beginValue: b, changeValue: c};
                tween.properties[key].dotObj = dotObj;
            } else {
                let b = this[key];
                let c = settings[key] - this[key];
                if (key === 'offsetY') {
                    let org = this['y'];
                    this['y'] += settings[key];
                    b = this['y'];
                    c = org - b;
                    key = 'y';
                }
                if (key === 'offsetX') {
                    let org = this['x'];
                    this['x'] += settings[key];
                    b = this['x'];
                    c = org - b;
                    key = 'x';
                }
                if (key === 'offsetY2') {
                    b = this['y'];
                    c = settings[key];
                    key = 'y';
                }
                if (key === 'offsetX2') {
                    b = this['x'];
                    c = settings[key];
                    key = 'x';
                }
                tween.properties[key] = {beginValue: b, changeValue: c}
            }
        }
        tween.frameCount = 0;
        tween.duration = duration;
        tween.onFinishCallBack = onFinishCallBack;
        tween.easingFunction = easingFunction.bind(this);
        tween.repeat = repeat;
        tween.delayCount = 0;
        // Chain functions
        tween.delay = function(frames) {
            this.delayCount = frames;
            return this;
        }
        var self = this;
        tween.ease = function(func) {
            this.easingFunction = func.bind(self);
            return this;
        }
        tween.onFinish = function(func) {
            this.onFinishCallBack = func;
            return this;
        }
        tween.repeatForever = function(bool) {
            this.repeat = bool;
            return this;
        }
        this._tweenObject = tween;
        return tween
    };

    className.prototype.hasTween = function() {
        return !!this._tweenObject;
    };
    
    className.prototype.onUpdate = function(callback) {
        this._onUpdateCallback = callback.bind(this);
    };
    
    className.prototype.removeTween = function() {
        this._tweenObject = undefined;
    };
    
    let DSI_SpriteTween_update = className.prototype.update;
    className.prototype.update = function() {
        DSI_SpriteTween_update.call(this);
        if (this._followMouse) {
            this.x = TouchInput.x;
            this.y = TouchInput.y;
            if (TouchInput.isCancelled() || Input.isTriggered('control')) {
                this._followMouse = false;
                console.log(this.x, this.y);
                console.log(` * @default {"x:num":"${this.x}","y:num":"${this.y}"}`);
            }
        }
        if (this._onUpdateCallback) this._onUpdateCallback();
        if (this._tweenObject) {
            const tween = this._tweenObject;
            if (tween.delayCount > 0) {
                tween.delayCount -= 1;
                return;
            }
            if (tween.frameCount <= tween.duration) {
                for (property in tween.properties) {
                    var t = tween.frameCount;
                    var b = tween.properties[property].beginValue;
                    var c = tween.properties[property].changeValue;
                    var d = tween.duration;
                    var dotObj = tween.properties[property].dotObj;
                    if (dotObj) {
                        dotObj[0][dotObj[1]] = tween.easingFunction(t, b, c, d);
                    } else {
                        this[property] = tween.easingFunction(t, b, c, d);
                    }
                }
                tween.frameCount += 1;
            } else {
                let callback = tween.onFinishCallBack;
                if (tween.repeat) {
                    tween.frameCount = 0;
                } else {
                    this._tweenObject = undefined;
                }
                if (callback)
                    callback();
            }
        }
    };
})
