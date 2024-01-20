//=======================================================================
// * Plugin Name  : DSI-Essential.js
// * Last Updated : 1/18/2024
//========================================================================
/*:
 * @author dsiver144
 * @plugindesc (v3.2) Essentials for DSI plugins.
 * @help 
 * ===================================================
 * > Change Log:
 * ===================================================
 * 1.0: - Finish basic functions.
 * 1.0: - Rework Save feature.
 * 1.2: - Rework Tween Function.
 * 1.3: - Add checkForNewVersion feature.
 * 1.4: - Add ESL.Bitmap.drawCircle()
 * 1.5: - Add new array util functions.
 * 1.6: - Add ESL.DateTime.convertFrameToRealLifeFormat
 *      - Add ESL.Window.drawText
 * 1.7: - Add ESL.Array.dynamicSort
 *      - Add ESL.Array.dynamicSortEx
 * 1.8: - Add ESL.Math.random
 *      - Add ESL.Math.randomInt
 *      - Add ESL.Math.clamp
 *      - Add ESL.Math.remap
 * 1.9: - Add ESL.Algorithm.easyAStar
 * 1.91: - Fix ESL.Sprite.IconSprite for MV
 * 1.92: - Add ESL.Sprite.ProgressBar
 * 1.93: - Add ESL.CustomEventDispatcher
 * 2.01: - Add ImageManager.loadCustomItemImage
 * 2.03: - Update event system.
 * 2.04: - Update ImageManager.loadCustomItemImage
 * 2.08: - Add ESL.Sprite.SelectableButton
 *       - Add ESL.Sprite.InteractableContent
 * 2.09  - Add ESL.Sprite.NumberSlider
 * 3.00  - Add ESL.Sprite.TextBox
 * 3.01  - Replace Tween Function
 * 
 * 
 */
var Imported = Imported || {};
Imported["DSI-Essenstial"] = 2.5;

function ESL() {
    return new Error("This is a static class");
}

var ESLParams = PluginManager.parameters('DSI-Essential');
ESLParams = PluginManager.processParameters(ESLParams);
ESL.Params = ESLParams;
ESL.Params.MemoryLeakDebugMode = false;

// #region Logger
ESL.AbstractLogger = class {
    /**
     * This class handle log in game
     */
    constructor() {

    }
    /**
     * Prefix of this logger
     * @returns {string}
     */
    get prefix() {
        return 'Console';
    }
    /**
     * Log
     * @param  {...any} args 
     */
    log(...args) {
        console.log(`✅ [${this.prefix}]: `, ...args);
    }
    /**
     * Error
     * @param  {...any} args 
     */
    error(...args) {
        console.error(`❌ [${this.prefix}]: `, ...args);
    }
    /**
     * Warn
     * @param  {...any} args 
     */
    warn(...args) {
        console.error(`🟡 [${this.prefix}]: `, ...args);
    }
}
ESL.Logger = new ESL.AbstractLogger();
// #endregion
// #region Utils
/**
 * Process Plugin Parameters
 * @param {any} paramObject 
 * @returns {any}
 */
