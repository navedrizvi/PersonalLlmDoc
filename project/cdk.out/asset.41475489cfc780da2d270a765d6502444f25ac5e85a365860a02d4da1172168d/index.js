"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// get-one.ts
var get_one_exports = {};
__export(get_one_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(get_one_exports);
var TABLE_NAME = process.env.TABLE_NAME || "";
var handler = async (event = {}) => {
  console.log(event);
  console.log("hello");
  console.log(TABLE_NAME);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
