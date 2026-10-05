#!/usr/bin/env node
'use strict';
process.env.MODE = 'reconfirm';
const {reconfirm} = require('./search.js');
reconfirm().catch(e => { console.error(e && e.stack || e); process.exit(1); });