ESL.processPluginParameters = function (paramObject) {
    paramObject = { ...paramObject };
    for (k in paramObject) {
        if (k.match(/(.+):(\w+)/i)) {
            var value = paramObject[k];
            delete paramObject[k];
            const paramName = RegExp.$1;
            const paramType = RegExp.$2;
            switch (paramType) {
                case 'struct': case 'obj':
                    value = JSON.parse(value);
                    value = this.processPluginParameters(value);
                    break;
                case 'arr_struct': case 'arr_obj':
                    var array = JSON.parse(value);
                    value = [];
                    for (let i = 0; i < array.length; i++) {
                        var rawStruct = JSON.parse(array[i]);
                        rawStruct = this.processPluginParameters(rawStruct);
                        value.push(rawStruct)
                    }
                    break;
                case 'num': case 'number':
                    value = Number(value);
                    break;
                case 'arr_num':
                    value = JSON.parse(value).map(n => Number(n));
                    break;
                case 'arr': case 'note': case 'array':
                    value = JSON.parse(value);
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
}
/**
 * Generate UUID
 * @returns {string}
 */
ESL.uuid = function () {
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;
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
/**
 * Convert param object to param text
 * @param {Object} object 
 */
ESL.convertParamObjectToPluginParamText = function (object) {
    let str = ""
    Object.keys(object).forEach((key) => {
        const value = object[key];
        const paramText = key.replace(/([A-Z])/g, " $1");
        const finalParamName = paramText.charAt(0).toUpperCase() + paramText.slice(1);

        switch (typeof value) {
            case "object":
                if (value instanceof Array) {
                    str += ` * @param ${key}:arr_num\n`;
                    str += ` * @text ${finalParamName}\n`;
                    str += ` * @desc Enter array number\n`;
                    str += ` * @type number[]\n`;
                    str += ` * @default [${value.map(n => `"${n}"`).join(",")}]\n`;
                } else {
                    if (value.hasOwnProperty("x") && value.hasOwnProperty("y")) {
                        str += ` * @param ${key}:struct\n`;
                        str += ` * @text ${finalParamName}\n`;
                        str += ` * @desc Enter position object\n`;
                        str += ` * @type struct<PositionObject>\n`;
                        str += ` * @default {"x:num":"${value.x}","y:num":"${value.y}"}\n`;
                    }
                    if (value.hasOwnProperty("width") && value.hasOwnProperty("height")) {
                        str += ` * @param ${key}:struct\n`;
                        str += ` * @text ${finalParamName}\n`;
                        str += ` * @desc Enter size object\n`;
                        str += ` * @type struct<ISize>\n`;
                        str += ` * @default {"width:num":"${value.width}","height:num":"${value.height}"}\n`;
                    }
                }
                break;
            case "string":
                str += ` * @param ${key}:str\n`;
                str += ` * @text ${finalParamName}\n`;
                str += ` * @desc Enter string\n`;
                str += ` * @default ${value}\n`;
                break;
            case "number":
                str += ` * @param ${key}:num\n`;
                str += ` * @text ${finalParamName}\n`;
                str += ` * @desc Enter number\n`;
                str += ` * @default ${value}\n`;
                break;
        }
        str += " *\n";
    });
    console.log(str);
}
// #endregion
// #region RPG Maker Core
/**
 * ------------------------------------------------------------------------------
 * RPG Maker Core
 * ------------------------------------------------------------------------------
 */
ESL.RPG = function () {
    return new Error("This is a static class");
}
/** @type {"MV" | "MZ"} */
ESL.RPG.NAME = Utils && Utils.RPGMAKER_NAME == "MV" ? "MV" : "MZ";
/**
 * Get current scene
 * @returns {Scene_Base}
 */
Object.defineProperty(ESL.RPG, 'curScene', {
    get() {
        return SceneManager._scene;
    },
    enumerable: false,
    configurable: false,
})
/**
 * Find all windows in target scene
 * @param {any} result 
 * @param {Scene_Base} target 
 * @param {string} name 
 * @param {boolean} recursive 
 */
ESL.RPG.findWindows = function (result, target, name, recursive) {
    for (k in target) {
        if (target[k] instanceof Window_Base) {
            result[name] = result[name] || {};
            result[name][k] = target[k];
            if (recursive) {
                this.findWindows(result, target[k], k, false);
            }
        }
    }
}
/**
 * Get All Windows In Current Scene
 * @param {boolean} recursive 
 */
ESL.RPG.getWindows = function (recursive) {
    let scene = this.curScene;
    let result = {};
    let name = scene.constructor.name;
    findWindows(result, scene, name, recursive);
    ESL.Logger.log(result);
}
// #endregion
// #region Bitmap Core
/**
 * ------------------------------------------------------------------------------
 * Bitmap Core
 * ------------------------------------------------------------------------------
 */
ESL.Bitmap = function () {
    return new Error("This is a static class");
}
/**
 * Draw Icon On Target Bitmap
 * @param {Bitmap} targetBitmap 
 * @param {number} iconIndex 
 * @param {number} x 
 * @param {number} y 
 */
ESL.Bitmap.drawIcon = function (targetBitmap, iconIndex, x, y) {
    const bitmap = ImageManager.loadSystem("IconSet");
    const pw = ImageManager.iconWidth || 32;
    const ph = ImageManager.iconHeight || 32;
    const sx = (iconIndex % 16) * pw;
    const sy = Math.floor(iconIndex / 16) * ph;
    targetBitmap.blt(bitmap, sx, sy, pw, ph, x, y);
}
/**
 * Draw A Circle On Bitmap
 * @param {Bitmap} targetBitmap 
 * @param {number} x 
 * @param {number} y 
 * @param {number} radius 
 * @param {string} color 
 * @param {string} color2 
 * @param {number} lineWidth 
 * @param {number} startAngle 
 * @param {number} endAngle 
 * @param {string} joinStyle 
 */
ESL.Bitmap.drawCircle = function (targetBitmap, x, y, radius, color, color2, lineWidth, startAngle, endAngle, joinStyle = "miter") {
    var context = targetBitmap._context;
    context.save();
    if (color2) {
        var grad = context.createLinearGradient(x - radius, y - radius, radius * 2, radius * 2);
        grad.addColorStop(0, color2);
        grad.addColorStop(1, color);
    } else {
        var grad = color;
    }
    context.strokeStyle = grad;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.arc(x, y, radius, startAngle, endAngle, false);
    context.lineJoin = context.lineCap = joinStyle;
    context.stroke();
    context.restore();
    targetBitmap._setDirty();
};
// #endregion
// #region Sprite Core
/**
 * ------------------------------------------------------------------------------
 * Sprite Core
 * ------------------------------------------------------------------------------
 */
ESL.Sprite = function () {
    return new Error("This is a static class");
}

ESL.Sprite.IconSprite = class extends Sprite {
    /**
     * Sprite Icon
     * @param {number} index 
     */
    constructor(iconIndex) {
        super();
        this.bitmap = new Bitmap(32, 32);
        this._iconsetBitmap = ImageManager.loadSystem("IconSet");
        this.setIcon(iconIndex);
    }
    /**
     * Set Icon
     * @param {number} iconIndex 
     * @param {number} x 
     * @param {number} y 
     */
    setIcon(iconIndex = 0, x = 0, y = 0) {
        this.bitmap.clear();
        if (iconIndex < 0) return;
        this._iconIndex = iconIndex;
        this._displayX = x;
        this._displayY = y;
        this._needRefresh = true;
    }
    /**
     * Update
     */
    update() {
        super.update();
        if (this._needRefresh && this._iconsetBitmap.isReady()) {
            const bitmap = this._iconsetBitmap;
            const iconIndex = this._iconIndex;
            // bitmap.smooth = false;
            const pw = Utils.RPGMAKER_NAME == "MV" ? Window_Base._iconWidth : ImageManager.iconWidth;
            const ph = Utils.RPGMAKER_NAME == "MV" ? Window_Base._iconHeight : ImageManager.iconHeight;;
            const sx = (iconIndex % 16) * pw;
            const sy = Math.floor(iconIndex / 16) * ph;
            this.bitmap.blt(bitmap, sx, sy, pw, ph, this._displayX, this._displayY);
            this._needRefresh = false;
        }
    }
}

ESL.Sprite.ProgressBar = class extends Sprite {
    /**
     * Sprite_ProgressBar
     */
    constructor(defaultRate = 0.0, width = 200, height = 64) {
        super();
        this._defaultWidth = width;
        this._defaultHeight = height;
        this._rate = defaultRate;
        this.createSprites();
    }
    /**
     * Create Sprites
     */
    createSprites() {
        this.bitmap = this.isUsingCustomBitmap() ? this.backgroundBitmap() : new Bitmap(this._defaultWidth, this._defaultHeight);
        this._foregroundSprite = new Sprite();
        this._foregroundSprite.bitmap = this.isUsingCustomBitmap() ? this.foregroundBitmap() : new Bitmap(this._defaultWidth, this._defaultHeight);
        this._foregroundSprite.x = this.foregroundOffset().x;
        this._foregroundSprite.y = this.foregroundOffset().y;
        this.addChild(this._foregroundSprite);
        this.setRate(this._rate);
    }
    /**
     * Set Rate
     * @param {number} rate 
     */
    setRate(rate) {
        this._rate = rate;
    }
    /**
     * Is Ready
     * @returns {boolean}
     */
    isReady() {
        return this.bitmap.isReady() && this._foregroundSprite.bitmap.isReady();
    }
    /**
     * Update Per Frame
     */
    update() {
        super.update();
        if (this.isReady()) {
            this.refreshBar();
        }
    }
    /**
     * Refresh Bar
     */
    refreshBar() {
        const width = this._foregroundSprite.bitmap.width;
        const height = this._foregroundSprite.bitmap.height;
        this._foregroundSprite.setFrame(0, 0, width * this._rate, height);
    }
    /**
     * Foreground Offset
     * @returns {Vector2}
     */
    foregroundOffset() {
        return new Vector2(0, 0);
    }
    /**
     * Is Using Custom Bitmap
     * @returns {boolean}
     */
    isUsingCustomBitmap() {
        return true;
    }
    /**
     * Background Bitmap
     * @returns {Bitmap}
     */
    backgroundBitmap() {
        return null;
    }
    /**
     * Foreground Bitmap
     * @returns {Bitmap}
     */
    foregroundBitmap() {
        return null;
    }
}

ESL.Sprite.SelectableButton = class extends Sprite_Button {
    /**
     * Select
     */
    select() {
        this._selected = true;
        this.refreshFrame();
    }
    /**
     * Deselect
     */
    deselect() {
        this._selected = false;
        this.refreshFrame();
    }
    /**
     * Is Selected
     */
    isSelected() {
        return this._selected;
    }
    /**
     * Update Frame
     */
    refreshFrame() {
        this.bitmap = this.isSelected() ? this.selectedBitmap() : this.unselectBitmap();
    }
    /**
     * Selected Bitmap
     * @returns {Bitmap}
     */
    selectedBitmap() {
        return null;
    }
    /**
     * Unselect Bitmap
     * @returns {Bitmap}
     */
    unselectBitmap() {
        return null;
    }
}

ESL.Sprite.InteractableContent = class extends Sprite_Button {
    /**
     * Constructor
     */
    constructor() {
        super();
        this.initMembers();
        this.create();
    }
    /**
     * Init Members
     */
    initMembers() {

    }
    /**
     * Create
     */
    create() {
        this.bitmap = this.backgroundBitmap();
        this.createContentWindow();
    }
    /**
     * Create Content Window
     */
    createContentWindow() {
        const size = this.contentSize();
        const offset = this.offset();
        this._contentWindow = new Window_Base(offset.x, offset.y, size.x - offset.x * 2, size.y - offset.y * 2);
        this.addChild(this._contentWindow);
        this._contentWindow.opacity = 0;
        this._contentWindow.backOpacity = 0;
    }
    /**
     * Contents Width
     */
    contentsWidth() {
        return this._contentWindow.contentsWidth();
    }
    /**
     * Contents Height
     */
    contentsHeight() {
        return this._contentWindow.contentsHeight();
    }
    /**
     * Background Bitmap
     */
    backgroundBitmap() {
        return null;
    }
    /**
     * Size
     * @returns {Vector2}
     */
    contentSize() {
        return { x: 0, y: 0 };
    }
    /**
     * Offset
     */
    offset() {
        return { x: 0, y: 0 };
    }
    /**
     * Refresh
     */
    refresh() {

    }
}

/**
 * @typedef SliderOptions
 * @property {number} sliderYOffset
 * @property {Vector2} numberPanelOffset
 * @property {Vector2} addBtnOffset
 * @property {Vector2} subtractBtnOffset
 * 
 */

ESL.Sprite.NumberSlider = class extends Sprite {
    /**
     * Constructor
     * @param {PIXI.TextStyle} sliderNumberTextStyle
     * @param {SliderOptions} sliderOptions
     */
    constructor(sliderNumberTextStyle, sliderOptions) {
        sliderOptions = {
            sliderYOffset: -4,
            numberPanelOffset: { x: 81, y: -43 },
            addBtnOffset: { x: 20, y: -20 },
            subtractBtnOffset: { x: -75, y: -12 },
            ...sliderOptions
        }
        super();
        this.bitmap = this.backgroundBitmap();
        this._slider = new Sprite_Button();
        this._slider.bitmap = this.sliderBitmap();
        this._slider.y = sliderOptions.sliderYOffset ?? -4;
        this._slider.processTouch = function () {
            // Do nothing here.
        }
        this.addChild(this._slider);

        this._numberSprite = new Sprite();
        this._numberSprite.bitmap = this.numberBackgroundBitmap();
        this._numberSprite.setNumber = (num) => {
            if (this._numberSprite.numberTxt) {
                this._numberSprite.removeChild(this._numberSprite.numberTxt);
            }
            const numberTxt = new PIXI.Text(num, sliderNumberTextStyle);
            numberTxt.anchor.x = 0.5;
            numberTxt.anchor.y = 0.5;
            numberTxt.x = this._numberSprite.width / 2;
            numberTxt.y = this._numberSprite.height / 2;
            this._numberSprite.addChild(numberTxt);
            this._numberSprite.numberTxt = numberTxt;
        };
        this.addChild(this._numberSprite);
        this._numberSprite.x = sliderOptions.numberPanelOffset.x;
        this._numberSprite.y = sliderOptions.numberPanelOffset.y;
        this._numberSprite.setNumber(0);
        /** @type {Sprite_Button} */
        const addBtn = new Sprite_Button();
        addBtn.bitmap = this.addButtonBitmap();
        this.addChild(addBtn);
        addBtn.x = this.bitmap.width + sliderOptions.addBtnOffset.x;
        addBtn.y = sliderOptions.addBtnOffset.y;
        addBtn.setClickHandler(this.onAddBtnClicked.bind(this));

        /** @type {Sprite_Button} */
        const subBtn = new Sprite_Button();
        subBtn.bitmap = this.subtractButtonBitmap();
        this.addChild(subBtn);
        subBtn.x = sliderOptions.subtractBtnOffset.x;
        subBtn.y = sliderOptions.subtractBtnOffset.y;
        subBtn.setClickHandler(this.onSubtractBtnClicked.bind(this));

        this._minNum = 0;
        this._maxNum = 0;
        this._clampValues = [];
        this._blockInteraction = false;
        this._disabled = false;
    }
    /**
     * Disable
     */
    disable() {
        this._disabled = true;
    }
    /**
     * Enable
     */
    enable() {
        this._disabled = false;
    }
    /**
     * Set Block Interaction
     * @param {boolean} v 
     */
    setBlockInteraction(v) {
        this._blockInteraction = v;
    }
    /**
     * Set Number
     * @param {number} min 
     * @param {number} max 
     */
    setNumber(min, max) {
        this._minNum = min;
        this._maxNum = max;
        this._slider.x = 0;
        this._numberSprite.setNumber(min);
        this.refreshClampValue();
    }
    /**
     * Can Slide
     * @returns {number}
     */
    canSlide() {
        return this._maxNum != this._minNum && !this._disabled;
    }
    /**
     * Is Out Of Range
     * @param {number} number
     */
    isOutOfRange(number) {
        if (number > this._maxNum) {
            return true;
        }
        if (number < this._minNum) {
            return true;
        }
        return false;
    }
    /**
     * Set Current Number
     * @param {number} number 
     * @returns {number}
     */
    setCurrentNumber(number) {
        if (this._blockInteraction) return;
        if (!this.canSlide()) {
            SoundManager.playBuzzer();
            return;
        }
        if (this.isOutOfRange(number)) {
            return;
        }
        SoundManager.playCursor();
        const newRate = (number) / (this._maxNum - this._minNum);
        this._slider.x = newRate * this.maxWidth();
        this._onRateChangeCallback && this._onRateChangeCallback(this.rate());
        return this.clampedValue();
    }
    /**
     * On Add Btn Clicked
     */
    onAddBtnClicked() {
        let number = this.clampedValue() + 1;
        this.setCurrentNumber(number);
    }
    /**
     * On Subtract Btn Clicked
     */
    onSubtractBtnClicked() {
        let number = this.clampedValue() - 1;
        this.setCurrentNumber(number);
    }
    /**
     * Refresh Clamp Value
     */
    refreshClampValue() {
        const divider = this.maxWidth() / this._maxNum;
        const values = [];
        for (var i = 0; i < this._maxNum; i++) {
            values.push(divider * i);
        }
        this._clampValues = values;
        this._clampValues.push(this.maxWidth());
    }
    /**
     * Set On Rate Change Callback
     * @param {(rate: number) => void} callback 
     */
    setOnRateChangeCallback(callback) {
        this._onRateChangeCallback = callback;
    }
    /**
     * Rate
     * @returns {number}
     */
    rate() {
        return this._slider.x / this.maxWidth();
    }
    /**
     * Background Bitmap
     * @returns {Bitmap}
     */
    backgroundBitmap() {
        return null;
    }
    /**
     * Slider Bitmap
     * @returns {Bitmap}
     */
    sliderBitmap() {
        return null;
    }
    /**
     * Number Background Bitmap
     */
    numberBackgroundBitmap() {
        return null;
    }
    /**
     * Add Button Bitmap
     */
    addButtonBitmap() {
        return null;
    }
    /**
     * Subtract Button Bitmap
     */
    subtractButtonBitmap() {
        return null;
    }
    /**
     * Update
     */
    update() {
        super.update();
        this.updateTouch();
    }
    /**
     * Max Width
     * @returns {number}
     */
    maxWidth() {
        return this.bitmap.width - this._slider.bitmap.width;
    }
    /**
     * Update Touch
     */
    updateTouch() {
        if (this._blockInteraction) return;
        if (!this.bitmap.isReady()) return;
        if (!this._slider.bitmap.isReady()) return;
        if (!this._touching) {
            if (TouchInput.isTriggered() && this._slider.isButtonTouched()) {
                if (!this.canSlide()) {
                    SoundManager.playBuzzer();
                    return;
                }
                this._touching = true;
                this._startX = TouchInput.x;
                this._startY = TouchInput.y;
                this._curX = this._slider.x;
            }
        } else {
            if (TouchInput.isPressed()) {
                const delta = { x: TouchInput.x - this._startX, y: TouchInput.y - this._startY };
                this._slider.x = this._curX + delta.x;
                this._slider.x = Math.max(Math.min(this._slider.x, this.maxWidth()), 0);
                this._onRateChangeCallback && this._onRateChangeCallback(this.rate());
            } else {
                let minDistance = Number.MAX_SAFE_INTEGER;
                let minValue = this._clampValues[0];
                for (var i = 0; i < this._clampValues.length; i++) {
                    const dist = Math.abs(this._slider.x - this._clampValues[i]);
                    if (dist < minDistance) {
                        minDistance = dist;
                        minValue = this._clampValues[i];
                    }
                }
                this._slider.x = minValue;
                this._touching = false;
                this._onRateChangeCallback && this._onRateChangeCallback(this.rate());
                SoundManager.playCursor();
            }
        }
    }
    /**
     * Clamped Value
     * @returns {number}
     */
    clampedValue() {
        let minDistance = Number.MAX_SAFE_INTEGER;
        let minValue = this._clampValues[0];
        for (var i = 0; i < this._clampValues.length; i++) {
            const dist = Math.abs(this._slider.x - this._clampValues[i]);
            if (dist < minDistance) {
                minDistance = dist;
                minValue = this._clampValues[i];
            }
        }
        const rate = minValue / this.maxWidth();
        const number = Math.round(rate * (this._maxNum - this._minNum));
        this._numberSprite.setNumber(number);
        return number;
    }
}

ESL.Sprite.TextBox = class extends Sprite_Button {
    /**
     * Constructor
     * @param {string} placeholder
     */
    constructor(placeholder = "") {
        super();
        /** @type {string} */
        this._text = placeholder;
        /** @type {boolean} */
        this._inputing = false;
        this._handlers = {};
        this.create();
        this.refresh();
        this.setClickHandler(this.onTextBoxClicked.bind(this));
        this.setKeyPressListener();
    }
    /**
     * Set Text
     * @param {string} text
     */
    setText(text) {
        this._text = text;
        this.refresh();
    }
    /**
     * Text
     */
    text() {
        return this._text;
    }
    /**
     * Set Handler
     * @param {string} type
     * @param {Function} callback
     */
    setHandler(type, callback) {
        this._handlers[type] = callback;
    }
    /**
     * Call Handler
     * @param {string} type
     */
    callHandler(type) {
        if (this._handlers[type]) {
            this._handlers[type]();
        }
    }
    /**
     * Set Key Press Listener
     */
    setKeyPressListener() {
        Input.setKeyPressListener(this);
    }
    /**
     * Clear Key Press Listener
     */
    clearKeyPressListener() {
        Input.setKeyPressListener(null);
    }
    /**
     * Destroy
     */
    destroy() {
        this.clearKeyPressListener();
        super.destroy();
    }
    /**
     * Background Bitmap
     * @returns {Bitmap}
     */
    backgroundBitmap() {
        throw new Error("Need to implement backgroundBitmap()");
    }
    /**
     * Content Size
     */
    contentSize() {
        return { width: 0, height: 0 };
    }
    /**
     * Content Offset
     */
    contentOffset() {
        return { x: 0, y: 0 };
    }
    /**
     * Font Settings
     */
    fontSettings() {
        return {
            fontSize: 24,
            color: "#ffffff",
        }
    }
    /**
     * Create
     */
    create() {
        this.bitmap = this.backgroundBitmap();
        const contentSize = this.contentSize();
        const contentOffset = this.contentOffset();
        this._contentWindow = new Window_Base(contentOffset.x, contentOffset.y, contentSize.width, contentSize.height);
        this._contentWindow.opacity = 0;
        this._contentWindow.backOpacity = 0;
        const fontSettings = this.fontSettings();
        this._contentWindow.contents.fontSize = fontSettings.fontSize;
        this._contentWindow.contents.textColor = fontSettings.color;
        this.addChild(this._contentWindow);
    }
    /**
     * Refresh
     */
    refresh() {
        this._contentWindow.contents.clear();
        const formater = this.textFormater();
        this._contentWindow.drawText(formater.format(this._text), 0, 0, this._contentWindow.contentsWidth(), "center");
    }
    /**
     * Text Formater
     */
    textFormater() {
        return "%1";
    }
    /**
     * On Key Down
     */
    onKeyDown(event) {
        if (!this._inputing) return;
        if (/^(\d)$/u.test(event.key)) {
            this.onPressKey(+event.key);
        } else {
            if (event.keyCode == 8 || event.keyCode == 46) {
                this.deleteLastKey();
            }
            if (event.keyCode == 13) {
                this.onConfirmInput();
            }
        }
    }
    /**
     * On Press Key
     * @param {string} key
     */
    onPressKey(key) {
        this._text += key;
        SoundManager.playCursor();
        this.refresh();
    }
    /**
     * Delete Last Key
     */
    deleteLastKey() {
        this._text = this._text.slice(0, this._text.length - 1);
        SoundManager.playCancel();
        this.refresh();
    }
    /**
     * On Confirm Input
     */
    onConfirmInput() {
        this._inputing = false;
        this.callHandler("ok");
    }
    /**
     * On Text Box Clicked
     */
    onTextBoxClicked() {
        if (this._inputing) {
            this.onConfirmInput();
            return;
        }
        this._inputing = true;
        this._text = "";
        SoundManager.playCursor();
        this.callHandler("click");
    }
    /**
     * Update
     */
    update() {
        super.update();
        this.updateInputing();
    }
    /**
     * Update Inputing
     */
    updateInputing() {
        this._contentWindow.contentsOpacity = this._inputing ? 100 + Math.sin(Graphics.frameCount / 60) ** 2 * 155 : 255;
    }
}
//#endregion
// #region Window Core
/**
 * ------------------------------------------------------------------------------
 * Window Core
 * ------------------------------------------------------------------------------
 */
ESL.Window = function () {
    return new Error("This is a static class");
}
ESL.Window.Grid = class extends Window_Command {
    /**
     * This class handle grid style window
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        super(x, y);
        if (this.isCursorOnTop()) {
            this.addChild(this._windowCursorSprite);
        }
        if (this.backgroundEnabled()) {
            const background = new Sprite(this.backgroundBitmap());
            this.addChildToBack(background);
            this.opacity = 0;
            this.backOpacity = 0;
        }
    }
    /** @inheritdoc */
    maxCols() {
        return 3;
    }
    /**
     * Visible Row
     * @returns {number}
     */
    numVisibleRows() {
        return 3;
    }
    /**
     * If cursor is on top of the window or below
     * @returns {boolean}
     */
    isCursorOnTop() {
        return false;
    }
    /**
     * Background Enable
     * @returns {boolean}
     */
    backgroundEnabled() {
        return false;
    }
    /**
     * Background Bitmap
     * @returns {Bitmap}
     */
    backgroundBitmap() {
        return null;
    }
    /**
     * Item Width
     * @returns {number}
     */
    itemWidth() {
        return 32;
    }
    /**
     * Item Height
     * @returns {number}
     */
    itemHeight() {
        return 32;
    }
    /**
     * Window Width
     * @returns {number}
     */
    windowWidth() {
        return this.itemWidth() * this.maxCols() + this.standardPadding() * 2;
    }
    /**
     * Window Height
     * @returns {number}
     */
    windowHeight() {
        return this.itemHeight() * this.numVisibleRows() + this.standardPadding() * 2;
    }
}
/**
 * Draw Text Auto
 * @param {Window_Base} targetWindow 
 * @param {string} text 
 * @param {'center' | 'left' | 'right'} align 
 * @param {boolean} clearFlag 
 */
ESL.Window.drawText = function (targetWindow, text, align = 'center', clearFlag = false) {
    clearFlag && targetWindow.contents.clear();
    targetWindow.contents.drawText(
        text,
        0,
        0,
        targetWindow.contentsWidth(),
        targetWindow.contentsHeight(),
        align
    );
}
// #endregion
//#region Tween Core
/**
 * ------------------------------------------------------------------------------
 * Easing Core
 * ------------------------------------------------------------------------------
 * @typedef {"easeLinear" | "easeInOutExpo" | "easeOutExpo" | "easeInOutQuad" | "easeLinear" | "easeOutSine" | "easeInCirc" | "easeInOutCubic" | "easeInOutBack"} MyEasingType
 */
ESL.Easing = {};
ESL.Easing.easeInOutExpo = function (t, b, c, d) {
    if (t == 0) return b;
    if (t == d) return b + c;
    if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
    return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
}
ESL.Easing.easeOutExpo = function (t, b, c, d) {
    return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
}
ESL.Easing.easeInOutQuad = function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
}
ESL.Easing.easeLinear = function (t, b, c, d) {
    return c * t / d + b;
}
ESL.Easing.easeOutSine = function (t, b, c, d) {
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
}
ESL.Easing.easeInCirc = function (t, b, c, d) {
    return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
}
ESL.Easing.easeInCubic = function (t, b, c, d) {
    return c * (t /= d) * t * t + b;
}
ESL.Easing.easeInOutCubic = function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t + 2) + b;
}
ESL.Easing.easeInOutBack = function (t, b, c, d) {
    s = 1.70158;
    if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
    return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
}
//#region Tween Core
/**
 * ------------------------------------------------------------------------------
 * Tween Core
 * ------------------------------------------------------------------------------
 * @typedef TweenOptions
 * @property {any} target
 * @property {Object.<string, number>} startSettings 
 * @property {Object.<string, number>} settings 
 * @property {number} duration
 * @property {MyEasingType} easeType
 * @property {number} delay
 * @property {boolean} loop
 * @property {Function} callback
 */
ESL.Tween = function () {
    return new Error("This is a static class");
}
/**
 * Tween display object to specific state
 * @param {TweenOptions} tweenOptions
 * @returns {ESL.MyTween}
 */
ESL.createTween = function (tweenOptions) {
    const tween = new ESL.MyTween(
        tweenOptions.target,
        tweenOptions.startSettings ?? {},
        tweenOptions.settings,
        tweenOptions.duration ?? 30,
        ESL.Easing[tweenOptions.easeType] ?? "easeLinear",
        tweenOptions.delay ?? 0,
        tweenOptions.loop ?? false
    );
    if (tweenOptions.callback) {
        tween.onFinish(tweenOptions.callback);
    }
    return tween;
}
/**
 * Tween display object to specific state
 * @param {TweenOptions} tweenOptions
 * @returns {ESL.MyTween}
 */
ESL.startTween = function (tweenOptions) {
    const tween = new ESL.MyTween(
        tweenOptions.target,
        tweenOptions.startSettings ?? {},
        tweenOptions.settings,
        tweenOptions.duration ?? 30,
        ESL.Easing[tweenOptions.easeType] ?? "easeLinear",
        tweenOptions.delay ?? 0,
        tweenOptions.loop ?? false
    );
    if (tweenOptions.callback) {
        tween.onFinish(tweenOptions.callback);
    }
    ESL.addAndStart(tween);
    return tween;
}
/**
 * Add And Start A Tween
 * @param {ESL.MyTween} tween
 */
ESL.addAndStart = function (tween) {
    ESL.MyTweenManager.inst.addTween(tween);
    tween.start();
}

ESL.MyTween = class {
    /**
     * Constructor
     * @param {Sprite} target
     * @param {Object.<string, number>} startSettings
     * @param {Object.<string, number>} settings
     * @param {number} duration
     * @param {Function} easingFunction
     * @param {boolean} loop
     */
    constructor(target, startSettings, settings, duration, easingFunction, delay = 0, loop = false) {
        this._target = target;
        this._startSettings = startSettings;
        this._settings = settings;
        this._duration = duration;
        this._loop = loop;
        this._delayTime = delay;
        this._easingFunction = easingFunction;
        this._started = false;
    }
    /**
     * On Finish
     * @param {Function} callback
     */
    onFinish(callback) {
        this._onFinishCallback = callback;
    }
    /**
     * Start
     */
    start() {
        this._started = true;
        this._frameCount = 0;
        this._frameDirection = 1;
        this.refreshTargetCount();
        this.initStartingValues();
        this.initPropertyValues();
    }
    /**
     * Refresh Target Count
     */
    refreshTargetCount() {
        this._targetCount = this._frameDirection > 0 ? this._duration : 0;
    }
	/**
     * Init Starting Values
     */
    initStartingValues() {
        for (let propertyName in this._startSettings) {
            this._target[propertyName] = this._startSettings[propertyName];
        }
    }
    /**
     * Init Property Values
     */
    initPropertyValues() {
        /** @type {Object.<string, {start: number, change: number}>} */
        this._properties = {};
        for (let propertyName in this._settings) {
            const endValue = this._settings[propertyName];
            const curValue = this._target[propertyName];
            this._properties[propertyName] = {
                start: curValue,
                change: endValue - curValue
            }
        }
    }
    /**
     * Update
     */
    update() {
        if (!this._started) {
            return;
        }
        if (this._delayTime > 0) {
            this._delayTime -= 1;
            return;
        }
        if (this._frameCount != this._targetCount) {
            for (let propertyName in this._properties) {
                const propertyData = this._properties[propertyName];
                var t = this._frameCount;
                var b = propertyData.start;
                var c = propertyData.change;
                var d = this._duration;
                this._target[propertyName] = this._easingFunction(t, b, c, d);
                console.log(propertyName, this[propertyName]);
            }
            this._frameCount += this._frameDirection;
        } else {
            if (this._loop) {
                this._frameDirection *= -1;
                this.refreshTargetCount();
            }
        }
    }
}

ESL.MyTweenManager = class {
    /**
     * Constructor
     */
    constructor() {
        ESL.MyTweenManager.inst = this;
        /** @type {ESL.MyTween[]} */
        this._tweens = [];
    }
    /**
     * Add Tween
     * @param {ESL.MyTween} tween
     */
    addTween(tween) {
        this._tweens.push(tween);
    }
    /**
     * Update
     */
    update() {
        this._tweens.forEach(tween => tween.update());
    }
}
/** @type {ESL.MyTweenManager} */
ESL.MyTweenManager.inst = null;
// #endregion
// #region Math Core
/**
 * ------------------------------------------------------------------------------
 * Math Core
 * ------------------------------------------------------------------------------
 */
ESL.Math = function () {
    return new Error("This is a static class");
}
/**
 * Get random float number from 0 to 1 (excluded)
 * @returns {number}
 */
ESL.Math.random = function () {
    return Math.random();
}
/**
 * Get a random number from min to max (included)
 * @param {number} min 
 * @param {number} max 
 */
ESL.Math.randomInt = function (min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}
/**
 * Clamp a value in a specific range
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 */
ESL.Math.clamp = function (value, min, max) {
    return Math.max(Math.min(value, max), min);;
}
/**
 * Remap a value from a specific range to another range
 * @param {number} value 
 * @param {number} low1 
 * @param {number} high1 
 * @param {number} low2 
 * @param {number} high2 
 * @returns 
 */
ESL.Math.remap = function (value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}
/**
 * Deg To Rad
 * @param {number} deg
 */
ESL.Math.degToRad = function(deg) {
    return (Math.PI / 180) * deg;
}

/**
 * Rad To Deg
 * @param {number} rad
 */
ESL.Math.radToDeg = function(rad) {
    return (180 / Math.PI) * rad;
}
// #endregion
//#region Array Core
/**
 * ------------------------------------------------------------------------------
 * Array Core
 * ------------------------------------------------------------------------------
 */
ESL.Array = function () {
    return new Error("This is a static class");
}

/**
 * Get random element from an array
 * @template T
 * @param {Array<T>} array 
 * @returns {T}
 */
ESL.Array.randomElement = function (array) {
    return array[Math.floor(Math.random() * array.length)];
}
/**
 * Shuffle an array
 * @template T
 * @link https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 * @param {Array<T>} array 
 * @returns {Array<T>}
 */
ESL.Array.shuffle = function (array) {
    let currentIndex = array.length
    let randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}
/**
 * Return a new copy of an array that dont contains falsy values.
 * @template T
 * @param {Array<T>} array 
 * @returns {Array<T>} an array with all falsy values removed
 */
ESL.Array.compact = function (array) {
    return array.filter(Boolean);
}
/**
 * uniq
 * @template T
 * @param {Array<T>} array - List of elements
 * @param {Boolean} [sort=false] - optional flag to sort
 * @return {Array<T>} Returns uniq values list
 */
ESL.Array.uniq = function (array, sort = false) {
    return sort ? [...new Set(array)].sort() : [...new Set(array)];
}
/**
 * intersection
 * @template T
 * @param {...*} args - List of arrays
 * @return {Array<T>} Returns a list of unique values
 */
ESL.Array.intersection = function (...args) {
    const [first, ...rest] = args;
    return first.filter(item => rest.flat().includes(item));
}
/**
 * diff
 * @template T
 * @param {...*} args - List of arrays
 * @return {Array<T>} Returns result of excluded values
 */
ESL.Array.diff = function (...args) {
    const [first, ...rest] = args;
    return first.filter(item => !rest.flat().includes(item));
}
/**
 * Return a list of all object that match multiple condition
 * 
 * @template T
 * @param {Array<T>} list 
 * @param {T} propList 
 */
ESL.Array.where = function (list, propList) {
    return list.filter((object) => {
        return Object.keys(propList).every(prop => {
            return object[prop] == propList[prop];
        });
    });
}
/**
 * Return the first object in the array that match multiple condition
 * 
 * @template T
 * @param {Array<T>} list 
 * @param {T} propList 
 */
ESL.Array.findWhere = function (list, propList) {
    for (let object of list) {
        const status = Object.keys(propList).every(prop => {
            return object[prop] == propList[prop];
        });
        if (status) return object;
    }
    return null;
}
/**
 * Group object by a specific property
 * 
 * @template T
 * @param {Array<T>} list 
 * @param {string} propName 
 * @return {Object.<string, Array<T>}
 */
ESL.Array.groupBy = function (list, propName) {
    /** @type {Object.<string, Array<T>} */
    const map = {}
    list.forEach(object => {
        const array = map[object[propName]] || [];
        if (array.length == 0) {
            map[object[propName]] = array;
        }
        array.push(object);
    });
    return map;
}

/**
 * Dynamic sort an array base on element's property
 * @template T
 * @param {Array<T>} array 
 * @param {string} property 
 */
ESL.Array.dynamicSort = function (array, property) {
    let sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return array.sort(function (a, b) {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    });
}

/**
 * Dynamic sort an array base on multiple element's property
 * @template T
 * @param {Array<T>} array 
 * @param {string[]} properties 
 */
ESL.Array.dynamicSortEx = function (array, properties) {
    var props = properties;
    function dynamicSort(property) {
        var sortOrder = 1;
        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a, b) {
            /* next line works with strings and numbers, 
             * and you may want to customize it to your needs
             */
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    }
    return array.sort(function (obj1, obj2) {
        var i = 0, result = 0, numberOfProperties = props.length;
        /* try getting a different result from 0 (equal)
         * as long as we have extra properties to compare
         */
        while (result === 0 && i < numberOfProperties) {
            result = dynamicSort(props[i])(obj1, obj2);
            i++;
        }
        return result;
    });
}
/**
 * Remove an element from a array
 * @template T
 * @param {Array<T>} array 
 * @param {T} element
 * @returns {boolean}
 */
ESL.Array.remove = function (array, element) {
    let index = array.indexOf(element);
    array.splice(index, 1);
    return index >= 0;
}

// #endregion
// #region Algorithm
ESL.Algorithm = function () {
    return new Error("This is a static class");
}
ESL.Algorithm.PageController = class {
    /**
     * A Page Controller For DSI Plugins.
     * You need to use setScrollCallback to set a callback function when scroll.
     * @param {number} maxItems
     * @param {number} maxVisibleItems
     */
    constructor(maxItems, maxVisibleItems, soundEffect = null) {
        this._listTopIndex = 0;
        this._maxItems = maxItems;
        this._maxVisibleItems = maxVisibleItems;
        this._soundEffect = soundEffect;
    }
    /**
     * Set Scroll Callback
     * @param {Function} callback
     */
    setScrollCallback(callback) {
        this._scrollCallback = callback;
    }
    /**
     * Call Scroll Callback
     */
    callScrollCallback() {
        if (this._scrollCallback) {
            this._scrollCallback();
        }
    }
    /**
     * Set Max Items
     * @param {number} maxItems
     */
    setMaxItems(maxItems) {
        this._maxItems = maxItems;
    }
    /**
     * Max Items
     */
    maxItems() {
        return this._maxItems;
    }
    /**
     * Max Visible Items
     */
    maxVisibleItems() {
        return this._maxVisibleItems;
    }
    /**
     * Can Scroll Down
     */
    canScrollDown() {
        return this._listTopIndex + this.maxVisibleItems() < this.maxItems();
    }
    /**
     * Can Scroll Up
     */
    canScrollUp() {
        return this._listTopIndex > 0;
    }
    /**
     * Scroll Down
     */
    scrollDown() {
        if (this.canScrollDown()) {
            this.playScrollSound();
            this._listTopIndex++;
            this.callScrollCallback();
        }
    }
    /**
     * Scroll Up
     */
    scrollUp() {
        if (this.canScrollUp()) {
            this.playScrollSound();
            this._listTopIndex--;
            this.callScrollCallback();
        }
    }
    /**
     * Is Visible Index
     * @param {number} index
     */
    isVisibleIndex(index) {
        return index >= this._listTopIndex && index < this._listTopIndex + this.maxVisibleItems();
    }
    /**
     * Get Current Page Index
     * @param {number} index
     */
    getCurrentPageIndex(index) {
        return index - this._listTopIndex;
    }
    /**
     * Play Scroll Sound
     */
    playScrollSound() {
        if (this._soundEffect) {
            AudioManager.playSe(this._soundEffect);
        }
    }
}
/**
 * Easy A Star Algorithm
 * @param {(x: number, y: number) => boolean} walkableFunction 
 * @param {Vector2} start 
 * @param {Vector2} end 
 * @returns {Vector2[]}
 */
ESL.Algorithm.easyAStar = function (walkableFunction, start, end) {
    var open = {};
    var close = {};
    open[start.x + "_" + start.y] = {
        pos: start,
        parent: null,
        g: 0,
        h: Math.abs(end.x - start.x) + Math.abs(end.y - start.y)
    };
    while ((!close[end.x + "_" + end.y]) && Object.keys(open).length > 0) {
        var minF = Number.POSITIVE_INFINITY;
        var minFkey = "";
        for (var key in open) {
            if (open.hasOwnProperty(key)) {
                var f = open[key].g + open[key].h;
                if (f < minF) {
                    minF = f;
                    minFkey = key;
                }
            }
        }
        close[minFkey] = open[minFkey];
        delete open[minFkey];
        var curNode = close[minFkey];
        var fourDt = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];
        for (var index = 0; index < fourDt.length; index++) {
            var dt = fourDt[index];
            var tmpPos = { x: curNode.pos.x + dt.x, y: curNode.pos.y + dt.y };
            if (walkableFunction(tmpPos.x, tmpPos.y)) {
                if (!close[tmpPos.x + "_" + tmpPos.y]) {
                    if ((!open[tmpPos.x + "_" + tmpPos.y]) || (open[tmpPos.x + "_" + tmpPos.y].g > curNode.g + 1)) {
                        open[tmpPos.x + "_" + tmpPos.y] = {
                            pos: tmpPos,
                            parent: curNode.pos,
                            g: curNode.g + 1,
                            h: Math.abs(end.x - tmpPos.x) + Math.abs(end.y - tmpPos.y)
                        };
                    }
                }
            }
        }
    }
    if (close[end.x + "_" + end.y]) {
        var path = [];
        path.push(close[end.x + "_" + end.y].pos);
        var parent_1 = close[end.x + "_" + end.y].parent;
        while (parent_1) {
            path.push(parent_1);
            parent_1 = close[parent_1.x + "_" + parent_1.y].parent;
        }
        return path.reverse();
    }
    else {
        return null;
    }
}
//#endregion
/**
 * ------------------------------------------------------------------------------
 * DateTime Core
 * ------------------------------------------------------------------------------
 */
