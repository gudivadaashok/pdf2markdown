var Sequelize = require('sequelize');
var Analyzer = require('./analyzer/analyzer.js');
var Extractor = require('./extractor/extractor.js');
var Logger = require('../logger/logger.js');
class Markdown{
  constructor(config,stream){
    this._readConfig(config);
    this.spaces = {};
    this.document = "";
  }
  async convert(doc){
    this.analysis = await Analyzer.run(doc.id,this.config);
    var doc = await DB.Document.findOne();
    var pages = await doc.getPages();
    var fs = require('fs');
    fs.writeFileSync("test/fannie.md","");
    
    for(var i = 0; i<pages.length; i++){
      Logger.info("Extracting page "+(i+1)+"/"+pages.length);
      this.document += (await Extractor.run(pages[i],this.analysis,this.config));
      
    }
    return this.document;
  } 
  _render(){
    
  } 
  //Currently page dimensions is in inches only, TODO: add other metrics and convert them to inches
  _readConfig(config){
    this.config = config;
    
    var diagonal = 13.901438774457844;
    // Dimensions
    if(config.dimensions && config.dimensions.width && config.dimensions.height){
      diagonal = Math.sqrt(Math.pow(config.dimensions.width,2) + Math.pow(config.dimensions.height,2));
      this.config.dimensions.width = config.dimensions.width;
      this.config.dimensions.height = config.dimensions.height;
    }
    // RawMargins in inches
    if(config.margin){
      this.config.rawMargin.right = config.margin.right ? config.margin.right : this.config.rawMargin.right;
      this.config.rawMargin.left = config.margin.left ? config.margin.left : this.config.rawMargin.left;
      this.config.rawMargin.top = config.margin.top ? config.margin.top : this.config.rawMargin.top;
      this.config.rawMargin.bottom = config.margin.bottom ? config.margin.bottom : this.config.rawMargin.bottom;
    }
    //Precomputed margin value, needs * by page diagonal to get # of pixels for margin
    this.config.margin = {
      right: this.config.rawMargin.right / diagonal,
      left: this.config.rawMargin.left / diagonal,
      top: this.config.rawMargin.top / diagonal,
      bottom: this.config.rawMargin.bottom / diagonal
    }
  }
  _defaultConfig(){
    var inchPrecompute = 0.07193500012656064;
    return {
      // in inches
      dimensions: {
        height: 11,
        width: 8.5
      },        
      // in inches, * user will provide rawMargin as 'margin'
      // it gets translated to rawMargin and precomputed margin values
      rawMargin:{
        right: 1,
        left: 1,
        top: 1,
        bottom: 1
      },
      ul:{
        // tokens that should match upon to trigger as match for beginning of line
        tokens: ['\u25A0','-','*','+','•'],
        // UNIMPLEMENTED
        // Image hashes to detect as list
        imageHashes: [],
        // UNIMPLEMENTED, just does first '-'
        // from left to right the bullet style to use for rendering to markdown as nesting occurs
        // * wraps around if deeper than 3
        bulletStyle: ['-','+','*']
      },
      ol:{
        // TODO: needs to be more robust:
        // Matches on:
        // (1)  sdfsdfsdf
        // 1. sdfsdfsdf
        // a. sdfsdfsdf
        // (a) sdfsdf
        // a) sdfsdfsdf
        // 1) asdfsdf
        regex: /(^\s*(\d+\s*\.*|\w\s*\.)\s+)|(^\s*\(?\s*(\d?|\w+)\s*\)\s+)/,
        // UNIMPLEMENTED
        ignoreList: [],
        // UNIMPLEMENTED
        specialList: [],
      },
      // TODO: what to do with headers 
      // headers:{} 
      // TODO: what to do with footers
      // footers:{} 
      font:{
        bold: [],
        italic: []
      },
      // UNIMPLEMENTED
      // Version 2 TODO: implement this logic
      spaceHeuristics:[        
        {
          // identifier for conditions
          id: 'high-tolerance',
          // what to characters to match
          chars: "wWMmR:ABCDEFGHIJKLMNOPQRSTUVWXYZ",
          // lower number means it will detect more things as a space
          tolerance: 1.6,
          // Before After either check to trigger tolerance:
          // 1:  true
          // 0:  either true or false
          // -1: false
          before: 1,
          after: 0,
          // Whether to just stop if this heuristic is true
          shortCircuit: false,
          // Whether to run heuristic based on result of previous heuristic
          condition:[{
            // id of heuristic
            id: '',
            // if heuristic resolved to condition we run this heuristic 
            condition: false,            
          }],
          // Exact matches of a set of characters that should have space after
          match: []
        },
      ],
      // UNIMPLEMENTED, single only
      spacing: 'single',
      headings:{
        h1: {
          size: 32,
          // +/- tolerance from size
          tolerance: 5,
          // Set font names explicitly for heading
          // fontNames: []
        },
        h2: { 
          size: 24,
          tolerance: 2
        },
        h3: {
          size: 20,
          tolerance: 2
        },
        h4: {
          size: 16,
          tolerance: 1,
          // Number up to 100 correspondng to the maximum percent allowed to be considered for heading
          percent: 10,
          // scale percent: percent * (total # of characters in document)/ (scalePercent)
          // This is useful for documents where headings may appear more than a percent and 
          // tuning it is difficult so scaling it to the # of characters helps tune it
          scalePercent: 10000,
          // ignore this heading is number of fonts triggered is over this number
          maxNumberFonts: 10
        },
        h5: {
          size: 13,
          tolerance: 1,
          percent: 10,
          scalePercent: 10000,
          maxNumberFonts: 10
        },
      },
      table:{
        // remove rows and columns that are empty
        cleanTable: false,
        // pad cells so that column lines line up in markdown
        mdpadCells: true,
        // UNIMPLEMENTED
        // set alignment of all columns
        renderAlignment: 'left',
        // UNIMPLEMENTED 
        // embed html to render multiline or other formatting located in cells, otherwise it dumps it on one line
        embedHtml: false
      },
      // UNIMPLEMENTED
      // Text layout in separate columns
      // TODO:
      // range of pages that are multicolumns
      // tolerance,
      // percents etc.
      columns: {},
      // UNIMPLEMENTED
      links:{
        // link to headings within same file, different files etc how to do
        relativeLinks:{}
      },
      images:{
        // keep images
        include: true
      }     
    }
    
    
  }
}
module.exports = Markdown;

