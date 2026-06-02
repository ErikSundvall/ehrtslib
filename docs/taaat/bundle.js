var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to2, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to2, key) && key !== except)
        __defProp(to2, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to2;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/util.js
var require_util = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/util.js"(exports) {
    "use strict";
    var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
    var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
    var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
    var regexName = new RegExp("^" + nameRegexp + "$");
    var getAllMatches = function(string, regex) {
      const matches = [];
      let match = regex.exec(string);
      while (match) {
        const allmatches = [];
        allmatches.startIndex = regex.lastIndex - match[0].length;
        const len = match.length;
        for (let index = 0; index < len; index++) {
          allmatches.push(match[index]);
        }
        matches.push(allmatches);
        match = regex.exec(string);
      }
      return matches;
    };
    var isName = function(string) {
      const match = regexName.exec(string);
      return !(match === null || typeof match === "undefined");
    };
    exports.isExist = function(v2) {
      return typeof v2 !== "undefined";
    };
    exports.isEmptyObject = function(obj) {
      return Object.keys(obj).length === 0;
    };
    exports.merge = function(target, a2, arrayMode) {
      if (a2) {
        const keys = Object.keys(a2);
        const len = keys.length;
        for (let i2 = 0; i2 < len; i2++) {
          if (arrayMode === "strict") {
            target[keys[i2]] = [a2[keys[i2]]];
          } else {
            target[keys[i2]] = a2[keys[i2]];
          }
        }
      }
    };
    exports.getValue = function(v2) {
      if (exports.isExist(v2)) {
        return v2;
      } else {
        return "";
      }
    };
    var DANGEROUS_PROPERTY_NAMES = [
      // '__proto__',
      // 'constructor',
      // 'prototype',
      "hasOwnProperty",
      "toString",
      "valueOf",
      "__defineGetter__",
      "__defineSetter__",
      "__lookupGetter__",
      "__lookupSetter__"
    ];
    var criticalProperties = ["__proto__", "constructor", "prototype"];
    exports.isName = isName;
    exports.getAllMatches = getAllMatches;
    exports.nameRegexp = nameRegexp;
    exports.DANGEROUS_PROPERTY_NAMES = DANGEROUS_PROPERTY_NAMES;
    exports.criticalProperties = criticalProperties;
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/validator.js
var require_validator = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/validator.js"(exports) {
    "use strict";
    var util = require_util();
    var defaultOptions = {
      allowBooleanAttributes: false,
      //A tag can have attributes without any value
      unpairedTags: []
    };
    exports.validate = function(xmlData, options) {
      options = Object.assign({}, defaultOptions, options);
      const tags = [];
      let tagFound = false;
      let reachedRoot = false;
      if (xmlData[0] === "\uFEFF") {
        xmlData = xmlData.substr(1);
      }
      for (let i2 = 0; i2 < xmlData.length; i2++) {
        if (xmlData[i2] === "<" && xmlData[i2 + 1] === "?") {
          i2 += 2;
          i2 = readPI(xmlData, i2);
          if (i2.err)
            return i2;
        } else if (xmlData[i2] === "<") {
          let tagStartPos = i2;
          i2++;
          if (xmlData[i2] === "!") {
            i2 = readCommentAndCDATA(xmlData, i2);
            continue;
          } else {
            let closingTag = false;
            if (xmlData[i2] === "/") {
              closingTag = true;
              i2++;
            }
            let tagName = "";
            for (; i2 < xmlData.length && xmlData[i2] !== ">" && xmlData[i2] !== " " && xmlData[i2] !== "	" && xmlData[i2] !== "\n" && xmlData[i2] !== "\r"; i2++) {
              tagName += xmlData[i2];
            }
            tagName = tagName.trim();
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substring(0, tagName.length - 1);
              i2--;
            }
            if (!validateTagName(tagName)) {
              let msg;
              if (tagName.trim().length === 0) {
                msg = "Invalid space after '<'.";
              } else {
                msg = "Tag '" + tagName + "' is an invalid name.";
              }
              return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i2));
            }
            const result = readAttributeStr(xmlData, i2);
            if (result === false) {
              return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i2));
            }
            let attrStr = result.value;
            i2 = result.index;
            if (attrStr[attrStr.length - 1] === "/") {
              const attrStrStart = i2 - attrStr.length;
              attrStr = attrStr.substring(0, attrStr.length - 1);
              const isValid = validateAttributeString(attrStr, options);
              if (isValid === true) {
                tagFound = true;
              } else {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
              }
            } else if (closingTag) {
              if (!result.tagClosed) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i2));
              } else if (attrStr.trim().length > 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
              } else if (tags.length === 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
              } else {
                const otg = tags.pop();
                if (tagName !== otg.tagName) {
                  let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                  return getErrorObject(
                    "InvalidTag",
                    "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                    getLineNumberForPosition(xmlData, tagStartPos)
                  );
                }
                if (tags.length == 0) {
                  reachedRoot = true;
                }
              }
            } else {
              const isValid = validateAttributeString(attrStr, options);
              if (isValid !== true) {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i2 - attrStr.length + isValid.err.line));
              }
              if (reachedRoot === true) {
                return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i2));
              } else if (options.unpairedTags.indexOf(tagName) !== -1) {
              } else {
                tags.push({ tagName, tagStartPos });
              }
              tagFound = true;
            }
            for (i2++; i2 < xmlData.length; i2++) {
              if (xmlData[i2] === "<") {
                if (xmlData[i2 + 1] === "!") {
                  i2++;
                  i2 = readCommentAndCDATA(xmlData, i2);
                  continue;
                } else if (xmlData[i2 + 1] === "?") {
                  i2 = readPI(xmlData, ++i2);
                  if (i2.err)
                    return i2;
                } else {
                  break;
                }
              } else if (xmlData[i2] === "&") {
                const afterAmp = validateAmpersand(xmlData, i2);
                if (afterAmp == -1)
                  return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i2));
                i2 = afterAmp;
              } else {
                if (reachedRoot === true && !isWhiteSpace(xmlData[i2])) {
                  return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i2));
                }
              }
            }
            if (xmlData[i2] === "<") {
              i2--;
            }
          }
        } else {
          if (isWhiteSpace(xmlData[i2])) {
            continue;
          }
          return getErrorObject("InvalidChar", "char '" + xmlData[i2] + "' is not expected.", getLineNumberForPosition(xmlData, i2));
        }
      }
      if (!tagFound) {
        return getErrorObject("InvalidXml", "Start tag expected.", 1);
      } else if (tags.length == 1) {
        return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
      } else if (tags.length > 0) {
        return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t2) => t2.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
      }
      return true;
    };
    function isWhiteSpace(char) {
      return char === " " || char === "	" || char === "\n" || char === "\r";
    }
    function readPI(xmlData, i2) {
      const start2 = i2;
      for (; i2 < xmlData.length; i2++) {
        if (xmlData[i2] == "?" || xmlData[i2] == " ") {
          const tagname = xmlData.substr(start2, i2 - start2);
          if (i2 > 5 && tagname === "xml") {
            return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i2));
          } else if (xmlData[i2] == "?" && xmlData[i2 + 1] == ">") {
            i2++;
            break;
          } else {
            continue;
          }
        }
      }
      return i2;
    }
    function readCommentAndCDATA(xmlData, i2) {
      if (xmlData.length > i2 + 5 && xmlData[i2 + 1] === "-" && xmlData[i2 + 2] === "-") {
        for (i2 += 3; i2 < xmlData.length; i2++) {
          if (xmlData[i2] === "-" && xmlData[i2 + 1] === "-" && xmlData[i2 + 2] === ">") {
            i2 += 2;
            break;
          }
        }
      } else if (xmlData.length > i2 + 8 && xmlData[i2 + 1] === "D" && xmlData[i2 + 2] === "O" && xmlData[i2 + 3] === "C" && xmlData[i2 + 4] === "T" && xmlData[i2 + 5] === "Y" && xmlData[i2 + 6] === "P" && xmlData[i2 + 7] === "E") {
        let angleBracketsCount = 1;
        for (i2 += 8; i2 < xmlData.length; i2++) {
          if (xmlData[i2] === "<") {
            angleBracketsCount++;
          } else if (xmlData[i2] === ">") {
            angleBracketsCount--;
            if (angleBracketsCount === 0) {
              break;
            }
          }
        }
      } else if (xmlData.length > i2 + 9 && xmlData[i2 + 1] === "[" && xmlData[i2 + 2] === "C" && xmlData[i2 + 3] === "D" && xmlData[i2 + 4] === "A" && xmlData[i2 + 5] === "T" && xmlData[i2 + 6] === "A" && xmlData[i2 + 7] === "[") {
        for (i2 += 8; i2 < xmlData.length; i2++) {
          if (xmlData[i2] === "]" && xmlData[i2 + 1] === "]" && xmlData[i2 + 2] === ">") {
            i2 += 2;
            break;
          }
        }
      }
      return i2;
    }
    var doubleQuote = '"';
    var singleQuote = "'";
    function readAttributeStr(xmlData, i2) {
      let attrStr = "";
      let startChar = "";
      let tagClosed = false;
      for (; i2 < xmlData.length; i2++) {
        if (xmlData[i2] === doubleQuote || xmlData[i2] === singleQuote) {
          if (startChar === "") {
            startChar = xmlData[i2];
          } else if (startChar !== xmlData[i2]) {
          } else {
            startChar = "";
          }
        } else if (xmlData[i2] === ">") {
          if (startChar === "") {
            tagClosed = true;
            break;
          }
        }
        attrStr += xmlData[i2];
      }
      if (startChar !== "") {
        return false;
      }
      return {
        value: attrStr,
        index: i2,
        tagClosed
      };
    }
    var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
    function validateAttributeString(attrStr, options) {
      const matches = util.getAllMatches(attrStr, validAttrStrRegxp);
      const attrNames = {};
      for (let i2 = 0; i2 < matches.length; i2++) {
        if (matches[i2][1].length === 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i2][2] + "' has no space in starting.", getPositionFromMatch(matches[i2]));
        } else if (matches[i2][3] !== void 0 && matches[i2][4] === void 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i2][2] + "' is without value.", getPositionFromMatch(matches[i2]));
        } else if (matches[i2][3] === void 0 && !options.allowBooleanAttributes) {
          return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i2][2] + "' is not allowed.", getPositionFromMatch(matches[i2]));
        }
        const attrName = matches[i2][2];
        if (!validateAttrName(attrName)) {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i2]));
        }
        if (!attrNames.hasOwnProperty(attrName)) {
          attrNames[attrName] = 1;
        } else {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i2]));
        }
      }
      return true;
    }
    function validateNumberAmpersand(xmlData, i2) {
      let re2 = /\d/;
      if (xmlData[i2] === "x") {
        i2++;
        re2 = /[\da-fA-F]/;
      }
      for (; i2 < xmlData.length; i2++) {
        if (xmlData[i2] === ";")
          return i2;
        if (!xmlData[i2].match(re2))
          break;
      }
      return -1;
    }
    function validateAmpersand(xmlData, i2) {
      i2++;
      if (xmlData[i2] === ";")
        return -1;
      if (xmlData[i2] === "#") {
        i2++;
        return validateNumberAmpersand(xmlData, i2);
      }
      let count2 = 0;
      for (; i2 < xmlData.length; i2++, count2++) {
        if (xmlData[i2].match(/\w/) && count2 < 20)
          continue;
        if (xmlData[i2] === ";")
          break;
        return -1;
      }
      return i2;
    }
    function getErrorObject(code, message, lineNumber) {
      return {
        err: {
          code,
          msg: message,
          line: lineNumber.line || lineNumber,
          col: lineNumber.col
        }
      };
    }
    function validateAttrName(attrName) {
      return util.isName(attrName);
    }
    function validateTagName(tagname) {
      return util.isName(tagname);
    }
    function getLineNumberForPosition(xmlData, index) {
      const lines = xmlData.substring(0, index).split(/\r?\n/);
      return {
        line: lines.length,
        // column number is last line's length + 1, because column numbering starts at 1:
        col: lines[lines.length - 1].length + 1
      };
    }
    function getPositionFromMatch(match) {
      return match.startIndex + match[1].length;
    }
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var require_OptionsBuilder = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js"(exports) {
    var { DANGEROUS_PROPERTY_NAMES, criticalProperties } = require_util();
    var defaultOnDangerousProperty = (name) => {
      if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
        return "__" + name;
      }
      return name;
    };
    var defaultOptions = {
      preserveOrder: false,
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      removeNSPrefix: false,
      // remove NS from tag name or attribute name if true
      allowBooleanAttributes: false,
      //a tag can have attributes without any value
      //ignoreRootElement : false,
      parseTagValue: true,
      parseAttributeValue: false,
      trimValues: true,
      //Trim string values of tag and attributes
      cdataPropName: false,
      numberParseOptions: {
        hex: true,
        leadingZeros: true,
        eNotation: true
      },
      tagValueProcessor: function(tagName, val) {
        return val;
      },
      attributeValueProcessor: function(attrName, val) {
        return val;
      },
      stopNodes: [],
      //nested tags will not be parsed even for errors
      alwaysCreateTextNode: false,
      isArray: () => false,
      commentPropName: false,
      unpairedTags: [],
      processEntities: true,
      htmlEntities: false,
      ignoreDeclaration: false,
      ignorePiTags: false,
      transformTagName: false,
      transformAttributeName: false,
      updateTag: function(tagName, jPath, attrs) {
        return tagName;
      },
      // skipEmptyListItem: false
      captureMetaData: false,
      maxNestedTags: 100,
      strictReservedNames: true,
      onDangerousProperty: defaultOnDangerousProperty
    };
    function validatePropertyName(propertyName, optionName) {
      if (typeof propertyName !== "string") {
        return;
      }
      const normalized = propertyName.toLowerCase();
      if (DANGEROUS_PROPERTY_NAMES.some((dangerous) => normalized === dangerous.toLowerCase())) {
        throw new Error(
          `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
        );
      }
      if (criticalProperties.some((dangerous) => normalized === dangerous.toLowerCase())) {
        throw new Error(
          `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
        );
      }
    }
    function normalizeProcessEntities(value) {
      if (typeof value === "boolean") {
        return {
          enabled: value,
          // true or false
          maxEntitySize: 1e4,
          maxExpansionDepth: 10,
          maxTotalExpansions: 1e3,
          maxExpandedLength: 1e5,
          allowedTags: null,
          tagFilter: null
        };
      }
      if (typeof value === "object" && value !== null) {
        return {
          enabled: value.enabled !== false,
          maxEntitySize: Math.max(1, value.maxEntitySize ?? 1e4),
          maxExpansionDepth: Math.max(1, value.maxExpansionDepth ?? 1e4),
          maxTotalExpansions: Math.max(1, value.maxTotalExpansions ?? Infinity),
          maxExpandedLength: Math.max(1, value.maxExpandedLength ?? 1e5),
          maxEntityCount: Math.max(1, value.maxEntityCount ?? 1e3),
          allowedTags: value.allowedTags ?? null,
          tagFilter: value.tagFilter ?? null
        };
      }
      return normalizeProcessEntities(true);
    }
    var buildOptions = function(options) {
      const built = Object.assign({}, defaultOptions, options);
      const propertyNameOptions = [
        { value: built.attributeNamePrefix, name: "attributeNamePrefix" },
        { value: built.attributesGroupName, name: "attributesGroupName" },
        { value: built.textNodeName, name: "textNodeName" },
        { value: built.cdataPropName, name: "cdataPropName" },
        { value: built.commentPropName, name: "commentPropName" }
      ];
      for (const { value, name } of propertyNameOptions) {
        if (value) {
          validatePropertyName(value, name);
        }
      }
      if (built.onDangerousProperty === null) {
        built.onDangerousProperty = defaultOnDangerousProperty;
      }
      built.processEntities = normalizeProcessEntities(built.processEntities);
      return built;
    };
    exports.buildOptions = buildOptions;
    exports.defaultOptions = defaultOptions;
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var require_xmlNode = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/xmlNode.js"(exports, module) {
    "use strict";
    var XmlNode = class {
      constructor(tagname) {
        this.tagname = tagname;
        this.child = [];
        this[":@"] = {};
      }
      add(key, val) {
        if (key === "__proto__")
          key = "#__proto__";
        this.child.push({ [key]: val });
      }
      addChild(node) {
        if (node.tagname === "__proto__")
          node.tagname = "#__proto__";
        if (node[":@"] && Object.keys(node[":@"]).length > 0) {
          this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
        } else {
          this.child.push({ [node.tagname]: node.child });
        }
      }
    };
    module.exports = XmlNode;
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
var require_DocTypeReader = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js"(exports, module) {
    var util = require_util();
    var DocTypeReader = class {
      constructor(options) {
        this.suppressValidationErr = !options;
        this.options = options || {};
      }
      readDocType(xmlData, i2) {
        const entities = /* @__PURE__ */ Object.create(null);
        let entityCount = 0;
        if (xmlData[i2 + 3] === "O" && xmlData[i2 + 4] === "C" && xmlData[i2 + 5] === "T" && xmlData[i2 + 6] === "Y" && xmlData[i2 + 7] === "P" && xmlData[i2 + 8] === "E") {
          i2 = i2 + 9;
          let angleBracketsCount = 1;
          let hasBody = false, comment = false;
          let exp = "";
          for (; i2 < xmlData.length; i2++) {
            if (xmlData[i2] === "<" && !comment) {
              if (hasBody && hasSeq(xmlData, "!ENTITY", i2)) {
                i2 += 7;
                let entityName, val;
                [entityName, val, i2] = this.readEntityExp(xmlData, i2 + 1, this.suppressValidationErr);
                if (val.indexOf("&") === -1) {
                  if (this.options.enabled !== false && this.options.maxEntityCount != null && entityCount >= this.options.maxEntityCount) {
                    throw new Error(
                      `Entity count (${entityCount + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`
                    );
                  }
                  const escaped = entityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                  entities[entityName] = {
                    regx: RegExp(`&${escaped};`, "g"),
                    val
                  };
                  entityCount++;
                }
              } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i2)) {
                i2 += 8;
                const { index } = this.readElementExp(xmlData, i2 + 1);
                i2 = index;
              } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i2)) {
                i2 += 8;
              } else if (hasBody && hasSeq(xmlData, "!NOTATION", i2)) {
                i2 += 9;
                const { index } = this.readNotationExp(xmlData, i2 + 1, this.suppressValidationErr);
                i2 = index;
              } else if (hasSeq(xmlData, "!--", i2)) {
                comment = true;
              } else {
                throw new Error(`Invalid DOCTYPE`);
              }
              angleBracketsCount++;
              exp = "";
            } else if (xmlData[i2] === ">") {
              if (comment) {
                if (xmlData[i2 - 1] === "-" && xmlData[i2 - 2] === "-") {
                  comment = false;
                  angleBracketsCount--;
                }
              } else {
                angleBracketsCount--;
              }
              if (angleBracketsCount === 0) {
                break;
              }
            } else if (xmlData[i2] === "[") {
              hasBody = true;
            } else {
              exp += xmlData[i2];
            }
          }
          if (angleBracketsCount !== 0) {
            throw new Error(`Unclosed DOCTYPE`);
          }
        } else {
          throw new Error(`Invalid Tag instead of DOCTYPE`);
        }
        return { entities, i: i2 };
      }
      readEntityExp(xmlData, i2) {
        i2 = skipWhitespace(xmlData, i2);
        let entityName = "";
        while (i2 < xmlData.length && !/\s/.test(xmlData[i2]) && xmlData[i2] !== '"' && xmlData[i2] !== "'") {
          entityName += xmlData[i2];
          i2++;
        }
        validateEntityName(entityName);
        i2 = skipWhitespace(xmlData, i2);
        if (!this.suppressValidationErr) {
          if (xmlData.substring(i2, i2 + 6).toUpperCase() === "SYSTEM") {
            throw new Error("External entities are not supported");
          } else if (xmlData[i2] === "%") {
            throw new Error("Parameter entities are not supported");
          }
        }
        let entityValue = "";
        [i2, entityValue] = this.readIdentifierVal(xmlData, i2, "entity");
        if (this.options.enabled !== false && this.options.maxEntitySize != null && entityValue.length > this.options.maxEntitySize) {
          throw new Error(
            `Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`
          );
        }
        i2--;
        return [entityName, entityValue, i2];
      }
      readNotationExp(xmlData, i2) {
        i2 = skipWhitespace(xmlData, i2);
        let notationName = "";
        while (i2 < xmlData.length && !/\s/.test(xmlData[i2])) {
          notationName += xmlData[i2];
          i2++;
        }
        !this.suppressValidationErr && validateEntityName(notationName);
        i2 = skipWhitespace(xmlData, i2);
        const identifierType = xmlData.substring(i2, i2 + 6).toUpperCase();
        if (!this.suppressValidationErr && identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
          throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
        }
        i2 += identifierType.length;
        i2 = skipWhitespace(xmlData, i2);
        let publicIdentifier = null;
        let systemIdentifier = null;
        if (identifierType === "PUBLIC") {
          [i2, publicIdentifier] = this.readIdentifierVal(xmlData, i2, "publicIdentifier");
          i2 = skipWhitespace(xmlData, i2);
          if (xmlData[i2] === '"' || xmlData[i2] === "'") {
            [i2, systemIdentifier] = this.readIdentifierVal(xmlData, i2, "systemIdentifier");
          }
        } else if (identifierType === "SYSTEM") {
          [i2, systemIdentifier] = this.readIdentifierVal(xmlData, i2, "systemIdentifier");
          if (!this.suppressValidationErr && !systemIdentifier) {
            throw new Error("Missing mandatory system identifier for SYSTEM notation");
          }
        }
        return { notationName, publicIdentifier, systemIdentifier, index: --i2 };
      }
      readIdentifierVal(xmlData, i2, type2) {
        let identifierVal = "";
        const startChar = xmlData[i2];
        if (startChar !== '"' && startChar !== "'") {
          throw new Error(`Expected quoted string, found "${startChar}"`);
        }
        i2++;
        while (i2 < xmlData.length && xmlData[i2] !== startChar) {
          identifierVal += xmlData[i2];
          i2++;
        }
        if (xmlData[i2] !== startChar) {
          throw new Error(`Unterminated ${type2} value`);
        }
        i2++;
        return [i2, identifierVal];
      }
      readElementExp(xmlData, i2) {
        i2 = skipWhitespace(xmlData, i2);
        let elementName = "";
        while (i2 < xmlData.length && !/\s/.test(xmlData[i2])) {
          elementName += xmlData[i2];
          i2++;
        }
        if (!this.suppressValidationErr && !util.isName(elementName)) {
          throw new Error(`Invalid element name: "${elementName}"`);
        }
        i2 = skipWhitespace(xmlData, i2);
        let contentModel = "";
        if (xmlData[i2] === "E" && hasSeq(xmlData, "MPTY", i2)) {
          i2 += 4;
        } else if (xmlData[i2] === "A" && hasSeq(xmlData, "NY", i2)) {
          i2 += 2;
        } else if (xmlData[i2] === "(") {
          i2++;
          while (i2 < xmlData.length && xmlData[i2] !== ")") {
            contentModel += xmlData[i2];
            i2++;
          }
          if (xmlData[i2] !== ")") {
            throw new Error("Unterminated content model");
          }
        } else if (!this.suppressValidationErr) {
          throw new Error(`Invalid Element Expression, found "${xmlData[i2]}"`);
        }
        return {
          elementName,
          contentModel: contentModel.trim(),
          index: i2
        };
      }
      readAttlistExp(xmlData, i2) {
        i2 = skipWhitespace(xmlData, i2);
        let elementName = "";
        while (i2 < xmlData.length && !/\s/.test(xmlData[i2])) {
          elementName += xmlData[i2];
          i2++;
        }
        validateEntityName(elementName);
        i2 = skipWhitespace(xmlData, i2);
        let attributeName = "";
        while (i2 < xmlData.length && !/\s/.test(xmlData[i2])) {
          attributeName += xmlData[i2];
          i2++;
        }
        if (!validateEntityName(attributeName)) {
          throw new Error(`Invalid attribute name: "${attributeName}"`);
        }
        i2 = skipWhitespace(xmlData, i2);
        let attributeType = "";
        if (xmlData.substring(i2, i2 + 8).toUpperCase() === "NOTATION") {
          attributeType = "NOTATION";
          i2 += 8;
          i2 = skipWhitespace(xmlData, i2);
          if (xmlData[i2] !== "(") {
            throw new Error(`Expected '(', found "${xmlData[i2]}"`);
          }
          i2++;
          let allowedNotations = [];
          while (i2 < xmlData.length && xmlData[i2] !== ")") {
            let notation = "";
            while (i2 < xmlData.length && xmlData[i2] !== "|" && xmlData[i2] !== ")") {
              notation += xmlData[i2];
              i2++;
            }
            notation = notation.trim();
            if (!validateEntityName(notation)) {
              throw new Error(`Invalid notation name: "${notation}"`);
            }
            allowedNotations.push(notation);
            if (xmlData[i2] === "|") {
              i2++;
              i2 = skipWhitespace(xmlData, i2);
            }
          }
          if (xmlData[i2] !== ")") {
            throw new Error("Unterminated list of notations");
          }
          i2++;
          attributeType += " (" + allowedNotations.join("|") + ")";
        } else {
          while (i2 < xmlData.length && !/\s/.test(xmlData[i2])) {
            attributeType += xmlData[i2];
            i2++;
          }
          const validTypes = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
          if (!this.suppressValidationErr && !validTypes.includes(attributeType.toUpperCase())) {
            throw new Error(`Invalid attribute type: "${attributeType}"`);
          }
        }
        i2 = skipWhitespace(xmlData, i2);
        let defaultValue = "";
        if (xmlData.substring(i2, i2 + 8).toUpperCase() === "#REQUIRED") {
          defaultValue = "#REQUIRED";
          i2 += 8;
        } else if (xmlData.substring(i2, i2 + 7).toUpperCase() === "#IMPLIED") {
          defaultValue = "#IMPLIED";
          i2 += 7;
        } else {
          [i2, defaultValue] = this.readIdentifierVal(xmlData, i2, "ATTLIST");
        }
        return {
          elementName,
          attributeName,
          attributeType,
          defaultValue,
          index: i2
        };
      }
    };
    var skipWhitespace = (data, index) => {
      while (index < data.length && /\s/.test(data[index])) {
        index++;
      }
      return index;
    };
    function hasSeq(data, seq, i2) {
      for (let j2 = 0; j2 < seq.length; j2++) {
        if (seq[j2] !== data[i2 + j2 + 1])
          return false;
      }
      return true;
    }
    function validateEntityName(name) {
      if (util.isName(name))
        return name;
      else
        throw new Error(`Invalid entity name ${name}`);
    }
    module.exports = DocTypeReader;
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/strnum@1.1.2/node_modules/strnum/strnum.js
var require_strnum = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/strnum@1.1.2/node_modules/strnum/strnum.js"(exports, module) {
    var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
    var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
    var consider = {
      hex: true,
      // oct: false,
      leadingZeros: true,
      decimalPoint: ".",
      eNotation: true
      //skipLike: /regex/
    };
    function toNumber2(str, options = {}) {
      options = Object.assign({}, consider, options);
      if (!str || typeof str !== "string")
        return str;
      let trimmedStr = str.trim();
      if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr))
        return str;
      else if (str === "0")
        return 0;
      else if (options.hex && hexRegex.test(trimmedStr)) {
        return parse_int(trimmedStr, 16);
      } else if (trimmedStr.search(/[eE]/) !== -1) {
        const notation = trimmedStr.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/);
        if (notation) {
          if (options.leadingZeros) {
            trimmedStr = (notation[1] || "") + notation[3];
          } else {
            if (notation[2] === "0" && notation[3][0] === ".") {
            } else {
              return str;
            }
          }
          return options.eNotation ? Number(trimmedStr) : str;
        } else {
          return str;
        }
      } else {
        const match = numRegex.exec(trimmedStr);
        if (match) {
          const sign = match[1];
          const leadingZeros = match[2];
          let numTrimmedByZeros = trimZeros(match[3]);
          if (!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".")
            return str;
          else if (!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".")
            return str;
          else if (options.leadingZeros && leadingZeros === str)
            return 0;
          else {
            const num = Number(trimmedStr);
            const numStr = "" + num;
            if (numStr.search(/[eE]/) !== -1) {
              if (options.eNotation)
                return num;
              else
                return str;
            } else if (trimmedStr.indexOf(".") !== -1) {
              if (numStr === "0" && numTrimmedByZeros === "")
                return num;
              else if (numStr === numTrimmedByZeros)
                return num;
              else if (sign && numStr === "-" + numTrimmedByZeros)
                return num;
              else
                return str;
            }
            if (leadingZeros) {
              return numTrimmedByZeros === numStr || sign + numTrimmedByZeros === numStr ? num : str;
            } else {
              return trimmedStr === numStr || trimmedStr === sign + numStr ? num : str;
            }
          }
        } else {
          return str;
        }
      }
    }
    function trimZeros(numStr) {
      if (numStr && numStr.indexOf(".") !== -1) {
        numStr = numStr.replace(/0+$/, "");
        if (numStr === ".")
          numStr = "0";
        else if (numStr[0] === ".")
          numStr = "0" + numStr;
        else if (numStr[numStr.length - 1] === ".")
          numStr = numStr.substr(0, numStr.length - 1);
        return numStr;
      }
      return numStr;
    }
    function parse_int(numStr, base) {
      if (parseInt)
        return parseInt(numStr, base);
      else if (Number.parseInt)
        return Number.parseInt(numStr, base);
      else if (window && window.parseInt)
        return window.parseInt(numStr, base);
      else
        throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
    }
    module.exports = toNumber2;
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/ignoreAttributes.js
var require_ignoreAttributes = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/ignoreAttributes.js"(exports, module) {
    function getIgnoreAttributesFn(ignoreAttributes) {
      if (typeof ignoreAttributes === "function") {
        return ignoreAttributes;
      }
      if (Array.isArray(ignoreAttributes)) {
        return (attrName) => {
          for (const pattern of ignoreAttributes) {
            if (typeof pattern === "string" && attrName === pattern) {
              return true;
            }
            if (pattern instanceof RegExp && pattern.test(attrName)) {
              return true;
            }
          }
        };
      }
      return () => false;
    }
    module.exports = getIgnoreAttributesFn;
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
var require_OrderedObjParser = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js"(exports, module) {
    "use strict";
    var util = require_util();
    var xmlNode = require_xmlNode();
    var DocTypeReader = require_DocTypeReader();
    var toNumber2 = require_strnum();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var OrderedObjParser = class {
      constructor(options) {
        this.options = options;
        this.currentNode = null;
        this.tagsNodeStack = [];
        this.docTypeEntities = {};
        this.lastEntities = {
          "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
          "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
          "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
          "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
        };
        this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
        this.htmlEntities = {
          "space": { regex: /&(nbsp|#160);/g, val: " " },
          // "lt" : { regex: /&(lt|#60);/g, val: "<" },
          // "gt" : { regex: /&(gt|#62);/g, val: ">" },
          // "amp" : { regex: /&(amp|#38);/g, val: "&" },
          // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
          // "apos" : { regex: /&(apos|#39);/g, val: "'" },
          "cent": { regex: /&(cent|#162);/g, val: "\xA2" },
          "pound": { regex: /&(pound|#163);/g, val: "\xA3" },
          "yen": { regex: /&(yen|#165);/g, val: "\xA5" },
          "euro": { regex: /&(euro|#8364);/g, val: "\u20AC" },
          "copyright": { regex: /&(copy|#169);/g, val: "\xA9" },
          "reg": { regex: /&(reg|#174);/g, val: "\xAE" },
          "inr": { regex: /&(inr|#8377);/g, val: "\u20B9" },
          "num_dec": { regex: /&#([0-9]{1,7});/g, val: (_2, str) => fromCodePoint(str, 10, "&#") },
          "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_2, str) => fromCodePoint(str, 16, "&#x") }
        };
        this.addExternalEntities = addExternalEntities;
        this.parseXml = parseXml;
        this.parseTextData = parseTextData;
        this.resolveNameSpace = resolveNameSpace;
        this.buildAttributesMap = buildAttributesMap;
        this.isItStopNode = isItStopNode;
        this.replaceEntitiesValue = replaceEntitiesValue;
        this.readStopNodeData = readStopNodeData;
        this.saveTextToParentTag = saveTextToParentTag;
        this.addChild = addChild;
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
        this.entityExpansionCount = 0;
        this.currentExpandedLength = 0;
        if (this.options.stopNodes && this.options.stopNodes.length > 0) {
          this.stopNodesExact = /* @__PURE__ */ new Set();
          this.stopNodesWildcard = /* @__PURE__ */ new Set();
          for (let i2 = 0; i2 < this.options.stopNodes.length; i2++) {
            const stopNodeExp = this.options.stopNodes[i2];
            if (typeof stopNodeExp !== "string")
              continue;
            if (stopNodeExp.startsWith("*.")) {
              this.stopNodesWildcard.add(stopNodeExp.substring(2));
            } else {
              this.stopNodesExact.add(stopNodeExp);
            }
          }
        }
      }
    };
    function addExternalEntities(externalEntities) {
      const entKeys = Object.keys(externalEntities);
      for (let i2 = 0; i2 < entKeys.length; i2++) {
        const ent = entKeys[i2];
        const escaped = ent.replace(/[.\-+*:]/g, "\\.");
        this.lastEntities[ent] = {
          regex: new RegExp("&" + escaped + ";", "g"),
          val: externalEntities[ent]
        };
      }
    }
    function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
      if (val !== void 0) {
        if (this.options.trimValues && !dontTrim) {
          val = val.trim();
        }
        if (val.length > 0) {
          if (!escapeEntities)
            val = this.replaceEntitiesValue(val, tagName, jPath);
          const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
          if (newval === null || newval === void 0) {
            return val;
          } else if (typeof newval !== typeof val || newval !== val) {
            return newval;
          } else if (this.options.trimValues) {
            return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
          } else {
            const trimmedVal = val.trim();
            if (trimmedVal === val) {
              return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
            } else {
              return val;
            }
          }
        }
      }
    }
    function resolveNameSpace(tagname) {
      if (this.options.removeNSPrefix) {
        const tags = tagname.split(":");
        const prefix = tagname.charAt(0) === "/" ? "/" : "";
        if (tags[0] === "xmlns") {
          return "";
        }
        if (tags.length === 2) {
          tagname = prefix + tags[1];
        }
      }
      return tagname;
    }
    var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
    function buildAttributesMap(attrStr, jPath, tagName) {
      if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
        const matches = util.getAllMatches(attrStr, attrsRegx);
        const len = matches.length;
        const attrs = {};
        for (let i2 = 0; i2 < len; i2++) {
          const attrName = this.resolveNameSpace(matches[i2][1]);
          if (this.ignoreAttributesFn(attrName, jPath)) {
            continue;
          }
          let oldVal = matches[i2][4];
          let aName = this.options.attributeNamePrefix + attrName;
          if (attrName.length) {
            if (this.options.transformAttributeName) {
              aName = this.options.transformAttributeName(aName);
            }
            aName = sanitizeName(aName, this.options);
            if (oldVal !== void 0) {
              if (this.options.trimValues) {
                oldVal = oldVal.trim();
              }
              oldVal = this.replaceEntitiesValue(oldVal, tagName, jPath);
              const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
              if (newVal === null || newVal === void 0) {
                attrs[aName] = oldVal;
              } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
                attrs[aName] = newVal;
              } else {
                attrs[aName] = parseValue(
                  oldVal,
                  this.options.parseAttributeValue,
                  this.options.numberParseOptions
                );
              }
            } else if (this.options.allowBooleanAttributes) {
              attrs[aName] = true;
            }
          }
        }
        if (!Object.keys(attrs).length) {
          return;
        }
        if (this.options.attributesGroupName) {
          const attrCollection = {};
          attrCollection[this.options.attributesGroupName] = attrs;
          return attrCollection;
        }
        return attrs;
      }
    }
    var parseXml = function(xmlData) {
      xmlData = xmlData.replace(/\r\n?/g, "\n");
      const xmlObj = new xmlNode("!xml");
      let currentNode = xmlObj;
      let textData = "";
      let jPath = "";
      this.entityExpansionCount = 0;
      this.currentExpandedLength = 0;
      const docTypeReader = new DocTypeReader(this.options.processEntities);
      for (let i2 = 0; i2 < xmlData.length; i2++) {
        const ch = xmlData[i2];
        if (ch === "<") {
          if (xmlData[i2 + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i2, "Closing Tag is not closed.");
            let tagName = xmlData.substring(i2 + 2, closeIndex).trim();
            if (this.options.removeNSPrefix) {
              const colonIndex = tagName.indexOf(":");
              if (colonIndex !== -1) {
                tagName = tagName.substr(colonIndex + 1);
              }
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            if (currentNode) {
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
            }
            const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
            if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
              throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
            }
            let propIndex = 0;
            if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
              propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
              this.tagsNodeStack.pop();
            } else {
              propIndex = jPath.lastIndexOf(".");
            }
            jPath = jPath.substring(0, propIndex);
            currentNode = this.tagsNodeStack.pop();
            textData = "";
            i2 = closeIndex;
          } else if (xmlData[i2 + 1] === "?") {
            let tagData = readTagExp(xmlData, i2, false, "?>");
            if (!tagData)
              throw new Error("Pi Tag is not closed.");
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {
            } else {
              const childNode = new xmlNode(tagData.tagName);
              childNode.add(this.options.textNodeName, "");
              if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
              }
              this.addChild(currentNode, childNode, jPath, i2);
            }
            i2 = tagData.closeIndex + 1;
          } else if (xmlData.substr(i2 + 1, 3) === "!--") {
            const endIndex = findClosingIndex(xmlData, "-->", i2 + 4, "Comment is not closed.");
            if (this.options.commentPropName) {
              const comment = xmlData.substring(i2 + 4, endIndex - 2);
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
              currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
            }
            i2 = endIndex;
          } else if (xmlData.substr(i2 + 1, 2) === "!D") {
            const result = docTypeReader.readDocType(xmlData, i2);
            this.docTypeEntities = result.entities;
            i2 = result.i;
          } else if (xmlData.substr(i2 + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i2, "CDATA is not closed.") - 2;
            const tagExp = xmlData.substring(i2 + 9, closeIndex);
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
            if (val == void 0)
              val = "";
            if (this.options.cdataPropName) {
              currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
            } else {
              currentNode.add(this.options.textNodeName, val);
            }
            i2 = closeIndex + 2;
          } else {
            let result = readTagExp(xmlData, i2, this.options.removeNSPrefix);
            let tagName = result.tagName;
            const rawTagName = result.rawTagName;
            let tagExp = result.tagExp;
            let attrExpPresent = result.attrExpPresent;
            let closeIndex = result.closeIndex;
            if (this.options.transformTagName) {
              const newTagName = this.options.transformTagName(tagName);
              if (tagExp === tagName) {
                tagExp = newTagName;
              }
              tagName = newTagName;
            }
            if (this.options.strictReservedNames && (tagName === this.options.commentPropName || tagName === this.options.cdataPropName || tagName === this.options.textNodeName || tagName === this.options.attributesGroupName)) {
              throw new Error(`Invalid tag name: ${tagName}`);
            }
            if (currentNode && textData) {
              if (currentNode.tagname !== "!xml") {
                textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
              }
            }
            const lastTag = currentNode;
            if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
              currentNode = this.tagsNodeStack.pop();
              jPath = jPath.substring(0, jPath.lastIndexOf("."));
            }
            if (tagName !== xmlObj.tagname) {
              jPath += jPath ? "." + tagName : tagName;
            }
            const startIndex = i2;
            if (this.isItStopNode(this.stopNodesExact, this.stopNodesWildcard, jPath, tagName)) {
              let tagContent = "";
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                i2 = result.closeIndex;
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                i2 = result.closeIndex;
              } else {
                const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
                if (!result2)
                  throw new Error(`Unexpected end of ${rawTagName}`);
                i2 = result2.i;
                tagContent = result2.tagContent;
              }
              const childNode = new xmlNode(tagName);
              if (tagName !== tagExp && attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
              }
              if (tagContent) {
                tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
              }
              jPath = jPath.substr(0, jPath.lastIndexOf("."));
              childNode.add(this.options.textNodeName, tagContent);
              this.addChild(currentNode, childNode, jPath, startIndex);
            } else {
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                if (this.options.transformTagName) {
                  const newTagName = this.options.transformTagName(tagName);
                  if (tagExp === tagName) {
                    tagExp = newTagName;
                  }
                  tagName = newTagName;
                }
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath, startIndex);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath);
                }
                this.addChild(currentNode, childNode, jPath, startIndex);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
                i2 = result.closeIndex;
                continue;
              } else {
                const childNode = new xmlNode(tagName);
                if (this.tagsNodeStack.length > this.options.maxNestedTags) {
                  throw new Error("Maximum nested tags exceeded");
                }
                this.tagsNodeStack.push(currentNode);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath);
                currentNode = childNode;
              }
              textData = "";
              i2 = closeIndex;
            }
          }
        } else {
          textData += xmlData[i2];
        }
      }
      return xmlObj.child;
    };
    function addChild(currentNode, childNode, jPath, startIndex) {
      if (!this.options.captureMetaData)
        startIndex = void 0;
      const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
      if (result === false) {
      } else if (typeof result === "string") {
        childNode.tagname = result;
        currentNode.addChild(childNode, startIndex);
      } else {
        currentNode.addChild(childNode, startIndex);
      }
    }
    var replaceEntitiesValue = function(val, tagName, jPath) {
      if (val.indexOf("&") === -1) {
        return val;
      }
      const entityConfig = this.options.processEntities;
      if (!entityConfig.enabled) {
        return val;
      }
      if (entityConfig.allowedTags) {
        if (!entityConfig.allowedTags.includes(tagName)) {
          return val;
        }
      }
      if (entityConfig.tagFilter) {
        if (!entityConfig.tagFilter(tagName, jPath)) {
          return val;
        }
      }
      for (let entityName in this.docTypeEntities) {
        const entity = this.docTypeEntities[entityName];
        const matches = val.match(entity.regx);
        if (matches) {
          this.entityExpansionCount += matches.length;
          if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
            throw new Error(
              `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
            );
          }
          const lengthBefore = val.length;
          val = val.replace(entity.regx, entity.val);
          if (entityConfig.maxExpandedLength) {
            this.currentExpandedLength += val.length - lengthBefore;
            if (this.currentExpandedLength > entityConfig.maxExpandedLength) {
              throw new Error(
                `Total expanded content size exceeded: ${this.currentExpandedLength} > ${entityConfig.maxExpandedLength}`
              );
            }
          }
        }
      }
      if (val.indexOf("&") === -1)
        return val;
      for (const entityName of Object.keys(this.lastEntities)) {
        const entity = this.lastEntities[entityName];
        const matches = val.match(entity.regex);
        if (matches) {
          this.entityExpansionCount += matches.length;
          if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
            throw new Error(
              `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
            );
          }
        }
        val = val.replace(entity.regex, entity.val);
      }
      if (val.indexOf("&") === -1)
        return val;
      if (this.options.htmlEntities) {
        for (const entityName of Object.keys(this.htmlEntities)) {
          const entity = this.htmlEntities[entityName];
          const matches = val.match(entity.regex);
          if (matches) {
            this.entityExpansionCount += matches.length;
            if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
              throw new Error(
                `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
              );
            }
          }
          val = val.replace(entity.regex, entity.val);
        }
      }
      val = val.replace(this.ampEntity.regex, this.ampEntity.val);
      return val;
    };
    function saveTextToParentTag(textData, parentNode, jPath, isLeafNode) {
      if (textData) {
        if (isLeafNode === void 0)
          isLeafNode = parentNode.child.length === 0;
        textData = this.parseTextData(
          textData,
          parentNode.tagname,
          jPath,
          false,
          parentNode[":@"] ? Object.keys(parentNode[":@"]).length !== 0 : false,
          isLeafNode
        );
        if (textData !== void 0 && textData !== "")
          parentNode.add(this.options.textNodeName, textData);
        textData = "";
      }
      return textData;
    }
    function isItStopNode(stopNodesExact, stopNodesWildcard, jPath, currentTagName) {
      if (stopNodesWildcard && stopNodesWildcard.has(currentTagName))
        return true;
      if (stopNodesExact && stopNodesExact.has(jPath))
        return true;
      return false;
    }
    function tagExpWithClosingIndex(xmlData, i2, closingChar = ">") {
      let attrBoundary;
      let tagExp = "";
      for (let index = i2; index < xmlData.length; index++) {
        let ch = xmlData[index];
        if (attrBoundary) {
          if (ch === attrBoundary)
            attrBoundary = "";
        } else if (ch === '"' || ch === "'") {
          attrBoundary = ch;
        } else if (ch === closingChar[0]) {
          if (closingChar[1]) {
            if (xmlData[index + 1] === closingChar[1]) {
              return {
                data: tagExp,
                index
              };
            }
          } else {
            return {
              data: tagExp,
              index
            };
          }
        } else if (ch === "	") {
          ch = " ";
        }
        tagExp += ch;
      }
    }
    function findClosingIndex(xmlData, str, i2, errMsg) {
      const closingIndex = xmlData.indexOf(str, i2);
      if (closingIndex === -1) {
        throw new Error(errMsg);
      } else {
        return closingIndex + str.length - 1;
      }
    }
    function readTagExp(xmlData, i2, removeNSPrefix, closingChar = ">") {
      const result = tagExpWithClosingIndex(xmlData, i2 + 1, closingChar);
      if (!result)
        return;
      let tagExp = result.data;
      const closeIndex = result.index;
      const separatorIndex = tagExp.search(/\s/);
      let tagName = tagExp;
      let attrExpPresent = true;
      if (separatorIndex !== -1) {
        tagName = tagExp.substring(0, separatorIndex);
        tagExp = tagExp.substring(separatorIndex + 1).trimStart();
      }
      const rawTagName = tagName;
      if (removeNSPrefix) {
        const colonIndex = tagName.indexOf(":");
        if (colonIndex !== -1) {
          tagName = tagName.substr(colonIndex + 1);
          attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
        }
      }
      return {
        tagName,
        tagExp,
        closeIndex,
        attrExpPresent,
        rawTagName
      };
    }
    function readStopNodeData(xmlData, tagName, i2) {
      const startIndex = i2;
      let openTagCount = 1;
      for (; i2 < xmlData.length; i2++) {
        if (xmlData[i2] === "<") {
          if (xmlData[i2 + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i2, `${tagName} is not closed`);
            let closeTagName = xmlData.substring(i2 + 2, closeIndex).trim();
            if (closeTagName === tagName) {
              openTagCount--;
              if (openTagCount === 0) {
                return {
                  tagContent: xmlData.substring(startIndex, i2),
                  i: closeIndex
                };
              }
            }
            i2 = closeIndex;
          } else if (xmlData[i2 + 1] === "?") {
            const closeIndex = findClosingIndex(xmlData, "?>", i2 + 1, "StopNode is not closed.");
            i2 = closeIndex;
          } else if (xmlData.substr(i2 + 1, 3) === "!--") {
            const closeIndex = findClosingIndex(xmlData, "-->", i2 + 3, "StopNode is not closed.");
            i2 = closeIndex;
          } else if (xmlData.substr(i2 + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i2, "StopNode is not closed.") - 2;
            i2 = closeIndex;
          } else {
            const tagData = readTagExp(xmlData, i2, ">");
            if (tagData) {
              const openTagName = tagData && tagData.tagName;
              if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
                openTagCount++;
              }
              i2 = tagData.closeIndex;
            }
          }
        }
      }
    }
    function parseValue(val, shouldParse, options) {
      if (shouldParse && typeof val === "string") {
        const newval = val.trim();
        if (newval === "true")
          return true;
        else if (newval === "false")
          return false;
        else
          return toNumber2(val, options);
      } else {
        if (util.isExist(val)) {
          return val;
        } else {
          return "";
        }
      }
    }
    function fromCodePoint(str, base, prefix) {
      const codePoint = Number.parseInt(str, base);
      if (codePoint >= 0 && codePoint <= 1114111) {
        return String.fromCodePoint(codePoint);
      } else {
        return prefix + str + ";";
      }
    }
    function sanitizeName(name, options) {
      if (util.criticalProperties.includes(name)) {
        throw new Error(`[SECURITY] Invalid name: "${name}" is a reserved JavaScript keyword that could cause prototype pollution`);
      } else if (util.DANGEROUS_PROPERTY_NAMES.includes(name)) {
        return options.onDangerousProperty(name);
      }
      return name;
    }
    module.exports = OrderedObjParser;
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/node2json.js
var require_node2json = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/node2json.js"(exports) {
    "use strict";
    function prettify(node, options) {
      return compress(node, options);
    }
    function compress(arr, options, jPath) {
      let text;
      const compressedObj = {};
      for (let i2 = 0; i2 < arr.length; i2++) {
        const tagObj = arr[i2];
        const property = propName(tagObj);
        let newJpath = "";
        if (jPath === void 0)
          newJpath = property;
        else
          newJpath = jPath + "." + property;
        if (property === options.textNodeName) {
          if (text === void 0)
            text = tagObj[property];
          else
            text += "" + tagObj[property];
        } else if (property === void 0) {
          continue;
        } else if (tagObj[property]) {
          let val = compress(tagObj[property], options, newJpath);
          const isLeaf = isLeafTag(val, options);
          if (tagObj[":@"]) {
            assignAttributes(val, tagObj[":@"], newJpath, options);
          } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
            val = val[options.textNodeName];
          } else if (Object.keys(val).length === 0) {
            if (options.alwaysCreateTextNode)
              val[options.textNodeName] = "";
            else
              val = "";
          }
          if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
            if (!Array.isArray(compressedObj[property])) {
              compressedObj[property] = [compressedObj[property]];
            }
            compressedObj[property].push(val);
          } else {
            if (options.isArray(property, newJpath, isLeaf)) {
              compressedObj[property] = [val];
            } else {
              compressedObj[property] = val;
            }
          }
        }
      }
      if (typeof text === "string") {
        if (text.length > 0)
          compressedObj[options.textNodeName] = text;
      } else if (text !== void 0)
        compressedObj[options.textNodeName] = text;
      return compressedObj;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i2 = 0; i2 < keys.length; i2++) {
        const key = keys[i2];
        if (key !== ":@")
          return key;
      }
    }
    function assignAttributes(obj, attrMap, jpath, options) {
      if (attrMap) {
        const keys = Object.keys(attrMap);
        const len = keys.length;
        for (let i2 = 0; i2 < len; i2++) {
          const atrrName = keys[i2];
          if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
            obj[atrrName] = [attrMap[atrrName]];
          } else {
            obj[atrrName] = attrMap[atrrName];
          }
        }
      }
    }
    function isLeafTag(obj, options) {
      const { textNodeName } = options;
      const propCount = Object.keys(obj).length;
      if (propCount === 0) {
        return true;
      }
      if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
        return true;
      }
      return false;
    }
    exports.prettify = prettify;
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
var require_XMLParser = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlparser/XMLParser.js"(exports, module) {
    var { buildOptions } = require_OptionsBuilder();
    var OrderedObjParser = require_OrderedObjParser();
    var { prettify } = require_node2json();
    var validator = require_validator();
    var XMLParser3 = class {
      constructor(options) {
        this.externalEntities = {};
        this.options = buildOptions(options);
      }
      /**
       * Parse XML dats to JS object 
       * @param {string|Buffer} xmlData 
       * @param {boolean|Object} validationOption 
       */
      parse(xmlData, validationOption) {
        if (typeof xmlData === "string") {
        } else if (xmlData.toString) {
          xmlData = xmlData.toString();
        } else {
          throw new Error("XML data is accepted in String or Bytes[] form.");
        }
        if (validationOption) {
          if (validationOption === true)
            validationOption = {};
          const result = validator.validate(xmlData, validationOption);
          if (result !== true) {
            throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
          }
        }
        const orderedObjParser = new OrderedObjParser(this.options);
        orderedObjParser.addExternalEntities(this.externalEntities);
        const orderedResult = orderedObjParser.parseXml(xmlData);
        if (this.options.preserveOrder || orderedResult === void 0)
          return orderedResult;
        else
          return prettify(orderedResult, this.options);
      }
      /**
       * Add Entity which is not by default supported by this library
       * @param {string} key 
       * @param {string} value 
       */
      addEntity(key, value) {
        if (value.indexOf("&") !== -1) {
          throw new Error("Entity value can't have '&'");
        } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
          throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
        } else if (value === "&") {
          throw new Error("An entity with value '&' is not permitted");
        } else {
          this.externalEntities[key] = value;
        }
      }
    };
    module.exports = XMLParser3;
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js
var require_orderedJs2Xml = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js"(exports, module) {
    var EOL = "\n";
    function toXml(jArray, options) {
      let indentation = "";
      if (options.format && options.indentBy.length > 0) {
        indentation = EOL;
      }
      return arrToStr(jArray, options, "", indentation);
    }
    function arrToStr(arr, options, jPath, indentation) {
      let xmlStr = "";
      let isPreviousElementTag = false;
      if (!Array.isArray(arr)) {
        if (arr !== void 0 && arr !== null) {
          let text = arr.toString();
          text = replaceEntitiesValue(text, options);
          return text;
        }
        return "";
      }
      for (let i2 = 0; i2 < arr.length; i2++) {
        const tagObj = arr[i2];
        const tagName = propName(tagObj);
        if (tagName === void 0)
          continue;
        let newJPath = "";
        if (jPath.length === 0)
          newJPath = tagName;
        else
          newJPath = `${jPath}.${tagName}`;
        if (tagName === options.textNodeName) {
          let tagText = tagObj[tagName];
          if (!isStopNode(newJPath, options)) {
            tagText = options.tagValueProcessor(tagName, tagText);
            tagText = replaceEntitiesValue(tagText, options);
          }
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          xmlStr += tagText;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.cdataPropName) {
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.commentPropName) {
          xmlStr += indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
          isPreviousElementTag = true;
          continue;
        } else if (tagName[0] === "?") {
          const attStr2 = attr_to_str(tagObj[":@"], options);
          const tempInd = tagName === "?xml" ? "" : indentation;
          let piTextNodeName = tagObj[tagName][0][options.textNodeName];
          piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : "";
          xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr2}?>`;
          isPreviousElementTag = true;
          continue;
        }
        let newIdentation = indentation;
        if (newIdentation !== "") {
          newIdentation += options.indentBy;
        }
        const attStr = attr_to_str(tagObj[":@"], options);
        const tagStart = indentation + `<${tagName}${attStr}`;
        const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
        if (options.unpairedTags.indexOf(tagName) !== -1) {
          if (options.suppressUnpairedNode)
            xmlStr += tagStart + ">";
          else
            xmlStr += tagStart + "/>";
        } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
          xmlStr += tagStart + "/>";
        } else if (tagValue && tagValue.endsWith(">")) {
          xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
        } else {
          xmlStr += tagStart + ">";
          if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
            xmlStr += indentation + options.indentBy + tagValue + indentation;
          } else {
            xmlStr += tagValue;
          }
          xmlStr += `</${tagName}>`;
        }
        isPreviousElementTag = true;
      }
      return xmlStr;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i2 = 0; i2 < keys.length; i2++) {
        const key = keys[i2];
        if (!Object.prototype.hasOwnProperty.call(obj, key))
          continue;
        if (key !== ":@")
          return key;
      }
    }
    function attr_to_str(attrMap, options) {
      let attrStr = "";
      if (attrMap && !options.ignoreAttributes) {
        for (let attr in attrMap) {
          if (!Object.prototype.hasOwnProperty.call(attrMap, attr))
            continue;
          let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
          attrVal = replaceEntitiesValue(attrVal, options);
          if (attrVal === true && options.suppressBooleanAttributes) {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
          } else {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
          }
        }
      }
      return attrStr;
    }
    function isStopNode(jPath, options) {
      jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
      let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
      for (let index in options.stopNodes) {
        if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName)
          return true;
      }
      return false;
    }
    function replaceEntitiesValue(textValue3, options) {
      if (textValue3 && textValue3.length > 0 && options.processEntities) {
        for (let i2 = 0; i2 < options.entities.length; i2++) {
          const entity = options.entities[i2];
          textValue3 = textValue3.replace(entity.regex, entity.val);
        }
      }
      return textValue3;
    }
    module.exports = toXml;
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js
var require_json2xml = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js"(exports, module) {
    "use strict";
    var buildFromOrderedJs = require_orderedJs2Xml();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var defaultOptions = {
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      cdataPropName: false,
      format: false,
      indentBy: "  ",
      suppressEmptyNode: false,
      suppressUnpairedNode: true,
      suppressBooleanAttributes: true,
      tagValueProcessor: function(key, a2) {
        return a2;
      },
      attributeValueProcessor: function(attrName, a2) {
        return a2;
      },
      preserveOrder: false,
      commentPropName: false,
      unpairedTags: [],
      entities: [
        { regex: new RegExp("&", "g"), val: "&amp;" },
        //it must be on top
        { regex: new RegExp(">", "g"), val: "&gt;" },
        { regex: new RegExp("<", "g"), val: "&lt;" },
        { regex: new RegExp("'", "g"), val: "&apos;" },
        { regex: new RegExp('"', "g"), val: "&quot;" }
      ],
      processEntities: true,
      stopNodes: [],
      // transformTagName: false,
      // transformAttributeName: false,
      oneListGroup: false
    };
    function Builder(options) {
      this.options = Object.assign({}, defaultOptions, options);
      if (this.options.ignoreAttributes === true || this.options.attributesGroupName) {
        this.isAttribute = function() {
          return false;
        };
      } else {
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
        this.attrPrefixLen = this.options.attributeNamePrefix.length;
        this.isAttribute = isAttribute;
      }
      this.processTextOrObjNode = processTextOrObjNode;
      if (this.options.format) {
        this.indentate = indentate;
        this.tagEndChar = ">\n";
        this.newLine = "\n";
      } else {
        this.indentate = function() {
          return "";
        };
        this.tagEndChar = ">";
        this.newLine = "";
      }
    }
    Builder.prototype.build = function(jObj) {
      if (this.options.preserveOrder) {
        return buildFromOrderedJs(jObj, this.options);
      } else {
        if (Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1) {
          jObj = {
            [this.options.arrayNodeName]: jObj
          };
        }
        return this.j2x(jObj, 0, []).val;
      }
    };
    Builder.prototype.j2x = function(jObj, level, ajPath) {
      let attrStr = "";
      let val = "";
      const jPath = ajPath.join(".");
      for (let key in jObj) {
        if (!Object.prototype.hasOwnProperty.call(jObj, key))
          continue;
        if (typeof jObj[key] === "undefined") {
          if (this.isAttribute(key)) {
            val += "";
          }
        } else if (jObj[key] === null) {
          if (this.isAttribute(key)) {
            val += "";
          } else if (key === this.options.cdataPropName) {
            val += "";
          } else if (key[0] === "?") {
            val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
          } else {
            val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
          }
        } else if (jObj[key] instanceof Date) {
          val += this.buildTextValNode(jObj[key], key, "", level);
        } else if (typeof jObj[key] !== "object") {
          const attr = this.isAttribute(key);
          if (attr && !this.ignoreAttributesFn(attr, jPath)) {
            attrStr += this.buildAttrPairStr(attr, "" + jObj[key]);
          } else if (!attr) {
            if (key === this.options.textNodeName) {
              let newval = this.options.tagValueProcessor(key, "" + jObj[key]);
              val += this.replaceEntitiesValue(newval);
            } else {
              val += this.buildTextValNode(jObj[key], key, "", level);
            }
          }
        } else if (Array.isArray(jObj[key])) {
          const arrLen = jObj[key].length;
          let listTagVal = "";
          let listTagAttr = "";
          for (let j2 = 0; j2 < arrLen; j2++) {
            const item = jObj[key][j2];
            if (typeof item === "undefined") {
            } else if (item === null) {
              if (key[0] === "?")
                val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
              else
                val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
            } else if (typeof item === "object") {
              if (this.options.oneListGroup) {
                const result = this.j2x(item, level + 1, ajPath.concat(key));
                listTagVal += result.val;
                if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
                  listTagAttr += result.attrStr;
                }
              } else {
                listTagVal += this.processTextOrObjNode(item, key, level, ajPath);
              }
            } else {
              if (this.options.oneListGroup) {
                let textValue3 = this.options.tagValueProcessor(key, item);
                textValue3 = this.replaceEntitiesValue(textValue3);
                listTagVal += textValue3;
              } else {
                listTagVal += this.buildTextValNode(item, key, "", level);
              }
            }
          }
          if (this.options.oneListGroup) {
            listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
          }
          val += listTagVal;
        } else {
          if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
            const Ks = Object.keys(jObj[key]);
            const L2 = Ks.length;
            for (let j2 = 0; j2 < L2; j2++) {
              attrStr += this.buildAttrPairStr(Ks[j2], "" + jObj[key][Ks[j2]]);
            }
          } else {
            val += this.processTextOrObjNode(jObj[key], key, level, ajPath);
          }
        }
      }
      return { attrStr, val };
    };
    Builder.prototype.buildAttrPairStr = function(attrName, val) {
      val = this.options.attributeValueProcessor(attrName, "" + val);
      val = this.replaceEntitiesValue(val);
      if (this.options.suppressBooleanAttributes && val === "true") {
        return " " + attrName;
      } else
        return " " + attrName + '="' + val + '"';
    };
    function processTextOrObjNode(object, key, level, ajPath) {
      const result = this.j2x(object, level + 1, ajPath.concat(key));
      if (object[this.options.textNodeName] !== void 0 && Object.keys(object).length === 1) {
        return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level);
      } else {
        return this.buildObjectNode(result.val, key, result.attrStr, level);
      }
    }
    Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
      if (val === "") {
        if (key[0] === "?")
          return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
        else {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        }
      } else {
        let tagEndExp = "</" + key + this.tagEndChar;
        let piClosingChar = "";
        if (key[0] === "?") {
          piClosingChar = "?";
          tagEndExp = "";
        }
        if ((attrStr || attrStr === "") && val.indexOf("<") === -1) {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + ">" + val + tagEndExp;
        } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
          return this.indentate(level) + `<!--${val}-->` + this.newLine;
        } else {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + this.tagEndChar + val + this.indentate(level) + tagEndExp;
        }
      }
    };
    Builder.prototype.closeTag = function(key) {
      let closeTag = "";
      if (this.options.unpairedTags.indexOf(key) !== -1) {
        if (!this.options.suppressUnpairedNode)
          closeTag = "/";
      } else if (this.options.suppressEmptyNode) {
        closeTag = "/";
      } else {
        closeTag = `></${key}`;
      }
      return closeTag;
    };
    Builder.prototype.buildTextValNode = function(val, key, attrStr, level) {
      if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
        return this.indentate(level) + `<![CDATA[${val}]]>` + this.newLine;
      } else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
        return this.indentate(level) + `<!--${val}-->` + this.newLine;
      } else if (key[0] === "?") {
        return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
      } else {
        let textValue3 = this.options.tagValueProcessor(key, val);
        textValue3 = this.replaceEntitiesValue(textValue3);
        if (textValue3 === "") {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        } else {
          return this.indentate(level) + "<" + key + attrStr + ">" + textValue3 + "</" + key + this.tagEndChar;
        }
      }
    };
    Builder.prototype.replaceEntitiesValue = function(textValue3) {
      if (textValue3 && textValue3.length > 0 && this.options.processEntities) {
        for (let i2 = 0; i2 < this.options.entities.length; i2++) {
          const entity = this.options.entities[i2];
          textValue3 = textValue3.replace(entity.regex, entity.val);
        }
      }
      return textValue3;
    };
    function indentate(level) {
      return this.options.indentBy.repeat(level);
    }
    function isAttribute(name) {
      if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
        return name.substr(this.attrPrefixLen);
      } else {
        return false;
      }
    }
    module.exports = Builder;
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/fxp.js
var require_fxp = __commonJS({
  "../home/ubuntu/.cache/deno/deno_esbuild/fast-xml-parser@4.5.6/node_modules/fast-xml-parser/src/fxp.js"(exports, module) {
    "use strict";
    var validator = require_validator();
    var XMLParser3 = require_XMLParser();
    var XMLBuilder = require_json2xml();
    module.exports = {
      XMLParser: XMLParser3,
      XMLValidator: validator,
      XMLBuilder
    };
  }
});

// ../home/ubuntu/.cache/deno/deno_esbuild/temporal-polyfill@0.2.5/node_modules/temporal-polyfill/chunks/internal.js
function clampProp(e2, n2, t2, o2, r2) {
  return clampEntity(n2, getDefinedProp(e2, n2), t2, o2, r2);
}
function clampEntity(e2, n2, t2, o2, r2, i2) {
  const a2 = clampNumber(n2, t2, o2);
  if (r2 && n2 !== a2) {
    throw new RangeError(numberOutOfRange(e2, n2, t2, o2, i2));
  }
  return a2;
}
function getDefinedProp(e2, n2) {
  const t2 = e2[n2];
  if (void 0 === t2) {
    throw new TypeError(missingField(n2));
  }
  return t2;
}
function z(e2) {
  return null !== e2 && /object|function/.test(typeof e2);
}
function Jn(e2, n2 = Map) {
  const t2 = new n2();
  return (n3, ...o2) => {
    if (t2.has(n3)) {
      return t2.get(n3);
    }
    const r2 = e2(n3, ...o2);
    return t2.set(n3, r2), r2;
  };
}
function D(e2) {
  return p({
    name: e2
  }, 1);
}
function p(e2, n2) {
  return T((e3) => ({
    value: e3,
    configurable: 1,
    writable: !n2
  }), e2);
}
function O(e2) {
  return T((e3) => ({
    get: e3,
    configurable: 1
  }), e2);
}
function h(e2) {
  return {
    [Symbol.toStringTag]: {
      value: e2,
      configurable: 1
    }
  };
}
function zipProps(e2, n2) {
  const t2 = {};
  let o2 = e2.length;
  for (const r2 of n2) {
    t2[e2[--o2]] = r2;
  }
  return t2;
}
function T(e2, n2, t2) {
  const o2 = {};
  for (const r2 in n2) {
    o2[r2] = e2(n2[r2], r2, t2);
  }
  return o2;
}
function b(e2, n2, t2) {
  const o2 = {};
  for (let r2 = 0; r2 < n2.length; r2++) {
    const i2 = n2[r2];
    o2[i2] = e2(i2, r2, t2);
  }
  return o2;
}
function remapProps(e2, n2, t2) {
  const o2 = {};
  for (let r2 = 0; r2 < e2.length; r2++) {
    o2[n2[r2]] = t2[e2[r2]];
  }
  return o2;
}
function Vn(e2, n2) {
  const t2 = {};
  for (const o2 of e2) {
    t2[o2] = n2[o2];
  }
  return t2;
}
function V(e2, n2) {
  const t2 = {};
  for (const o2 in n2) {
    e2.has(o2) || (t2[o2] = n2[o2]);
  }
  return t2;
}
function nn(e2) {
  e2 = {
    ...e2
  };
  const n2 = Object.keys(e2);
  for (const t2 of n2) {
    void 0 === e2[t2] && delete e2[t2];
  }
  return e2;
}
function C(e2, n2) {
  for (const t2 of n2) {
    if (!(t2 in e2)) {
      return 0;
    }
  }
  return 1;
}
function allPropsEqual(e2, n2, t2) {
  for (const o2 of e2) {
    if (n2[o2] !== t2[o2]) {
      return 0;
    }
  }
  return 1;
}
function zeroOutProps(e2, n2, t2) {
  const o2 = {
    ...t2
  };
  for (let t3 = 0; t3 < n2; t3++) {
    o2[e2[t3]] = 0;
  }
  return o2;
}
function E(e2, ...n2) {
  return (...t2) => e2(...n2, ...t2);
}
function capitalize(e2) {
  return e2[0].toUpperCase() + e2.substring(1);
}
function sortStrings(e2) {
  return e2.slice().sort();
}
function padNumber(e2, n2) {
  return String(n2).padStart(e2, "0");
}
function compareNumbers(e2, n2) {
  return Math.sign(e2 - n2);
}
function clampNumber(e2, n2, t2) {
  return Math.min(Math.max(e2, n2), t2);
}
function divModFloor(e2, n2) {
  return [Math.floor(e2 / n2), modFloor(e2, n2)];
}
function modFloor(e2, n2) {
  return (e2 % n2 + n2) % n2;
}
function divModTrunc(e2, n2) {
  return [divTrunc(e2, n2), modTrunc(e2, n2)];
}
function divTrunc(e2, n2) {
  return Math.trunc(e2 / n2) || 0;
}
function modTrunc(e2, n2) {
  return e2 % n2 || 0;
}
function hasHalf(e2) {
  return 0.5 === Math.abs(e2 % 1);
}
function givenFieldsToBigNano(e2, n2, t2) {
  let o2 = 0, r2 = 0;
  for (let i3 = 0; i3 <= n2; i3++) {
    const n3 = e2[t2[i3]], a3 = Xr[i3], s2 = Qr / a3, [c2, u2] = divModTrunc(n3, s2);
    o2 += u2 * a3, r2 += c2;
  }
  const [i2, a2] = divModTrunc(o2, Qr);
  return [r2 + i2, a2];
}
function nanoToGivenFields(e2, n2, t2) {
  const o2 = {};
  for (let r2 = n2; r2 >= 0; r2--) {
    const n3 = Xr[r2];
    o2[t2[r2]] = divTrunc(e2, n3), e2 = modTrunc(e2, n3);
  }
  return o2;
}
function un(e2) {
  return e2 === X ? si : [];
}
function cn(e2) {
  return e2 === X ? li : [];
}
function ln(e2) {
  return e2 === X ? ["year", "day"] : [];
}
function l(e2) {
  if (void 0 !== e2) {
    return m(e2);
  }
}
function S(e2) {
  if (void 0 !== e2) {
    return d(e2);
  }
}
function c(e2) {
  if (void 0 !== e2) {
    return u(e2);
  }
}
function d(e2) {
  return requireNumberIsPositive(u(e2));
}
function u(e2) {
  return requireNumberIsInteger(Mi(e2));
}
function on(e2) {
  if (null == e2) {
    throw new TypeError("Cannot be null or undefined");
  }
  return e2;
}
function requirePropDefined(e2, n2) {
  if (null == n2) {
    throw new RangeError(missingField(e2));
  }
  return n2;
}
function de(e2) {
  if (!z(e2)) {
    throw new TypeError(hr);
  }
  return e2;
}
function requireType(e2, n2, t2 = e2) {
  if (typeof n2 !== e2) {
    throw new TypeError(invalidEntity(t2, n2));
  }
  return n2;
}
function requireNumberIsInteger(e2, n2 = "number") {
  if (!Number.isInteger(e2)) {
    throw new RangeError(expectedInteger(n2, e2));
  }
  return e2 || 0;
}
function requireNumberIsPositive(e2, n2 = "number") {
  if (e2 <= 0) {
    throw new RangeError(expectedPositive(n2, e2));
  }
  return e2;
}
function toString(e2) {
  if ("symbol" == typeof e2) {
    throw new TypeError(pr);
  }
  return String(e2);
}
function toStringViaPrimitive(e2, n2) {
  return z(e2) ? String(e2) : m(e2, n2);
}
function toBigInt(e2) {
  if ("string" == typeof e2) {
    return BigInt(e2);
  }
  if ("bigint" != typeof e2) {
    throw new TypeError(invalidBigInt(e2));
  }
  return e2;
}
function toNumber(e2, n2 = "number") {
  if ("bigint" == typeof e2) {
    throw new TypeError(forbiddenBigIntToNumber(n2));
  }
  if (e2 = Number(e2), !Number.isFinite(e2)) {
    throw new RangeError(expectedFinite(n2, e2));
  }
  return e2;
}
function toInteger(e2, n2) {
  return Math.trunc(toNumber(e2, n2)) || 0;
}
function toStrictInteger(e2, n2) {
  return requireNumberIsInteger(toNumber(e2, n2), n2);
}
function toPositiveInteger(e2, n2) {
  return requireNumberIsPositive(toInteger(e2, n2), n2);
}
function createBigNano(e2, n2) {
  let [t2, o2] = divModTrunc(n2, Qr), r2 = e2 + t2;
  const i2 = Math.sign(r2);
  return i2 && i2 === -Math.sign(o2) && (r2 -= i2, o2 += i2 * Qr), [r2, o2];
}
function addBigNanos(e2, n2, t2 = 1) {
  return createBigNano(e2[0] + n2[0] * t2, e2[1] + n2[1] * t2);
}
function moveBigNano(e2, n2) {
  return createBigNano(e2[0], e2[1] + n2);
}
function re(e2, n2) {
  return addBigNanos(n2, e2, -1);
}
function te(e2, n2) {
  return compareNumbers(e2[0], n2[0]) || compareNumbers(e2[1], n2[1]);
}
function bigNanoOutside(e2, n2, t2) {
  return -1 === te(e2, n2) || 1 === te(e2, t2);
}
function bigIntToBigNano(e2, n2 = 1) {
  const t2 = BigInt(Qr / n2);
  return [Number(e2 / t2), Number(e2 % t2) * n2];
}
function he(e2, n2 = 1) {
  const t2 = Qr / n2, [o2, r2] = divModTrunc(e2, t2);
  return [o2, r2 * n2];
}
function bigNanoToBigInt(e2, n2 = 1) {
  const [t2, o2] = e2, r2 = Math.floor(o2 / n2), i2 = Qr / n2;
  return BigInt(t2) * BigInt(i2) + BigInt(r2);
}
function oe(e2, n2 = 1, t2) {
  const [o2, r2] = e2, [i2, a2] = divModTrunc(r2, n2);
  return o2 * (Qr / n2) + (i2 + (t2 ? a2 / n2 : 0));
}
function divModBigNano(e2, n2, t2 = divModFloor) {
  const [o2, r2] = e2, [i2, a2] = t2(r2, n2);
  return [o2 * (Qr / n2) + i2, a2];
}
function hashIntlFormatParts(e2, n2) {
  const t2 = e2.formatToParts(n2), o2 = {};
  for (const e3 of t2) {
    o2[e3.type] = e3.value;
  }
  return o2;
}
function checkIsoYearMonthInBounds(e2) {
  return clampProp(e2, "isoYear", Li, Ai, 1), e2.isoYear === Li ? clampProp(e2, "isoMonth", 4, 12, 1) : e2.isoYear === Ai && clampProp(e2, "isoMonth", 1, 9, 1), e2;
}
function checkIsoDateInBounds(e2) {
  return checkIsoDateTimeInBounds({
    ...e2,
    ...Dt,
    isoHour: 12
  }), e2;
}
function checkIsoDateTimeInBounds(e2) {
  const n2 = clampProp(e2, "isoYear", Li, Ai, 1), t2 = n2 === Li ? 1 : n2 === Ai ? -1 : 0;
  return t2 && checkEpochNanoInBounds(isoToEpochNano({
    ...e2,
    isoDay: e2.isoDay + t2,
    isoNanosecond: e2.isoNanosecond - t2
  })), e2;
}
function checkEpochNanoInBounds(e2) {
  if (!e2 || bigNanoOutside(e2, Ui, qi)) {
    throw new RangeError(Cr);
  }
  return e2;
}
function isoTimeFieldsToNano(e2) {
  return givenFieldsToBigNano(e2, 5, j)[1];
}
function nanoToIsoTimeAndDay(e2) {
  const [n2, t2] = divModFloor(e2, Qr);
  return [nanoToGivenFields(t2, 5, j), n2];
}
function epochNanoToSec(e2) {
  return epochNanoToSecMod(e2)[0];
}
function epochNanoToSecMod(e2) {
  return divModBigNano(e2, _r);
}
function isoToEpochMilli(e2) {
  return isoArgsToEpochMilli(e2.isoYear, e2.isoMonth, e2.isoDay, e2.isoHour, e2.isoMinute, e2.isoSecond, e2.isoMillisecond);
}
function isoToEpochNano(e2) {
  const n2 = isoToEpochMilli(e2);
  if (void 0 !== n2) {
    const [t2, o2] = divModTrunc(n2, Gr);
    return [t2, o2 * be + (e2.isoMicrosecond || 0) * Vr + (e2.isoNanosecond || 0)];
  }
}
function isoToEpochNanoWithOffset(e2, n2) {
  const [t2, o2] = nanoToIsoTimeAndDay(isoTimeFieldsToNano(e2) - n2);
  return checkEpochNanoInBounds(isoToEpochNano({
    ...e2,
    isoDay: e2.isoDay + o2,
    ...t2
  }));
}
function isoArgsToEpochSec(...e2) {
  return isoArgsToEpochMilli(...e2) / Hr;
}
function isoArgsToEpochMilli(...e2) {
  const [n2, t2] = isoToLegacyDate(...e2), o2 = n2.valueOf();
  if (!isNaN(o2)) {
    return o2 - t2 * Gr;
  }
}
function isoToLegacyDate(e2, n2 = 1, t2 = 1, o2 = 0, r2 = 0, i2 = 0, a2 = 0) {
  const s2 = e2 === Li ? 1 : e2 === Ai ? -1 : 0, c2 = /* @__PURE__ */ new Date();
  return c2.setUTCHours(o2, r2, i2, a2), c2.setUTCFullYear(e2, n2 - 1, t2 + s2), [c2, s2];
}
function Ie(e2, n2) {
  let [t2, o2] = moveBigNano(e2, n2);
  o2 < 0 && (o2 += Qr, t2 -= 1);
  const [r2, i2] = divModFloor(o2, be), [a2, s2] = divModFloor(i2, Vr);
  return epochMilliToIso(t2 * Gr + r2, a2, s2);
}
function epochMilliToIso(e2, n2 = 0, t2 = 0) {
  const o2 = Math.ceil(Math.max(0, Math.abs(e2) - zi) / Gr) * Math.sign(e2), r2 = new Date(e2 - o2 * Gr);
  return zipProps(wi, [r2.getUTCFullYear(), r2.getUTCMonth() + 1, r2.getUTCDate() + o2, r2.getUTCHours(), r2.getUTCMinutes(), r2.getUTCSeconds(), r2.getUTCMilliseconds(), n2, t2]);
}
function computeIsoDateParts(e2) {
  return [e2.isoYear, e2.isoMonth, e2.isoDay];
}
function computeIsoMonthsInYear() {
  return xi;
}
function computeIsoDaysInMonth(e2, n2) {
  switch (n2) {
    case 2:
      return computeIsoInLeapYear(e2) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
  }
  return 31;
}
function computeIsoDaysInYear(e2) {
  return computeIsoInLeapYear(e2) ? 366 : 365;
}
function computeIsoInLeapYear(e2) {
  return e2 % 4 == 0 && (e2 % 100 != 0 || e2 % 400 == 0);
}
function computeIsoDayOfWeek(e2) {
  const [n2, t2] = isoToLegacyDate(e2.isoYear, e2.isoMonth, e2.isoDay);
  return modFloor(n2.getUTCDay() - t2, 7) || 7;
}
function computeGregoryEraParts({ isoYear: e2 }) {
  return e2 < 1 ? ["bce", 1 - e2] : ["ce", e2];
}
function computeJapaneseEraParts(e2) {
  const n2 = isoToEpochMilli(e2);
  if (n2 < $i) {
    return computeGregoryEraParts(e2);
  }
  const t2 = hashIntlFormatParts(La(Ti), n2), { era: o2, eraYear: r2 } = parseIntlYear(t2, Ti);
  return [o2, r2];
}
function checkIsoDateTimeFields(e2) {
  return checkIsoDateFields(e2), constrainIsoTimeFields(e2, 1), e2;
}
function checkIsoDateFields(e2) {
  return constrainIsoDateFields(e2, 1), e2;
}
function isIsoDateFieldsValid(e2) {
  return allPropsEqual(Oi, e2, constrainIsoDateFields(e2));
}
function constrainIsoDateFields(e2, n2) {
  const { isoYear: t2 } = e2, o2 = clampProp(e2, "isoMonth", 1, computeIsoMonthsInYear(), n2);
  return {
    isoYear: t2,
    isoMonth: o2,
    isoDay: clampProp(e2, "isoDay", 1, computeIsoDaysInMonth(t2, o2), n2)
  };
}
function constrainIsoTimeFields(e2, n2) {
  return zipProps(j, [clampProp(e2, "isoHour", 0, 23, n2), clampProp(e2, "isoMinute", 0, 59, n2), clampProp(e2, "isoSecond", 0, 59, n2), clampProp(e2, "isoMillisecond", 0, 999, n2), clampProp(e2, "isoMicrosecond", 0, 999, n2), clampProp(e2, "isoNanosecond", 0, 999, n2)]);
}
function H(e2) {
  return void 0 === e2 ? 0 : ua(de(e2));
}
function wn(e2, n2 = 0) {
  e2 = normalizeOptions(e2);
  const t2 = la(e2), o2 = fa(e2, n2);
  return [ua(e2), o2, t2];
}
function ve(e2) {
  return la(normalizeOptions(e2));
}
function _t(e2) {
  return e2 = normalizeOptions(e2), sa(e2, 9, 6, 1);
}
function refineDiffOptions(e2, n2, t2, o2 = 9, r2 = 0, i2 = 4) {
  n2 = normalizeOptions(n2);
  let a2 = sa(n2, o2, r2), s2 = parseRoundingIncInteger(n2), c2 = ha(n2, i2);
  const u2 = aa(n2, o2, r2, 1);
  return null == a2 ? a2 = Math.max(t2, u2) : checkLargestSmallestUnit(a2, u2), s2 = refineRoundingInc(s2, u2, 1), e2 && (c2 = ((e3) => e3 < 4 ? (e3 + 2) % 4 : e3)(c2)), [a2, u2, s2, c2];
}
function refineRoundingOptions(e2, n2 = 6, t2) {
  let o2 = parseRoundingIncInteger(e2 = normalizeOptionsOrString(e2, Hi));
  const r2 = ha(e2, 7);
  let i2 = aa(e2, n2);
  return i2 = requirePropDefined(Hi, i2), o2 = refineRoundingInc(o2, i2, void 0, t2), [i2, o2, r2];
}
function refineDateDisplayOptions(e2) {
  return da(normalizeOptions(e2));
}
function refineTimeDisplayOptions(e2, n2) {
  return refineTimeDisplayTuple(normalizeOptions(e2), n2);
}
function refineTimeDisplayTuple(e2, n2 = 4) {
  const t2 = refineSubsecDigits(e2);
  return [ha(e2, 4), ...refineSmallestUnitAndSubsecDigits(aa(e2, n2), t2)];
}
function refineSmallestUnitAndSubsecDigits(e2, n2) {
  return null != e2 ? [Xr[e2], e2 < 4 ? 9 - 3 * e2 : -1] : [void 0 === n2 ? 1 : 10 ** (9 - n2), n2];
}
function parseRoundingIncInteger(e2) {
  const n2 = e2[_i];
  return void 0 === n2 ? 1 : toInteger(n2, _i);
}
function refineRoundingInc(e2, n2, t2, o2) {
  const r2 = o2 ? Qr : Xr[n2 + 1];
  if (r2) {
    const t3 = Xr[n2];
    if (r2 % ((e2 = clampEntity(_i, e2, 1, r2 / t3 - (o2 ? 0 : 1), 1)) * t3)) {
      throw new RangeError(invalidEntity(_i, e2));
    }
  } else {
    e2 = clampEntity(_i, e2, 1, t2 ? 10 ** 9 : 1, 1);
  }
  return e2;
}
function refineSubsecDigits(e2) {
  let n2 = e2[Ji];
  if (void 0 !== n2) {
    if ("number" != typeof n2) {
      if ("auto" === toString(n2)) {
        return;
      }
      throw new RangeError(invalidEntity(Ji, n2));
    }
    n2 = clampEntity(Ji, Math.floor(n2), 0, 9, 1);
  }
  return n2;
}
function normalizeOptions(e2) {
  return void 0 === e2 ? {} : de(e2);
}
function normalizeOptionsOrString(e2, n2) {
  return "string" == typeof e2 ? {
    [n2]: e2
  } : de(e2);
}
function U(e2) {
  if (void 0 !== e2) {
    if (z(e2)) {
      return Object.assign(/* @__PURE__ */ Object.create(null), e2);
    }
    throw new TypeError(hr);
  }
}
function overrideOverflowOptions(e2, n2) {
  return e2 && Object.assign(/* @__PURE__ */ Object.create(null), e2, {
    overflow: Xi[n2]
  });
}
function refineUnitOption(e2, n2, t2 = 9, o2 = 0, r2) {
  let i2 = n2[e2];
  if (void 0 === i2) {
    return r2 ? o2 : void 0;
  }
  if (i2 = toString(i2), "auto" === i2) {
    return r2 ? o2 : null;
  }
  let a2 = $r[i2];
  if (void 0 === a2 && (a2 = Ei[i2]), void 0 === a2) {
    throw new RangeError(invalidChoice(e2, i2, $r));
  }
  return clampEntity(e2, a2, o2, t2, 1, Et), a2;
}
function refineChoiceOption(e2, n2, t2, o2 = 0) {
  const r2 = t2[e2];
  if (void 0 === r2) {
    return o2;
  }
  const i2 = toString(r2), a2 = n2[i2];
  if (void 0 === a2) {
    throw new RangeError(invalidChoice(e2, i2, n2));
  }
  return a2;
}
function checkLargestSmallestUnit(e2, n2) {
  if (n2 > e2) {
    throw new RangeError(Ar);
  }
}
function _(e2) {
  return {
    branding: Oe,
    epochNanoseconds: e2
  };
}
function Yn(e2, n2, t2) {
  return {
    branding: Te,
    calendar: t2,
    timeZone: n2,
    epochNanoseconds: e2
  };
}
function ee(e2, n2 = e2.calendar) {
  return {
    branding: We,
    calendar: n2,
    ...Vn(Yi, e2)
  };
}
function v(e2, n2 = e2.calendar) {
  return {
    branding: J,
    calendar: n2,
    ...Vn(Bi, e2)
  };
}
function createPlainYearMonthSlots(e2, n2 = e2.calendar) {
  return {
    branding: L,
    calendar: n2,
    ...Vn(Bi, e2)
  };
}
function createPlainMonthDaySlots(e2, n2 = e2.calendar) {
  return {
    branding: q,
    calendar: n2,
    ...Vn(Bi, e2)
  };
}
function Ge(e2) {
  return {
    branding: xe,
    ...Vn(ki, e2)
  };
}
function Vt(e2) {
  return {
    branding: qt,
    sign: computeDurationSign(e2),
    ...Vn(Ni, e2)
  };
}
function M(e2) {
  return epochNanoToSec(e2.epochNanoseconds);
}
function y(e2) {
  return divModBigNano(e2.epochNanoseconds, be)[0];
}
function N(e2) {
  return bigNanoToBigInt(e2.epochNanoseconds, Vr);
}
function B(e2) {
  return bigNanoToBigInt(e2.epochNanoseconds);
}
function extractEpochNano(e2) {
  return e2.epochNanoseconds;
}
function I(e2) {
  return "string" == typeof e2 ? e2 : m(e2.id);
}
function isIdLikeEqual(e2, n2) {
  return e2 === n2 || I(e2) === I(n2);
}
function Ut(e2, n2, t2, o2, r2) {
  const i2 = getMaxDurationUnit(o2), [a2, s2] = ((e3, n3) => {
    const t3 = n3((e3 = normalizeOptionsOrString(e3, Vi))[Ki]);
    let o3 = ca(e3);
    return o3 = requirePropDefined(Vi, o3), [o3, t3];
  })(r2, e2);
  if (isUniformUnit(Math.max(a2, i2), s2)) {
    return totalDayTimeDuration(o2, a2);
  }
  if (!s2) {
    throw new RangeError(zr);
  }
  const [c2, u2, l2] = createMarkerSystem(n2, t2, s2), f2 = createMarkerToEpochNano(l2), d2 = createMoveMarker(l2), m2 = createDiffMarkers(l2), p2 = d2(u2, c2, o2), h2 = m2(u2, c2, p2, a2);
  return isUniformUnit(a2, s2) ? totalDayTimeDuration(h2, a2) : ((e3, n3, t3, o3, r3, i3, a3) => {
    const s3 = computeDurationSign(e3), [c3, u3] = clampRelativeDuration(o3, bi(t3, e3), t3, s3, r3, i3, a3), l3 = computeEpochNanoFrac(n3, c3, u3);
    return e3[F[t3]] + l3 * s3;
  })(h2, f2(p2), a2, u2, c2, f2, d2);
}
function totalDayTimeDuration(e2, n2) {
  return oe(durationFieldsToBigNano(e2), Xr[n2], 1);
}
function clampRelativeDuration(e2, n2, t2, o2, r2, i2, a2) {
  const s2 = F[t2], c2 = {
    ...n2,
    [s2]: n2[s2] + o2
  }, u2 = a2(e2, r2, n2), l2 = a2(e2, r2, c2);
  return [i2(u2), i2(l2)];
}
function computeEpochNanoFrac(e2, n2, t2) {
  const o2 = oe(re(n2, t2));
  if (!o2) {
    throw new RangeError(vr);
  }
  return oe(re(n2, e2)) / o2;
}
function ce(e2, n2) {
  const [t2, o2, r2] = refineRoundingOptions(n2, 5, 1);
  return _(roundBigNano(e2.epochNanoseconds, t2, o2, r2, 1));
}
function Pn(e2, n2, t2) {
  let { epochNanoseconds: o2, timeZone: r2, calendar: i2 } = n2;
  const [a2, s2, c2] = refineRoundingOptions(t2);
  if (0 === a2 && 1 === s2) {
    return n2;
  }
  const u2 = e2(r2);
  if (6 === a2) {
    o2 = ((e3, n3, t3, o3) => {
      const r3 = fn(t3, n3), [i3, a3] = e3(r3), s3 = t3.epochNanoseconds, c3 = we(n3, i3), u3 = we(n3, a3);
      if (bigNanoOutside(s3, c3, u3)) {
        throw new RangeError(vr);
      }
      return roundWithMode(computeEpochNanoFrac(s3, c3, u3), o3) ? u3 : c3;
    })(computeDayInterval, u2, n2, c2);
  } else {
    const e3 = u2.getOffsetNanosecondsFor(o2);
    o2 = getMatchingInstantFor(u2, roundDateTime(Ie(o2, e3), a2, s2, c2), e3, 2, 0, 1);
  }
  return Yn(o2, r2, i2);
}
function dt(e2, n2) {
  return ee(roundDateTime(e2, ...refineRoundingOptions(n2)), e2.calendar);
}
function Ee(e2, n2) {
  const [t2, o2, r2] = refineRoundingOptions(n2, 5);
  var i2;
  return Ge((i2 = r2, roundTimeToNano(e2, computeNanoInc(t2, o2), i2)[0]));
}
function dn(e2, n2) {
  const t2 = e2(n2.timeZone), o2 = fn(n2, t2), [r2, i2] = computeDayInterval(o2), a2 = oe(re(we(t2, r2), we(t2, i2)), Kr, 1);
  if (a2 <= 0) {
    throw new RangeError(vr);
  }
  return a2;
}
function Cn(e2, n2) {
  const { timeZone: t2, calendar: o2 } = n2, r2 = ((e3, n3, t3) => we(n3, e3(fn(t3, n3))))(computeDayFloor, e2(t2), n2);
  return Yn(r2, t2, o2);
}
function roundDateTime(e2, n2, t2, o2) {
  return roundDateTimeToNano(e2, computeNanoInc(n2, t2), o2);
}
function roundDateTimeToNano(e2, n2, t2) {
  const [o2, r2] = roundTimeToNano(e2, n2, t2);
  return checkIsoDateTimeInBounds({
    ...moveByDays(e2, r2),
    ...o2
  });
}
function roundTimeToNano(e2, n2, t2) {
  return nanoToIsoTimeAndDay(roundByInc(isoTimeFieldsToNano(e2), n2, t2));
}
function roundToMinute(e2) {
  return roundByInc(e2, Jr, 7);
}
function computeNanoInc(e2, n2) {
  return Xr[e2] * n2;
}
function computeDayInterval(e2) {
  const n2 = computeDayFloor(e2);
  return [n2, moveByDays(n2, 1)];
}
function computeDayFloor(e2) {
  return Ci(6, e2);
}
function roundDayTimeDurationByInc(e2, n2, t2) {
  const o2 = Math.min(getMaxDurationUnit(e2), 6);
  return nanoToDurationDayTimeFields(roundBigNanoByInc(durationFieldsToBigNano(e2, o2), n2, t2), o2);
}
function roundRelativeDuration(e2, n2, t2, o2, r2, i2, a2, s2, c2, u2) {
  if (0 === o2 && 1 === r2) {
    return e2;
  }
  const l2 = isUniformUnit(o2, s2) ? isZonedEpochSlots(s2) && o2 < 6 && t2 >= 6 ? nudgeZonedTimeDuration : nudgeDayTimeDuration : nudgeRelativeDuration;
  let [f2, d2, m2] = l2(e2, n2, t2, o2, r2, i2, a2, s2, c2, u2);
  return m2 && 7 !== o2 && (f2 = ((e3, n3, t3, o3, r3, i3, a3, s3) => {
    const c3 = computeDurationSign(e3);
    for (let u3 = o3 + 1; u3 <= t3; u3++) {
      if (7 === u3 && 7 !== t3) {
        continue;
      }
      const o4 = bi(u3, e3);
      o4[F[u3]] += c3;
      const l3 = oe(re(a3(s3(r3, i3, o4)), n3));
      if (l3 && Math.sign(l3) !== c3) {
        break;
      }
      e3 = o4;
    }
    return e3;
  })(f2, d2, t2, Math.max(6, o2), a2, s2, c2, u2)), f2;
}
function roundBigNano(e2, n2, t2, o2, r2) {
  if (6 === n2) {
    const n3 = ((e3) => e3[0] + e3[1] / Qr)(e2);
    return [roundByInc(n3, t2, o2), 0];
  }
  return roundBigNanoByInc(e2, computeNanoInc(n2, t2), o2, r2);
}
function roundBigNanoByInc(e2, n2, t2, o2) {
  let [r2, i2] = e2;
  o2 && i2 < 0 && (i2 += Qr, r2 -= 1);
  const [a2, s2] = divModFloor(roundByInc(i2, n2, t2), Qr);
  return createBigNano(r2 + a2, s2);
}
function roundByInc(e2, n2, t2) {
  return roundWithMode(e2 / n2, t2) * n2;
}
function roundWithMode(e2, n2) {
  return ga[n2](e2);
}
function nudgeDayTimeDuration(e2, n2, t2, o2, r2, i2) {
  const a2 = computeDurationSign(e2), s2 = durationFieldsToBigNano(e2), c2 = roundBigNano(s2, o2, r2, i2), u2 = re(s2, c2), l2 = Math.sign(c2[0] - s2[0]) === a2, f2 = nanoToDurationDayTimeFields(c2, Math.min(t2, 6));
  return [{
    ...e2,
    ...f2
  }, addBigNanos(n2, u2), l2];
}
function nudgeZonedTimeDuration(e2, n2, t2, o2, r2, i2, a2, s2, c2, u2) {
  const l2 = computeDurationSign(e2), f2 = oe(durationFieldsToBigNano(e2, 5)), d2 = computeNanoInc(o2, r2);
  let m2 = roundByInc(f2, d2, i2);
  const [p2, h2] = clampRelativeDuration(a2, {
    ...e2,
    ...Fi
  }, 6, l2, s2, c2, u2), g2 = m2 - oe(re(p2, h2));
  let T2 = 0;
  g2 && Math.sign(g2) !== l2 ? n2 = moveBigNano(p2, m2) : (T2 += l2, m2 = roundByInc(g2, d2, i2), n2 = moveBigNano(h2, m2));
  const D2 = nanoToDurationTimeFields(m2);
  return [{
    ...e2,
    ...D2,
    days: e2.days + T2
  }, n2, Boolean(T2)];
}
function nudgeRelativeDuration(e2, n2, t2, o2, r2, i2, a2, s2, c2, u2) {
  const l2 = computeDurationSign(e2), f2 = F[o2], d2 = bi(o2, e2);
  7 === o2 && (e2 = {
    ...e2,
    weeks: e2.weeks + Math.trunc(e2.days / 7)
  });
  const m2 = divTrunc(e2[f2], r2) * r2;
  d2[f2] = m2;
  const [p2, h2] = clampRelativeDuration(a2, d2, o2, r2 * l2, s2, c2, u2), g2 = m2 + computeEpochNanoFrac(n2, p2, h2) * l2 * r2, T2 = roundByInc(g2, r2, i2), D2 = Math.sign(T2 - g2) === l2;
  return d2[f2] = T2, [d2, D2 ? h2 : p2, D2];
}
function me(e2, n2, t2, o2) {
  const [r2, i2, a2, s2] = ((e3) => {
    const n3 = refineTimeDisplayTuple(e3 = normalizeOptions(e3));
    return [e3.timeZone, ...n3];
  })(o2), c2 = void 0 !== r2;
  return ((e3, n3, t3, o3, r3, i3) => {
    t3 = roundBigNanoByInc(t3, r3, o3, 1);
    const a3 = n3.getOffsetNanosecondsFor(t3);
    return formatIsoDateTimeFields(Ie(t3, a3), i3) + (e3 ? Fe(roundToMinute(a3)) : "Z");
  })(c2, n2(c2 ? e2(r2) : Ta), t2.epochNanoseconds, i2, a2, s2);
}
function In(e2, n2, t2) {
  const [o2, r2, i2, a2, s2, c2] = ((e3) => {
    e3 = normalizeOptions(e3);
    const n3 = da(e3), t3 = refineSubsecDigits(e3), o3 = pa(e3), r3 = ha(e3, 4), i3 = aa(e3, 4);
    return [n3, ma(e3), o3, r3, ...refineSmallestUnitAndSubsecDigits(i3, t3)];
  })(t2);
  return ((e3, n3, t3, o3, r3, i3, a3, s3, c3, u2) => {
    o3 = roundBigNanoByInc(o3, c3, s3, 1);
    const l2 = e3(t3).getOffsetNanosecondsFor(o3);
    return formatIsoDateTimeFields(Ie(o3, l2), u2) + Fe(roundToMinute(l2), a3) + ((e4, n4) => 1 !== n4 ? "[" + (2 === n4 ? "!" : "") + I(e4) + "]" : "")(t3, i3) + formatCalendar(n3, r3);
  })(e2, n2.calendar, n2.timeZone, n2.epochNanoseconds, o2, r2, i2, a2, s2, c2);
}
function Tt(e2, n2) {
  const [t2, o2, r2, i2] = ((e3) => (e3 = normalizeOptions(e3), [da(e3), ...refineTimeDisplayTuple(e3)]))(n2);
  return a2 = e2.calendar, s2 = t2, c2 = i2, formatIsoDateTimeFields(roundDateTimeToNano(e2, r2, o2), c2) + formatCalendar(a2, s2);
  var a2, s2, c2;
}
function yt(e2, n2) {
  return t2 = e2.calendar, o2 = e2, r2 = refineDateDisplayOptions(n2), formatIsoDateFields(o2) + formatCalendar(t2, r2);
  var t2, o2, r2;
}
function et(e2, n2) {
  return formatDateLikeIso(e2.calendar, formatIsoYearMonthFields, e2, refineDateDisplayOptions(n2));
}
function W(e2, n2) {
  return formatDateLikeIso(e2.calendar, formatIsoMonthDayFields, e2, refineDateDisplayOptions(n2));
}
function qe(e2, n2) {
  const [t2, o2, r2] = refineTimeDisplayOptions(n2);
  return i2 = r2, formatIsoTimeFields(roundTimeToNano(e2, o2, t2)[0], i2);
  var i2;
}
function zt(e2, n2) {
  const [t2, o2, r2] = refineTimeDisplayOptions(n2, 3);
  return o2 > 1 && (e2 = {
    ...e2,
    ...roundDayTimeDurationByInc(e2, o2, t2)
  }), ((e3, n3) => {
    const { sign: t3 } = e3, o3 = -1 === t3 ? negateDurationFields(e3) : e3, { hours: r3, minutes: i2 } = o3, [a2, s2] = divModBigNano(durationFieldsToBigNano(o3, 3), _r, divModTrunc);
    checkDurationTimeUnit(a2);
    const c2 = formatSubsecNano(s2, n3), u2 = n3 >= 0 || !t3 || c2;
    return (t3 < 0 ? "-" : "") + "P" + formatDurationFragments({
      Y: formatDurationNumber(o3.years),
      M: formatDurationNumber(o3.months),
      W: formatDurationNumber(o3.weeks),
      D: formatDurationNumber(o3.days)
    }) + (r3 || i2 || a2 || u2 ? "T" + formatDurationFragments({
      H: formatDurationNumber(r3),
      M: formatDurationNumber(i2),
      S: formatDurationNumber(a2, u2) + c2
    }) : "");
  })(e2, r2);
}
function formatDateLikeIso(e2, n2, t2, o2) {
  const r2 = I(e2), i2 = o2 > 1 || 0 === o2 && r2 !== X;
  return 1 === o2 ? r2 === X ? n2(t2) : formatIsoDateFields(t2) : i2 ? formatIsoDateFields(t2) + formatCalendarId(r2, 2 === o2) : n2(t2);
}
function formatDurationFragments(e2) {
  const n2 = [];
  for (const t2 in e2) {
    const o2 = e2[t2];
    o2 && n2.push(o2, t2);
  }
  return n2.join("");
}
function formatIsoDateTimeFields(e2, n2) {
  return formatIsoDateFields(e2) + "T" + formatIsoTimeFields(e2, n2);
}
function formatIsoDateFields(e2) {
  return formatIsoYearMonthFields(e2) + "-" + xr(e2.isoDay);
}
function formatIsoYearMonthFields(e2) {
  const { isoYear: n2 } = e2;
  return (n2 < 0 || n2 > 9999 ? getSignStr(n2) + padNumber(6, Math.abs(n2)) : padNumber(4, n2)) + "-" + xr(e2.isoMonth);
}
function formatIsoMonthDayFields(e2) {
  return xr(e2.isoMonth) + "-" + xr(e2.isoDay);
}
function formatIsoTimeFields(e2, n2) {
  const t2 = [xr(e2.isoHour), xr(e2.isoMinute)];
  return -1 !== n2 && t2.push(xr(e2.isoSecond) + ((e3, n3, t3, o2) => formatSubsecNano(e3 * be + n3 * Vr + t3, o2))(e2.isoMillisecond, e2.isoMicrosecond, e2.isoNanosecond, n2)), t2.join(":");
}
function Fe(e2, n2 = 0) {
  if (1 === n2) {
    return "";
  }
  const [t2, o2] = divModFloor(Math.abs(e2), Kr), [r2, i2] = divModFloor(o2, Jr), [a2, s2] = divModFloor(i2, _r);
  return getSignStr(e2) + xr(t2) + ":" + xr(r2) + (a2 || s2 ? ":" + xr(a2) + formatSubsecNano(s2) : "");
}
function formatCalendar(e2, n2) {
  if (1 !== n2) {
    const t2 = I(e2);
    if (n2 > 1 || 0 === n2 && t2 !== X) {
      return formatCalendarId(t2, 2 === n2);
    }
  }
  return "";
}
function formatCalendarId(e2, n2) {
  return "[" + (n2 ? "!" : "") + "u-ca=" + e2 + "]";
}
function formatSubsecNano(e2, n2) {
  let t2 = padNumber(9, e2);
  return t2 = void 0 === n2 ? t2.replace(Na, "") : t2.slice(0, n2), t2 ? "." + t2 : "";
}
function getSignStr(e2) {
  return e2 < 0 ? "-" : "+";
}
function formatDurationNumber(e2, n2) {
  return e2 || n2 ? e2.toLocaleString("fullwide", {
    useGrouping: 0
  }) : "";
}
function _zonedEpochSlotsToIso(e2, n2) {
  const { epochNanoseconds: t2 } = e2, o2 = (n2.getOffsetNanosecondsFor ? n2 : n2(e2.timeZone)).getOffsetNanosecondsFor(t2), r2 = Ie(t2, o2);
  return {
    calendar: e2.calendar,
    ...r2,
    offsetNanoseconds: o2
  };
}
function mn(e2, n2) {
  const t2 = fn(n2, e2);
  return {
    calendar: n2.calendar,
    ...Vn(Yi, t2),
    offset: Fe(t2.offsetNanoseconds),
    timeZone: n2.timeZone
  };
}
function getMatchingInstantFor(e2, n2, t2, o2 = 0, r2 = 0, i2, a2) {
  if (void 0 !== t2 && 1 === o2 && (1 === o2 || a2)) {
    return isoToEpochNanoWithOffset(n2, t2);
  }
  const s2 = e2.getPossibleInstantsFor(n2);
  if (void 0 !== t2 && 3 !== o2) {
    const e3 = ((e4, n3, t3, o3) => {
      const r3 = isoToEpochNano(n3);
      o3 && (t3 = roundToMinute(t3));
      for (const n4 of e4) {
        let e5 = oe(re(n4, r3));
        if (o3 && (e5 = roundToMinute(e5)), e5 === t3) {
          return n4;
        }
      }
    })(s2, n2, t2, i2);
    if (void 0 !== e3) {
      return e3;
    }
    if (0 === o2) {
      throw new RangeError(kr);
    }
  }
  return a2 ? isoToEpochNano(n2) : we(e2, n2, r2, s2);
}
function we(e2, n2, t2 = 0, o2 = e2.getPossibleInstantsFor(n2)) {
  if (1 === o2.length) {
    return o2[0];
  }
  if (1 === t2) {
    throw new RangeError(Yr);
  }
  if (o2.length) {
    return o2[3 === t2 ? 1 : 0];
  }
  const r2 = isoToEpochNano(n2), i2 = ((e3, n3) => {
    const t3 = e3.getOffsetNanosecondsFor(moveBigNano(n3, -Qr));
    return ne(e3.getOffsetNanosecondsFor(moveBigNano(n3, Qr)) - t3);
  })(e2, r2), a2 = i2 * (2 === t2 ? -1 : 1);
  return (o2 = e2.getPossibleInstantsFor(Ie(r2, a2)))[2 === t2 ? 0 : o2.length - 1];
}
function ae(e2) {
  if (Math.abs(e2) >= Qr) {
    throw new RangeError(wr);
  }
  return e2;
}
function ne(e2) {
  if (e2 > Qr) {
    throw new RangeError(Br);
  }
  return e2;
}
function se(e2, n2, t2) {
  return _(checkEpochNanoInBounds(addBigNanos(n2.epochNanoseconds, ((e3) => {
    if (durationHasDateParts(e3)) {
      throw new RangeError(qr);
    }
    return durationFieldsToBigNano(e3, 5);
  })(e2 ? negateDurationFields(t2) : t2))));
}
function hn(e2, n2, t2, o2, r2, i2 = /* @__PURE__ */ Object.create(null)) {
  const a2 = n2(o2.timeZone), s2 = e2(o2.calendar);
  return {
    ...o2,
    ...moveZonedEpochs(a2, s2, o2, t2 ? negateDurationFields(r2) : r2, i2)
  };
}
function ct(e2, n2, t2, o2, r2 = /* @__PURE__ */ Object.create(null)) {
  const { calendar: i2 } = t2;
  return ee(moveDateTime(e2(i2), t2, n2 ? negateDurationFields(o2) : o2, r2), i2);
}
function bt(e2, n2, t2, o2, r2) {
  const { calendar: i2 } = t2;
  return v(moveDate(e2(i2), t2, n2 ? negateDurationFields(o2) : o2, r2), i2);
}
function Qe(e2, n2, t2, o2, r2 = /* @__PURE__ */ Object.create(null)) {
  const i2 = t2.calendar, a2 = e2(i2);
  let s2 = moveToDayOfMonthUnsafe(a2, t2);
  n2 && (o2 = xt(o2)), o2.sign < 0 && (s2 = a2.dateAdd(s2, {
    ...Si,
    months: 1
  }), s2 = moveByDays(s2, -1));
  const c2 = a2.dateAdd(s2, o2, r2);
  return createPlainYearMonthSlots(moveToDayOfMonthUnsafe(a2, c2), i2);
}
function Ye(e2, n2, t2) {
  return Ge(moveTime(n2, e2 ? negateDurationFields(t2) : t2)[0]);
}
function moveZonedEpochs(e2, n2, t2, o2, r2) {
  const i2 = durationFieldsToBigNano(o2, 5);
  let a2 = t2.epochNanoseconds;
  if (durationHasDateParts(o2)) {
    const s2 = fn(t2, e2);
    a2 = addBigNanos(we(e2, {
      ...moveDate(n2, s2, {
        ...o2,
        ...Fi
      }, r2),
      ...Vn(j, s2)
    }), i2);
  } else {
    a2 = addBigNanos(a2, i2), H(r2);
  }
  return {
    epochNanoseconds: checkEpochNanoInBounds(a2)
  };
}
function moveDateTime(e2, n2, t2, o2) {
  const [r2, i2] = moveTime(n2, t2);
  return checkIsoDateTimeInBounds({
    ...moveDate(e2, n2, {
      ...t2,
      ...Fi,
      days: t2.days + i2
    }, o2),
    ...r2
  });
}
function moveDate(e2, n2, t2, o2) {
  if (t2.years || t2.months || t2.weeks) {
    return e2.dateAdd(n2, t2, o2);
  }
  H(o2);
  const r2 = t2.days + durationFieldsToBigNano(t2, 5)[0];
  return r2 ? checkIsoDateInBounds(moveByDays(n2, r2)) : n2;
}
function moveToDayOfMonthUnsafe(e2, n2, t2 = 1) {
  return moveByDays(n2, t2 - e2.day(n2));
}
function moveTime(e2, n2) {
  const [t2, o2] = durationFieldsToBigNano(n2, 5), [r2, i2] = nanoToIsoTimeAndDay(isoTimeFieldsToNano(e2) + o2);
  return [r2, t2 + i2];
}
function moveByDays(e2, n2) {
  return n2 ? {
    ...e2,
    ...epochMilliToIso(isoToEpochMilli(e2) + n2 * Gr)
  } : e2;
}
function createMarkerSystem(e2, n2, t2) {
  const o2 = e2(t2.calendar);
  return isZonedEpochSlots(t2) ? [t2, o2, n2(t2.timeZone)] : [{
    ...t2,
    ...Dt
  }, o2];
}
function createMarkerToEpochNano(e2) {
  return e2 ? extractEpochNano : isoToEpochNano;
}
function createMoveMarker(e2) {
  return e2 ? E(moveZonedEpochs, e2) : moveDateTime;
}
function createDiffMarkers(e2) {
  return e2 ? E(diffZonedEpochsExact, e2) : diffDateTimesExact;
}
function isZonedEpochSlots(e2) {
  return e2 && e2.epochNanoseconds;
}
function isUniformUnit(e2, n2) {
  return e2 <= 6 - (isZonedEpochSlots(n2) ? 1 : 0);
}
function Wt(e2, n2, t2, o2, r2, i2, a2) {
  const s2 = e2(normalizeOptions(a2).relativeTo), c2 = Math.max(getMaxDurationUnit(r2), getMaxDurationUnit(i2));
  if (isUniformUnit(c2, s2)) {
    return Vt(checkDurationUnits(((e3, n3, t3, o3) => {
      const r3 = addBigNanos(durationFieldsToBigNano(e3), durationFieldsToBigNano(n3), o3 ? -1 : 1);
      if (!Number.isFinite(r3[0])) {
        throw new RangeError(Cr);
      }
      return {
        ...Si,
        ...nanoToDurationDayTimeFields(r3, t3)
      };
    })(r2, i2, c2, o2)));
  }
  if (!s2) {
    throw new RangeError(zr);
  }
  o2 && (i2 = negateDurationFields(i2));
  const [u2, l2, f2] = createMarkerSystem(n2, t2, s2), d2 = createMoveMarker(f2), m2 = createDiffMarkers(f2), p2 = d2(l2, u2, r2);
  return Vt(m2(l2, u2, d2(l2, p2, i2), c2));
}
function Gt(e2, n2, t2, o2, r2) {
  const i2 = getMaxDurationUnit(o2), [a2, s2, c2, u2, l2] = ((e3, n3, t3) => {
    e3 = normalizeOptionsOrString(e3, Hi);
    let o3 = sa(e3);
    const r3 = t3(e3[Ki]);
    let i3 = parseRoundingIncInteger(e3);
    const a3 = ha(e3, 7);
    let s3 = aa(e3);
    if (void 0 === o3 && void 0 === s3) {
      throw new RangeError(Ur);
    }
    return null == s3 && (s3 = 0), null == o3 && (o3 = Math.max(s3, n3)), checkLargestSmallestUnit(o3, s3), i3 = refineRoundingInc(i3, s3, 1), [o3, s3, i3, a3, r3];
  })(r2, i2, e2), f2 = Math.max(i2, a2);
  if (!isZonedEpochSlots(l2) && f2 <= 6) {
    return Vt(checkDurationUnits(((e3, n3, t3, o3, r3) => {
      const i3 = roundBigNano(durationFieldsToBigNano(e3), t3, o3, r3);
      return {
        ...Si,
        ...nanoToDurationDayTimeFields(i3, n3)
      };
    })(o2, a2, s2, c2, u2)));
  }
  if (!l2) {
    throw new RangeError(zr);
  }
  const [d2, m2, p2] = createMarkerSystem(n2, t2, l2), h2 = createMarkerToEpochNano(p2), g2 = createMoveMarker(p2), T2 = createDiffMarkers(p2), D2 = g2(m2, d2, o2);
  let I2 = T2(m2, d2, D2, a2);
  const M2 = o2.sign, N2 = computeDurationSign(I2);
  if (M2 && N2 && M2 !== N2) {
    throw new RangeError(vr);
  }
  return N2 && (I2 = roundRelativeDuration(I2, h2(D2), a2, s2, c2, u2, m2, d2, h2, g2)), Vt(I2);
}
function Rt(e2) {
  return -1 === e2.sign ? xt(e2) : e2;
}
function xt(e2) {
  return Vt(negateDurationFields(e2));
}
function negateDurationFields(e2) {
  const n2 = {};
  for (const t2 of F) {
    n2[t2] = -1 * e2[t2] || 0;
  }
  return n2;
}
function Jt(e2) {
  return !e2.sign;
}
function computeDurationSign(e2, n2 = F) {
  let t2 = 0;
  for (const o2 of n2) {
    const n3 = Math.sign(e2[o2]);
    if (n3) {
      if (t2 && t2 !== n3) {
        throw new RangeError(Rr);
      }
      t2 = n3;
    }
  }
  return t2;
}
function checkDurationUnits(e2) {
  for (const n2 of vi) {
    clampEntity(n2, e2[n2], -ya, ya, 1);
  }
  return checkDurationTimeUnit(oe(durationFieldsToBigNano(e2), _r)), e2;
}
function checkDurationTimeUnit(e2) {
  if (!Number.isSafeInteger(e2)) {
    throw new RangeError(Zr);
  }
}
function durationFieldsToBigNano(e2, n2 = 6) {
  return givenFieldsToBigNano(e2, n2, F);
}
function nanoToDurationDayTimeFields(e2, n2 = 6) {
  const [t2, o2] = e2, r2 = nanoToGivenFields(o2, n2, F);
  if (r2[F[n2]] += t2 * (Qr / Xr[n2]), !Number.isFinite(r2[F[n2]])) {
    throw new RangeError(Cr);
  }
  return r2;
}
function nanoToDurationTimeFields(e2, n2 = 5) {
  return nanoToGivenFields(e2, n2, F);
}
function durationHasDateParts(e2) {
  return Boolean(computeDurationSign(e2, Pi));
}
function getMaxDurationUnit(e2) {
  let n2 = 9;
  for (; n2 > 0 && !e2[F[n2]]; n2--) {
  }
  return n2;
}
function createSplitTuple(e2, n2) {
  return [e2, n2];
}
function computePeriod(e2) {
  const n2 = Math.floor(e2 / Da) * Da;
  return [n2, n2 + Da];
}
function pe(e2) {
  const n2 = parseDateTimeLike(e2 = toStringViaPrimitive(e2));
  if (!n2) {
    throw new RangeError(failedParse(e2));
  }
  let t2;
  if (n2.m) {
    t2 = 0;
  } else {
    if (!n2.offset) {
      throw new RangeError(failedParse(e2));
    }
    t2 = parseOffsetNano(n2.offset);
  }
  return n2.timeZone && parseOffsetNanoMaybe(n2.timeZone, 1), _(isoToEpochNanoWithOffset(checkIsoDateTimeFields(n2), t2));
}
function Xt(e2) {
  const n2 = parseDateTimeLike(m(e2));
  if (!n2) {
    throw new RangeError(failedParse(e2));
  }
  if (n2.timeZone) {
    return finalizeZonedDateTime(n2, n2.offset ? parseOffsetNano(n2.offset) : void 0);
  }
  if (n2.m) {
    throw new RangeError(failedParse(e2));
  }
  return finalizeDate(n2);
}
function Mn(e2, n2) {
  const t2 = parseDateTimeLike(m(e2));
  if (!t2 || !t2.timeZone) {
    throw new RangeError(failedParse(e2));
  }
  const { offset: o2 } = t2, r2 = o2 ? parseOffsetNano(o2) : void 0, [, i2, a2] = wn(n2);
  return finalizeZonedDateTime(t2, r2, i2, a2);
}
function parseOffsetNano(e2) {
  const n2 = parseOffsetNanoMaybe(e2);
  if (void 0 === n2) {
    throw new RangeError(failedParse(e2));
  }
  return n2;
}
function Ct(e2) {
  const n2 = parseDateTimeLike(m(e2));
  if (!n2 || n2.m) {
    throw new RangeError(failedParse(e2));
  }
  return ee(finalizeDateTime(n2));
}
function At(e2) {
  const n2 = parseDateTimeLike(m(e2));
  if (!n2 || n2.m) {
    throw new RangeError(failedParse(e2));
  }
  return v(n2.p ? finalizeDateTime(n2) : finalizeDate(n2));
}
function ot(e2, n2) {
  const t2 = parseYearMonthOnly(m(n2));
  if (t2) {
    return requireIsoCalendar(t2), createPlainYearMonthSlots(checkIsoYearMonthInBounds(checkIsoDateFields(t2)));
  }
  const o2 = At(n2);
  return createPlainYearMonthSlots(moveToDayOfMonthUnsafe(e2(o2.calendar), o2));
}
function requireIsoCalendar(e2) {
  if (e2.calendar !== X) {
    throw new RangeError(invalidSubstring(e2.calendar));
  }
}
function Q(e2, n2) {
  const t2 = parseMonthDayOnly(m(n2));
  if (t2) {
    return requireIsoCalendar(t2), createPlainMonthDaySlots(checkIsoDateFields(t2));
  }
  const o2 = At(n2), { calendar: r2 } = o2, i2 = e2(r2), [a2, s2, c2] = i2.h(o2), [u2, l2] = i2.I(a2, s2), [f2, d2] = i2.N(u2, l2, c2);
  return createPlainMonthDaySlots(checkIsoDateInBounds(i2.P(f2, d2, c2)), r2);
}
function ze(e2) {
  let n2, t2 = ((e3) => {
    const n3 = Ca.exec(e3);
    return n3 ? (organizeAnnotationParts(n3[10]), organizeTimeParts(n3)) : void 0;
  })(m(e2));
  if (!t2) {
    if (t2 = parseDateTimeLike(e2), !t2) {
      throw new RangeError(failedParse(e2));
    }
    if (!t2.p) {
      throw new RangeError(failedParse(e2));
    }
    if (t2.m) {
      throw new RangeError(invalidSubstring("Z"));
    }
    requireIsoCalendar(t2);
  }
  if ((n2 = parseYearMonthOnly(e2)) && isIsoDateFieldsValid(n2)) {
    throw new RangeError(failedParse(e2));
  }
  if ((n2 = parseMonthDayOnly(e2)) && isIsoDateFieldsValid(n2)) {
    throw new RangeError(failedParse(e2));
  }
  return Ge(constrainIsoTimeFields(t2, 1));
}
function Kt(e2) {
  const n2 = ((e3) => {
    const n3 = za.exec(e3);
    return n3 ? ((e4) => {
      function parseUnit(e5, r3, i2) {
        let a2 = 0, s2 = 0;
        if (i2 && ([a2, o2] = divModFloor(o2, Xr[i2])), void 0 !== e5) {
          if (t2) {
            throw new RangeError(invalidSubstring(e5));
          }
          s2 = ((e6) => {
            const n5 = parseInt(e6);
            if (!Number.isFinite(n5)) {
              throw new RangeError(invalidSubstring(e6));
            }
            return n5;
          })(e5), n4 = 1, r3 && (o2 = parseSubsecNano(r3) * (Xr[i2] / _r), t2 = 1);
        }
        return a2 + s2;
      }
      let n4 = 0, t2 = 0, o2 = 0, r2 = {
        ...zipProps(F, [parseUnit(e4[2]), parseUnit(e4[3]), parseUnit(e4[4]), parseUnit(e4[5]), parseUnit(e4[6], e4[7], 5), parseUnit(e4[8], e4[9], 4), parseUnit(e4[10], e4[11], 3)]),
        ...nanoToGivenFields(o2, 2, F)
      };
      if (!n4) {
        throw new RangeError(noValidFields(F));
      }
      return parseSign(e4[1]) < 0 && (r2 = negateDurationFields(r2)), r2;
    })(n3) : void 0;
  })(m(e2));
  if (!n2) {
    throw new RangeError(failedParse(e2));
  }
  return Vt(checkDurationUnits(n2));
}
function sn(e2) {
  const n2 = parseDateTimeLike(e2) || parseYearMonthOnly(e2) || parseMonthDayOnly(e2);
  return n2 ? n2.calendar : e2;
}
function Ne(e2) {
  const n2 = parseDateTimeLike(e2);
  return n2 && (n2.timeZone || n2.m && Ta || n2.offset) || e2;
}
function finalizeZonedDateTime(e2, n2, t2 = 0, o2 = 0) {
  const r2 = ye(e2.timeZone), i2 = ie(r2);
  return Yn(getMatchingInstantFor(i2, checkIsoDateTimeFields(e2), n2, t2, o2, !i2.v, e2.m), r2, an(e2.calendar));
}
function finalizeDateTime(e2) {
  return resolveSlotsCalendar(checkIsoDateTimeInBounds(checkIsoDateTimeFields(e2)));
}
function finalizeDate(e2) {
  return resolveSlotsCalendar(checkIsoDateInBounds(checkIsoDateFields(e2)));
}
function resolveSlotsCalendar(e2) {
  return {
    ...e2,
    calendar: an(e2.calendar)
  };
}
function parseDateTimeLike(e2) {
  const n2 = Ya.exec(e2);
  return n2 ? ((e3) => {
    const n3 = e3[10], t2 = "Z" === (n3 || "").toUpperCase();
    return {
      isoYear: organizeIsoYearParts(e3),
      isoMonth: parseInt(e3[4]),
      isoDay: parseInt(e3[5]),
      ...organizeTimeParts(e3.slice(5)),
      ...organizeAnnotationParts(e3[16]),
      p: Boolean(e3[6]),
      m: t2,
      offset: t2 ? void 0 : n3
    };
  })(n2) : void 0;
}
function parseYearMonthOnly(e2) {
  const n2 = Ba.exec(e2);
  return n2 ? ((e3) => ({
    isoYear: organizeIsoYearParts(e3),
    isoMonth: parseInt(e3[4]),
    isoDay: 1,
    ...organizeAnnotationParts(e3[5])
  }))(n2) : void 0;
}
function parseMonthDayOnly(e2) {
  const n2 = ka.exec(e2);
  return n2 ? ((e3) => ({
    isoYear: ji,
    isoMonth: parseInt(e3[1]),
    isoDay: parseInt(e3[2]),
    ...organizeAnnotationParts(e3[3])
  }))(n2) : void 0;
}
function parseOffsetNanoMaybe(e2, n2) {
  const t2 = Za.exec(e2);
  return t2 ? ((e3, n3) => {
    const t3 = e3[4] || e3[5];
    if (n3 && t3) {
      throw new RangeError(invalidSubstring(t3));
    }
    return ae((parseInt0(e3[2]) * Kr + parseInt0(e3[3]) * Jr + parseInt0(e3[4]) * _r + parseSubsecNano(e3[5] || "")) * parseSign(e3[1]));
  })(t2, n2) : void 0;
}
function organizeIsoYearParts(e2) {
  const n2 = parseSign(e2[1]), t2 = parseInt(e2[2] || e2[3]);
  if (n2 < 0 && !t2) {
    throw new RangeError(invalidSubstring(-0));
  }
  return n2 * t2;
}
function organizeTimeParts(e2) {
  const n2 = parseInt0(e2[3]);
  return {
    ...nanoToIsoTimeAndDay(parseSubsecNano(e2[4] || ""))[0],
    isoHour: parseInt0(e2[1]),
    isoMinute: parseInt0(e2[2]),
    isoSecond: 60 === n2 ? 59 : n2
  };
}
function organizeAnnotationParts(e2) {
  let n2, t2;
  const o2 = [];
  if (e2.replace(Ra, (e3, r2, i2) => {
    const a2 = Boolean(r2), [s2, c2] = i2.split("=").reverse();
    if (c2) {
      if ("u-ca" === c2) {
        o2.push(s2), n2 || (n2 = a2);
      } else if (a2 || /[A-Z]/.test(c2)) {
        throw new RangeError(invalidSubstring(e3));
      }
    } else {
      if (t2) {
        throw new RangeError(invalidSubstring(e3));
      }
      t2 = s2;
    }
    return "";
  }), o2.length > 1 && n2) {
    throw new RangeError(invalidSubstring(e2));
  }
  return {
    timeZone: t2,
    calendar: o2[0] || X
  };
}
function parseSubsecNano(e2) {
  return parseInt(e2.padEnd(9, "0"));
}
function createRegExp(e2) {
  return new RegExp(`^${e2}$`, "i");
}
function parseSign(e2) {
  return e2 && "+" !== e2 ? -1 : 1;
}
function parseInt0(e2) {
  return void 0 === e2 ? 0 : parseInt(e2);
}
function Me(e2) {
  return ye(m(e2));
}
function ye(e2) {
  const n2 = getTimeZoneEssence(e2);
  return "number" == typeof n2 ? Fe(n2) : n2 ? ((e3) => {
    if (Ua.test(e3)) {
      throw new RangeError(br);
    }
    return e3.toLowerCase().split("/").map((e4, n3) => (e4.length <= 3 || /\d/.test(e4)) && !/etc|yap/.test(e4) ? e4.toUpperCase() : e4.replace(/baja|dumont|[a-z]+/g, (e5, t2) => e5.length <= 2 && !n3 || "in" === e5 || "chat" === e5 ? e5.toUpperCase() : e5.length > 2 || !t2 ? capitalize(e5).replace(/island|noronha|murdo|rivadavia|urville/, capitalize) : e5)).join("/");
  })(e2) : Ta;
}
function getTimeZoneAtomic(e2) {
  const n2 = getTimeZoneEssence(e2);
  return "number" == typeof n2 ? n2 : n2 ? n2.resolvedOptions().timeZone : Ta;
}
function getTimeZoneEssence(e2) {
  const n2 = parseOffsetNanoMaybe(e2 = e2.toUpperCase(), 1);
  return void 0 !== n2 ? n2 : e2 !== Ta ? qa(e2) : void 0;
}
function Ze(e2, n2) {
  return te(e2.epochNanoseconds, n2.epochNanoseconds);
}
function yn(e2, n2) {
  return te(e2.epochNanoseconds, n2.epochNanoseconds);
}
function $t(e2, n2, t2, o2, r2, i2) {
  const a2 = e2(normalizeOptions(i2).relativeTo), s2 = Math.max(getMaxDurationUnit(o2), getMaxDurationUnit(r2));
  if (allPropsEqual(F, o2, r2)) {
    return 0;
  }
  if (isUniformUnit(s2, a2)) {
    return te(durationFieldsToBigNano(o2), durationFieldsToBigNano(r2));
  }
  if (!a2) {
    throw new RangeError(zr);
  }
  const [c2, u2, l2] = createMarkerSystem(n2, t2, a2), f2 = createMarkerToEpochNano(l2), d2 = createMoveMarker(l2);
  return te(f2(d2(u2, c2, o2)), f2(d2(u2, c2, r2)));
}
function gt(e2, n2) {
  return rt(e2, n2) || He(e2, n2);
}
function rt(e2, n2) {
  return compareNumbers(isoToEpochMilli(e2), isoToEpochMilli(n2));
}
function He(e2, n2) {
  return compareNumbers(isoTimeFieldsToNano(e2), isoTimeFieldsToNano(n2));
}
function ue(e2, n2) {
  return !Ze(e2, n2);
}
function gn(e2, n2) {
  return !yn(e2, n2) && !!je(e2.timeZone, n2.timeZone) && isIdLikeEqual(e2.calendar, n2.calendar);
}
function ft(e2, n2) {
  return !gt(e2, n2) && isIdLikeEqual(e2.calendar, n2.calendar);
}
function It(e2, n2) {
  return !rt(e2, n2) && isIdLikeEqual(e2.calendar, n2.calendar);
}
function $e(e2, n2) {
  return !rt(e2, n2) && isIdLikeEqual(e2.calendar, n2.calendar);
}
function x(e2, n2) {
  return !rt(e2, n2) && isIdLikeEqual(e2.calendar, n2.calendar);
}
function Ve(e2, n2) {
  return !He(e2, n2);
}
function je(e2, n2) {
  if (e2 === n2) {
    return 1;
  }
  const t2 = I(e2), o2 = I(n2);
  if (t2 === o2) {
    return 1;
  }
  try {
    return getTimeZoneAtomic(t2) === getTimeZoneAtomic(o2);
  } catch (e3) {
  }
}
function le(e2, n2, t2, o2) {
  const r2 = refineDiffOptions(e2, U(o2), 3, 5), i2 = diffEpochNanos(n2.epochNanoseconds, t2.epochNanoseconds, ...r2);
  return Vt(e2 ? negateDurationFields(i2) : i2);
}
function Dn(e2, n2, t2, o2, r2, i2) {
  const a2 = getCommonCalendarSlot(o2.calendar, r2.calendar), s2 = U(i2), [c2, u2, l2, f2] = refineDiffOptions(t2, s2, 5), d2 = o2.epochNanoseconds, m2 = r2.epochNanoseconds, p2 = te(m2, d2);
  let h2;
  if (p2) {
    if (c2 < 6) {
      h2 = diffEpochNanos(d2, m2, c2, u2, l2, f2);
    } else {
      const t3 = n2(((e3, n3) => {
        if (!je(e3, n3)) {
          throw new RangeError(Fr);
        }
        return e3;
      })(o2.timeZone, r2.timeZone)), i3 = e2(a2);
      h2 = diffZonedEpochsBig(i3, t3, o2, r2, p2, c2, s2), h2 = roundRelativeDuration(h2, m2, c2, u2, l2, f2, i3, o2, extractEpochNano, E(moveZonedEpochs, t3));
    }
  } else {
    h2 = Si;
  }
  return Vt(t2 ? negateDurationFields(h2) : h2);
}
function ut(e2, n2, t2, o2, r2) {
  const i2 = getCommonCalendarSlot(t2.calendar, o2.calendar), a2 = U(r2), [s2, c2, u2, l2] = refineDiffOptions(n2, a2, 6), f2 = isoToEpochNano(t2), d2 = isoToEpochNano(o2), m2 = te(d2, f2);
  let p2;
  if (m2) {
    if (s2 <= 6) {
      p2 = diffEpochNanos(f2, d2, s2, c2, u2, l2);
    } else {
      const n3 = e2(i2);
      p2 = diffDateTimesBig(n3, t2, o2, m2, s2, a2), p2 = roundRelativeDuration(p2, d2, s2, c2, u2, l2, n3, t2, isoToEpochNano, moveDateTime);
    }
  } else {
    p2 = Si;
  }
  return Vt(n2 ? negateDurationFields(p2) : p2);
}
function Ft(e2, n2, t2, o2, r2) {
  const i2 = getCommonCalendarSlot(t2.calendar, o2.calendar), a2 = U(r2);
  return diffDateLike(n2, () => e2(i2), t2, o2, ...refineDiffOptions(n2, a2, 6, 9, 6), a2);
}
function Xe(e2, n2, t2, o2, r2) {
  const i2 = getCommonCalendarSlot(t2.calendar, o2.calendar), a2 = U(r2), s2 = refineDiffOptions(n2, a2, 9, 9, 8), c2 = e2(i2);
  return diffDateLike(n2, () => c2, moveToDayOfMonthUnsafe(c2, t2), moveToDayOfMonthUnsafe(c2, o2), ...s2, a2);
}
function diffDateLike(e2, n2, t2, o2, r2, i2, a2, s2, c2) {
  const u2 = isoToEpochNano(t2), l2 = isoToEpochNano(o2);
  let f2;
  if (te(l2, u2)) {
    if (6 === r2) {
      f2 = diffEpochNanos(u2, l2, r2, i2, a2, s2);
    } else {
      const e3 = n2();
      f2 = e3.dateUntil(t2, o2, r2, c2), 6 === i2 && 1 === a2 || (f2 = roundRelativeDuration(f2, l2, r2, i2, a2, s2, e3, t2, isoToEpochNano, moveDate));
    }
  } else {
    f2 = Si;
  }
  return Vt(e2 ? negateDurationFields(f2) : f2);
}
function Ae(e2, n2, t2, o2) {
  const r2 = U(o2), [i2, a2, s2, c2] = refineDiffOptions(e2, r2, 5, 5), u2 = roundByInc(diffTimes(n2, t2), computeNanoInc(a2, s2), c2), l2 = {
    ...Si,
    ...nanoToDurationTimeFields(u2, i2)
  };
  return Vt(e2 ? negateDurationFields(l2) : l2);
}
function diffZonedEpochsExact(e2, n2, t2, o2, r2, i2) {
  const a2 = te(o2.epochNanoseconds, t2.epochNanoseconds);
  return a2 ? r2 < 6 ? diffEpochNanosExact(t2.epochNanoseconds, o2.epochNanoseconds, r2) : diffZonedEpochsBig(n2, e2, t2, o2, a2, r2, i2) : Si;
}
function diffDateTimesExact(e2, n2, t2, o2, r2) {
  const i2 = isoToEpochNano(n2), a2 = isoToEpochNano(t2), s2 = te(a2, i2);
  return s2 ? o2 <= 6 ? diffEpochNanosExact(i2, a2, o2) : diffDateTimesBig(e2, n2, t2, s2, o2, r2) : Si;
}
function diffZonedEpochsBig(e2, n2, t2, o2, r2, i2, a2) {
  const [s2, c2, u2] = ((e3, n3, t3, o3) => {
    function updateMid() {
      return l3 = {
        ...moveByDays(a3, c3++ * -o3),
        ...i3
      }, f3 = we(e3, l3), te(s3, f3) === -o3;
    }
    const r3 = fn(n3, e3), i3 = Vn(j, r3), a3 = fn(t3, e3), s3 = t3.epochNanoseconds;
    let c3 = 0;
    const u3 = diffTimes(r3, a3);
    let l3, f3;
    if (Math.sign(u3) === -o3 && c3++, updateMid() && (-1 === o3 || updateMid())) {
      throw new RangeError(vr);
    }
    const d2 = oe(re(f3, s3));
    return [r3, l3, d2];
  })(n2, t2, o2, r2);
  var l2, f2;
  return {
    ...6 === i2 ? (l2 = s2, f2 = c2, {
      ...Si,
      days: diffDays(l2, f2)
    }) : e2.dateUntil(s2, c2, i2, a2),
    ...nanoToDurationTimeFields(u2)
  };
}
function diffDateTimesBig(e2, n2, t2, o2, r2, i2) {
  const [a2, s2, c2] = ((e3, n3, t3) => {
    let o3 = n3, r3 = diffTimes(e3, n3);
    return Math.sign(r3) === -t3 && (o3 = moveByDays(n3, -t3), r3 += Qr * t3), [e3, o3, r3];
  })(n2, t2, o2);
  return {
    ...e2.dateUntil(a2, s2, r2, i2),
    ...nanoToDurationTimeFields(c2)
  };
}
function diffEpochNanos(e2, n2, t2, o2, r2, i2) {
  return {
    ...Si,
    ...nanoToDurationDayTimeFields(roundBigNano(re(e2, n2), o2, r2, i2), t2)
  };
}
function diffEpochNanosExact(e2, n2, t2) {
  return {
    ...Si,
    ...nanoToDurationDayTimeFields(re(e2, n2), t2)
  };
}
function diffDays(e2, n2) {
  return diffEpochMilliByDay(isoToEpochMilli(e2), isoToEpochMilli(n2));
}
function diffEpochMilliByDay(e2, n2) {
  return Math.trunc((n2 - e2) / Gr);
}
function diffTimes(e2, n2) {
  return isoTimeFieldsToNano(n2) - isoTimeFieldsToNano(e2);
}
function getCommonCalendarSlot(e2, n2) {
  if (!isIdLikeEqual(e2, n2)) {
    throw new RangeError(Er);
  }
  return e2;
}
function createIntlCalendar(e2) {
  function epochMilliToIntlFields(e3) {
    return ((e4, n3) => ({
      ...parseIntlYear(e4, n3),
      F: e4.month,
      day: parseInt(e4.day)
    }))(hashIntlFormatParts(n2, e3), t2);
  }
  const n2 = La(e2), t2 = computeCalendarIdBase(e2);
  return {
    id: e2,
    O: createIntlFieldCache(epochMilliToIntlFields),
    B: createIntlYearDataCache(epochMilliToIntlFields)
  };
}
function createIntlFieldCache(e2) {
  return Jn((n2) => {
    const t2 = isoToEpochMilli(n2);
    return e2(t2);
  }, WeakMap);
}
function createIntlYearDataCache(e2) {
  const n2 = e2(0).year - Wi;
  return Jn((t2) => {
    let o2, r2 = isoArgsToEpochMilli(t2 - n2);
    const i2 = [], a2 = [];
    do {
      r2 += 400 * Gr;
    } while ((o2 = e2(r2)).year <= t2);
    do {
      r2 += (1 - o2.day) * Gr, o2.year === t2 && (i2.push(r2), a2.push(o2.F)), r2 -= Gr;
    } while ((o2 = e2(r2)).year >= t2);
    return {
      k: i2.reverse(),
      C: Wr(a2.reverse())
    };
  });
}
function parseIntlYear(e2, n2) {
  let t2, o2, r2 = parseIntlPartsYear(e2);
  if (e2.era) {
    const i2 = Di[n2];
    void 0 !== i2 && (t2 = "islamic" === n2 ? "ah" : e2.era.normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, ""), "bc" === t2 || "b" === t2 ? t2 = "bce" : "ad" !== t2 && "a" !== t2 || (t2 = "ce"), o2 = r2, r2 = eraYearToYear(o2, i2[t2] || 0));
  }
  return {
    era: t2,
    eraYear: o2,
    year: r2
  };
}
function parseIntlPartsYear(e2) {
  return parseInt(e2.relatedYear || e2.year);
}
function computeIntlDateParts(e2) {
  const { year: n2, F: t2, day: o2 } = this.O(e2), { C: r2 } = this.B(n2);
  return [n2, r2[t2] + 1, o2];
}
function computeIntlEpochMilli(e2, n2 = 1, t2 = 1) {
  return this.B(e2).k[n2 - 1] + (t2 - 1) * Gr;
}
function computeIntlLeapMonth(e2) {
  const n2 = queryMonthStrings(this, e2), t2 = queryMonthStrings(this, e2 - 1), o2 = n2.length;
  if (o2 > t2.length) {
    const e3 = getCalendarLeapMonthMeta(this);
    if (e3 < 0) {
      return -e3;
    }
    for (let e4 = 0; e4 < o2; e4++) {
      if (n2[e4] !== t2[e4]) {
        return e4 + 1;
      }
    }
  }
}
function computeIntlDaysInYear(e2) {
  return diffEpochMilliByDay(computeIntlEpochMilli.call(this, e2), computeIntlEpochMilli.call(this, e2 + 1));
}
function computeIntlDaysInMonth(e2, n2) {
  const { k: t2 } = this.B(e2);
  let o2 = n2 + 1, r2 = t2;
  return o2 > t2.length && (o2 = 1, r2 = this.B(e2 + 1).k), diffEpochMilliByDay(t2[n2 - 1], r2[o2 - 1]);
}
function computeIntlMonthsInYear(e2) {
  return this.B(e2).k.length;
}
function queryMonthStrings(e2, n2) {
  return Object.keys(e2.B(n2).C);
}
function rn(e2) {
  return an(m(e2));
}
function an(e2) {
  if ((e2 = e2.toLowerCase()) !== X && e2 !== gi && computeCalendarIdBase(e2) !== computeCalendarIdBase(La(e2).resolvedOptions().calendar)) {
    throw new RangeError(invalidCalendar(e2));
  }
  return e2;
}
function computeCalendarIdBase(e2) {
  return "islamicc" === e2 && (e2 = "islamic"), e2.split("-")[0];
}
function computeNativeWeekOfYear(e2) {
  return this.R(e2)[0];
}
function computeNativeYearOfWeek(e2) {
  return this.R(e2)[1];
}
function computeNativeDayOfYear(e2) {
  const [n2] = this.h(e2);
  return diffEpochMilliByDay(this.q(n2), isoToEpochMilli(e2)) + 1;
}
function parseMonthCode(e2) {
  const n2 = Wa.exec(e2);
  if (!n2) {
    throw new RangeError(invalidMonthCode(e2));
  }
  return [parseInt(n2[1]), Boolean(n2[2])];
}
function monthCodeNumberToMonth(e2, n2, t2) {
  return e2 + (n2 || t2 && e2 >= t2 ? 1 : 0);
}
function monthToMonthCodeNumber(e2, n2) {
  return e2 - (n2 && e2 >= n2 ? 1 : 0);
}
function eraYearToYear(e2, n2) {
  return (n2 + e2) * (Math.sign(n2) || 1) || 0;
}
function getCalendarEraOrigins(e2) {
  return Di[getCalendarIdBase(e2)];
}
function getCalendarLeapMonthMeta(e2) {
  return Ii[getCalendarIdBase(e2)];
}
function getCalendarIdBase(e2) {
  return computeCalendarIdBase(e2.id || X);
}
function Qt(e2, n2, t2, o2) {
  const r2 = refineCalendarFields(t2, o2, en, [], ri);
  if (void 0 !== r2.timeZone) {
    const o3 = t2.dateFromFields(r2), i2 = refineTimeBag(r2), a2 = e2(r2.timeZone);
    return {
      epochNanoseconds: getMatchingInstantFor(n2(a2), {
        ...o3,
        ...i2
      }, void 0 !== r2.offset ? parseOffsetNano(r2.offset) : void 0),
      timeZone: a2
    };
  }
  return {
    ...t2.dateFromFields(r2),
    ...Dt
  };
}
function jn(e2, n2, t2, o2, r2, i2) {
  const a2 = refineCalendarFields(t2, r2, en, ti, ri), s2 = e2(a2.timeZone), [c2, u2, l2] = wn(i2), f2 = t2.dateFromFields(a2, overrideOverflowOptions(i2, c2)), d2 = refineTimeBag(a2, c2);
  return Yn(getMatchingInstantFor(n2(s2), {
    ...f2,
    ...d2
  }, void 0 !== a2.offset ? parseOffsetNano(a2.offset) : void 0, u2, l2), s2, o2);
}
function Pt(e2, n2, t2) {
  const o2 = refineCalendarFields(e2, n2, en, [], w), r2 = H(t2);
  return ee(checkIsoDateTimeInBounds({
    ...e2.dateFromFields(o2, overrideOverflowOptions(t2, r2)),
    ...refineTimeBag(o2, r2)
  }));
}
function Yt(e2, n2, t2, o2 = []) {
  const r2 = refineCalendarFields(e2, n2, en, o2);
  return e2.dateFromFields(r2, t2);
}
function nt(e2, n2, t2, o2) {
  const r2 = refineCalendarFields(e2, n2, fi, o2);
  return e2.yearMonthFromFields(r2, t2);
}
function K(e2, n2, t2, o2, r2 = []) {
  const i2 = refineCalendarFields(e2, t2, en, r2);
  return n2 && void 0 !== i2.month && void 0 === i2.monthCode && void 0 === i2.year && (i2.year = ji), e2.monthDayFromFields(i2, o2);
}
function Ue(e2, n2) {
  const t2 = H(n2);
  return Ge(refineTimeBag(refineFields(e2, ei, [], 1), t2));
}
function Ht(e2) {
  const n2 = refineFields(e2, Ni);
  return Vt(checkDurationUnits({
    ...Si,
    ...n2
  }));
}
function refineCalendarFields(e2, n2, t2, o2 = [], r2 = []) {
  return refineFields(n2, [...e2.fields(t2), ...r2].sort(), o2);
}
function refineFields(e2, n2, t2, o2 = !t2) {
  const r2 = {};
  let i2, a2 = 0;
  for (const o3 of n2) {
    if (o3 === i2) {
      throw new RangeError(duplicateFields(o3));
    }
    if ("constructor" === o3 || "__proto__" === o3) {
      throw new RangeError(tn(o3));
    }
    let n3 = e2[o3];
    if (void 0 !== n3) {
      a2 = 1, Ga[o3] && (n3 = Ga[o3](n3, o3)), r2[o3] = n3;
    } else if (t2) {
      if (t2.includes(o3)) {
        throw new TypeError(missingField(o3));
      }
      r2[o3] = hi[o3];
    }
    i2 = o3;
  }
  if (o2 && !a2) {
    throw new TypeError(noValidFields(n2));
  }
  return r2;
}
function refineTimeBag(e2, n2) {
  return constrainIsoTimeFields(Ha({
    ...hi,
    ...e2
  }), n2);
}
function Sn(e2, n2, t2, o2, r2, i2) {
  const a2 = U(i2), { calendar: s2, timeZone: c2 } = t2;
  return Yn(((e3, n3, t3, o3, r3) => {
    const i3 = mergeCalendarFields(e3, t3, o3, en, oi, ni), [a3, s3, c3] = wn(r3, 2);
    return getMatchingInstantFor(n3, {
      ...e3.dateFromFields(i3, overrideOverflowOptions(r3, a3)),
      ...refineTimeBag(i3, a3)
    }, parseOffsetNano(i3.offset), s3, c3);
  })(e2(s2), n2(c2), o2, r2, a2), c2, s2);
}
function at(e2, n2, t2, o2, r2) {
  const i2 = U(r2);
  return ee(((e3, n3, t3, o3) => {
    const r3 = mergeCalendarFields(e3, n3, t3, en, w), i3 = H(o3);
    return checkIsoDateTimeInBounds({
      ...e3.dateFromFields(r3, overrideOverflowOptions(o3, i3)),
      ...refineTimeBag(r3, i3)
    });
  })(e2(n2.calendar), t2, o2, i2));
}
function Zt(e2, n2, t2, o2, r2) {
  const i2 = U(r2);
  return ((e3, n3, t3, o3) => {
    const r3 = mergeCalendarFields(e3, n3, t3, en);
    return e3.dateFromFields(r3, o3);
  })(e2(n2.calendar), t2, o2, i2);
}
function Ke(e2, n2, t2, o2, r2) {
  const i2 = U(r2);
  return createPlainYearMonthSlots(((e3, n3, t3, o3) => {
    const r3 = mergeCalendarFields(e3, n3, t3, fi);
    return e3.yearMonthFromFields(r3, o3);
  })(e2(n2.calendar), t2, o2, i2));
}
function k(e2, n2, t2, o2, r2) {
  const i2 = U(r2);
  return ((e3, n3, t3, o3) => {
    const r3 = mergeCalendarFields(e3, n3, t3, en);
    return e3.monthDayFromFields(r3, o3);
  })(e2(n2.calendar), t2, o2, i2);
}
function Be(e2, n2, t2) {
  return Ge(((e3, n3, t3) => {
    const o2 = H(t3);
    return refineTimeBag({
      ...Vn(ei, e3),
      ...refineFields(n3, ei)
    }, o2);
  })(e2, n2, t2));
}
function kt(e2, n2) {
  return Vt((t2 = e2, o2 = n2, checkDurationUnits({
    ...t2,
    ...refineFields(o2, Ni)
  })));
  var t2, o2;
}
function mergeCalendarFields(e2, n2, t2, o2, r2 = [], i2 = []) {
  const a2 = [...e2.fields(o2), ...r2].sort();
  let s2 = refineFields(n2, a2, i2);
  const c2 = refineFields(t2, a2);
  return s2 = e2.mergeFields(s2, c2), refineFields(s2, a2, []);
}
function convertToPlainMonthDay(e2, n2) {
  const t2 = refineCalendarFields(e2, n2, pi);
  return e2.monthDayFromFields(t2);
}
function convertToPlainYearMonth(e2, n2, t2) {
  const o2 = refineCalendarFields(e2, n2, di);
  return e2.yearMonthFromFields(o2, t2);
}
function convertToIso(e2, n2, t2, o2, r2) {
  n2 = Vn(t2 = e2.fields(t2), n2), o2 = refineFields(o2, r2 = e2.fields(r2), []);
  let i2 = e2.mergeFields(n2, o2);
  return i2 = refineFields(i2, [...t2, ...r2].sort(), []), e2.dateFromFields(i2);
}
function refineYear(e2, n2) {
  let { era: t2, eraYear: o2, year: r2 } = n2;
  const i2 = getCalendarEraOrigins(e2);
  if (void 0 !== t2 || void 0 !== o2) {
    if (void 0 === t2 || void 0 === o2) {
      throw new TypeError(Dr);
    }
    if (!i2) {
      throw new RangeError(gr);
    }
    const e3 = i2[t2];
    if (void 0 === e3) {
      throw new RangeError(invalidEra(t2));
    }
    const n3 = eraYearToYear(o2, e3);
    if (void 0 !== r2 && r2 !== n3) {
      throw new RangeError(Ir);
    }
    r2 = n3;
  } else if (void 0 === r2) {
    throw new TypeError(missingYear(i2));
  }
  return r2;
}
function refineMonth(e2, n2, t2, o2) {
  let { month: r2, monthCode: i2 } = n2;
  if (void 0 !== i2) {
    const n3 = ((e3, n4, t3, o3) => {
      const r3 = e3.U(t3), [i3, a2] = parseMonthCode(n4);
      let s2 = monthCodeNumberToMonth(i3, a2, r3);
      if (a2) {
        const n5 = getCalendarLeapMonthMeta(e3);
        if (void 0 === n5) {
          throw new RangeError(Pr);
        }
        if (n5 > 0) {
          if (s2 > n5) {
            throw new RangeError(Pr);
          }
          if (void 0 === r3) {
            if (1 === o3) {
              throw new RangeError(Pr);
            }
            s2--;
          }
        } else {
          if (s2 !== -n5) {
            throw new RangeError(Pr);
          }
          if (void 0 === r3 && 1 === o3) {
            throw new RangeError(Pr);
          }
        }
      }
      return s2;
    })(e2, i2, t2, o2);
    if (void 0 !== r2 && r2 !== n3) {
      throw new RangeError(Mr);
    }
    r2 = n3, o2 = 1;
  } else if (void 0 === r2) {
    throw new TypeError(Nr);
  }
  return clampEntity("month", r2, 1, e2.L(t2), o2);
}
function refineDay(e2, n2, t2, o2, r2) {
  return clampProp(n2, "day", 1, e2.j(o2, t2), r2);
}
function spliceFields(e2, n2, t2, o2) {
  let r2 = 0;
  const i2 = [];
  for (const e3 of t2) {
    void 0 !== n2[e3] ? r2 = 1 : i2.push(e3);
  }
  if (Object.assign(e2, n2), r2) {
    for (const n3 of o2 || i2) {
      delete e2[n3];
    }
  }
}
function Se(e2) {
  return _(checkEpochNanoInBounds(bigIntToBigNano(toBigInt(e2))));
}
function vn(e2, n2, t2, o2, r2 = X) {
  return Yn(checkEpochNanoInBounds(bigIntToBigNano(toBigInt(t2))), n2(o2), e2(r2));
}
function pt(e2, n2, t2, o2, r2 = 0, i2 = 0, a2 = 0, s2 = 0, c2 = 0, u2 = 0, l2 = X) {
  return ee(checkIsoDateTimeInBounds(checkIsoDateTimeFields(T(toInteger, zipProps(wi, [n2, t2, o2, r2, i2, a2, s2, c2, u2])))), e2(l2));
}
function Nt(e2, n2, t2, o2, r2 = X) {
  return v(checkIsoDateInBounds(checkIsoDateFields(T(toInteger, {
    isoYear: n2,
    isoMonth: t2,
    isoDay: o2
  }))), e2(r2));
}
function tt(e2, n2, t2, o2 = X, r2 = 1) {
  const i2 = toInteger(n2), a2 = toInteger(t2), s2 = e2(o2);
  return createPlainYearMonthSlots(checkIsoYearMonthInBounds(checkIsoDateFields({
    isoYear: i2,
    isoMonth: a2,
    isoDay: toInteger(r2)
  })), s2);
}
function G(e2, n2, t2, o2 = X, r2 = ji) {
  const i2 = toInteger(n2), a2 = toInteger(t2), s2 = e2(o2);
  return createPlainMonthDaySlots(checkIsoDateInBounds(checkIsoDateFields({
    isoYear: toInteger(r2),
    isoMonth: i2,
    isoDay: a2
  })), s2);
}
function ke(e2 = 0, n2 = 0, t2 = 0, o2 = 0, r2 = 0, i2 = 0) {
  return Ge(constrainIsoTimeFields(T(toInteger, zipProps(j, [e2, n2, t2, o2, r2, i2])), 1));
}
function Lt(e2 = 0, n2 = 0, t2 = 0, o2 = 0, r2 = 0, i2 = 0, a2 = 0, s2 = 0, c2 = 0, u2 = 0) {
  return Vt(checkDurationUnits(T(toStrictInteger, zipProps(F, [e2, n2, t2, o2, r2, i2, a2, s2, c2, u2]))));
}
function fe(e2, n2, t2 = X) {
  return Yn(e2.epochNanoseconds, n2, t2);
}
function Zn(e2) {
  return _(e2.epochNanoseconds);
}
function ht(e2, n2) {
  return ee(fn(n2, e2));
}
function Bt(e2, n2) {
  return v(fn(n2, e2));
}
function bn(e2, n2, t2) {
  return convertToPlainYearMonth(e2(n2.calendar), t2);
}
function Fn(e2, n2, t2) {
  return convertToPlainMonthDay(e2(n2.calendar), t2);
}
function Re(e2, n2) {
  return Ge(fn(n2, e2));
}
function mt(e2, n2, t2, o2) {
  const r2 = ((e3, n3, t3, o3) => {
    const r3 = ve(o3);
    return we(e3(n3), t3, r3);
  })(e2, t2, n2, o2);
  return Yn(checkEpochNanoInBounds(r2), t2, n2.calendar);
}
function St(e2, n2, t2) {
  const o2 = e2(n2.calendar);
  return createPlainYearMonthSlots({
    ...n2,
    ...convertToPlainYearMonth(o2, t2)
  });
}
function Ot(e2, n2, t2) {
  return convertToPlainMonthDay(e2(n2.calendar), t2);
}
function vt(e2, n2, t2, o2, r2) {
  const i2 = e2(r2.timeZone), a2 = r2.plainTime, s2 = void 0 !== a2 ? n2(a2) : Dt;
  return Yn(we(t2(i2), {
    ...o2,
    ...s2
  }), i2, o2.calendar);
}
function wt(e2, n2 = Dt) {
  return ee(checkIsoDateTimeInBounds({
    ...e2,
    ...n2
  }));
}
function jt(e2, n2, t2) {
  return convertToPlainYearMonth(e2(n2.calendar), t2);
}
function Mt(e2, n2, t2) {
  return convertToPlainMonthDay(e2(n2.calendar), t2);
}
function _e(e2, n2, t2, o2) {
  return ((e3, n3, t3) => convertToIso(e3, n3, di, de(t3), li))(e2(n2.calendar), t2, o2);
}
function R(e2, n2, t2, o2) {
  return ((e3, n3, t3) => convertToIso(e3, n3, pi, de(t3), si))(e2(n2.calendar), t2, o2);
}
function Je(e2, n2, t2, o2, r2) {
  const i2 = de(r2), a2 = n2(i2.plainDate), s2 = e2(i2.timeZone);
  return Yn(we(t2(s2), {
    ...a2,
    ...o2
  }), s2, a2.calendar);
}
function Le(e2, n2) {
  return ee(checkIsoDateTimeInBounds({
    ...e2,
    ...n2
  }));
}
function De(e2) {
  return _(checkEpochNanoInBounds(he(e2, _r)));
}
function Pe(e2) {
  return _(checkEpochNanoInBounds(he(e2, be)));
}
function Ce(e2) {
  return _(checkEpochNanoInBounds(bigIntToBigNano(toBigInt(e2), Vr)));
}
function ge(e2) {
  return _(checkEpochNanoInBounds(bigIntToBigNano(toBigInt(e2))));
}
function pn(e2, n2, t2 = Dt) {
  const o2 = n2.timeZone, r2 = e2(o2), i2 = {
    ...fn(n2, r2),
    ...t2
  };
  return Yn(getMatchingInstantFor(r2, i2, i2.offsetNanoseconds, 2), o2, n2.calendar);
}
function Tn(e2, n2, t2) {
  const o2 = n2.timeZone, r2 = e2(o2), i2 = {
    ...fn(n2, r2),
    ...t2
  }, a2 = getPreferredCalendarSlot(n2.calendar, t2.calendar);
  return Yn(getMatchingInstantFor(r2, i2, i2.offsetNanoseconds, 2), o2, a2);
}
function lt(e2, n2 = Dt) {
  return ee({
    ...e2,
    ...n2
  });
}
function st(e2, n2) {
  return ee({
    ...e2,
    ...n2
  }, getPreferredCalendarSlot(e2.calendar, n2.calendar));
}
function it(e2, n2) {
  return {
    ...e2,
    calendar: n2
  };
}
function On(e2, n2) {
  return {
    ...e2,
    timeZone: n2
  };
}
function getPreferredCalendarSlot(e2, n2) {
  if (e2 === n2) {
    return e2;
  }
  const t2 = I(e2), o2 = I(n2);
  if (t2 === o2 || t2 === X) {
    return n2;
  }
  if (o2 === X) {
    return e2;
  }
  throw new RangeError(Er);
}
function createNativeOpsCreator(e2, n2) {
  return (t2) => t2 === X ? e2 : t2 === gi || t2 === Ti ? Object.assign(Object.create(e2), {
    id: t2
  }) : Object.assign(Object.create(n2), Aa(t2));
}
function createOptionsTransformer(e2, n2, t2) {
  const o2 = new Set(t2);
  return (r2) => (((e3, n3) => {
    for (const t3 of n3) {
      if (t3 in e3) {
        return 1;
      }
    }
    return 0;
  })(r2 = V(o2, r2), e2) || Object.assign(r2, n2), t2 && (r2.timeZone = Ta, ["full", "long"].includes(r2.timeStyle) && (r2.timeStyle = "medium")), r2);
}
function e(e2, n2 = qn) {
  const [t2, , , o2] = e2;
  return (r2, i2 = Ns, ...a2) => {
    const s2 = n2(o2 && o2(...a2), r2, i2, t2), c2 = s2.resolvedOptions();
    return [s2, ...toEpochMillis(e2, c2, a2)];
  };
}
function qn(e2, n2, t2, o2) {
  if (t2 = o2(t2), e2) {
    if (void 0 !== t2.timeZone) {
      throw new TypeError(Lr);
    }
    t2.timeZone = e2;
  }
  return new En(n2, t2);
}
function toEpochMillis(e2, n2, t2) {
  const [, o2, r2] = e2;
  return t2.map((e3) => (e3.calendar && ((e4, n3, t3) => {
    if ((t3 || e4 !== X) && e4 !== n3) {
      throw new RangeError(Er);
    }
  })(I(e3.calendar), n2.calendar, r2), o2(e3, n2)));
}
function An(e2) {
  const n2 = Bn();
  return Ie(n2, e2.getOffsetNanosecondsFor(n2));
}
function Bn() {
  return he(Date.now(), be);
}
function Nn() {
  return ys || (ys = new En().resolvedOptions().timeZone);
}
var expectedInteger = (e2, n2) => `Non-integer ${e2}: ${n2}`;
var expectedPositive = (e2, n2) => `Non-positive ${e2}: ${n2}`;
var expectedFinite = (e2, n2) => `Non-finite ${e2}: ${n2}`;
var forbiddenBigIntToNumber = (e2) => `Cannot convert bigint to ${e2}`;
var invalidBigInt = (e2) => `Invalid bigint: ${e2}`;
var pr = "Cannot convert Symbol to string";
var hr = "Invalid object";
var numberOutOfRange = (e2, n2, t2, o2, r2) => r2 ? numberOutOfRange(e2, r2[n2], r2[t2], r2[o2]) : invalidEntity(e2, n2) + `; must be between ${t2}-${o2}`;
var invalidEntity = (e2, n2) => `Invalid ${e2}: ${n2}`;
var missingField = (e2) => `Missing ${e2}`;
var tn = (e2) => `Invalid field ${e2}`;
var duplicateFields = (e2) => `Duplicate field ${e2}`;
var noValidFields = (e2) => "No valid fields: " + e2.join();
var Z = "Invalid bag";
var invalidChoice = (e2, n2, t2) => invalidEntity(e2, n2) + "; must be " + Object.keys(t2).join();
var A = "Cannot use valueOf";
var P = "Invalid calling context";
var gr = "Forbidden era/eraYear";
var Dr = "Mismatching era/eraYear";
var Ir = "Mismatching year/eraYear";
var invalidEra = (e2) => `Invalid era: ${e2}`;
var missingYear = (e2) => "Missing year" + (e2 ? "/era/eraYear" : "");
var invalidMonthCode = (e2) => `Invalid monthCode: ${e2}`;
var Mr = "Mismatching month/monthCode";
var Nr = "Missing month/monthCode";
var yr = "Cannot guess year";
var Pr = "Invalid leap month";
var g = "Invalid protocol";
var vr = "Invalid protocol results";
var Er = "Mismatching Calendars";
var invalidCalendar = (e2) => `Invalid Calendar: ${e2}`;
var Fr = "Mismatching TimeZones";
var br = "Forbidden ICU TimeZone";
var wr = "Out-of-bounds offset";
var Br = "Out-of-bounds TimeZone gap";
var kr = "Invalid TimeZone offset";
var Yr = "Ambiguous offset";
var Cr = "Out-of-bounds date";
var Zr = "Out-of-bounds duration";
var Rr = "Cannot mix duration signs";
var zr = "Missing relativeTo";
var qr = "Cannot use large units";
var Ur = "Required smallestUnit or largestUnit";
var Ar = "smallestUnit > largestUnit";
var failedParse = (e2) => `Cannot parse: ${e2}`;
var invalidSubstring = (e2) => `Invalid substring: ${e2}`;
var Ln = (e2) => `Cannot format ${e2}`;
var kn = "Mismatching types for formatting";
var Lr = "Cannot specify TimeZone";
var Wr = /* @__PURE__ */ E(b, (e2, n2) => n2);
var jr = /* @__PURE__ */ E(b, (e2, n2, t2) => t2);
var xr = /* @__PURE__ */ E(padNumber, 2);
var $r = {
  nanosecond: 0,
  microsecond: 1,
  millisecond: 2,
  second: 3,
  minute: 4,
  hour: 5,
  day: 6,
  week: 7,
  month: 8,
  year: 9
};
var Et = /* @__PURE__ */ Object.keys($r);
var Gr = 864e5;
var Hr = 1e3;
var Vr = 1e3;
var be = 1e6;
var _r = 1e9;
var Jr = 6e10;
var Kr = 36e11;
var Qr = 864e11;
var Xr = [1, Vr, be, _r, Jr, Kr, Qr];
var w = /* @__PURE__ */ Et.slice(0, 6);
var ei = /* @__PURE__ */ sortStrings(w);
var ni = ["offset"];
var ti = ["timeZone"];
var oi = /* @__PURE__ */ w.concat(ni);
var ri = /* @__PURE__ */ oi.concat(ti);
var ii = ["era", "eraYear"];
var ai = /* @__PURE__ */ ii.concat(["year"]);
var si = ["year"];
var ci = ["monthCode"];
var ui = /* @__PURE__ */ ["month"].concat(ci);
var li = ["day"];
var fi = /* @__PURE__ */ ui.concat(si);
var di = /* @__PURE__ */ ci.concat(si);
var en = /* @__PURE__ */ li.concat(fi);
var mi = /* @__PURE__ */ li.concat(ui);
var pi = /* @__PURE__ */ li.concat(ci);
var hi = /* @__PURE__ */ jr(w, 0);
var X = "iso8601";
var gi = "gregory";
var Ti = "japanese";
var Di = {
  [gi]: {
    bce: -1,
    ce: 0
  },
  [Ti]: {
    bce: -1,
    ce: 0,
    meiji: 1867,
    taisho: 1911,
    showa: 1925,
    heisei: 1988,
    reiwa: 2018
  },
  ethioaa: {
    era0: 0
  },
  ethiopic: {
    era0: 0,
    era1: 5500
  },
  coptic: {
    era0: -1,
    era1: 0
  },
  roc: {
    beforeroc: -1,
    minguo: 0
  },
  buddhist: {
    be: 0
  },
  islamic: {
    ah: 0
  },
  indian: {
    saka: 0
  },
  persian: {
    ap: 0
  }
};
var Ii = {
  chinese: 13,
  dangi: 13,
  hebrew: -6
};
var m = /* @__PURE__ */ E(requireType, "string");
var f = /* @__PURE__ */ E(requireType, "boolean");
var Mi = /* @__PURE__ */ E(requireType, "number");
var $ = /* @__PURE__ */ E(requireType, "function");
var F = /* @__PURE__ */ Et.map((e2) => e2 + "s");
var Ni = /* @__PURE__ */ sortStrings(F);
var yi = /* @__PURE__ */ F.slice(0, 6);
var Pi = /* @__PURE__ */ F.slice(6);
var vi = /* @__PURE__ */ Pi.slice(1);
var Ei = /* @__PURE__ */ Wr(F);
var Si = /* @__PURE__ */ jr(F, 0);
var Fi = /* @__PURE__ */ jr(yi, 0);
var bi = /* @__PURE__ */ E(zeroOutProps, F);
var j = ["isoNanosecond", "isoMicrosecond", "isoMillisecond", "isoSecond", "isoMinute", "isoHour"];
var Oi = ["isoDay", "isoMonth", "isoYear"];
var wi = /* @__PURE__ */ j.concat(Oi);
var Bi = /* @__PURE__ */ sortStrings(Oi);
var ki = /* @__PURE__ */ sortStrings(j);
var Yi = /* @__PURE__ */ sortStrings(wi);
var Dt = /* @__PURE__ */ jr(ki, 0);
var Ci = /* @__PURE__ */ E(zeroOutProps, wi);
var En = Intl.DateTimeFormat;
var Zi = "en-GB";
var Ri = 1e8;
var zi = Ri * Gr;
var qi = [Ri, 0];
var Ui = [-Ri, 0];
var Ai = 275760;
var Li = -271821;
var Wi = 1970;
var ji = 1972;
var xi = 12;
var $i = /* @__PURE__ */ isoArgsToEpochMilli(1868, 9, 8);
var Gi = /* @__PURE__ */ Jn(computeJapaneseEraParts, WeakMap);
var Hi = "smallestUnit";
var Vi = "unit";
var _i = "roundingIncrement";
var Ji = "fractionalSecondDigits";
var Ki = "relativeTo";
var Qi = {
  constrain: 0,
  reject: 1
};
var Xi = /* @__PURE__ */ Object.keys(Qi);
var ea = {
  compatible: 0,
  reject: 1,
  earlier: 2,
  later: 3
};
var na = {
  reject: 0,
  use: 1,
  prefer: 2,
  ignore: 3
};
var ta = {
  auto: 0,
  never: 1,
  critical: 2,
  always: 3
};
var oa = {
  auto: 0,
  never: 1,
  critical: 2
};
var ra = {
  auto: 0,
  never: 1
};
var ia = {
  floor: 0,
  halfFloor: 1,
  ceil: 2,
  halfCeil: 3,
  trunc: 4,
  halfTrunc: 5,
  expand: 6,
  halfExpand: 7,
  halfEven: 8
};
var aa = /* @__PURE__ */ E(refineUnitOption, Hi);
var sa = /* @__PURE__ */ E(refineUnitOption, "largestUnit");
var ca = /* @__PURE__ */ E(refineUnitOption, Vi);
var ua = /* @__PURE__ */ E(refineChoiceOption, "overflow", Qi);
var la = /* @__PURE__ */ E(refineChoiceOption, "disambiguation", ea);
var fa = /* @__PURE__ */ E(refineChoiceOption, "offset", na);
var da = /* @__PURE__ */ E(refineChoiceOption, "calendarName", ta);
var ma = /* @__PURE__ */ E(refineChoiceOption, "timeZoneName", oa);
var pa = /* @__PURE__ */ E(refineChoiceOption, "offset", ra);
var ha = /* @__PURE__ */ E(refineChoiceOption, "roundingMode", ia);
var L = "PlainYearMonth";
var q = "PlainMonthDay";
var J = "PlainDate";
var We = "PlainDateTime";
var xe = "PlainTime";
var Te = "ZonedDateTime";
var Oe = "Instant";
var qt = "Duration";
var ga = [Math.floor, (e2) => hasHalf(e2) ? Math.floor(e2) : Math.round(e2), Math.ceil, (e2) => hasHalf(e2) ? Math.ceil(e2) : Math.round(e2), Math.trunc, (e2) => hasHalf(e2) ? Math.trunc(e2) || 0 : Math.round(e2), (e2) => e2 < 0 ? Math.floor(e2) : Math.ceil(e2), (e2) => Math.sign(e2) * Math.round(Math.abs(e2)) || 0, (e2) => hasHalf(e2) ? (e2 = Math.trunc(e2) || 0) + e2 % 2 : Math.round(e2)];
var Ta = "UTC";
var Da = 5184e3;
var Ia = /* @__PURE__ */ isoArgsToEpochSec(1847);
var Ma = /* @__PURE__ */ isoArgsToEpochSec(/* @__PURE__ */ (/* @__PURE__ */ new Date()).getUTCFullYear() + 10);
var Na = /0+$/;
var fn = /* @__PURE__ */ Jn(_zonedEpochSlotsToIso, WeakMap);
var ya = 2 ** 32 - 1;
var ie = /* @__PURE__ */ Jn((e2) => {
  const n2 = getTimeZoneEssence(e2);
  return "object" == typeof n2 ? new IntlTimeZone(n2) : new FixedTimeZone(n2 || 0);
});
var FixedTimeZone = class {
  constructor(e2) {
    this.v = e2;
  }
  getOffsetNanosecondsFor() {
    return this.v;
  }
  getPossibleInstantsFor(e2) {
    return [isoToEpochNanoWithOffset(e2, this.v)];
  }
  l() {
  }
};
var IntlTimeZone = class {
  constructor(e2) {
    this.$ = ((e3) => {
      function getOffsetSec(e4) {
        const i2 = clampNumber(e4, o2, r2), [a2, s2] = computePeriod(i2), c2 = n2(a2), u2 = n2(s2);
        return c2 === u2 ? c2 : pinch(t2(a2, s2), c2, u2, e4);
      }
      function pinch(n3, t3, o3, r3) {
        let i2, a2;
        for (; (void 0 === r3 || void 0 === (i2 = r3 < n3[0] ? t3 : r3 >= n3[1] ? o3 : void 0)) && (a2 = n3[1] - n3[0]); ) {
          const t4 = n3[0] + Math.floor(a2 / 2);
          e3(t4) === o3 ? n3[1] = t4 : n3[0] = t4 + 1;
        }
        return i2;
      }
      const n2 = Jn(e3), t2 = Jn(createSplitTuple);
      let o2 = Ia, r2 = Ma;
      return {
        G(e4) {
          const n3 = getOffsetSec(e4 - 86400), t3 = getOffsetSec(e4 + 86400), o3 = e4 - n3, r3 = e4 - t3;
          if (n3 === t3) {
            return [o3];
          }
          const i2 = getOffsetSec(o3);
          return i2 === getOffsetSec(r3) ? [e4 - i2] : n3 > t3 ? [o3, r3] : [];
        },
        V: getOffsetSec,
        l(e4, i2) {
          const a2 = clampNumber(e4, o2, r2);
          let [s2, c2] = computePeriod(a2);
          const u2 = Da * i2, l2 = i2 < 0 ? () => c2 > o2 || (o2 = a2, 0) : () => s2 < r2 || (r2 = a2, 0);
          for (; l2(); ) {
            const o3 = n2(s2), r3 = n2(c2);
            if (o3 !== r3) {
              const n3 = t2(s2, c2);
              pinch(n3, o3, r3);
              const a3 = n3[0];
              if ((compareNumbers(a3, e4) || 1) === i2) {
                return a3;
              }
            }
            s2 += u2, c2 += u2;
          }
        }
      };
    })(/* @__PURE__ */ ((e3) => (n2) => {
      const t2 = hashIntlFormatParts(e3, n2 * Hr);
      return isoArgsToEpochSec(parseIntlPartsYear(t2), parseInt(t2.month), parseInt(t2.day), parseInt(t2.hour), parseInt(t2.minute), parseInt(t2.second)) - n2;
    })(e2));
  }
  getOffsetNanosecondsFor(e2) {
    return this.$.V(epochNanoToSec(e2)) * _r;
  }
  getPossibleInstantsFor(e2) {
    const [n2, t2] = [isoArgsToEpochSec((o2 = e2).isoYear, o2.isoMonth, o2.isoDay, o2.isoHour, o2.isoMinute, o2.isoSecond), o2.isoMillisecond * be + o2.isoMicrosecond * Vr + o2.isoNanosecond];
    var o2;
    return this.$.G(n2).map((e3) => checkEpochNanoInBounds(moveBigNano(he(e3, _r), t2)));
  }
  l(e2, n2) {
    const [t2, o2] = epochNanoToSecMod(e2), r2 = this.$.l(t2 + (n2 > 0 || o2 ? 1 : 0), n2);
    if (void 0 !== r2) {
      return he(r2, _r);
    }
  }
};
var Pa = "([+\u2212-])";
var va = "(?:[.,](\\d{1,9}))?";
var Ea = `(?:(?:${Pa}(\\d{6}))|(\\d{4}))-?(\\d{2})`;
var Sa = "(\\d{2})(?::?(\\d{2})(?::?(\\d{2})" + va + ")?)?";
var Fa = Pa + Sa;
var ba = Ea + "-?(\\d{2})(?:[T ]" + Sa + "(Z|" + Fa + ")?)?";
var Oa = "\\[(!?)([^\\]]*)\\]";
var wa = `((?:${Oa}){0,9})`;
var Ba = /* @__PURE__ */ createRegExp(Ea + wa);
var ka = /* @__PURE__ */ createRegExp("(?:--)?(\\d{2})-?(\\d{2})" + wa);
var Ya = /* @__PURE__ */ createRegExp(ba + wa);
var Ca = /* @__PURE__ */ createRegExp("T?" + Sa + "(?:" + Fa + ")?" + wa);
var Za = /* @__PURE__ */ createRegExp(Fa);
var Ra = /* @__PURE__ */ new RegExp(Oa, "g");
var za = /* @__PURE__ */ createRegExp(`${Pa}?P(\\d+Y)?(\\d+M)?(\\d+W)?(\\d+D)?(?:T(?:(\\d+)${va}H)?(?:(\\d+)${va}M)?(?:(\\d+)${va}S)?)?`);
var qa = /* @__PURE__ */ Jn((e2) => new En(Zi, {
  timeZone: e2,
  era: "short",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric"
}));
var Ua = /^(AC|AE|AG|AR|AS|BE|BS|CA|CN|CS|CT|EA|EC|IE|IS|JS|MI|NE|NS|PL|PN|PR|PS|SS|VS)T$/;
var Aa = /* @__PURE__ */ Jn(createIntlCalendar);
var La = /* @__PURE__ */ Jn((e2) => new En(Zi, {
  calendar: e2,
  timeZone: Ta,
  era: "short",
  year: "numeric",
  month: "short",
  day: "numeric"
}));
var Wa = /^M(\d{2})(L?)$/;
var ja = {
  era: toStringViaPrimitive,
  eraYear: toInteger,
  year: toInteger,
  month: toPositiveInteger,
  monthCode: toStringViaPrimitive,
  day: toPositiveInteger
};
var xa = /* @__PURE__ */ jr(w, toInteger);
var $a = /* @__PURE__ */ jr(F, toStrictInteger);
var Ga = /* @__PURE__ */ Object.assign({}, ja, xa, $a, {
  offset: toStringViaPrimitive
});
var Ha = /* @__PURE__ */ E(remapProps, w, j);
var Va = {
  dateAdd(e2, n2, t2) {
    const o2 = H(t2);
    let r2, { years: i2, months: a2, weeks: s2, days: c2 } = n2;
    if (c2 += durationFieldsToBigNano(n2, 5)[0], i2 || a2) {
      r2 = ((e3, n3, t3, o3, r3) => {
        let [i3, a3, s3] = e3.h(n3);
        if (t3) {
          const [n4, o4] = e3.I(i3, a3);
          i3 += t3, a3 = monthCodeNumberToMonth(n4, o4, e3.U(i3)), a3 = clampEntity("month", a3, 1, e3.L(i3), r3);
        }
        return o3 && ([i3, a3] = e3._(i3, a3, o3)), s3 = clampEntity("day", s3, 1, e3.j(i3, a3), r3), e3.q(i3, a3, s3);
      })(this, e2, i2, a2, o2);
    } else {
      if (!s2 && !c2) {
        return e2;
      }
      r2 = isoToEpochMilli(e2);
    }
    return r2 += (7 * s2 + c2) * Gr, checkIsoDateInBounds(epochMilliToIso(r2));
  },
  dateUntil(e2, n2, t2) {
    if (t2 <= 7) {
      let o3 = 0, r3 = diffDays({
        ...e2,
        ...Dt
      }, {
        ...n2,
        ...Dt
      });
      return 7 === t2 && ([o3, r3] = divModTrunc(r3, 7)), {
        ...Si,
        weeks: o3,
        days: r3
      };
    }
    const o2 = this.h(e2), r2 = this.h(n2);
    let [i2, a2, s2] = ((e3, n3, t3, o3, r3, i3, a3) => {
      let s3 = r3 - n3, c2 = i3 - t3, u2 = a3 - o3;
      if (s3 || c2) {
        const l2 = Math.sign(s3 || c2);
        let f2 = e3.j(r3, i3), d2 = 0;
        if (Math.sign(u2) === -l2) {
          const o4 = f2;
          [r3, i3] = e3._(r3, i3, -l2), s3 = r3 - n3, c2 = i3 - t3, f2 = e3.j(r3, i3), d2 = l2 < 0 ? -o4 : f2;
        }
        if (u2 = a3 - Math.min(o3, f2) + d2, s3) {
          const [o4, a4] = e3.I(n3, t3), [u3, f3] = e3.I(r3, i3);
          if (c2 = u3 - o4 || Number(f3) - Number(a4), Math.sign(c2) === -l2) {
            const t4 = l2 < 0 && -e3.L(r3);
            s3 = (r3 -= l2) - n3, c2 = i3 - monthCodeNumberToMonth(o4, a4, e3.U(r3)) + (t4 || e3.L(r3));
          }
        }
      }
      return [s3, c2, u2];
    })(this, ...o2, ...r2);
    return 8 === t2 && (a2 += this.J(i2, o2[0]), i2 = 0), {
      ...Si,
      years: i2,
      months: a2,
      days: s2
    };
  },
  dateFromFields(e2, n2) {
    const t2 = H(n2), o2 = refineYear(this, e2), r2 = refineMonth(this, e2, o2, t2), i2 = refineDay(this, e2, r2, o2, t2);
    return v(checkIsoDateInBounds(this.P(o2, r2, i2)), this.id || X);
  },
  yearMonthFromFields(e2, n2) {
    const t2 = H(n2), o2 = refineYear(this, e2), r2 = refineMonth(this, e2, o2, t2);
    return createPlainYearMonthSlots(checkIsoYearMonthInBounds(this.P(o2, r2, 1)), this.id || X);
  },
  monthDayFromFields(e2, n2) {
    const t2 = H(n2), o2 = !this.id, { monthCode: r2, year: i2, month: a2 } = e2;
    let s2, c2, u2, l2, f2;
    if (void 0 !== r2) {
      [s2, c2] = parseMonthCode(r2), f2 = getDefinedProp(e2, "day");
      const n3 = this.N(s2, c2, f2);
      if (!n3) {
        throw new RangeError(yr);
      }
      if ([u2, l2] = n3, void 0 !== a2 && a2 !== l2) {
        throw new RangeError(Mr);
      }
      o2 && (l2 = clampEntity("month", l2, 1, xi, 1), f2 = clampEntity("day", f2, 1, computeIsoDaysInMonth(void 0 !== i2 ? i2 : u2, l2), t2));
    } else {
      u2 = void 0 === i2 && o2 ? ji : refineYear(this, e2), l2 = refineMonth(this, e2, u2, t2), f2 = refineDay(this, e2, l2, u2, t2);
      const n3 = this.U(u2);
      c2 = l2 === n3, s2 = monthToMonthCodeNumber(l2, n3);
      const r3 = this.N(s2, c2, f2);
      if (!r3) {
        throw new RangeError(yr);
      }
      [u2, l2] = r3;
    }
    return createPlainMonthDaySlots(checkIsoDateInBounds(this.P(u2, l2, f2)), this.id || X);
  },
  fields(e2) {
    return getCalendarEraOrigins(this) && e2.includes("year") ? [...e2, ...ii] : e2;
  },
  mergeFields(e2, n2) {
    const t2 = Object.assign(/* @__PURE__ */ Object.create(null), e2);
    return spliceFields(t2, n2, ui), getCalendarEraOrigins(this) && (spliceFields(t2, n2, ai), this.id === Ti && spliceFields(t2, n2, mi, ii)), t2;
  },
  inLeapYear(e2) {
    const [n2] = this.h(e2);
    return this.K(n2);
  },
  monthsInYear(e2) {
    const [n2] = this.h(e2);
    return this.L(n2);
  },
  daysInMonth(e2) {
    const [n2, t2] = this.h(e2);
    return this.j(n2, t2);
  },
  daysInYear(e2) {
    const [n2] = this.h(e2);
    return this.X(n2);
  },
  dayOfYear: computeNativeDayOfYear,
  era(e2) {
    return this.ee(e2)[0];
  },
  eraYear(e2) {
    return this.ee(e2)[1];
  },
  monthCode(e2) {
    const [n2, t2] = this.h(e2), [o2, r2] = this.I(n2, t2);
    return ((e3, n3) => "M" + xr(e3) + (n3 ? "L" : ""))(o2, r2);
  },
  dayOfWeek: computeIsoDayOfWeek,
  daysInWeek() {
    return 7;
  }
};
var _a = {
  dayOfYear: computeNativeDayOfYear,
  h: computeIsoDateParts,
  q: isoArgsToEpochMilli
};
var Ja = /* @__PURE__ */ Object.assign({}, _a, {
  weekOfYear: computeNativeWeekOfYear,
  yearOfWeek: computeNativeYearOfWeek,
  R(e2) {
    function computeWeekShift(e3) {
      return (7 - e3 < n2 ? 7 : 0) - e3;
    }
    function computeWeeksInYear(e3) {
      const n3 = computeIsoDaysInYear(l2 + e3), t3 = e3 || 1, o3 = computeWeekShift(modFloor(a2 + n3 * t3, 7));
      return c2 = (n3 + (o3 - s2) * t3) / 7;
    }
    const n2 = this.id ? 1 : 4, t2 = computeIsoDayOfWeek(e2), o2 = this.dayOfYear(e2), r2 = modFloor(t2 - 1, 7), i2 = o2 - 1, a2 = modFloor(r2 - i2, 7), s2 = computeWeekShift(a2);
    let c2, u2 = Math.floor((i2 - s2) / 7) + 1, l2 = e2.isoYear;
    return u2 ? u2 > computeWeeksInYear(0) && (u2 = 1, l2++) : (u2 = computeWeeksInYear(-1), l2--), [u2, l2, c2];
  }
});
var Ka = {
  dayOfYear: computeNativeDayOfYear,
  h: computeIntlDateParts,
  q: computeIntlEpochMilli,
  weekOfYear: computeNativeWeekOfYear,
  yearOfWeek: computeNativeYearOfWeek,
  R() {
    return [];
  }
};
var Y = /* @__PURE__ */ createNativeOpsCreator(/* @__PURE__ */ Object.assign({}, Va, Ja, {
  h: computeIsoDateParts,
  ee(e2) {
    return this.id === gi ? computeGregoryEraParts(e2) : this.id === Ti ? Gi(e2) : [];
  },
  I: (e2, n2) => [n2, 0],
  N(e2, n2) {
    if (!n2) {
      return [ji, e2];
    }
  },
  K: computeIsoInLeapYear,
  U() {
  },
  L: computeIsoMonthsInYear,
  J: (e2) => e2 * xi,
  j: computeIsoDaysInMonth,
  X: computeIsoDaysInYear,
  P: (e2, n2, t2) => ({
    isoYear: e2,
    isoMonth: n2,
    isoDay: t2
  }),
  q: isoArgsToEpochMilli,
  _: (e2, n2, t2) => (e2 += divTrunc(t2, xi), (n2 += modTrunc(t2, xi)) < 1 ? (e2--, n2 += xi) : n2 > xi && (e2++, n2 -= xi), [e2, n2]),
  year(e2) {
    return e2.isoYear;
  },
  month(e2) {
    return e2.isoMonth;
  },
  day: (e2) => e2.isoDay
}), /* @__PURE__ */ Object.assign({}, Va, Ka, {
  h: computeIntlDateParts,
  ee(e2) {
    const n2 = this.O(e2);
    return [n2.era, n2.eraYear];
  },
  I(e2, n2) {
    const t2 = computeIntlLeapMonth.call(this, e2);
    return [monthToMonthCodeNumber(n2, t2), t2 === n2];
  },
  N(e2, n2, t2) {
    let [o2, r2, i2] = computeIntlDateParts.call(this, {
      isoYear: ji,
      isoMonth: xi,
      isoDay: 31
    });
    const a2 = computeIntlLeapMonth.call(this, o2), s2 = r2 === a2;
    1 === (compareNumbers(e2, monthToMonthCodeNumber(r2, a2)) || compareNumbers(Number(n2), Number(s2)) || compareNumbers(t2, i2)) && o2--;
    for (let r3 = 0; r3 < 100; r3++) {
      const i3 = o2 - r3, a3 = computeIntlLeapMonth.call(this, i3), s3 = monthCodeNumberToMonth(e2, n2, a3);
      if (n2 === (s3 === a3) && t2 <= computeIntlDaysInMonth.call(this, i3, s3)) {
        return [i3, s3];
      }
    }
  },
  K(e2) {
    const n2 = computeIntlDaysInYear.call(this, e2);
    return n2 > computeIntlDaysInYear.call(this, e2 - 1) && n2 > computeIntlDaysInYear.call(this, e2 + 1);
  },
  U: computeIntlLeapMonth,
  L: computeIntlMonthsInYear,
  J(e2, n2) {
    const t2 = n2 + e2, o2 = Math.sign(e2), r2 = o2 < 0 ? -1 : 0;
    let i2 = 0;
    for (let e3 = n2; e3 !== t2; e3 += o2) {
      i2 += computeIntlMonthsInYear.call(this, e3 + r2);
    }
    return i2;
  },
  j: computeIntlDaysInMonth,
  X: computeIntlDaysInYear,
  P(e2, n2, t2) {
    return epochMilliToIso(computeIntlEpochMilli.call(this, e2, n2, t2));
  },
  q: computeIntlEpochMilli,
  _(e2, n2, t2) {
    if (t2) {
      if (n2 += t2, !Number.isSafeInteger(n2)) {
        throw new RangeError(Cr);
      }
      if (t2 < 0) {
        for (; n2 < 1; ) {
          n2 += computeIntlMonthsInYear.call(this, --e2);
        }
      } else {
        let t3;
        for (; n2 > (t3 = computeIntlMonthsInYear.call(this, e2)); ) {
          n2 -= t3, e2++;
        }
      }
    }
    return [e2, n2];
  },
  year(e2) {
    return this.O(e2).year;
  },
  month(e2) {
    const { year: n2, F: t2 } = this.O(e2), { C: o2 } = this.B(n2);
    return o2[t2] + 1;
  },
  day(e2) {
    return this.O(e2).day;
  }
}));
var Qa = "numeric";
var Xa = ["timeZoneName"];
var es = {
  month: Qa,
  day: Qa
};
var ns = {
  year: Qa,
  month: Qa
};
var ts = /* @__PURE__ */ Object.assign({}, ns, {
  day: Qa
});
var os = {
  hour: Qa,
  minute: Qa,
  second: Qa
};
var rs = /* @__PURE__ */ Object.assign({}, ts, os);
var is = /* @__PURE__ */ Object.assign({}, rs, {
  timeZoneName: "short"
});
var as = /* @__PURE__ */ Object.keys(ns);
var ss = /* @__PURE__ */ Object.keys(es);
var cs = /* @__PURE__ */ Object.keys(ts);
var us = /* @__PURE__ */ Object.keys(os);
var ls = ["dateStyle"];
var fs = /* @__PURE__ */ as.concat(ls);
var ds = /* @__PURE__ */ ss.concat(ls);
var ms = /* @__PURE__ */ cs.concat(ls, ["weekday"]);
var ps = /* @__PURE__ */ us.concat(["dayPeriod", "timeStyle"]);
var hs = /* @__PURE__ */ ms.concat(ps);
var gs = /* @__PURE__ */ hs.concat(Xa);
var Ts = /* @__PURE__ */ Xa.concat(ps);
var Ds = /* @__PURE__ */ Xa.concat(ms);
var Is = /* @__PURE__ */ Xa.concat(["day", "weekday"], ps);
var Ms = /* @__PURE__ */ Xa.concat(["year", "weekday"], ps);
var Ns = {};
var t = [/* @__PURE__ */ createOptionsTransformer(hs, rs), y];
var s = [/* @__PURE__ */ createOptionsTransformer(gs, is), y, 0, (e2, n2) => {
  const t2 = I(e2.timeZone);
  if (n2 && I(n2.timeZone) !== t2) {
    throw new RangeError(Fr);
  }
  return t2;
}];
var n = [/* @__PURE__ */ createOptionsTransformer(hs, rs, Xa), isoToEpochMilli];
var o = [/* @__PURE__ */ createOptionsTransformer(ms, ts, Ts), isoToEpochMilli];
var r = [/* @__PURE__ */ createOptionsTransformer(ps, os, Ds), (e2) => isoTimeFieldsToNano(e2) / be];
var a = [/* @__PURE__ */ createOptionsTransformer(fs, ns, Is), isoToEpochMilli, 1];
var i = [/* @__PURE__ */ createOptionsTransformer(ds, es, Ms), isoToEpochMilli, 1];
var ys;

// ../home/ubuntu/.cache/deno/deno_esbuild/temporal-polyfill@0.2.5/node_modules/temporal-polyfill/chunks/classApi.js
function createSlotClass(e2, t2, n2, o2, r2) {
  function Class(...e3) {
    if (!(this instanceof Class)) {
      throw new TypeError(P);
    }
    oo(this, t2(...e3));
  }
  function bindMethod(e3, t3) {
    return Object.defineProperties(function(...t4) {
      return e3.call(this, getSpecificSlots(this), ...t4);
    }, D(t3));
  }
  function getSpecificSlots(t3) {
    const n3 = no(t3);
    if (!n3 || n3.branding !== e2) {
      throw new TypeError(P);
    }
    return n3;
  }
  return Object.defineProperties(Class.prototype, {
    ...O(T(bindMethod, n2)),
    ...p(T(bindMethod, o2)),
    ...h("Temporal." + e2)
  }), Object.defineProperties(Class, {
    ...p(r2),
    ...D(e2)
  }), [Class, (e3) => {
    const t3 = Object.create(Class.prototype);
    return oo(t3, e3), t3;
  }, getSpecificSlots];
}
function createProtocolValidator(e2) {
  return e2 = e2.concat("id").sort(), (t2) => {
    if (!C(t2, e2)) {
      throw new TypeError(g);
    }
    return t2;
  };
}
function rejectInvalidBag(e2) {
  if (no(e2) || void 0 !== e2.calendar || void 0 !== e2.timeZone) {
    throw new TypeError(Z);
  }
  return e2;
}
function createCalendarFieldMethods(e2, t2) {
  const n2 = {};
  for (const o2 in e2) {
    n2[o2] = ({ o: e3 }, n3) => {
      const r2 = no(n3) || {}, { branding: a2 } = r2, i2 = a2 === J || t2.includes(a2) ? r2 : toPlainDateSlots(n3);
      return e3[o2](i2);
    };
  }
  return n2;
}
function createCalendarGetters(e2) {
  const t2 = {};
  for (const n2 in e2) {
    t2[n2] = (e3) => {
      const { calendar: t3 } = e3;
      return (o2 = t3, "string" == typeof o2 ? Y(o2) : (r2 = o2, Object.assign(Object.create(co), {
        i: r2
      })))[n2](e3);
      var o2, r2;
    };
  }
  return t2;
}
function neverValueOf() {
  throw new TypeError(A);
}
function createCalendarFromSlots({ calendar: e2 }) {
  return "string" == typeof e2 ? new lr(e2) : e2;
}
function toPlainMonthDaySlots(e2, t2) {
  if (t2 = U(t2), z(e2)) {
    const n3 = no(e2);
    if (n3 && n3.branding === q) {
      return H(t2), n3;
    }
    const o2 = extractCalendarSlotFromBag(e2);
    return K(Qo(o2 || X), !o2, e2, t2);
  }
  const n2 = Q(Y, e2);
  return H(t2), n2;
}
function getOffsetNanosecondsForAdapter(e2, t2, n2) {
  return o2 = t2.call(e2, Co(_(n2))), ae(u(o2));
  var o2;
}
function createAdapterOps(e2, t2 = ho) {
  const n2 = Object.keys(t2).sort(), o2 = {};
  for (const r2 of n2) {
    o2[r2] = E(t2[r2], e2, $(e2[r2]));
  }
  return o2;
}
function createTimeZoneOps(e2, t2) {
  return "string" == typeof e2 ? ie(e2) : createAdapterOps(e2, t2);
}
function createTimeZoneOffsetOps(e2) {
  return createTimeZoneOps(e2, Do);
}
function toInstantSlots(e2) {
  if (z(e2)) {
    const t2 = no(e2);
    if (t2) {
      switch (t2.branding) {
        case Oe:
          return t2;
        case Te:
          return _(t2.epochNanoseconds);
      }
    }
  }
  return pe(e2);
}
function getImplTransition(e2, t2, n2) {
  const o2 = t2.l(toInstantSlots(n2).epochNanoseconds, e2);
  return o2 ? Co(_(o2)) : null;
}
function refineTimeZoneSlot(e2) {
  return z(e2) ? (no(e2) || {}).timeZone || Fo(e2) : ((e3) => ye(Ne(m(e3))))(e2);
}
function toPlainTimeSlots(e2, t2) {
  if (z(e2)) {
    const n2 = no(e2) || {};
    switch (n2.branding) {
      case xe:
        return H(t2), n2;
      case We:
        return H(t2), Ge(n2);
      case Te:
        return H(t2), Re(createTimeZoneOffsetOps, n2);
    }
    return Ue(e2, t2);
  }
  return H(t2), ze(e2);
}
function optionalToPlainTimeFields(e2) {
  return void 0 === e2 ? void 0 : toPlainTimeSlots(e2);
}
function toPlainYearMonthSlots(e2, t2) {
  if (t2 = U(t2), z(e2)) {
    const n3 = no(e2);
    return n3 && n3.branding === L ? (H(t2), n3) : nt(Ho(getCalendarSlotFromBag(e2)), e2, t2);
  }
  const n2 = ot(Y, e2);
  return H(t2), n2;
}
function toPlainDateTimeSlots(e2, t2) {
  if (t2 = U(t2), z(e2)) {
    const n3 = no(e2) || {};
    switch (n3.branding) {
      case We:
        return H(t2), n3;
      case J:
        return H(t2), ee({
          ...n3,
          ...Dt
        });
      case Te:
        return H(t2), ht(createTimeZoneOffsetOps, n3);
    }
    return Pt(Ko(getCalendarSlotFromBag(e2)), e2, t2);
  }
  const n2 = Ct(e2);
  return H(t2), n2;
}
function toPlainDateSlots(e2, t2) {
  if (t2 = U(t2), z(e2)) {
    const n3 = no(e2) || {};
    switch (n3.branding) {
      case J:
        return H(t2), n3;
      case We:
        return H(t2), v(n3);
      case Te:
        return H(t2), Bt(createTimeZoneOffsetOps, n3);
    }
    return Yt(Ko(getCalendarSlotFromBag(e2)), e2, t2);
  }
  const n2 = At(e2);
  return H(t2), n2;
}
function dayAdapter(e2, t2, n2) {
  return d(t2.call(e2, Yo(v(n2, e2))));
}
function createCompoundOpsCreator(e2) {
  return (t2) => "string" == typeof t2 ? Y(t2) : ((e3, t3) => {
    const n2 = Object.keys(t3).sort(), o2 = {};
    for (const r2 of n2) {
      o2[r2] = E(t3[r2], e3, e3[r2]);
    }
    return o2;
  })(t2, e2);
}
function toDurationSlots(e2) {
  if (z(e2)) {
    const t2 = no(e2);
    return t2 && t2.branding === qt ? t2 : Ht(e2);
  }
  return Kt(e2);
}
function refinePublicRelativeTo(e2) {
  if (void 0 !== e2) {
    if (z(e2)) {
      const t2 = no(e2) || {};
      switch (t2.branding) {
        case Te:
        case J:
          return t2;
        case We:
          return v(t2);
      }
      const n2 = getCalendarSlotFromBag(e2);
      return {
        ...Qt(refineTimeZoneSlot, createTimeZoneOps, Ko(n2), e2),
        calendar: n2
      };
    }
    return Xt(e2);
  }
}
function getCalendarSlotFromBag(e2) {
  return extractCalendarSlotFromBag(e2) || X;
}
function extractCalendarSlotFromBag(e2) {
  const { calendar: t2 } = e2;
  if (void 0 !== t2) {
    return refineCalendarSlot(t2);
  }
}
function refineCalendarSlot(e2) {
  return z(e2) ? (no(e2) || {}).calendar || cr(e2) : ((e3) => an(sn(m(e3))))(e2);
}
function toZonedDateTimeSlots(e2, t2) {
  if (t2 = U(t2), z(e2)) {
    const n2 = no(e2);
    if (n2 && n2.branding === Te) {
      return wn(t2), n2;
    }
    const o2 = getCalendarSlotFromBag(e2);
    return jn(refineTimeZoneSlot, createTimeZoneOps, Ko(o2), o2, e2, t2);
  }
  return Mn(e2, t2);
}
function adaptDateMethods(e2) {
  return T((e3) => (t2) => e3(slotsToIso(t2)), e2);
}
function slotsToIso(e2) {
  return fn(e2, createTimeZoneOffsetOps);
}
function createDateTimeFormatClass() {
  const e2 = En.prototype, t2 = Object.getOwnPropertyDescriptors(e2), n2 = Object.getOwnPropertyDescriptors(En), DateTimeFormat = function(e3, t3 = {}) {
    if (!(this instanceof DateTimeFormat)) {
      return new DateTimeFormat(e3, t3);
    }
    Or.set(this, ((e4, t4 = {}) => {
      const n3 = new En(e4, t4), o2 = n3.resolvedOptions(), r2 = o2.locale, a2 = Vn(Object.keys(t4), o2), i2 = Jn(createFormatPrepperForBranding), prepFormat = (...e5) => {
        let t5;
        const o3 = e5.map((e6, n4) => {
          const o4 = no(e6), r3 = (o4 || {}).branding;
          if (n4 && t5 && t5 !== r3) {
            throw new TypeError(kn);
          }
          return t5 = r3, o4;
        });
        return t5 ? i2(t5)(r2, a2, ...o3) : [n3, ...e5];
      };
      return prepFormat.u = n3, prepFormat;
    })(e3, t3));
  };
  for (const e3 in t2) {
    const n3 = t2[e3], o2 = e3.startsWith("format") && createFormatMethod(e3);
    "function" == typeof n3.value ? n3.value = "constructor" === e3 ? DateTimeFormat : o2 || createProxiedMethod(e3) : o2 && (n3.get = function() {
      return o2.bind(this);
    });
  }
  return n2.prototype.value = Object.create(e2, t2), Object.defineProperties(DateTimeFormat, n2), DateTimeFormat;
}
function createFormatMethod(e2) {
  return function(...t2) {
    const n2 = Or.get(this), [o2, ...r2] = n2(...t2);
    return o2[e2](...r2);
  };
}
function createProxiedMethod(e2) {
  return function(...t2) {
    return Or.get(this).u[e2](...t2);
  };
}
function createFormatPrepperForBranding(t2) {
  const n2 = xn[t2];
  if (!n2) {
    throw new TypeError(Ln(t2));
  }
  return e(n2, Jn(qn));
}
var xn = {
  Instant: t,
  PlainDateTime: n,
  PlainDate: o,
  PlainTime: r,
  PlainYearMonth: a,
  PlainMonthDay: i
};
var Rn = /* @__PURE__ */ e(t);
var Wn = /* @__PURE__ */ e(s);
var Gn = /* @__PURE__ */ e(n);
var Un = /* @__PURE__ */ e(o);
var zn = /* @__PURE__ */ e(r);
var Hn = /* @__PURE__ */ e(a);
var Kn = /* @__PURE__ */ e(i);
var Qn = {
  era: l,
  eraYear: c,
  year: u,
  month: d,
  daysInMonth: d,
  daysInYear: d,
  inLeapYear: f,
  monthsInYear: d
};
var Xn = {
  monthCode: m
};
var $n = {
  day: d
};
var _n = {
  dayOfWeek: d,
  dayOfYear: d,
  weekOfYear: S,
  yearOfWeek: c,
  daysInWeek: d
};
var eo = /* @__PURE__ */ Object.assign({}, Qn, Xn, $n, _n);
var to = /* @__PURE__ */ new WeakMap();
var no = /* @__PURE__ */ to.get.bind(to);
var oo = /* @__PURE__ */ to.set.bind(to);
var ro = {
  ...createCalendarFieldMethods(Qn, [L]),
  ...createCalendarFieldMethods(_n, []),
  ...createCalendarFieldMethods(Xn, [L, q]),
  ...createCalendarFieldMethods($n, [q])
};
var ao = /* @__PURE__ */ createCalendarGetters(eo);
var io = /* @__PURE__ */ createCalendarGetters({
  ...Qn,
  ...Xn
});
var so = /* @__PURE__ */ createCalendarGetters({
  ...Xn,
  ...$n
});
var lo = {
  calendarId: (e2) => I(e2.calendar)
};
var co = /* @__PURE__ */ T((e2, t2) => function(n2) {
  const { i: o2 } = this;
  return e2(o2[t2](Yo(v(n2, o2))));
}, eo);
var uo = /* @__PURE__ */ b((e2) => (t2) => t2[e2], F.concat("sign"));
var fo = /* @__PURE__ */ b((e2, t2) => (e3) => e3[j[t2]], w);
var mo = {
  epochSeconds: M,
  epochMilliseconds: y,
  epochMicroseconds: N,
  epochNanoseconds: B
};
var So = /* @__PURE__ */ E(V, /* @__PURE__ */ new Set(["branding"]));
var [Oo, To, po] = createSlotClass(q, E(G, refineCalendarSlot), {
  ...lo,
  ...so
}, {
  getISOFields: So,
  getCalendar: createCalendarFromSlots,
  with(e2, t2, n2) {
    return To(k(_o, e2, this, rejectInvalidBag(t2), n2));
  },
  equals: (e2, t2) => x(e2, toPlainMonthDaySlots(t2)),
  toPlainDate(e2, t2) {
    return Yo(R($o, e2, this, t2));
  },
  toLocaleString(e2, t2, n2) {
    const [o2, r2] = Kn(t2, n2, e2);
    return o2.format(r2);
  },
  toString: W,
  toJSON: (e2) => W(e2),
  valueOf: neverValueOf
}, {
  from: (e2, t2) => To(toPlainMonthDaySlots(e2, t2))
});
var ho = {
  getOffsetNanosecondsFor: getOffsetNanosecondsForAdapter,
  getPossibleInstantsFor(e2, t2, n2) {
    const o2 = [...t2.call(e2, No(ee(n2, X)))].map((e3) => go(e3).epochNanoseconds), r2 = o2.length;
    return r2 > 1 && (o2.sort(te), ne(oe(re(o2[0], o2[r2 - 1])))), o2;
  }
};
var Do = {
  getOffsetNanosecondsFor: getOffsetNanosecondsForAdapter
};
var [Po, Co, go] = createSlotClass(Oe, Se, mo, {
  add: (e2, t2) => Co(se(0, e2, toDurationSlots(t2))),
  subtract: (e2, t2) => Co(se(1, e2, toDurationSlots(t2))),
  until: (e2, t2, n2) => ar(le(0, e2, toInstantSlots(t2), n2)),
  since: (e2, t2, n2) => ar(le(1, e2, toInstantSlots(t2), n2)),
  round: (e2, t2) => Co(ce(e2, t2)),
  equals: (e2, t2) => ue(e2, toInstantSlots(t2)),
  toZonedDateTime(e2, t2) {
    const n2 = de(t2);
    return dr(fe(e2, refineTimeZoneSlot(n2.timeZone), refineCalendarSlot(n2.calendar)));
  },
  toZonedDateTimeISO: (e2, t2) => dr(fe(e2, refineTimeZoneSlot(t2))),
  toLocaleString(e2, t2, n2) {
    const [o2, r2] = Rn(t2, n2, e2);
    return o2.format(r2);
  },
  toString: (e2, t2) => me(refineTimeZoneSlot, createTimeZoneOffsetOps, e2, t2),
  toJSON: (e2) => me(refineTimeZoneSlot, createTimeZoneOffsetOps, e2),
  valueOf: neverValueOf
}, {
  from: (e2) => Co(toInstantSlots(e2)),
  fromEpochSeconds: (e2) => Co(De(e2)),
  fromEpochMilliseconds: (e2) => Co(Pe(e2)),
  fromEpochMicroseconds: (e2) => Co(Ce(e2)),
  fromEpochNanoseconds: (e2) => Co(ge(e2)),
  compare: (e2, t2) => Ze(toInstantSlots(e2), toInstantSlots(t2))
});
var [Zo, bo] = createSlotClass("TimeZone", (e2) => {
  const t2 = Me(e2);
  return {
    branding: "TimeZone",
    id: t2,
    o: ie(t2)
  };
}, {
  id: (e2) => e2.id
}, {
  getPossibleInstantsFor: ({ o: e2 }, t2) => e2.getPossibleInstantsFor(toPlainDateTimeSlots(t2)).map((e3) => Co(_(e3))),
  getOffsetNanosecondsFor: ({ o: e2 }, t2) => e2.getOffsetNanosecondsFor(toInstantSlots(t2).epochNanoseconds),
  getOffsetStringFor(e2, t2) {
    const n2 = toInstantSlots(t2).epochNanoseconds, o2 = createAdapterOps(this, Do).getOffsetNanosecondsFor(n2);
    return Fe(o2);
  },
  getPlainDateTimeFor(e2, t2, n2 = X) {
    const o2 = toInstantSlots(t2).epochNanoseconds, r2 = createAdapterOps(this, Do).getOffsetNanosecondsFor(o2);
    return No(ee(Ie(o2, r2), refineCalendarSlot(n2)));
  },
  getInstantFor(e2, t2, n2) {
    const o2 = toPlainDateTimeSlots(t2), r2 = ve(n2), a2 = createAdapterOps(this);
    return Co(_(we(a2, o2, r2)));
  },
  getNextTransition: ({ o: e2 }, t2) => getImplTransition(1, e2, t2),
  getPreviousTransition: ({ o: e2 }, t2) => getImplTransition(-1, e2, t2),
  equals(e2, t2) {
    return !!je(this, refineTimeZoneSlot(t2));
  },
  toString: (e2) => e2.id,
  toJSON: (e2) => e2.id
}, {
  from(e2) {
    const t2 = refineTimeZoneSlot(e2);
    return "string" == typeof t2 ? new Zo(t2) : t2;
  }
});
var Fo = /* @__PURE__ */ createProtocolValidator(Object.keys(ho));
var [Io, vo] = createSlotClass(xe, ke, fo, {
  getISOFields: So,
  with(e2, t2, n2) {
    return vo(Be(this, rejectInvalidBag(t2), n2));
  },
  add: (e2, t2) => vo(Ye(0, e2, toDurationSlots(t2))),
  subtract: (e2, t2) => vo(Ye(1, e2, toDurationSlots(t2))),
  until: (e2, t2, n2) => ar(Ae(0, e2, toPlainTimeSlots(t2), n2)),
  since: (e2, t2, n2) => ar(Ae(1, e2, toPlainTimeSlots(t2), n2)),
  round: (e2, t2) => vo(Ee(e2, t2)),
  equals: (e2, t2) => Ve(e2, toPlainTimeSlots(t2)),
  toZonedDateTime: (e2, t2) => dr(Je(refineTimeZoneSlot, toPlainDateSlots, createTimeZoneOps, e2, t2)),
  toPlainDateTime: (e2, t2) => No(Le(e2, toPlainDateSlots(t2))),
  toLocaleString(e2, t2, n2) {
    const [o2, r2] = zn(t2, n2, e2);
    return o2.format(r2);
  },
  toString: qe,
  toJSON: (e2) => qe(e2),
  valueOf: neverValueOf
}, {
  from: (e2, t2) => vo(toPlainTimeSlots(e2, t2)),
  compare: (e2, t2) => He(toPlainTimeSlots(e2), toPlainTimeSlots(t2))
});
var [wo, jo, Mo] = createSlotClass(L, E(tt, refineCalendarSlot), {
  ...lo,
  ...io
}, {
  getISOFields: So,
  getCalendar: createCalendarFromSlots,
  with(e2, t2, n2) {
    return jo(Ke(Xo, e2, this, rejectInvalidBag(t2), n2));
  },
  add: (e2, t2, n2) => jo(Qe(nr, 0, e2, toDurationSlots(t2), n2)),
  subtract: (e2, t2, n2) => jo(Qe(nr, 1, e2, toDurationSlots(t2), n2)),
  until: (e2, t2, n2) => ar(Xe(or, 0, e2, toPlainYearMonthSlots(t2), n2)),
  since: (e2, t2, n2) => ar(Xe(or, 1, e2, toPlainYearMonthSlots(t2), n2)),
  equals: (e2, t2) => $e(e2, toPlainYearMonthSlots(t2)),
  toPlainDate(e2, t2) {
    return Yo(_e($o, e2, this, t2));
  },
  toLocaleString(e2, t2, n2) {
    const [o2, r2] = Hn(t2, n2, e2);
    return o2.format(r2);
  },
  toString: et,
  toJSON: (e2) => et(e2),
  valueOf: neverValueOf
}, {
  from: (e2, t2) => jo(toPlainYearMonthSlots(e2, t2)),
  compare: (e2, t2) => rt(toPlainYearMonthSlots(e2), toPlainYearMonthSlots(t2))
});
var [yo, No] = createSlotClass(We, E(pt, refineCalendarSlot), {
  ...lo,
  ...ao,
  ...fo
}, {
  getISOFields: So,
  getCalendar: createCalendarFromSlots,
  with(e2, t2, n2) {
    return No(at($o, e2, this, rejectInvalidBag(t2), n2));
  },
  withCalendar: (e2, t2) => No(it(e2, refineCalendarSlot(t2))),
  withPlainDate: (e2, t2) => No(st(e2, toPlainDateSlots(t2))),
  withPlainTime: (e2, t2) => No(lt(e2, optionalToPlainTimeFields(t2))),
  add: (e2, t2, n2) => No(ct(er, 0, e2, toDurationSlots(t2), n2)),
  subtract: (e2, t2, n2) => No(ct(er, 1, e2, toDurationSlots(t2), n2)),
  until: (e2, t2, n2) => ar(ut(tr, 0, e2, toPlainDateTimeSlots(t2), n2)),
  since: (e2, t2, n2) => ar(ut(tr, 1, e2, toPlainDateTimeSlots(t2), n2)),
  round: (e2, t2) => No(dt(e2, t2)),
  equals: (e2, t2) => ft(e2, toPlainDateTimeSlots(t2)),
  toZonedDateTime: (e2, t2, n2) => dr(mt(createTimeZoneOps, e2, refineTimeZoneSlot(t2), n2)),
  toPlainDate: (e2) => Yo(v(e2)),
  toPlainTime: (e2) => vo(Ge(e2)),
  toPlainYearMonth(e2) {
    return jo(St(Ho, e2, this));
  },
  toPlainMonthDay(e2) {
    return To(Ot(Qo, e2, this));
  },
  toLocaleString(e2, t2, n2) {
    const [o2, r2] = Gn(t2, n2, e2);
    return o2.format(r2);
  },
  toString: Tt,
  toJSON: (e2) => Tt(e2),
  valueOf: neverValueOf
}, {
  from: (e2, t2) => No(toPlainDateTimeSlots(e2, t2)),
  compare: (e2, t2) => gt(toPlainDateTimeSlots(e2), toPlainDateTimeSlots(t2))
});
var [Bo, Yo, Ao] = createSlotClass(J, E(Nt, refineCalendarSlot), {
  ...lo,
  ...ao
}, {
  getISOFields: So,
  getCalendar: createCalendarFromSlots,
  with(e2, t2, n2) {
    return Yo(Zt($o, e2, this, rejectInvalidBag(t2), n2));
  },
  withCalendar: (e2, t2) => Yo(it(e2, refineCalendarSlot(t2))),
  add: (e2, t2, n2) => Yo(bt(er, 0, e2, toDurationSlots(t2), n2)),
  subtract: (e2, t2, n2) => Yo(bt(er, 1, e2, toDurationSlots(t2), n2)),
  until: (e2, t2, n2) => ar(Ft(tr, 0, e2, toPlainDateSlots(t2), n2)),
  since: (e2, t2, n2) => ar(Ft(tr, 1, e2, toPlainDateSlots(t2), n2)),
  equals: (e2, t2) => It(e2, toPlainDateSlots(t2)),
  toZonedDateTime(e2, t2) {
    const n2 = !z(t2) || t2 instanceof Zo ? {
      timeZone: t2
    } : t2;
    return dr(vt(refineTimeZoneSlot, toPlainTimeSlots, createTimeZoneOps, e2, n2));
  },
  toPlainDateTime: (e2, t2) => No(wt(e2, optionalToPlainTimeFields(t2))),
  toPlainYearMonth(e2) {
    return jo(jt(Ho, e2, this));
  },
  toPlainMonthDay(e2) {
    return To(Mt(Qo, e2, this));
  },
  toLocaleString(e2, t2, n2) {
    const [o2, r2] = Un(t2, n2, e2);
    return o2.format(r2);
  },
  toString: yt,
  toJSON: (e2) => yt(e2),
  valueOf: neverValueOf
}, {
  from: (e2, t2) => Yo(toPlainDateSlots(e2, t2)),
  compare: (e2, t2) => rt(toPlainDateSlots(e2), toPlainDateSlots(t2))
});
var Eo = {
  fields(e2, t2, n2) {
    return [...t2.call(e2, n2)];
  }
};
var Vo = /* @__PURE__ */ Object.assign({
  dateFromFields(e2, t2, n2, o2) {
    return Ao(t2.call(e2, Object.assign(/* @__PURE__ */ Object.create(null), n2), o2));
  }
}, Eo);
var Jo = /* @__PURE__ */ Object.assign({
  yearMonthFromFields(e2, t2, n2, o2) {
    return Mo(t2.call(e2, Object.assign(/* @__PURE__ */ Object.create(null), n2), o2));
  }
}, Eo);
var Lo = /* @__PURE__ */ Object.assign({
  monthDayFromFields(e2, t2, n2, o2) {
    return po(t2.call(e2, Object.assign(/* @__PURE__ */ Object.create(null), n2), o2));
  }
}, Eo);
var qo = {
  mergeFields(e2, t2, n2, o2) {
    return de(t2.call(e2, Object.assign(/* @__PURE__ */ Object.create(null), n2), Object.assign(/* @__PURE__ */ Object.create(null), o2)));
  }
};
var ko = /* @__PURE__ */ Object.assign({}, Vo, qo);
var xo = /* @__PURE__ */ Object.assign({}, Jo, qo);
var Ro = /* @__PURE__ */ Object.assign({}, Lo, qo);
var Wo = {
  dateAdd(e2, t2, n2, o2, r2) {
    return Ao(t2.call(e2, Yo(v(n2, e2)), ar(Vt(o2)), r2));
  }
};
var Go = /* @__PURE__ */ Object.assign({}, Wo, {
  dateUntil(e2, t2, n2, o2, r2, a2) {
    return ir(t2.call(e2, Yo(v(n2, e2)), Yo(v(o2, e2)), Object.assign(/* @__PURE__ */ Object.create(null), a2, {
      largestUnit: Et[r2]
    })));
  }
});
var Uo = /* @__PURE__ */ Object.assign({}, Wo, {
  day: dayAdapter
});
var zo = /* @__PURE__ */ Object.assign({}, Go, {
  day: dayAdapter
});
var Ho = /* @__PURE__ */ createCompoundOpsCreator(Jo);
var Ko = /* @__PURE__ */ createCompoundOpsCreator(Vo);
var Qo = /* @__PURE__ */ createCompoundOpsCreator(Lo);
var Xo = /* @__PURE__ */ createCompoundOpsCreator(xo);
var $o = /* @__PURE__ */ createCompoundOpsCreator(ko);
var _o = /* @__PURE__ */ createCompoundOpsCreator(Ro);
var er = /* @__PURE__ */ createCompoundOpsCreator(Wo);
var tr = /* @__PURE__ */ createCompoundOpsCreator(Go);
var nr = /* @__PURE__ */ createCompoundOpsCreator(Uo);
var or = /* @__PURE__ */ createCompoundOpsCreator(zo);
var [rr, ar, ir] = createSlotClass(qt, Lt, {
  ...uo,
  blank: Jt
}, {
  with: (e2, t2) => ar(kt(e2, t2)),
  negated: (e2) => ar(xt(e2)),
  abs: (e2) => ar(Rt(e2)),
  add: (e2, t2, n2) => ar(Wt(refinePublicRelativeTo, tr, createTimeZoneOps, 0, e2, toDurationSlots(t2), n2)),
  subtract: (e2, t2, n2) => ar(Wt(refinePublicRelativeTo, tr, createTimeZoneOps, 1, e2, toDurationSlots(t2), n2)),
  round: (e2, t2) => ar(Gt(refinePublicRelativeTo, tr, createTimeZoneOps, e2, t2)),
  total: (e2, t2) => Ut(refinePublicRelativeTo, tr, createTimeZoneOps, e2, t2),
  toLocaleString(e2, t2, n2) {
    return Intl.DurationFormat ? new Intl.DurationFormat(t2, n2).format(this) : zt(e2);
  },
  toString: zt,
  toJSON: (e2) => zt(e2),
  valueOf: neverValueOf
}, {
  from: (e2) => ar(toDurationSlots(e2)),
  compare: (e2, t2, n2) => $t(refinePublicRelativeTo, er, createTimeZoneOps, toDurationSlots(e2), toDurationSlots(t2), n2)
});
var sr = {
  toString: (e2) => e2.id,
  toJSON: (e2) => e2.id,
  ...ro,
  dateAdd: ({ id: e2, o: t2 }, n2, o2, r2) => Yo(v(t2.dateAdd(toPlainDateSlots(n2), toDurationSlots(o2), r2), e2)),
  dateUntil: ({ o: e2 }, t2, n2, o2) => ar(Vt(e2.dateUntil(toPlainDateSlots(t2), toPlainDateSlots(n2), _t(o2)))),
  dateFromFields: ({ id: e2, o: t2 }, n2, o2) => Yo(Yt(t2, n2, o2, ln(e2))),
  yearMonthFromFields: ({ id: e2, o: t2 }, n2, o2) => jo(nt(t2, n2, o2, un(e2))),
  monthDayFromFields: ({ id: e2, o: t2 }, n2, o2) => To(K(t2, 0, n2, o2, cn(e2))),
  fields({ o: e2 }, t2) {
    const n2 = new Set(en), o2 = [];
    for (const e3 of t2) {
      if (m(e3), !n2.has(e3)) {
        throw new RangeError(tn(e3));
      }
      n2.delete(e3), o2.push(e3);
    }
    return e2.fields(o2);
  },
  mergeFields: ({ o: e2 }, t2, n2) => e2.mergeFields(nn(on(t2)), nn(on(n2)))
};
var [lr] = createSlotClass("Calendar", (e2) => {
  const t2 = rn(e2);
  return {
    branding: "Calendar",
    id: t2,
    o: Y(t2)
  };
}, {
  id: (e2) => e2.id
}, sr, {
  from(e2) {
    const t2 = refineCalendarSlot(e2);
    return "string" == typeof t2 ? new lr(t2) : t2;
  }
});
var cr = /* @__PURE__ */ createProtocolValidator(Object.keys(sr).slice(4));
var [ur, dr] = createSlotClass(Te, E(vn, refineCalendarSlot, refineTimeZoneSlot), {
  ...mo,
  ...lo,
  ...adaptDateMethods(ao),
  ...adaptDateMethods(fo),
  offset: (e2) => Fe(slotsToIso(e2).offsetNanoseconds),
  offsetNanoseconds: (e2) => slotsToIso(e2).offsetNanoseconds,
  timeZoneId: (e2) => I(e2.timeZone),
  hoursInDay: (e2) => dn(createTimeZoneOps, e2)
}, {
  getISOFields: (e2) => mn(createTimeZoneOffsetOps, e2),
  getCalendar: createCalendarFromSlots,
  getTimeZone: ({ timeZone: e2 }) => "string" == typeof e2 ? new Zo(e2) : e2,
  with(e2, t2, n2) {
    return dr(Sn($o, createTimeZoneOps, e2, this, rejectInvalidBag(t2), n2));
  },
  withCalendar: (e2, t2) => dr(it(e2, refineCalendarSlot(t2))),
  withTimeZone: (e2, t2) => dr(On(e2, refineTimeZoneSlot(t2))),
  withPlainDate: (e2, t2) => dr(Tn(createTimeZoneOps, e2, toPlainDateSlots(t2))),
  withPlainTime: (e2, t2) => dr(pn(createTimeZoneOps, e2, optionalToPlainTimeFields(t2))),
  add: (e2, t2, n2) => dr(hn(er, createTimeZoneOps, 0, e2, toDurationSlots(t2), n2)),
  subtract: (e2, t2, n2) => dr(hn(er, createTimeZoneOps, 1, e2, toDurationSlots(t2), n2)),
  until: (e2, t2, n2) => ar(Vt(Dn(tr, createTimeZoneOps, 0, e2, toZonedDateTimeSlots(t2), n2))),
  since: (e2, t2, n2) => ar(Vt(Dn(tr, createTimeZoneOps, 1, e2, toZonedDateTimeSlots(t2), n2))),
  round: (e2, t2) => dr(Pn(createTimeZoneOps, e2, t2)),
  startOfDay: (e2) => dr(Cn(createTimeZoneOps, e2)),
  equals: (e2, t2) => gn(e2, toZonedDateTimeSlots(t2)),
  toInstant: (e2) => Co(Zn(e2)),
  toPlainDateTime: (e2) => No(ht(createTimeZoneOffsetOps, e2)),
  toPlainDate: (e2) => Yo(Bt(createTimeZoneOffsetOps, e2)),
  toPlainTime: (e2) => vo(Re(createTimeZoneOffsetOps, e2)),
  toPlainYearMonth(e2) {
    return jo(bn(Ho, e2, this));
  },
  toPlainMonthDay(e2) {
    return To(Fn(Qo, e2, this));
  },
  toLocaleString(e2, t2, n2 = {}) {
    const [o2, r2] = Wn(t2, n2, e2);
    return o2.format(r2);
  },
  toString: (e2, t2) => In(createTimeZoneOffsetOps, e2, t2),
  toJSON: (e2) => In(createTimeZoneOffsetOps, e2),
  valueOf: neverValueOf
}, {
  from: (e2, t2) => dr(toZonedDateTimeSlots(e2, t2)),
  compare: (e2, t2) => yn(toZonedDateTimeSlots(e2), toZonedDateTimeSlots(t2))
});
var fr = /* @__PURE__ */ Object.defineProperties({}, {
  ...h("Temporal.Now"),
  ...p({
    timeZoneId: () => Nn(),
    instant: () => Co(_(Bn())),
    zonedDateTime: (e2, t2 = Nn()) => dr(Yn(Bn(), refineTimeZoneSlot(t2), refineCalendarSlot(e2))),
    zonedDateTimeISO: (e2 = Nn()) => dr(Yn(Bn(), refineTimeZoneSlot(e2), X)),
    plainDateTime: (e2, t2 = Nn()) => No(ee(An(createTimeZoneOffsetOps(refineTimeZoneSlot(t2))), refineCalendarSlot(e2))),
    plainDateTimeISO: (e2 = Nn()) => No(ee(An(createTimeZoneOffsetOps(refineTimeZoneSlot(e2))), X)),
    plainDate: (e2, t2 = Nn()) => Yo(v(An(createTimeZoneOffsetOps(refineTimeZoneSlot(t2))), refineCalendarSlot(e2))),
    plainDateISO: (e2 = Nn()) => Yo(v(An(createTimeZoneOffsetOps(refineTimeZoneSlot(e2))), X)),
    plainTimeISO: (e2 = Nn()) => vo(Ge(An(createTimeZoneOffsetOps(refineTimeZoneSlot(e2)))))
  })
});
var mr = /* @__PURE__ */ Object.defineProperties({}, {
  ...h("Temporal"),
  ...p({
    PlainYearMonth: wo,
    PlainMonthDay: Oo,
    PlainDate: Bo,
    PlainTime: Io,
    PlainDateTime: yo,
    ZonedDateTime: ur,
    Instant: Po,
    Calendar: lr,
    TimeZone: Zo,
    Duration: rr,
    Now: fr
  })
});
var Sr = /* @__PURE__ */ createDateTimeFormatClass();
var Or = /* @__PURE__ */ new WeakMap();
var Tr = /* @__PURE__ */ Object.defineProperties(Object.create(Intl), p({
  DateTimeFormat: Sr
}));

// enhanced/openehr_base.ts
var TYPE_REGISTRY = /* @__PURE__ */ new Map();
var Any = class {
  /**
   * Reference equality for reference types, value equality for value types.
   * @param other - Parameter
   * @returns Result value
   */
  equal(other) {
    return new Boolean2(this === other);
  }
  /**
   * Create new instance of a type.
   * Uses the type registry to look up constructors by name.
   * Types must be registered using registerType() before they can be instantiated.
   * 
   * **Security Note:** This method creates instances dynamically based on type name.
   * Do not use with untrusted input as it could instantiate arbitrary registered types.
   * Only use with type names from trusted sources (e.g., parsed from validated openEHR data).
   * 
   * @param a_type - The type name as a String
   * @returns A new instance of the specified type
   * @throws Error if the type is not registered
   */
  instance_of(a_type) {
    const typeName = a_type?.value?.toUpperCase() || "";
    const constructor = TYPE_REGISTRY.get(typeName);
    if (!constructor) {
      throw new Error(`Unknown type: ${a_type?.value}. Type must be registered using registerType() first.`);
    }
    return new constructor();
  }
  /**
   * Type name of an object as a string. May include generic parameters, as in \`"Interval<Time>"\`.
   * @param an_object - Parameter
   * @returns Result value
   */
  type_of(an_object) {
    const typeName = an_object.constructor.name;
    return String2.from(typeName);
  }
  /**
   * True if current object not equal to \`_other_\`. Returns not \`_equal_()\`.
   * @param other - Parameter
   * @returns Result value
   */
  not_equal(other) {
    return new Boolean2(!this.equal(other).value);
  }
};
var Container = class extends Any {
};
var List = class _List extends Container {
  _items = [];
  /**
   * Test for membership of a value.
   */
  has(v2) {
    for (const item of this._items) {
      if (item.is_equal(v2).value === true) {
        return new Boolean2(true);
      }
    }
    return new Boolean2(false);
  }
  /**
   * Return the number of items in the list.
   */
  count() {
    const int = new Integer();
    int.value = this._items.length;
    return int;
  }
  /**
   * Check if the list is empty.
   */
  is_empty() {
    return new Boolean2(this._items.length === 0);
  }
  /**
   * Test if all items satisfy a condition.
   */
  for_all(test) {
    for (const item of this._items) {
      if (!test(item).value) {
        return new Boolean2(false);
      }
    }
    return new Boolean2(true);
  }
  /**
   * Test if any item satisfies a condition.
   */
  there_exists(test) {
    for (const item of this._items) {
      if (test(item).value) {
        return new Boolean2(true);
      }
    }
    return new Boolean2(false);
  }
  /**
   * Get the item at index i (0-based).
   */
  item(i2) {
    const idx = i2.value;
    if (idx === void 0 || idx < 0 || idx >= this._items.length) {
      throw new Error(`Index out of bounds: ${idx}`);
    }
    return this._items[idx];
  }
  /**
   * Return first element.
   * @returns Result value
   */
  first() {
    if (this._items.length === 0) {
      throw new Error("Cannot get first item of empty list");
    }
    return this._items[0];
  }
  /**
   * Return last element.
   * @returns Result value
   */
  last() {
    if (this._items.length === 0) {
      throw new Error("Cannot get last item of empty list");
    }
    return this._items[this._items.length - 1];
  }
  /**
   * Add an item to the end of the list.
   */
  append(v2) {
    this._items.push(v2);
  }
  /**
   * Add an item to the beginning of the list.
   */
  prepend(v2) {
    this._items.unshift(v2);
  }
  /**
   * Append all items from another list.
   */
  extend(other) {
    const otherCount = other.count().value;
    if (otherCount !== void 0) {
      for (let i2 = 0; i2 < otherCount; i2++) {
        const idx = new Integer();
        idx.value = i2;
        this._items.push(other.item(idx));
      }
    }
  }
  /**
   * Remove the item at index i.
   */
  remove(i2) {
    const idx = i2.value;
    if (idx === void 0 || idx < 0 || idx >= this._items.length) {
      throw new Error(`Index out of bounds: ${idx}`);
    }
    this._items.splice(idx, 1);
  }
  /**
   * Find the index of the first occurrence of a value.
   * Returns -1 if not found.
   */
  index_of(v2) {
    for (let i2 = 0; i2 < this._items.length; i2++) {
      if (this._items[i2].is_equal(v2).value === true) {
        const idx2 = new Integer();
        idx2.value = i2;
        return idx2;
      }
    }
    const idx = new Integer();
    idx.value = -1;
    return idx;
  }
  /**
   * Check value equality with another object.
   */
  is_equal(other) {
    if (!(other instanceof _List)) {
      return new Boolean2(false);
    }
    if (this._items.length !== other._items.length) {
      return new Boolean2(false);
    }
    for (let i2 = 0; i2 < this._items.length; i2++) {
      if (!this._items[i2].is_equal(other._items[i2]).value) {
        return new Boolean2(false);
      }
    }
    return new Boolean2(true);
  }
  /**
   * Return a List of all items matching the predicate function.
   * @param test - Predicate function with signature (v: T) => Boolean
   * @returns List of matching items, empty list if no matches
   */
  matching(test) {
    const results = new _List();
    for (const item of this._items) {
      const testResult = test(item);
      if (testResult?.value === true) {
        results.append(item);
      }
    }
    return results;
  }
  /**
   * Return first item matching the predicate function, or undefined if no match.
   * @param test - Predicate function with signature (v: T) => Boolean
   * @returns First matching item or undefined
   */
  select(test) {
    for (const item of this._items) {
      const testResult = test(item);
      if (testResult?.value === true) {
        return item;
      }
    }
    return void 0;
  }
};
var Ordered = class extends Any {
  /**
   * True if current object less than or equal to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than_or_equal(other) {
    return new Boolean2(
      this.less_than(other).value || this.is_equal(other).value
    );
  }
  /**
   * True if current object greater than \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  greater_than(other) {
    return new Boolean2(
      !this.less_than(other).value && !this.is_equal(other).value
    );
  }
  /**
   * True if current object greater than or equal to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  greater_than_or_equal(other) {
    return new Boolean2(!this.less_than(other).value);
  }
};
var String2 = class _String extends Ordered {
  static {
    TYPE_REGISTRY.set("STRING", _String);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new String instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    this.value = val;
  }
  /**
   * Creates a String instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new String instance
   */
  static from(val) {
    return new _String(val);
  }
  /**
   * Compares this String with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other) {
    if (other instanceof _String) {
      return new Boolean2(this.value === other.value);
    }
    return new Boolean2(false);
  }
  /**
   * True if string is empty, i.e. equal to "".
   * @returns Result value
   */
  is_empty() {
    return new Boolean2((this.value || "").length === 0);
  }
  /**
   * Number of characters in string.
   * @returns Result value
   */
  count() {
    const int = new Integer();
    int.value = (this.value || "").length;
    return int;
  }
  /**
   * True if string can be parsed as an integer.
   * @returns Result value
   */
  is_integer() {
    const val = this.value || "";
    const num = Number(val);
    return new Boolean2(
      !isNaN(num) && Number.isInteger(num) && val.trim() !== ""
    );
  }
  /**
   * Return the integer corresponding to the integer value represented in this string.
   * @returns Result value
   */
  as_integer() {
    const num = parseInt(this.value || "", 10);
    if (isNaN(num)) {
      throw new Error(`Cannot parse "${this.value}" as integer`);
    }
    return Integer.from(num);
  }
  /**
   * Concatenation operator - causes \`_other_\` to be appended to this string.
   * @param other - Parameter
   * @returns Result value
   */
  append(other) {
    return _String.from((this.value || "") + (other.value || ""));
  }
  /**
   * Convert string to lowercase.
   * @returns Result value
   */
  as_lower() {
    return _String.from((this.value || "").toLowerCase());
  }
  /**
   * Convert string to uppercase.
   * @returns Result value
   */
  as_upper() {
    return _String.from((this.value || "").toUpperCase());
  }
  /**
   * Lexical comparison of string content based on ordering in relevant character set.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (!(other instanceof _String)) {
      throw new Error("Cannot compare String with non-String");
    }
    return new Boolean2((this.value || "") < (other.value || ""));
  }
  /**
   * Return True if this String contains \`_other_\` (case-sensitive).
   * @param other - Parameter
   * @returns Result value
   */
  contains(other) {
    return new Boolean2((this.value || "").includes(other.value || ""));
  }
  /**
   * Extract a substring (1-based indexing in openEHR).
   * @param start - Start index (1-based)
   * @param end - End index (1-based)
   * @returns Result value
   */
  substring(start2, end) {
    const startIdx = (start2.value || 1) - 1;
    const endIdx = end.value || (this.value || "").length;
    return _String.from((this.value || "").substring(startIdx, endIdx));
  }
  /**
   * Find the index of a substring (1-based indexing in openEHR).
   * @param pattern - Pattern to find
   * @param from - Start index (1-based)
   * @returns Result value (1-based index or -1 if not found)
   */
  index_of(pattern, from) {
    const startIdx = (from.value || 1) - 1;
    const foundIdx = (this.value || "").indexOf(pattern.value || "", startIdx);
    const result = new Integer();
    result.value = foundIdx === -1 ? -1 : foundIdx + 1;
    return result;
  }
  /**
   * Split string by delimiter.
   * @param delimiter - Delimiter to split by
   * @returns Result value
   */
  split(delimiter) {
    const parts = (this.value || "").split(delimiter.value || "");
    const list = new List();
    for (const part of parts) {
      list.append(_String.from(part));
    }
    return list;
  }
};
var Ordered_Numeric = class extends Ordered {
};
var Integer = class _Integer extends Ordered_Numeric {
  static {
    TYPE_REGISTRY.set("INTEGER", _Integer);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Integer instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    if (val !== void 0 && val !== null && !Number.isInteger(val)) {
      throw new Error(`Integer value must be an integer, got: ${val}`);
    }
    this.value = val;
  }
  /**
   * Creates a Integer instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Integer instance
   */
  static from(val) {
    return new _Integer(val);
  }
  /**
   * Compares this Integer with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other) {
    if (other instanceof _Integer) {
      return new Boolean2(this.value === other.value);
    }
    return new Boolean2(false);
  }
  /**
   * Lexical comparison for integers.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (!(other instanceof _Integer)) {
      throw new Error("Cannot compare Integer with non-Integer");
    }
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return new Boolean2(thisVal < otherVal);
  }
  /**
   * Integer addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer.from(thisVal + otherVal);
  }
  /**
   * Integer subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer.from(thisVal - otherVal);
  }
  /**
   * Integer multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer.from(thisVal * otherVal);
  }
  /**
   * Integer division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 1;
    if (otherVal === 0) {
      throw new Error("Division by zero");
    }
    return thisVal / otherVal;
  }
  /**
   * Integer modulo.
   * @param other - Parameter
   * @returns Result value
   */
  modulo(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 1;
    if (otherVal === 0) {
      throw new Error("Modulo by zero");
    }
    return _Integer.from(thisVal % otherVal);
  }
  /**
   * Generate negative of current value.
   * @returns Result value
   */
  negative() {
    return _Integer.from(-(this.value || 0));
  }
  /**
   * Integer exponentiation.
   * @param other - Parameter
   * @returns Result value
   */
  exponent(other) {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }
  // modulo, less_than, negative, and is_equal are implemented above
  /**
   * Reference equality for reference types, value equality for value types.
   * @param other - Parameter
   * @returns Result value
   */
  equal(other) {
    return new Boolean2(this === other);
  }
};
var Double = class _Double extends Ordered_Numeric {
  static {
    TYPE_REGISTRY.set("DOUBLE", _Double);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Double instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    this.value = val;
  }
  /**
   * Creates a Double instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Double instance
   */
  static from(val) {
    return new _Double(val);
  }
  /**
   * Return the greatest integer no greater than the value of this object.
   * @returns Result value
   */
  floor() {
    const thisVal = this.value || 0;
    return Integer.from(Math.floor(thisVal));
  }
  /**
   * Double-precision real number addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other) {
    const thisVal = this.value || 0;
    return thisVal + other;
  }
  /**
   * Double-precision real number subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other) {
    const thisVal = this.value || 0;
    return thisVal - other;
  }
  /**
   * Double-precision real number multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other) {
    const thisVal = this.value || 0;
    return thisVal * other;
  }
  /**
   * Double-precision real number division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other) {
    const thisVal = this.value || 0;
    if (other === 0) {
      throw new Error("Division by zero");
    }
    return thisVal / other;
  }
  /**
   * Double-precision real number exponentiation.
   * @param other - Parameter
   * @returns Result value
   */
  exponent(other) {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }
  /**
   * Returns True if current Double is less than \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (other instanceof _Double) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal < otherVal);
    }
    return new Boolean2(false);
  }
  /**
   * Generate negative of current Double value.
   * @returns Result value
   */
  negative() {
    const thisVal = this.value || 0;
    return -thisVal;
  }
  /**
   * Value equality: return True if \`this\` and \`_other_\` are attached to objects considered to be equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (other instanceof _Double) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal === otherVal);
    }
    return new Boolean2(false);
  }
};
var Octet = class _Octet extends Ordered {
  static {
    TYPE_REGISTRY.set("OCTET", _Octet);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Octet instance.
   * @param val - The primitive value to wrap (0-255)
   */
  constructor(val) {
    super();
    if (val !== void 0 && val !== null && (!Number.isInteger(val) || val < 0 || val > 255)) {
      throw new Error(`Octet value must be an integer between 0 and 255, got: ${val}`);
    }
    this.value = val;
  }
  /**
   * Creates an Octet instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Octet instance
   */
  static from(val) {
    return new _Octet(val);
  }
  /**
   * Returns True if current Octet is less than other.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (other instanceof _Octet) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal < otherVal);
    }
    return new Boolean2(false);
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (other instanceof _Octet) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal === otherVal);
    }
    return new Boolean2(false);
  }
};
var Character = class _Character extends Ordered {
  static {
    TYPE_REGISTRY.set("CHARACTER", _Character);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Character instance.
   * @param val - The primitive value to wrap (single character)
   */
  constructor(val) {
    super();
    if (val !== void 0 && val !== null && val.length !== 1) {
      throw new Error(`Character value must be a single character, got: ${val}`);
    }
    this.value = val;
  }
  /**
   * Creates a Character instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Character instance
   */
  static from(val) {
    return new _Character(val);
  }
  /**
   * Returns True if current Character is less than other.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (other instanceof _Character) {
      const thisVal = this.value || "";
      const otherVal = other.value || "";
      return new Boolean2(thisVal < otherVal);
    }
    return new Boolean2(false);
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (other instanceof _Character) {
      const thisVal = this.value || "";
      const otherVal = other.value || "";
      return new Boolean2(thisVal === otherVal);
    }
    return new Boolean2(false);
  }
};
var Boolean2 = class _Boolean extends Any {
  static {
    TYPE_REGISTRY.set("BOOLEAN", _Boolean);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Boolean instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    this.value = val;
  }
  /**
   * Creates a Boolean instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Boolean instance
   */
  static from(val) {
    return new _Boolean(val);
  }
  /**
   * Compares this Boolean with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other) {
    if (other instanceof _Boolean) {
      return new _Boolean(this.value === other.value);
    }
    return new _Boolean(false);
  }
  /**
   * Logical conjunction of this with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  conjunction(other) {
    return new _Boolean(this.value === true && other.value === true);
  }
  /**
   * Boolean semi-strict conjunction with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  semistrict_conjunction(other) {
    if (this.value !== true) {
      return new _Boolean(false);
    }
    return new _Boolean(other.value === true);
  }
  /**
   * Boolean disjunction with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  disjunction(other) {
    return new _Boolean(this.value === true || other.value === true);
  }
  /**
   * Boolean semi-strict disjunction with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  semistrict_disjunction(other) {
    if (this.value === true) {
      return new _Boolean(true);
    }
    return new _Boolean(other.value === true);
  }
  /**
   * Boolean exclusive or with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  exclusive_disjunction(other) {
    return new _Boolean(this.value === true !== (other.value === true));
  }
  /**
   * Boolean implication of \`_other_\` (semi-strict)
   * @param other - Parameter
   * @returns Result value
   */
  implication(other) {
    if (this.value !== true) {
      return new _Boolean(true);
    }
    return new _Boolean(other.value === true);
  }
  /**
   * Boolean negation of the current value.
   * @returns Result value
   */
  negation() {
    return new _Boolean(this.value !== true);
  }
};
var Real = class _Real extends Ordered_Numeric {
  static {
    TYPE_REGISTRY.set("REAL", _Real);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Real instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    this.value = val;
  }
  /**
   * Creates a Real instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Real instance
   */
  static from(val) {
    return new _Real(val);
  }
  /**
   * Return the greatest integer no greater than the value of this object.
   * @returns Result value
   */
  floor() {
    const thisVal = this.value || 0;
    return Integer.from(Math.floor(thisVal));
  }
  /**
   * Real number addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other) {
    const thisVal = this.value || 0;
    return thisVal + other;
  }
  /**
   * Real number subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other) {
    const thisVal = this.value || 0;
    return thisVal - other;
  }
  /**
   * Real number multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other) {
    const thisVal = this.value || 0;
    return thisVal * other;
  }
  /**
   * Real number division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other) {
    const thisVal = this.value || 0;
    if (other === 0) {
      throw new Error("Division by zero");
    }
    return thisVal / other;
  }
  /**
   * Real number exponentiation.
   * @param other - Parameter
   * @returns Result value
   */
  exponent(other) {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }
  /**
   * Returns True if current Real is less than \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (other instanceof _Real) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal < otherVal);
    }
    return new Boolean2(false);
  }
  /**
   * Generate negative of current Real value.
   * @returns Result value
   */
  negative() {
    const thisVal = this.value || 0;
    return -thisVal;
  }
  /**
   * Value equality: return True if \`this\` and \`_other_\` are attached to objects considered to be equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (other instanceof _Real) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal === otherVal);
    }
    return new Boolean2(false);
  }
};
var Integer64 = class _Integer64 extends Ordered_Numeric {
  static {
    TYPE_REGISTRY.set("INTEGER64", _Integer64);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Integer64 instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    if (val !== void 0 && val !== null && !Number.isInteger(val)) {
      throw new Error(`Integer64 value must be an integer, got: ${val}`);
    }
    this.value = val;
  }
  /**
   * Creates a Integer64 instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Integer64 instance
   */
  static from(val) {
    return new _Integer64(val);
  }
  /**
   * Compares this Integer64 with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other) {
    if (other instanceof _Integer64) {
      return new Boolean2(this.value === other.value);
    }
    return new Boolean2(false);
  }
  /**
   * Lexical comparison for large integers.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (!(other instanceof _Integer64)) {
      throw new Error("Cannot compare Integer64 with non-Integer64");
    }
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return new Boolean2(thisVal < otherVal);
  }
  /**
   * Large integer addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer64.from(thisVal + otherVal);
  }
  /**
   * Large integer subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer64.from(thisVal - otherVal);
  }
  /**
   * Large integer multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer64.from(thisVal * otherVal);
  }
  /**
   * Large integer division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 1;
    if (otherVal === 0) {
      throw new Error("Division by zero");
    }
    return thisVal / otherVal;
  }
  /**
   * Large integer exponentiation.
   * @param other - Parameter
   * @returns Result value
   */
  exponent(other) {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }
  /**
   * Large integer modulus.
   * @param mod - Parameter
   * @returns Result value
   */
  modulo(mod) {
    const thisVal = this.value || 0;
    const modVal = mod.value || 1;
    if (modVal === 0) {
      throw new Error("Modulo by zero");
    }
    return _Integer64.from(thisVal % modVal);
  }
  /**
   * Generate negative of current Integer value.
   * @returns Result value
   */
  negative() {
    return _Integer64.from(-(this.value || 0));
  }
  /**
   * Reference equality for reference types, value equality for value types.
   * @param other - Parameter
   * @returns Result value
   */
  equal(other) {
    return new Boolean2(this === other);
  }
};
var Byte = class _Byte extends Ordered {
  static {
    TYPE_REGISTRY.set("BYTE", _Byte);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Byte instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    if (val !== void 0 && val !== null && (!Number.isInteger(val) || val < 0 || val > 255)) {
      throw new Error(
        `Byte value must be an integer between 0 and 255, got: ${val}`
      );
    }
    this.value = val;
  }
  /**
   * Creates a Byte instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Byte instance
   */
  static from(val) {
    return new _Byte(val);
  }
  /**
   * Returns True if current Byte is less than other.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (other instanceof _Byte) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal < otherVal);
    }
    return new Boolean2(false);
  }
  /**
   * Compares this Byte with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other) {
    if (other instanceof _Byte) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal === otherVal);
    }
    return new Boolean2(false);
  }
};
var Temporal = class extends Ordered {
};
var Iso8601_type = class extends Temporal {
  /**
   * Internal storage for value
   * @protected
   */
  _value;
  /**
   * Representation of all descendants is a single String.
   */
  get value() {
    return this._value?.value;
  }
  /**
   * Gets the String wrapper object for value.
   * Use this to access String methods.
   */
  get $value() {
    return this._value;
  }
  /**
   * Sets value from either a primitive value or String wrapper.
   */
  set value(val) {
    if (val === void 0 || val === null) {
      this._value = void 0;
    } else if (typeof val === "string") {
      this._value = String2.from(val);
    } else {
      this._value = val;
    }
  }
};
var Iso8601_date_time = class _Iso8601_date_time extends Iso8601_type {
  static {
    TYPE_REGISTRY.set("ISO8601_DATE_TIME", _Iso8601_date_time);
  }
  /**
   * Extract the year part of the date as an Integer.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  year() {
    const val = this.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      return Integer.from(dt2.year);
    } catch {
      try {
        const match = val.match(/^(\d{4})-?(\d{2})?-?(\d{2})?/);
        if (match && match[1]) {
          return Integer.from(parseInt(match[1], 10));
        }
      } catch {
      }
    }
    return Integer.from(0);
  }
  /**
   * Extract the month part of the date/time as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  month() {
    const val = this.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      return Integer.from(dt2.month);
    } catch {
      try {
        const match = val.match(/^(\d{4})-?(\d{2})?/);
        if (match && match[2]) {
          return Integer.from(parseInt(match[2], 10));
        }
      } catch {
      }
    }
    return Integer.from(0);
  }
  /**
   * Extract the day part of the date/time as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  day() {
    const val = this.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      return Integer.from(dt2.day);
    } catch {
      try {
        const match = val.match(/^(\d{4})-?(\d{2})?-?(\d{2})?/);
        if (match && match[3]) {
          return Integer.from(parseInt(match[3], 10));
        }
      } catch {
      }
    }
    return Integer.from(0);
  }
  /**
   * Extract the hour part of the date/time as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  hour() {
    const val = this.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      return Integer.from(dt2.hour);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Extract the minute part of the date/time as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  minute() {
    const val = this.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      return Integer.from(dt2.minute);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Extract the integral seconds part of the date/time (i.e. prior to any decimal sign) as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  second() {
    const val = this.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      return Integer.from(dt2.second);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Extract the fractional seconds part of the date/time (i.e. following to any decimal sign) as a Real, or return 0.0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  fractional_second() {
    const val = this.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      return dt2.millisecond / 1e3 + dt2.microsecond / 1e6 + dt2.nanosecond / 1e9;
    } catch {
    }
    return 0;
  }
  /**
   * Timezone; may be Void.
   *
   * Uses Temporal API to extract timezone information.
   * @returns Result value
   */
  timezone() {
    const val = this.value || "";
    const match = val.match(/(Z|[+-]\d{2}:?\d{2})$/);
    if (match) {
      const tz = new Iso8601_timezone();
      tz.value = match[1];
      return tz;
    }
    throw new Error("No timezone present in date-time");
  }
  /**
   * Indicates whether month in year is unknown.
   * @returns Result value
   */
  month_unknown() {
    return new Boolean2(this.month().value === 0);
  }
  /**
   * Indicates whether day in month is unknown.
   * @returns Result value
   */
  day_unknown() {
    return new Boolean2(this.day().value === 0);
  }
  /**
   * Indicates whether minute in hour is known.
   * @returns Result value
   */
  minute_unknown() {
    const val = this.value || "";
    return new Boolean2(!val.includes("T") || this.minute().value === 0);
  }
  /**
   * Indicates whether minute in hour is known.
   * @returns Result value
   */
  second_unknown() {
    const val = this.value || "";
    const hasSeconds = /T\d{2}:?\d{2}:?\d{2}/.test(val);
    return new Boolean2(!hasSeconds);
  }
  /**
   * True if this time has a decimal part indicated by \`','\` (comma) rather than \`'.'\` (period).
   * @returns Result value
   */
  is_decimal_sign_comma() {
    const val = this.value || "";
    return new Boolean2(val.includes(","));
  }
  /**
   * True if this date time is partial, i.e. if seconds or more is missing.
   * @returns Result value
   */
  is_partial() {
    return this.second_unknown();
  }
  /**
   * True if this date/time uses \`'-'\`, \`':'\` separators.
   * @returns Result value
   */
  is_extended() {
    const val = this.value || "";
    return new Boolean2(val.includes("-") || val.includes(":"));
  }
  /**
   * True if the \`_fractional_second_\` part is significant (i.e. even if = 0.0).
   * @returns Result value
   */
  has_fractional_second() {
    const val = this.value || "";
    return new Boolean2(/T\d{2}:?\d{2}:?\d{2}[,.]/.test(val));
  }
  /**
   * Return the string value in extended format.
   *
   * Uses Temporal API to parse and format in extended ISO 8601 format.
   * @returns Result value
   */
  as_string() {
    const val = this.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      return String2.from(dt2.toString());
    } catch {
      return String2.from(val);
    }
  }
  /**
   * Arithmetic addition of a duration to a date/time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      const dur = mr.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = dt2.add(dur);
      const newDateTime = new _Iso8601_date_time();
      newDateTime.value = result.toString();
      return newDateTime;
    } catch (e2) {
      throw new Error(`Failed to add duration to date_time: ${e2}`);
    }
  }
  /**
   * Arithmetic subtraction of a duration from a date/time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      const dur = mr.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = dt2.subtract(dur);
      const newDateTime = new _Iso8601_date_time();
      newDateTime.value = result.toString();
      return newDateTime;
    } catch (e2) {
      throw new Error(`Failed to subtract duration from date_time: ${e2}`);
    }
  }
  /**
   * Difference of two date/times.
   * @param a_date_time - Parameter
   * @returns Result value
   */
  diff(a_date_time) {
    const val = this.value || "";
    const otherVal = a_date_time.value || "";
    try {
      const dt1 = mr.PlainDateTime.from(val);
      const dt2 = mr.PlainDateTime.from(otherVal);
      const diff = dt1.since(dt2);
      const duration = new Iso8601_duration();
      duration.value = diff.toString();
      return duration;
    } catch (e2) {
      throw new Error(`Failed to calculate difference: ${e2}`);
    }
  }
  /**
   * Addition of nominal duration represented by \`_a_diff_\`. See \`Iso8601_date._add_nominal_()\` for semantics.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add_nominal(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      const dur = mr.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = dt2.add(dur);
      const newDateTime = new Iso8601_date();
      newDateTime.value = result.toPlainDate().toString();
      return newDateTime;
    } catch (e2) {
      throw new Error(`Failed to add nominal duration: ${e2}`);
    }
  }
  /**
   * Subtraction of nominal duration represented by \`_a_diff_\`. See \`_add_nominal_()\` for semantics.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract_nominal(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt2 = mr.PlainDateTime.from(val);
      const dur = mr.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = dt2.subtract(dur);
      const newDateTime = new Iso8601_date();
      newDateTime.value = result.toPlainDate().toString();
      return newDateTime;
    } catch (e2) {
      throw new Error(`Failed to subtract nominal duration: ${e2}`);
    }
  }
  /**
   * Compares this date-time with another for ordering.
   * @param other - The object to compare with
   * @returns true if this date-time is less than the other
   */
  less_than(other) {
    if (!(other instanceof _Iso8601_date_time)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const dt1 = mr.PlainDateTime.from(val);
      const dt2 = mr.PlainDateTime.from(otherVal);
      return new Boolean2(mr.PlainDateTime.compare(dt1, dt2) < 0);
    } catch {
      return new Boolean2(val < otherVal);
    }
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Iso8601_date_time)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const dt1 = mr.PlainDateTime.from(val);
      const dt2 = mr.PlainDateTime.from(otherVal);
      return new Boolean2(mr.PlainDateTime.compare(dt1, dt2) === 0);
    } catch {
      return new Boolean2(val === otherVal);
    }
  }
};
var Iso8601_duration = class _Iso8601_duration extends Iso8601_type {
  static {
    TYPE_REGISTRY.set("ISO8601_DURATION", _Iso8601_duration);
  }
  /**
   * Helper method to convert openEHR duration with weeks to standard ISO 8601.
   * OpenEHR allows weeks to be mixed with other designators, but Temporal API doesn't.
   * This converts weeks to days (1W = 7D).
   * @param value - Duration string that may contain weeks
   * @returns Duration string with weeks converted to days
   */
  static normalizeWeeks(value) {
    const weeksMatch = value.match(/(\d+(?:\.\d+)?)W/);
    if (!weeksMatch)
      return value;
    const weeks = parseFloat(weeksMatch[1]);
    const days = weeks * 7;
    let normalized = value.replace(/\d+(?:\.\d+)?W/, "");
    const daysMatch = normalized.match(/(\d+(?:\.\d+)?)D/);
    if (daysMatch) {
      const existingDays = parseFloat(daysMatch[1]);
      const totalDays = existingDays + days;
      normalized = normalized.replace(/\d+(?:\.\d+)?D/, `${totalDays}D`);
    } else {
      if (normalized.includes("T")) {
        normalized = normalized.replace("T", `${days}DT`);
      } else {
        normalized = normalized.replace(/P(.*)$/, `P$1${days}D`);
      }
    }
    return normalized;
  }
  /**
   * Returns True.
   * @returns Result value
   */
  is_extended() {
    return new Boolean2(true);
  }
  /**
   * Returns False.
   * @returns Result value
   */
  is_partial() {
    return new Boolean2(false);
  }
  /**
   * Number of years in the \`_value_\`, i.e. the number preceding the \`'Y'\` in the \`'YMD'\` part, if one exists.
   * @returns Result value
   */
  years() {
    const val = this.value || "";
    try {
      const dur = mr.Duration.from(val);
      return Integer.from(dur.years || 0);
    } catch {
      return Integer.from(0);
    }
  }
  /**
   * Number of months in the \`_value_\`, i.e. the value preceding the \`'M'\` in the \`'YMD'\` part, if one exists.
   * @returns Result value
   */
  months() {
    const val = this.value || "";
    try {
      const dur = mr.Duration.from(val);
      return Integer.from(dur.months || 0);
    } catch {
      return Integer.from(0);
    }
  }
  /**
   * Number of days in the \`_value_\`, i.e. the number preceding the \`'D'\` in the \`'YMD'\` part, if one exists.
   * Note: This returns only the D component, not converted weeks.
   * @returns Result value
   */
  days() {
    const val = this.value || "";
    try {
      const normalized = _Iso8601_duration.normalizeWeeks(val);
      const dur = mr.Duration.from(normalized);
      return Integer.from(dur.days || 0);
    } catch {
      const daysMatch = val.match(/(\d+(?:\.\d+)?)D/);
      if (daysMatch) {
        return Integer.from(Math.floor(parseFloat(daysMatch[1])));
      }
      return Integer.from(0);
    }
  }
  /**
   * Number of hours in the \`_value_\`, i.e. the number preceding the \`'H'\` in the \`'HMS'\` part, if one exists.
   * @returns Result value
   */
  hours() {
    const val = this.value || "";
    try {
      const dur = mr.Duration.from(val);
      return Integer.from(dur.hours || 0);
    } catch {
      return Integer.from(0);
    }
  }
  /**
   * Number of minutes in the \`_value_\`, i.e. the number preceding the \`'M'\` in the \`'HMS'\` part, if one exists.
   * @returns Result value
   */
  minutes() {
    const val = this.value || "";
    try {
      const dur = mr.Duration.from(val);
      return Integer.from(dur.minutes || 0);
    } catch {
      return Integer.from(0);
    }
  }
  /**
   * Number of seconds in the \`_value_\`, i.e. the integer number preceding the \`'S'\` in the \`'HMS'\` part, if one exists.
   * @returns Result value
   */
  seconds() {
    const val = this.value || "";
    try {
      const dur = mr.Duration.from(val);
      return Integer.from(dur.seconds || 0);
    } catch {
      return Integer.from(0);
    }
  }
  /**
   * Fractional seconds in the \`_value_\`, i.e. the decimal part of the number preceding the \`'S'\` in the \`'HMS'\` part, if one exists.
   * @returns Result value
   */
  fractional_seconds() {
    const val = this.value || "";
    try {
      const dur = mr.Duration.from(val);
      return (dur.milliseconds || 0) / 1e3 + (dur.microseconds || 0) / 1e6 + (dur.nanoseconds || 0) / 1e9;
    } catch {
      return 0;
    }
  }
  /**
   * Number of weeks in the \`_value_\`, i.e. the value preceding the \`W\`, if one exists.
   * @returns Result value
   */
  weeks() {
    const val = this.value || "";
    const weeksMatch = val.match(/(\d+(?:\.\d+)?)W/);
    if (weeksMatch) {
      return Integer.from(Math.floor(parseFloat(weeksMatch[1])));
    }
    return Integer.from(0);
  }
  /**
   * True if this time has a decimal part indicated by ',' (comma) rather than '.' (period).
   * @returns Result value
   */
  is_decimal_sign_comma() {
    const val = this.value || "";
    return new Boolean2(val.includes(","));
  }
  /**
   * Total number of seconds equivalent (including fractional) of entire duration. Where non-definite elements such as year and month (i.e. 'Y' and 'M') are included, the corresponding 'average' durations from \`Time_definitions\` are used to compute the result.
   * @returns Result value
   */
  to_seconds() {
    const val = this.value || "";
    try {
      const dur = mr.Duration.from(val);
      const totalSeconds = (dur.years || 0) * 31536e3 + (dur.months || 0) * 2592e3 + (dur.weeks || 0) * 604800 + (dur.days || 0) * 86400 + (dur.hours || 0) * 3600 + (dur.minutes || 0) * 60 + (dur.seconds || 0) + (dur.milliseconds || 0) / 1e3 + (dur.microseconds || 0) / 1e6 + (dur.nanoseconds || 0) / 1e9;
      return totalSeconds;
    } catch {
      return 0;
    }
  }
  /**
   * Return the duration string value.
   * @returns Result value
   */
  as_string() {
    const val = this.value || "";
    try {
      const dur = mr.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      return String2.from(dur.toString());
    } catch {
      return String2.from(val);
    }
  }
  /**
   * Arithmetic addition of a duration to a duration, via conversion to seconds, using \`Time_definitions._Average_days_in_year_\` and \`Time_definitions._Average_days_in_month_\`
   * @param a_val - Parameter
   * @returns Result value
   */
  add(a_val) {
    const val = this.value || "";
    const otherVal = a_val.value || "";
    try {
      const dur1 = mr.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      const dur2 = mr.Duration.from(
        _Iso8601_duration.normalizeWeeks(otherVal)
      );
      const result = dur1.add(dur2);
      const newDuration = new _Iso8601_duration();
      newDuration.value = result.toString();
      return newDuration;
    } catch (e2) {
      throw new Error(`Failed to add durations: ${e2}`);
    }
  }
  /**
   * Arithmetic subtraction of a duration from a duration, via conversion to seconds, using \`Time_definitions._Average_days_in_year_\` and \`Time_definitions._Average_days_in_month_\`
   * @param a_val - Parameter
   * @returns Result value
   */
  subtract(a_val) {
    const val = this.value || "";
    const otherVal = a_val.value || "";
    try {
      const dur1 = mr.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      const dur2 = mr.Duration.from(
        _Iso8601_duration.normalizeWeeks(otherVal)
      );
      const result = dur1.subtract(dur2);
      const newDuration = new _Iso8601_duration();
      newDuration.value = result.toString();
      return newDuration;
    } catch (e2) {
      throw new Error(`Failed to subtract durations: ${e2}`);
    }
  }
  /**
   * Arithmetic multiplication a duration by a number.
   * @param a_val - Parameter
   * @returns Result value
   */
  multiply(a_val) {
    const val = this.value || "";
    try {
      const dur = mr.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      const result = dur.add(dur.negated()).add({
        years: dur.years * a_val,
        months: dur.months * a_val,
        weeks: dur.weeks * a_val,
        days: dur.days * a_val,
        hours: dur.hours * a_val,
        minutes: dur.minutes * a_val,
        seconds: dur.seconds * a_val,
        milliseconds: dur.milliseconds * a_val,
        microseconds: dur.microseconds * a_val,
        nanoseconds: dur.nanoseconds * a_val
      });
      const newDuration = new _Iso8601_duration();
      newDuration.value = result.toString();
      return newDuration;
    } catch (e2) {
      throw new Error(`Failed to multiply duration: ${e2}`);
    }
  }
  /**
   * Arithmetic division of a duration by a number.
   * @param a_val - Parameter
   * @returns Result value
   */
  divide(a_val) {
    if (a_val === 0) {
      throw new Error("Division by zero");
    }
    const val = this.value || "";
    try {
      const dur = mr.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      const result = dur.add(dur.negated()).add({
        years: dur.years / a_val,
        months: dur.months / a_val,
        weeks: dur.weeks / a_val,
        days: dur.days / a_val,
        hours: dur.hours / a_val,
        minutes: dur.minutes / a_val,
        seconds: dur.seconds / a_val,
        milliseconds: dur.milliseconds / a_val,
        microseconds: dur.microseconds / a_val,
        nanoseconds: dur.nanoseconds / a_val
      });
      const newDuration = new _Iso8601_duration();
      newDuration.value = result.toString();
      return newDuration;
    } catch (e2) {
      throw new Error(`Failed to divide duration: ${e2}`);
    }
  }
  /**
   * Generate negative of current duration value.
   * @returns Result value
   */
  negative() {
    const val = this.value || "";
    try {
      const dur = mr.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      const result = dur.negated();
      const newDuration = new _Iso8601_duration();
      newDuration.value = result.toString();
      return newDuration;
    } catch (e2) {
      throw new Error(`Failed to negate duration: ${e2}`);
    }
  }
  /**
   * Compares this duration with another for ordering.
   * @param other - The object to compare with
   * @returns true if this duration is less than the other
   */
  less_than(other) {
    if (!(other instanceof _Iso8601_duration)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const dur1 = mr.Duration.from(_Iso8601_duration.normalizeWeeks(val));
      const dur2 = mr.Duration.from(_Iso8601_duration.normalizeWeeks(otherVal));
      const total1 = dur1.total({ unit: "seconds" });
      const total2 = dur2.total({ unit: "seconds" });
      return new Boolean2(total1 < total2);
    } catch {
      return new Boolean2(val < otherVal);
    }
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Iso8601_duration)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const dur1 = mr.Duration.from(_Iso8601_duration.normalizeWeeks(val));
      const dur2 = mr.Duration.from(_Iso8601_duration.normalizeWeeks(otherVal));
      const total1 = dur1.total({ unit: "seconds" });
      const total2 = dur2.total({ unit: "seconds" });
      return new Boolean2(total1 === total2);
    } catch {
      return new Boolean2(val === otherVal);
    }
  }
};
var Iso8601_time = class _Iso8601_time extends Iso8601_type {
  static {
    TYPE_REGISTRY.set("ISO8601_TIME", _Iso8601_time);
  }
  /**
   * Extract the hour part of the date/time as an Integer.
   * @returns Result value
   */
  hour() {
    const val = this.value || "";
    try {
      const time = mr.PlainTime.from(val);
      return Integer.from(time.hour);
    } catch {
      const match = val.match(/^(\d{2})/);
      if (match) {
        return Integer.from(parseInt(match[1], 10));
      }
    }
    return Integer.from(0);
  }
  /**
   * Extract the minute part of the time as an Integer, or return 0 if not present.
   * @returns Result value
   */
  minute() {
    const val = this.value || "";
    try {
      const time = mr.PlainTime.from(val);
      return Integer.from(time.minute);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Extract the integral seconds part of the time (i.e. prior to any decimal sign) as an Integer, or return 0 if not present.
   * @returns Result value
   */
  second() {
    const val = this.value || "";
    try {
      const time = mr.PlainTime.from(val);
      return Integer.from(time.second);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Extract the fractional seconds part of the time (i.e. following to any decimal sign) as a Real, or return 0.0 if not present.
   * @returns Result value
   */
  fractional_second() {
    const val = this.value || "";
    try {
      const time = mr.PlainTime.from(val);
      return time.millisecond / 1e3 + time.microsecond / 1e6 + time.nanosecond / 1e9;
    } catch {
    }
    return 0;
  }
  /**
   * Timezone; may be Void.
   * @returns Result value
   */
  timezone() {
    const val = this.value || "";
    const match = val.match(/(Z|[+-]\d{2}:?\d{2})$/);
    if (match) {
      const tz = new Iso8601_timezone();
      tz.value = match[1];
      return tz;
    }
    throw new Error("No timezone present in time");
  }
  /**
   * Indicates whether minute is unknown. If so, the time is of the form “hh”.
   * @returns Result value
   */
  minute_unknown() {
    const val = this.value || "";
    const hasMinutes = /^\d{2}:?\d{2}/.test(val);
    return new Boolean2(!hasMinutes);
  }
  /**
   * Indicates whether second is unknown. If so and month is known, the time is of the form \`"hh:mm"\` or \`"hhmm"\`.
   * @returns Result value
   */
  second_unknown() {
    const val = this.value || "";
    const hasSeconds = /^\d{2}:?\d{2}:?\d{2}/.test(val);
    return new Boolean2(!hasSeconds);
  }
  /**
   * True if this time has a decimal part indicated by \`','\` (comma) rather than \`'.'\` (period).
   * @returns Result value
   */
  is_decimal_sign_comma() {
    const val = this.value || "";
    return new Boolean2(val.includes(","));
  }
  /**
   * True if this time is partial, i.e. if seconds or more is missing.
   * @returns Result value
   */
  is_partial() {
    return this.second_unknown();
  }
  /**
   * True if this time uses \`'-'\`, \`':'\` separators.
   * @returns Result value
   */
  is_extended() {
    const val = this.value || "";
    return new Boolean2(val.includes(":"));
  }
  /**
   * True if the \`_fractional_second_\` part is significant (i.e. even if = 0.0).
   * @returns Result value
   */
  has_fractional_second() {
    const val = this.value || "";
    return new Boolean2(/\d{2}[,.]/.test(val));
  }
  /**
   * Return string value in extended format.
   * @returns Result value
   */
  as_string() {
    const val = this.value || "";
    try {
      const time = mr.PlainTime.from(val);
      return String2.from(time.toString());
    } catch {
      return String2.from(val);
    }
  }
  /**
   * Arithmetic addition of a duration to a time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const time = mr.PlainTime.from(val);
      const dur = mr.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = time.add(dur);
      const newTime = new _Iso8601_time();
      newTime.value = result.toString();
      return newTime;
    } catch (e2) {
      throw new Error(`Failed to add duration to time: ${e2}`);
    }
  }
  /**
   * Arithmetic subtraction of a duration from a time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const time = mr.PlainTime.from(val);
      const dur = mr.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = time.subtract(dur);
      const newTime = new _Iso8601_time();
      newTime.value = result.toString();
      return newTime;
    } catch (e2) {
      throw new Error(`Failed to subtract duration from time: ${e2}`);
    }
  }
  /**
   * Difference of two times.
   * @param a_time - Parameter
   * @returns Result value
   */
  diff(a_time) {
    const val = this.value || "";
    const otherVal = a_time.value || "";
    try {
      const time1 = mr.PlainTime.from(val);
      const time2 = mr.PlainTime.from(otherVal);
      const diff = time1.since(time2);
      const duration = new Iso8601_duration();
      duration.value = diff.toString();
      return duration;
    } catch (e2) {
      throw new Error(`Failed to calculate time difference: ${e2}`);
    }
  }
  /**
   * Compares this time with another for ordering.
   * @param other - The object to compare with
   * @returns true if this time is less than the other
   */
  less_than(other) {
    if (!(other instanceof _Iso8601_time)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const time1 = mr.PlainTime.from(val);
      const time2 = mr.PlainTime.from(otherVal);
      return new Boolean2(mr.PlainTime.compare(time1, time2) < 0);
    } catch {
      return new Boolean2(val < otherVal);
    }
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Iso8601_time)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const time1 = mr.PlainTime.from(val);
      const time2 = mr.PlainTime.from(otherVal);
      return new Boolean2(mr.PlainTime.compare(time1, time2) === 0);
    } catch {
      return new Boolean2(val === otherVal);
    }
  }
};
var Iso8601_date = class _Iso8601_date extends Iso8601_type {
  static {
    TYPE_REGISTRY.set("ISO8601_DATE", _Iso8601_date);
  }
  /**
   * Extract the year part of the date as an Integer.
   *
   * Uses Temporal API for robust ISO 8601 date parsing.
   * @returns Result value
   */
  year() {
    const val = this.value || "";
    try {
      const date = mr.PlainDate.from(val);
      return Integer.from(date.year);
    } catch {
      const match = val.match(/^(\d{4})/);
      if (match) {
        return Integer.from(parseInt(match[1], 10));
      }
    }
    return Integer.from(0);
  }
  /**
   * Extract the month part of the date as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 date parsing.
   * @returns Result value
   */
  month() {
    const val = this.value || "";
    try {
      const date = mr.PlainDate.from(val);
      return Integer.from(date.month);
    } catch {
      try {
        const ym = mr.PlainYearMonth.from(val);
        return Integer.from(ym.month);
      } catch {
      }
    }
    return Integer.from(0);
  }
  /**
   * Extract the day part of the date as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 date parsing.
   * @returns Result value
   */
  day() {
    const val = this.value || "";
    try {
      const date = mr.PlainDate.from(val);
      return Integer.from(date.day);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Timezone; may be Void.
   *
   * NOTE: ISO 8601 dates typically don't have timezones, but this checks for them.
   * @returns Result value
   */
  timezone() {
    const val = this.value || "";
    const match = val.match(/(Z|[+-]\d{2}:?\d{2})$/);
    if (match) {
      const tz = new Iso8601_timezone();
      tz.value = match[1];
      return tz;
    }
    throw new Error("No timezone present in date");
  }
  /**
   * Indicates whether month in year is unknown. If so, the date is of the form \`"YYYY"\`.
   * @returns Result value
   */
  month_unknown() {
    return new Boolean2(this.month().value === 0);
  }
  /**
   * Indicates whether day in month is unknown. If so, and month is known, the date is of the form \`"YYYY-MM"\` or \`"YYYYMM"\`.
   * @returns Result value
   */
  day_unknown() {
    return new Boolean2(this.day().value === 0);
  }
  /**
   * True if this date is partial, i.e. if days or more is missing.
   * @returns Result value
   */
  is_partial() {
    return this.day_unknown();
  }
  /**
   * True if this date uses \`'-'\` separators.
   * @returns Result value
   */
  is_extended() {
    const val = this.value || "";
    return new Boolean2(val.includes("-"));
  }
  /**
   * Return string value in extended format.
   *
   * Uses Temporal API to parse and format in extended ISO 8601 format.
   * @returns Result value
   */
  as_string() {
    const val = this.value || "";
    try {
      const date = mr.PlainDate.from(val);
      return String2.from(date.toString());
    } catch {
      try {
        const ym = mr.PlainYearMonth.from(val);
        return String2.from(ym.toString());
      } catch {
        return String2.from(val);
      }
    }
  }
  /**
   * Arithmetic addition of a duration to a date.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = mr.PlainDate.from(val);
      const dur = mr.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = date.add(dur);
      const newDate = new _Iso8601_date();
      newDate.value = result.toString();
      return newDate;
    } catch (e2) {
      throw new Error(`Failed to add duration to date: ${e2}`);
    }
  }
  /**
   * Arithmetic subtraction of a duration from a date.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = mr.PlainDate.from(val);
      const dur = mr.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = date.subtract(dur);
      const newDate = new _Iso8601_date();
      newDate.value = result.toString();
      return newDate;
    } catch (e2) {
      throw new Error(`Failed to subtract duration from date: ${e2}`);
    }
  }
  /**
   * Difference of two dates.
   * @param a_date - Parameter
   * @returns Result value
   */
  diff(a_date) {
    const val = this.value || "";
    const otherVal = a_date.value || "";
    try {
      const date1 = mr.PlainDate.from(val);
      const date2 = mr.PlainDate.from(otherVal);
      const diff = date1.since(date2);
      const duration = new Iso8601_duration();
      duration.value = diff.toString();
      return duration;
    } catch (e2) {
      throw new Error(`Failed to calculate date difference: ${e2}`);
    }
  }
  /**
   * Addition of nominal duration represented by \`_a_diff_\`. For example, a duration of \`'P1Y'\` means advance to the same date next year, with the exception of the date 29 February in a leap year, to which the addition of a nominal year will result in 28 February of the following year. Similarly, \`'P1M'\` is understood here as a nominal month, the addition of which will result in one of:
   *
   * * the same day in the following month, if it exists, or;
   * * one or two days less where the following month is shorter, or;
   * * in the case of adding a month to the date 31 Jan, the result will be 28 Feb in a non-leap year (i.e. three less) and 29 Feb in a leap year (i.e. two less).
   * @param a_diff - Parameter
   * @returns Result value
   */
  add_nominal(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = mr.PlainDate.from(val);
      const dur = mr.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = date.add(dur, { overflow: "constrain" });
      const newDate = new _Iso8601_date();
      newDate.value = result.toString();
      return newDate;
    } catch (e2) {
      throw new Error(`Failed to add nominal duration to date: ${e2}`);
    }
  }
  /**
   * Subtraction of nominal duration represented by \`_a_diff_\`. See \`_add_nominal_()\` for semantics.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract_nominal(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = mr.PlainDate.from(val);
      const dur = mr.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = date.subtract(dur, { overflow: "constrain" });
      const newDate = new _Iso8601_date();
      newDate.value = result.toString();
      return newDate;
    } catch (e2) {
      throw new Error(`Failed to subtract nominal duration from date: ${e2}`);
    }
  }
  /**
   * Compares this date with another for ordering.
   * @param other - The object to compare with
   * @returns true if this date is less than the other
   */
  less_than(other) {
    if (!(other instanceof _Iso8601_date)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const date1 = mr.PlainDate.from(val);
      const date2 = mr.PlainDate.from(otherVal);
      return new Boolean2(mr.PlainDate.compare(date1, date2) < 0);
    } catch {
      return new Boolean2(val < otherVal);
    }
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Iso8601_date)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const date1 = mr.PlainDate.from(val);
      const date2 = mr.PlainDate.from(otherVal);
      return new Boolean2(mr.PlainDate.compare(date1, date2) === 0);
    } catch {
      return new Boolean2(val === otherVal);
    }
  }
};
var Interval = class _Interval extends Any {
  /**
   * Lower bound.
   */
  lower;
  /**
   * Upper bound.
   */
  upper;
  /**
   * Internal storage for lower_unbounded
   * @protected
   */
  _lower_unbounded;
  /**
   * True if \`_lower_\` boundary open (i.e. = \`-infinity\`).
   */
  get lower_unbounded() {
    return this._lower_unbounded?.value;
  }
  /**
   * Gets the Boolean wrapper object for lower_unbounded.
   * Use this to access Boolean methods.
   */
  get $lower_unbounded() {
    return this._lower_unbounded;
  }
  /**
   * Sets lower_unbounded from either a primitive value or Boolean wrapper.
   */
  set lower_unbounded(val) {
    if (val === void 0 || val === null) {
      this._lower_unbounded = void 0;
    } else if (typeof val === "boolean") {
      this._lower_unbounded = Boolean2.from(val);
    } else {
      this._lower_unbounded = val;
    }
  }
  /**
   * Internal storage for upper_unbounded
   * @protected
   */
  _upper_unbounded;
  /**
   * True if \`_upper_\` boundary open (i.e. = \`+infinity\`).
   */
  get upper_unbounded() {
    return this._upper_unbounded?.value;
  }
  /**
   * Gets the Boolean wrapper object for upper_unbounded.
   * Use this to access Boolean methods.
   */
  get $upper_unbounded() {
    return this._upper_unbounded;
  }
  /**
   * Sets upper_unbounded from either a primitive value or Boolean wrapper.
   */
  set upper_unbounded(val) {
    if (val === void 0 || val === null) {
      this._upper_unbounded = void 0;
    } else if (typeof val === "boolean") {
      this._upper_unbounded = Boolean2.from(val);
    } else {
      this._upper_unbounded = val;
    }
  }
  /**
   * Internal storage for lower_included
   * @protected
   */
  _lower_included;
  /**
   * True if \`_lower_\` boundary value included in range, if \`not _lower_unbounded_\`.
   */
  get lower_included() {
    return this._lower_included?.value;
  }
  /**
   * Gets the Boolean wrapper object for lower_included.
   * Use this to access Boolean methods.
   */
  get $lower_included() {
    return this._lower_included;
  }
  /**
   * Sets lower_included from either a primitive value or Boolean wrapper.
   */
  set lower_included(val) {
    if (val === void 0 || val === null) {
      this._lower_included = void 0;
    } else if (typeof val === "boolean") {
      this._lower_included = Boolean2.from(val);
    } else {
      this._lower_included = val;
    }
  }
  /**
   * Internal storage for upper_included
   * @protected
   */
  _upper_included;
  /**
   * True if \`_upper_\` boundary value included in range if \`not _upper_unbounded_\`.
   */
  get upper_included() {
    return this._upper_included?.value;
  }
  /**
   * Gets the Boolean wrapper object for upper_included.
   * Use this to access Boolean methods.
   */
  get $upper_included() {
    return this._upper_included;
  }
  /**
   * Sets upper_included from either a primitive value or Boolean wrapper.
   */
  set upper_included(val) {
    if (val === void 0 || val === null) {
      this._upper_included = void 0;
    } else if (typeof val === "boolean") {
      this._upper_included = Boolean2.from(val);
    } else {
      this._upper_included = val;
    }
  }
  /**
   * True if current object's interval is semantically same as \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Interval)) {
      return new Boolean2(false);
    }
    const otherInterval = other;
    if (this.lower_unbounded !== otherInterval.lower_unbounded) {
      return new Boolean2(false);
    }
    if (!this.lower_unbounded) {
      if (this.lower === void 0 || otherInterval.lower === void 0) {
        return new Boolean2(false);
      }
      if (!this.lower.is_equal(otherInterval.lower).value) {
        return new Boolean2(false);
      }
      if (this.lower_included !== otherInterval.lower_included) {
        return new Boolean2(false);
      }
    }
    if (this.upper_unbounded !== otherInterval.upper_unbounded) {
      return new Boolean2(false);
    }
    if (!this.upper_unbounded) {
      if (this.upper === void 0 || otherInterval.upper === void 0) {
        return new Boolean2(false);
      }
      if (!this.upper.is_equal(otherInterval.upper).value) {
        return new Boolean2(false);
      }
      if (this.upper_included !== otherInterval.upper_included) {
        return new Boolean2(false);
      }
    }
    return new Boolean2(true);
  }
};
var Proper_interval = class extends Interval {
  /**
   * True if the value \`e\` is properly contained in this Interval.
   * @param e - Parameter
   * @returns Result value
   */
  has(e2) {
    if (!this.lower_unbounded && this.lower !== void 0) {
      const cmp = e2.less_than(this.lower);
      if (cmp.value === true)
        return new Boolean2(false);
      if (!this.lower_included) {
        const eq = e2.is_equal(this.lower);
        if (eq.value === true)
          return new Boolean2(false);
      }
    }
    if (!this.upper_unbounded && this.upper !== void 0) {
      const cmp = this.upper.less_than(e2);
      if (cmp.value === true)
        return new Boolean2(false);
      if (!this.upper_included) {
        const eq = e2.is_equal(this.upper);
        if (eq.value === true)
          return new Boolean2(false);
      }
    }
    return new Boolean2(true);
  }
  /**
   * True if there is any overlap between intervals represented by Current and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  intersects(other) {
    if (!this.upper_unbounded && this.upper !== void 0 && !other.lower_unbounded && other.lower !== void 0) {
      if (this.upper.less_than(other.lower).value) {
        return new Boolean2(false);
      }
      if (this.upper.is_equal(other.lower).value && (!this.upper_included || !other.lower_included)) {
        return new Boolean2(false);
      }
    }
    if (!other.upper_unbounded && other.upper !== void 0 && !this.lower_unbounded && this.lower !== void 0) {
      if (other.upper.less_than(this.lower).value) {
        return new Boolean2(false);
      }
      if (other.upper.is_equal(this.lower).value && (!other.upper_included || !this.lower_included)) {
        return new Boolean2(false);
      }
    }
    return new Boolean2(true);
  }
  /**
   * True if current interval properly contains \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  contains(other) {
    if (!other.lower_unbounded && other.lower !== void 0) {
      if (this.lower_unbounded) {
      } else if (this.lower === void 0) {
        return new Boolean2(false);
      } else {
        if (this.lower.less_than(other.lower).value) {
        } else if (this.lower.is_equal(other.lower).value) {
          if (!this.lower_included && other.lower_included) {
            return new Boolean2(false);
          }
        } else {
          return new Boolean2(false);
        }
      }
    }
    if (!other.upper_unbounded && other.upper !== void 0) {
      if (this.upper_unbounded) {
      } else if (this.upper === void 0) {
        return new Boolean2(false);
      } else {
        if (other.upper.less_than(this.upper).value) {
        } else if (this.upper.is_equal(other.upper).value) {
          if (!this.upper_included && other.upper_included) {
            return new Boolean2(false);
          }
        } else {
          return new Boolean2(false);
        }
      }
    }
    return new Boolean2(true);
  }
};
var Multiplicity_interval = class _Multiplicity_interval extends Proper_interval {
  static {
    TYPE_REGISTRY.set("MULTIPLICITY_INTERVAL", _Multiplicity_interval);
  }
  /**
   * True if this interval imposes no constraints, i.e. is set to `0..*`.
   * @returns Result value
   */
  is_open() {
    const lowerVal = this.lower?.value || 0;
    return new Boolean2(
      lowerVal === 0 && this.upper_unbounded === true
    );
  }
  /**
   * True if this interval expresses optionality, i.e. \`0..1\`.
   * @returns Result value
   */
  is_optional() {
    const lowerVal = this.lower?.value || 0;
    const upperVal = this.upper?.value || 0;
    return new Boolean2(
      lowerVal === 0 && upperVal === 1
    );
  }
  /**
   * True if this interval expresses mandation, i.e. \`1..1\`.
   * @returns Result value
   */
  is_mandatory() {
    const lowerVal = this.lower?.value || 0;
    const upperVal = this.upper?.value || 0;
    return new Boolean2(
      lowerVal === 1 && upperVal === 1
    );
  }
  /**
   * True if this interval is set to \`0..0\`.
   * @returns Result value
   */
  is_prohibited() {
    const lowerVal = this.lower?.value || 0;
    const upperVal = this.upper?.value || 0;
    return new Boolean2(
      lowerVal === 0 && upperVal === 0
    );
  }
};
var Terminology_code = class _Terminology_code extends Any {
  static {
    TYPE_REGISTRY.set("TERMINOLOGY_CODE", _Terminology_code);
  }
  /**
   * Internal storage for terminology_id
   * @protected
   */
  _terminology_id;
  /**
   * The archetype environment namespace identifier used to identify a terminology. Typically a value like \`"snomed_ct"\` that is mapped elsewhere to the full URI identifying the terminology.
   */
  get terminology_id() {
    return this._terminology_id?.value;
  }
  /**
   * Gets the String wrapper object for terminology_id.
   * Use this to access String methods.
   */
  get $terminology_id() {
    return this._terminology_id;
  }
  /**
   * Sets terminology_id from either a primitive value or String wrapper.
   */
  set terminology_id(val) {
    if (val === void 0 || val === null) {
      this._terminology_id = void 0;
    } else if (typeof val === "string") {
      this._terminology_id = String2.from(val);
    } else {
      this._terminology_id = val;
    }
  }
  /**
   * Internal storage for terminology_version
   * @protected
   */
  _terminology_version;
  /**
   * Optional string value representing terminology version, typically a date or dotted numeric.
   */
  get terminology_version() {
    return this._terminology_version?.value;
  }
  /**
   * Gets the String wrapper object for terminology_version.
   * Use this to access String methods.
   */
  get $terminology_version() {
    return this._terminology_version;
  }
  /**
   * Sets terminology_version from either a primitive value or String wrapper.
   */
  set terminology_version(val) {
    if (val === void 0 || val === null) {
      this._terminology_version = void 0;
    } else if (typeof val === "string") {
      this._terminology_version = String2.from(val);
    } else {
      this._terminology_version = val;
    }
  }
  /**
   * Internal storage for code_string
   * @protected
   */
  _code_string;
  /**
   * A terminology code or post-coordinated code expression, if supported by the terminology. The code may refer to a single term, a value set consisting of multiple terms, or some other entity representable within the terminology.
   */
  get code_string() {
    return this._code_string?.value;
  }
  /**
   * Gets the String wrapper object for code_string.
   * Use this to access String methods.
   */
  get $code_string() {
    return this._code_string;
  }
  /**
   * Sets code_string from either a primitive value or String wrapper.
   */
  set code_string(val) {
    if (val === void 0 || val === null) {
      this._code_string = void 0;
    } else if (typeof val === "string") {
      this._code_string = String2.from(val);
    } else {
      this._code_string = val;
    }
  }
  /**
   * The URI reference that may be used as a concrete key into a notional terminology service for queries that can obtain the term text, definition, and other associated elements.
   */
  uri;
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Terminology_code)) {
      return new Boolean2(false);
    }
    const termIdMatch = this.terminology_id === other.terminology_id || this._terminology_id !== void 0 && other._terminology_id !== void 0 && this._terminology_id.is_equal(other._terminology_id).value;
    const codeMatch = this.code_string === other.code_string || this._code_string !== void 0 && other._code_string !== void 0 && this._code_string.is_equal(other._code_string).value;
    const versionMatch = this.terminology_version === other.terminology_version || this._terminology_version === void 0 && other._terminology_version === void 0 || this._terminology_version !== void 0 && other._terminology_version !== void 0 && this._terminology_version.is_equal(other._terminology_version).value;
    return new Boolean2(termIdMatch && codeMatch && versionMatch);
  }
};
var Terminology_term = class _Terminology_term extends Any {
  static {
    TYPE_REGISTRY.set("TERMINOLOGY_TERM", _Terminology_term);
  }
  /**
   * Reference to the terminology concept formally representing this term.
   */
  concept;
  /**
   * Internal storage for text
   * @protected
   */
  _text;
  /**
   * Text of term.
   */
  get text() {
    return this._text?.value;
  }
  /**
   * Gets the String wrapper object for text.
   * Use this to access String methods.
   */
  get $text() {
    return this._text;
  }
  /**
   * Sets text from either a primitive value or String wrapper.
   */
  set text(val) {
    if (val === void 0 || val === null) {
      this._text = void 0;
    } else if (typeof val === "string") {
      this._text = String2.from(val);
    } else {
      this._text = val;
    }
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Terminology_term)) {
      return new Boolean2(false);
    }
    const textMatch = this.text === other.text || this._text !== void 0 && other._text !== void 0 && this._text.is_equal(other._text).value;
    const conceptMatch = this.concept === void 0 && other.concept === void 0 || this.concept !== void 0 && other.concept !== void 0 && this.concept.is_equal(other.concept).value;
    return new Boolean2(textMatch && conceptMatch);
  }
};
var OBJECT_ID = class {
  /**
   * Internal storage for value
   * @protected
   */
  _value;
  /**
   * The value of the id in the form defined below.
   */
  get value() {
    return this._value?.value;
  }
  /**
   * Gets the String wrapper object for value.
   * Use this to access String methods.
   */
  get $value() {
    return this._value;
  }
  /**
   * Sets value from either a primitive value or String wrapper.
   */
  set value(val) {
    if (val === void 0 || val === null) {
      this._value = void 0;
    } else if (typeof val === "string") {
      this._value = String2.from(val);
    } else {
      this._value = val;
    }
  }
};
var ARCHETYPE_ID = class extends OBJECT_ID {
  /**
   * Globally qualified reference model entity, e.g.  \`"openehr-EHR-OBSERVATION"\`.
   * @returns Result value
   */
  qualified_rm_entity() {
    const val = this.value || "";
    const dotIndex = val.indexOf(".");
    if (dotIndex === -1) {
      throw new Error("Invalid ARCHETYPE_ID format: no '.' found");
    }
    return String2.from(val.substring(0, dotIndex));
  }
  /**
   * Name of the concept represented by this archetype, including specialisation, e.g. \`"Biochemistry_result-cholesterol"\`.
   * @returns Result value
   */
  domain_concept() {
    const val = this.value || "";
    const dotIndex = val.indexOf(".");
    const vIndex = val.lastIndexOf(".v");
    if (dotIndex === -1 || vIndex === -1 || vIndex <= dotIndex) {
      throw new Error("Invalid ARCHETYPE_ID format");
    }
    return String2.from(val.substring(dotIndex + 1, vIndex));
  }
  /**
   * Organisation originating the reference model on which this archetype is based, e.g. \`"openEHR"\`, \`"CEN"\`, \`"HL7"\`.
   * @returns Result value
   */
  rm_originator() {
    const qualified = this.qualified_rm_entity().value || "";
    const parts = qualified.split("-");
    if (parts.length < 3) {
      throw new Error("Invalid qualified_rm_entity format");
    }
    return String2.from(parts[0]);
  }
  /**
   * Name of the reference model, e.g. \`"RIM"\`,  \`"EHR"\`,  \`"EN13606"\`.
   * @returns Result value
   */
  rm_name() {
    const qualified = this.qualified_rm_entity().value || "";
    const parts = qualified.split("-");
    if (parts.length < 3) {
      throw new Error("Invalid qualified_rm_entity format");
    }
    return String2.from(parts[1]);
  }
  /**
   * Name of the ontological level within the reference model to which this archetype is targeted, e.g. for openEHR:  \`"FOLDER"\`, \`"COMPOSITION"\`, \`"SECTION"\`, \`"OBSERVATION"\`.
   * @returns Result value
   */
  rm_entity() {
    const qualified = this.qualified_rm_entity().value || "";
    const parts = qualified.split("-");
    if (parts.length < 3) {
      throw new Error("Invalid qualified_rm_entity format");
    }
    return String2.from(parts[2]);
  }
  /**
   * Name of specialisation of concept, if this archetype is a specialisation of another archetype, e.g. \`"cholesterol"\`.
   * @returns Result value
   */
  specialisation() {
    const concept = this.domain_concept().value || "";
    const hyphenIndex = concept.indexOf("-");
    if (hyphenIndex === -1) {
      return String2.from("");
    }
    return String2.from(concept.substring(hyphenIndex + 1));
  }
  /**
   * Version of this archetype.
   *
   * @returns Result value
   */
  version_id() {
    const val = this.value || "";
    const vIndex = val.lastIndexOf(".v");
    if (vIndex === -1) {
      throw new Error("Invalid ARCHETYPE_ID format: no '.v' found");
    }
    return String2.from(val.substring(vIndex + 2));
  }
};
var UID_BASED_ID = class extends OBJECT_ID {
  /**
   * The identifier of the conceptual namespace in which the object exists, within the identification scheme. Returns the part to the left of the first '::' separator, if any, or else the whole string.
   * @returns Result value
   */
  root() {
    const val = this.value || "";
    const separatorIndex = val.indexOf("::");
    const rootValue = separatorIndex === -1 ? val : val.substring(0, separatorIndex);
    if (rootValue.includes("-")) {
      const uuid = new UUID();
      uuid.value = rootValue;
      return uuid;
    } else if (rootValue.match(/^\d+(\.\d+)*$/)) {
      const oid = new ISO_OID();
      oid.value = rootValue;
      return oid;
    } else {
      const internetId = new INTERNET_ID();
      internetId.value = rootValue;
      return internetId;
    }
  }
  /**
   * Optional local identifier of the object within the context of the root identifier. Returns the part to the right of the first '::' separator if any, or else any empty String.
   * @returns Result value
   */
  extension() {
    const val = this.value || "";
    const separatorIndex = val.indexOf("::");
    if (separatorIndex === -1) {
      return String2.from("");
    }
    return String2.from(val.substring(separatorIndex + 2));
  }
  /**
   * True if not \`_extension_.is_empty()\`.
   * @returns Result value
   */
  has_extension() {
    return new Boolean2(!this.extension().is_empty().value);
  }
};
var HIER_OBJECT_ID = class extends UID_BASED_ID {
};
var TERMINOLOGY_ID = class extends OBJECT_ID {
  /**
   * Return the terminology id (which includes the  version  in some cases). Distinct names correspond to distinct (i.e. non-compatible) terminologies. Thus the names  \`"ICD10AM"\` and \`"ICD10"\` refer to distinct terminologies.
   * @returns Result value
   */
  name() {
    const val = this.value || "";
    const parenIndex = val.indexOf("(");
    if (parenIndex > 0) {
      return String2.from(val.substring(0, parenIndex));
    }
    return String2.from(val);
  }
  /**
   * Version of this terminology, if versioning supported, else the empty string.
   * @returns Result value
   */
  version_id() {
    const val = this.value || "";
    const parenIndex = val.indexOf("(");
    if (parenIndex > 0) {
      const closeParenIndex = val.indexOf(")");
      if (closeParenIndex > parenIndex) {
        return String2.from(val.substring(parenIndex + 1, closeParenIndex));
      }
    }
    return String2.from("");
  }
};
var UID = class {
  /**
   * Internal storage for value
   * @protected
   */
  _value;
  /**
   * The value of the id.
   */
  get value() {
    return this._value?.value;
  }
  /**
   * Gets the String wrapper object for value.
   * Use this to access String methods.
   */
  get $value() {
    return this._value;
  }
  /**
   * Sets value from either a primitive value or String wrapper.
   */
  set value(val) {
    if (val === void 0 || val === null) {
      this._value = void 0;
    } else if (typeof val === "string") {
      this._value = String2.from(val);
    } else {
      this._value = val;
    }
  }
};
var UUID = class extends UID {
};
var INTERNET_ID = class extends UID {
};
var ISO_OID = class extends UID {
};
var Iso8601_timezone = class _Iso8601_timezone extends Iso8601_type {
  static {
    TYPE_REGISTRY.set("ISO8601_TIMEZONE", _Iso8601_timezone);
  }
  /**
   * Extract the hour part of timezone, as an Integer in the range `00 - 14`.
   * @returns Result value
   */
  hour() {
    const val = this.value || "";
    if (val === "Z")
      return Integer.from(0);
    const match = val.match(/([+-])(\d{2}):?(\d{2})/);
    if (match) {
      return Integer.from(parseInt(match[2], 10));
    }
    return Integer.from(0);
  }
  /**
   * Extract the minute part of timezone, as an Integer, usually either 0 or 30.
   * @returns Result value
   */
  minute() {
    const val = this.value || "";
    if (val === "Z")
      return Integer.from(0);
    const match = val.match(/([+-])(\d{2}):?(\d{2})?/);
    if (match && match[3]) {
      return Integer.from(parseInt(match[3], 10));
    }
    return Integer.from(0);
  }
  /**
   * Direction of timezone expresssed as +1 or -1.
   * @returns Result value
   */
  sign() {
    const val = this.value || "";
    if (val === "Z")
      return Integer.from(1);
    const match = val.match(/([+-])/);
    if (match) {
      return Integer.from(match[1] === "+" ? 1 : -1);
    }
    return Integer.from(1);
  }
  /**
   * Indicates whether minute part known.
   * @returns Result value
   */
  minute_unknown() {
    const val = this.value || "";
    if (val === "Z")
      return new Boolean2(false);
    const match = val.match(/([+-])(\d{2}):?(\d{2})?/);
    return new Boolean2(!match || !match[3]);
  }
  /**
   * True if this time zone is partial, i.e. if minutes is missing.
   * @returns Result value
   */
  is_partial() {
    return this.minute_unknown();
  }
  /**
   * True if this time-zone uses ‘:’ separators.
   * @returns Result value
   */
  is_extended() {
    const val = this.value || "";
    return new Boolean2(val.includes(":"));
  }
  /**
   * True if timezone is UTC, i.e. \`+0000\` or \`Z\`.
   * @returns Result value
   */
  is_gmt() {
    const val = this.value || "";
    if (val === "Z")
      return new Boolean2(true);
    const match = val.match(/([+-])(\d{2}):?(\d{2})?/);
    if (match) {
      const hours = parseInt(match[2], 10);
      const minutes = match[3] ? parseInt(match[3], 10) : 0;
      return new Boolean2(hours === 0 && minutes === 0);
    }
    return new Boolean2(false);
  }
  /**
   * Return timezone string in extended format.
   * @returns Result value
   */
  as_string() {
    const val = this.value || "";
    if (val === "Z")
      return String2.from("Z");
    const match = val.match(/([+-])(\d{2}):?(\d{2})?/);
    if (match) {
      const sign = match[1];
      const hours = match[2];
      const minutes = match[3] || "00";
      return String2.from(`${sign}${hours}:${minutes}`);
    }
    return String2.from(val);
  }
  /**
   * Compares this timezone with another for ordering.
   * Timezones are ordered by their offset from UTC in minutes.
   * @param other - The object to compare with
   * @returns true if this timezone is less than the other
   */
  less_than(other) {
    if (!(other instanceof _Iso8601_timezone)) {
      return new Boolean2(false);
    }
    const thisSign = this.sign().value || 1;
    const thisHour = this.hour().value || 0;
    const thisMinute = this.minute().value || 0;
    const thisOffset = thisSign * (thisHour * 60 + thisMinute);
    const otherSign = other.sign().value || 1;
    const otherHour = other.hour().value || 0;
    const otherMinute = other.minute().value || 0;
    const otherOffset = otherSign * (otherHour * 60 + otherMinute);
    return new Boolean2(thisOffset < otherOffset);
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Iso8601_timezone)) {
      return new Boolean2(false);
    }
    const thisSign = this.sign().value || 1;
    const thisHour = this.hour().value || 0;
    const thisMinute = this.minute().value || 0;
    const thisOffset = thisSign * (thisHour * 60 + thisMinute);
    const otherSign = other.sign().value || 1;
    const otherHour = other.hour().value || 0;
    const otherMinute = other.minute().value || 0;
    const otherOffset = otherSign * (otherHour * 60 + otherMinute);
    return new Boolean2(thisOffset === otherOffset);
  }
};
var CODE_PHRASE = class _CODE_PHRASE {
  /**
   * Identifier of the distinct terminology from which the code_string (or its elements) was extracted.
   */
  terminology_id;
  /**
   * Internal storage for code_string
   * @protected
   */
  _code_string;
  /**
   * The key used by the terminology service to identify a concept or coordination of concepts. This string is most likely parsable inside the terminology service, but nothing can be assumed about its syntax outside that context.
   */
  get code_string() {
    return this._code_string?.value;
  }
  /**
   * Gets the String wrapper object for code_string.
   * Use this to access String methods.
   */
  get $code_string() {
    return this._code_string;
  }
  /**
   * Sets code_string from either a primitive value or String wrapper.
   */
  set code_string(val) {
    if (val === void 0 || val === null) {
      this._code_string = void 0;
    } else if (typeof val === "string") {
      this._code_string = String2.from(val);
    } else {
      this._code_string = val;
    }
  }
  /**
   * Internal storage for preferred_term
   * @protected
   */
  _preferred_term;
  /**
   * Optional attribute to carry preferred term corresponding to the code or expression in \`_code_string_\`. Typical use in integration situations which create mappings, and representing data for which both a (non-preferred) actual term and a preferred term are both required.
   */
  get preferred_term() {
    return this._preferred_term?.value;
  }
  /**
   * Gets the String wrapper object for preferred_term.
   * Use this to access String methods.
   */
  get $preferred_term() {
    return this._preferred_term;
  }
  /**
   * Sets preferred_term from either a primitive value or String wrapper.
   */
  set preferred_term(val) {
    if (val === void 0 || val === null) {
      this._preferred_term = void 0;
    } else if (typeof val === "string") {
      this._preferred_term = String2.from(val);
    } else {
      this._preferred_term = val;
    }
  }
  /**
   * Factory method to create a CODE_PHRASE.
   * @param terminologyId - The terminology identifier
   * @param codeString - The code string
   * @returns A new CODE_PHRASE instance
   */
  static from(terminologyId, codeString) {
    const codePhrase = new _CODE_PHRASE();
    const termId = new TERMINOLOGY_ID();
    termId.value = terminologyId;
    codePhrase.terminology_id = termId;
    codePhrase.code_string = codeString;
    return codePhrase;
  }
  /**
   * Compare two CODE_PHRASE objects for equality.
   * @param other - The other object to compare with
   * @returns Boolean indicating if they are equal
   */
  is_equal(other) {
    if (!(other instanceof _CODE_PHRASE)) {
      return new Boolean2(false);
    }
    if (!this.terminology_id || !other.terminology_id) {
      return new Boolean2(this.terminology_id === other.terminology_id);
    }
    if (this.terminology_id.value !== other.terminology_id.value) {
      return new Boolean2(false);
    }
    if (this.code_string !== other.code_string) {
      return new Boolean2(false);
    }
    return new Boolean2(true);
  }
};
var AUTHORED_RESOURCE = class {
  /**
   * Unique identifier of the family of archetypes having the same interface identifier (same major version).
   */
  uid;
  /**
   * Language in which this resource was initially authored. Although there is no language primacy of resources overall, the language of original authoring is required to ensure natural language translations can preserve quality. Language is relevant in both the description and ontology sections.
   */
  original_language;
  /**
   * Description and lifecycle information of the resource.
   */
  description;
  /**
   * Internal storage for is_controlled
   * @protected
   */
  _is_controlled;
  /**
   * True if this resource is under any kind of change control (even file copying), in which case revision history is created.
   */
  get is_controlled() {
    return this._is_controlled?.value;
  }
  /**
   * Gets the Boolean wrapper object for is_controlled.
   * Use this to access Boolean methods.
   */
  get $is_controlled() {
    return this._is_controlled;
  }
  /**
   * Sets is_controlled from either a primitive value or Boolean wrapper.
   */
  set is_controlled(val) {
    if (val === void 0 || val === null) {
      this._is_controlled = void 0;
    } else if (typeof val === "boolean") {
      this._is_controlled = Boolean2.from(val);
    } else {
      this._is_controlled = val;
    }
  }
  /**
   * Annotations on individual items within the resource, keyed by path. The inner table takes the form of a Hash table of String values keyed by String tags.
   */
  annotations;
  /**
   * List of details for each natural translation made of this resource, keyed by language code. For each translation listed here, there must be corresponding sections in all language-dependent parts of the resource. The \`_original_language_\` does not appear in this list.
   */
  translations;
  /**
   * Most recent revision in revision_history if is_controlled else  (uncontrolled) .
   * @returns Result value
   */
  current_revision() {
    if (!this.is_controlled) {
      return String2.from("(uncontrolled)");
    }
    return String2.from("1.0.0");
  }
  /**
   * Total list of languages available in this resource, derived from original_language and translations.
   * @returns Result value
   */
  languages_available() {
    if (this.original_language?.code_string) {
      return String2.from(this.original_language.code_string);
    }
    return String2.from("");
  }
};
var RESOURCE_DESCRIPTION = class {
  /**
   * Original author of this resource, with all relevant details, including organisation.
   */
  original_author;
  /**
   * Internal storage for original_namespace
   * @protected
   */
  _original_namespace;
  /**
   * Namespace of original author's organisation, in reverse internet form, if applicable.
   */
  get original_namespace() {
    return this._original_namespace?.value;
  }
  /**
   * Gets the String wrapper object for original_namespace.
   * Use this to access String methods.
   */
  get $original_namespace() {
    return this._original_namespace;
  }
  /**
   * Sets original_namespace from either a primitive value or String wrapper.
   */
  set original_namespace(val) {
    if (val === void 0 || val === null) {
      this._original_namespace = void 0;
    } else if (typeof val === "string") {
      this._original_namespace = String2.from(val);
    } else {
      this._original_namespace = val;
    }
  }
  /**
   * Internal storage for original_publisher
   * @protected
   */
  _original_publisher;
  /**
   * Plain text name of organisation that originally published this artefact, if any.
   */
  get original_publisher() {
    return this._original_publisher?.value;
  }
  /**
   * Gets the String wrapper object for original_publisher.
   * Use this to access String methods.
   */
  get $original_publisher() {
    return this._original_publisher;
  }
  /**
   * Sets original_publisher from either a primitive value or String wrapper.
   */
  set original_publisher(val) {
    if (val === void 0 || val === null) {
      this._original_publisher = void 0;
    } else if (typeof val === "string") {
      this._original_publisher = String2.from(val);
    } else {
      this._original_publisher = val;
    }
  }
  /**
   * Other contributors to the resource, each listed in "name <email>"  form.
   */
  other_contributors;
  /**
   * Lifecycle state of the resource, typically including states such as: initial, in_development, in_review, published, superseded, obsolete.
   */
  lifecycle_state;
  /**
   * Reference to owning resource.
   */
  parent_resource;
  /**
   * Internal storage for custodian_namespace
   * @protected
   */
  _custodian_namespace;
  /**
   * Namespace in reverse internet id form, of current custodian organisation.
   */
  get custodian_namespace() {
    return this._custodian_namespace?.value;
  }
  /**
   * Gets the String wrapper object for custodian_namespace.
   * Use this to access String methods.
   */
  get $custodian_namespace() {
    return this._custodian_namespace;
  }
  /**
   * Sets custodian_namespace from either a primitive value or String wrapper.
   */
  set custodian_namespace(val) {
    if (val === void 0 || val === null) {
      this._custodian_namespace = void 0;
    } else if (typeof val === "string") {
      this._custodian_namespace = String2.from(val);
    } else {
      this._custodian_namespace = val;
    }
  }
  /**
   * Internal storage for custodian_organisation
   * @protected
   */
  _custodian_organisation;
  /**
   * Plain text name of current custodian organisation.
   */
  get custodian_organisation() {
    return this._custodian_organisation?.value;
  }
  /**
   * Gets the String wrapper object for custodian_organisation.
   * Use this to access String methods.
   */
  get $custodian_organisation() {
    return this._custodian_organisation;
  }
  /**
   * Sets custodian_organisation from either a primitive value or String wrapper.
   */
  set custodian_organisation(val) {
    if (val === void 0 || val === null) {
      this._custodian_organisation = void 0;
    } else if (typeof val === "string") {
      this._custodian_organisation = String2.from(val);
    } else {
      this._custodian_organisation = val;
    }
  }
  /**
   * Internal storage for copyright
   * @protected
   */
  _copyright;
  /**
   * Optional copyright statement for the resource as a knowledge resource.
   */
  get copyright() {
    return this._copyright?.value;
  }
  /**
   * Gets the String wrapper object for copyright.
   * Use this to access String methods.
   */
  get $copyright() {
    return this._copyright;
  }
  /**
   * Sets copyright from either a primitive value or String wrapper.
   */
  set copyright(val) {
    if (val === void 0 || val === null) {
      this._copyright = void 0;
    } else if (typeof val === "string") {
      this._copyright = String2.from(val);
    } else {
      this._copyright = val;
    }
  }
  /**
   * Internal storage for licence
   * @protected
   */
  _licence;
  /**
   * Licence of current artefact, in format "short licence name <URL of licence>", e.g. "Apache 2.0 License <http://www.apache.org/licenses/LICENSE-2.0.html>"
   */
  get licence() {
    return this._licence?.value;
  }
  /**
   * Gets the String wrapper object for licence.
   * Use this to access String methods.
   */
  get $licence() {
    return this._licence;
  }
  /**
   * Sets licence from either a primitive value or String wrapper.
   */
  set licence(val) {
    if (val === void 0 || val === null) {
      this._licence = void 0;
    } else if (typeof val === "string") {
      this._licence = String2.from(val);
    } else {
      this._licence = val;
    }
  }
  /**
   * List of acknowledgements of other IP directly referenced in this archetype, typically terminology codes, ontology ids etc. Recommended keys are the widely known name or namespace for the IP source, as shown in the following example:
   *
   * ----
   * ip_acknowledgements = <
   *     ["loinc"] = <"This content from LOINC® is copyright © 1995 Regenstrief Institute, Inc. and the LOINC Committee, and available at no cost under the license at http://loinc.org/terms-of-use">
   *     ["snomedct"] = <"Content from SNOMED CT® is copyright © 2007 IHTSDO <ihtsdo.org>">
   * >
   * ----
   */
  ip_acknowledgements;
  /**
   * List of references of material on which this artefact is based, as a keyed list of strings. The keys should be in a standard citation format.
   */
  references;
  /**
   * Internal storage for resource_package_uri
   * @protected
   */
  _resource_package_uri;
  /**
   * URI of package to which this resource belongs.
   */
  get resource_package_uri() {
    return this._resource_package_uri?.value;
  }
  /**
   * Gets the String wrapper object for resource_package_uri.
   * Use this to access String methods.
   */
  get $resource_package_uri() {
    return this._resource_package_uri;
  }
  /**
   * Sets resource_package_uri from either a primitive value or String wrapper.
   */
  set resource_package_uri(val) {
    if (val === void 0 || val === null) {
      this._resource_package_uri = void 0;
    } else if (typeof val === "string") {
      this._resource_package_uri = String2.from(val);
    } else {
      this._resource_package_uri = val;
    }
  }
  /**
   * Details related to conversion process that generated this model from an original, if relevant, as a list of name/value pairs. Typical example with recommended tags:
   *
   * ----
   * conversion_details = <
   *     ["source_model"] = <"CEM model xyz <http://location.in.clinicalelementmodels.com>">
   *     ["tool"] = <"cem2adl v6.3.0">
   *     ["time"] = <"2014-11-03T09:05:00">
   * >
   * ----
   */
  conversion_details;
  /**
   * Additional non-language-sensitive resource meta-data, as a list of name/value pairs.
   */
  other_details;
  /**
   * Details of all parts of resource description that are natural language-dependent, keyed by language code.
   */
  details;
};
var RESOURCE_ANNOTATIONS = class {
  /**
   * Documentary annotations in a multi-level keyed structure.
   */
  documentation;
};

// enhanced/openehr_lang.ts
var EXPR_VALUE = class {
  /**
   * The computed value of this node as a result of the nodes below it, for operator nodes, or else statically set or otherwise derived values.
   * @returns Result value
   */
  value() {
    throw new Error("Method value not yet implemented.");
  }
};
var EXPRESSION = class extends EXPR_VALUE {
  /**
   * The primitive type of this node, which must be determined by redefinitions in concrete classes.
   * @returns Result value
   */
  type() {
    throw new Error("Method type not yet implemented.");
  }
};
var EXPR_LEAF = class extends EXPRESSION {
  /**
   * The reference item from which the value of this node can be computed.
   */
  item;
};
var EXPR_VALUE_REF = class extends EXPR_LEAF {
};

// enhanced/openehr_am.ts
var ARCHETYPE = class extends AUTHORED_RESOURCE {
  /**
   * Root node of the definition of this archetype.
   */
  definition;
  /**
   * The ontology of the archetype.
   */
  ontology;
  /**
   * Internal storage for adl_version
   * @protected
   */
  _adl_version;
  /**
   * ADL version if archetype was read in from an ADL sharable archetype.
   */
  get adl_version() {
    return this._adl_version?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for adl_version.
   * Use this to access openehr_base.String methods.
   */
  get $adl_version() {
    return this._adl_version;
  }
  /**
   * Sets adl_version from either a primitive value or openehr_base.String wrapper.
   */
  set adl_version(val) {
    if (val === void 0 || val === null) {
      this._adl_version = void 0;
    } else if (typeof val === "string") {
      this._adl_version = String2.from(val);
    } else {
      this._adl_version = val;
    }
  }
  /**
   * Multi-axial identifier of this archetype in archetype space.
   */
  archetype_id;
  /**
   * Archetype OID (HIER_OBJECT_ID). Distinct from AUTHORED_RESOURCE.uid (UUID) in the BASE model.
   */
  archetype_hier_uid;
  /**
   * Internal storage for concept
   * @protected
   */
  _concept;
  /**
   * The normative meaning of the archetype as a whole, expressed as a local archetype code, typically “at0000”.
   */
  get concept() {
    return this._concept?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for concept.
   * Use this to access openehr_base.String methods.
   */
  get $concept() {
    return this._concept;
  }
  /**
   * Sets concept from either a primitive value or openehr_base.String wrapper.
   */
  set concept(val) {
    if (val === void 0 || val === null) {
      this._concept = void 0;
    } else if (typeof val === "string") {
      this._concept = String2.from(val);
    } else {
      this._concept = val;
    }
  }
  /**
   * Identifier of the specialisation parent of this archetype.
   */
  parent_archetype_id;
  /**
   * Invariant statements about this object. Statements are expressed in first order predicate logic, and usually refer to at least two attributes.
   */
  invariants;
  /**
   * The concept name of the archetype in language a_lang; corresponds to the term definition of the concept attribute in the archetype ontology.
   * @param a_lang - Parameter
   * @returns Result value
   */
  concept_name(a_lang) {
    throw new Error("Method concept_name not yet implemented.");
  }
  /**
   * Set of language-independent paths extracted from archetype. Paths obey Xpath-like syntax and are formed from alternations of C_OBJECT.node_id and C_ATTRIBUTE.rm_attribute_name values.
   * @returns Result value
   */
  physical_paths() {
    throw new Error("Method physical_paths not yet implemented.");
  }
  /**
   * Set of language-dependent paths extracted from archetype. Paths obey the same syntax as physical_paths, but with node_ids replaced by their meanings from the ontology.
   * @param lang - Parameter
   * @returns Result value
   */
  logical_paths(lang) {
    throw new Error("Method logical_paths not yet implemented.");
  }
  /**
   * Specialisation depth of this archetype; larger than 0 if this archetype has a parent. Derived from terminology.specialisation_depth.
   * @returns Result value
   */
  specialisation_depth() {
    throw new Error("Method specialisation_depth not yet implemented.");
  }
  /**
   * True if this archetype is a specialisation of another.
   * @returns Result value
   */
  is_specialised() {
    throw new Error("Method is_specialised not yet implemented.");
  }
  /**
   * True if the archetype is valid overall; various tests should be used, including checks on node_ids, internal references, and constraint references.
   * @returns Result value
   */
  is_valid() {
    throw new Error("Method is_valid not yet implemented.");
  }
  /**
   * True if every node_id found on a C_OBJECT node is found in ontology.term_codes.
   * @returns Result value
   */
  node_ids_valid() {
    throw new Error("Method node_ids_valid not yet implemented.");
  }
  /**
   * Version of predecessor archetype of this archetype, if any.
   * @returns Result value
   */
  previous_version() {
    throw new Error("Method previous_version not yet implemented.");
  }
  /**
   * True if every ARCHETYPE_INTERNAL_REF. target_path refers to a legitimate node in the archetype definition.
   * @returns Result value
   */
  internal_references_valid() {
    throw new Error("Method internal_references_valid not yet implemented.");
  }
  /**
   * True if every CONSTRAINT_REF.reference found on a C_OBJECT node in the archetype definition is found in ontology.constraint_codes.
   * @returns Result value
   */
  constraint_references_valid() {
    throw new Error("Method constraint_references_valid not yet implemented.");
  }
  /**
   * The short concept name of the archetype extracted from the archetype_id.
   * @returns Result value
   */
  short_concept_name() {
    throw new Error("Method short_concept_name not yet implemented.");
  }
  version() {
    throw new Error("Method version not yet implemented.");
  }
};
var AUTHORED_ARCHETYPE = class extends ARCHETYPE {
  /**
   * ADL version if archetype was read in from an ADL sharable archetype.
   */
  get adl_version() {
    return this._adl_version?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for adl_version.
   * Use this to access openehr_base.String methods.
   */
  get $adl_version() {
    return this._adl_version;
  }
  /**
   * Sets adl_version from either a primitive value or openehr_base.String wrapper.
   */
  set adl_version(val) {
    if (val === void 0 || val === null) {
      this._adl_version = void 0;
    } else if (typeof val === "string") {
      this._adl_version = String2.from(val);
    } else {
      this._adl_version = val;
    }
  }
  /**
   * Unique identifier of this archetype artefact instance. A new identifier is assigned every time the content is changed by a tool. Used by tools to distinguish different revisions and/or interim snapshots of the same artefact.
   */
  build_uid;
  /**
   * Internal storage for rm_release
   * @protected
   */
  _rm_release;
  /**
   * Semver.org compatible release of the most recent reference model release on which the archetype in its current version is based. This does not imply conformance only to this release, since an archetype may be valid with respect to multiple releases of a reference model.
   */
  get rm_release() {
    return this._rm_release?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for rm_release.
   * Use this to access openehr_base.String methods.
   */
  get $rm_release() {
    return this._rm_release;
  }
  /**
   * Sets rm_release from either a primitive value or openehr_base.String wrapper.
   */
  set rm_release(val) {
    if (val === void 0 || val === null) {
      this._rm_release = void 0;
    } else if (typeof val === "string") {
      this._rm_release = String2.from(val);
    } else {
      this._rm_release = val;
    }
  }
  /**
   * Internal storage for is_generated
   * @protected
   */
  _is_generated;
  /**
   * If True, indicates that this artefact was machine-generated from some other source, in which case, tools would expect to overwrite this artefact on a new generation. Editing tools should set this value to False when a user starts to manually edit an archetype.
   */
  get is_generated() {
    return this._is_generated?.value;
  }
  /**
   * Gets the openehr_base.Boolean wrapper object for is_generated.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_generated() {
    return this._is_generated;
  }
  /**
   * Sets is_generated from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_generated(val) {
    if (val === void 0 || val === null) {
      this._is_generated = void 0;
    } else if (typeof val === "boolean") {
      this._is_generated = Boolean2.from(val);
    } else {
      this._is_generated = val;
    }
  }
  other_meta_data;
};
var TEMPLATE = class extends AUTHORED_ARCHETYPE {
  /**
   * Overlay archetypes, i.e. partial archetypes that include full definition and terminology, but logically derive all their meta-data from the owning template.
   */
  overlays;
};
var OPERATIONAL_TEMPLATE = class extends AUTHORED_ARCHETYPE {
  /**
   * Compendium of flattened terminologies of archetypes  referenced from this template, keyed by archetype identifier. This will almost always be present in a template.
   */
  component_terminologies;
  /**
   * Compendium of flattened terminology extracts (i.e. from external terminologies) from archetypes referenced from this template, keyed by archetype identifier.
   */
  terminology_extracts;
  component_terminology(an_id) {
    throw new Error("Method component_terminology not yet implemented.");
  }
};
var TEMPLATE_OVERLAY = class extends ARCHETYPE {
};
var ARCHETYPE_CONSTRAINT = class {
  /**
   * True if constraints represented by this node, ignoring any sub-parts, are narrower or the same as other.
   * Typically used during validation of special-ised archetype nodes.
   * @param other - Parameter
   * @returns Result value
   */
  is_subset_of(_other) {
    return Boolean2.from(false);
  }
  is_valid() {
    return Boolean2.from(true);
  }
  /**
   * Path of this node relative to root of archetype.
   * @returns Result value
   */
  path() {
    throw new Error("Method path not yet implemented.");
  }
  /**
   * True if the relative path a_path exists at this node.
   * @param a_path - Parameter
   * @returns Result value
   */
  has_path(a_path) {
    throw new Error("Method has_path not yet implemented.");
  }
};
var C_OBJECT = class extends ARCHETYPE_CONSTRAINT {
  /**
   * Internal storage for rm_type_name
   * @protected
   */
  _rm_type_name;
  /**
   * Reference model type that this node corresponds to.
   */
  get rm_type_name() {
    return this._rm_type_name?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for rm_type_name.
   * Use this to access openehr_base.String methods.
   */
  get $rm_type_name() {
    return this._rm_type_name;
  }
  /**
   * Sets rm_type_name from either a primitive value or openehr_base.String wrapper.
   */
  set rm_type_name(val) {
    if (val === void 0 || val === null) {
      this._rm_type_name = void 0;
    } else if (typeof val === "string") {
      this._rm_type_name = String2.from(val);
    } else {
      this._rm_type_name = val;
    }
  }
  /**
   * Occurrences of this object node in the data, under the owning attribute. Upper limit can only be greater than 1 if owning attribute has a cardinality of more than 1).
   */
  occurrences;
  /**
   * Internal storage for node_id
   * @protected
   */
  _node_id;
  /**
   * Semantic identifier of this node, used to dis-tinguish sibling nodes. All nodes must have a node_id; for nodes under a container C_ATTRIBUTE, the id must be an id-code must be defined in the archetype terminolo-gy. For valid structures, all node ids are id-codes.
   * For C_PRIMITIVE_OBJECTs, it will have the special value Primitive_node_id.
   */
  get node_id() {
    return this._node_id?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for node_id.
   * Use this to access openehr_base.String methods.
   */
  get $node_id() {
    return this._node_id;
  }
  /**
   * Sets node_id from either a primitive value or openehr_base.String wrapper.
   */
  set node_id(val) {
    if (val === void 0 || val === null) {
      this._node_id = void 0;
    } else if (typeof val === "string") {
      this._node_id = String2.from(val);
    } else {
      this._node_id = val;
    }
  }
};
var C_ATTRIBUTE = class extends ARCHETYPE_CONSTRAINT {
  /**
   * Internal storage for rm_attribute_name
   * @protected
   */
  _rm_attribute_name;
  /**
   * Reference model attribute within the enclosing type represented by a C_OBJECT.
   */
  get rm_attribute_name() {
    return this._rm_attribute_name?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for rm_attribute_name.
   * Use this to access openehr_base.String methods.
   */
  get $rm_attribute_name() {
    return this._rm_attribute_name;
  }
  /**
   * Sets rm_attribute_name from either a primitive value or openehr_base.String wrapper.
   */
  set rm_attribute_name(val) {
    if (val === void 0 || val === null) {
      this._rm_attribute_name = void 0;
    } else if (typeof val === "string") {
      this._rm_attribute_name = String2.from(val);
    } else {
      this._rm_attribute_name = val;
    }
  }
  /**
   * Constraint on every attribute, regardless of whether it is singular or of a container type, which indicates whether its target object exists or not (i.e. is mandatory or not).
   */
  existence;
  /**
   * Child C_OBJECT nodes. Each such node represents a constraint on the type of this attribute in its reference model. Multiples occur both for multiple items in the case of container attributes, and alternatives in the case of singular attributes.
   */
  children;
  /**
   * True if any value (i.e. instance) of the reference model attribute represented by this C_ATTIRBUTE is allowed.
   * @returns Result value
   */
  any_allowed() {
    throw new Error("Method any_allowed not yet implemented.");
  }
};
var C_DEFINED_OBJECT = class extends C_OBJECT {
  /**
   * Value to be assumed if none sent in data.
   */
  assumed_value;
  /**
   * True if a_value is valid with respect to constraint expressed in concrete instance of this type.
   * @param a_value - Parameter
   * @returns Result value
   */
  valid_value(_a_value) {
    return Boolean2.from(true);
  }
  /**
   * Generate a prototype value from this constraint object.
   * @returns Result value
   */
  prototype_value() {
    if (this.assumed_value !== void 0) {
      return this.assumed_value;
    }
    throw new Error("Method prototype_value not yet implemented.");
  }
  /**
   * True if there is an assumed value.
   *
   * @returns Result value
   */
  has_assumed_value() {
    throw new Error("Method has_assumed_value not yet implemented.");
  }
  /**
   * Generate a default value from this constraint object (runtime computation).
   * @returns Result value
   */
  compute_default_value() {
    if (this.assumed_value !== void 0) {
      return this.assumed_value;
    }
    throw new Error("No assumed value for compute_default_value.");
  }
  /**
   * True if any value of the reference model type being constrained is allowed. Redefine in descendants.
   * @returns Result value
   */
  any_allowed() {
    return Boolean2.from(false);
  }
};
var C_REFERENCE_OBJECT = class extends C_OBJECT {
};
var ARCHETYPE_SLOT = class extends C_REFERENCE_OBJECT {
  /**
   * List of constraints defining other archetypes that could be included at this point.
   */
  includes;
  /**
   * List of constraints defining other archetypes that cannot be included at this point.
   */
  excludes;
};
var C_PRIMITIVE_OBJECT = class extends C_DEFINED_OBJECT {
  /**
   * Object actually defining the constraint.
   */
  item;
  /**
   * True if any value of the type being constrained in item is allowed.
   * @returns Result value
   */
  any_allowed() {
    throw new Error("Method any_allowed not yet implemented.");
  }
};
var C_COMPLEX_OBJECT = class extends C_DEFINED_OBJECT {
  /**
   * List of constraints on attributes of the reference model type represented by this object.
   */
  attributes;
  /**
   * True if any value of the reference model type being constrained is allowed.
   * @returns Result value
   */
  any_allowed() {
    throw new Error("Method any_allowed not yet implemented.");
  }
};
var C_ARCHETYPE_ROOT = class extends C_COMPLEX_OBJECT {
  /**
   * Internal storage for archetype_ref
   * @protected
   */
  _archetype_ref;
  /**
   * Reference to archetype is being used to fill a slot or redefine an external reference. Typically an 'interface' archetype id, i.e. identifier with partial version information.
   */
  get archetype_ref() {
    return this._archetype_ref?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for archetype_ref.
   * Use this to access openehr_base.String methods.
   */
  get $archetype_ref() {
    return this._archetype_ref;
  }
  /**
   * Sets archetype_ref from either a primitive value or openehr_base.String wrapper.
   */
  set archetype_ref(val) {
    if (val === void 0 || val === null) {
      this._archetype_ref = void 0;
    } else if (typeof val === "string") {
      this._archetype_ref = String2.from(val);
    } else {
      this._archetype_ref = val;
    }
  }
};
var ARCHETYPE_ID_CONSTRAINT = class {
  /**
   * Right hand side of the constraint expression, in the form of a \`C_STRING\`, i.e. string value constrainer.
   */
  constraint;
};
var C_PRIMITIVE = class {
  /**
   * Value to be assumed if none sent in data.
   */
  assumed_value;
  /**
   * Generate a default value from this constraint object.
   * @returns Result value
   */
  compute_default_value() {
    if (this.assumed_value !== void 0) {
      return this.assumed_value;
    }
    throw new Error("No assumed value for compute_default_value.");
  }
  has_assumed_value() {
    return Boolean2.from(this.assumed_value !== void 0);
  }
  valid_value(_a_value) {
    return Boolean2.from(true);
  }
};
var C_BOOLEAN = class extends C_PRIMITIVE {
  /**
   * Internal storage for true_valid
   * @protected
   */
  _true_valid;
  /**
   * True if the value True is allowed.
   */
  get true_valid() {
    return this._true_valid?.value;
  }
  /**
   * Gets the openehr_base.Boolean wrapper object for true_valid.
   * Use this to access openehr_base.Boolean methods.
   */
  get $true_valid() {
    return this._true_valid;
  }
  /**
   * Sets true_valid from either a primitive value or openehr_base.Boolean wrapper.
   */
  set true_valid(val) {
    if (val === void 0 || val === null) {
      this._true_valid = void 0;
    } else if (typeof val === "boolean") {
      this._true_valid = Boolean2.from(val);
    } else {
      this._true_valid = val;
    }
  }
  /**
   * Internal storage for false_valid
   * @protected
   */
  _false_valid;
  /**
   * True if the value False is allowed.
   */
  get false_valid() {
    return this._false_valid?.value;
  }
  /**
   * Gets the openehr_base.Boolean wrapper object for false_valid.
   * Use this to access openehr_base.Boolean methods.
   */
  get $false_valid() {
    return this._false_valid;
  }
  /**
   * Sets false_valid from either a primitive value or openehr_base.Boolean wrapper.
   */
  set false_valid(val) {
    if (val === void 0 || val === null) {
      this._false_valid = void 0;
    } else if (typeof val === "boolean") {
      this._false_valid = Boolean2.from(val);
    } else {
      this._false_valid = val;
    }
  }
  /**
   * The value to assume if this item is not included in data, due to being part of an optional structure.
   */
  assumed_value = void 0;
};
var C_STRING = class extends C_PRIMITIVE {
  /**
   * Internal storage for pattern
   * @protected
   */
  _pattern;
  /**
   * Regular expression pattern for proposed instances of String to match.
   */
  get pattern() {
    return this._pattern?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for pattern.
   * Use this to access openehr_base.String methods.
   */
  get $pattern() {
    return this._pattern;
  }
  /**
   * Sets pattern from either a primitive value or openehr_base.String wrapper.
   */
  set pattern(val) {
    if (val === void 0 || val === null) {
      this._pattern = void 0;
    } else if (typeof val === "string") {
      this._pattern = String2.from(val);
    } else {
      this._pattern = val;
    }
  }
  /**
   * Set of Strings specifying constraint.
   */
  list;
  /**
   * Internal storage for list_open
   * @protected
   */
  _list_open;
  /**
   * True if the list is being used to specify the constraint but is not considered exhaustive.
   */
  get list_open() {
    return this._list_open?.value;
  }
  /**
   * Gets the openehr_base.Boolean wrapper object for list_open.
   * Use this to access openehr_base.Boolean methods.
   */
  get $list_open() {
    return this._list_open;
  }
  /**
   * Sets list_open from either a primitive value or openehr_base.Boolean wrapper.
   */
  set list_open(val) {
    if (val === void 0 || val === null) {
      this._list_open = void 0;
    } else if (typeof val === "boolean") {
      this._list_open = Boolean2.from(val);
    } else {
      this._list_open = val;
    }
  }
  /**
   * The value to assume if this item is not included in data, due to being part of an optional structure.
   */
  assumed_value = void 0;
  /**
   * True if a_value is valid with respect to constraint expressed in concrete instance of this type.
   * @param a_value - Parameter
   * @returns Result value
   */
  valid_value(a_value) {
    throw new Error("Method valid_value not yet implemented.");
  }
};
var C_INTEGER = class extends C_PRIMITIVE {
  /**
   * Set of Integers specifying constraint.
   */
  list;
  /**
   * Range of Integers specifying constraint.
   */
  range;
  /**
   * The value to assume if this item is not included in data, due to being part of an optional structure.
   */
  assumed_value = void 0;
};
var C_REAL = class extends C_PRIMITIVE {
  /**
   * Set of Reals specifying constraint.
   */
  list;
  /**
   * Range of Real specifying constraint.
   */
  range;
  /**
   * The value to assume if this item is not included in data, due to being part of an optional structure.
   */
  assumed_value = void 0;
};
var C_TERMINOLOGY_CODE = class extends C_PRIMITIVE_OBJECT {
  /**
   * Internal storage for constraint
   * @protected
   */
  _constraint;
  /**
   * Type of individual constraint - a single string that can either be a local at-code, or a local ac-code signifying a locally defined value set. If an ac-code, assumed_value may contain an at-code from the value set of the ac-code.
   *
   * Use an empty string for no constraint.
   */
  get constraint() {
    return this._constraint?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for constraint.
   * Use this to access openehr_base.String methods.
   */
  get $constraint() {
    return this._constraint;
  }
  /**
   * Sets constraint from either a primitive value or openehr_base.String wrapper.
   */
  set constraint(val) {
    if (val === void 0 || val === null) {
      this._constraint = void 0;
    } else if (typeof val === "string") {
      this._constraint = String2.from(val);
    } else {
      this._constraint = val;
    }
  }
  /**
   * Assumed Terminology code value.
   */
  assumed_value = void 0;
  default_value;
  /**
   * Constraint status of this terminology constraint. If Void, the meaning is as follows:
   *
   * * in a top-level  archetype, equivalent to \`required\`;
   * * in a specialised (source) archetype, the meaning is to inherit the value from the corresponding node in the parent.
   *
   * In the case of a specialised archetype generated by flattening, the value of this field will be:
   *
   * * Void if it was Void in the parent;
   * * otherwise, it will carry the same value as in the parent.
   */
  constraint_status;
  /**
   * True if \`_constraint_status_\` is defined and equals \`required\` OR if Void. I.e. in archetypes where \`C_TERMINOLOGY_CODE\` instances have no \`_constraint_status_\`, the \`required\` status is assumed, which applies to all legacy archetypes.
   * @returns Result value
   */
  constraint_required() {
    throw new Error("Method constraint_required not yet implemented.");
  }
  /**
   * Return the effective integer value of the \`_constraint_status_\` field if it exists. If it is null, return 0, i.e. \`required\`.
   *
   * NOTE: the above logic applies to any \`C_TERMINOLOGY_NODE\` instance in a specialised archetype that redefines another such instance in the flat parent. I.e. no stated \`_constraint_status_\` means \`required\`.
   * @returns Result value
   */
  effective_constraint_status() {
    throw new Error("Method effective_constraint_status not yet implemented.");
  }
  /**
   * Effective set of at-code values corresponding to an ac-code for a locally defined value set. Not defined for ac-codes that have no local value set.
   * @returns Result value
   */
  value_set_expanded() {
    throw new Error("Method value_set_expanded not yet implemented.");
  }
  /**
   * For locally defined value sets within individual code bindings: return the term URI(s) substituted from bindings for local at-codes in \`_value_set_expanded_\`.
   * @returns Result value
   */
  value_set_substituted() {
    throw new Error("Method value_set_substituted not yet implemented.");
  }
  /**
   * For locally defined value sets within individual code bindings: final set of external codes to which value set is resolved.
   * @returns Result value
   */
  value_set_resolved() {
    throw new Error("Method value_set_resolved not yet implemented.");
  }
  /**
   * True if a \`_value_\` is valid with respect to constraint expressed in concrete instance of this type.
   * @param a_value - Parameter
   * @returns Result value
   */
  valid_value(a_value) {
    throw new Error("Method valid_value not yet implemented.");
  }
  /**
   * A generated prototype value from this constraint object.
   * @returns Result value
   */
  prototype_value() {
    throw new Error("Method prototype_value not yet implemented.");
  }
  /**
   * True if \`_constraint_\` is empty.
   * @returns Result value
   */
  any_allowed() {
    throw new Error("Method any_allowed not yet implemented.");
  }
  /**
   * True if \`_other.any_allowed_\` or else every constraint in the \`_constraint_\` list exists in the \`_other.constraint_\`, and \`_effective_constraint_status()_\` is <= \`_other.effective_constraint_status()_\`.
   * @param other - Parameter
   * @returns Result value
   */
  c_value_conforms_to(other) {
    throw new Error("Method c_value_conforms_to not yet implemented.");
  }
  /**
   * True if \`_constraint_\` and \`_other.constraint_\` are both value-set ids, and expand to identical value sets, or else are identical value codes; and \`_effective_constraint_status()_\` = \`_other.effective_constraint_status()_\`.
   * @param other - Parameter
   * @returns Result value
   */
  c_value_congruent_to(other) {
    throw new Error("Method c_value_congruent_to not yet implemented.");
  }
};
var RM_OVERLAY = class {
  /**
   * Optional structure in which visibility and aliasing of reference model elements can be specified. Key is path to an RM attribute, which is typically formed from a path to an archetyped node concatenated with a further pure RM attribute path; may also refer to a non-archetyped attribute.
   */
  rm_visibility;
};
var EXPR_ITEM = class {
  /**
   * Internal storage for type
   * @protected
   */
  _type;
  /**
   * Type name of this item in the mathematical sense. For leaf nodes, must be the name of a primitive type, or else a reference model type. The type for any relational or boolean operator will be “Boolean”, while the type for any arithmetic operator, will be “Real” or “Integer”.
   */
  get type() {
    return this._type?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for type.
   * Use this to access openehr_base.String methods.
   */
  get $type() {
    return this._type;
  }
  /**
   * Sets type from either a primitive value or openehr_base.String wrapper.
   */
  set type(val) {
    if (val === void 0 || val === null) {
      this._type = void 0;
    } else if (typeof val === "string") {
      this._type = String2.from(val);
    } else {
      this._type = val;
    }
  }
};
var EXPR_ARCHETYPE_REF = class extends EXPR_VALUE_REF {
  /**
   * Internal storage for path
   * @protected
   */
  _path;
  /**
   * The path to the archetype node.
   */
  get path() {
    return this._path?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for path.
   * Use this to access openehr_base.String methods.
   */
  get $path() {
    return this._path;
  }
  /**
   * Sets path from either a primitive value or openehr_base.String wrapper.
   */
  set path(val) {
    if (val === void 0 || val === null) {
      this._path = void 0;
    } else if (typeof val === "string") {
      this._path = String2.from(val);
    } else {
      this._path = val;
    }
  }
};
var C_DOMAIN_TYPE = class extends C_DEFINED_OBJECT {
  /**
   * Standard (i.e. C_OBJECT) form of constraint.
   * @returns Result value
   */
  standard_equivalent() {
    return new C_COMPLEX_OBJECT();
  }
};
var C_CODED_TEXT = class extends C_DOMAIN_TYPE {
  /**
   * Internal storage for terminology
   * @protected
   */
  _terminology;
  /**
   * Terminology identifier.
   */
  get terminology() {
    return this._terminology?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for terminology.
   * Use this to access openehr_base.String methods.
   */
  get $terminology() {
    return this._terminology;
  }
  /**
   * Sets terminology from either a primitive value or openehr_base.String wrapper.
   */
  set terminology(val) {
    if (val === void 0 || val === null) {
      this._terminology = void 0;
    } else if (typeof val === "string") {
      this._terminology = String2.from(val);
    } else {
      this._terminology = val;
    }
  }
  /**
   * Optional list of codes from the terminology. No list means any code from the terminology is allowed.
   */
  code_list;
  /**
   * Internal storage for reference
   * @protected
   */
  _reference;
  get reference() {
    return this._reference?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for reference.
   * Use this to access openehr_base.String methods.
   */
  get $reference() {
    return this._reference;
  }
  /**
   * Sets reference from either a primitive value or openehr_base.String wrapper.
   */
  set reference(val) {
    if (val === void 0 || val === null) {
      this._reference = void 0;
    } else if (typeof val === "string") {
      this._reference = String2.from(val);
    } else {
      this._reference = val;
    }
  }
};
var C_QUANTITY = class extends C_DOMAIN_TYPE {
  /**
   * Internal storage for property
   * @protected
   */
  _property;
  /**
   * Name of physical property for Quantities being constrained.
   */
  get property() {
    return this._property?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for property.
   * Use this to access openehr_base.String methods.
   */
  get $property() {
    return this._property;
  }
  /**
   * Sets property from either a primitive value or openehr_base.String wrapper.
   */
  set property(val) {
    if (val === void 0 || val === null) {
      this._property = void 0;
    } else if (typeof val === "string") {
      this._property = String2.from(val);
    } else {
      this._property = val;
    }
  }
  /**
   * Value set of allowed individual Quantity item constraints in this Quantity constraint.
   */
  list;
};
var C_QUANTITY_ITEM = class {
  /**
   * Quantity magnitude constraint.
   */
  magnitude;
  /**
   * Internal storage for units
   * @protected
   */
  _units;
  /**
   * Optional units constraint.
   */
  get units() {
    return this._units?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for units.
   * Use this to access openehr_base.String methods.
   */
  get $units() {
    return this._units;
  }
  /**
   * Sets units from either a primitive value or openehr_base.String wrapper.
   */
  set units(val) {
    if (val === void 0 || val === null) {
      this._units = void 0;
    } else if (typeof val === "string") {
      this._units = String2.from(val);
    } else {
      this._units = val;
    }
  }
};
var ASSERTION = class {
  /**
   * Internal storage for tag
   * @protected
   */
  _tag;
  /**
   * Expression tag, used for differentiating multiple assertions.
   */
  get tag() {
    return this._tag?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for tag.
   * Use this to access openehr_base.String methods.
   */
  get $tag() {
    return this._tag;
  }
  /**
   * Sets tag from either a primitive value or openehr_base.String wrapper.
   */
  set tag(val) {
    if (val === void 0 || val === null) {
      this._tag = void 0;
    } else if (typeof val === "string") {
      this._tag = String2.from(val);
    } else {
      this._tag = val;
    }
  }
  /**
   * Internal storage for string_expression
   * @protected
   */
  _string_expression;
  /**
   * String form of expression, in case an expression evaluator taking String expressions is used for evaluation.
   */
  get string_expression() {
    return this._string_expression?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for string_expression.
   * Use this to access openehr_base.String methods.
   */
  get $string_expression() {
    return this._string_expression;
  }
  /**
   * Sets string_expression from either a primitive value or openehr_base.String wrapper.
   */
  set string_expression(val) {
    if (val === void 0 || val === null) {
      this._string_expression = void 0;
    } else if (typeof val === "string") {
      this._string_expression = String2.from(val);
    } else {
      this._string_expression = val;
    }
  }
  /**
   * Root of expression tree.
   */
  expression;
  /**
   * Definitions of variables used in the assertion expression.
   */
  variables;
};
var ASSERTION_VARIABLE = class {
  /**
   * Internal storage for name
   * @protected
   */
  _name;
  /**
   * Name of variable.
   */
  get name() {
    return this._name?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name() {
    return this._name;
  }
  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val) {
    if (val === void 0 || val === null) {
      this._name = void 0;
    } else if (typeof val === "string") {
      this._name = String2.from(val);
    } else {
      this._name = val;
    }
  }
  /**
   * Internal storage for definition
   * @protected
   */
  _definition;
  /**
   * Formal definition of the variable.
   */
  get definition() {
    return this._definition?.value;
  }
  /**
   * Gets the openehr_base.String wrapper object for definition.
   * Use this to access openehr_base.String methods.
   */
  get $definition() {
    return this._definition;
  }
  /**
   * Sets definition from either a primitive value or openehr_base.String wrapper.
   */
  set definition(val) {
    if (val === void 0 || val === null) {
      this._definition = void 0;
    } else if (typeof val === "string") {
      this._definition = String2.from(val);
    } else {
      this._definition = val;
    }
  }
};
var EXPR_OPERATOR = class extends EXPR_ITEM {
  /**
   * Internal storage for precedence_overridden
   * @protected
   */
  _precedence_overridden;
  /**
   * True if the natural precedence of operators is overridden in the expression represented by this node of the expression tree. If True, parentheses should be introduced around the totality of the syntax expression corresponding to this operator node and its operands.
   */
  get precedence_overridden() {
    return this._precedence_overridden?.value;
  }
  /**
   * Gets the openehr_base.Boolean wrapper object for precedence_overridden.
   * Use this to access openehr_base.Boolean methods.
   */
  get $precedence_overridden() {
    return this._precedence_overridden;
  }
  /**
   * Sets precedence_overridden from either a primitive value or openehr_base.Boolean wrapper.
   */
  set precedence_overridden(val) {
    if (val === void 0 || val === null) {
      this._precedence_overridden = void 0;
    } else if (typeof val === "boolean") {
      this._precedence_overridden = Boolean2.from(val);
    } else {
      this._precedence_overridden = val;
    }
  }
  /**
   * Code of operator.
   */
  operator;
};
var EXPR_UNARY_OPERATOR = class extends EXPR_OPERATOR {
  /**
   * Operand node.
   */
  operand;
};
var EXPR_BINARY_OPERATOR = class extends EXPR_OPERATOR {
  /**
   * Left operand node.
   */
  left_operand;
  /**
   * Right operand node.
   */
  right_operand;
};
var OPERATOR_KIND = class extends String2 {
};
var CARDINALITY = class {
  /**
   * The interval of this cardinality.
   */
  interval;
  /**
   * Internal storage for is_ordered
   * @protected
   */
  _is_ordered;
  /**
   * True if the members of the container attribute to which this cardinality refers are ordered.
   */
  get is_ordered() {
    return this._is_ordered?.value;
  }
  /**
   * Gets the openehr_base.Boolean wrapper object for is_ordered.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_ordered() {
    return this._is_ordered;
  }
  /**
   * Sets is_ordered from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_ordered(val) {
    if (val === void 0 || val === null) {
      this._is_ordered = void 0;
    } else if (typeof val === "boolean") {
      this._is_ordered = Boolean2.from(val);
    } else {
      this._is_ordered = val;
    }
  }
  /**
   * Internal storage for is_unique
   * @protected
   */
  _is_unique;
  /**
   * True if the members of the container attribute to which this cardinality refers are unique.
   */
  get is_unique() {
    return this._is_unique?.value;
  }
  /**
   * Gets the openehr_base.Boolean wrapper object for is_unique.
   * Use this to access openehr_base.Boolean methods.
   */
  get $is_unique() {
    return this._is_unique;
  }
  /**
   * Sets is_unique from either a primitive value or openehr_base.Boolean wrapper.
   */
  set is_unique(val) {
    if (val === void 0 || val === null) {
      this._is_unique = void 0;
    } else if (typeof val === "boolean") {
      this._is_unique = Boolean2.from(val);
    } else {
      this._is_unique = val;
    }
  }
  /**
   * True if the semantics of this cardinality represent a bag, i.e. unordered, non-unique membership.
   * @returns Result value
   */
  is_bag() {
    throw new Error("Method is_bag not yet implemented.");
  }
  /**
   * True if the semantics of this cardinality represent a list, i.e. ordered, non-unique membership.
   * @returns Result value
   */
  is_list() {
    throw new Error("Method is_list not yet implemented.");
  }
  /**
   * True if the semantics of this cardinality represent a bag, i.e. unordered, non-unique membership.
   * @returns Result value
   */
  is_set() {
    throw new Error("Method is_set not yet implemented.");
  }
};
var C_SINGLE_ATTRIBUTE = class extends C_ATTRIBUTE {
  /**
   * List of alternative constraints for the single child of this attribute within the data.
   * @returns Result value
   */
  alternatives() {
    throw new Error("Method alternatives not yet implemented.");
  }
};
var C_MULTIPLE_ATTRIBUTE = class extends C_ATTRIBUTE {
  /**
   * Cardinality of this attribute constraint, if it constraints a container attribute.
   */
  cardinality;
  /**
   * List of constraints representing members of the container value of this attribute within the data. Semantics of the uniqueness and ordering of items in the container are given by the cardinality.
   * @returns Result value
   */
  members() {
    throw new Error("Method members not yet implemented.");
  }
};
var ARCHETYPE_ONTOLOGY = class {
  /**
   * List of all term codes in the ontology. Most of these correspond to “at” codes in an ADL archetype, which are the node_ids on C_OBJECT descendants. There may be an extra one, if a different term is used as the overall archetype concept from that used as the node_id of the outermost C_OBJECT in the definition part.
   */
  term_codes;
  /**
   * List of all term codes in the ontology. These correspond to the “ac” codes in an ADL archetype, or equivalently, the CONSTRAINT_REF.reference values in the archetype definition.
   */
  constraint_codes;
  /**
   * Archetype which owns this terminology.
   */
  parent_archetype;
  /**
   * List of terminologies to which term or constraint bindings exist in this terminology.
   */
  terminologies_available;
  /**
   * Internal storage for specialisation_depth
   * @protected
   */
  _specialisation_depth;
  /**
   * Specialisation depth of this archetype. Unspecialised archetypes have depth 0, with each additional level of specialisation adding 1 to the specialisation_depth.
   */
  get specialisation_depth() {
    return this._specialisation_depth?.value;
  }
  /**
   * Gets the openehr_base.Integer wrapper object for specialisation_depth.
   * Use this to access openehr_base.Integer methods.
   */
  get $specialisation_depth() {
    return this._specialisation_depth;
  }
  /**
   * Sets specialisation_depth from either a primitive value or openehr_base.Integer wrapper.
   */
  set specialisation_depth(val) {
    if (val === void 0 || val === null) {
      this._specialisation_depth = void 0;
    } else if (typeof val === "number") {
      this._specialisation_depth = Integer.from(val);
    } else {
      this._specialisation_depth = val;
    }
  }
  term_attribute_names;
  /**
   * True if terminology ‘a_terminology’ is present in archetype ontology.
   * @param a_lang - Parameter
   * @returns Result value
   */
  has_language(a_lang) {
    throw new Error("Method has_language not yet implemented.");
  }
  /**
   * True if terminology \`a_terminology' is present in archetype ontology.
   * @param a_terminology_id - Parameter
   * @returns Result value
   */
  has_terminology(a_terminology_id) {
    throw new Error("Method has_terminology not yet implemented.");
  }
  /**
   * True if term_codes has a_code.
   * @param a_code - Parameter
   * @returns Result value
   */
  has_term_code(a_code) {
    throw new Error("Method has_term_code not yet implemented.");
  }
  /**
   * True if constraint_codes has a_code.
   * @param a_code - Parameter
   * @returns Result value
   */
  has_constraint_code(a_code) {
    throw new Error("Method has_constraint_code not yet implemented.");
  }
  /**
   * Term definition for a code, in a specified language.
   * @param a_lang - Parameter
   * @param a_code - Parameter
   * @returns Result value
   */
  term_definition(a_lang, a_code) {
    throw new Error("Method term_definition not yet implemented.");
  }
  /**
   * Constraint definition for a code, in a specified language.
   * @param a_code - Parameter
   * @param a_lang - Parameter
   * @returns Result value
   */
  constraint_definition(a_code, a_lang) {
    throw new Error("Method constraint_definition not yet implemented.");
  }
  /**
   * Binding of constraint corresponding to a_code in target external terminology a_terminology_id, as a string, which is usually a formal query expression.
   * @param a_terminology - Parameter
   * @param a_code - Parameter
   * @returns Result value
   */
  term_binding(a_terminology, a_code) {
    throw new Error("Method term_binding not yet implemented.");
  }
  /**
   * Binding of constraint corresponding to a_code in target external terminology a_terminology_id, as a string, which is usually a formal query expression.
   * @param a_terminology_id - Parameter
   * @param a_code - Parameter
   * @returns Result value
   */
  constraint_binding(a_terminology_id, a_code) {
    throw new Error("Method constraint_binding not yet implemented.");
  }
};

// enhanced/am/aom_clone.ts
function cloneMultiplicity(src) {
  if (!src)
    return void 0;
  const m2 = new Multiplicity_interval();
  m2.lower = src.lower;
  m2.upper = src.upper;
  m2.lower_unbounded = src.lower_unbounded;
  m2.upper_unbounded = src.upper_unbounded;
  return m2;
}
function cloneCObject(obj) {
  if (obj instanceof C_COMPLEX_OBJECT) {
    return cloneComplexObject(obj);
  }
  if (obj instanceof C_ARCHETYPE_ROOT) {
    const root2 = new C_ARCHETYPE_ROOT();
    copyComplexFields(obj, root2);
    root2.archetype_ref = obj.archetype_ref;
    return root2;
  }
  if (obj instanceof ARCHETYPE_SLOT) {
    const slot = new ARCHETYPE_SLOT();
    copyObjectFields(obj, slot);
    const includes = obj.includes;
    if (includes) {
      slot.includes = includes.map(cloneArchetypeIdConstraint);
    }
    const excludes = obj.excludes;
    if (excludes) {
      slot.excludes = excludes.map(cloneArchetypeIdConstraint);
    }
    return slot;
  }
  if (obj instanceof C_PRIMITIVE_OBJECT) {
    const prim = new C_PRIMITIVE_OBJECT();
    copyObjectFields(obj, prim);
    return prim;
  }
  return obj;
}
function cloneArchetypeIdConstraint(c2) {
  const out = new ARCHETYPE_ID_CONSTRAINT();
  if (c2.constraint) {
    const s2 = new C_STRING();
    s2.pattern = c2.constraint.pattern;
    out.constraint = s2;
  }
  return out;
}
function copyObjectFields(src, dest) {
  dest.rm_type_name = src.rm_type_name;
  dest.node_id = src.node_id;
  if (src.occurrences) {
    dest.occurrences = cloneMultiplicity(src.occurrences);
  }
}
function copyComplexFields(src, dest) {
  copyObjectFields(src, dest);
  if (src.attributes) {
    dest.attributes = src.attributes.map(cloneAttribute);
  }
}
function cloneComplexObject(obj) {
  if (obj instanceof C_ARCHETYPE_ROOT) {
    const root2 = new C_ARCHETYPE_ROOT();
    copyComplexFields(obj, root2);
    root2.archetype_ref = obj.archetype_ref;
    return root2;
  }
  const out = new C_COMPLEX_OBJECT();
  copyComplexFields(obj, out);
  return out;
}
function cloneAttribute(attr) {
  const out = attr instanceof C_MULTIPLE_ATTRIBUTE ? new C_MULTIPLE_ATTRIBUTE() : new C_SINGLE_ATTRIBUTE();
  out.rm_attribute_name = attr.rm_attribute_name;
  const existence = attr.existence;
  if (existence) {
    out.existence = cloneMultiplicity(existence);
  }
  if (attr instanceof C_MULTIPLE_ATTRIBUTE && attr.cardinality) {
    const ma2 = out;
    const card = new CARDINALITY();
    const interval2 = attr.cardinality.interval ?? attr.cardinality.interval;
    if (interval2) {
      card.interval = cloneMultiplicity(interval2);
    }
    card.is_ordered = attr.cardinality.is_ordered;
    card.is_unique = attr.cardinality.is_unique;
    ma2.cardinality = card;
  }
  const children2 = attr.children;
  if (children2) {
    out.children = children2.map(
      cloneCObject
    );
  }
  return out;
}

// enhanced/am/flattening/specialize.ts
function attributeChildren(attr) {
  return attr.children ?? [];
}
function setAttributeChildren(attr, children2) {
  attr.children = children2;
}
function findAttribute(obj, name) {
  return obj.attributes?.find((a2) => a2.rm_attribute_name === name);
}
function mergeCObject(parent, child) {
  if (child instanceof C_COMPLEX_OBJECT && parent instanceof C_COMPLEX_OBJECT) {
    return specializeComplexObject(parent, child);
  }
  return cloneCObject(child);
}
function specializeComplexObject(parentFlat, differential) {
  const result = cloneComplexObject(parentFlat);
  if (differential.occurrences) {
    result.occurrences = differential.occurrences;
  }
  if (!differential.attributes?.length) {
    return result;
  }
  if (!result.attributes) {
    result.attributes = [];
  }
  for (const diffAttr of differential.attributes) {
    const name = diffAttr.rm_attribute_name;
    if (!name)
      continue;
    const existing = findAttribute(result, name);
    if (!existing) {
      result.attributes.push(cloneAttribute(diffAttr));
      continue;
    }
    const diffChildren = attributeChildren(diffAttr);
    if (!diffChildren.length) {
      const existence = diffAttr.existence;
      if (existence !== void 0) {
        existing.existence = existence;
      }
      if (diffAttr instanceof C_MULTIPLE_ATTRIBUTE) {
        const ma2 = existing;
        if (diffAttr.cardinality) {
          ma2.cardinality = diffAttr.cardinality;
        }
      }
      continue;
    }
    const mergedChildren = attributeChildren(existing).map(cloneCObject);
    for (const diffChild of diffChildren) {
      const nodeId = diffChild.node_id;
      if (!nodeId) {
        mergedChildren.push(cloneCObject(diffChild));
        continue;
      }
      const idx = mergedChildren.findIndex((c2) => c2.node_id === nodeId);
      if (idx < 0) {
        mergedChildren.push(cloneCObject(diffChild));
        continue;
      }
      const parentChild = mergedChildren[idx];
      if (parentChild instanceof C_COMPLEX_OBJECT && diffChild instanceof C_COMPLEX_OBJECT) {
        mergedChildren[idx] = mergeCObject(parentChild, diffChild);
      } else {
        mergedChildren[idx] = cloneCObject(diffChild);
      }
    }
    setAttributeChildren(existing, mergedChildren);
  }
  return result;
}

// enhanced/am/flattening/template_flattener.ts
function flattenArchetypeDefinition(archetype, resolver) {
  if (!archetype.definition)
    return void 0;
  let flat = cloneComplexObject(archetype.definition);
  const parentId = archetype.parent_archetype_id?.value ?? archetype.parent_archetype_id?.toString();
  if (parentId) {
    const parent = resolver.resolve(parentId);
    if (parent?.definition) {
      const parentFlat = flattenArchetypeDefinition(parent, resolver) ?? parent.definition;
      flat = specializeComplexObject(parentFlat, archetype.definition);
    }
  }
  return resolveSlotsInTree(flat, resolver);
}
function resolveSlotsInTree(root2, resolver) {
  const walkObject = (obj) => {
    if (obj instanceof ARCHETYPE_SLOT) {
      return resolveArchetypeSlot(obj, resolver);
    }
    if (obj instanceof C_ARCHETYPE_ROOT) {
      return inlineArchetypeRoot(obj, resolver);
    }
    if (obj instanceof C_COMPLEX_OBJECT) {
      if (!obj.attributes)
        return obj;
      for (const attr of obj.attributes) {
        const children2 = attr.children;
        if (!children2)
          continue;
        attr.children = children2.map(
          walkObject
        );
      }
    }
    return obj;
  };
  if (!root2.attributes)
    return root2;
  for (const attr of root2.attributes) {
    const children2 = attr.children;
    if (!children2)
      continue;
    attr.children = children2.map(
      walkObject
    );
  }
  return root2;
}
function firstIncludePattern(slot) {
  const includes = slot.includes;
  const first = includes?.[0];
  return first?.constraint?.pattern;
}
function resolveArchetypeSlot(slot, resolver) {
  const pattern = firstIncludePattern(slot);
  if (!pattern)
    return slot;
  const arch = resolver.resolve(pattern);
  if (!arch?.definition)
    return slot;
  const filler = flattenArchetypeDefinition(arch, resolver) ?? arch.definition;
  const inlined = cloneComplexObject(filler);
  inlined.node_id = slot.node_id ?? inlined.node_id;
  inlined.rm_type_name = slot.rm_type_name ?? inlined.rm_type_name;
  if (slot.occurrences)
    inlined.occurrences = slot.occurrences;
  return inlined;
}
function inlineArchetypeRoot(root2, resolver) {
  const ref = root2.archetype_ref;
  if (!ref)
    return root2;
  const arch = resolver.resolve(ref);
  if (!arch?.definition)
    return root2;
  const filler = flattenArchetypeDefinition(arch, resolver) ?? arch.definition;
  const inlined = cloneComplexObject(filler);
  inlined.node_id = root2.node_id ?? inlined.node_id;
  inlined.rm_type_name = root2.rm_type_name ?? inlined.rm_type_name;
  if (root2.occurrences)
    inlined.occurrences = root2.occurrences;
  if (root2.attributes?.length) {
    return specializeComplexObject(inlined, root2);
  }
  return inlined;
}
function flattenToOperationalTemplate(source, resolver) {
  const opt = new OPERATIONAL_TEMPLATE();
  opt.archetype_id = source.archetype_id;
  opt.uid = source.uid;
  opt.concept = source.concept;
  opt.parent_archetype_id = source.parent_archetype_id;
  opt.original_language = source.original_language;
  opt.description = source.description;
  opt.ontology = source.ontology;
  opt.adl_version = source.adl_version ?? "2.0";
  opt.rm_release = source.rm_release;
  opt.is_generated = true;
  if (source instanceof TEMPLATE) {
    opt.definition = source.definition ? resolveSlotsInTree(cloneComplexObject(source.definition), resolver) : void 0;
  } else {
    opt.definition = flattenArchetypeDefinition(source, resolver);
  }
  return opt;
}

// enhanced/parser/adl2_tokenizer.ts
var ADL2Tokenizer = class {
  input;
  position = 0;
  line = 1;
  column = 1;
  tokens = [];
  constructor(input) {
    this.input = input;
  }
  /**
   * Tokenize the input ADL2 text
   */
  tokenize() {
    this.tokens = [];
    if (this.input.charCodeAt(0) === 65279) {
      this.position = 1;
      this.column = 2;
    }
    while (!this.isAtEnd()) {
      this.skipWhitespaceAndComments();
      if (this.isAtEnd())
        break;
      const token = this.nextToken();
      if (token) {
        this.tokens.push(token);
      }
    }
    this.tokens.push({
      type: "EOF" /* EOF */,
      value: "",
      line: this.line,
      column: this.column
    });
    return this.tokens;
  }
  nextToken() {
    const start2 = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    const char = this.peek();
    switch (char) {
      case "(":
        this.advance();
        return this.makeToken("LPAREN" /* LPAREN */, "(", startLine, startColumn);
      case ")":
        this.advance();
        return this.makeToken("RPAREN" /* RPAREN */, ")", startLine, startColumn);
      case "[":
        this.advance();
        return this.makeToken("LBRACKET" /* LBRACKET */, "[", startLine, startColumn);
      case "]":
        this.advance();
        return this.makeToken("RBRACKET" /* RBRACKET */, "]", startLine, startColumn);
      case "{":
        this.advance();
        return this.makeToken("LBRACE" /* LBRACE */, "{", startLine, startColumn);
      case "}":
        this.advance();
        return this.makeToken("RBRACE" /* RBRACE */, "}", startLine, startColumn);
      case "<": {
        if (this.previousCharsMatch(2, "..")) {
          this.advance();
          if (this.peek() === "=") {
            this.advance();
            return this.makeToken("IDENTIFIER" /* IDENTIFIER */, "<=", startLine, startColumn);
          }
          if (this.isDigit(this.peek())) {
            return this.makeToken("IDENTIFIER" /* IDENTIFIER */, "<", startLine, startColumn);
          }
        }
        this.advance();
        return this.makeToken("LANGLE" /* LANGLE */, "<", startLine, startColumn);
      }
      case ">": {
        const before = this.charBefore();
        if (before === "|" || before === "{") {
          this.advance();
          if (this.peek() === "=") {
            this.advance();
            return this.makeToken("IDENTIFIER" /* IDENTIFIER */, ">=", startLine, startColumn);
          }
          if (this.isDigit(this.peek())) {
            return this.makeToken("IDENTIFIER" /* IDENTIFIER */, ">", startLine, startColumn);
          }
        }
        this.advance();
        return this.makeToken("RANGLE" /* RANGLE */, ">", startLine, startColumn);
      }
      case ",":
        this.advance();
        return this.makeToken("COMMA" /* COMMA */, ",", startLine, startColumn);
      case ";":
        this.advance();
        return this.makeToken("SEMICOLON" /* SEMICOLON */, ";", startLine, startColumn);
      case "=":
        this.advance();
        return this.makeToken("EQUALS" /* EQUALS */, "=", startLine, startColumn);
      case "!":
        this.advance();
        if (this.peek() === "=") {
          this.advance();
          return this.makeToken("NOT_EQUALS" /* NOT_EQUALS */, "!=", startLine, startColumn);
        }
        return this.makeToken("NOT" /* NOT */, "!", startLine, startColumn);
      case "$": {
        this.advance();
        let varName = "$";
        while (!this.isAtEnd() && this.isIdentifierPart(this.peek())) {
          varName += this.peek();
          this.advance();
        }
        return this.makeToken("VARIABLE" /* VARIABLE */, varName, startLine, startColumn);
      }
      case "*":
        this.advance();
        return this.makeToken("STAR" /* STAR */, "*", startLine, startColumn);
      case "/": {
        if (this.charBefore() === "{") {
          return this.scanRegex(startLine, startColumn);
        }
        this.advance();
        if (this.peek() === "=") {
          this.advance();
          return this.makeToken("NOT_EQUALS" /* NOT_EQUALS */, "/=", startLine, startColumn);
        }
        return this.makeToken("SLASH" /* SLASH */, "/", startLine, startColumn);
      }
      case "|":
        this.advance();
        return this.makeToken("PIPE" /* PIPE */, "|", startLine, startColumn);
    }
    if (char === ".") {
      this.advance();
      if (this.peek() === ".") {
        this.advance();
        return this.makeToken("ELLIPSIS" /* ELLIPSIS */, "..", startLine, startColumn);
      }
      return this.makeToken("DOT" /* DOT */, ".", startLine, startColumn);
    }
    if (char === ":") {
      this.advance();
      if (this.peek() === "=") {
        this.advance();
        return this.makeToken("ASSIGN" /* ASSIGN */, ":=", startLine, startColumn);
      }
      if (this.peek() === ":") {
        this.advance();
        return this.makeToken("DOUBLE_COLON" /* DOUBLE_COLON */, "::", startLine, startColumn);
      }
      return this.makeToken("COLON" /* COLON */, ":", startLine, startColumn);
    }
    if (char === '"') {
      return this.scanString(startLine, startColumn);
    }
    if (this.isDigit(char) || char === "-" && this.isDigit(this.peekNext())) {
      return this.scanNumber(startLine, startColumn);
    }
    if (this.isIdentifierStart(char)) {
      return this.scanIdentifierOrKeyword(startLine, startColumn);
    }
    if (char === "?" || char === "X") {
      this.advance();
      return this.makeToken("IDENTIFIER" /* IDENTIFIER */, char, startLine, startColumn);
    }
    if (char === "\\" && !this.isAtEnd()) {
      this.advance();
      const escaped = this.advance();
      return this.makeToken("IDENTIFIER" /* IDENTIFIER */, `\\${escaped}`, startLine, startColumn);
    }
    throw new Error(
      `Unexpected character '${char}' at line ${this.line}, column ${this.column}`
    );
  }
  scanRegex(startLine, startColumn) {
    this.advance();
    let value = "";
    while (!this.isAtEnd()) {
      if (this.peek() === "/") {
        const next = this.peekNext();
        if (next === "}" || next === ")" || next === "," || next === ";" || next === "\n" || next === "\r") {
          break;
        }
      }
      if (this.peek() === "\\") {
        this.advance();
        value += "\\" + this.peek();
      } else {
        value += this.peek();
      }
      this.advance();
    }
    if (this.isAtEnd() || this.peek() !== "/") {
      throw new Error(
        `Unterminated regex at line ${startLine}, column ${startColumn}`
      );
    }
    this.advance();
    return this.makeToken("REGEX" /* REGEX */, value, startLine, startColumn);
  }
  scanString(startLine, startColumn) {
    this.advance();
    let value = "";
    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === "\\") {
        this.advance();
        const next = this.peek();
        switch (next) {
          case "n":
            value += "\n";
            break;
          case "t":
            value += "	";
            break;
          case "r":
            value += "\r";
            break;
          case "\\":
            value += "\\";
            break;
          case '"':
            value += '"';
            break;
          default:
            value += next;
        }
        this.advance();
      } else {
        value += this.peek();
        this.advance();
      }
    }
    if (this.isAtEnd()) {
      throw new Error(
        `Unterminated string at line ${startLine}, column ${startColumn}`
      );
    }
    this.advance();
    return this.makeToken("STRING" /* STRING */, value, startLine, startColumn);
  }
  scanNumber(startLine, startColumn) {
    let value = "";
    let hasDecimal = false;
    if (this.peek() === "-") {
      value += this.peek();
      this.advance();
    }
    while (!this.isAtEnd() && (this.isDigit(this.peek()) || this.peek() === ".")) {
      if (this.peek() === ".") {
        if (!this.isDigit(this.peekNext()))
          break;
        hasDecimal = true;
      }
      value += this.peek();
      this.advance();
    }
    return this.makeToken(
      hasDecimal ? "REAL" /* REAL */ : "INTEGER" /* INTEGER */,
      value,
      startLine,
      startColumn
    );
  }
  scanIdentifierOrKeyword(startLine, startColumn) {
    let value = "";
    if (this.peek() === "a") {
      const next = this.peekNext();
      if (next === "t" || next === "c") {
        const prefix = this.peek() + this.peekNext();
        const tempPos = this.position;
        this.position += 2;
        if (!this.isAtEnd() && this.isDigit(this.peek())) {
          let code = prefix;
          while (!this.isAtEnd() && this.isDigit(this.peek())) {
            code += this.peek();
            this.advance();
          }
          return this.makeToken(
            next === "t" ? "AT_CODE" /* AT_CODE */ : "AC_CODE" /* AC_CODE */,
            code,
            startLine,
            startColumn
          );
        }
        this.position = tempPos;
      }
    }
    if (this.peek() === "i" && this.peekNext() === "d") {
      const tempPos = this.position;
      this.position += 2;
      if (!this.isAtEnd() && this.isDigit(this.peek())) {
        let code = "id";
        while (!this.isAtEnd() && this.isDigit(this.peek())) {
          code += this.peek();
          this.advance();
        }
        return this.makeToken("ID_CODE" /* ID_CODE */, code, startLine, startColumn);
      }
      this.position = tempPos;
    }
    while (!this.isAtEnd() && this.isIdentifierPart(this.peek())) {
      value += this.peek();
      this.advance();
    }
    const type2 = this.getKeywordType(value);
    return this.makeToken(type2, value, startLine, startColumn);
  }
  getKeywordType(value) {
    const lower2 = value.toLowerCase();
    switch (lower2) {
      case "for_all":
        return "FOR_ALL" /* FOR_ALL */;
      case "there_exists":
        return "THERE_EXISTS" /* THERE_EXISTS */;
      case "exists":
        return "EXISTS" /* EXISTS */;
      case "implies":
        return "IMPLIES" /* IMPLIES */;
      case "and":
        return "AND" /* AND */;
      case "or":
        return "OR" /* OR */;
      case "xor":
        return "XOR" /* XOR */;
      case "not":
        return "NOT" /* NOT */;
      case "in":
        return "IN" /* IN */;
      default:
        break;
    }
    const upper = value.toUpperCase();
    switch (upper) {
      case "ARCHETYPE":
        return "ARCHETYPE" /* ARCHETYPE */;
      case "TEMPLATE":
        return "TEMPLATE" /* TEMPLATE */;
      case "OPERATIONAL_TEMPLATE":
        return "OPERATIONAL_TEMPLATE" /* OPERATIONAL_TEMPLATE */;
      case "TEMPLATE_OVERLAY":
        return "TEMPLATE_OVERLAY" /* TEMPLATE_OVERLAY */;
      case "LANGUAGE":
        return "LANGUAGE" /* LANGUAGE */;
      case "DESCRIPTION":
        return "DESCRIPTION" /* DESCRIPTION */;
      case "DEFINITION":
        return "DEFINITION" /* DEFINITION */;
      case "RULES":
        return "RULES" /* RULES */;
      case "TERMINOLOGY":
        return "TERMINOLOGY" /* TERMINOLOGY */;
      case "ONTOLOGY":
        return "ONTOLOGY" /* ONTOLOGY */;
      case "ANNOTATIONS":
        return "ANNOTATIONS" /* ANNOTATIONS */;
      case "RM_OVERLAY":
        return "RM_OVERLAY" /* RM_OVERLAY */;
      case "MATCHES":
        return "MATCHES" /* MATCHES */;
      case "OCCURRENCES":
        return "OCCURRENCES" /* OCCURRENCES */;
      case "CARDINALITY":
        return "CARDINALITY" /* CARDINALITY */;
      case "EXISTENCE":
        return "EXISTENCE" /* EXISTENCE */;
      case "SPECIALIZE":
        return "SPECIALIZE" /* SPECIALIZE */;
      case "USE_ARCHETYPE":
      case "USE":
        return "IDENTIFIER" /* IDENTIFIER */;
      case "ALLOW_ARCHETYPE":
        return "IDENTIFIER" /* IDENTIFIER */;
      case "INCLUDE":
      case "EXCLUDE":
      case "ORDERED":
      case "UNORDERED":
      case "UNIQUE":
        return "IDENTIFIER" /* IDENTIFIER */;
      default:
        return "IDENTIFIER" /* IDENTIFIER */;
    }
  }
  skipWhitespaceAndComments() {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === " " || char === "	" || char === "\r") {
        this.advance();
        continue;
      }
      if (char === "\n") {
        this.advance();
        this.line++;
        this.column = 1;
        continue;
      }
      if (char === "-" && this.peekNext() === "-") {
        while (!this.isAtEnd() && this.peek() !== "\n") {
          this.advance();
        }
        continue;
      }
      break;
    }
  }
  isAtEnd() {
    return this.position >= this.input.length;
  }
  charBefore() {
    if (this.position <= 0)
      return "";
    return this.input[this.position - 1];
  }
  previousCharsMatch(length, text) {
    const start2 = this.position - length;
    if (start2 < 0)
      return false;
    return this.input.slice(start2, this.position) === text;
  }
  peek() {
    if (this.isAtEnd())
      return "\0";
    return this.input[this.position];
  }
  peekNext() {
    if (this.position + 1 >= this.input.length)
      return "\0";
    return this.input[this.position + 1];
  }
  advance() {
    const char = this.input[this.position];
    this.position++;
    this.column++;
    return char;
  }
  isDigit(char) {
    return char >= "0" && char <= "9";
  }
  isAlpha(char) {
    return char >= "a" && char <= "z" || char >= "A" && char <= "Z";
  }
  isAlphaNumeric(char) {
    return this.isAlpha(char) || this.isDigit(char);
  }
  isUnicodeLetter(char) {
    return char.length === 1 && /\p{L}/u.test(char);
  }
  isIdentifierStart(char) {
    return this.isAlpha(char) || char === "_" || this.isUnicodeLetter(char);
  }
  isIdentifierPart(char) {
    return this.isAlphaNumeric(char) || char === "_" || char === "-" || char === "?" || char === "X" || this.isUnicodeLetter(char);
  }
  makeToken(type2, value, line, column) {
    return { type: type2, value, line, column };
  }
};

// enhanced/parser/odin_parser.ts
var OdinParser = class {
  tokens;
  position = 0;
  constructor(tokens) {
    this.tokens = tokens;
  }
  /**
   * Parse ODIN text from tokens (single value or top-level `name = <...>` assignments).
   */
  parse() {
    this.skipWhitespace();
    if (this.isTopLevelAssignment()) {
      return this.parseTopLevelAssignments();
    }
    return this.parseValue();
  }
  isTopLevelAssignment() {
    return this.isIdentifierLike() && this.checkAhead("EQUALS" /* EQUALS */, 1);
  }
  parseTopLevelAssignments() {
    const root2 = {};
    while (!this.isAtEnd()) {
      this.skipWhitespace();
      if (!this.isIdentifierLike() || !this.checkAhead("EQUALS" /* EQUALS */, 1)) {
        break;
      }
      const attr = this.advance();
      this.skipWhitespace();
      this.consume("EQUALS" /* EQUALS */, "Expected '=' after attribute name");
      this.skipWhitespace();
      root2[attr.value] = this.parseValue();
      this.skipWhitespace();
    }
    return root2;
  }
  parseValue() {
    this.skipWhitespace();
    if (this.check("LANGLE" /* LANGLE */)) {
      return this.parseObjectBlock();
    }
    return this.parsePrimitive();
  }
  parseObjectBlock() {
    this.consume("LANGLE" /* LANGLE */, "Expected '<' to start object block");
    if (this.check("RANGLE" /* RANGLE */)) {
      this.advance();
      return {};
    }
    if (this.isPrimitive()) {
      return this.parsePrimitiveList();
    }
    if (this.check("PIPE" /* PIPE */)) {
      return this.parseInterval();
    }
    if (this.checkAhead("LBRACKET" /* LBRACKET */) && !this.looksLikeKeyedObjectBlock()) {
      const code = this.parseBracketedCode();
      this.consume("RANGLE" /* RANGLE */, "Expected '>'");
      return code;
    }
    return this.parseMixedObjectBody();
  }
  /** ODIN object with `["key"] = <>` entries and/or `attr = <>` pairs. */
  parseMixedObjectBody() {
    const obj = {};
    while (!this.check("RANGLE" /* RANGLE */) && !this.isAtEnd()) {
      this.skipWhitespace();
      if (this.check("RANGLE" /* RANGLE */))
        break;
      if (this.check("LBRACKET" /* LBRACKET */) && this.looksLikeKeyedObjectBlock()) {
        this.consume("LBRACKET" /* LBRACKET */, "Expected '['");
        let key = "";
        while (!this.check("RBRACKET" /* RBRACKET */) && !this.isAtEnd()) {
          key += this.advance().value;
        }
        key = key.replace(/^["']|["']$/g, "");
        this.consume("RBRACKET" /* RBRACKET */, "Expected ']'");
        this.skipWhitespace();
        this.consume("EQUALS" /* EQUALS */, "Expected '='");
        this.skipWhitespace();
        obj[key] = this.parseValue();
        continue;
      }
      if (this.isIdentifierLike() && this.checkAhead("EQUALS" /* EQUALS */, 1)) {
        const attr = this.advance();
        this.skipWhitespace();
        this.consume("EQUALS" /* EQUALS */, "Expected '='");
        this.skipWhitespace();
        obj[attr.value] = this.parseValue();
        continue;
      }
      break;
    }
    this.consume("RANGLE" /* RANGLE */, "Expected '>' to close object block");
    return obj;
  }
  parseAttributeValuePairs() {
    const obj = {};
    while (!this.check("RANGLE" /* RANGLE */) && !this.isAtEnd()) {
      this.skipWhitespace();
      if (this.check("RANGLE" /* RANGLE */))
        break;
      const token = this.peek();
      const isValidAttributeName = token.type === "IDENTIFIER" /* IDENTIFIER */ || token.type === "DESCRIPTION" /* DESCRIPTION */ || token.type === "LANGUAGE" /* LANGUAGE */ || token.type === "DEFINITION" /* DEFINITION */ || token.type === "TERMINOLOGY" /* TERMINOLOGY */ || token.type === "ARCHETYPE" /* ARCHETYPE */ || token.type === "RULES" /* RULES */ || token.type === "ANNOTATIONS" /* ANNOTATIONS */;
      if (!isValidAttributeName) {
        break;
      }
      const isAttribute = this.checkAhead("EQUALS" /* EQUALS */, 1);
      if (!isAttribute) {
        break;
      }
      const attr = this.advance();
      this.skipWhitespace();
      this.consume("EQUALS" /* EQUALS */, "Expected '=' after attribute name");
      this.skipWhitespace();
      const value = this.parseValue();
      obj[attr.value] = value;
      this.skipWhitespace();
    }
    this.consume("RANGLE" /* RANGLE */, "Expected '>' to close object block");
    return obj;
  }
  looksLikeKeyedObjectBlock() {
    let i2 = this.position + 1;
    while (i2 < this.tokens.length && this.tokens[i2].type !== "RBRACKET" /* RBRACKET */) {
      i2++;
    }
    if (i2 >= this.tokens.length)
      return false;
    return this.tokens[i2 + 1]?.type === "EQUALS" /* EQUALS */;
  }
  parseBracketedCode() {
    this.consume("LBRACKET" /* LBRACKET */, "Expected '['");
    let code = "";
    while (!this.check("RBRACKET" /* RBRACKET */) && !this.isAtEnd()) {
      code += this.advance().value;
    }
    this.consume("RBRACKET" /* RBRACKET */, "Expected ']'");
    return code.replace(/^["']|["']$/g, "");
  }
  parseKeyedList() {
    const obj = {};
    while (!this.check("RANGLE" /* RANGLE */) && !this.isAtEnd()) {
      this.skipWhitespace();
      if (this.check("RANGLE" /* RANGLE */))
        break;
      if (!this.check("LBRACKET" /* LBRACKET */))
        break;
      this.consume("LBRACKET" /* LBRACKET */, "Expected '[' for keyed object");
      let key = "";
      while (!this.check("RBRACKET" /* RBRACKET */) && !this.isAtEnd()) {
        key += this.advance().value;
      }
      key = key.replace(/^["']|["']$/g, "");
      this.consume("RBRACKET" /* RBRACKET */, "Expected ']' after key");
      this.skipWhitespace();
      this.consume("EQUALS" /* EQUALS */, "Expected '=' after key");
      this.skipWhitespace();
      obj[key] = this.parseValue();
      this.skipWhitespace();
    }
    this.consume("RANGLE" /* RANGLE */, "Expected '>' to close keyed list");
    return obj;
  }
  parsePrimitiveList() {
    const list = [];
    while (!this.check("RANGLE" /* RANGLE */) && !this.isAtEnd()) {
      this.skipWhitespace();
      if (this.check("RANGLE" /* RANGLE */))
        break;
      list.push(this.parsePrimitive());
      this.skipWhitespace();
      if (this.check("COMMA" /* COMMA */)) {
        this.advance();
        this.skipWhitespace();
      }
    }
    this.consume("RANGLE" /* RANGLE */, "Expected '>' to close primitive list");
    return list.length === 1 ? list[0] : list;
  }
  parseInterval() {
    this.consume("PIPE" /* PIPE */, "Expected '|' to start interval");
    const interval2 = {
      _type: "interval"
    };
    if (this.check("LANGLE" /* LANGLE */)) {
      this.advance();
      interval2.lowerIncluded = false;
      if (!this.check("EQUALS" /* EQUALS */)) {
        interval2.lower = this.parsePrimitiveValue();
      }
    } else if (this.check("IDENTIFIER" /* IDENTIFIER */) && this.peek().value === "undefined") {
      this.advance();
      interval2.lowerUnbounded = true;
    } else {
      interval2.lowerIncluded = true;
      interval2.lower = this.parsePrimitiveValue();
    }
    if (this.check("ELLIPSIS" /* ELLIPSIS */)) {
      this.advance();
      if (this.check("RANGLE" /* RANGLE */) && this.checkAhead("PIPE" /* PIPE */)) {
        this.advance();
        interval2.upperIncluded = false;
        interval2.upper = this.parsePrimitiveValue();
      } else if (this.check("IDENTIFIER" /* IDENTIFIER */) && this.peek().value === "undefined") {
        this.advance();
        interval2.upperUnbounded = true;
      } else {
        interval2.upperIncluded = true;
        interval2.upper = this.parsePrimitiveValue();
      }
    }
    this.consume("PIPE" /* PIPE */, "Expected '|' to close interval");
    return interval2;
  }
  parsePrimitive() {
    return this.parsePrimitiveValue();
  }
  parsePrimitiveValue() {
    this.skipWhitespace();
    if (this.check("STRING" /* STRING */)) {
      return this.advance().value;
    }
    if (this.check("INTEGER" /* INTEGER */)) {
      return parseInt(this.advance().value);
    }
    if (this.check("REAL" /* REAL */)) {
      return parseFloat(this.advance().value);
    }
    if (this.check("IDENTIFIER" /* IDENTIFIER */)) {
      const value = this.advance().value.toLowerCase();
      if (value === "true")
        return true;
      if (value === "false")
        return false;
      if (value === "null" || value === "undefined")
        return null;
      return value;
    }
    throw this.error("Expected primitive value");
  }
  isPrimitive() {
    return this.check("STRING" /* STRING */) || this.check("INTEGER" /* INTEGER */) || this.check("REAL" /* REAL */) || this.check("IDENTIFIER" /* IDENTIFIER */) && ["true", "false", "null", "undefined"].includes(
      this.peek().value.toLowerCase()
    );
  }
  isIdentifierLike() {
    const token = this.peek();
    return token.type === "IDENTIFIER" /* IDENTIFIER */ || token.type === "DESCRIPTION" /* DESCRIPTION */ || token.type === "LANGUAGE" /* LANGUAGE */ || token.type === "DEFINITION" /* DEFINITION */ || token.type === "TERMINOLOGY" /* TERMINOLOGY */ || token.type === "ARCHETYPE" /* ARCHETYPE */ || token.type === "RULES" /* RULES */ || token.type === "ANNOTATIONS" /* ANNOTATIONS */;
  }
  // Token navigation helpers
  check(type2) {
    if (this.isAtEnd())
      return false;
    return this.peek().type === type2;
  }
  checkAhead(type2, offset = 0) {
    const pos = this.position + offset;
    if (pos >= this.tokens.length)
      return false;
    return this.tokens[pos].type === type2;
  }
  advance() {
    if (!this.isAtEnd())
      this.position++;
    return this.previous();
  }
  consume(type2, message) {
    if (this.check(type2))
      return this.advance();
    throw this.error(message);
  }
  peek() {
    return this.tokens[this.position];
  }
  previous() {
    return this.tokens[this.position - 1];
  }
  isAtEnd() {
    return this.position >= this.tokens.length || this.peek().type === "EOF" /* EOF */;
  }
  skipWhitespace() {
  }
  error(message) {
    const token = this.peek();
    return new Error(
      `Parse error at line ${token.line}, column ${token.column}: ${message}`
    );
  }
};

// enhanced/parser/odin_aom_mapper.ts
function odinString(value) {
  if (typeof value === "string") {
    return value.replace(/^["']|["']$/g, "");
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return void 0;
}
function terminologyCodeFromAdlString(adlCode) {
  const tc = new Terminology_code();
  const parts = adlCode.split("::");
  if (parts.length >= 2) {
    tc.terminology_id = String2.from(parts[0]);
    tc.code_string = String2.from(parts.slice(1).join("::"));
  } else {
    tc.code_string = String2.from(adlCode);
  }
  return tc;
}
function mapOriginalLanguage(languageData) {
  const raw = languageData.original_language;
  if (raw === void 0)
    return void 0;
  let code;
  if (typeof raw === "string") {
    code = odinString(raw);
  } else if (Array.isArray(raw) && raw.length > 0) {
    code = odinString(raw[0]);
  }
  if (!code)
    return void 0;
  return terminologyCodeFromAdlString(code);
}
function mapDescription(descriptionData) {
  const desc = new RESOURCE_DESCRIPTION();
  const bag = desc;
  if (descriptionData.original_author !== void 0) {
    bag.original_author = descriptionData.original_author;
  }
  if (descriptionData.details !== void 0) {
    bag.details = descriptionData.details;
  }
  if (descriptionData.other_details !== void 0) {
    bag.other_details = descriptionData.other_details;
  }
  const lifecycle = odinString(descriptionData.lifecycle_state);
  if (lifecycle) {
    desc.lifecycle_state = terminologyCodeFromAdlString(lifecycle);
  }
  const copyright = odinString(descriptionData.copyright);
  if (copyright) {
    bag.copyright = copyright;
  }
  return desc;
}
function mapTermDefinitions(termDefs) {
  const table = {};
  if (!termDefs || typeof termDefs !== "object" || Array.isArray(termDefs)) {
    return table;
  }
  const byLang = termDefs;
  for (const [lang, terms] of Object.entries(byLang)) {
    if (!terms || typeof terms !== "object" || Array.isArray(terms))
      continue;
    let termEntries = terms;
    if ("items" in termEntries && termEntries.items && typeof termEntries.items === "object" && !Array.isArray(termEntries.items)) {
      termEntries = termEntries.items;
    }
    table[lang] = {};
    for (const [code, termObj] of Object.entries(termEntries)) {
      if (!termObj || typeof termObj !== "object" || Array.isArray(termObj)) {
        continue;
      }
      const t2 = termObj;
      table[lang][code] = {
        text: odinString(t2.text),
        description: odinString(t2.description)
      };
    }
  }
  return table;
}
function applyTerminologyOdin(archetype, terminologyData) {
  const terminology = archetype.ontology ?? new ARCHETYPE_ONTOLOGY();
  const bag = terminology;
  if (terminologyData.term_definitions !== void 0) {
    bag.term_definitions = mapTermDefinitions(terminologyData.term_definitions);
  }
  if (terminologyData.term_bindings !== void 0) {
    bag.term_bindings = terminologyData.term_bindings;
  }
  if (terminologyData.value_sets !== void 0) {
    bag.value_sets = terminologyData.value_sets;
  }
  if (terminologyData.terminology_extracts !== void 0) {
    bag.terminology_extracts = terminologyData.terminology_extracts;
  }
  archetype.ontology = terminology;
  return terminology;
}

// enhanced/parser/cadl_parser.ts
var CadlParser = class {
  tokens;
  position = 0;
  constructor(tokens) {
    this.tokens = tokens;
  }
  /**
   * Parse root c_object (complex, use archetype, allow archetype).
   */
  parseComplexObject() {
    if (this.checkKeyword("use") && this.peekAhead(1)?.value.toLowerCase() === "archetype") {
      return this.parseCArchetypeRoot();
    }
    return this.parseComplexObjectBody(new C_COMPLEX_OBJECT());
  }
  parseComplexObjectBody(cObject) {
    const typeId = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected type identifier");
    cObject.rm_type_name = typeId.value;
    this.consume("LBRACKET" /* LBRACKET */, "Expected '[' for node id");
    const nodeIdToken = this.peek();
    if (nodeIdToken.type === "ID_CODE" /* ID_CODE */ || nodeIdToken.type === "AT_CODE" /* AT_CODE */) {
      cObject.node_id = this.advance().value;
    } else {
      throw this.error("Expected node id code (id1, at0000, etc.)");
    }
    this.consume("RBRACKET" /* RBRACKET */, "Expected ']' after node id");
    if (this.check("OCCURRENCES" /* OCCURRENCES */)) {
      this.parseOccurrences(cObject);
    }
    if (this.check("MATCHES" /* MATCHES */)) {
      this.advance();
      this.consume("LBRACE" /* LBRACE */, "Expected '{' after matches");
      while (!this.check("RBRACE" /* RBRACE */) && !this.isAtEnd()) {
        this.skipComments();
        const posBefore = this.position;
        const attribute = this.parseAttribute();
        if (attribute) {
          if (!cObject.attributes)
            cObject.attributes = [];
          cObject.attributes.push(attribute);
        } else if (this.position === posBefore) {
          if (this.check("RBRACE" /* RBRACE */))
            break;
          this.advance();
        }
      }
      this.consume("RBRACE" /* RBRACE */, "Expected '}' to close matches block");
    }
    return cObject;
  }
  parseCArchetypeRoot() {
    this.consumeKeyword("use");
    this.consumeKeyword("archetype");
    const root2 = new C_ARCHETYPE_ROOT();
    return this.parseArchetypeRootTail(root2);
  }
  parseArchetypeRootTail(root2) {
    const typeId = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected type identifier");
    root2.rm_type_name = typeId.value;
    this.consume("LBRACKET" /* LBRACKET */, "Expected '['");
    root2.node_id = this.consume(
      "ID_CODE" /* ID_CODE */,
      "Expected id code"
    ).value;
    if (this.check("COMMA" /* COMMA */)) {
      this.advance();
      root2.archetype_ref = this.consumeArchetypeRef();
    }
    this.consume("RBRACKET" /* RBRACKET */, "Expected ']'");
    if (this.check("OCCURRENCES" /* OCCURRENCES */)) {
      this.parseOccurrences(root2);
    }
    if (this.check("MATCHES" /* MATCHES */)) {
      this.advance();
      this.consume("LBRACE" /* LBRACE */, "Expected '{'");
      while (!this.check("RBRACE" /* RBRACE */) && !this.isAtEnd()) {
        const attribute = this.parseAttribute();
        if (attribute) {
          if (!root2.attributes)
            root2.attributes = [];
          root2.attributes.push(attribute);
        }
      }
      this.consume("RBRACE" /* RBRACE */, "Expected '}'");
    }
    return root2;
  }
  isAllowArchetype() {
    if (this.checkIdentifier("allow_archetype"))
      return true;
    return this.checkKeyword("allow") && this.peekAhead(1)?.value.toLowerCase() === "archetype";
  }
  checkIdentifier(name) {
    return this.check("IDENTIFIER" /* IDENTIFIER */) && this.peek().value.toLowerCase() === name.toLowerCase();
  }
  parseArchetypeSlotAsComplex() {
    if (this.checkIdentifier("allow_archetype")) {
      this.advance();
    } else {
      this.consumeKeyword("allow");
      this.consumeKeyword("archetype");
    }
    const slot = new ARCHETYPE_SLOT();
    const typeId = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected type identifier");
    slot.rm_type_name = typeId.value;
    this.consume("LBRACKET" /* LBRACKET */, "Expected '['");
    slot.node_id = this.consume("ID_CODE" /* ID_CODE */, "Expected id code").value;
    this.consume("RBRACKET" /* RBRACKET */, "Expected ']'");
    if (this.check("OCCURRENCES" /* OCCURRENCES */)) {
      this.parseOccurrences(slot);
    }
    if (this.check("MATCHES" /* MATCHES */)) {
      this.advance();
      this.consume("LBRACE" /* LBRACE */, "Expected '{'");
      while (!this.check("RBRACE" /* RBRACE */) && !this.isAtEnd()) {
        if (this.checkKeyword("include")) {
          this.parseIncludeExclude(slot, "includes");
        } else if (this.checkKeyword("exclude")) {
          this.parseIncludeExclude(slot, "excludes");
        } else {
          throw this.error(`Unexpected token in archetype slot: ${this.peek().value}`);
        }
      }
      this.consume("RBRACE" /* RBRACE */, "Expected '}'");
    }
    return slot;
  }
  skipIncludeExcludeBlock() {
    this.advance();
    while (!this.check("RBRACE" /* RBRACE */) && !this.isAtEnd()) {
      if (this.check("IDENTIFIER" /* IDENTIFIER */) && this.checkAhead("MATCHES" /* MATCHES */, 1)) {
        this.advance();
        if (this.check("MATCHES" /* MATCHES */))
          this.advance();
        if (this.check("LBRACE" /* LBRACE */)) {
          this.advance();
          while (!this.check("RBRACE" /* RBRACE */) && !this.isAtEnd()) {
            this.advance();
          }
          if (this.check("RBRACE" /* RBRACE */))
            this.advance();
        }
      } else {
        this.advance();
      }
    }
  }
  parseIncludeExclude(slot, field) {
    this.advance();
    const list = slot[field] ?? [];
    while (!this.check("RBRACE" /* RBRACE */) && !this.checkKeyword("include") && !this.checkKeyword("exclude") && !this.isAtEnd()) {
      const constraint = new ARCHETYPE_ID_CONSTRAINT();
      const str = new C_STRING();
      if (this.check("STRING" /* STRING */)) {
        str.pattern = this.advance().value;
      } else if (this.check("IDENTIFIER" /* IDENTIFIER */)) {
        str.pattern = this.advance().value;
      } else {
        throw this.error("Expected archetype id constraint");
      }
      constraint.constraint = str;
      list.push(constraint);
    }
    slot[field] = list;
  }
  consumeArchetypeRef() {
    const parts = [];
    while (this.check("IDENTIFIER" /* IDENTIFIER */) || this.check("DOT" /* DOT */) || this.check("INTEGER" /* INTEGER */)) {
      parts.push(this.advance().value);
    }
    return parts.join("");
  }
  parseAttribute() {
    this.skipComments();
    if (this.check("RBRACE" /* RBRACE */))
      return null;
    if (!this.check("IDENTIFIER" /* IDENTIFIER */))
      return null;
    let attributeName = this.advance().value;
    if (this.check("SLASH" /* SLASH */) && this.checkAhead("IDENTIFIER" /* IDENTIFIER */, 1)) {
      attributeName += "/" + this.advance().value;
      this.advance();
    }
    const hasCardinality = this.check("CARDINALITY" /* CARDINALITY */);
    const attribute = hasCardinality ? new C_MULTIPLE_ATTRIBUTE() : new C_SINGLE_ATTRIBUTE();
    attribute.rm_attribute_name = attributeName;
    if (this.check("EXISTENCE" /* EXISTENCE */)) {
      const existence = this.parseExistence();
      attribute.existence = existence;
    }
    if (this.check("CARDINALITY" /* CARDINALITY */)) {
      const card = this.parseCardinality();
      if (attribute instanceof C_MULTIPLE_ATTRIBUTE) {
        attribute.cardinality = card;
      }
    }
    if (this.check("MATCHES" /* MATCHES */)) {
      this.advance();
      this.consume("LBRACE" /* LBRACE */, "Expected '{' after matches in attribute");
      while (!this.check("RBRACE" /* RBRACE */) && !this.isAtEnd()) {
        this.skipComments();
        const posBefore = this.position;
        const stringChild = this.tryParseStringConstraint();
        if (stringChild) {
          if (!attribute.children) {
            attribute.children = [];
          }
          attribute.children.push(
            stringChild
          );
          continue;
        }
        const child = this.parseChildObject();
        if (child) {
          if (!attribute.children) {
            attribute.children = [];
          }
          attribute.children.push(
            child
          );
        } else if (this.position === posBefore) {
          if (this.check("RBRACE" /* RBRACE */))
            break;
          this.advance();
        }
      }
      this.consume("RBRACE" /* RBRACE */, "Expected '}' to close attribute matches");
    }
    return attribute;
  }
  /** `matches { "literal" }` string constraint (BOOK archetype style). */
  tryParseStringConstraint() {
    if (!this.check("STRING" /* STRING */))
      return null;
    const prim = new C_PRIMITIVE_OBJECT();
    prim.rm_type_name = "DV_TEXT";
    const str = new C_STRING();
    str.pattern = this.advance().value.replace(/^["']|["']$/g, "");
    prim.item = str;
    while (this.check("COMMA" /* COMMA */)) {
      this.advance();
      if (this.check("STRING" /* STRING */)) {
        str.pattern += "|" + this.advance().value.replace(/^["']|["']$/g, "");
      }
    }
    return prim;
  }
  parseChildObject() {
    if (this.check("RBRACE" /* RBRACE */))
      return null;
    const stringChild = this.tryParseStringConstraint();
    if (stringChild)
      return stringChild;
    if (this.check("REGEX" /* REGEX */)) {
      const prim = new C_PRIMITIVE_OBJECT();
      prim.rm_type_name = "STRING";
      const str = new C_STRING();
      str.pattern = this.advance().value;
      prim.item = str;
      return prim;
    }
    if (!this.check("IDENTIFIER" /* IDENTIFIER */)) {
      throw this.error(`Unexpected token: ${this.peek().value}`);
    }
    if (this.checkKeyword("use") && this.peekAhead(1)?.value.toLowerCase() === "archetype") {
      return this.parseCArchetypeRoot();
    }
    if (this.isAllowArchetype()) {
      return this.parseArchetypeSlotAsComplex();
    }
    if (this.checkKeyword("include") || this.checkKeyword("exclude")) {
      this.skipIncludeExcludeBlock();
      return null;
    }
    if (this.isPrimitiveType(this.peek().value)) {
      return this.parsePrimitiveObject();
    }
    return this.parseComplexObjectBody(new C_COMPLEX_OBJECT());
  }
  isPrimitiveType(typeName) {
    return typeName.startsWith("DV_") || typeName === "CODE_PHRASE";
  }
  parsePrimitiveObject() {
    const prim = new C_PRIMITIVE_OBJECT();
    const typeId = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected primitive type");
    prim.rm_type_name = typeId.value;
    this.consume("LBRACKET" /* LBRACKET */, "Expected '['");
    prim.node_id = this.peek().type === "AT_CODE" /* AT_CODE */ || this.peek().type === "ID_CODE" /* ID_CODE */ ? this.advance().value : this.consume("ID_CODE" /* ID_CODE */, "Expected node id").value;
    this.consume("RBRACKET" /* RBRACKET */, "Expected ']'");
    return prim;
  }
  parseExistence() {
    this.consume("EXISTENCE" /* EXISTENCE */, "Expected 'existence'");
    this.consume("MATCHES" /* MATCHES */, "Expected 'matches'");
    this.consume("LBRACE" /* LBRACE */, "Expected '{'");
    const interval2 = this.parseMultiplicity();
    this.consume("RBRACE" /* RBRACE */, "Expected '}'");
    return interval2;
  }
  parseCardinality() {
    this.consume("CARDINALITY" /* CARDINALITY */, "Expected 'cardinality'");
    this.consume("MATCHES" /* MATCHES */, "Expected 'matches'");
    this.consume("LBRACE" /* LBRACE */, "Expected '{'");
    const card = new CARDINALITY();
    const interval2 = this.parseMultiplicity();
    card.interval = interval2;
    while (this.check("SEMICOLON" /* SEMICOLON */)) {
      this.advance();
      if (this.checkKeyword("ordered")) {
        this.advance();
        card.is_ordered = true;
      } else if (this.checkKeyword("unordered")) {
        this.advance();
        card.is_ordered = false;
      } else if (this.checkKeyword("unique")) {
        this.advance();
        card.is_unique = true;
      } else {
        throw this.error(`Unknown cardinality modifier: ${this.peek().value}`);
      }
    }
    this.consume("RBRACE" /* RBRACE */, "Expected '}'");
    return card;
  }
  parseOccurrences(cObject) {
    this.consume("OCCURRENCES" /* OCCURRENCES */, "Expected 'occurrences'");
    this.consume("MATCHES" /* MATCHES */, "Expected 'matches'");
    this.consume("LBRACE" /* LBRACE */, "Expected '{'");
    cObject.occurrences = this.parseMultiplicity();
    this.consume("RBRACE" /* RBRACE */, "Expected '}'");
  }
  parseMultiplicity() {
    const interval2 = new Multiplicity_interval();
    if (this.check("INTEGER" /* INTEGER */)) {
      const lower2 = parseInt(this.advance().value, 10);
      if (this.check("ELLIPSIS" /* ELLIPSIS */)) {
        this.advance();
        if (this.check("STAR" /* STAR */)) {
          this.advance();
          interval2.lower = lower2;
          interval2.upper = void 0;
        } else if (this.check("INTEGER" /* INTEGER */)) {
          interval2.lower = lower2;
          interval2.upper = parseInt(this.advance().value, 10);
        } else {
          interval2.lower = lower2;
          interval2.upper = void 0;
        }
      } else {
        interval2.lower = lower2;
        interval2.upper = lower2;
      }
    } else if (this.check("STAR" /* STAR */)) {
      this.advance();
      interval2.lower = 0;
      interval2.upper = void 0;
    } else {
      throw this.error("Expected multiplicity");
    }
    return interval2;
  }
  skipComments() {
    while (this.check("COMMENT" /* COMMENT */))
      this.advance();
  }
  checkKeyword(word) {
    if (!this.check("IDENTIFIER" /* IDENTIFIER */))
      return false;
    return this.peek().value.toLowerCase() === word.toLowerCase();
  }
  consumeKeyword(word) {
    if (!this.checkKeyword(word)) {
      throw this.error(`Expected keyword '${word}'`);
    }
    this.advance();
  }
  check(type2) {
    if (this.isAtEnd())
      return false;
    return this.peek().type === type2;
  }
  advance() {
    if (!this.isAtEnd())
      this.position++;
    return this.previous();
  }
  consume(type2, message) {
    if (this.check(type2))
      return this.advance();
    throw this.error(message);
  }
  peek() {
    return this.tokens[this.position];
  }
  peekAhead(offset) {
    const idx = this.position + offset;
    if (idx >= this.tokens.length)
      return void 0;
    return this.tokens[idx];
  }
  previous() {
    return this.tokens[this.position - 1];
  }
  isAtEnd() {
    return this.position >= this.tokens.length || this.peek().type === "EOF" /* EOF */;
  }
  error(message) {
    const token = this.peek();
    return new Error(
      `cADL parse error at line ${token.line}, column ${token.column}: ${message}`
    );
  }
};

// enhanced/parser/rules_parser.ts
var RULE_TYPE_NAMES = /* @__PURE__ */ new Set([
  "Integer",
  "Real",
  "Boolean",
  "String",
  "Object_ref",
  "Date",
  "Time",
  "Date_time",
  "Duration"
]);
var RulesParser = class {
  tokens;
  position = 0;
  warnings = [];
  constructor(tokens) {
    this.tokens = tokens.filter(
      (t2) => t2.type !== "COMMENT" /* COMMENT */ && t2.type !== "WHITESPACE" /* WHITESPACE */
    );
  }
  parse() {
    const source = this.tokensToSource();
    const lines = this.splitStatements(source);
    const assertions = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("--"))
        continue;
      try {
        assertions.push(this.parseStatement(trimmed));
      } catch (e2) {
        this.warnings.push(
          `Rules statement parse error: ${e2 instanceof Error ? e2.message : String(e2)} \u2014 stored as raw text`
        );
        const fallback = new ASSERTION();
        fallback.string_expression = trimmed;
        assertions.push(fallback);
      }
    }
    return { assertions, warnings: this.warnings };
  }
  /** Reconstruct source with newlines at token line boundaries. */
  tokensToSource() {
    const byLine = /* @__PURE__ */ new Map();
    for (const t2 of this.tokens) {
      if (t2.type === "EOF" /* EOF */)
        break;
      const line = byLine.get(t2.line) ?? [];
      line.push(t2);
      byLine.set(t2.line, line);
    }
    const lines = [];
    for (const lineNo of [...byLine.keys()].sort((a2, b2) => a2 - b2)) {
      lines.push(this.joinLineTokens(byLine.get(lineNo)));
    }
    return lines.join("\n");
  }
  joinLineTokens(tokens) {
    let out = "";
    for (let i2 = 0; i2 < tokens.length; i2++) {
      const t2 = tokens[i2];
      if (i2 > 0 && this.needsSpaceBetween(tokens[i2 - 1], t2)) {
        out += " ";
      }
      out += this.tokenText(t2);
    }
    return out;
  }
  needsSpaceBetween(a2, b2) {
    const keywordAfterPath = /* @__PURE__ */ new Set([
      "IMPLIES" /* IMPLIES */,
      "FOR_ALL" /* FOR_ALL */,
      "THERE_EXISTS" /* THERE_EXISTS */,
      "EXISTS" /* EXISTS */,
      "AND" /* AND */,
      "OR" /* OR */,
      "XOR" /* XOR */,
      "NOT" /* NOT */
    ]);
    if (keywordAfterPath.has(b2.type))
      return true;
    const pathGlue = /* @__PURE__ */ new Set([
      "LBRACKET" /* LBRACKET */,
      "RBRACKET" /* RBRACKET */,
      "SLASH" /* SLASH */,
      "DOT" /* DOT */
    ]);
    if (pathGlue.has(b2.type))
      return false;
    if (a2.type === "VARIABLE" /* VARIABLE */ && b2.type === "COLON" /* COLON */)
      return false;
    if (a2.type === "COLON" /* COLON */ && b2.type === "ASSIGN" /* ASSIGN */)
      return false;
    if (a2.type === "IDENTIFIER" /* IDENTIFIER */ && b2.type === "LBRACKET" /* LBRACKET */) {
      return false;
    }
    if (a2.type === "LBRACKET" /* LBRACKET */ && (b2.type === "IDENTIFIER" /* IDENTIFIER */ || b2.type === "INTEGER" /* INTEGER */)) {
      return false;
    }
    if (a2.type === "IDENTIFIER" /* IDENTIFIER */ && b2.type === "RBRACKET" /* RBRACKET */) {
      return false;
    }
    if (a2.type === "RBRACKET" /* RBRACKET */ && b2.type === "SLASH" /* SLASH */)
      return false;
    if (a2.type === "SLASH" /* SLASH */ && (b2.type === "IDENTIFIER" /* IDENTIFIER */ || b2.type === "VARIABLE" /* VARIABLE */)) {
      return false;
    }
    if (pathGlue.has(a2.type) && b2.type !== "COLON" /* COLON */)
      return false;
    return true;
  }
  tokenText(t2) {
    switch (t2.type) {
      case "STRING" /* STRING */:
        return `"${t2.value}"`;
      case "AT_CODE" /* AT_CODE */:
        return `[${t2.value}]`;
      case "ASSIGN" /* ASSIGN */:
        return ":=";
      case "NOT_EQUALS" /* NOT_EQUALS */:
        return t2.value;
      default:
        return t2.value;
    }
  }
  /** Group physical lines into logical statements (handles indented continuations). */
  splitStatements(source) {
    const physical = source.split(/\r?\n/);
    const statements = [];
    let current = "";
    for (const raw of physical) {
      const line = raw.trim();
      if (!line || line.startsWith("--"))
        continue;
      if (this.isStatementStart(line) && current) {
        statements.push(current.trim());
        current = line;
      } else if (!current) {
        current = line;
      } else {
        current += " " + line;
      }
    }
    if (current.trim())
      statements.push(current.trim());
    return statements;
  }
  isStatementStart(line) {
    if (/^\$[A-Za-z_]\w*/.test(line))
      return true;
    if (/^for_all\b/i.test(line))
      return true;
    if (/^there_exists\b/i.test(line))
      return true;
    const tagged = /^([A-Za-z_][\w]*)\s*:/.exec(line);
    if (!tagged)
      return false;
    const after = line.slice(tagged[0].length).trim();
    const typeMatch = /^([A-Za-z_][\w]*)\s*:=/.exec(after);
    if (typeMatch && RULE_TYPE_NAMES.has(typeMatch[1]))
      return true;
    return true;
  }
  parseStatement(text) {
    const assertion = new ASSERTION();
    const varDecl = /^\$([A-Za-z_]\w*)\s*:\s*([A-Za-z_][\w.]*)\s*:=\s*(.+)$/i.exec(text);
    if (varDecl) {
      const v2 = new ASSERTION_VARIABLE();
      v2.name = `$${varDecl[1]}`;
      v2.definition = `${varDecl[2]} := ${varDecl[3].trim()}`;
      assertion.variables = [v2];
      assertion.string_expression = text;
      return assertion;
    }
    const varAssign = /^\$([A-Za-z_]\w*)\s*:=\s*(.+)$/is.exec(text);
    if (varAssign) {
      assertion.string_expression = text;
      return assertion;
    }
    const quantified = /^(for_all|there_exists)\s*(.+?)\s+implies\s*(.+)$/is.exec(text.trim());
    if (quantified) {
      assertion.string_expression = text;
      assertion.expression = this.quantified(
        quantified[1].toLowerCase(),
        quantified[2],
        quantified[3]
      );
      return assertion;
    }
    const tagged = /^([A-Za-z_][\w]*)\s*:\s*(.+)$/is.exec(text);
    if (tagged && !RULE_TYPE_NAMES.has(tagged[1])) {
      assertion.tag = tagged[1];
      assertion.string_expression = tagged[2].trim();
      assertion.expression = this.parseExpression(assertion.string_expression);
      return assertion;
    }
    assertion.string_expression = text;
    assertion.expression = this.parseExpression(text);
    return assertion;
  }
  pathOrExprLeaf(path) {
    const ref = new EXPR_ARCHETYPE_REF();
    ref.reference_type = "attribute";
    ref.path = path;
    ref.item = path;
    return ref;
  }
  /**
   * Build a shallow expression tree for common operators; falls back to undefined.
   */
  parseExpression(text) {
    const trimmed = text.trim();
    const forAll = /^for_all\s*(.+?)\s+implies\s*(.+)$/is.exec(trimmed);
    if (forAll) {
      return this.quantified("for_all", forAll[1], forAll[2]);
    }
    const thereExists = /^there_exists\s*(.+?)\s+implies\s*(.+)$/is.exec(trimmed);
    if (thereExists) {
      return this.quantified("there_exists", thereExists[1], thereExists[2]);
    }
    if (trimmed.startsWith("(")) {
      const inner = this.stripOuterParens(trimmed);
      if (inner !== trimmed) {
        return this.parseExpression(inner);
      }
    }
    const impliesParts = this.splitOutsideParens(trimmed, "implies");
    if (impliesParts && impliesParts.length === 2) {
      return this.binary("implies", impliesParts[0], impliesParts[1]);
    }
    for (const op of [" or ", " xor ", " and "]) {
      const parts = this.splitOutsideParens(trimmed, op.trim());
      if (parts && parts.length >= 2) {
        return this.binary(op.trim(), parts[0], parts.slice(1).join(op));
      }
    }
    const eq = this.splitComparison(trimmed);
    if (eq) {
      return this.binary(eq.op, eq.left, eq.right);
    }
    if (/^exists\s+/i.test(trimmed)) {
      const path = trimmed.replace(/^exists\s+/i, "").trim();
      const leaf = this.pathOrExprLeaf(path);
      leaf.reference_type = "attribute";
      return leaf;
    }
    if (/^not\s+/i.test(trimmed)) {
      const inner = trimmed.replace(/^not\s+/i, "").trim();
      const unary = new EXPR_UNARY_OPERATOR();
      unary.operator = OPERATOR_KIND.from("not");
      unary.operand = this.parseExpression(inner) ?? this.pathOrExprLeaf(inner);
      return unary;
    }
    const memberOf = /^(.+?)\s+member_of\s+(.+)$/is.exec(trimmed);
    if (memberOf) {
      return this.binary("member_of", memberOf[1], memberOf[2]);
    }
    if (trimmed.startsWith("/") || trimmed.includes("/data[")) {
      return this.pathOrExprLeaf(trimmed);
    }
    if (/^\$[A-Za-z_]\w*$/.test(trimmed)) {
      return this.pathOrExprLeaf(trimmed);
    }
    return void 0;
  }
  stripOuterParens(text) {
    let e2 = text.trim();
    while (e2.startsWith("(") && e2.endsWith(")")) {
      let depth = 0;
      let wrapped = true;
      for (let i2 = 0; i2 < e2.length; i2++) {
        if (e2[i2] === "(")
          depth++;
        else if (e2[i2] === ")")
          depth--;
        if (depth === 0 && i2 < e2.length - 1) {
          wrapped = false;
          break;
        }
      }
      if (!wrapped)
        break;
      e2 = e2.slice(1, -1).trim();
    }
    return e2;
  }
  quantified(op, collectionPath, condition) {
    const bin = new EXPR_BINARY_OPERATOR();
    bin.operator = OPERATOR_KIND.from(op);
    bin.left_operand = this.pathOrExprLeaf(collectionPath.trim());
    bin.right_operand = this.parseExpression(condition.trim()) ?? this.pathOrExprLeaf(condition.trim());
    return bin;
  }
  splitComparison(text) {
    for (const op of ["=", "/=", "!=", ">=", "<=", ">", "<"]) {
      const idx = this.findOperator(text, op);
      if (idx > 0) {
        return {
          op,
          left: text.slice(0, idx).trim(),
          right: text.slice(idx + op.length).trim()
        };
      }
    }
    return void 0;
  }
  findOperator(text, op) {
    let depth = 0;
    for (let i2 = 0; i2 <= text.length - op.length; i2++) {
      const c2 = text[i2];
      if (c2 === "(")
        depth++;
      else if (c2 === ")")
        depth--;
      else if (depth === 0 && text.slice(i2, i2 + op.length) === op) {
        if (op === "=") {
          if (i2 > 0 && (text[i2 - 1] === ">" || text[i2 - 1] === "<" || text[i2 - 1] === "!")) {
            continue;
          }
          if (i2 + 1 < text.length && text[i2 + 1] === "=")
            continue;
        }
        return i2;
      }
    }
    return -1;
  }
  splitOutsideParens(text, sep) {
    const lower2 = text.toLowerCase();
    const needle = sep.toLowerCase();
    let depth = 0;
    for (let i2 = 0; i2 <= text.length - needle.length; i2++) {
      const c2 = text[i2];
      if (c2 === "(")
        depth++;
      else if (c2 === ")")
        depth--;
      else if (depth === 0 && lower2.slice(i2, i2 + needle.length) === needle && (i2 === 0 || /\s/.test(text[i2 - 1])) && (i2 + needle.length >= text.length || /\s/.test(text[i2 + needle.length]))) {
        return [
          text.slice(0, i2).trim(),
          text.slice(i2 + needle.length).trim()
        ];
      }
    }
    return void 0;
  }
  binary(op, leftText, rightText) {
    const bin = new EXPR_BINARY_OPERATOR();
    bin.operator = OPERATOR_KIND.from(op);
    bin.left_operand = this.parseExpression(leftText) ?? this.pathOrExprLeaf(leftText);
    bin.right_operand = this.parseExpression(rightText) ?? this.pathOrExprLeaf(rightText);
    return bin;
  }
};

// enhanced/parser/aom_odin_sections.ts
function applyAnnotationsOdin(archetype, data) {
  const ann = new RESOURCE_ANNOTATIONS();
  const bag = ann;
  if (data.documentation !== void 0) {
    bag.documentation = data.documentation;
  } else if (Object.keys(data).length > 0) {
    bag.documentation = data;
  }
  archetype.annotations = ann;
}
function applyRmOverlayOdin(archetype, data) {
  const overlay = new RM_OVERLAY();
  const bag = overlay;
  if (data.rm_visibility !== void 0) {
    bag.rm_visibility = data.rm_visibility;
  } else if (Object.keys(data).length > 0) {
    bag.rm_visibility = data;
  }
  archetype.rm_overlay = overlay;
}
function getAnnotationsDocumentation(archetype) {
  const ann = archetype.annotations;
  if (!ann)
    return void 0;
  const doc = ann.documentation;
  return doc && typeof doc === "object" ? doc : void 0;
}
function getRmOverlayVisibility(archetype) {
  const overlay = archetype.rm_overlay;
  if (!overlay)
    return void 0;
  const vis = overlay.rm_visibility;
  return vis && typeof vis === "object" ? vis : void 0;
}

// enhanced/parser/adl2_parser.ts
var ADL2Parser = class {
  tokens;
  position = 0;
  warnings = [];
  constructor(tokens) {
    this.tokens = tokens;
  }
  /**
   * Parse ADL2 text from tokens
   */
  parse() {
    if (this.isAtEnd()) {
      throw this.error("Empty ADL2 input");
    }
    const keyword = this.peek().type;
    if (keyword === "TEMPLATE" /* TEMPLATE */) {
      const template = this.parseTemplate();
      return { kind: "template", template, warnings: this.warnings };
    }
    if (keyword === "OPERATIONAL_TEMPLATE" /* OPERATIONAL_TEMPLATE */) {
      const operationalTemplate = this.parseOperationalTemplate();
      return {
        kind: "operational_template",
        operationalTemplate,
        warnings: this.warnings
      };
    }
    if (keyword === "ARCHETYPE" /* ARCHETYPE */) {
      const archetype = this.parseArchetype();
      return { kind: "archetype", archetype, warnings: this.warnings };
    }
    throw this.error(
      `Expected 'archetype', 'template', or 'operational_template', got ${this.peek().value}`
    );
  }
  parseTemplate() {
    this.consumeKeyword("TEMPLATE" /* TEMPLATE */, "Expected 'template' keyword");
    return this.parseAuthoredArchetype(new TEMPLATE());
  }
  parseOperationalTemplate() {
    this.consumeKeyword(
      "OPERATIONAL_TEMPLATE" /* OPERATIONAL_TEMPLATE */,
      "Expected 'operational_template' keyword"
    );
    return this.parseAuthoredArchetype(new OPERATIONAL_TEMPLATE());
  }
  parseArchetype() {
    this.consumeKeyword("ARCHETYPE" /* ARCHETYPE */, "Expected 'archetype' keyword");
    return this.parseAuthoredArchetype(new ARCHETYPE());
  }
  parseAuthoredArchetype(archetype) {
    const metadata = this.parseMetadata();
    const archetypeId = this.parseArchetypeId();
    let parentId;
    if (this.check("SPECIALIZE" /* SPECIALIZE */)) {
      this.advance();
      parentId = this.parseArchetypeId();
    }
    archetype.archetype_id = new ARCHETYPE_ID();
    archetype.archetype_id.value = archetypeId;
    if (metadata.adl_version) {
      archetype.adl_version = metadata.adl_version;
    }
    if (metadata.rm_release) {
      archetype.rm_release = metadata.rm_release;
    }
    if (parentId) {
      archetype.parent_archetype_id = new ARCHETYPE_ID();
      archetype.parent_archetype_id.value = parentId;
    }
    while (!this.isAtEnd()) {
      if (this.check("LANGUAGE" /* LANGUAGE */)) {
        this.parseLanguageSection(archetype);
      } else if (this.check("DESCRIPTION" /* DESCRIPTION */)) {
        this.parseDescriptionSection(archetype);
      } else if (this.check("DEFINITION" /* DEFINITION */)) {
        this.parseDefinitionSection(archetype);
      } else if (this.check("RULES" /* RULES */)) {
        this.parseRulesSection(archetype);
      } else if (this.check("TERMINOLOGY" /* TERMINOLOGY */) || this.check("ONTOLOGY" /* ONTOLOGY */)) {
        this.parseTerminologySection(archetype);
      } else if (this.check("ANNOTATIONS" /* ANNOTATIONS */)) {
        this.parseAnnotationsSection(archetype);
      } else if (this.check("RM_OVERLAY" /* RM_OVERLAY */)) {
        this.parseRmOverlaySection(archetype);
      } else {
        break;
      }
    }
    return archetype;
  }
  parseMetadata() {
    const metadata = {};
    if (!this.check("LPAREN" /* LPAREN */)) {
      return metadata;
    }
    this.consume("LPAREN" /* LPAREN */, "Expected '(' for metadata");
    while (!this.check("RPAREN" /* RPAREN */) && !this.isAtEnd()) {
      const key = this.consume("IDENTIFIER" /* IDENTIFIER */, "Expected metadata key");
      let value;
      if (this.check("EQUALS" /* EQUALS */)) {
        this.advance();
        if (this.check("STRING" /* STRING */)) {
          value = this.advance().value;
        } else if (this.check("REAL" /* REAL */)) {
          value = this.advance().value;
        } else if (this.check("INTEGER" /* INTEGER */)) {
          value = this.advance().value;
        } else if (this.check("IDENTIFIER" /* IDENTIFIER */)) {
          value = this.advance().value;
        } else {
          throw this.error("Expected metadata value");
        }
      } else {
        value = "true";
      }
      metadata[key.value] = value;
      if (this.check("SEMICOLON" /* SEMICOLON */) || this.check("COMMA" /* COMMA */)) {
        this.advance();
      }
    }
    this.consume("RPAREN" /* RPAREN */, "Expected ')' to close metadata");
    return metadata;
  }
  parseArchetypeId() {
    let id2 = "";
    while (!this.isAtEnd()) {
      if (this.check("IDENTIFIER" /* IDENTIFIER */)) {
        id2 += this.advance().value;
      } else if (this.check("DOT" /* DOT */)) {
        id2 += this.advance().value;
      } else if (this.check("REAL" /* REAL */)) {
        id2 += this.advance().value;
      } else {
        break;
      }
    }
    if (!id2) {
      throw this.error("Expected archetype ID");
    }
    return id2;
  }
  parseLanguageSection(archetype) {
    this.consumeKeyword("LANGUAGE" /* LANGUAGE */, "Expected 'language' keyword");
    const odinTokens = this.collectOdinTokens();
    const odinParser = new OdinParser(odinTokens);
    const languageData = odinParser.parse();
    const lang = mapOriginalLanguage(languageData);
    if (lang)
      archetype.original_language = lang;
  }
  parseDescriptionSection(archetype) {
    this.consumeKeyword("DESCRIPTION" /* DESCRIPTION */, "Expected 'description' keyword");
    const odinTokens = this.collectOdinTokens();
    const odinParser = new OdinParser(odinTokens);
    const descriptionData = odinParser.parse();
    if (Object.keys(descriptionData).length > 0) {
      archetype.description = mapDescription(descriptionData);
    }
  }
  parseDefinitionSection(archetype) {
    this.consumeKeyword("DEFINITION" /* DEFINITION */, "Expected 'definition' keyword");
    const defTokens = this.collectDefinitionTokens();
    const cadlParser = new CadlParser(defTokens);
    try {
      const definition = cadlParser.parseComplexObject();
      archetype.definition = definition;
    } catch (e2) {
      this.warnings.push(`Definition section parsing error: ${e2.message}`);
      const definition = new C_COMPLEX_OBJECT();
      archetype.definition = definition;
    }
  }
  collectDefinitionTokens() {
    const defTokens = [];
    let depth = 0;
    while (!this.isAtEnd()) {
      const token = this.peek();
      if (token.type === "LBRACE" /* LBRACE */) {
        depth++;
      } else if (token.type === "RBRACE" /* RBRACE */) {
        depth--;
      }
      if (depth === 0 && (token.type === "LANGUAGE" /* LANGUAGE */ || token.type === "DESCRIPTION" /* DESCRIPTION */ || token.type === "RULES" /* RULES */ || token.type === "TERMINOLOGY" /* TERMINOLOGY */ || token.type === "ONTOLOGY" /* ONTOLOGY */ || token.type === "ANNOTATIONS" /* ANNOTATIONS */ || token.type === "RM_OVERLAY" /* RM_OVERLAY */)) {
        break;
      }
      defTokens.push(this.advance());
    }
    defTokens.push({
      type: "EOF" /* EOF */,
      value: "",
      line: this.peek().line,
      column: this.peek().column
    });
    return defTokens;
  }
  parseRulesSection(archetype) {
    this.consumeKeyword("RULES" /* RULES */, "Expected 'rules' keyword");
    const rulesTokens = this.collectRulesTokens();
    const { assertions, warnings } = new RulesParser(rulesTokens).parse();
    archetype.invariants = assertions.length > 0 ? assertions : void 0;
    this.warnings.push(...warnings);
  }
  collectRulesTokens() {
    const out = [];
    while (!this.isAtEnd()) {
      const token = this.peek();
      if (token.type === "TERMINOLOGY" /* TERMINOLOGY */ || token.type === "ANNOTATIONS" /* ANNOTATIONS */ || token.type === "RM_OVERLAY" /* RM_OVERLAY */) {
        break;
      }
      out.push(this.advance());
    }
    out.push({
      type: "EOF" /* EOF */,
      value: "",
      line: this.peek().line,
      column: this.peek().column
    });
    return out;
  }
  parseTerminologySection(archetype) {
    if (this.check("ONTOLOGY" /* ONTOLOGY */)) {
      this.advance();
    } else {
      this.consumeKeyword(
        "TERMINOLOGY" /* TERMINOLOGY */,
        "Expected 'terminology' keyword"
      );
    }
    const odinTokens = this.collectOdinTokens();
    try {
      const odinParser = new OdinParser(odinTokens);
      const terminologyData = odinParser.parse();
      applyTerminologyOdin(archetype, terminologyData);
    } catch (e2) {
      this.warnings.push(
        `Terminology section parse error: ${e2 instanceof Error ? e2.message : String(e2)}`
      );
      archetype.ontology = archetype.ontology ?? new ARCHETYPE_ONTOLOGY();
    }
  }
  parseAnnotationsSection(archetype) {
    this.consumeKeyword(
      "ANNOTATIONS" /* ANNOTATIONS */,
      "Expected 'annotations' keyword"
    );
    const odinTokens = this.collectOdinTokens();
    try {
      const odinParser = new OdinParser(odinTokens);
      const data = odinParser.parse();
      applyAnnotationsOdin(archetype, data);
    } catch (e2) {
      this.warnings.push(
        `Annotations section parse error: ${e2 instanceof Error ? e2.message : String(e2)}`
      );
    }
  }
  parseRmOverlaySection(archetype) {
    this.consumeKeyword(
      "RM_OVERLAY" /* RM_OVERLAY */,
      "Expected 'rm_overlay' keyword"
    );
    const odinTokens = this.collectOdinTokens();
    try {
      const odinParser = new OdinParser(odinTokens);
      const data = odinParser.parse();
      applyRmOverlayOdin(archetype, data);
    } catch (e2) {
      this.warnings.push(
        `rm_overlay section parse error: ${e2 instanceof Error ? e2.message : String(e2)}`
      );
    }
  }
  collectOdinTokens() {
    const odinTokens = [];
    let depth = 0;
    let hasContent = false;
    while (!this.isAtEnd()) {
      const token = this.peek();
      if (token.type === "LANGLE" /* LANGLE */) {
        depth++;
        hasContent = true;
      } else if (token.type === "RANGLE" /* RANGLE */) {
        depth--;
      }
      if (depth === 0 && hasContent && (token.type === "LANGUAGE" /* LANGUAGE */ || token.type === "DESCRIPTION" /* DESCRIPTION */ || token.type === "DEFINITION" /* DEFINITION */ || token.type === "RULES" /* RULES */ || token.type === "TERMINOLOGY" /* TERMINOLOGY */ || token.type === "ONTOLOGY" /* ONTOLOGY */ || token.type === "ANNOTATIONS" /* ANNOTATIONS */ || token.type === "RM_OVERLAY" /* RM_OVERLAY */)) {
        break;
      }
      odinTokens.push(this.advance());
    }
    odinTokens.push({
      type: "EOF" /* EOF */,
      value: "",
      line: this.peek().line,
      column: this.peek().column
    });
    return odinTokens;
  }
  skipToNextSection() {
    let depth = 0;
    while (!this.isAtEnd()) {
      const token = this.peek();
      if (token.type === "LBRACE" /* LBRACE */) {
        depth++;
      } else if (token.type === "RBRACE" /* RBRACE */) {
        depth--;
      }
      if (depth === 0 && (token.type === "LANGUAGE" /* LANGUAGE */ || token.type === "DESCRIPTION" /* DESCRIPTION */ || token.type === "DEFINITION" /* DEFINITION */ || token.type === "RULES" /* RULES */ || token.type === "TERMINOLOGY" /* TERMINOLOGY */ || token.type === "ANNOTATIONS" /* ANNOTATIONS */)) {
        break;
      }
      this.advance();
    }
  }
  // Token navigation helpers
  check(type2) {
    if (this.isAtEnd())
      return false;
    return this.peek().type === type2;
  }
  advance() {
    if (!this.isAtEnd())
      this.position++;
    return this.previous();
  }
  consume(type2, message) {
    if (this.check(type2))
      return this.advance();
    throw this.error(message);
  }
  consumeKeyword(type2, message) {
    if (this.check(type2))
      return this.advance();
    throw this.error(message);
  }
  peek() {
    return this.tokens[this.position];
  }
  previous() {
    return this.tokens[this.position - 1];
  }
  isAtEnd() {
    return this.position >= this.tokens.length || this.peek().type === "EOF" /* EOF */;
  }
  error(message) {
    const token = this.peek();
    return new Error(
      `Parse error at line ${token.line}, column ${token.column}: ${message}`
    );
  }
};

// enhanced/parser/adl_version.ts
function hasSectionHeader(source, section) {
  return new RegExp(`^[ \\t]*${section}\\b`, "im").test(source);
}
function detectAdlVersion(source) {
  const head = source.slice(0, 1200);
  const meta = head.match(/adl_version\s*=\s*([\d.]+)/i);
  if (meta) {
    const v2 = meta[1];
    if (v2.startsWith("2"))
      return "2.x";
    if (v2.startsWith("1.4") || v2.startsWith("1.5"))
      return "1.4";
  }
  const hasTerminology = hasSectionHeader(source, "terminology");
  const hasOntology = hasSectionHeader(source, "ontology");
  if (hasOntology && !hasTerminology)
    return "1.4";
  for (const name of [
    "constraint_definitions",
    "constraint_bindings",
    "terminologies_available"
  ]) {
    if (hasSectionHeader(source, name))
      return "1.4";
  }
  if (/\badl_version\s*=\s*2/i.test(head))
    return "2.x";
  if (hasTerminology)
    return "2.x";
  return "unknown";
}

// enhanced/parser/adl14_to_adl2_converter.ts
var DEFAULT_OPTS = {
  targetAdlVersion: "2.0.6",
  rmRelease: "1.0.4",
  markGenerated: true
};
function convertAdl14ToAdl2(source, options) {
  const opts = { ...DEFAULT_OPTS, ...options };
  const warnings = [];
  const version = detectAdlVersion(source);
  if (version === "2.x") {
    return { adl2Text: source, converted: false, warnings };
  }
  if (version === "unknown") {
    warnings.push(
      "ADL version not detected; applying light ADL 1.4 normalisation heuristics."
    );
  }
  let text = source.replace(/\r\n/g, "\n");
  text = normalizeArchetypeHeader(text, opts, warnings);
  text = removeStandaloneSections(text, ["concept", "revision"], warnings);
  text = renameSectionKeyword(text, "ontology", "terminology");
  text = renameSectionKeyword(text, "constraint_bindings", "term_bindings");
  text = stripTerminologiesAvailable(text);
  text = flattenTermDefinitionItemsWrappers(text);
  text = convertTerminologyAcCodes(text, warnings);
  text = mergeConstraintDefinitionsIntoTermDefinitions(text, warnings);
  text = migrateValueSetsSection(text, warnings);
  text = convertDefinitionNodeIds(text);
  text = stripDeprecatedMatchesAny(text);
  text = normalizeArchetypeHridVersion(text, warnings);
  return { adl2Text: text, converted: true, warnings };
}
function normalizeArchetypeHeader(text, opts, warnings) {
  const lines = text.split("\n");
  const out = [];
  let headerDone = false;
  for (let i2 = 0; i2 < lines.length; i2++) {
    const line = lines[i2];
    const trimmed = line.trim();
    if (!headerDone && /^archetype\b/i.test(trimmed)) {
      if (trimmed.includes("(") && /adl_version/i.test(trimmed)) {
        if (!/adl_version\s*=\s*2/i.test(trimmed)) {
          warnings.push("Updated adl_version in header to ADL 2.x.");
          out.push(
            line.replace(
              /adl_version\s*=\s*[^;)]+/i,
              `adl_version=${opts.targetAdlVersion}`
            )
          );
        } else {
          out.push(line);
        }
        headerDone = true;
        continue;
      }
      const meta = [
        `adl_version=${opts.targetAdlVersion}`,
        `rm_release=${opts.rmRelease}`
      ];
      if (opts.markGenerated)
        meta.push("generated");
      out.push(`archetype (${meta.join("; ")})`);
      warnings.push("Inserted ADL 2 metadata on archetype header.");
      headerDone = true;
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}
function removeStandaloneSections(text, sectionNames, warnings) {
  let result = text;
  for (const name of sectionNames) {
    const re2 = new RegExp(
      `^([ \\t]*)${name}[ \\t]*\\n([\\s\\S]*?)(?=^[ \\t]*(?:language|description|definition|ontology|terminology|rules|annotations|rm_overlay|concept|revision|archetype|template|operational_template)\\b|\\Z)`,
      "gim"
    );
    if (re2.test(result)) {
      warnings.push(`Removed ADL 1.4 '${name}' section.`);
      result = result.replace(re2, "");
    }
  }
  return result;
}
function renameSectionKeyword(text, from, to2) {
  return text.replace(
    new RegExp(`^([ \\t]*)${from}\\b`, "gim"),
    `$1${to2}`
  );
}
function stripTerminologiesAvailable(text) {
  return text.replace(
    /^[ \t]*terminologies_available\s*=\s*<[^>]*>\s*\n?/gim,
    ""
  );
}
function flattenTermDefinitionItemsWrappers(text) {
  return text.replace(
    /^([ \t]*)items\s*=\s*<\s*\n([\s\S]*?)^\1>/gm,
    (_match, indent, body) => {
      const inner = body.split("\n").map((l2) => `${indent}    ${l2.trimStart()}`);
      return inner.join("\n") + "\n";
    }
  );
}
function convertTerminologyAcCodes(text, warnings) {
  const sections = splitTopLevelSections(text);
  let changed = false;
  const converted = sections.map((sec) => {
    const header = sec.header.trim().toLowerCase();
    if (header !== "ontology" && header !== "terminology")
      return sec.raw;
    const body = convertAcCodeKeysInTerminologyBody(sec.body);
    if (body !== sec.body)
      changed = true;
    return sec.header + "\n" + body;
  });
  if (changed) {
    warnings.push("Converted ac-code keys in terminology to ADL2 id form.");
  }
  return converted.join("\n");
}
function convertAcCodeKeysInTerminologyBody(body) {
  return body.replace(
    /\["(at\d+|ac[\d.]+)"\]/gi,
    (_m, code) => `["${acCodeToIdKey(code)}"]`
  ).replace(
    /\[(at\d+|ac[\d.]+)\]/gi,
    (_m, code) => `[${acCodeToIdKey(code)}]`
  );
}
function acCodeToIdKey(code) {
  const at2 = /^at(\d+)$/i.exec(code);
  if (at2)
    return `id${parseInt(at2[1], 10)}`;
  const ac = /^ac([\d.]+)$/i.exec(code);
  if (ac)
    return `ac${ac[1]}`;
  return code;
}
function parseTermTableEntries(block) {
  const entries = [];
  const re2 = /\["([^"]+)"\]\s*=\s*</g;
  let m2;
  while ((m2 = re2.exec(block)) !== null) {
    const open = block.indexOf("<", m2.index);
    let depth = 0;
    let close = open;
    for (let i2 = open; i2 < block.length; i2++) {
      if (block[i2] === "<")
        depth++;
      else if (block[i2] === ">") {
        depth--;
        if (depth === 0) {
          close = i2;
          break;
        }
      }
    }
    const body = block.slice(open + 1, close).trim();
    entries.push({
      code: m2[1],
      lines: body ? body.split("\n").map((l2) => l2.trimEnd()) : []
    });
  }
  return entries;
}
function mergeTermEntryLines(existing, incoming) {
  const map = /* @__PURE__ */ new Map();
  for (const line of existing) {
    const kv = /^(\w+)\s*=/.exec(line.trim());
    if (kv)
      map.set(kv[1], line);
  }
  for (const line of incoming) {
    const kv = /^(\w+)\s*=/.exec(line.trim());
    if (kv)
      map.set(kv[1], line);
    else if (line.trim())
      map.set(`__${map.size}`, line);
  }
  return [...map.values()];
}
function parseLanguageBlocks(block) {
  const langs = /* @__PURE__ */ new Map();
  const re2 = /\["([^"]+)"\]\s*=\s*</g;
  let m2;
  while ((m2 = re2.exec(block)) !== null) {
    const open = block.indexOf("<", m2.index);
    let depth = 0;
    for (let i2 = open; i2 < block.length; i2++) {
      if (block[i2] === "<")
        depth++;
      else if (block[i2] === ">") {
        depth--;
        if (depth === 0) {
          langs.set(m2[1], block.slice(open + 1, i2));
          break;
        }
      }
    }
  }
  return langs;
}
function mergeLanguageTermBlocks(termDefsBlock, constraintDefsBlock) {
  const termLangs = parseLanguageBlocks(termDefsBlock);
  const constraintLangs = parseLanguageBlocks(constraintDefsBlock);
  for (const [lang, constraintInner] of constraintLangs) {
    const termInner = termLangs.get(lang) ?? "";
    const termEntries = parseTermTableEntries(termInner);
    const constraintEntries = parseTermTableEntries(constraintInner);
    const byCode = new Map(termEntries.map((e2) => [e2.code, e2]));
    for (const ce2 of constraintEntries) {
      const idCode = acCodeToIdKey(ce2.code);
      const existing = byCode.get(idCode) ?? byCode.get(ce2.code);
      if (existing) {
        existing.lines = mergeTermEntryLines(existing.lines, ce2.lines);
        byCode.set(existing.code, existing);
      } else {
        byCode.set(idCode, { code: idCode, lines: ce2.lines });
      }
    }
    const mergedEntries = [...byCode.values()].map((e2) => {
      const inner = e2.lines.map((l2) => `            ${l2.trim()}`).join("\n");
      return `        ["${e2.code}"] = <
${inner}
        >`;
    }).join("\n");
    termLangs.set(lang, mergedEntries || termInner.trim());
  }
  return [...termLangs.entries()].map(([lang, inner]) => {
    const body = inner.includes('["') ? inner : inner.trim();
    return `    ["${lang}"] = <
${body}
    >`;
  }).join("\n");
}
function extractOdinAssignmentBlock(text, key) {
  const re2 = new RegExp(`\\b${key}\\s*=\\s*<`, "i");
  const match = re2.exec(text);
  if (!match)
    return void 0;
  const open = text.indexOf("<", match.index);
  let depth = 0;
  for (let i2 = open; i2 < text.length; i2++) {
    if (text[i2] === "<")
      depth++;
    else if (text[i2] === ">") {
      depth--;
      if (depth === 0)
        return text.slice(open + 1, i2);
    }
  }
  return void 0;
}
function mergeConstraintDefinitionsIntoTermDefinitions(text, warnings) {
  const termBody = extractOdinAssignmentBlock(text, "term_definitions");
  const constraintBody = extractOdinAssignmentBlock(text, "constraint_definitions");
  if (!termBody || !constraintBody) {
    return text.replace(/\s*constraint_definitions\s*=\s*<[\s\S]*?>\s*/gi, "");
  }
  warnings.push(
    "constraint_definitions merged into term_definitions by code (ADL 1.4 \u2192 2)."
  );
  const merged = mergeLanguageTermBlocks(termBody, constraintBody);
  const termStart = text.search(/\bterm_definitions\s*=/i);
  const termOpen = text.indexOf("<", termStart);
  let depth = 0;
  let termClose = -1;
  for (let i2 = termOpen; i2 < text.length; i2++) {
    if (text[i2] === "<")
      depth++;
    else if (text[i2] === ">") {
      depth--;
      if (depth === 0) {
        termClose = i2;
        break;
      }
    }
  }
  const before = text.slice(0, termOpen + 1);
  const after = text.slice(termClose);
  const withoutConstraint = after.replace(
    /\s*constraint_definitions\s*=\s*<[\s\S]*?>\s*/i,
    ""
  );
  return `${before}
${merged}
    ${withoutConstraint}`;
}
function migrateValueSetsSection(text, warnings) {
  const re2 = /^([ \t]*)value_sets\s*=\s*<\s*\n([\s\S]*?)^\1>/gim;
  if (!re2.test(text))
    return text;
  warnings.push("Normalised value_sets block under terminology.");
  return text.replace(re2, (_full, indent, body) => {
    const inner = body.replace(
      /\[(at\d+|ac[\d.]+)\]/gi,
      (_m, code) => `[${acCodeToIdKey(code)}]`
    );
    return `${indent}value_sets = <
${inner}${indent}>`;
  });
}
function convertDefinitionNodeIds(text) {
  const sections = splitTopLevelSections(text);
  const converted = sections.map((sec) => {
    if (!/^(definition|rules)\b/i.test(sec.header.trim()))
      return sec.raw;
    return sec.header + "\n" + convertAtNodeIdsInBody(sec.body);
  });
  return converted.join("\n");
}
function convertAtNodeIdsInBody(body) {
  return body.replace(
    /\[(at)(\d+)\]/gi,
    (_m, _at, digits) => `[id${parseInt(digits, 10)}]`
  );
}
function stripDeprecatedMatchesAny(text) {
  return text.replace(/\s+matches\s*\{\s*\*\s*\}/g, "");
}
function normalizeArchetypeHridVersion(text, warnings) {
  const updated = text.replace(
    /^([ \t]+)(openEHR-[^\s]+)\.v(\d+)\s*$/gim,
    (_line, indent, base, major) => {
      warnings.push(`Normalised HRID version v${major} \u2192 v${major}.0.0.`);
      return `${indent}${base}.v${major}.0.0`;
    }
  );
  return updated;
}
function splitTopLevelSections(text) {
  const lines = text.split("\n");
  const slices = [];
  let currentHeader = "";
  let currentBody = [];
  let startIdx = 0;
  const isSectionStart = (trimmed) => /^(archetype|template|operational_template|language|description|definition|ontology|terminology|rules|annotations|rm_overlay)\b/i.test(trimmed);
  for (let i2 = 0; i2 < lines.length; i2++) {
    const trimmed = lines[i2].trim();
    if (isSectionStart(trimmed)) {
      if (currentHeader || currentBody.length) {
        const raw = lines.slice(startIdx, i2).join("\n");
        slices.push({
          header: currentHeader,
          body: currentBody.join("\n"),
          raw
        });
      }
      currentHeader = lines[i2];
      currentBody = [];
      startIdx = i2;
    } else if (currentHeader) {
      currentBody.push(lines[i2]);
    }
  }
  if (currentHeader || currentBody.length) {
    slices.push({
      header: currentHeader,
      body: currentBody.join("\n"),
      raw: lines.slice(startIdx).join("\n")
    });
  }
  if (slices.length === 0) {
    return [{ header: "", body: text, raw: text }];
  }
  return slices;
}

// enhanced/parser/parse_adl.ts
function parseAdl(source, options) {
  const convert = options?.convertAdl14 !== false;
  const detectedVersion = detectAdlVersion(source);
  let adl2Source = source;
  let convertedFrom14 = false;
  let conversionWarnings = [];
  if (convert && detectedVersion === "1.4") {
    const conv = convertAdl14ToAdl2(source, {
      targetAdlVersion: options?.targetAdlVersion,
      rmRelease: options?.rmRelease
    });
    adl2Source = conv.adl2Text;
    convertedFrom14 = conv.converted;
    conversionWarnings = conv.warnings;
  }
  const tokenizer = new ADL2Tokenizer(adl2Source);
  const parseResult = new ADL2Parser(tokenizer.tokenize()).parse();
  return {
    ...parseResult,
    warnings: [...conversionWarnings, ...parseResult.warnings],
    detectedVersion,
    convertedFrom14,
    conversionWarnings,
    adl2Source
  };
}

// enhanced/parser/legacy/xml_aom_mapper.ts
var import_fast_xml_parser = __toESM(require_fxp());
function parseLegacyTemplateXml(xml) {
  const parser = new import_fast_xml_parser.XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    parseTagValue: true,
    trimValues: true,
    isArray: (_name, jpath) => {
      const p2 = jpath;
      return p2.endsWith(".attributes") || p2.endsWith(".children") || p2.endsWith(".code_list") || p2.endsWith(".list") || p2.endsWith(".term_definitions") || p2.endsWith(".items");
    }
  });
  const doc = parser.parse(xml);
  const root2 = doc.template ?? doc.OPERATIONALTEMPLATE ?? doc.operationaltemplate;
  if (!root2 || typeof root2 !== "object") {
    throw new Error("Expected root <template> element");
  }
  return root2;
}
function asArray(value) {
  if (value === void 0 || value === null)
    return [];
  return Array.isArray(value) ? value : [value];
}
function textValue(node, key = "value") {
  if (node === void 0 || node === null)
    return void 0;
  if (typeof node === "string" || typeof node === "number")
    return String(node);
  if (typeof node === "object") {
    const rec = node;
    if (rec[key] !== void 0)
      return textValue(rec[key], key);
    if (rec.code_string !== void 0)
      return String(rec.code_string);
  }
  return void 0;
}
function xsiType(node) {
  const t2 = node["@_type"] ?? node["@_xsi:type"] ?? "";
  return String(t2).replace(/^.*:/, "");
}
function parseMultiplicity(node) {
  if (!node || typeof node !== "object")
    return void 0;
  const n2 = node;
  const interval2 = n2.interval ?? n2;
  const m2 = new Multiplicity_interval();
  if (interval2.lower !== void 0)
    m2.lower = Number(interval2.lower);
  if (interval2.upper !== void 0)
    m2.upper = Number(interval2.upper);
  if (interval2.lower_unbounded !== void 0) {
    m2.lower_unbounded = interval2.lower_unbounded === true || interval2.lower_unbounded === "true";
  }
  if (interval2.upper_unbounded !== void 0) {
    m2.upper_unbounded = interval2.upper_unbounded === true || interval2.upper_unbounded === "true";
  }
  if (interval2.lower_included !== void 0) {
    m2.lower_included = interval2.lower_included === true || interval2.lower_included === "true";
  }
  if (interval2.upper_included !== void 0) {
    m2.upper_included = interval2.upper_included === true || interval2.upper_included === "true";
  }
  return m2;
}
function parseCardinality(node) {
  if (!node || typeof node !== "object")
    return void 0;
  const n2 = node;
  const card = new CARDINALITY();
  if (n2.is_ordered !== void 0) {
    card.is_ordered = n2.is_ordered === true || n2.is_ordered === "true";
  }
  if (n2.is_unique !== void 0) {
    card.is_unique = n2.is_unique === true || n2.is_unique === "true";
  }
  card.interval = parseMultiplicity(n2.interval ?? n2);
  return card;
}
function mapPrimitiveType(xsi) {
  const map = {
    C_DV_QUANTITY: "C_QUANTITY",
    C_QUANTITY: "C_QUANTITY",
    C_DV_CODED_TEXT: "C_CODED_TEXT",
    C_CODED_TEXT: "C_CODED_TEXT",
    C_CODE_PHRASE: "C_TERMINOLOGY_CODE",
    C_TERMINOLOGY_CODE: "C_TERMINOLOGY_CODE",
    C_DV_TEXT: "C_STRING",
    C_STRING: "C_STRING",
    C_INTEGER: "C_INTEGER",
    C_REAL: "C_REAL",
    C_BOOLEAN: "C_BOOLEAN",
    C_DV_DATE_TIME: "C_DATE_TIME",
    C_DATE_TIME: "C_DATE_TIME",
    C_DV_DATE: "C_DATE",
    C_DATE: "C_DATE",
    C_DV_TIME: "C_TIME",
    C_TIME: "C_TIME",
    C_DV_DURATION: "C_DURATION",
    C_DURATION: "C_DURATION",
    C_DV_ORDINAL: "C_ORDINAL",
    C_ORDINAL: "C_ORDINAL"
  };
  return map[xsi] ?? xsi;
}
function parseCObject(node) {
  if (!node || typeof node !== "object") {
    throw new Error("Invalid C_OBJECT node");
  }
  const n2 = node;
  const type2 = (xsiType(n2) || amFieldString(n2, "rm_type_name", "rmTypeName")) ?? "C_COMPLEX_OBJECT";
  if (type2 === "C_ARCHETYPE_ROOT") {
    return parseCArchetypeRoot(n2);
  }
  if (type2 === "C_COMPLEX_OBJECT" || !type2.startsWith("C_")) {
    return parseCComplexObject(n2);
  }
  const mapped = mapPrimitiveType(type2);
  if (mapped === "C_QUANTITY")
    return parseCQuantity(n2);
  if (mapped === "C_TERMINOLOGY_CODE")
    return parseCTerminologyCode(n2);
  if (mapped === "C_CODED_TEXT")
    return parseCCodedText(n2);
  if (mapped === "C_STRING")
    return parseCString(n2);
  if (mapped === "C_INTEGER")
    return parseCInteger(n2);
  if (mapped === "C_REAL")
    return parseCReal(n2);
  if (mapped === "C_BOOLEAN")
    return parseCBoolean(n2);
  const fallback = new C_PRIMITIVE_OBJECT();
  fallback.rm_type_name = String(n2.rm_type_name ?? type2.replace(/^C_/, "DV_"));
  return fallback;
}
function parseOccurrencesOrMultiplicity(val) {
  if (typeof val === "string") {
    const s2 = val.trim();
    const star = s2.match(/^(\d+|\*)\.\.(\d+|\*)$/);
    if (star) {
      const m2 = new Multiplicity_interval();
      const lo2 = star[1];
      const hi2 = star[2];
      if (lo2 === "*")
        m2.lower_unbounded = true;
      else
        m2.lower = Number(lo2);
      if (hi2 === "*")
        m2.upper_unbounded = true;
      else
        m2.upper = Number(hi2);
      return m2;
    }
  }
  return parseMultiplicity(val);
}
function amFieldString(n2, ...keys) {
  for (const k2 of keys) {
    const v2 = n2[k2];
    if (v2 !== void 0 && v2 !== null && String(v2).trim() !== "") {
      return String(v2);
    }
  }
  return void 0;
}
function applyOccurrence(target, n2) {
  const rm = amFieldString(n2, "rm_type_name", "rmTypeName");
  if (rm)
    target.rm_type_name = rm;
  const nodeId = amFieldString(n2, "node_id", "nodeId");
  if (nodeId)
    target.node_id = nodeId;
  target.occurrences = parseOccurrencesOrMultiplicity(n2.occurrences);
}
function parseCComplexObject(n2) {
  const obj = new C_COMPLEX_OBJECT();
  applyOccurrence(obj, n2);
  obj.attributes = asArray(n2.attributes).map(parseAttribute).filter(
    Boolean
  );
  return obj;
}
function parseCArchetypeRoot(n2) {
  const root2 = new C_ARCHETYPE_ROOT();
  applyOccurrence(root2, n2);
  root2.archetype_ref = textValue(n2.archetype_id) ?? textValue(n2.archetype_ref) ?? textValue(n2.archetypeRef);
  root2.attributes = asArray(n2.attributes).map(parseAttribute).filter(
    Boolean
  );
  return root2;
}
function parseAttribute(node) {
  if (!node || typeof node !== "object")
    return null;
  const n2 = node;
  const type2 = xsiType(n2);
  const attr = type2 === "C_MULTIPLE_ATTRIBUTE" ? new C_MULTIPLE_ATTRIBUTE() : new C_SINGLE_ATTRIBUTE();
  attr.rm_attribute_name = amFieldString(n2, "rm_attribute_name", "rmAttributeName") ?? "";
  attr.existence = parseOccurrencesOrMultiplicity(n2.existence);
  if (attr instanceof C_MULTIPLE_ATTRIBUTE) {
    attr.cardinality = parseCardinality(n2.cardinality);
  }
  const children2 = asArray(n2.children).map(parseCObject);
  if (children2.length) {
    attr.children = children2;
  }
  return attr;
}
function parseCString(n2) {
  const s2 = new C_STRING();
  applyOccurrence(s2, n2);
  if (!s2.rm_type_name)
    s2.rm_type_name = "STRING";
  if (n2.pattern)
    s2.pattern = String(n2.pattern);
  const lists = asArray(n2.list).map(
    (x2) => String(x2.value ?? x2)
  );
  if (lists.length)
    s2.list = lists;
  return s2;
}
function constraintToRange(n2) {
  const direct = parseOccurrencesOrMultiplicity(n2.range);
  if (direct)
    return direct;
  const constraints = asArray(n2.constraint);
  if (!constraints.length)
    return void 0;
  const first = constraints[0];
  if (first && typeof first === "object") {
    return parseOccurrencesOrMultiplicity(first);
  }
  return void 0;
}
function parseCInteger(n2) {
  const i2 = new C_INTEGER();
  applyOccurrence(i2, n2);
  if (!i2.rm_type_name)
    i2.rm_type_name = "INTEGER";
  i2.range = constraintToRange(n2);
  return i2;
}
function parseCReal(n2) {
  const r2 = new C_REAL();
  applyOccurrence(r2, n2);
  if (!r2.rm_type_name)
    r2.rm_type_name = "REAL";
  r2.range = constraintToRange(n2);
  return r2;
}
function parseCBoolean(n2) {
  const b2 = new C_BOOLEAN();
  applyOccurrence(b2, n2);
  if (n2.true_valid !== void 0) {
    b2.true_valid = n2.true_valid === true || n2.true_valid === "true";
  }
  if (n2.false_valid !== void 0) {
    b2.false_valid = n2.false_valid === true || n2.false_valid === "true";
  }
  return b2;
}
function parseCTerminologyCode(n2) {
  const t2 = new C_TERMINOLOGY_CODE();
  applyOccurrence(t2, n2);
  t2.rm_type_name = "CODE_PHRASE";
  const tid = n2.terminology_id ?? n2.terminologyId;
  if (typeof tid === "string") {
    t2.terminology_id = tid;
  } else if (tid && typeof tid === "object") {
    const v2 = textValue(tid);
    if (v2)
      t2.terminology_id = v2;
  }
  const fromList = asArray(n2.code_list).map(String);
  const fromConstraint = asArray(n2.constraint).filter(
    (x2) => typeof x2 === "string"
  ).map(String);
  const codes = fromList.length ? fromList : fromConstraint;
  if (codes.length === 1)
    t2.constraint = codes[0];
  if (!t2.constraint) {
    const ext = asArray(n2.includedExternalTerminologyCodes);
    for (const entry of ext) {
      if (!entry || typeof entry !== "object")
        continue;
      const code = entry.code;
      if (code !== void 0) {
        t2.constraint = String(code);
        break;
      }
    }
  }
  return t2;
}
function parseCCodedText(n2) {
  const c2 = new C_CODED_TEXT();
  applyOccurrence(c2, n2);
  return c2;
}
function parseCQuantity(n2) {
  const q2 = new C_QUANTITY();
  applyOccurrence(q2, n2);
  q2.rm_type_name = "DV_QUANTITY";
  const prop = n2.property;
  if (prop) {
    q2.property = textValue(prop.code_string) ?? textValue(prop);
  }
  const items = asArray(n2.list).map((entry) => {
    const item = new C_QUANTITY_ITEM();
    const rec = entry;
    item.units = String(rec.units ?? rec.value ?? entry);
    return item;
  });
  if (items.length)
    q2.list = items;
  return q2;
}
function collectTermDefinitions(node, bag) {
  if (!node || typeof node !== "object")
    return;
  const n2 = node;
  for (const td of asArray(n2.term_definitions)) {
    const rec = td;
    const code = String(rec["@_code"] ?? rec.code ?? "");
    if (!code)
      continue;
    const items = asArray(rec.items);
    const entry = {};
    for (const it2 of items) {
      const item = it2;
      const id2 = String(item["@_id"] ?? item.id ?? "");
      const val = textValue(item) ?? String(item.value ?? item);
      if (id2 === "text")
        entry.text = val;
      if (id2 === "description")
        entry.description = val;
    }
    if (!bag.en)
      bag.en = {};
    bag.en[code] = entry;
  }
  for (const child of asArray(n2.children))
    collectTermDefinitions(child, bag);
  for (const attr of asArray(n2.attributes)) {
    for (const c2 of asArray(attr.children)) {
      collectTermDefinitions(c2, bag);
    }
  }
}

// enhanced/parser/legacy/opt_xml_parser.ts
function setArchetypeId(target, id2) {
  const aid = new ARCHETYPE_ID();
  aid.value = id2;
  target.archetype_id = aid;
}
function isOptXml(source) {
  const t2 = source.trimStart();
  if (!t2.startsWith("<?xml") && !t2.startsWith("<"))
    return false;
  if (t2.includes("openEHR/v1/Template"))
    return false;
  return /<template[\s>]/i.test(t2) && (t2.includes("schemas.openehr.org/v1") || t2.includes("C_ARCHETYPE_ROOT") || t2.includes("C_COMPLEX_OBJECT") || t2.includes("template_id"));
}
function parseOptXml(source) {
  const warnings = [];
  const root2 = parseLegacyTemplateXml(source);
  const opt = new OPERATIONAL_TEMPLATE();
  opt.adl_version = "1.4";
  opt.rm_release = "1.0.4";
  const templateId = textValue(root2.template_id);
  if (templateId)
    setArchetypeId(opt, templateId);
  const langCode = textValue(
    root2.language?.code_string ?? root2.language
  );
  if (langCode) {
    opt.original_language = langCode;
  }
  const defNode = root2.definition;
  if (!defNode || typeof defNode !== "object") {
    throw new Error("OPT missing <definition>");
  }
  const definition = parseCObject(defNode);
  if (!(definition instanceof C_COMPLEX_OBJECT)) {
    throw new Error("OPT definition root must be C_COMPLEX_OBJECT");
  }
  const defRec = defNode;
  const archId = textValue(defRec.archetype_id);
  if (archId && !opt.archetype_id?.value)
    setArchetypeId(opt, archId);
  opt.definition = definition;
  const termBag = {};
  collectTermDefinitions(defNode, termBag);
  if (Object.keys(termBag).length) {
    opt.ontology = {
      term_definitions: termBag,
      term_bindings: {},
      constraint_bindings: {},
      value_sets: {}
    };
  }
  if (root2.concept) {
    warnings.push("OPT concept metadata preserved in description only (not full round-trip).");
  }
  return { operationalTemplate: opt, warnings };
}

// enhanced/parser/legacy/oet_xml_parser.ts
var import_fast_xml_parser2 = __toESM(require_fxp());
function isOetXml(source) {
  const t2 = source.trimStart();
  return (t2.startsWith("<?xml") || t2.startsWith("<")) && /<template[\s>]/i.test(t2) && t2.includes("openEHR/v1/Template");
}
function parseOetXmlDocument(xml) {
  const parser = new import_fast_xml_parser2.XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    parseTagValue: true,
    trimValues: true,
    isArray: (_n2, jpath) => {
      const p2 = jpath;
      return p2.endsWith(".Rule") || p2.endsWith(".Items") || p2.endsWith(".item") || p2.endsWith(".includedValues");
    }
  });
  const doc = parser.parse(xml);
  const root2 = doc.template;
  if (!root2 || typeof root2 !== "object")
    throw new Error("Expected OET <template> root");
  return root2;
}
function parseRule(node) {
  const rule = { path: String(node["@_path"] ?? node.path ?? "") };
  if (node["@_max"] !== void 0)
    rule.max = Number(node["@_max"]);
  if (node["@_min"] !== void 0)
    rule.min = Number(node["@_min"]);
  const constraint = node.constraint;
  if (constraint) {
    rule.includedValues = asArray(constraint.includedValues).map(String);
  }
  return rule;
}
function parseItems(node) {
  const item = {
    path: String(node["@_path"] ?? ""),
    archetypeId: String(node["@_archetype_id"] ?? node.archetype_id ?? ""),
    rules: asArray(node.Rule).map((r2) => parseRule(r2)),
    items: asArray(node.Items).map((c2) => parseItems(c2))
  };
  if (node["@_max"] !== void 0)
    item.max = Number(node["@_max"]);
  if (node["@_min"] !== void 0)
    item.min = Number(node["@_min"]);
  item.type = String(node["@_type"] ?? "").replace(/^.*:/, "");
  return item;
}
function parseOetXml(source) {
  const warnings = [];
  const root2 = parseOetXmlDocument(source);
  const def = root2.definition;
  const document2 = {
    id: textValue(root2.id) ?? String(root2.id ?? ""),
    name: String(root2.name ?? ""),
    rules: [],
    items: []
  };
  if (def) {
    document2.definitionArchetypeId = String(def["@_archetype_id"] ?? def.archetype_id ?? "");
    document2.conceptName = String(def["@_concept_name"] ?? def.concept_name ?? "");
    document2.definitionName = String(def["@_name"] ?? def.name ?? "");
    document2.rules = asArray(def.Rule).map((r2) => parseRule(r2));
    document2.items = asArray(def.Items).map((i2) => parseItems(i2));
  }
  const template = new TEMPLATE();
  if (document2.definitionArchetypeId) {
    const aid = new ARCHETYPE_ID();
    aid.value = document2.definitionArchetypeId;
    template.archetype_id = aid;
  }
  if (!document2.definitionArchetypeId) {
    warnings.push("OET missing definition archetype_id");
  } else {
    warnings.push(
      "OET parsed as constraint document; compile to operational AOM with ArchetypeRepository + flattening."
    );
  }
  return { document: document2, template, warnings };
}

// enhanced/parser/legacy/json_aom_util.ts
function jsonType(node) {
  const t2 = node["@type"] ?? node["@_type"] ?? "";
  return String(t2).replace(/^.*:/, "");
}
function normalizeJsonNode(node) {
  const out = { ...node };
  if (out["@type"] && !out["@_type"])
    out["@_type"] = out["@type"];
  return out;
}
function parseArchetypeIdField(node) {
  if (!node)
    return void 0;
  if (typeof node === "string") {
    const id2 = new ARCHETYPE_ID();
    id2.value = node;
    return id2;
  }
  if (typeof node === "object") {
    const rec = node;
    const v2 = textValue(rec.value) ?? textValue(rec);
    if (v2) {
      const id2 = new ARCHETYPE_ID();
      id2.value = v2;
      return id2;
    }
  }
  return void 0;
}
function parseCodePhrase(node) {
  if (!node || typeof node !== "object")
    return void 0;
  const n2 = node;
  const cp = new CODE_PHRASE();
  if (n2.codeString !== void 0)
    cp.code_string = String(n2.codeString);
  if (n2.code_string !== void 0)
    cp.code_string = String(n2.code_string);
  const tid = n2.terminologyId ?? n2.terminology_id;
  if (tid && typeof tid === "object") {
    const t2 = tid;
    const termId = new TERMINOLOGY_ID();
    termId.value = textValue(t2.value) ?? String(t2.value ?? "");
    cp.terminology_id = termId;
  }
  return cp;
}

// enhanced/parser/legacy/template_json_normalize.ts
var PROPERTY_ALIASES = {
  rmTypeName: "rm_type_name",
  rmAttributeName: "rm_attribute_name",
  nodeId: "node_id",
  parentArchetypeId: "parent_archetype_id",
  archetypeRef: "archetype_ref",
  referenceType: "reference_type",
  adlVersion: "adl_version",
  templateId: "template_id",
  termDefinitions: "term_definitions",
  conceptCode: "concept_code",
  originalLanguage: "original_language",
  templateOverlays: "template_overlays",
  defaultValue: "default_value",
  buildUid: "build_uid",
  rmName: "rm_name",
  rmRelease: "rm_release",
  otherMetaData: "other_meta_data",
  attributeTuples: "attribute_tuples",
  codeString: "code_string",
  terminologyId: "terminology_id",
  lowerIncluded: "lower_included",
  upperIncluded: "upper_included",
  lowerUnbounded: "lower_unbounded",
  upperUnbounded: "upper_unbounded",
  trueValid: "true_valid",
  falseValid: "false_valid",
  isOrdered: "is_ordered",
  isUnique: "is_unique"
};
function normalizeBetterTemplateJson(root2) {
  return normalizeNode(root2);
}
function normalizeNode(value) {
  if (value === null || value === void 0)
    return value;
  if (Array.isArray(value))
    return value.map(normalizeNode);
  if (typeof value !== "object")
    return value;
  const rec = value;
  const typeRaw = String(rec["@type"] ?? rec["@_type"] ?? rec._type ?? "");
  const type2 = typeRaw.replace(/^.*:/, "");
  if (type2 === "BINARY_OPERATOR") {
    return normalizeBinaryOperator(rec);
  }
  const out = {};
  for (const [key, raw] of Object.entries(rec)) {
    let normKey = PROPERTY_ALIASES[key] ?? key;
    let normVal = normalizeNode(raw);
    if (key === "@type") {
      out["@type"] = raw;
      out["@_type"] = raw;
      continue;
    }
    if (key === "_type") {
      out["_type"] = raw;
      if (!out["@_type"])
        out["@_type"] = raw;
      continue;
    }
    if (normKey === "lifecycle_state" && normVal && typeof normVal === "object") {
      const ls2 = normVal;
      normVal = ls2.code_string ?? ls2.codeString ?? ls2.value ?? normVal;
    }
    if (normKey === "terminology_id" && normVal && typeof normVal === "object") {
      const tid = normVal;
      normVal = tid.value ?? tid;
    }
    if (normKey === "constraint" && Array.isArray(normVal)) {
      normVal = normalizeConstraintArray(normVal, type2);
    }
    out[normKey] = normVal;
  }
  return out;
}
function normalizeConstraintArray(items, parentType) {
  if (parentType === "C_INTEGER" || parentType === "C_REAL") {
    const intervals = items.map((item) => {
      if (item && typeof item === "object") {
        const iv = item;
        if (String(iv["@type"] ?? iv["@_type"] ?? iv._type ?? "").includes(
          "Interval"
        )) {
          return normalizeIntervalObject(iv);
        }
        return normalizeIntervalObject(iv);
      }
      return item;
    });
    return intervals.length === 1 ? intervals[0] : { interval: intervals[0] };
  }
  return items.map(normalizeNode);
}
function normalizeIntervalObject(iv) {
  return {
    lower: iv.lower,
    upper: iv.upper,
    lower_included: iv.lower_included ?? iv.lowerIncluded,
    upper_included: iv.upper_included ?? iv.upperIncluded,
    lower_unbounded: iv.lower_unbounded ?? iv.lowerUnbounded,
    upper_unbounded: iv.upper_unbounded ?? iv.upperUnbounded
  };
}
function normalizeBinaryOperator(rec) {
  const out = {
    ...rec,
    "@type": "EXPR_BINARY_OPERATOR",
    "@_type": "EXPR_BINARY_OPERATOR"
  };
  const op = rec.operator ?? rec.operator_def;
  if (typeof op === "string") {
    out.operator_def = {
      "@type": "OPERATOR_DEF_BUILTIN",
      "@_type": "OPERATOR_DEF_BUILTIN",
      identifier: op
    };
    delete out.operator;
  } else if (op && typeof op === "object") {
    out.operator_def = normalizeNode(op);
  }
  for (const [k2, v2] of Object.entries(rec)) {
    if (k2 === "operator" || k2 === "@type" || k2 === "@_type")
      continue;
    const nk = PROPERTY_ALIASES[k2] ?? k2;
    out[nk] = normalizeNode(v2);
  }
  return out;
}
function collectBetterJsonLintWarnings(raw) {
  const warnings = [];
  walkLint(raw, "", warnings);
  return warnings;
}
function walkLint(node, path, warnings) {
  if (!node || typeof node !== "object")
    return;
  if (Array.isArray(node)) {
    node.forEach((c2, i2) => walkLint(c2, `${path}[${i2}]`, warnings));
    return;
  }
  const rec = node;
  for (const key of ["rmTypeName", "rmAttributeName", "nodeId"]) {
    if (key in rec) {
      warnings.push(`${path}: unmapped Better field "${key}" (normaliser gap)`);
    }
  }
  for (const [k2, v2] of Object.entries(rec)) {
    if (k2 === "@type" || k2 === "@_type")
      continue;
    walkLint(v2, path ? `${path}.${k2}` : k2, warnings);
  }
}

// enhanced/parser/legacy/template_json_parser.ts
function isTemplateJson(source) {
  const t2 = source.trimStart();
  if (!t2.startsWith("{"))
    return false;
  try {
    const obj = JSON.parse(t2);
    const type2 = jsonType(obj);
    return type2 === "TEMPLATE" || type2 === "OPERATIONAL_TEMPLATE";
  } catch {
    return false;
  }
}
function parseTemplateJson(source) {
  const warnings = [];
  const raw = JSON.parse(source);
  const root2 = normalizeBetterTemplateJson(raw);
  warnings.push(...collectBetterJsonLintWarnings(raw));
  const type2 = jsonType(root2);
  if (type2 === "OPERATIONAL_TEMPLATE") {
    warnings.push("JSON operational template treated as template for flattening");
  }
  const template = parseTemplateObject(root2, warnings);
  const overlays = [];
  for (const raw2 of asArray(root2.template_overlays ?? root2.templateOverlays)) {
    if (!raw2 || typeof raw2 !== "object")
      continue;
    const rec = raw2;
    if (jsonType(rec) !== "TEMPLATE_OVERLAY") {
      warnings.push(`Skipped non-overlay in templateOverlays: ${jsonType(rec)}`);
      continue;
    }
    overlays.push(parseTemplateOverlay(rec, warnings));
  }
  return { template, overlays, warnings };
}
function parseTemplateObject(root2, warnings) {
  const template = new TEMPLATE();
  applyAuthoredArchetypeFields(template, root2, warnings);
  const tplId = root2.template_id ?? root2.templateId;
  if (tplId !== void 0) {
    template.template_id = String(tplId);
  }
  return template;
}
function parseTemplateOverlay(root2, warnings) {
  const overlay = new TEMPLATE_OVERLAY();
  applyAuthoredArchetypeFields(overlay, root2, warnings);
  return overlay;
}
function applyAuthoredArchetypeFields(target, root2, warnings) {
  if (root2.uid !== void 0) {
    const uid = new HIER_OBJECT_ID();
    uid.value = String(root2.uid);
    target.uid = uid;
  }
  target.archetype_id = parseArchetypeIdField(root2.archetypeId);
  target.parent_archetype_id = parseArchetypeIdField(root2.parentArchetypeId);
  if (root2.adlVersion !== void 0)
    target.adl_version = String(root2.adlVersion);
  if (root2.adl_version !== void 0)
    target.adl_version = String(root2.adl_version);
  const def = root2.definition;
  if (def && typeof def === "object") {
    target.definition = parseCObject(
      normalizeJsonNode(def)
    );
  }
  const term = root2.terminology;
  if (term && typeof term === "object") {
    target.ontology = parseJsonOntology(term, warnings);
  }
  if (root2.originalLanguage && typeof root2.originalLanguage === "object") {
    const lang = parseCodePhrase(root2.originalLanguage);
    if (lang && target.ontology) {
      target.ontology.original_language = lang;
    }
  }
}
function parseJsonOntology(node, _warnings) {
  const shell = new ARCHETYPE();
  const termDefs = node.termDefinitions ?? node.term_definitions;
  if (termDefs && typeof termDefs === "object") {
    applyTerminologyOdin(shell, { term_definitions: termDefs });
  }
  const onto = shell.ontology ?? new ARCHETYPE_ONTOLOGY();
  if (node.conceptCode !== void 0) {
    onto.concept_code = String(node.conceptCode);
  }
  return onto;
}

// enhanced/parser/legacy/archetype_repository.ts
var ArchetypeRepository = class _ArchetypeRepository {
  byId = /* @__PURE__ */ new Map();
  templates = /* @__PURE__ */ new Map();
  operational = /* @__PURE__ */ new Map();
  warnings = [];
  loadedPaths = [];
  static async fromDirectory(rootDir) {
    const repo = new _ArchetypeRepository();
    await repo.loadDirectory(rootDir);
    return repo;
  }
  static fromEntries(entries) {
    const repo = new _ArchetypeRepository();
    for (const { path, content } of entries) {
      repo.loadFile(path, content);
    }
    return repo;
  }
  getWarnings() {
    return [...this.warnings];
  }
  listLoadedPaths() {
    return [...this.loadedPaths];
  }
  listTemplateIds() {
    return [...this.templates.keys()].sort();
  }
  listOperationalIds() {
    return [...this.operational.keys()].sort();
  }
  getTemplate(templateId) {
    return this.templates.get(templateId) ?? this.templates.get(templateId.replace(/\.v[\d.]+$/, ""));
  }
  getOperationalTemplate(id2) {
    return this.operational.get(id2) ?? this.operational.get(id2.replace(/\.v[\d.]+$/, ""));
  }
  /** Flatten an ADL2 source template using archetypes in this repository. */
  flattenTemplate(template) {
    return flattenToOperationalTemplate(template, this);
  }
  resolve(archetypeId) {
    return this.get(archetypeId);
  }
  async loadDirectory(rootDir) {
    for await (const entry of Deno.readDir(rootDir)) {
      const path = `${rootDir}/${entry.name}`;
      if (entry.isDirectory) {
        await this.loadDirectory(path);
        continue;
      }
      if (!/\.(adl|adls|opt|oet|t\.json|xml)$/i.test(entry.name))
        continue;
      try {
        const text = await Deno.readTextFile(path);
        this.loadFile(path, text);
      } catch (e2) {
        this.warnings.push(`Failed ${path}: ${e2.message}`);
      }
    }
  }
  loadFile(path, text) {
    this.loadedPaths.push(path);
    try {
      const trimmed = text.trim();
      if (!trimmed) {
        return { path, kind: "skipped", message: "empty file" };
      }
      if (trimmed.startsWith("{") && (isTemplateJson(trimmed) || /\.t\.json$/i.test(path))) {
        return this.ingestTemplateJson(path, trimmed);
      }
      if (trimmed.startsWith("<?xml") || trimmed.startsWith("<")) {
        if (isOetXml(trimmed)) {
          return {
            path,
            kind: "oet_xml",
            message: "OET XML (compiled at generation root)"
          };
        }
        if (isOptXml(trimmed)) {
          return {
            path,
            kind: "opt_xml",
            message: "OPT XML (parsed at generation root)"
          };
        }
        return { path, kind: "skipped", message: "unrecognized XML" };
      }
      const parsed = parseAdl(text, { convertAdl14: true });
      return this.ingestParseResult(path, parsed);
    } catch (e2) {
      const message = e2.message;
      this.warnings.push(`Failed ${path}: ${message}`);
      return { path, kind: "error", message };
    }
  }
  ingestTemplateJson(path, text) {
    const { template, overlays, warnings } = parseTemplateJson(text);
    for (const overlay of overlays) {
      this.add(overlay);
    }
    const id2 = template.archetype_id?.value ?? path;
    this.templates.set(id2, template);
    const base = id2.replace(/\.v[\d.]+$/, "");
    if (!this.templates.has(base))
      this.templates.set(base, template);
    for (const w2 of warnings) {
      this.warnings.push(`${path}: ${w2}`);
    }
    return { path, kind: "template_json", archetypeId: id2 };
  }
  ingestParseResult(path, parsed) {
    if (parsed.kind === "archetype" && parsed.archetype) {
      this.add(parsed.archetype);
      const id2 = parsed.archetype.archetype_id?.value ?? path;
      return { path, kind: "archetype", archetypeId: id2 };
    }
    if (parsed.kind === "template" && parsed.template) {
      const id2 = parsed.template.archetype_id?.value ?? path;
      this.templates.set(id2, parsed.template);
      const base = id2.replace(/\.v[\d.]+$/, "");
      if (!this.templates.has(base))
        this.templates.set(base, parsed.template);
      return { path, kind: "template", archetypeId: id2 };
    }
    if (parsed.kind === "operational_template" && parsed.operationalTemplate) {
      const id2 = parsed.operationalTemplate.archetype_id?.value ?? path;
      this.operational.set(id2, parsed.operationalTemplate);
      const base = id2.replace(/\.v[\d.]+$/, "");
      if (!this.operational.has(base))
        this.operational.set(base, parsed.operationalTemplate);
      return { path, kind: "operational_template", archetypeId: id2 };
    }
    return { path, kind: "skipped", message: `unsupported kind: ${parsed.kind}` };
  }
  add(archetype) {
    const id2 = archetype.archetype_id?.value;
    if (id2)
      this.byId.set(id2, archetype);
    const base = id2?.replace(/\.v[\d.]+$/, "");
    if (base && !this.byId.has(base))
      this.byId.set(base, archetype);
  }
  get(archetypeId) {
    return this.byId.get(archetypeId) ?? this.byId.get(archetypeId.replace(/\.v[\d.]+$/, ""));
  }
  has(archetypeId) {
    return this.get(archetypeId) !== void 0;
  }
  listIds() {
    return [...this.byId.keys()].sort();
  }
  clear() {
    this.byId.clear();
    this.templates.clear();
    this.operational.clear();
    this.warnings = [];
    this.loadedPaths = [];
  }
};

// enhanced/validation/archetype_path_resolver.ts
function adlNodeIdToAtCode(nodeId) {
  const m2 = /^id(\d+)$/i.exec(nodeId.trim());
  if (m2)
    return `at${m2[1].padStart(4, "0")}`;
  return nodeId;
}

// enhanced/am/aom_path_navigator.ts
function normalizeNodeId(nodeId) {
  const trimmed = nodeId.trim();
  const variants = /* @__PURE__ */ new Set([trimmed]);
  const at2 = /^at(\d+)$/i.exec(trimmed);
  if (at2) {
    const n2 = parseInt(at2[1], 10);
    variants.add(`id${n2}`);
    variants.add(`at${String(n2).padStart(4, "0")}`);
  }
  const id2 = /^id(\d+(?:\.\d+)*)$/i.exec(trimmed);
  if (id2) {
    variants.add(`at${id2[1].replace(/\./g, "").padStart(4, "0")}`);
    variants.add(adlNodeIdToAtCode(trimmed));
  }
  return [...variants];
}
function nodeIdsMatch(a2, b2) {
  if (!a2 || !b2)
    return false;
  const va2 = normalizeNodeId(a2);
  const vb = normalizeNodeId(b2);
  return va2.some((x2) => vb.includes(x2));
}
function parsePathSegment(segment) {
  const m2 = /^([A-Za-z_][\w]*)(?:\[([^\]]+)\])?$/.exec(segment);
  if (!m2)
    return {};
  return { attrName: m2[1], nodeId: m2[2] };
}
function splitArchetypePath(path) {
  const trimmed = path.trim();
  const normalized = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  if (!normalized)
    return [];
  const segments = [];
  let buf = "";
  let depth = 0;
  for (const c2 of normalized) {
    if (c2 === "[")
      depth++;
    else if (c2 === "]")
      depth--;
    if (c2 === "/" && depth === 0) {
      if (buf)
        segments.push(buf);
      buf = "";
    } else {
      buf += c2;
    }
  }
  if (buf)
    segments.push(buf);
  return segments;
}
function findAttribute2(obj, name) {
  return obj.attributes?.find((a2) => a2.rm_attribute_name === name);
}
function findChildByNodeId(attr, nodeId) {
  const children2 = attr.children ?? [];
  if (!nodeId) {
    if (children2.length === 1)
      return { child: children2[0], index: 0 };
    return void 0;
  }
  for (let i2 = 0; i2 < children2.length; i2++) {
    if (nodeIdsMatch(children2[i2].node_id, nodeId)) {
      return { child: children2[i2], index: i2 };
    }
  }
  return void 0;
}
function resolveAomPath(root2, path) {
  const segments = splitArchetypePath(path);
  if (segments.length === 0) {
    return { object: root2 };
  }
  let current = root2;
  let parentObject;
  let parentAttribute;
  let childIndex;
  for (const seg of segments) {
    const { attrName, nodeId } = parsePathSegment(seg);
    if (!attrName)
      continue;
    if (!(current instanceof C_COMPLEX_OBJECT))
      return void 0;
    const attr = findAttribute2(current, attrName);
    if (!attr)
      return void 0;
    const found = findChildByNodeId(attr, nodeId);
    if (!found)
      return void 0;
    parentObject = current;
    parentAttribute = attr;
    childIndex = found.index;
    current = found.child;
  }
  return {
    object: current,
    parentObject,
    parentAttribute,
    childIndex
  };
}
function replaceAtAomPath(root2, path, replacement) {
  const match = resolveAomPath(root2, path);
  if (!match?.parentAttribute || match.childIndex === void 0)
    return false;
  const children2 = match.parentAttribute.children;
  if (!children2)
    return false;
  children2[match.childIndex] = replacement;
  return true;
}

// enhanced/parser/legacy/oet_compiler.ts
function multiplicityFromMaxMin(max2, min2) {
  const m2 = new Multiplicity_interval();
  m2.lower = min2 ?? 0;
  m2.upper = max2 ?? 1;
  m2.lower_included = true;
  m2.upper_included = true;
  m2.lower_unbounded = false;
  m2.upper_unbounded = max2 === void 0 || max2 < 0;
  if (max2 === 0) {
    m2.upper = 0;
    m2.lower = 0;
  }
  return m2;
}
function joinArchetypePaths(base, relative) {
  const b2 = base.trim().replace(/\/+$/, "");
  const r2 = relative.trim();
  if (!r2)
    return b2;
  if (r2.startsWith("/"))
    return r2;
  return `${b2}/${r2}`;
}
function applyRule(root2, rule, warnings, pathPrefix = "") {
  const fullPath = joinArchetypePaths(pathPrefix, rule.path);
  if (!fullPath)
    return;
  const match = resolveAomPath(root2, fullPath);
  if (!match) {
    warnings.push(`OET rule path not found: ${fullPath}`);
    return;
  }
  const obj = match.object;
  if (rule.max !== void 0 || rule.min !== void 0) {
    obj.occurrences = multiplicityFromMaxMin(rule.max, rule.min);
  }
  if (rule.includedValues?.length) {
    if (obj instanceof C_STRING) {
      obj.list = [...rule.includedValues];
    } else if (obj instanceof C_PRIMITIVE_OBJECT) {
      const str = new C_STRING();
      str.list = [...rule.includedValues];
      obj.item = str;
      obj.rm_type_name = "STRING";
    } else {
      warnings.push(
        `includedValues at ${fullPath} targets non-string constraint (${obj.constructor.name})`
      );
    }
  }
}
function applyItem(root2, item, resolver, warnings, pathPrefix = "") {
  const itemPath = joinArchetypePaths(pathPrefix, item.path);
  if (itemPath && item.archetypeId) {
    const arch = resolver.resolve(item.archetypeId);
    if (!arch) {
      warnings.push(`OET item archetype not in repository: ${item.archetypeId}`);
    } else {
      const filler = new C_ARCHETYPE_ROOT();
      filler.archetype_ref = item.archetypeId;
      filler.rm_type_name = arch.definition?.rm_type_name ?? item.type ?? "COMPOSITION";
      if (item.max !== void 0 || item.min !== void 0) {
        filler.occurrences = multiplicityFromMaxMin(item.max, item.min);
      }
      if (!replaceAtAomPath(root2, itemPath, filler)) {
        warnings.push(`OET item path not found: ${itemPath}`);
      }
    }
  }
  for (const rule of item.rules)
    applyRule(root2, rule, warnings, itemPath);
  for (const child of item.items)
    applyItem(root2, child, resolver, warnings, itemPath);
}
function compileOetToOperational(oet, options) {
  const warnings = [...oet.warnings];
  const doc = oet.document;
  const archetypeId = doc.definitionArchetypeId;
  if (!archetypeId) {
    throw new Error("OET missing definition archetype_id");
  }
  const resolver = {
    resolve: (id2) => options.repository.get(id2)
  };
  const base = options.repository.get(archetypeId);
  if (!base?.definition) {
    throw new Error(`Archetype not found in repository: ${archetypeId}`);
  }
  const template = new TEMPLATE();
  const aid = new ARCHETYPE_ID();
  aid.value = options.templateId ?? doc.name ?? doc.id ?? `${archetypeId}.template`;
  template.archetype_id = aid;
  template.original_language = base.original_language;
  template.concept = doc.conceptName ?? doc.definitionName;
  template.definition = cloneComplexObject(base.definition);
  for (const rule of doc.rules)
    applyRule(template.definition, rule, warnings, "");
  for (const item of doc.items)
    applyItem(template.definition, item, resolver, warnings, "");
  const operationalTemplate = flattenToOperationalTemplate(template, resolver);
  operationalTemplate.adl_version = "2.0";
  operationalTemplate.is_generated = true;
  warnings.push(...options.repository.getWarnings());
  return { operationalTemplate, warnings };
}

// enhanced/parser/legacy/parse_template_input.ts
function detectTemplateInputFormat(source) {
  const t2 = source.trim();
  if (!t2)
    return "unknown";
  if (isTemplateJson(t2))
    return "template_json";
  if (isOetXml(t2))
    return "oet_xml";
  if (isOptXml(t2))
    return "opt_xml";
  if (t2.startsWith("operational_template") || t2.startsWith("template") || t2.startsWith("archetype")) {
    const v3 = detectAdlVersion(t2);
    if (v3 === "1.4")
      return "adl14";
    if (v3 === "2.x")
      return "adl2";
  }
  if (t2.startsWith("<?xml") || t2.startsWith("<")) {
    if (isOptXml(t2))
      return "opt_xml";
    if (isOetXml(t2))
      return "oet_xml";
  }
  const v2 = detectAdlVersion(t2);
  if (v2 === "1.4")
    return "adl14";
  if (v2 === "2.x")
    return "adl2";
  return "unknown";
}
function parseTemplateInput(source, options) {
  const format = detectTemplateInputFormat(source);
  const warnings = [];
  if (format === "opt_xml") {
    const { operationalTemplate, warnings: w2 } = parseOptXml(source);
    return {
      format,
      kind: "operational_template",
      operationalTemplate,
      warnings: [...w2]
    };
  }
  if (format === "oet_xml") {
    const oet = parseOetXml(source);
    if (options?.archetypeRepository) {
      try {
        const compiled = compileOetToOperational(oet, {
          repository: options.archetypeRepository
        });
        return {
          format,
          kind: "operational_template",
          operationalTemplate: compiled.operationalTemplate,
          oet,
          warnings: compiled.warnings
        };
      } catch (e2) {
        return {
          format,
          kind: "oet_document",
          template: oet.template,
          oet,
          warnings: [
            ...oet.warnings,
            `OET compile failed: ${e2.message}`
          ]
        };
      }
    }
    return {
      format,
      kind: "oet_document",
      template: oet.template,
      oet,
      warnings: oet.warnings
    };
  }
  if (format === "template_json") {
    const { template, overlays, warnings: w2 } = parseTemplateJson(source);
    warnings.push(...w2);
    if (options?.archetypeRepository) {
      for (const overlay of overlays) {
        options.archetypeRepository.add(overlay);
      }
      try {
        const operationalTemplate = flattenToOperationalTemplate(
          template,
          options.archetypeRepository
        );
        return {
          format,
          kind: "operational_template",
          operationalTemplate,
          template,
          warnings
        };
      } catch (e2) {
        warnings.push(`Flatten failed: ${e2.message}`);
      }
    }
    return {
      format,
      kind: "template",
      template,
      warnings
    };
  }
  if (format === "adl14" || format === "adl2" || format === "unknown") {
    const adl = parseAdl(source, { convertAdl14: true });
    warnings.push(...adl.warnings, ...adl.conversionWarnings);
    if (adl.kind === "operational_template" && adl.operationalTemplate) {
      return {
        format: adl.convertedFrom14 ? "adl14" : "adl2",
        kind: "operational_template",
        operationalTemplate: adl.operationalTemplate,
        adl,
        warnings
      };
    }
    if (adl.kind === "template" && adl.template) {
      if (options?.archetypeRepository) {
        const operationalTemplate = flattenToOperationalTemplate(
          adl.template,
          options.archetypeRepository
        );
        return {
          format: adl.convertedFrom14 ? "adl14" : "adl2",
          kind: "operational_template",
          operationalTemplate,
          template: adl.template,
          adl,
          warnings
        };
      }
      return {
        format: adl.convertedFrom14 ? "adl14" : "adl2",
        kind: "template",
        template: adl.template,
        adl,
        warnings
      };
    }
    throw new Error(
      `ADL input parsed as ${adl.kind}; expected template or operational_template`
    );
  }
  throw new Error(`Unsupported template input format: ${format}`);
}

// enhanced/parser/template_workspace.ts
function canBeGenerationRoot(path, loadResult) {
  if (/\.(opt|oet)$/i.test(path))
    return true;
  const kind = loadResult?.kind;
  return kind === "template" || kind === "operational_template" || kind === "template_json" || kind === "oet_xml" || kind === "opt_xml";
}
var TemplateWorkspace = class _TemplateWorkspace {
  repository = new ArchetypeRepository();
  files = /* @__PURE__ */ new Map();
  /** File open in the editor (tab selection). */
  activePath;
  /** File used as template/OPT root for generation (radio selection). */
  generationRootPath;
  warnings = [];
  getWarnings() {
    return [...this.warnings, ...this.repository.getWarnings()];
  }
  listFiles() {
    return [...this.files.values()].sort((a2, b2) => a2.path.localeCompare(b2.path));
  }
  getFile(path) {
    return this.files.get(path);
  }
  getActivePath() {
    return this.activePath;
  }
  setActivePath(path) {
    this.activePath = path;
  }
  getGenerationRootPath() {
    return this.generationRootPath;
  }
  setGenerationRootPath(path) {
    this.generationRootPath = path;
  }
  /** Add or replace a file in the workspace (path is display key, e.g. filename). */
  addFile(path, content) {
    const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
    const loadResult = this.repository.loadFile(normalized, content);
    this.files.set(normalized, { path: normalized, content, loadResult });
    if (!this.activePath)
      this.activePath = normalized;
    if (!this.generationRootPath && canBeGenerationRoot(normalized, loadResult)) {
      this.generationRootPath = normalized;
    }
    return loadResult;
  }
  /** Load many files (e.g. from ZIP extraction). */
  addFiles(entries) {
    const results = entries.map((e2) => this.addFile(e2.path, e2.content));
    if (!this.generationRootPath) {
      const suggested = _TemplateWorkspace.suggestGenerationRoot(this.listFiles());
      if (suggested)
        this.generationRootPath = suggested;
    }
    return results;
  }
  /** Pick a sensible default generation root from loaded files. */
  static suggestGenerationRoot(files) {
    for (const f2 of files) {
      const k2 = f2.loadResult?.kind;
      if (k2 === "template" || k2 === "operational_template" || k2 === "template_json" || k2 === "oet_xml" || k2 === "opt_xml") {
        return f2.path;
      }
    }
    for (const f2 of files) {
      if (/\.(opt|oet|t\.json)$/i.test(f2.path))
        return f2.path;
    }
    return files[0]?.path;
  }
  clear() {
    this.files.clear();
    this.activePath = void 0;
    this.generationRootPath = void 0;
    this.warnings = [];
    this.repository.clear();
  }
  /**
   * Resolve an operational template from the workspace.
   * Prefers: explicit id → active file → sole template/OPT in set.
   */
  resolveOperational(options = {}) {
    const warnings = [];
    if (options.templateId) {
      const byId = this.resolveByTemplateId(options.templateId, warnings);
      if (byId)
        return byId;
    }
    const rootPath = options.generationRootPath ?? this.generationRootPath ?? this.activePath;
    if (rootPath) {
      const fromRoot = this.resolveFile(rootPath, warnings);
      if (fromRoot) {
        return { ...fromRoot, sourcePath: fromRoot.sourcePath ?? rootPath };
      }
    }
    const ops = this.repository.listOperationalIds();
    if (ops.length === 1) {
      const opt = this.repository.getOperationalTemplate(ops[0]);
      return {
        operationalTemplate: opt,
        sourceKind: "operational_template",
        warnings
      };
    }
    const templates = this.repository.listTemplateIds();
    if (templates.length === 1) {
      return {
        operationalTemplate: this.repository.flattenTemplate(
          this.repository.getTemplate(templates[0])
        ),
        sourceKind: "adl2_template",
        warnings
      };
    }
    throw new Error(
      `Cannot resolve operational template: ${ops.length} operational, ${templates.length} source templates. Select a generation root file (radio) or pass templateId.`
    );
  }
  resolveByTemplateId(id2, warnings) {
    const opt = this.repository.getOperationalTemplate(id2);
    if (opt) {
      return { operationalTemplate: opt, sourceKind: "operational_template", warnings };
    }
    const tmpl = this.repository.getTemplate(id2);
    if (tmpl) {
      return {
        operationalTemplate: this.repository.flattenTemplate(tmpl),
        sourceKind: "adl2_template",
        warnings
      };
    }
    return void 0;
  }
  resolveFile(path, warnings) {
    const file = this.files.get(path);
    if (!file)
      return void 0;
    const trimmed = file.content.trim();
    if (!trimmed)
      return void 0;
    if (isOptXmlContent(trimmed)) {
      const { operationalTemplate, warnings: w2 } = parseOptXml(trimmed);
      warnings.push(...w2);
      return {
        operationalTemplate,
        sourcePath: path,
        sourceKind: "opt_xml",
        warnings
      };
    }
    if (file.loadResult?.kind === "template_json" && file.loadResult.archetypeId) {
      const tmpl = this.repository.getTemplate(file.loadResult.archetypeId);
      if (tmpl) {
        return {
          operationalTemplate: flattenToOperationalTemplate(
            tmpl,
            this.repository
          ),
          sourcePath: path,
          sourceKind: "adl2_template",
          warnings
        };
      }
    }
    if (isOetXmlContent(trimmed)) {
      const oet = parseOetXml(trimmed);
      const compiled = compileOetToOperational(oet, { repository: this.repository });
      warnings.push(...compiled.warnings, ...oet.warnings);
      return {
        operationalTemplate: compiled.operationalTemplate,
        sourcePath: path,
        sourceKind: "oet_compiled",
        warnings
      };
    }
    const parsed = parseTemplateInput(trimmed, {
      archetypeRepository: this.repository
    });
    warnings.push(...parsed.warnings);
    if (parsed.operationalTemplate) {
      return {
        operationalTemplate: parsed.operationalTemplate,
        sourcePath: path,
        sourceKind: parsed.format === "adl14" ? "adl14_operational" : "operational_template",
        warnings
      };
    }
    if (parsed.kind === "template" && parsed.template) {
      return {
        operationalTemplate: flattenToOperationalTemplate(
          parsed.template,
          this.repository
        ),
        sourcePath: path,
        sourceKind: "adl2_template",
        warnings
      };
    }
    if (parsed.kind === "oet_document") {
      throw new Error(
        `OET at ${path} requires archetypes in the workspace. Base: ${parsed.oet?.document.definitionArchetypeId ?? "unknown"}`
      );
    }
    return void 0;
  }
};
function isOptXmlContent(text) {
  return /<template[\s>]/i.test(text) && text.includes("schemas.openehr.org/v1") && !text.includes("openEHR/v1/Template");
}
function isOetXmlContent(text) {
  return /openEHR\/v1\/Template/i.test(text);
}

// enhanced/parser/clinical_model_paths.ts
var CLINICAL_MODEL_EXTENSIONS = /\.(adl|adls|opt|oet|t\.json|xml)$/i;
function isClinicalModelPath(path) {
  const lower2 = path.toLowerCase();
  if (lower2.includes("__macosx"))
    return false;
  return CLINICAL_MODEL_EXTENSIONS.test(lower2);
}
function normalizeClinicalModelPath(path) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

// enhanced/parser/github_repo_loader.ts
function parseGitHubRepoSpec(spec) {
  const trimmed = spec.trim();
  const urlMatch = trimmed.match(
    /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/?#]+))?/i
  );
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2].replace(/\.git$/, ""),
      ref: urlMatch[3] ?? "master"
    };
  }
  let rest = trimmed;
  let pathPrefix;
  const colon = rest.indexOf(":");
  if (colon > 0 && !rest.includes("://")) {
    pathPrefix = rest.slice(colon + 1).replace(/^\/+/, "");
    rest = rest.slice(0, colon);
  }
  const at2 = rest.lastIndexOf("@");
  let ref;
  if (at2 > 0) {
    ref = rest.slice(at2 + 1);
    rest = rest.slice(0, at2);
  }
  const [owner, repo] = rest.split("/");
  if (!owner || !repo) {
    throw new Error(
      `Invalid GitHub spec "${spec}". Use owner/repo@branch or a github.com URL.`
    );
  }
  return { owner, repo: repo.replace(/\.git$/, ""), ref, pathPrefix };
}
function githubApiHeaders(token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ehrtslib-clinical-model-loader"
  };
  if (token)
    headers.Authorization = `Bearer ${token}`;
  return headers;
}
async function loadGitHubRepoTree(ref, options) {
  const fetchFn = options?.fetch ?? globalThis.fetch;
  const token = options?.githubToken ?? (typeof Deno !== "undefined" ? Deno.env.get("GITHUB_TOKEN") : void 0);
  const headers = githubApiHeaders(token);
  const branch = ref.ref ?? "master";
  const warnings = [];
  const prefix = ref.pathPrefix?.replace(/^\/+/, "").replace(/\/$/, "");
  const branchRes = await fetchFn(
    `https://api.github.com/repos/${ref.owner}/${ref.repo}/branches/${encodeURIComponent(branch)}`,
    { headers }
  );
  if (!branchRes.ok) {
    throw new Error(
      `GitHub branch ${ref.owner}/${ref.repo}@${branch}: ${branchRes.status} ${branchRes.statusText}`
    );
  }
  const branchJson = await branchRes.json();
  const treeSha = branchJson.commit?.sha;
  if (!treeSha)
    throw new Error("Could not resolve branch commit SHA");
  const treeRes = await fetchFn(
    `https://api.github.com/repos/${ref.owner}/${ref.repo}/git/trees/${treeSha}?recursive=1`,
    { headers }
  );
  if (!treeRes.ok) {
    throw new Error(
      `GitHub tree API: ${treeRes.status} ${treeRes.statusText}`
    );
  }
  const treeJson = await treeRes.json();
  const paths = [];
  for (const item of treeJson.tree ?? []) {
    if (item.type !== "blob" || !item.path)
      continue;
    if (!isClinicalModelPath(item.path))
      continue;
    if (prefix && !item.path.startsWith(prefix + "/") && item.path !== prefix) {
      continue;
    }
    paths.push(item.path);
  }
  paths.sort();
  const maxFiles = options?.maxFiles ?? 500;
  if (paths.length > maxFiles) {
    warnings.push(`Truncating to ${maxFiles} of ${paths.length} matching files`);
    paths.length = maxFiles;
  }
  const entries = [];
  let skipped = 0;
  for (const path of paths) {
    const url = `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${branch}/${path}`;
    try {
      const res = await fetchFn(url);
      if (!res.ok) {
        warnings.push(`Failed ${path}: HTTP ${res.status}`);
        skipped++;
        continue;
      }
      entries.push({
        path: normalizeClinicalModelPath(path),
        content: await res.text()
      });
    } catch (e2) {
      warnings.push(`Failed ${path}: ${e2.message}`);
      skipped++;
    }
  }
  return {
    entries,
    warnings,
    ref: branch,
    fetched: entries.length,
    skipped
  };
}

// enhanced/parser/template_json_dependencies.ts
function archetypeIdValue(node) {
  if (!node)
    return void 0;
  if (typeof node === "string")
    return node.trim() || void 0;
  if (typeof node === "object") {
    return textValue(node.value) ?? textValue(node);
  }
  return void 0;
}
function collectTemplateJsonOverlayIds(root2) {
  const overlayIds = /* @__PURE__ */ new Set();
  for (const raw of asArray(root2.templateOverlays ?? root2.templateOverlays)) {
    if (!raw || typeof raw !== "object")
      continue;
    const ov = raw;
    if (jsonType(ov) !== "TEMPLATE_OVERLAY")
      continue;
    const id2 = archetypeIdValue(ov.archetypeId ?? ov.archetype_id);
    if (id2)
      overlayIds.add(id2);
  }
  return overlayIds;
}
function collectTemplateJsonExternalRefs(root2) {
  const overlayIds = collectTemplateJsonOverlayIds(root2);
  const external = /* @__PURE__ */ new Set();
  const parent = archetypeIdValue(
    root2.parentArchetypeId ?? root2.parent_archetype_id
  );
  if (parent)
    external.add(parent);
  function considerRef(ref) {
    if (!ref)
      return;
    const trimmed = ref.trim();
    if (!trimmed || overlayIds.has(trimmed))
      return;
    external.add(trimmed);
  }
  function walk(node) {
    if (!node || typeof node !== "object")
      return;
    if (Array.isArray(node)) {
      for (const item of node)
        walk(item);
      return;
    }
    const rec = node;
    const type2 = jsonType(rec);
    if (type2 === "C_ARCHETYPE_ROOT") {
      considerRef(
        textValue(rec.archetypeRef) ?? textValue(rec.archetype_ref) ?? (typeof rec.archetypeRef === "string" ? rec.archetypeRef : void 0)
      );
    }
    for (const v2 of Object.values(rec))
      walk(v2);
  }
  walk(root2.definition);
  return [...external];
}
function collectTemplateJsonExternalRefsFromText(source) {
  const trimmed = source.trim();
  if (!trimmed.startsWith("{"))
    return [];
  try {
    const root2 = JSON.parse(trimmed);
    const type2 = jsonType(root2);
    if (type2 !== "TEMPLATE" && type2 !== "OPERATIONAL_TEMPLATE")
      return [];
    return collectTemplateJsonExternalRefs(root2);
  } catch {
    return [];
  }
}

// enhanced/parser/github_template_closure.ts
function emit(options, event) {
  options?.onProgress?.(event);
}
function readOptionalGithubToken() {
  try {
    return typeof Deno !== "undefined" ? Deno.env.get("GITHUB_TOKEN") ?? void 0 : void 0;
  } catch {
    return void 0;
  }
}
function githubApiHeaders2(token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ehrtslib-clinical-model-loader"
  };
  if (token)
    headers.Authorization = `Bearer ${token}`;
  return headers;
}
var CLINICAL_MODEL_URL_SUFFIX = /\.(t\.json|adl|adls|opt|oet)$/i;
function parseGitHubClinicalModelFileUrl(input) {
  const trimmed = input.trim();
  const raw = trimmed.match(
    /raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i
  );
  if (raw) {
    return {
      owner: raw[1],
      repo: raw[2].replace(/\.git$/, ""),
      ref: decodeURIComponent(raw[3]),
      path: normalizeClinicalModelPath(decodeURIComponent(raw[4]))
    };
  }
  const blob = trimmed.match(
    /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+?)(?:[?#].*)?$/i
  );
  if (blob) {
    return {
      owner: blob[1],
      repo: blob[2].replace(/\.git$/, ""),
      ref: decodeURIComponent(blob[3]),
      path: normalizeClinicalModelPath(decodeURIComponent(blob[4]))
    };
  }
  throw new Error(
    `Invalid GitHub clinical model URL. Paste a blob or raw link to a .t.json, .adl, or .adls file.`
  );
}
function buildClinicalModelPathIndex(paths) {
  const allPaths = [];
  const byBasenameLower = /* @__PURE__ */ new Map();
  const byArchetypeIdLower = /* @__PURE__ */ new Map();
  for (const raw of paths) {
    const path = normalizeClinicalModelPath(raw);
    if (!isClinicalModelPath(path))
      continue;
    allPaths.push(path);
    const base = path.split("/").pop() ?? path;
    const baseLower = base.toLowerCase();
    if (!byBasenameLower.has(baseLower))
      byBasenameLower.set(baseLower, path);
    const adlMatch = base.match(/^(openEHR-.+)\.adl$/i);
    if (adlMatch) {
      const idLower = adlMatch[1].toLowerCase();
      if (!byArchetypeIdLower.has(idLower)) {
        byArchetypeIdLower.set(idLower, path);
      }
    }
  }
  return { paths: allPaths, byBasenameLower, byArchetypeIdLower };
}
function isOpenEhrArchetypeId(ref) {
  return /^openEHR-/i.test(ref);
}
function templateBasenameForRef(ref) {
  if (/\.t\.json$/i.test(ref))
    return ref;
  return `${ref}.t.json`;
}
function resolveClinicalModelRef(ref, index, contextDir) {
  const trimmed = ref.trim();
  if (!trimmed)
    return void 0;
  if (!isOpenEhrArchetypeId(trimmed)) {
    const base = templateBasenameForRef(trimmed);
    const hit = index.byBasenameLower.get(base.toLowerCase());
    if (hit)
      return hit;
    const ctxPath = normalizeClinicalModelPath(`${contextDir}/${base}`);
    if (index.paths.includes(ctxPath))
      return ctxPath;
    const suffix2 = `/${base}`.toLowerCase();
    return index.paths.find((p2) => p2.toLowerCase().endsWith(suffix2));
  }
  const idLower = trimmed.toLowerCase();
  const direct = index.byArchetypeIdLower.get(idLower);
  if (direct)
    return direct;
  const adlName = `${trimmed}.adl`;
  const baseHit = index.byBasenameLower.get(adlName.toLowerCase());
  if (baseHit)
    return baseHit;
  const suffix = `/${adlName}`.toLowerCase();
  return index.paths.find((p2) => p2.toLowerCase().endsWith(suffix));
}
async function fetchGitHubTreePaths(fileRef, fetchFn, headers) {
  const branchRes = await fetchFn(
    `https://api.github.com/repos/${fileRef.owner}/${fileRef.repo}/branches/${encodeURIComponent(fileRef.ref)}`,
    { headers }
  );
  if (!branchRes.ok) {
    throw new Error(
      `GitHub branch ${fileRef.owner}/${fileRef.repo}@${fileRef.ref}: ${branchRes.status} ${branchRes.statusText}`
    );
  }
  const branchJson = await branchRes.json();
  const treeSha = branchJson.commit?.sha;
  if (!treeSha)
    throw new Error("Could not resolve branch commit SHA");
  const treeRes = await fetchFn(
    `https://api.github.com/repos/${fileRef.owner}/${fileRef.repo}/git/trees/${treeSha}?recursive=1`,
    { headers }
  );
  if (!treeRes.ok) {
    throw new Error(
      `GitHub tree API: ${treeRes.status} ${treeRes.statusText}`
    );
  }
  const treeJson = await treeRes.json();
  const paths = [];
  for (const item of treeJson.tree ?? []) {
    if (item.type === "blob" && item.path && isClinicalModelPath(item.path)) {
      paths.push(normalizeClinicalModelPath(item.path));
    }
  }
  return paths;
}
async function fetchRawFile(fileRef, path, fetchFn) {
  const url = `https://raw.githubusercontent.com/${fileRef.owner}/${fileRef.repo}/${fileRef.ref}/${path}`;
  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${path}`);
  }
  return await res.text();
}
function collectDependenciesFromContent(path, content) {
  const trimmed = content.trim();
  if (!trimmed)
    return [];
  if (trimmed.startsWith("{") && (isTemplateJson(trimmed) || /\.t\.json$/i.test(path))) {
    return collectTemplateJsonExternalRefsFromText(trimmed);
  }
  if (/\.(adl|adls)$/i.test(path) || trimmed.includes("archetype")) {
    try {
      const parsed = parseAdl(content, { convertAdl14: true });
      const arch = parsed.archetype ?? parsed.template ?? parsed.operationalTemplate;
      const parent = arch?.parent_archetype_id?.value;
      return parent ? [parent] : [];
    } catch {
      return [];
    }
  }
  return [];
}
async function loadGitHubClinicalModelClosure(fileUrl, options) {
  const fetchFn = options?.fetch ?? globalThis.fetch;
  const token = options?.githubToken ?? readOptionalGithubToken();
  const headers = githubApiHeaders2(token);
  const maxFiles = options?.maxFiles ?? 200;
  const warnings = [];
  emit(options, { phase: "parse-url", message: fileUrl });
  const fileRef = parseGitHubClinicalModelFileUrl(fileUrl);
  if (!CLINICAL_MODEL_URL_SUFFIX.test(fileRef.path)) {
    throw new Error(
      `Expected a clinical model file (.t.json, .adl, .adls), got: ${fileRef.path}`
    );
  }
  emit(options, {
    phase: "index-tree",
    message: `Indexing ${fileRef.owner}/${fileRef.repo}@${fileRef.ref}\u2026`
  });
  const treePaths = await fetchGitHubTreePaths(fileRef, fetchFn, headers);
  const index = buildClinicalModelPathIndex(treePaths);
  emit(options, {
    phase: "index-tree",
    message: `Indexed ${index.paths.length} clinical model files`
  });
  const contextDir = fileRef.path.includes("/") ? fileRef.path.replace(/\/[^/]+$/, "") : "";
  const entries = /* @__PURE__ */ new Map();
  const pendingRefs = /* @__PURE__ */ new Set();
  const queuedPaths = /* @__PURE__ */ new Set();
  const pathQueue = [fileRef.path];
  let skipped = 0;
  const enqueuePath = (path) => {
    const normalized = normalizeClinicalModelPath(path);
    if (entries.has(normalized) || queuedPaths.has(normalized))
      return;
    queuedPaths.add(normalized);
    pathQueue.push(normalized);
  };
  const enqueueRef = (ref) => {
    const trimmed = ref.trim();
    if (!trimmed || pendingRefs.has(trimmed))
      return;
    pendingRefs.add(trimmed);
    emit(options, { phase: "resolve", message: `Resolving ${trimmed}`, ref: trimmed });
    const resolved = resolveClinicalModelRef(trimmed, index, contextDir);
    if (!resolved) {
      warnings.push(`Unresolved reference: ${trimmed}`);
      emit(options, {
        phase: "resolve",
        message: `Unresolved: ${trimmed}`,
        ref: trimmed
      });
      return;
    }
    emit(options, {
      phase: "resolve",
      message: `${trimmed} \u2192 ${resolved}`,
      ref: trimmed,
      path: resolved
    });
    enqueuePath(resolved);
  };
  while (pathQueue.length > 0 && entries.size < maxFiles) {
    const path = pathQueue.shift();
    queuedPaths.delete(path);
    emit(options, { phase: "fetch", message: `Downloading ${path}`, path });
    try {
      const content = await fetchRawFile(fileRef, path, fetchFn);
      entries.set(path, { path, content });
      emit(options, { phase: "fetch", message: `Downloaded ${path}`, path });
      emit(options, { phase: "parse", message: `Parsing ${path}`, path });
      for (const ref of collectDependenciesFromContent(path, content)) {
        enqueueRef(ref);
      }
    } catch (e2) {
      skipped++;
      const msg = `Failed ${path}: ${e2.message}`;
      warnings.push(msg);
      emit(options, { phase: "fetch", message: msg, path });
    }
  }
  if (entries.size >= maxFiles) {
    warnings.push(`Stopped at maxFiles limit (${maxFiles})`);
  }
  if (!entries.has(fileRef.path)) {
    throw new Error(`Could not load root file: ${fileRef.path}`);
  }
  emit(options, {
    phase: "complete",
    message: `File set complete (${entries.size} files)`
  });
  return {
    rootPath: fileRef.path,
    entries: [...entries.values()],
    warnings,
    fetched: entries.size,
    skipped
  };
}

// enhanced/parser/clinical_model_workspace.ts
var ClinicalModelWorkspace = class _ClinicalModelWorkspace {
  workspace = new TemplateWorkspace();
  dirtyPaths = /* @__PURE__ */ new Set();
  get repository() {
    return this.workspace.repository;
  }
  getWarnings() {
    return this.workspace.getWarnings();
  }
  listFiles() {
    return this.workspace.listFiles().map((f2) => ({
      ...f2,
      dirty: this.dirtyPaths.has(f2.path)
    }));
  }
  getFile(path) {
    const f2 = this.workspace.getFile(path);
    if (!f2)
      return void 0;
    return { ...f2, dirty: this.dirtyPaths.has(f2.path) };
  }
  getActivePath() {
    return this.workspace.getActivePath();
  }
  setActivePath(path) {
    this.workspace.setActivePath(path);
  }
  getGenerationRootPath() {
    return this.workspace.getGenerationRootPath();
  }
  setGenerationRootPath(path) {
    this.workspace.setGenerationRootPath(path);
  }
  /** Underlying workspace (e.g. for demo converter integration). */
  get templateWorkspace() {
    return this.workspace;
  }
  addFile(path, content) {
    const result = this.workspace.addFile(path, content);
    this.dirtyPaths.delete(normalizeClinicalModelPath(path));
    return result;
  }
  addFiles(entries) {
    const results = entries.map((e2) => this.addFile(e2.path, e2.content));
    return results;
  }
  /**
   * Update editor content and re-parse into the repository.
   * Marks the file dirty until replaced by `addFile` from external source.
   */
  updateFileContent(path, content) {
    const normalized = normalizeClinicalModelPath(path);
    this.dirtyPaths.add(normalized);
    return this.workspace.addFile(normalized, content);
  }
  /** Current text for download / save (edited content if dirty). */
  exportFile(path) {
    return this.workspace.getFile(path)?.content;
  }
  exportEntries() {
    return this.workspace.listFiles().map((f2) => ({
      path: f2.path,
      content: f2.content
    }));
  }
  /** Build a ZIP-friendly map path → content. */
  exportAsMap() {
    const out = {};
    for (const { path, content } of this.exportEntries()) {
      out[path] = content;
    }
    return out;
  }
  clear() {
    this.workspace.clear();
    this.dirtyPaths.clear();
  }
  static suggestGenerationRoot(files) {
    return TemplateWorkspace.suggestGenerationRoot(files);
  }
  resolveOperational(options) {
    return this.workspace.resolveOperational(options);
  }
  /**
   * Load a filtered file tree from a public GitHub repo branch (read-only).
   */
  async loadFromGitHub(spec, options) {
    const ref = typeof spec === "string" ? parseGitHubRepoSpec(spec) : spec;
    const tree = await loadGitHubRepoTree(ref, options);
    const loadResults = this.addFiles(tree.entries);
    if (!this.getGenerationRootPath()) {
      const suggested = _ClinicalModelWorkspace.suggestGenerationRoot(
        this.listFiles()
      );
      if (suggested)
        this.setGenerationRootPath(suggested);
    }
    return { ...tree, loadResults };
  }
  /**
   * Load a single `.t.json` from a GitHub blob/raw URL and recursively fetch
   * nested templates, archetypes, and parent archetype chains from the same branch.
   */
  async loadFromGitHubTemplateUrl(templateUrl, options) {
    return this.loadFromGitHubClinicalModelUrl(templateUrl, options);
  }
  /**
   * Load a clinical model file (`.t.json`, `.adl`, `.adls`) from GitHub and
   * recursively fetch dependencies from the same branch.
   */
  async loadFromGitHubClinicalModelUrl(fileUrl, options) {
    const closure = await loadGitHubClinicalModelClosure(fileUrl, options);
    const loadResults = this.addFiles(closure.entries);
    this.setGenerationRootPath(closure.rootPath);
    this.setActivePath(closure.rootPath);
    return { ...closure, loadResults };
  }
  /** Load entries extracted from a ZIP (same filter as GitHub loader). */
  loadFromZipEntries(entries) {
    const batch = entries.filter((e2) => isClinicalModelPath(e2.path)).map((e2) => ({
      path: normalizeClinicalModelPath(e2.path),
      content: e2.content
    }));
    return this.addFiles(batch);
  }
};

// enhanced/parser/odin_serializer.ts
function escapeString(s2) {
  return `"${s2.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
function serializeOdinValue(value, indent, level) {
  const pad = indent.repeat(level);
  if (value === null || value === void 0) {
    return "<>";
  }
  if (typeof value === "string") {
    return `<${escapeString(value)}>`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return `<${String(value)}>`;
  }
  if (Array.isArray(value)) {
    const parts = value.map((v2) => serializeOdinPrimitiveInline(v2));
    return `<${parts.join(", ")}>`;
  }
  if (typeof value === "object" && value._type === "interval") {
    return "<|...|>";
  }
  const obj = value;
  const isKeyed = Object.keys(obj).every((k2) => k2.startsWith("[") || !k2.includes("="));
  let out = "<\n";
  for (const [key, val] of Object.entries(obj)) {
    if (key.includes("[") || Object.keys(obj).length > 0 && typeof val === "object" && !Array.isArray(val)) {
      out += `${pad}${indent}[${escapeString(key)}] = ${serializeOdinValue(val, indent, level + 1).trimStart()}
`;
    } else {
      out += `${pad}${indent}${key} = ${serializeOdinValue(val, indent, level + 1).trimStart()}
`;
    }
  }
  out += `${pad}>`;
  return out;
}
function serializeOdinPrimitiveInline(value) {
  if (typeof value === "string")
    return escapeString(value);
  return String(value);
}
function serializeLanguageSection(lang, indent) {
  if (!lang?.code_string?.value) {
    return "";
  }
  const code = lang.terminology_id?.value ? `[${lang.terminology_id.value}::${lang.code_string.value}]` : escapeString(lang.code_string.value);
  return `language
    original_language = <${code}>

`;
}
function serializeDescriptionSection(desc, indent) {
  if (!desc) {
    return "";
  }
  const bag = desc;
  let out = "description\n";
  if (bag.original_author !== void 0) {
    out += `    original_author = ${serializeOdinValue(bag.original_author, indent, 2)}
`;
  }
  if (bag.details !== void 0) {
    out += `    details = ${serializeOdinValue(bag.details, indent, 2)}
`;
  }
  if (desc.lifecycle_state?.code_string?.value) {
    out += `    lifecycle_state = <${escapeString(desc.lifecycle_state.code_string.value)}>
`;
  }
  return out + "\n";
}
function serializeTerminologySection(ontology, indent) {
  const table = ontology?.term_definitions;
  if (!table || Object.keys(table).length === 0) {
    return "";
  }
  const keyed = {};
  for (const [lang, terms] of Object.entries(table)) {
    keyed[lang] = Object.fromEntries(
      Object.entries(terms).map(([code, t2]) => [
        code,
        {
          text: t2.text ?? "",
          ...t2.description ? { description: t2.description } : {}
        }
      ])
    );
  }
  return `terminology
    term_definitions = ${serializeOdinValue(keyed, indent, 2)}
`;
}
function serializeAnnotationsSection(documentation, indent) {
  if (!documentation || Object.keys(documentation).length === 0) {
    return "";
  }
  return `annotations
    documentation = ${serializeOdinValue(documentation, indent, 2).trimStart()}

`;
}
function serializeRmOverlaySection(rmVisibility, indent) {
  if (!rmVisibility || Object.keys(rmVisibility).length === 0) {
    return "";
  }
  return `rm_overlay
    rm_visibility = ${serializeOdinValue(rmVisibility, indent, 2).trimStart()}

`;
}

// enhanced/parser/rules_serializer.ts
function serializeRulesSection(invariants, indent) {
  if (!invariants?.length)
    return "";
  let out = "rules\n";
  const bodyIndent = indent;
  for (const assertion of invariants) {
    const expr = assertion.string_expression?.trim();
    if (!expr)
      continue;
    if (assertion.tag) {
      out += `${bodyIndent}${assertion.tag}: ${expr}
`;
    } else {
      out += `${bodyIndent}${expr}
`;
    }
  }
  return out + "\n";
}

// enhanced/generation/adl2_serializer.ts
var ADL2Serializer = class {
  config;
  constructor(config) {
    this.config = {
      indent: "    ",
      includeComments: false,
      ...config
    };
  }
  serialize(archetype) {
    const indent = this.config.indent || "    ";
    let adl = "archetype";
    if (archetype.adl_version || archetype.rm_release) {
      adl += " (";
      const meta = [];
      if (archetype.adl_version)
        meta.push(`adl_version=${archetype.adl_version}`);
      if (archetype.rm_release)
        meta.push(`rm_release=${archetype.rm_release}`);
      adl += meta.join("; ") + ")";
    }
    adl += "\n";
    if (archetype.archetype_id?.value) {
      adl += `    ${archetype.archetype_id.value}

`;
    }
    adl += serializeLanguageSection(archetype.original_language, indent);
    adl += serializeDescriptionSection(archetype.description, indent);
    adl += "definition\n";
    if (archetype.definition) {
      adl += this.serializeDefinition(archetype.definition, 1);
    }
    adl += "\n";
    adl += serializeRulesSection(archetype.invariants, indent);
    const ontologyBag = archetype.ontology;
    adl += serializeTerminologySection(ontologyBag, indent);
    adl += serializeAnnotationsSection(
      getAnnotationsDocumentation(archetype),
      indent
    );
    adl += serializeRmOverlaySection(
      getRmOverlayVisibility(archetype),
      indent
    );
    return adl;
  }
  serializeDefinition(cObject, level) {
    const indent = this.getIndent(level);
    let adl = `${indent}${cObject.rm_type_name}[${cObject.node_id}]`;
    if (cObject.occurrences) {
      const lower2 = cObject.occurrences.lower ?? 0;
      const upper = cObject.occurrences.upper;
      const upperStr = upper === void 0 ? "*" : String(upper);
      adl += ` occurrences matches {${lower2}..${upperStr}}`;
    }
    const attrs = cObject.attributes;
    if (attrs && attrs.length > 0) {
      adl += " matches {\n";
      for (const attr of attrs) {
        adl += this.serializeAttribute(attr, level + 1);
      }
      adl += `${indent}}
`;
    } else {
      adl += "\n";
    }
    return adl;
  }
  serializeAttribute(cAttribute, level) {
    const indent = this.getIndent(level);
    let adl = `${indent}${cAttribute.rm_attribute_name}`;
    const existence = cAttribute.existence;
    if (existence) {
      const u2 = existence.upper ?? existence.lower;
      adl += ` existence matches {${existence.lower}..${u2}}`;
    }
    if (cAttribute instanceof C_MULTIPLE_ATTRIBUTE && cAttribute.cardinality) {
      const interval2 = cAttribute.cardinality.interval;
      if (interval2) {
        const upperStr = interval2.upper === void 0 ? "*" : String(interval2.upper);
        adl += ` cardinality matches {${interval2.lower}..${upperStr}}`;
      }
    }
    const children2 = cAttribute.children;
    if (children2 && children2.length > 0) {
      adl += " matches {\n";
      for (const child of children2) {
        if (child instanceof C_COMPLEX_OBJECT) {
          adl += this.serializeDefinition(child, level + 1);
        } else if (child instanceof C_PRIMITIVE_OBJECT) {
          adl += this.serializePrimitiveObject(child, level + 1);
        }
      }
      adl += `${indent}}
`;
    } else {
      adl += "\n";
    }
    return adl;
  }
  serializePrimitiveObject(prim, level) {
    const indent = this.getIndent(level);
    const pattern = prim.item instanceof C_STRING ? prim.item.pattern : void 0;
    if (pattern && !pattern.includes("|")) {
      return `${indent}${prim.rm_type_name}[${prim.node_id}] matches {${JSON.stringify(pattern)}}
`;
    }
    return `${indent}${prim.rm_type_name}[${prim.node_id}]
`;
  }
  getIndent(level) {
    return (this.config.indent || "    ").repeat(level);
  }
};

// enhanced/parser/clinical_model_annotations.ts
function asAnnotationDocumentation(doc) {
  if (!doc || typeof doc !== "object")
    return void 0;
  return doc;
}
function getResourceDocumentation(resource) {
  return asAnnotationDocumentation(getAnnotationsDocumentation(resource));
}
function ensureResourceAnnotations(resource) {
  let ann = resource.annotations;
  if (!ann) {
    ann = new RESOURCE_ANNOTATIONS();
    resource.annotations = ann;
  }
  const bag = ann;
  let doc = bag.documentation;
  if (!doc) {
    doc = {};
    bag.documentation = doc;
  }
  return doc;
}
function countAnnotationKeysAtPath(doc, path) {
  if (!doc)
    return 0;
  let total = 0;
  for (const lang of Object.keys(doc)) {
    const atPath = doc[lang]?.[path];
    if (atPath)
      total += Object.keys(atPath).length;
  }
  return total;
}
function getPathAnnotations(doc, path, language2 = "en") {
  return { ...doc?.[language2]?.[path] ?? {} };
}
function setPathAnnotation(resource, path, key, value, language2 = "en") {
  const doc = ensureResourceAnnotations(resource);
  if (!doc[language2])
    doc[language2] = {};
  if (!doc[language2][path])
    doc[language2][path] = {};
  doc[language2][path][key] = value;
}
function removePathAnnotation(resource, path, key, language2 = "en") {
  const doc = getResourceDocumentation(resource);
  if (!doc?.[language2]?.[path])
    return;
  delete doc[language2][path][key];
  if (Object.keys(doc[language2][path]).length === 0) {
    delete doc[language2][path];
  }
}
function joinConstraintPath(parentPath, attributeName, nodeId) {
  const segment = `${attributeName}[${nodeId}]`;
  if (!parentPath)
    return `/${segment}`;
  return `${parentPath}/${segment}`;
}
function readAttributes(obj) {
  const attrs = obj.attributes;
  return attrs ?? [];
}
function readAttributeChildren(attr) {
  const children2 = attr.children;
  return children2 ?? [];
}
function buildObjectSubtree(obj, parentPath, doc) {
  if (obj instanceof C_ARCHETYPE_ROOT) {
    const path2 = parentPath;
    const keyCount2 = countAnnotationKeysAtPath(doc, path2);
    const ref = obj.archetype_ref;
    const label = ref ? `use ${ref}` : `${obj.rm_type_name ?? "ARCHETYPE_ROOT"}[${obj.node_id ?? "?"}]`;
    return {
      id: path2 || "/root",
      path: path2,
      label,
      rmType: obj.rm_type_name,
      nodeId: obj.node_id,
      hasAnnotations: keyCount2 > 0,
      annotationKeyCount: keyCount2,
      isArchetypeRoot: true,
      archetypeRef: ref,
      children: []
    };
  }
  if (obj instanceof C_COMPLEX_OBJECT) {
    const path2 = parentPath;
    const keyCount2 = countAnnotationKeysAtPath(doc, path2);
    const children2 = [];
    for (const attr of readAttributes(obj)) {
      const attrName = attr.rm_attribute_name ?? "attr";
      for (const child of readAttributeChildren(attr)) {
        const childPath = joinConstraintPath(
          parentPath,
          attrName,
          child.node_id ?? "?"
        );
        children2.push(buildObjectSubtree(child, childPath, doc));
      }
    }
    const label = `${obj.rm_type_name ?? "OBJECT"}[${obj.node_id ?? "?"}]`;
    return {
      id: path2 || "/root",
      path: path2,
      label,
      rmType: obj.rm_type_name,
      nodeId: obj.node_id,
      hasAnnotations: keyCount2 > 0,
      annotationKeyCount: keyCount2,
      children: children2
    };
  }
  if (obj instanceof C_PRIMITIVE_OBJECT) {
    const path2 = parentPath;
    const keyCount2 = countAnnotationKeysAtPath(doc, path2);
    return {
      id: path2,
      path: path2,
      label: `${obj.rm_type_name ?? "PRIMITIVE"}[${obj.node_id ?? "?"}]`,
      rmType: obj.rm_type_name,
      nodeId: obj.node_id,
      hasAnnotations: keyCount2 > 0,
      annotationKeyCount: keyCount2,
      children: []
    };
  }
  const path = parentPath;
  const keyCount = countAnnotationKeysAtPath(doc, path);
  return {
    id: path || "/unknown",
    path,
    label: "constraint",
    hasAnnotations: keyCount > 0,
    annotationKeyCount: keyCount,
    children: []
  };
}
function buildDefinitionTree(resource) {
  const definition = resource.definition;
  if (!definition)
    return void 0;
  const doc = getResourceDocumentation(resource);
  return buildObjectSubtree(definition, "", doc);
}
function serializeAnnotatedResource(resource) {
  return new ADL2Serializer().serialize(resource);
}
function resolveAnnotatedResource(repository, loadResult) {
  if (!loadResult?.archetypeId && !loadResult?.path)
    return void 0;
  const id2 = loadResult.archetypeId;
  if (!id2)
    return void 0;
  switch (loadResult.kind) {
    case "archetype":
      return repository.get(id2);
    case "template":
    case "template_json":
      return repository.getTemplate(id2);
    case "operational_template":
      return repository.getOperationalTemplate(id2);
    default:
      return repository.get(id2) ?? repository.getTemplate(id2);
  }
}

// examples/taaat-app/src/palette.ts
var PALETTE_STORAGE_KEY = "ehrtslib-taaat-palette-v1";
function loadPalette(storage = localStorage) {
  try {
    const raw = storage.getItem(PALETTE_STORAGE_KEY);
    if (!raw)
      return defaultPalette();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed))
      return defaultPalette();
    return parsed.filter(
      (e2) => typeof e2 === "object" && e2 !== null && typeof e2.key === "string"
    ).map((e2) => ({
      key: e2.key.trim(),
      value: e2.value?.trim() || void 0
    })).filter((e2) => e2.key.length > 0);
  } catch {
    return defaultPalette();
  }
}
function savePalette(entries, storage = localStorage) {
  storage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(entries));
}
function defaultPalette() {
  return [
    { key: "comment" },
    { key: "design note" },
    { key: "requirements note" },
    { key: "ui", value: "passthrough" },
    { key: "medline ref" }
  ];
}
function parsePaletteJson(text) {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("Palette file must be a JSON array");
  }
  const entries = parsed.filter(
    (e2) => typeof e2 === "object" && e2 !== null && typeof e2.key === "string"
  ).map((e2) => ({
    key: String(e2.key).trim(),
    value: e2.value != null ? String(e2.value).trim() : void 0
  })).filter((e2) => e2.key.length > 0);
  if (!entries.length)
    throw new Error("No valid palette entries");
  return entries;
}
function exportPaletteJson(entries) {
  return JSON.stringify(entries, null, 2);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-dispatch@3.0.1/node_modules/d3-dispatch/src/dispatch.js
var noop = { value: () => {
} };
function dispatch() {
  for (var i2 = 0, n2 = arguments.length, _2 = {}, t2; i2 < n2; ++i2) {
    if (!(t2 = arguments[i2] + "") || t2 in _2 || /[\s.]/.test(t2))
      throw new Error("illegal type: " + t2);
    _2[t2] = [];
  }
  return new Dispatch(_2);
}
function Dispatch(_2) {
  this._ = _2;
}
function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t2) {
    var name = "", i2 = t2.indexOf(".");
    if (i2 >= 0)
      name = t2.slice(i2 + 1), t2 = t2.slice(0, i2);
    if (t2 && !types.hasOwnProperty(t2))
      throw new Error("unknown type: " + t2);
    return { type: t2, name };
  });
}
Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _2 = this._, T2 = parseTypenames(typename + "", _2), t2, i2 = -1, n2 = T2.length;
    if (arguments.length < 2) {
      while (++i2 < n2)
        if ((t2 = (typename = T2[i2]).type) && (t2 = get(_2[t2], typename.name)))
          return t2;
      return;
    }
    if (callback != null && typeof callback !== "function")
      throw new Error("invalid callback: " + callback);
    while (++i2 < n2) {
      if (t2 = (typename = T2[i2]).type)
        _2[t2] = set(_2[t2], typename.name, callback);
      else if (callback == null)
        for (t2 in _2)
          _2[t2] = set(_2[t2], typename.name, null);
    }
    return this;
  },
  copy: function() {
    var copy = {}, _2 = this._;
    for (var t2 in _2)
      copy[t2] = _2[t2].slice();
    return new Dispatch(copy);
  },
  call: function(type2, that) {
    if ((n2 = arguments.length - 2) > 0)
      for (var args = new Array(n2), i2 = 0, n2, t2; i2 < n2; ++i2)
        args[i2] = arguments[i2 + 2];
    if (!this._.hasOwnProperty(type2))
      throw new Error("unknown type: " + type2);
    for (t2 = this._[type2], i2 = 0, n2 = t2.length; i2 < n2; ++i2)
      t2[i2].value.apply(that, args);
  },
  apply: function(type2, that, args) {
    if (!this._.hasOwnProperty(type2))
      throw new Error("unknown type: " + type2);
    for (var t2 = this._[type2], i2 = 0, n2 = t2.length; i2 < n2; ++i2)
      t2[i2].value.apply(that, args);
  }
};
function get(type2, name) {
  for (var i2 = 0, n2 = type2.length, c2; i2 < n2; ++i2) {
    if ((c2 = type2[i2]).name === name) {
      return c2.value;
    }
  }
}
function set(type2, name, callback) {
  for (var i2 = 0, n2 = type2.length; i2 < n2; ++i2) {
    if (type2[i2].name === name) {
      type2[i2] = noop, type2 = type2.slice(0, i2).concat(type2.slice(i2 + 1));
      break;
    }
  }
  if (callback != null)
    type2.push({ name, value: callback });
  return type2;
}
var dispatch_default = dispatch;

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/namespaces.js
var xhtml = "http://www.w3.org/1999/xhtml";
var namespaces_default = {
  svg: "http://www.w3.org/2000/svg",
  xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/namespace.js
function namespace_default(name) {
  var prefix = name += "", i2 = prefix.indexOf(":");
  if (i2 >= 0 && (prefix = name.slice(0, i2)) !== "xmlns")
    name = name.slice(i2 + 1);
  return namespaces_default.hasOwnProperty(prefix) ? { space: namespaces_default[prefix], local: name } : name;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/creator.js
function creatorInherit(name) {
  return function() {
    var document2 = this.ownerDocument, uri = this.namespaceURI;
    return uri === xhtml && document2.documentElement.namespaceURI === xhtml ? document2.createElement(name) : document2.createElementNS(uri, name);
  };
}
function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function creator_default(name) {
  var fullname = namespace_default(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selector.js
function none() {
}
function selector_default(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/select.js
function select_default(select) {
  if (typeof select !== "function")
    select = selector_default(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j2 = 0; j2 < m2; ++j2) {
    for (var group = groups[j2], n2 = group.length, subgroup = subgroups[j2] = new Array(n2), node, subnode, i2 = 0; i2 < n2; ++i2) {
      if ((node = group[i2]) && (subnode = select.call(node, node.__data__, i2, group))) {
        if ("__data__" in node)
          subnode.__data__ = node.__data__;
        subgroup[i2] = subnode;
      }
    }
  }
  return new Selection(subgroups, this._parents);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/array.js
function array(x2) {
  return x2 == null ? [] : Array.isArray(x2) ? x2 : Array.from(x2);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selectorAll.js
function empty() {
  return [];
}
function selectorAll_default(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectAll.js
function arrayAll(select) {
  return function() {
    return array(select.apply(this, arguments));
  };
}
function selectAll_default(select) {
  if (typeof select === "function")
    select = arrayAll(select);
  else
    select = selectorAll_default(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j2 = 0; j2 < m2; ++j2) {
    for (var group = groups[j2], n2 = group.length, node, i2 = 0; i2 < n2; ++i2) {
      if (node = group[i2]) {
        subgroups.push(select.call(node, node.__data__, i2, group));
        parents.push(node);
      }
    }
  }
  return new Selection(subgroups, parents);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/matcher.js
function matcher_default(selector) {
  return function() {
    return this.matches(selector);
  };
}
function childMatcher(selector) {
  return function(node) {
    return node.matches(selector);
  };
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChild.js
var find = Array.prototype.find;
function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}
function childFirst() {
  return this.firstElementChild;
}
function selectChild_default(match) {
  return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChildren.js
var filter = Array.prototype.filter;
function children() {
  return Array.from(this.children);
}
function childrenFilter(match) {
  return function() {
    return filter.call(this.children, match);
  };
}
function selectChildren_default(match) {
  return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/filter.js
function filter_default(match) {
  if (typeof match !== "function")
    match = matcher_default(match);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j2 = 0; j2 < m2; ++j2) {
    for (var group = groups[j2], n2 = group.length, subgroup = subgroups[j2] = [], node, i2 = 0; i2 < n2; ++i2) {
      if ((node = group[i2]) && match.call(node, node.__data__, i2, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Selection(subgroups, this._parents);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sparse.js
function sparse_default(update) {
  return new Array(update.length);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/enter.js
function enter_default() {
  return new Selection(this._enter || this._groups.map(sparse_default), this._parents);
}
function EnterNode(parent, datum2) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum2;
}
EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function(selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function(selector) {
    return this._parent.querySelectorAll(selector);
  }
};

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/constant.js
function constant_default(x2) {
  return function() {
    return x2;
  };
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/data.js
function bindIndex(parent, group, enter, update, exit, data) {
  var i2 = 0, node, groupLength = group.length, dataLength = data.length;
  for (; i2 < dataLength; ++i2) {
    if (node = group[i2]) {
      node.__data__ = data[i2];
      update[i2] = node;
    } else {
      enter[i2] = new EnterNode(parent, data[i2]);
    }
  }
  for (; i2 < groupLength; ++i2) {
    if (node = group[i2]) {
      exit[i2] = node;
    }
  }
}
function bindKey(parent, group, enter, update, exit, data, key) {
  var i2, node, nodeByKeyValue = /* @__PURE__ */ new Map(), groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
  for (i2 = 0; i2 < groupLength; ++i2) {
    if (node = group[i2]) {
      keyValues[i2] = keyValue = key.call(node, node.__data__, i2, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i2] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }
  for (i2 = 0; i2 < dataLength; ++i2) {
    keyValue = key.call(parent, data[i2], i2, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i2] = node;
      node.__data__ = data[i2];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i2] = new EnterNode(parent, data[i2]);
    }
  }
  for (i2 = 0; i2 < groupLength; ++i2) {
    if ((node = group[i2]) && nodeByKeyValue.get(keyValues[i2]) === node) {
      exit[i2] = node;
    }
  }
}
function datum(node) {
  return node.__data__;
}
function data_default(value, key) {
  if (!arguments.length)
    return Array.from(this, datum);
  var bind = key ? bindKey : bindIndex, parents = this._parents, groups = this._groups;
  if (typeof value !== "function")
    value = constant_default(value);
  for (var m2 = groups.length, update = new Array(m2), enter = new Array(m2), exit = new Array(m2), j2 = 0; j2 < m2; ++j2) {
    var parent = parents[j2], group = groups[j2], groupLength = group.length, data = arraylike(value.call(parent, parent && parent.__data__, j2, parents)), dataLength = data.length, enterGroup = enter[j2] = new Array(dataLength), updateGroup = update[j2] = new Array(dataLength), exitGroup = exit[j2] = new Array(groupLength);
    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1)
          i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength)
          ;
        previous._next = next || null;
      }
    }
  }
  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}
function arraylike(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/exit.js
function exit_default() {
  return new Selection(this._exit || this._groups.map(sparse_default), this._parents);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/join.js
function join_default(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter)
      enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update)
      update = update.selection();
  }
  if (onexit == null)
    exit.remove();
  else
    onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/merge.js
function merge_default(context) {
  var selection2 = context.selection ? context.selection() : context;
  for (var groups0 = this._groups, groups1 = selection2._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges = new Array(m0), j2 = 0; j2 < m2; ++j2) {
    for (var group0 = groups0[j2], group1 = groups1[j2], n2 = group0.length, merge = merges[j2] = new Array(n2), node, i2 = 0; i2 < n2; ++i2) {
      if (node = group0[i2] || group1[i2]) {
        merge[i2] = node;
      }
    }
  }
  for (; j2 < m0; ++j2) {
    merges[j2] = groups0[j2];
  }
  return new Selection(merges, this._parents);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/order.js
function order_default() {
  for (var groups = this._groups, j2 = -1, m2 = groups.length; ++j2 < m2; ) {
    for (var group = groups[j2], i2 = group.length - 1, next = group[i2], node; --i2 >= 0; ) {
      if (node = group[i2]) {
        if (next && node.compareDocumentPosition(next) ^ 4)
          next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sort.js
function sort_default(compare) {
  if (!compare)
    compare = ascending;
  function compareNode(a2, b2) {
    return a2 && b2 ? compare(a2.__data__, b2.__data__) : !a2 - !b2;
  }
  for (var groups = this._groups, m2 = groups.length, sortgroups = new Array(m2), j2 = 0; j2 < m2; ++j2) {
    for (var group = groups[j2], n2 = group.length, sortgroup = sortgroups[j2] = new Array(n2), node, i2 = 0; i2 < n2; ++i2) {
      if (node = group[i2]) {
        sortgroup[i2] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new Selection(sortgroups, this._parents).order();
}
function ascending(a2, b2) {
  return a2 < b2 ? -1 : a2 > b2 ? 1 : a2 >= b2 ? 0 : NaN;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/call.js
function call_default() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/nodes.js
function nodes_default() {
  return Array.from(this);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/node.js
function node_default() {
  for (var groups = this._groups, j2 = 0, m2 = groups.length; j2 < m2; ++j2) {
    for (var group = groups[j2], i2 = 0, n2 = group.length; i2 < n2; ++i2) {
      var node = group[i2];
      if (node)
        return node;
    }
  }
  return null;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/size.js
function size_default() {
  let size = 0;
  for (const node of this)
    ++size;
  return size;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/empty.js
function empty_default() {
  return !this.node();
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/each.js
function each_default(callback) {
  for (var groups = this._groups, j2 = 0, m2 = groups.length; j2 < m2; ++j2) {
    for (var group = groups[j2], i2 = 0, n2 = group.length, node; i2 < n2; ++i2) {
      if (node = group[i2])
        callback.call(node, node.__data__, i2, group);
    }
  }
  return this;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/attr.js
function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}
function attrConstantNS(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}
function attrFunction(name, value) {
  return function() {
    var v2 = value.apply(this, arguments);
    if (v2 == null)
      this.removeAttribute(name);
    else
      this.setAttribute(name, v2);
  };
}
function attrFunctionNS(fullname, value) {
  return function() {
    var v2 = value.apply(this, arguments);
    if (v2 == null)
      this.removeAttributeNS(fullname.space, fullname.local);
    else
      this.setAttributeNS(fullname.space, fullname.local, v2);
  };
}
function attr_default(name, value) {
  var fullname = namespace_default(name);
  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }
  return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/window.js
function window_default(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/style.js
function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}
function styleFunction(name, value, priority) {
  return function() {
    var v2 = value.apply(this, arguments);
    if (v2 == null)
      this.style.removeProperty(name);
    else
      this.style.setProperty(name, v2, priority);
  };
}
function style_default(name, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
}
function styleValue(node, name) {
  return node.style.getPropertyValue(name) || window_default(node).getComputedStyle(node, null).getPropertyValue(name);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/property.js
function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}
function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}
function propertyFunction(name, value) {
  return function() {
    var v2 = value.apply(this, arguments);
    if (v2 == null)
      delete this[name];
    else
      this[name] = v2;
  };
}
function property_default(name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/classed.js
function classArray(string) {
  return string.trim().split(/^|\s+/);
}
function classList(node) {
  return node.classList || new ClassList(node);
}
function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}
ClassList.prototype = {
  add: function(name) {
    var i2 = this._names.indexOf(name);
    if (i2 < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i2 = this._names.indexOf(name);
    if (i2 >= 0) {
      this._names.splice(i2, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};
function classedAdd(node, names) {
  var list = classList(node), i2 = -1, n2 = names.length;
  while (++i2 < n2)
    list.add(names[i2]);
}
function classedRemove(node, names) {
  var list = classList(node), i2 = -1, n2 = names.length;
  while (++i2 < n2)
    list.remove(names[i2]);
}
function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}
function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}
function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}
function classed_default(name, value) {
  var names = classArray(name + "");
  if (arguments.length < 2) {
    var list = classList(this.node()), i2 = -1, n2 = names.length;
    while (++i2 < n2)
      if (!list.contains(names[i2]))
        return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/text.js
function textRemove() {
  this.textContent = "";
}
function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction(value) {
  return function() {
    var v2 = value.apply(this, arguments);
    this.textContent = v2 == null ? "" : v2;
  };
}
function text_default(value) {
  return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/html.js
function htmlRemove() {
  this.innerHTML = "";
}
function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}
function htmlFunction(value) {
  return function() {
    var v2 = value.apply(this, arguments);
    this.innerHTML = v2 == null ? "" : v2;
  };
}
function html_default(value) {
  return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/raise.js
function raise() {
  if (this.nextSibling)
    this.parentNode.appendChild(this);
}
function raise_default() {
  return this.each(raise);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/lower.js
function lower() {
  if (this.previousSibling)
    this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function lower_default() {
  return this.each(lower);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/append.js
function append_default(name) {
  var create2 = typeof name === "function" ? name : creator_default(name);
  return this.select(function() {
    return this.appendChild(create2.apply(this, arguments));
  });
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/insert.js
function constantNull() {
  return null;
}
function insert_default(name, before) {
  var create2 = typeof name === "function" ? name : creator_default(name), select = before == null ? constantNull : typeof before === "function" ? before : selector_default(before);
  return this.select(function() {
    return this.insertBefore(create2.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/remove.js
function remove() {
  var parent = this.parentNode;
  if (parent)
    parent.removeChild(this);
}
function remove_default() {
  return this.each(remove);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/clone.js
function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function clone_default(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/datum.js
function datum_default(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/on.js
function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames2(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t2) {
    var name = "", i2 = t2.indexOf(".");
    if (i2 >= 0)
      name = t2.slice(i2 + 1), t2 = t2.slice(0, i2);
    return { type: t2, name };
  });
}
function onRemove(typename) {
  return function() {
    var on2 = this.__on;
    if (!on2)
      return;
    for (var j2 = 0, i2 = -1, m2 = on2.length, o2; j2 < m2; ++j2) {
      if (o2 = on2[j2], (!typename.type || o2.type === typename.type) && o2.name === typename.name) {
        this.removeEventListener(o2.type, o2.listener, o2.options);
      } else {
        on2[++i2] = o2;
      }
    }
    if (++i2)
      on2.length = i2;
    else
      delete this.__on;
  };
}
function onAdd(typename, value, options) {
  return function() {
    var on2 = this.__on, o2, listener = contextListener(value);
    if (on2)
      for (var j2 = 0, m2 = on2.length; j2 < m2; ++j2) {
        if ((o2 = on2[j2]).type === typename.type && o2.name === typename.name) {
          this.removeEventListener(o2.type, o2.listener, o2.options);
          this.addEventListener(o2.type, o2.listener = listener, o2.options = options);
          o2.value = value;
          return;
        }
      }
    this.addEventListener(typename.type, listener, options);
    o2 = { type: typename.type, name: typename.name, value, listener, options };
    if (!on2)
      this.__on = [o2];
    else
      on2.push(o2);
  };
}
function on_default(typename, value, options) {
  var typenames = parseTypenames2(typename + ""), i2, n2 = typenames.length, t2;
  if (arguments.length < 2) {
    var on2 = this.node().__on;
    if (on2)
      for (var j2 = 0, m2 = on2.length, o2; j2 < m2; ++j2) {
        for (i2 = 0, o2 = on2[j2]; i2 < n2; ++i2) {
          if ((t2 = typenames[i2]).type === o2.type && t2.name === o2.name) {
            return o2.value;
          }
        }
      }
    return;
  }
  on2 = value ? onAdd : onRemove;
  for (i2 = 0; i2 < n2; ++i2)
    this.each(on2(typenames[i2], value, options));
  return this;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/dispatch.js
function dispatchEvent(node, type2, params) {
  var window2 = window_default(node), event = window2.CustomEvent;
  if (typeof event === "function") {
    event = new event(type2, params);
  } else {
    event = window2.document.createEvent("Event");
    if (params)
      event.initEvent(type2, params.bubbles, params.cancelable), event.detail = params.detail;
    else
      event.initEvent(type2, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant(type2, params) {
  return function() {
    return dispatchEvent(this, type2, params);
  };
}
function dispatchFunction(type2, params) {
  return function() {
    return dispatchEvent(this, type2, params.apply(this, arguments));
  };
}
function dispatch_default2(type2, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type2, params));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/iterator.js
function* iterator_default() {
  for (var groups = this._groups, j2 = 0, m2 = groups.length; j2 < m2; ++j2) {
    for (var group = groups[j2], i2 = 0, n2 = group.length, node; i2 < n2; ++i2) {
      if (node = group[i2])
        yield node;
    }
  }
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/selection/index.js
var root = [null];
function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}
function selection() {
  return new Selection([[document.documentElement]], root);
}
function selection_selection() {
  return this;
}
Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: select_default,
  selectAll: selectAll_default,
  selectChild: selectChild_default,
  selectChildren: selectChildren_default,
  filter: filter_default,
  data: data_default,
  enter: enter_default,
  exit: exit_default,
  join: join_default,
  merge: merge_default,
  selection: selection_selection,
  order: order_default,
  sort: sort_default,
  call: call_default,
  nodes: nodes_default,
  node: node_default,
  size: size_default,
  empty: empty_default,
  each: each_default,
  attr: attr_default,
  style: style_default,
  property: property_default,
  classed: classed_default,
  text: text_default,
  html: html_default,
  raise: raise_default,
  lower: lower_default,
  append: append_default,
  insert: insert_default,
  remove: remove_default,
  clone: clone_default,
  datum: datum_default,
  on: on_default,
  dispatch: dispatch_default2,
  [Symbol.iterator]: iterator_default
};
var selection_default = selection;

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-selection@3.0.0/node_modules/d3-selection/src/select.js
function select_default2(selector) {
  return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-color@3.1.0/node_modules/d3-color/src/define.js
function define_default(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition)
    prototype[key] = definition[key];
  return prototype;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-color@3.1.0/node_modules/d3-color/src/color.js
function Color() {
}
var darker = 0.7;
var brighter = 1 / darker;
var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex = /^#([0-9a-f]{3,8})$/;
var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
var named = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
define_default(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor(), this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function color(format) {
  var m2, l2;
  format = (format + "").trim().toLowerCase();
  return (m2 = reHex.exec(format)) ? (l2 = m2[1].length, m2 = parseInt(m2[1], 16), l2 === 6 ? rgbn(m2) : l2 === 3 ? new Rgb(m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, (m2 & 15) << 4 | m2 & 15, 1) : l2 === 8 ? rgba(m2 >> 24 & 255, m2 >> 16 & 255, m2 >> 8 & 255, (m2 & 255) / 255) : l2 === 4 ? rgba(m2 >> 12 & 15 | m2 >> 8 & 240, m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, ((m2 & 15) << 4 | m2 & 15) / 255) : null) : (m2 = reRgbInteger.exec(format)) ? new Rgb(m2[1], m2[2], m2[3], 1) : (m2 = reRgbPercent.exec(format)) ? new Rgb(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, 1) : (m2 = reRgbaInteger.exec(format)) ? rgba(m2[1], m2[2], m2[3], m2[4]) : (m2 = reRgbaPercent.exec(format)) ? rgba(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, m2[4]) : (m2 = reHslPercent.exec(format)) ? hsla(m2[1], m2[2] / 100, m2[3] / 100, 1) : (m2 = reHslaPercent.exec(format)) ? hsla(m2[1], m2[2] / 100, m2[3] / 100, m2[4]) : named.hasOwnProperty(format) ? rgbn(named[format]) : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n2) {
  return new Rgb(n2 >> 16 & 255, n2 >> 8 & 255, n2 & 255, 1);
}
function rgba(r2, g2, b2, a2) {
  if (a2 <= 0)
    r2 = g2 = b2 = NaN;
  return new Rgb(r2, g2, b2, a2);
}
function rgbConvert(o2) {
  if (!(o2 instanceof Color))
    o2 = color(o2);
  if (!o2)
    return new Rgb();
  o2 = o2.rgb();
  return new Rgb(o2.r, o2.g, o2.b, o2.opacity);
}
function rgb(r2, g2, b2, opacity) {
  return arguments.length === 1 ? rgbConvert(r2) : new Rgb(r2, g2, b2, opacity == null ? 1 : opacity);
}
function Rgb(r2, g2, b2, opacity) {
  this.r = +r2;
  this.g = +g2;
  this.b = +b2;
  this.opacity = +opacity;
}
define_default(Rgb, rgb, extend(Color, {
  brighter(k2) {
    k2 = k2 == null ? brighter : Math.pow(brighter, k2);
    return new Rgb(this.r * k2, this.g * k2, this.b * k2, this.opacity);
  },
  darker(k2) {
    k2 = k2 == null ? darker : Math.pow(darker, k2);
    return new Rgb(this.r * k2, this.g * k2, this.b * k2, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a2 = clampa(this.opacity);
  return `${a2 === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a2 === 1 ? ")" : `, ${a2})`}`;
}
function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla(h2, s2, l2, a2) {
  if (a2 <= 0)
    h2 = s2 = l2 = NaN;
  else if (l2 <= 0 || l2 >= 1)
    h2 = s2 = NaN;
  else if (s2 <= 0)
    h2 = NaN;
  return new Hsl(h2, s2, l2, a2);
}
function hslConvert(o2) {
  if (o2 instanceof Hsl)
    return new Hsl(o2.h, o2.s, o2.l, o2.opacity);
  if (!(o2 instanceof Color))
    o2 = color(o2);
  if (!o2)
    return new Hsl();
  if (o2 instanceof Hsl)
    return o2;
  o2 = o2.rgb();
  var r2 = o2.r / 255, g2 = o2.g / 255, b2 = o2.b / 255, min2 = Math.min(r2, g2, b2), max2 = Math.max(r2, g2, b2), h2 = NaN, s2 = max2 - min2, l2 = (max2 + min2) / 2;
  if (s2) {
    if (r2 === max2)
      h2 = (g2 - b2) / s2 + (g2 < b2) * 6;
    else if (g2 === max2)
      h2 = (b2 - r2) / s2 + 2;
    else
      h2 = (r2 - g2) / s2 + 4;
    s2 /= l2 < 0.5 ? max2 + min2 : 2 - max2 - min2;
    h2 *= 60;
  } else {
    s2 = l2 > 0 && l2 < 1 ? 0 : h2;
  }
  return new Hsl(h2, s2, l2, o2.opacity);
}
function hsl(h2, s2, l2, opacity) {
  return arguments.length === 1 ? hslConvert(h2) : new Hsl(h2, s2, l2, opacity == null ? 1 : opacity);
}
function Hsl(h2, s2, l2, opacity) {
  this.h = +h2;
  this.s = +s2;
  this.l = +l2;
  this.opacity = +opacity;
}
define_default(Hsl, hsl, extend(Color, {
  brighter(k2) {
    k2 = k2 == null ? brighter : Math.pow(brighter, k2);
    return new Hsl(this.h, this.s, this.l * k2, this.opacity);
  },
  darker(k2) {
    k2 = k2 == null ? darker : Math.pow(darker, k2);
    return new Hsl(this.h, this.s, this.l * k2, this.opacity);
  },
  rgb() {
    var h2 = this.h % 360 + (this.h < 0) * 360, s2 = isNaN(h2) || isNaN(this.s) ? 0 : this.s, l2 = this.l, m2 = l2 + (l2 < 0.5 ? l2 : 1 - l2) * s2, m1 = 2 * l2 - m2;
    return new Rgb(
      hsl2rgb(h2 >= 240 ? h2 - 240 : h2 + 120, m1, m2),
      hsl2rgb(h2, m1, m2),
      hsl2rgb(h2 < 120 ? h2 + 240 : h2 - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a2 = clampa(this.opacity);
    return `${a2 === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a2 === 1 ? ")" : `, ${a2})`}`;
  }
}));
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h2, m1, m2) {
  return (h2 < 60 ? m1 + (m2 - m1) * h2 / 60 : h2 < 180 ? m2 : h2 < 240 ? m1 + (m2 - m1) * (240 - h2) / 60 : m1) * 255;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/basis.js
function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}
function basis_default(values) {
  var n2 = values.length - 1;
  return function(t2) {
    var i2 = t2 <= 0 ? t2 = 0 : t2 >= 1 ? (t2 = 1, n2 - 1) : Math.floor(t2 * n2), v1 = values[i2], v2 = values[i2 + 1], v0 = i2 > 0 ? values[i2 - 1] : 2 * v1 - v2, v3 = i2 < n2 - 1 ? values[i2 + 2] : 2 * v2 - v1;
    return basis((t2 - i2 / n2) * n2, v0, v1, v2, v3);
  };
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/basisClosed.js
function basisClosed_default(values) {
  var n2 = values.length;
  return function(t2) {
    var i2 = Math.floor(((t2 %= 1) < 0 ? ++t2 : t2) * n2), v0 = values[(i2 + n2 - 1) % n2], v1 = values[i2 % n2], v2 = values[(i2 + 1) % n2], v3 = values[(i2 + 2) % n2];
    return basis((t2 - i2 / n2) * n2, v0, v1, v2, v3);
  };
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/constant.js
var constant_default2 = (x2) => () => x2;

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/color.js
function linear(a2, d2) {
  return function(t2) {
    return a2 + t2 * d2;
  };
}
function exponential(a2, b2, y2) {
  return a2 = Math.pow(a2, y2), b2 = Math.pow(b2, y2) - a2, y2 = 1 / y2, function(t2) {
    return Math.pow(a2 + t2 * b2, y2);
  };
}
function gamma(y2) {
  return (y2 = +y2) === 1 ? nogamma : function(a2, b2) {
    return b2 - a2 ? exponential(a2, b2, y2) : constant_default2(isNaN(a2) ? b2 : a2);
  };
}
function nogamma(a2, b2) {
  var d2 = b2 - a2;
  return d2 ? linear(a2, d2) : constant_default2(isNaN(a2) ? b2 : a2);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/rgb.js
var rgb_default = function rgbGamma(y2) {
  var color2 = gamma(y2);
  function rgb2(start2, end) {
    var r2 = color2((start2 = rgb(start2)).r, (end = rgb(end)).r), g2 = color2(start2.g, end.g), b2 = color2(start2.b, end.b), opacity = nogamma(start2.opacity, end.opacity);
    return function(t2) {
      start2.r = r2(t2);
      start2.g = g2(t2);
      start2.b = b2(t2);
      start2.opacity = opacity(t2);
      return start2 + "";
    };
  }
  rgb2.gamma = rgbGamma;
  return rgb2;
}(1);
function rgbSpline(spline) {
  return function(colors) {
    var n2 = colors.length, r2 = new Array(n2), g2 = new Array(n2), b2 = new Array(n2), i2, color2;
    for (i2 = 0; i2 < n2; ++i2) {
      color2 = rgb(colors[i2]);
      r2[i2] = color2.r || 0;
      g2[i2] = color2.g || 0;
      b2[i2] = color2.b || 0;
    }
    r2 = spline(r2);
    g2 = spline(g2);
    b2 = spline(b2);
    color2.opacity = 1;
    return function(t2) {
      color2.r = r2(t2);
      color2.g = g2(t2);
      color2.b = b2(t2);
      return color2 + "";
    };
  };
}
var rgbBasis = rgbSpline(basis_default);
var rgbBasisClosed = rgbSpline(basisClosed_default);

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/number.js
function number_default(a2, b2) {
  return a2 = +a2, b2 = +b2, function(t2) {
    return a2 * (1 - t2) + b2 * t2;
  };
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/string.js
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
function zero(b2) {
  return function() {
    return b2;
  };
}
function one(b2) {
  return function(t2) {
    return b2(t2) + "";
  };
}
function string_default(a2, b2) {
  var bi2 = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i2 = -1, s2 = [], q2 = [];
  a2 = a2 + "", b2 = b2 + "";
  while ((am = reA.exec(a2)) && (bm = reB.exec(b2))) {
    if ((bs = bm.index) > bi2) {
      bs = b2.slice(bi2, bs);
      if (s2[i2])
        s2[i2] += bs;
      else
        s2[++i2] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s2[i2])
        s2[i2] += bm;
      else
        s2[++i2] = bm;
    } else {
      s2[++i2] = null;
      q2.push({ i: i2, x: number_default(am, bm) });
    }
    bi2 = reB.lastIndex;
  }
  if (bi2 < b2.length) {
    bs = b2.slice(bi2);
    if (s2[i2])
      s2[i2] += bs;
    else
      s2[++i2] = bs;
  }
  return s2.length < 2 ? q2[0] ? one(q2[0].x) : zero(b2) : (b2 = q2.length, function(t2) {
    for (var i3 = 0, o2; i3 < b2; ++i3)
      s2[(o2 = q2[i3]).i] = o2.x(t2);
    return s2.join("");
  });
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/decompose.js
var degrees = 180 / Math.PI;
var identity = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
function decompose_default(a2, b2, c2, d2, e2, f2) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a2 * a2 + b2 * b2))
    a2 /= scaleX, b2 /= scaleX;
  if (skewX = a2 * c2 + b2 * d2)
    c2 -= a2 * skewX, d2 -= b2 * skewX;
  if (scaleY = Math.sqrt(c2 * c2 + d2 * d2))
    c2 /= scaleY, d2 /= scaleY, skewX /= scaleY;
  if (a2 * d2 < b2 * c2)
    a2 = -a2, b2 = -b2, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e2,
    translateY: f2,
    rotate: Math.atan2(b2, a2) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX,
    scaleY
  };
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/parse.js
var svgNode;
function parseCss(value) {
  const m2 = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m2.isIdentity ? identity : decompose_default(m2.a, m2.b, m2.c, m2.d, m2.e, m2.f);
}
function parseSvg(value) {
  if (value == null)
    return identity;
  if (!svgNode)
    svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate()))
    return identity;
  value = value.matrix;
  return decompose_default(value.a, value.b, value.c, value.d, value.e, value.f);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/index.js
function interpolateTransform(parse, pxComma, pxParen, degParen) {
  function pop(s2) {
    return s2.length ? s2.pop() + " " : "";
  }
  function translate(xa2, ya2, xb, yb, s2, q2) {
    if (xa2 !== xb || ya2 !== yb) {
      var i2 = s2.push("translate(", null, pxComma, null, pxParen);
      q2.push({ i: i2 - 4, x: number_default(xa2, xb) }, { i: i2 - 2, x: number_default(ya2, yb) });
    } else if (xb || yb) {
      s2.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a2, b2, s2, q2) {
    if (a2 !== b2) {
      if (a2 - b2 > 180)
        b2 += 360;
      else if (b2 - a2 > 180)
        a2 += 360;
      q2.push({ i: s2.push(pop(s2) + "rotate(", null, degParen) - 2, x: number_default(a2, b2) });
    } else if (b2) {
      s2.push(pop(s2) + "rotate(" + b2 + degParen);
    }
  }
  function skewX(a2, b2, s2, q2) {
    if (a2 !== b2) {
      q2.push({ i: s2.push(pop(s2) + "skewX(", null, degParen) - 2, x: number_default(a2, b2) });
    } else if (b2) {
      s2.push(pop(s2) + "skewX(" + b2 + degParen);
    }
  }
  function scale(xa2, ya2, xb, yb, s2, q2) {
    if (xa2 !== xb || ya2 !== yb) {
      var i2 = s2.push(pop(s2) + "scale(", null, ",", null, ")");
      q2.push({ i: i2 - 4, x: number_default(xa2, xb) }, { i: i2 - 2, x: number_default(ya2, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s2.push(pop(s2) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function(a2, b2) {
    var s2 = [], q2 = [];
    a2 = parse(a2), b2 = parse(b2);
    translate(a2.translateX, a2.translateY, b2.translateX, b2.translateY, s2, q2);
    rotate(a2.rotate, b2.rotate, s2, q2);
    skewX(a2.skewX, b2.skewX, s2, q2);
    scale(a2.scaleX, a2.scaleY, b2.scaleX, b2.scaleY, s2, q2);
    a2 = b2 = null;
    return function(t2) {
      var i2 = -1, n2 = q2.length, o2;
      while (++i2 < n2)
        s2[(o2 = q2[i2]).i] = o2.x(t2);
      return s2.join("");
    };
  };
}
var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-timer@3.0.1/node_modules/d3-timer/src/timer.js
var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1e3;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f2) {
  setTimeout(f2, 17);
};
function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}
function clearNow() {
  clockNow = 0;
}
function Timer() {
  this._call = this._time = this._next = null;
}
Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function")
      throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail)
        taskTail._next = this;
      else
        taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};
function timer(callback, delay, time) {
  var t2 = new Timer();
  t2.restart(callback, delay, time);
  return t2;
}
function timerFlush() {
  now();
  ++frame;
  var t2 = taskHead, e2;
  while (t2) {
    if ((e2 = clockNow - t2._time) >= 0)
      t2._call.call(void 0, e2);
    t2 = t2._next;
  }
  --frame;
}
function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}
function poke() {
  var now2 = clock.now(), delay = now2 - clockLast;
  if (delay > pokeDelay)
    clockSkew -= delay, clockLast = now2;
}
function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time)
        time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}
function sleep(time) {
  if (frame)
    return;
  if (timeout)
    timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity)
      timeout = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval)
      interval = clearInterval(interval);
  } else {
    if (!interval)
      clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-timer@3.0.1/node_modules/d3-timer/src/timeout.js
function timeout_default(callback, delay, time) {
  var t2 = new Timer();
  delay = delay == null ? 0 : +delay;
  t2.restart((elapsed) => {
    t2.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t2;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/schedule.js
var emptyOn = dispatch_default("start", "end", "cancel", "interrupt");
var emptyTween = [];
var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;
function schedule_default(node, name, id2, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules)
    node.__transition = {};
  else if (id2 in schedules)
    return;
  create(node, id2, {
    name,
    index,
    // For context during callback.
    group,
    // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}
function init(node, id2) {
  var schedule = get2(node, id2);
  if (schedule.state > CREATED)
    throw new Error("too late; already scheduled");
  return schedule;
}
function set2(node, id2) {
  var schedule = get2(node, id2);
  if (schedule.state > STARTED)
    throw new Error("too late; already running");
  return schedule;
}
function get2(node, id2) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id2]))
    throw new Error("transition not found");
  return schedule;
}
function create(node, id2, self) {
  var schedules = node.__transition, tween;
  schedules[id2] = self;
  self.timer = timer(schedule, 0, self.time);
  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start2, self.delay, self.time);
    if (self.delay <= elapsed)
      start2(elapsed - self.delay);
  }
  function start2(elapsed) {
    var i2, j2, n2, o2;
    if (self.state !== SCHEDULED)
      return stop();
    for (i2 in schedules) {
      o2 = schedules[i2];
      if (o2.name !== self.name)
        continue;
      if (o2.state === STARTED)
        return timeout_default(start2);
      if (o2.state === RUNNING) {
        o2.state = ENDED;
        o2.timer.stop();
        o2.on.call("interrupt", node, node.__data__, o2.index, o2.group);
        delete schedules[i2];
      } else if (+i2 < id2) {
        o2.state = ENDED;
        o2.timer.stop();
        o2.on.call("cancel", node, node.__data__, o2.index, o2.group);
        delete schedules[i2];
      }
    }
    timeout_default(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING)
      return;
    self.state = STARTED;
    tween = new Array(n2 = self.tween.length);
    for (i2 = 0, j2 = -1; i2 < n2; ++i2) {
      if (o2 = self.tween[i2].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j2] = o2;
      }
    }
    tween.length = j2 + 1;
  }
  function tick(elapsed) {
    var t2 = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1), i2 = -1, n2 = tween.length;
    while (++i2 < n2) {
      tween[i2].call(node, t2);
    }
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }
  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id2];
    for (var i2 in schedules)
      return;
    delete node.__transition;
  }
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/interrupt.js
function interrupt_default(node, name) {
  var schedules = node.__transition, schedule, active, empty2 = true, i2;
  if (!schedules)
    return;
  name = name == null ? null : name + "";
  for (i2 in schedules) {
    if ((schedule = schedules[i2]).name !== name) {
      empty2 = false;
      continue;
    }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i2];
  }
  if (empty2)
    delete node.__transition;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/selection/interrupt.js
function interrupt_default2(name) {
  return this.each(function() {
    interrupt_default(this, name);
  });
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/tween.js
function tweenRemove(id2, name) {
  var tween0, tween1;
  return function() {
    var schedule = set2(this, id2), tween = schedule.tween;
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i2 = 0, n2 = tween1.length; i2 < n2; ++i2) {
        if (tween1[i2].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i2, 1);
          break;
        }
      }
    }
    schedule.tween = tween1;
  };
}
function tweenFunction(id2, name, value) {
  var tween0, tween1;
  if (typeof value !== "function")
    throw new Error();
  return function() {
    var schedule = set2(this, id2), tween = schedule.tween;
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t2 = { name, value }, i2 = 0, n2 = tween1.length; i2 < n2; ++i2) {
        if (tween1[i2].name === name) {
          tween1[i2] = t2;
          break;
        }
      }
      if (i2 === n2)
        tween1.push(t2);
    }
    schedule.tween = tween1;
  };
}
function tween_default(name, value) {
  var id2 = this._id;
  name += "";
  if (arguments.length < 2) {
    var tween = get2(this.node(), id2).tween;
    for (var i2 = 0, n2 = tween.length, t2; i2 < n2; ++i2) {
      if ((t2 = tween[i2]).name === name) {
        return t2.value;
      }
    }
    return null;
  }
  return this.each((value == null ? tweenRemove : tweenFunction)(id2, name, value));
}
function tweenValue(transition2, name, value) {
  var id2 = transition2._id;
  transition2.each(function() {
    var schedule = set2(this, id2);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });
  return function(node) {
    return get2(node, id2).value[name];
  };
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/interpolate.js
function interpolate_default(a2, b2) {
  var c2;
  return (typeof b2 === "number" ? number_default : b2 instanceof color ? rgb_default : (c2 = color(b2)) ? (b2 = c2, rgb_default) : string_default)(a2, b2);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/attr.js
function attrRemove2(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS2(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant2(name, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function attrConstantNS2(fullname, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function attrFunction2(name, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function attrFunctionNS2(fullname, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function attr_default2(name, value) {
  var fullname = namespace_default(name), i2 = fullname === "transform" ? interpolateTransformSvg : interpolate_default;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS2 : attrFunction2)(fullname, i2, tweenValue(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS2 : attrRemove2)(fullname) : (fullname.local ? attrConstantNS2 : attrConstant2)(fullname, i2, value));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/attrTween.js
function attrInterpolate(name, i2) {
  return function(t2) {
    this.setAttribute(name, i2.call(this, t2));
  };
}
function attrInterpolateNS(fullname, i2) {
  return function(t2) {
    this.setAttributeNS(fullname.space, fullname.local, i2.call(this, t2));
  };
}
function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween() {
    var i2 = value.apply(this, arguments);
    if (i2 !== i0)
      t0 = (i0 = i2) && attrInterpolateNS(fullname, i2);
    return t0;
  }
  tween._value = value;
  return tween;
}
function attrTween(name, value) {
  var t0, i0;
  function tween() {
    var i2 = value.apply(this, arguments);
    if (i2 !== i0)
      t0 = (i0 = i2) && attrInterpolate(name, i2);
    return t0;
  }
  tween._value = value;
  return tween;
}
function attrTween_default(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error();
  var fullname = namespace_default(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/delay.js
function delayFunction(id2, value) {
  return function() {
    init(this, id2).delay = +value.apply(this, arguments);
  };
}
function delayConstant(id2, value) {
  return value = +value, function() {
    init(this, id2).delay = value;
  };
}
function delay_default(value) {
  var id2 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id2, value)) : get2(this.node(), id2).delay;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/duration.js
function durationFunction(id2, value) {
  return function() {
    set2(this, id2).duration = +value.apply(this, arguments);
  };
}
function durationConstant(id2, value) {
  return value = +value, function() {
    set2(this, id2).duration = value;
  };
}
function duration_default(value) {
  var id2 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id2, value)) : get2(this.node(), id2).duration;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/ease.js
function easeConstant(id2, value) {
  if (typeof value !== "function")
    throw new Error();
  return function() {
    set2(this, id2).ease = value;
  };
}
function ease_default(value) {
  var id2 = this._id;
  return arguments.length ? this.each(easeConstant(id2, value)) : get2(this.node(), id2).ease;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/easeVarying.js
function easeVarying(id2, value) {
  return function() {
    var v2 = value.apply(this, arguments);
    if (typeof v2 !== "function")
      throw new Error();
    set2(this, id2).ease = v2;
  };
}
function easeVarying_default(value) {
  if (typeof value !== "function")
    throw new Error();
  return this.each(easeVarying(this._id, value));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/filter.js
function filter_default2(match) {
  if (typeof match !== "function")
    match = matcher_default(match);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j2 = 0; j2 < m2; ++j2) {
    for (var group = groups[j2], n2 = group.length, subgroup = subgroups[j2] = [], node, i2 = 0; i2 < n2; ++i2) {
      if ((node = group[i2]) && match.call(node, node.__data__, i2, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Transition(subgroups, this._parents, this._name, this._id);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/merge.js
function merge_default2(transition2) {
  if (transition2._id !== this._id)
    throw new Error();
  for (var groups0 = this._groups, groups1 = transition2._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges = new Array(m0), j2 = 0; j2 < m2; ++j2) {
    for (var group0 = groups0[j2], group1 = groups1[j2], n2 = group0.length, merge = merges[j2] = new Array(n2), node, i2 = 0; i2 < n2; ++i2) {
      if (node = group0[i2] || group1[i2]) {
        merge[i2] = node;
      }
    }
  }
  for (; j2 < m0; ++j2) {
    merges[j2] = groups0[j2];
  }
  return new Transition(merges, this._parents, this._name, this._id);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/on.js
function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t2) {
    var i2 = t2.indexOf(".");
    if (i2 >= 0)
      t2 = t2.slice(0, i2);
    return !t2 || t2 === "start";
  });
}
function onFunction(id2, name, listener) {
  var on0, on1, sit = start(name) ? init : set2;
  return function() {
    var schedule = sit(this, id2), on2 = schedule.on;
    if (on2 !== on0)
      (on1 = (on0 = on2).copy()).on(name, listener);
    schedule.on = on1;
  };
}
function on_default2(name, listener) {
  var id2 = this._id;
  return arguments.length < 2 ? get2(this.node(), id2).on.on(name) : this.each(onFunction(id2, name, listener));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/remove.js
function removeFunction(id2) {
  return function() {
    var parent = this.parentNode;
    for (var i2 in this.__transition)
      if (+i2 !== id2)
        return;
    if (parent)
      parent.removeChild(this);
  };
}
function remove_default2() {
  return this.on("end.remove", removeFunction(this._id));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/select.js
function select_default3(select) {
  var name = this._name, id2 = this._id;
  if (typeof select !== "function")
    select = selector_default(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j2 = 0; j2 < m2; ++j2) {
    for (var group = groups[j2], n2 = group.length, subgroup = subgroups[j2] = new Array(n2), node, subnode, i2 = 0; i2 < n2; ++i2) {
      if ((node = group[i2]) && (subnode = select.call(node, node.__data__, i2, group))) {
        if ("__data__" in node)
          subnode.__data__ = node.__data__;
        subgroup[i2] = subnode;
        schedule_default(subgroup[i2], name, id2, i2, subgroup, get2(node, id2));
      }
    }
  }
  return new Transition(subgroups, this._parents, name, id2);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/selectAll.js
function selectAll_default2(select) {
  var name = this._name, id2 = this._id;
  if (typeof select !== "function")
    select = selectorAll_default(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j2 = 0; j2 < m2; ++j2) {
    for (var group = groups[j2], n2 = group.length, node, i2 = 0; i2 < n2; ++i2) {
      if (node = group[i2]) {
        for (var children2 = select.call(node, node.__data__, i2, group), child, inherit2 = get2(node, id2), k2 = 0, l2 = children2.length; k2 < l2; ++k2) {
          if (child = children2[k2]) {
            schedule_default(child, name, id2, k2, children2, inherit2);
          }
        }
        subgroups.push(children2);
        parents.push(node);
      }
    }
  }
  return new Transition(subgroups, parents, name, id2);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/selection.js
var Selection2 = selection_default.prototype.constructor;
function selection_default2() {
  return new Selection2(this._groups, this._parents);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/style.js
function styleNull(name, interpolate) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name), string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate(string00 = string0, string10 = string1);
  };
}
function styleRemove2(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant2(name, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = styleValue(this, name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function styleFunction2(name, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name), value1 = value(this), string1 = value1 + "";
    if (value1 == null)
      string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function styleMaybeRemove(id2, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove2;
  return function() {
    var schedule = set2(this, id2), on2 = schedule.on, listener = schedule.value[key] == null ? remove2 || (remove2 = styleRemove2(name)) : void 0;
    if (on2 !== on0 || listener0 !== listener)
      (on1 = (on0 = on2).copy()).on(event, listener0 = listener);
    schedule.on = on1;
  };
}
function style_default2(name, value, priority) {
  var i2 = (name += "") === "transform" ? interpolateTransformCss : interpolate_default;
  return value == null ? this.styleTween(name, styleNull(name, i2)).on("end.style." + name, styleRemove2(name)) : typeof value === "function" ? this.styleTween(name, styleFunction2(name, i2, tweenValue(this, "style." + name, value))).each(styleMaybeRemove(this._id, name)) : this.styleTween(name, styleConstant2(name, i2, value), priority).on("end.style." + name, null);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/styleTween.js
function styleInterpolate(name, i2, priority) {
  return function(t2) {
    this.style.setProperty(name, i2.call(this, t2), priority);
  };
}
function styleTween(name, value, priority) {
  var t2, i0;
  function tween() {
    var i2 = value.apply(this, arguments);
    if (i2 !== i0)
      t2 = (i0 = i2) && styleInterpolate(name, i2, priority);
    return t2;
  }
  tween._value = value;
  return tween;
}
function styleTween_default(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error();
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/text.js
function textConstant2(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction2(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}
function text_default2(value) {
  return this.tween("text", typeof value === "function" ? textFunction2(tweenValue(this, "text", value)) : textConstant2(value == null ? "" : value + ""));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/textTween.js
function textInterpolate(i2) {
  return function(t2) {
    this.textContent = i2.call(this, t2);
  };
}
function textTween(value) {
  var t0, i0;
  function tween() {
    var i2 = value.apply(this, arguments);
    if (i2 !== i0)
      t0 = (i0 = i2) && textInterpolate(i2);
    return t0;
  }
  tween._value = value;
  return tween;
}
function textTween_default(value) {
  var key = "text";
  if (arguments.length < 1)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error();
  return this.tween(key, textTween(value));
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/transition.js
function transition_default() {
  var name = this._name, id0 = this._id, id1 = newId();
  for (var groups = this._groups, m2 = groups.length, j2 = 0; j2 < m2; ++j2) {
    for (var group = groups[j2], n2 = group.length, node, i2 = 0; i2 < n2; ++i2) {
      if (node = group[i2]) {
        var inherit2 = get2(node, id0);
        schedule_default(node, name, id1, i2, group, {
          time: inherit2.time + inherit2.delay + inherit2.duration,
          delay: 0,
          duration: inherit2.duration,
          ease: inherit2.ease
        });
      }
    }
  }
  return new Transition(groups, this._parents, name, id1);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/end.js
function end_default() {
  var on0, on1, that = this, id2 = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = { value: reject }, end = { value: function() {
      if (--size === 0)
        resolve();
    } };
    that.each(function() {
      var schedule = set2(this, id2), on2 = schedule.on;
      if (on2 !== on0) {
        on1 = (on0 = on2).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }
      schedule.on = on1;
    });
    if (size === 0)
      resolve();
  });
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/transition/index.js
var id = 0;
function Transition(groups, parents, name, id2) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id2;
}
function transition(name) {
  return selection_default().transition(name);
}
function newId() {
  return ++id;
}
var selection_prototype = selection_default.prototype;
Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: select_default3,
  selectAll: selectAll_default2,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: filter_default2,
  merge: merge_default2,
  selection: selection_default2,
  transition: transition_default,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: on_default2,
  attr: attr_default2,
  attrTween: attrTween_default,
  style: style_default2,
  styleTween: styleTween_default,
  text: text_default2,
  textTween: textTween_default,
  remove: remove_default2,
  tween: tween_default,
  delay: delay_default,
  duration: duration_default,
  ease: ease_default,
  easeVarying: easeVarying_default,
  end: end_default,
  [Symbol.iterator]: selection_prototype[Symbol.iterator]
};

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-ease@3.0.1/node_modules/d3-ease/src/cubic.js
function cubicInOut(t2) {
  return ((t2 *= 2) <= 1 ? t2 * t2 * t2 : (t2 -= 2) * t2 * t2 + 2) / 2;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/selection/transition.js
var defaultTiming = {
  time: null,
  // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};
function inherit(node, id2) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id2])) {
    if (!(node = node.parentNode)) {
      throw new Error(`transition ${id2} not found`);
    }
  }
  return timing;
}
function transition_default2(name) {
  var id2, timing;
  if (name instanceof Transition) {
    id2 = name._id, name = name._name;
  } else {
    id2 = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }
  for (var groups = this._groups, m2 = groups.length, j2 = 0; j2 < m2; ++j2) {
    for (var group = groups[j2], n2 = group.length, node, i2 = 0; i2 < n2; ++i2) {
      if (node = group[i2]) {
        schedule_default(node, name, id2, i2, group, timing || inherit(node, id2));
      }
    }
  }
  return new Transition(groups, this._parents, name, id2);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-transition@3.0.1_d3-selection@3.0.0/node_modules/d3-transition/src/selection/index.js
selection_default.prototype.interrupt = interrupt_default2;
selection_default.prototype.transition = transition_default2;

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-brush@3.0.0/node_modules/d3-brush/src/brush.js
var { abs, max, min } = Math;
function number1(e2) {
  return [+e2[0], +e2[1]];
}
function number2(e2) {
  return [number1(e2[0]), number1(e2[1])];
}
var X2 = {
  name: "x",
  handles: ["w", "e"].map(type),
  input: function(x2, e2) {
    return x2 == null ? null : [[+x2[0], e2[0][1]], [+x2[1], e2[1][1]]];
  },
  output: function(xy) {
    return xy && [xy[0][0], xy[1][0]];
  }
};
var Y2 = {
  name: "y",
  handles: ["n", "s"].map(type),
  input: function(y2, e2) {
    return y2 == null ? null : [[e2[0][0], +y2[0]], [e2[1][0], +y2[1]]];
  },
  output: function(xy) {
    return xy && [xy[0][1], xy[1][1]];
  }
};
var XY = {
  name: "xy",
  handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type),
  input: function(xy) {
    return xy == null ? null : number2(xy);
  },
  output: function(xy) {
    return xy;
  }
};
function type(t2) {
  return { type: t2 };
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/count.js
function count(node) {
  var sum = 0, children2 = node.children, i2 = children2 && children2.length;
  if (!i2)
    sum = 1;
  else
    while (--i2 >= 0)
      sum += children2[i2].value;
  node.value = sum;
}
function count_default() {
  return this.eachAfter(count);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/each.js
function each_default2(callback, that) {
  let index = -1;
  for (const node of this) {
    callback.call(that, node, ++index, this);
  }
  return this;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/eachBefore.js
function eachBefore_default(callback, that) {
  var node = this, nodes = [node], children2, i2, index = -1;
  while (node = nodes.pop()) {
    callback.call(that, node, ++index, this);
    if (children2 = node.children) {
      for (i2 = children2.length - 1; i2 >= 0; --i2) {
        nodes.push(children2[i2]);
      }
    }
  }
  return this;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/eachAfter.js
function eachAfter_default(callback, that) {
  var node = this, nodes = [node], next = [], children2, i2, n2, index = -1;
  while (node = nodes.pop()) {
    next.push(node);
    if (children2 = node.children) {
      for (i2 = 0, n2 = children2.length; i2 < n2; ++i2) {
        nodes.push(children2[i2]);
      }
    }
  }
  while (node = next.pop()) {
    callback.call(that, node, ++index, this);
  }
  return this;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/find.js
function find_default(callback, that) {
  let index = -1;
  for (const node of this) {
    if (callback.call(that, node, ++index, this)) {
      return node;
    }
  }
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/sum.js
function sum_default(value) {
  return this.eachAfter(function(node) {
    var sum = +value(node.data) || 0, children2 = node.children, i2 = children2 && children2.length;
    while (--i2 >= 0)
      sum += children2[i2].value;
    node.value = sum;
  });
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/sort.js
function sort_default2(compare) {
  return this.eachBefore(function(node) {
    if (node.children) {
      node.children.sort(compare);
    }
  });
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/path.js
function path_default(end) {
  var start2 = this, ancestor = leastCommonAncestor(start2, end), nodes = [start2];
  while (start2 !== ancestor) {
    start2 = start2.parent;
    nodes.push(start2);
  }
  var k2 = nodes.length;
  while (end !== ancestor) {
    nodes.splice(k2, 0, end);
    end = end.parent;
  }
  return nodes;
}
function leastCommonAncestor(a2, b2) {
  if (a2 === b2)
    return a2;
  var aNodes = a2.ancestors(), bNodes = b2.ancestors(), c2 = null;
  a2 = aNodes.pop();
  b2 = bNodes.pop();
  while (a2 === b2) {
    c2 = a2;
    a2 = aNodes.pop();
    b2 = bNodes.pop();
  }
  return c2;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/ancestors.js
function ancestors_default() {
  var node = this, nodes = [node];
  while (node = node.parent) {
    nodes.push(node);
  }
  return nodes;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/descendants.js
function descendants_default() {
  return Array.from(this);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/leaves.js
function leaves_default() {
  var leaves = [];
  this.eachBefore(function(node) {
    if (!node.children) {
      leaves.push(node);
    }
  });
  return leaves;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/links.js
function links_default() {
  var root2 = this, links = [];
  root2.each(function(node) {
    if (node !== root2) {
      links.push({ source: node.parent, target: node });
    }
  });
  return links;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/iterator.js
function* iterator_default2() {
  var node = this, current, next = [node], children2, i2, n2;
  do {
    current = next.reverse(), next = [];
    while (node = current.pop()) {
      yield node;
      if (children2 = node.children) {
        for (i2 = 0, n2 = children2.length; i2 < n2; ++i2) {
          next.push(children2[i2]);
        }
      }
    }
  } while (next.length);
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/index.js
function hierarchy(data, children2) {
  if (data instanceof Map) {
    data = [void 0, data];
    if (children2 === void 0)
      children2 = mapChildren;
  } else if (children2 === void 0) {
    children2 = objectChildren;
  }
  var root2 = new Node(data), node, nodes = [root2], child, childs, i2, n2;
  while (node = nodes.pop()) {
    if ((childs = children2(node.data)) && (n2 = (childs = Array.from(childs)).length)) {
      node.children = childs;
      for (i2 = n2 - 1; i2 >= 0; --i2) {
        nodes.push(child = childs[i2] = new Node(childs[i2]));
        child.parent = node;
        child.depth = node.depth + 1;
      }
    }
  }
  return root2.eachBefore(computeHeight);
}
function node_copy() {
  return hierarchy(this).eachBefore(copyData);
}
function objectChildren(d2) {
  return d2.children;
}
function mapChildren(d2) {
  return Array.isArray(d2) ? d2[1] : null;
}
function copyData(node) {
  if (node.data.value !== void 0)
    node.value = node.data.value;
  node.data = node.data.data;
}
function computeHeight(node) {
  var height = 0;
  do
    node.height = height;
  while ((node = node.parent) && node.height < ++height);
}
function Node(data) {
  this.data = data;
  this.depth = this.height = 0;
  this.parent = null;
}
Node.prototype = hierarchy.prototype = {
  constructor: Node,
  count: count_default,
  each: each_default2,
  eachAfter: eachAfter_default,
  eachBefore: eachBefore_default,
  find: find_default,
  sum: sum_default,
  sort: sort_default2,
  path: path_default,
  ancestors: ancestors_default,
  descendants: descendants_default,
  leaves: leaves_default,
  links: links_default,
  copy: node_copy,
  [Symbol.iterator]: iterator_default2
};

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/tree.js
function defaultSeparation(a2, b2) {
  return a2.parent === b2.parent ? 1 : 2;
}
function nextLeft(v2) {
  var children2 = v2.children;
  return children2 ? children2[0] : v2.t;
}
function nextRight(v2) {
  var children2 = v2.children;
  return children2 ? children2[children2.length - 1] : v2.t;
}
function moveSubtree(wm, wp, shift) {
  var change = shift / (wp.i - wm.i);
  wp.c -= change;
  wp.s += shift;
  wm.c += change;
  wp.z += shift;
  wp.m += shift;
}
function executeShifts(v2) {
  var shift = 0, change = 0, children2 = v2.children, i2 = children2.length, w2;
  while (--i2 >= 0) {
    w2 = children2[i2];
    w2.z += shift;
    w2.m += shift;
    shift += w2.s + (change += w2.c);
  }
}
function nextAncestor(vim, v2, ancestor) {
  return vim.a.parent === v2.parent ? vim.a : ancestor;
}
function TreeNode(node, i2) {
  this._ = node;
  this.parent = null;
  this.children = null;
  this.A = null;
  this.a = this;
  this.z = 0;
  this.m = 0;
  this.c = 0;
  this.s = 0;
  this.t = null;
  this.i = i2;
}
TreeNode.prototype = Object.create(Node.prototype);
function treeRoot(root2) {
  var tree = new TreeNode(root2, 0), node, nodes = [tree], child, children2, i2, n2;
  while (node = nodes.pop()) {
    if (children2 = node._.children) {
      node.children = new Array(n2 = children2.length);
      for (i2 = n2 - 1; i2 >= 0; --i2) {
        nodes.push(child = node.children[i2] = new TreeNode(children2[i2], i2));
        child.parent = node;
      }
    }
  }
  (tree.parent = new TreeNode(null, 0)).children = [tree];
  return tree;
}
function tree_default() {
  var separation = defaultSeparation, dx = 1, dy = 1, nodeSize = null;
  function tree(root2) {
    var t2 = treeRoot(root2);
    t2.eachAfter(firstWalk), t2.parent.m = -t2.z;
    t2.eachBefore(secondWalk);
    if (nodeSize)
      root2.eachBefore(sizeNode);
    else {
      var left = root2, right = root2, bottom = root2;
      root2.eachBefore(function(node) {
        if (node.x < left.x)
          left = node;
        if (node.x > right.x)
          right = node;
        if (node.depth > bottom.depth)
          bottom = node;
      });
      var s2 = left === right ? 1 : separation(left, right) / 2, tx = s2 - left.x, kx = dx / (right.x + s2 + tx), ky = dy / (bottom.depth || 1);
      root2.eachBefore(function(node) {
        node.x = (node.x + tx) * kx;
        node.y = node.depth * ky;
      });
    }
    return root2;
  }
  function firstWalk(v2) {
    var children2 = v2.children, siblings = v2.parent.children, w2 = v2.i ? siblings[v2.i - 1] : null;
    if (children2) {
      executeShifts(v2);
      var midpoint = (children2[0].z + children2[children2.length - 1].z) / 2;
      if (w2) {
        v2.z = w2.z + separation(v2._, w2._);
        v2.m = v2.z - midpoint;
      } else {
        v2.z = midpoint;
      }
    } else if (w2) {
      v2.z = w2.z + separation(v2._, w2._);
    }
    v2.parent.A = apportion(v2, w2, v2.parent.A || siblings[0]);
  }
  function secondWalk(v2) {
    v2._.x = v2.z + v2.parent.m;
    v2.m += v2.parent.m;
  }
  function apportion(v2, w2, ancestor) {
    if (w2) {
      var vip = v2, vop = v2, vim = w2, vom = vip.parent.children[0], sip = vip.m, sop = vop.m, sim = vim.m, som = vom.m, shift;
      while (vim = nextRight(vim), vip = nextLeft(vip), vim && vip) {
        vom = nextLeft(vom);
        vop = nextRight(vop);
        vop.a = v2;
        shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
        if (shift > 0) {
          moveSubtree(nextAncestor(vim, v2, ancestor), v2, shift);
          sip += shift;
          sop += shift;
        }
        sim += vim.m;
        sip += vip.m;
        som += vom.m;
        sop += vop.m;
      }
      if (vim && !nextRight(vop)) {
        vop.t = vim;
        vop.m += sim - sop;
      }
      if (vip && !nextLeft(vom)) {
        vom.t = vip;
        vom.m += sip - som;
        ancestor = v2;
      }
    }
    return ancestor;
  }
  function sizeNode(node) {
    node.x *= dx;
    node.y = node.depth * dy;
  }
  tree.separation = function(x2) {
    return arguments.length ? (separation = x2, tree) : separation;
  };
  tree.size = function(x2) {
    return arguments.length ? (nodeSize = false, dx = +x2[0], dy = +x2[1], tree) : nodeSize ? null : [dx, dy];
  };
  tree.nodeSize = function(x2) {
    return arguments.length ? (nodeSize = true, dx = +x2[0], dy = +x2[1], tree) : nodeSize ? [dx, dy] : null;
  };
  return tree;
}

// ../home/ubuntu/.cache/deno/deno_esbuild/d3-zoom@3.0.0/node_modules/d3-zoom/src/transform.js
function Transform(k2, x2, y2) {
  this.k = k2;
  this.x = x2;
  this.y = y2;
}
Transform.prototype = {
  constructor: Transform,
  scale: function(k2) {
    return k2 === 1 ? this : new Transform(this.k * k2, this.x, this.y);
  },
  translate: function(x2, y2) {
    return x2 === 0 & y2 === 0 ? this : new Transform(this.k, this.x + this.k * x2, this.y + this.k * y2);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x2) {
    return x2 * this.k + this.x;
  },
  applyY: function(y2) {
    return y2 * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x2) {
    return (x2 - this.x) / this.k;
  },
  invertY: function(y2) {
    return (y2 - this.y) / this.k;
  },
  rescaleX: function(x2) {
    return x2.copy().domain(x2.range().map(this.invertX, this).map(x2.invert, x2));
  },
  rescaleY: function(y2) {
    return y2.copy().domain(y2.range().map(this.invertY, this).map(y2.invert, y2));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};
var identity2 = new Transform(1, 0, 0);
transform.prototype = Transform.prototype;
function transform(node) {
  while (!node.__zoom)
    if (!(node = node.parentNode))
      return identity2;
  return node.__zoom;
}

// examples/taaat-app/src/tree-view.ts
var DefinitionTreeView = class {
  svg;
  g;
  root;
  options;
  width = 400;
  height = 400;
  constructor(options) {
    this.options = options;
    this.svg = select_default2(options.container).append("svg").attr("class", "definition-tree-svg");
    this.g = this.svg.append("g").attr("transform", "translate(8,12)");
  }
  resize() {
    const rect = this.options.container.getBoundingClientRect();
    this.width = Math.max(200, rect.width - 16);
    this.height = Math.max(200, rect.height - 24);
    this.svg.attr("width", this.width).attr("height", this.height);
    if (this.root)
      this.render();
  }
  setData(tree) {
    if (!tree) {
      this.options.container.querySelector(".tree-empty")?.remove();
      const msg = document.createElement("p");
      msg.className = "tree-empty";
      msg.textContent = "No definition tree (empty or unparsed model).";
      this.options.container.appendChild(msg);
      this.svg.style("display", "none");
      return;
    }
    this.options.container.querySelector(".tree-empty")?.remove();
    this.svg.style("display", null);
    const hierarchy2 = hierarchy(tree, (d2) => d2.children);
    hierarchy2.x0 = 0;
    hierarchy2.y0 = 0;
    this.root = hierarchy2;
    this.root.x0 = this.height / 2;
    this.root.y0 = 0;
    if (this.root.children) {
      this.root.children.forEach((c2) => this.collapse(c2));
    }
    this.resize();
  }
  collapse(d2) {
    if (d2.children) {
      d2._children = d2.children;
      d2._children.forEach((c2) => this.collapse(c2));
      d2.children = void 0;
    }
  }
  click(event, d2) {
    if (d2.children) {
      d2._children = d2.children;
      d2.children = void 0;
    } else if (d2._children) {
      d2.children = d2._children;
      d2._children = void 0;
    }
    this.options.onSelect(d2.data);
    this.render();
    event.stopPropagation();
  }
  render() {
    const duration = 200;
    const treeLayout = tree_default().size([
      this.height - 40,
      this.width - 120
    ]);
    const root2 = this.root;
    treeLayout(root2);
    const nodes = root2.descendants();
    const links = root2.links();
    const node = this.g.selectAll("g.node").data(nodes, (d2) => d2.data.id);
    const nodeEnter = node.enter().append("g").attr("class", (d2) => {
      const classes = ["node"];
      if (d2.data.hasAnnotations)
        classes.push("has-annotations");
      if (d2.data.path === this.options.selectedPath)
        classes.push("selected");
      return classes.join(" ");
    }).attr("transform", (d2) => `translate(${d2.y},${d2.x})`).on("click", (event, d2) => this.click(event, d2));
    nodeEnter.append("circle").attr("r", 4).attr("class", (d2) => d2.data.hasAnnotations ? "annotated" : "");
    nodeEnter.append("text").attr("dy", "0.32em").attr("x", (d2) => d2.children || d2._children ? -8 : 8).attr("text-anchor", (d2) => d2.children || d2._children ? "end" : "start").text((d2) => {
      const suffix = d2.data.annotationKeyCount > 0 ? ` (${d2.data.annotationKeyCount})` : "";
      const short = d2.data.label.length > 36 ? d2.data.label.slice(0, 34) + "\u2026" : d2.data.label;
      return short + suffix;
    });
    const nodeUpdate = nodeEnter.merge(node);
    nodeUpdate.attr("class", (d2) => {
      const classes = ["node"];
      if (d2.data.hasAnnotations)
        classes.push("has-annotations");
      if (d2.data.path === this.options.selectedPath)
        classes.push("selected");
      return classes.join(" ");
    }).transition().duration(duration).attr("transform", (d2) => `translate(${d2.y},${d2.x})`);
    node.exit().remove();
    const link = this.g.selectAll("path.link").data(links, (d2) => d2.target.data.id);
    const linkEnter = link.enter().insert("path", "g").attr("class", "link").attr("d", () => {
      const o2 = { x: root2.x0, y: root2.y0 };
      return this.diagonal(o2, o2);
    });
    linkEnter.merge(link).transition().duration(duration).attr("d", (d2) => this.diagonal(d2.source, d2.target));
    link.exit().remove();
  }
  setSelectedPath(path) {
    this.options.selectedPath = path;
    if (this.root)
      this.render();
  }
  diagonal(s2, d2) {
    return `M ${s2.y} ${s2.x}
      C ${(s2.y + d2.y) / 2} ${s2.x},
        ${(s2.y + d2.y) / 2} ${d2.x},
        ${d2.y} ${d2.x}`;
  }
};

// examples/taaat-app/src/main.ts
var workspace = new ClinicalModelWorkspace();
var activeFilePath;
var activeResource;
var selectedNode;
var palette = loadPalette();
var language = "en";
var treeView;
var $2 = (id2) => document.getElementById(id2);
function getLoadMode() {
  const checked = document.querySelector(
    'input[name="load-mode"]:checked'
  );
  return checked?.value === "archetype" ? "archetype" : "template";
}
function setStatus(msg, isError = false) {
  const el = $2("status-bar");
  if (!el)
    return;
  el.textContent = msg;
  el.classList.toggle("is-error", isError);
}
function listEditableFiles() {
  return workspace.listFiles().filter((f2) => {
    const k2 = f2.loadResult?.kind;
    return k2 === "archetype" || k2 === "template" || k2 === "template_json";
  }).map((f2) => ({
    path: f2.path,
    kind: f2.loadResult?.kind ?? "?"
  }));
}
function refreshFileSelect() {
  const select = $2("file-select");
  if (!select)
    return;
  const files = listEditableFiles();
  select.innerHTML = "";
  for (const f2 of files) {
    const opt = document.createElement("option");
    opt.value = f2.path;
    opt.textContent = `${f2.path} (${f2.kind})`;
    select.appendChild(opt);
  }
  if (activeFilePath && files.some((f2) => f2.path === activeFilePath)) {
    select.value = activeFilePath;
  } else if (files.length) {
    activeFilePath = files[0].path;
    select.value = activeFilePath;
  }
}
function loadActiveResource() {
  activeFilePath = workspace.getActivePath() ?? activeFilePath;
  if (!activeFilePath) {
    activeResource = void 0;
    return;
  }
  const file = workspace.getFile(activeFilePath);
  activeResource = resolveAnnotatedResource(
    workspace.repository,
    file?.loadResult
  );
}
function persistResourceToWorkspace() {
  if (!activeResource || !activeFilePath)
    return;
  const path = activeFilePath.toLowerCase();
  if (/\.(adl|adls)$/i.test(path)) {
    const adl = serializeAnnotatedResource(activeResource);
    workspace.updateFileContent(activeFilePath, adl);
  }
}
function refreshTree() {
  const container = $2("tree-container");
  if (!container)
    return;
  container.innerHTML = "";
  if (!activeResource) {
    container.innerHTML = '<p class="tree-empty">Load a model to see the tree.</p>';
    return;
  }
  const tree = buildDefinitionTree(activeResource);
  treeView = new DefinitionTreeView({
    container,
    selectedPath: selectedNode?.path,
    onSelect: (node) => {
      selectedNode = node;
      treeView?.setSelectedPath(node.path);
      refreshAnnotationEditor();
      updatePathLabel();
    }
  });
  treeView.setData(tree);
  window.requestAnimationFrame(() => treeView?.resize());
}
function updatePathLabel() {
  const el = $2("selected-path");
  if (!el)
    return;
  if (!selectedNode) {
    el.textContent = "Select a node in the tree";
    return;
  }
  const pathDisplay = selectedNode.path || "(definition root)";
  el.textContent = pathDisplay;
}
function refreshAnnotationEditor() {
  const tbody = $2("annotation-rows");
  if (!tbody)
    return;
  tbody.innerHTML = "";
  if (!activeResource || !selectedNode)
    return;
  const doc = getResourceDocumentation(activeResource);
  const path = selectedNode.path;
  const anns = getPathAnnotations(doc, path, language);
  for (const [key, value] of Object.entries(anns)) {
    tbody.appendChild(createAnnotationRow(key, value));
  }
}
function createAnnotationRow(key, value) {
  const tr2 = document.createElement("tr");
  tr2.innerHTML = `
    <td><input type="text" class="ann-key" value="${escapeAttr(key)}" /></td>
    <td><input type="text" class="ann-value" value="${escapeAttr(value)}" /></td>
    <td><button type="button" class="btn btn-sm btn-danger ann-remove" title="Remove">\xD7</button></td>
  `;
  tr2.querySelector(".ann-remove")?.addEventListener("click", () => {
    if (!activeResource || !selectedNode)
      return;
    const k2 = tr2.querySelector(".ann-key")?.value.trim();
    if (k2) {
      removePathAnnotation(activeResource, selectedNode.path, k2, language);
      persistResourceToWorkspace();
      refreshTree();
      refreshAnnotationEditor();
    }
  });
  const onChange = () => {
    if (!activeResource || !selectedNode)
      return;
    const k2 = tr2.querySelector(".ann-key")?.value.trim();
    const v2 = tr2.querySelector(".ann-value")?.value ?? "";
    if (!k2)
      return;
    setPathAnnotation(activeResource, selectedNode.path, k2, v2, language);
    persistResourceToWorkspace();
    refreshTree();
  };
  tr2.querySelectorAll("input").forEach((inp) => {
    inp.addEventListener("change", onChange);
  });
  return tr2;
}
function escapeAttr(s2) {
  return s2.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function addAnnotationRow(key = "", value = "") {
  const tbody = $2("annotation-rows");
  if (!tbody || !activeResource || !selectedNode)
    return;
  if (key) {
    setPathAnnotation(activeResource, selectedNode.path, key, value, language);
    persistResourceToWorkspace();
  }
  tbody.appendChild(createAnnotationRow(key, value));
  refreshTree();
}
function refreshPaletteUi() {
  const list = $2("palette-list");
  if (!list)
    return;
  list.innerHTML = "";
  for (const entry of palette) {
    const li2 = document.createElement("li");
    const label = entry.value ? `${entry.key} = ${entry.value}` : entry.key;
    li2.innerHTML = `
      <button type="button" class="palette-apply" title="Apply to selected node">${escapeAttr(label)}</button>
      <button type="button" class="palette-remove" title="Remove from favourites">\xD7</button>
    `;
    li2.querySelector(".palette-apply")?.addEventListener("click", () => {
      if (!activeResource || !selectedNode) {
        alert("Select a tree node first.");
        return;
      }
      setPathAnnotation(
        activeResource,
        selectedNode.path,
        entry.key,
        entry.value ?? "",
        language
      );
      persistResourceToWorkspace();
      refreshTree();
      refreshAnnotationEditor();
    });
    li2.querySelector(".palette-remove")?.addEventListener("click", () => {
      palette = palette.filter((p2) => p2.key !== entry.key);
      savePalette(palette);
      refreshPaletteUi();
    });
    list.appendChild(li2);
  }
}
function setupLoadBar() {
  const loadBtn = $2("load-github-btn");
  const urlInput = $2("github-url");
  if (!loadBtn || !urlInput)
    return;
  const templateDefault = "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/MultiDiciplinery_Tumor_meetings/local/Diagnostic_MDT_Lung_cancer.t.json";
  const archetypeDefault = "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/main/local/archetypes/composition/openEHR-EHR-COMPOSITION.review.v0.adl";
  const updatePlaceholder = () => {
    const mode = getLoadMode();
    urlInput.placeholder = mode === "template" ? "GitHub URL to a .t.json template\u2026" : "GitHub URL to an .adl / .adls archetype\u2026";
    if (!urlInput.value.trim()) {
      urlInput.value = mode === "template" ? templateDefault : archetypeDefault;
    }
  };
  document.querySelectorAll('input[name="load-mode"]').forEach((el) => {
    el.addEventListener("change", updatePlaceholder);
  });
  updatePlaceholder();
  loadBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) {
      alert("Paste a GitHub blob or raw URL.");
      return;
    }
    loadBtn.setAttribute("disabled", "true");
    setStatus("Loading\u2026");
    try {
      workspace.clear();
      const result = await workspace.loadFromGitHubClinicalModelUrl(url, {
        maxFiles: 200,
        onProgress: (e2) => setStatus(e2.message)
      });
      const mode = getLoadMode();
      const files = listEditableFiles();
      if (mode === "template") {
        activeFilePath = result.rootPath;
      } else {
        const arch = files.find((f2) => f2.kind === "archetype");
        activeFilePath = arch?.path ?? result.rootPath;
      }
      refreshFileSelect();
      if (activeFilePath) {
        const sel = $2("file-select");
        if (sel)
          sel.value = activeFilePath;
      }
      loadActiveResource();
      selectedNode = void 0;
      refreshTree();
      refreshAnnotationEditor();
      updatePathLabel();
      const warn = result.warnings.length ? ` (${result.warnings.length} warnings)` : "";
      setStatus(`Loaded ${result.fetched} files${warn}`);
    } catch (e2) {
      setStatus(e2.message, true);
      alert(`Load failed: ${e2.message}`);
    } finally {
      loadBtn.removeAttribute("disabled");
    }
  });
}
function setupFileSelect() {
  $2("file-select")?.addEventListener("change", (e2) => {
    activeFilePath = e2.target.value;
    loadActiveResource();
    selectedNode = void 0;
    refreshTree();
    refreshAnnotationEditor();
    updatePathLabel();
    setStatus(`Editing ${activeFilePath}`);
  });
}
function setupAnnotationActions() {
  $2("add-annotation-btn")?.addEventListener("click", () => addAnnotationRow());
  $2("language-select")?.addEventListener("change", (e2) => {
    language = e2.target.value;
    refreshAnnotationEditor();
  });
  $2("download-adl-btn")?.addEventListener("click", () => {
    if (!activeResource || !activeFilePath)
      return;
    const text = serializeAnnotatedResource(activeResource);
    downloadText(text, activeFilePath.replace(/\.[^.]+$/, "") + ".adl");
  });
}
function setupPaletteActions() {
  $2("palette-add-btn")?.addEventListener("click", () => {
    const key = $2("palette-key")?.value.trim();
    const value = $2("palette-value")?.value.trim();
    if (!key) {
      alert("Enter an annotation key.");
      return;
    }
    if (!palette.some((p2) => p2.key === key)) {
      palette.push({ key, value: value || void 0 });
      savePalette(palette);
      refreshPaletteUi();
    }
    const keyInp = $2("palette-key");
    const valInp = $2("palette-value");
    if (keyInp)
      keyInp.value = "";
    if (valInp)
      valInp.value = "";
  });
  $2("palette-download-btn")?.addEventListener("click", () => {
    downloadText(exportPaletteJson(palette), "taaat-palette.json");
  });
  $2("palette-upload-input")?.addEventListener("change", async (e2) => {
    const file = e2.target.files?.[0];
    if (!file)
      return;
    try {
      palette = parsePaletteJson(await file.text());
      savePalette(palette);
      refreshPaletteUi();
      setStatus("Palette imported");
    } catch (err) {
      alert(`Invalid palette file: ${err.message}`);
    }
    e2.target.value = "";
  });
}
function downloadText(content, filename) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const a2 = document.createElement("a");
  a2.href = URL.createObjectURL(blob);
  a2.download = filename;
  a2.click();
  URL.revokeObjectURL(a2.href);
}
function setupResize() {
  window.addEventListener("resize", () => treeView?.resize());
}
function reloadUi() {
  loadActiveResource();
  refreshFileSelect();
  refreshTree();
  refreshAnnotationEditor();
  updatePathLabel();
}
function setupLocalFiles() {
  const input = $2("local-files");
  if (!input)
    return;
  input.addEventListener("change", async () => {
    const files = input.files;
    if (!files?.length)
      return;
    workspace.clear();
    for (const file of files) {
      workspace.addFile(file.name, await file.text());
    }
    const editable = listEditableFiles();
    activeFilePath = editable[0]?.path;
    refreshFileSelect();
    reloadUi();
    setStatus(`Loaded ${files.length} local file(s)`);
    input.value = "";
  });
}
function initApp() {
  setupLoadBar();
  setupFileSelect();
  setupAnnotationActions();
  setupPaletteActions();
  setupLocalFiles();
  setupResize();
  refreshPaletteUi();
  updatePathLabel();
  setStatus("Paste a GitHub URL or choose local .adl / .t.json files.");
}
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
  globalThis.__TAAAT__ = {
    workspace,
    reloadUi,
    getActiveResource: () => activeResource,
    getSelectedNode: () => selectedNode
  };
}
export {
  initApp,
  reloadUi
};