// #region Date Timer
ESL.DateTime = function () {
    return new Error("This is a static class");
}
/**
 * Format In-game frames to real time format.
 * @param {number} frames 
 * @param {boolean} showMins 
 * @param {boolean} showHours 
 * @returns {string}
 */
ESL.DateTime.convertFrameToRealLifeFormat = function (frames, showMins = false, showHours = false) {
    let seconds = Math.floor(frames / 60);
    let mins = Math.floor(frames / 3600);
    let hours = Math.floor(frames / 216000);
    let text = '';
    if (showMins) {
        seconds %= 60;
        text = `${mins}`.padStart(2, "0") + ":" + `${seconds}`.padStart(2, "0");
    }
    if (showMins && showHours) {
        mins %= 60;
        text = `${hours}`.padStart(2, "0") + ":" + `${mins}`.padStart(2, "0") + ":" + `${seconds}`.padStart(2, "0");
    }
    return text;
}
// #endregion
//#region Save Core
/**
 * ------------------------------------------------------------------------------
 * Save Core
 * ------------------------------------------------------------------------------
 */
ESL.SaveableObject = class {
    /**
     * This array will contains multiple array which has 2 values [propetyName, defaultValue].
     * For example [{name: 'Test', defaultValue: 10}]
     * @returns {any[]}
     */
    saveProperties() {
        return [];
    }
    /**
     * Get Save Data
     * @returns {Object} 
     */
    getSaveData() {
        const result = {};
        this.saveProperties().forEach(([property, _]) => {
            let data = this[property];
            if (property.match(/@Arr\((.+?)\):(.+)/i)) {
                property = RegExp.$2;
                const array = this[property] || [];
                const newData = [];
                for (const entry of array) {
                    newData.push(entry.getSaveData());
                }
                data = newData;
            }
            // if (property.match(/@Map\((.+?)\):(.+?)/i)) {
            //     const klass = RegExp.$1;
            //     data = this[RegExp.$2];
            //     let newData = {};
            //     for (const [key, value] of data) {
            //         newData[key] = value.getSaveData();
            //     }
            //     data['special'] = `Map(${klass})`;
            //     data = newData;
            // }
            if (this[property] instanceof ESL.SaveableObject) {
                data = this[property].getSaveData();
                data['klass'] = this[property].constructor.name;
            }
            result[property] = data;
        })
        return (result);
    }
    /**
     * Load Save Data
     * @param {Object} savedData 
     */
    loadSaveData(savedData) {
        this.saveProperties().forEach(([property, defaultValue]) => {
            let value = savedData[property];
            if (property.match(/@Arr\((.+?)\):(.+)/i)) {
                const klass = RegExp.$1;
                property = RegExp.$2;
                const array = savedData[property];
                const newData = [];
                for (const entry of array) {
                    const obj = eval(`new ${klass}()`);
                    obj.loadSaveData(entry)
                    newData.push(obj);
                }
                value = newData;
            }
            if (value && value.klass) {
                value = eval(`new ${value.klass}()`);
                value.loadSaveData(savedData[property]);
            }
            this[property] = value != undefined ? value : defaultValue;
        })
    }
}
//#endregion
//#region Custom Event System
ESL.DispatcherEvent = class {
    /**
     * DispatcherEvent
     * @param {string} eventName
     */
    constructor(eventName) {
        this.eventName = eventName;
        /** @type {Function[]} */
        this.callbacks = [];
        this.callbackTargets = [];
    }
    /**
     * Register Callback
     * @param {Function} callback
     * @param {any} target
     */
    registerCallback(callback, target = null) {
        this.callbacks.push(callback);
        this.callbackTargets.push(target);
    }
    /**
     * Unregister Callback
     * @param {Function} callback
     */
    unregisterCallback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
            this.callbackTargets.splice(index, 1);
        }
    }
    /**
     * Fire
     * @param {any[]} data
     */
    fire(...data) {
        const callbacks = this.callbacks.slice(0);
        callbacks.forEach((callback, index) => {
            const target = this.callbackTargets[index];
            callback.call(target, ...data);
        });
    }
}

