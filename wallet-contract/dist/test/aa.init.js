"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspect_custom_symbol = void 0;
require("./chaiHelper");
const ethers = require('ethers');
exports.inspect_custom_symbol = Symbol.for('nodejs.util.inspect.custom');
// @ts-ignore
ethers.BigNumber.prototype[exports.inspect_custom_symbol] = function () { return `BigNumber ${parseInt(this._hex)}`; };
