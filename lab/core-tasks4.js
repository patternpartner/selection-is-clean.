// lab/core-tasks4.js - #338: grading tables for the 65,536 four-input functions (16-bit truth tables, x1=0xFF00 x2=0xF0F0
// x3=0xCCCC x4=0xAAAA), written by lab/nand4.c. SZ4: exact NAND formula size. CSZ4: exact NAND circuit size where the search
// reached it; CMAX (the largest value stored) means AT LEAST CMAX - no circuit of CMAX-1 gates or fewer computes it.
'use strict';
const fs=require('fs'), path=require('path');
const SZ4=Uint8Array.from(fs.readFileSync(path.join(__dirname,'nand4-sz.bin'))), CSZ4=Uint8Array.from(fs.readFileSync(path.join(__dirname,'nand4-csz.bin')));
let CMAX=0; for(const v of CSZ4) if(v>CMAX)CMAX=v;
module.exports={SZ4,CSZ4,CMAX};