ESL.Dispatcher = class {
    /**
     * Constructor
     */
    constructor() {
        this.events = {};
    }
    /**
     * Dispatch
     * @param {string} eventName
     * @param {any[]} data
     */
    dispatch(eventName, ...data) {
        const event = this.events[eventName];
        if (event) {
            event.fire(...data);
        }
    }
    /**
     * On
     * @param {string} eventName
     * @param {Function} callback
     * @param {any} target
     */
    on(eventName, callback, target = null) {
        /** @type {ESL.DispatcherEvent} */
        let event = this.events[eventName];
        if (!event) {
            event = new ESL.DispatcherEvent(eventName);
            this.events[eventName] = event;
        }
        event.registerCallback(callback, target);
    }
    /**
     * Off
     * @param {string} eventName
     * @param {Function} callback
     */
    off(eventName, callback) {
        /** @type {ESL.DispatcherEvent} */
        const event = this.events[eventName];
        if (event && event.callbacks.indexOf(callback) > -1) {
            event.unregisterCallback(callback);
            if (event.callbacks.length === 0) {
                delete this.events[eventName];
            }
        }
    }
    /**
     * Off All Callback of an event
     * @param {string} eventName 
     */
    offAll(eventName) {
        /** @type {ESL.DispatcherEvent} */
        const event = this.events[eventName];
        if (event) {
            event.callbacks.splice(0);
            delete this.events[eventName];
        }
    }
}
ESL.CustomEventDispatcher = new ESL.Dispatcher();
ESL.MainDispatcher = ESL.CustomEventDispatcher;
//#endregion
//#region RPG MAKER APDAPTATION
Object.defineProperty(Sprite.prototype, 'scaleX', {
    get: function () {
        return this.scale.x;
    },
    set: function (v) {
        this.scale.x = v;
    },
    configurable: true
});
Object.defineProperty(Sprite.prototype, 'scaleY', {
    get: function () {
        return this.scale.y;
    },
    set: function (v) {
        this.scale.y = v;
    },
    configurable: true
});

