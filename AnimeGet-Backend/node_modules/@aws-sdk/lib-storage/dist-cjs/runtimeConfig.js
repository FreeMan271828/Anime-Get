"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtimeConfig = void 0;
const fs_1 = require("fs");
const runtimeConfig_shared_1 = require("./runtimeConfig.shared");
exports.runtimeConfig = {
    ...runtimeConfig_shared_1.runtimeConfigShared,
    runtime: "node",
    lstatSync: fs_1.lstatSync,
    isFileReadStream(f) {
        return f instanceof fs_1.ReadStream;
    },
};
