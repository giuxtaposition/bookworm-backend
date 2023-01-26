"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
const server_1 = require("./server");
void (0, db_1.connectToDB)();
void (0, server_1.startServer)();