var DSI_Essential_Scene_Base_create = Scene_Base.prototype.create;
Scene_Base.prototype.create = function () {
    DSI_Essential_Scene_Base_create.call(this);
    this.createTweenManager();
}

Scene_Base.prototype.createTweenManager = function () {
    this._tweenManager = new ESL.MyTweenManager();
}

var DSI_Essential_Scene_Base_updateChildren = Scene_Base.prototype.updateChildren;
Scene_Base.prototype.updateChildren = function () {
    DSI_Essential_Scene_Base_updateChildren.call(this);
    this._tweenManager.update();
}

var DSI_Essential_Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function () {
    DSI_Essential_Game_System_initialize.call(this);
    this.recreateESLSaveableObjects();
}

Game_System.prototype.createESLSaveableObjects = function () {
    // To be aliased by other plugins
}

Game_System.prototype.recreateESLSaveableObjects = function () {
    this.createESLSaveableObjects();
    const savedData = this.mySavedData;
    for (let key in savedData) {
        const object = this[key];
        const data = savedData[key];
        if (object instanceof ESL.SaveableObject) {
            object.loadSaveData(data);
        }
    }
}

var DSI_Essential_Game_System_onBeforeSave = Game_System.prototype.onBeforeSave;
Game_System.prototype.onBeforeSave = function () {
    DSI_Essential_Game_System_onBeforeSave.call(this);
    const savedData = {};
    for (let key in this) {
        const object = this[key];
        if (object instanceof ESL.SaveableObject) {
            savedData[key] = object.getSaveData();
            delete this[key];
        }
    }
    this.mySavedData = savedData;
};

var DSI_Essential_DataManager_saveGame = DataManager.saveGame;
DataManager.saveGame = function (savefileId) {
    const result = DSI_Essential_DataManager_saveGame.call(this, savefileId);
    if (result instanceof Promise) {
        // For MZ support
        return new Promise((resolve, reject) => {
            result.then((res) => {
                $gameSystem.recreateESLSaveableObjects();
                resolve(res);
            })
        })
    }
    if (result) {
        $gameSystem.recreateESLSaveableObjects();
    }
    return result;
}

var DSI_Essential_DataManager_loadGame = DataManager.loadGame;
DataManager.loadGame = function (savefileId) {
    const result = DSI_Essential_DataManager_loadGame.call(this, savefileId);
    if (result instanceof Promise) {
        // For MZ support
        return new Promise((resolve, reject) => {
            result.then((res) => {
                $gameSystem.recreateESLSaveableObjects();
                resolve(res);
            })
        })
    }
    if (result) {
        $gameSystem.recreateESLSaveableObjects();
    }
    return result;
};

if (ESL.Params.MemoryLeakDebugMode) {
    var DSI_Sys2_MainMenu_PIXI_DisplayObject_destroy = PIXI.DisplayObject.prototype.destroy;
    PIXI.DisplayObject.prototype.destroy = function () {
        console.log("Destroyed", this);
        DSI_Sys2_MainMenu_PIXI_DisplayObject_destroy.call(this);
    }
}

ImageManager.loadCustomItemImage = function (filename) {
    return ImageManager.loadBitmap("img/itemIcons/", filename);
}

if (ESL.RPG.NAME == "MV") {

    const DSI_Essential_Scene_Boot_loadCustomNotetags = Scene_Boot.prototype.loadCustomNotetags;
    Scene_Boot.prototype.loadCustomNotetags = function () {
        DSI_Essential_Scene_Boot_loadCustomNotetags.call(this);
        this.loadCustomItemImageNotetag();
    }

    Scene_Boot.prototype.loadCustomItemImageNotetag = function () {
        [...$dataItems, ...$dataArmors, ...$dataWeapons].forEach(entry => {
            if (!entry) return
            /** @type {string} */
            let note = entry.note
            note.split(/[\r\n]+/i).forEach(line => {
                if (line.match(/<custom image:\s*(.+)>/i)) {
                    entry.customImage = RegExp.$1.trim();
                }
            });
        });
    }

    var DSI_Essential_Input__onKeyDown = Input._onKeyDown;
    Input._onKeyDown = function (e) {
        DSI_Essential_Input__onKeyDown.call(this, e);
        ESL.MainDispatcher.dispatch("onKeyDown", e);
    };

}

//#endregion
//========================================================================
// END OF PLUGIN
//========================================================================