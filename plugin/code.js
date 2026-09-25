"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/@noble/hashes/utils.js
  function isBytes(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
  }
  var atitle = (title) => title ? `"${title}" ` : "";
  function anumber(n, title = "") {
    if (typeof n !== "number")
      throw new TypeError(atitle(title) + "expected number, got " + typeof n);
    if (!Number.isSafeInteger(n) || n < 0)
      throw new RangeError(atitle(title) + "expected integer >= 0, got " + n);
    return n;
  }
  function abytes(value, length2, title = "") {
    if (isBytes(value) && (length2 === void 0 || value.length === length2))
      return value;
    if (length2 !== void 0)
      anumber(length2, "length");
    const bytes = isBytes(value);
    const ofLen = length2 !== void 0 ? ` of length ${length2}` : "";
    const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
    const message = atitle(title) + "expected Uint8Array" + ofLen + ", got " + got;
    if (!bytes)
      throw new TypeError(message);
    throw new RangeError(message);
  }
  var aobject = (value, label) => {
    if (value === null || typeof value !== "object" || Array.isArray(value))
      throw new TypeError((label === "object" ? "" : `"${label}" `) + "expected object, got type=" + typeof value);
  };
  var aopts = (value, label) => {
    aobject(value, label);
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null)
      throw new TypeError(`"${label}" expected plain object`);
    if (Object.hasOwn(value, "__proto__"))
      throw new TypeError(`"${label}.__proto__" is not allowed`);
  };
  function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("hash was destroyed");
    if (checkFinished && instance.finished)
      throw new Error("digest() was already called");
  }
  function aoutput(out, instance) {
    abytes(out, void 0, "output");
    const min = instance.outputLen;
    if (!(out.length >= min)) {
      throw new RangeError('"output" expected length >= ' + min);
    }
  }
  function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  }
  function rotr(word, shift) {
    return word << 32 - shift | word >>> shift;
  }
  function checkOpts(defaults, opts, title = "opts") {
    aopts(defaults, "defaults");
    if (opts !== void 0)
      aopts(opts, title);
    const merged = Object.assign(/* @__PURE__ */ Object.create(null), defaults, opts);
    return merged;
  }
  function createHasher(hashCons, info = {}) {
    if (typeof hashCons !== "function")
      throw new TypeError('"hashCons" expected function, got type=' + typeof hashCons);
    info = checkOpts({}, info, "info");
    const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
    const tmp = hashCons(void 0);
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.canXOF = tmp.canXOF;
    hashC.create = (opts) => hashCons(opts);
    Object.assign(hashC, info);
    return Object.freeze(hashC);
  }
  var oidNist = (suffix) => ({
    // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
    // Larger suffix values would need base-128 OID encoding and a different length byte.
    oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
  });

  // node_modules/@noble/hashes/_u64.js
  var fromNumH = (n) => n / 2 ** 32 | 0;
  var fromNumL = (n) => n >>> 0;
  function setU64FromNum(view, byteOffset, n, isLE) {
    const h = fromNumH(n);
    const l = fromNumL(n);
    view.setUint32(byteOffset, isLE ? l : h, isLE);
    view.setUint32(byteOffset + 4, isLE ? h : l, isLE);
  }

  // node_modules/@noble/hashes/_md.js
  function Chi(a, b, c) {
    return a & b ^ ~a & c;
  }
  function Maj(a, b, c) {
    return a & b ^ a & c ^ b & c;
  }
  var HashMD = class {
    constructor(blockLen, outputLen, padOffset, isLE) {
      __publicField(this, "blockLen");
      __publicField(this, "outputLen");
      __publicField(this, "canXOF", false);
      __publicField(this, "padOffset");
      __publicField(this, "isLE");
      // For partial updates less than block size
      __publicField(this, "buffer");
      __publicField(this, "view");
      __publicField(this, "finished", false);
      __publicField(this, "length", 0);
      __publicField(this, "pos", 0);
      __publicField(this, "destroyed", false);
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE;
      this.buffer = new Uint8Array(blockLen);
      this.view = createView(this.buffer);
    }
    update(data) {
      aexists(this);
      abytes(data);
      const { view, buffer, blockLen } = this;
      const len = data.length;
      let processed = false;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView = createView(data);
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(dataView, pos);
          processed = true;
          continue;
        }
        buffer.set(pos === 0 && take === len ? data : data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(view, 0);
          this.pos = 0;
          processed = true;
        }
      }
      this.length += data.length;
      if (processed)
        this.roundClean();
      return this;
    }
    digestInto(out) {
      aexists(this);
      aoutput(out, this);
      this.finished = true;
      const { buffer, view, blockLen, isLE } = this;
      let { pos } = this;
      buffer[pos++] = 128;
      buffer.fill(0, pos);
      if (this.padOffset > blockLen - pos) {
        this.process(view, 0);
        buffer.fill(0);
      }
      setU64FromNum(view, blockLen - 8, this.length * 8, isLE);
      this.process(view, 0);
      this.roundClean();
      const oview = out === buffer ? view : createView(out);
      const len = this.outputLen;
      const outLen = len / 4;
      const state = this.get();
      if (len % 4 || outLen > state.length)
        throw new Error("invalid outputLen");
      for (let i = 0; i < outLen; i++)
        oview.setUint32(4 * i, state[i], isLE);
    }
    digest() {
      const { buffer, outputLen } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
    _cloneIntoMeta(to) {
      const { buffer, length: length2, finished, destroyed, pos } = this;
      to.destroyed = destroyed;
      to.finished = finished;
      to.length = length2;
      to.pos = pos;
      if (pos)
        to.buffer.set(buffer);
      return to;
    }
    clone() {
      return this._cloneInto();
    }
  };
  var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);

  // node_modules/@noble/hashes/sha2.js
  var SHA256_K = /* @__PURE__ */ Uint32Array.from([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
  var SHA2_32B = class extends HashMD {
    constructor(outputLen, IV) {
      super(64, outputLen, 8, false);
      // We cannot use array here since array allows indexing by variable
      // which means optimizer/compiler cannot use registers.
      // Numeric initializers matter: starting the fields as `undefined` changes
      // V8's field representation and makes sha256 3x slower (measured).
      __publicField(this, "A", 0);
      __publicField(this, "B", 0);
      __publicField(this, "C", 0);
      __publicField(this, "D", 0);
      __publicField(this, "E", 0);
      __publicField(this, "F", 0);
      __publicField(this, "G", 0);
      __publicField(this, "H", 0);
      this.A = IV[0] | 0;
      this.B = IV[1] | 0;
      this.C = IV[2] | 0;
      this.D = IV[3] | 0;
      this.E = IV[4] | 0;
      this.F = IV[5] | 0;
      this.G = IV[6] | 0;
      this.H = IV[7] | 0;
    }
    get() {
      const { A, B, C, D, E, F, G, H } = this;
      return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
      this.A = A | 0;
      this.B = B | 0;
      this.C = C | 0;
      this.D = D | 0;
      this.E = E | 0;
      this.F = F | 0;
      this.G = G | 0;
      this.H = H | 0;
    }
    _cloneInto(to) {
      (to || (to = new this.constructor())).set(...this.get());
      return this._cloneIntoMeta(to);
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        SHA256_W[i] = view.getUint32(offset, false);
      for (let i = 16; i < 64; i++) {
        const W15 = SHA256_W[i - 15];
        const W2 = SHA256_W[i - 2];
        const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
        const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
        SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
      }
      let { A, B, C, D, E, F, G, H } = this;
      for (let i = 0; i < 64; i++) {
        const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
        const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
        const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
        const T2 = sigma0 + Maj(A, B, C) | 0;
        H = G;
        G = F;
        F = E;
        E = D + T1 | 0;
        D = C;
        C = B;
        B = A;
        A = T1 + T2 | 0;
      }
      A = A + this.A | 0;
      B = B + this.B | 0;
      C = C + this.C | 0;
      D = D + this.D | 0;
      E = E + this.E | 0;
      F = F + this.F | 0;
      G = G + this.G | 0;
      H = H + this.H | 0;
      this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
      clean(SHA256_W);
    }
    destroy() {
      this.destroyed = true;
      this.set(0, 0, 0, 0, 0, 0, 0, 0);
      clean(this.buffer);
    }
  };
  var _SHA256 = class extends SHA2_32B {
    constructor() {
      super(32, SHA256_IV);
    }
  };
  var sha256 = /* @__PURE__ */ createHasher(
    () => new _SHA256(),
    /* @__PURE__ */ oidNist(1)
  );

  // node_modules/valibot/dist/index.mjs
  var store$4;
  var DEFAULT_CONFIG = {
    lang: void 0,
    message: void 0,
    abortEarly: void 0,
    abortPipeEarly: void 0
  };
  // @__NO_SIDE_EFFECTS__
  function getGlobalConfig(config$1) {
    if (!config$1 && !store$4) return DEFAULT_CONFIG;
    return {
      lang: config$1?.lang ?? store$4?.lang,
      message: config$1?.message,
      abortEarly: config$1?.abortEarly ?? store$4?.abortEarly,
      abortPipeEarly: config$1?.abortPipeEarly ?? store$4?.abortPipeEarly
    };
  }
  var store$3;
  // @__NO_SIDE_EFFECTS__
  function getGlobalMessage(lang) {
    return store$3?.get(lang);
  }
  var store$2;
  // @__NO_SIDE_EFFECTS__
  function getSchemaMessage(lang) {
    return store$2?.get(lang);
  }
  var store$1;
  // @__NO_SIDE_EFFECTS__
  function getSpecificMessage(reference, lang) {
    return store$1?.get(reference)?.get(lang);
  }
  // @__NO_SIDE_EFFECTS__
  function _stringify(input) {
    const type = typeof input;
    if (type === "string") return `"${input}"`;
    if (type === "number" || type === "bigint" || type === "boolean") return `${input}`;
    if (type === "object" || type === "function") return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
    return type;
  }
  function _addIssue(context, label, dataset, config$1, other) {
    const input = other && "input" in other ? other.input : dataset.value;
    const expected = other?.expected ?? context.expects ?? null;
    const received = other?.received ?? /* @__PURE__ */ _stringify(input);
    const issue = {
      kind: context.kind,
      type: context.type,
      input,
      expected,
      received,
      message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
      requirement: context.requirement,
      path: other?.path,
      issues: other?.issues,
      lang: config$1.lang,
      abortEarly: config$1.abortEarly,
      abortPipeEarly: config$1.abortPipeEarly
    };
    const isSchema = context.kind === "schema";
    const message$1 = other?.message ?? context.message ?? /* @__PURE__ */ getSpecificMessage(context.reference, issue.lang) ?? (isSchema ? /* @__PURE__ */ getSchemaMessage(issue.lang) : null) ?? config$1.message ?? /* @__PURE__ */ getGlobalMessage(issue.lang);
    if (message$1 !== void 0) issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
    if (isSchema) dataset.typed = false;
    if (dataset.issues) dataset.issues.push(issue);
    else dataset.issues = [issue];
  }
  // @__NO_SIDE_EFFECTS__
  function _isSameValueZero(value1, value2) {
    return value1 === value2 || Number.isNaN(value1) && Number.isNaN(value2);
  }
  // @__NO_SIDE_EFFECTS__
  function _isValidObjectKey(object$1, key) {
    return Object.prototype.hasOwnProperty.call(object$1, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
  }
  // @__NO_SIDE_EFFECTS__
  function _joinExpects(values$1, separator) {
    const list = [...new Set(values$1)];
    if (list.length > 1) return `(${list.join(` ${separator} `)})`;
    return list[0] ?? "never";
  }
  function _standardSchema(schema) {
    schema["~standard"] = {
      version: 1,
      vendor: "valibot",
      validate: (value$1) => schema["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig())
    };
    return schema;
  }
  var UUID_REGEX = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/iu;
  // @__NO_SIDE_EFFECTS__
  function check(requirement, message$1) {
    return {
      kind: "validation",
      type: "check",
      reference: check,
      async: false,
      expects: null,
      requirement,
      message: message$1,
      "~run"(dataset, config$1) {
        if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "input", dataset, config$1);
        return dataset;
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function description(description_) {
    return {
      kind: "metadata",
      type: "description",
      reference: description,
      description: description_
    };
  }
  // @__NO_SIDE_EFFECTS__
  function finite(message$1) {
    return {
      kind: "validation",
      type: "finite",
      reference: finite,
      async: false,
      expects: null,
      requirement: Number.isFinite,
      message: message$1,
      "~run"(dataset, config$1) {
        if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "finite", dataset, config$1);
        return dataset;
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function integer(message$1) {
    return {
      kind: "validation",
      type: "integer",
      reference: integer,
      async: false,
      expects: null,
      requirement: Number.isInteger,
      message: message$1,
      "~run"(dataset, config$1) {
        if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "integer", dataset, config$1);
        return dataset;
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function length(requirement, message$1) {
    return {
      kind: "validation",
      type: "length",
      reference: length,
      async: false,
      expects: `${requirement}`,
      requirement,
      message: message$1,
      "~run"(dataset, config$1) {
        if (dataset.typed && dataset.value.length !== this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
        return dataset;
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function maxLength(requirement, message$1) {
    return {
      kind: "validation",
      type: "max_length",
      reference: maxLength,
      async: false,
      expects: `<=${requirement}`,
      requirement,
      message: message$1,
      "~run"(dataset, config$1) {
        if (dataset.typed && dataset.value.length > this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
        return dataset;
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function maxValue(requirement, message$1) {
    return {
      kind: "validation",
      type: "max_value",
      reference: maxValue,
      async: false,
      expects: `<=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
      requirement,
      message: message$1,
      "~run"(dataset, config$1) {
        if (dataset.typed && !(dataset.value <= this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
        return dataset;
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function minLength(requirement, message$1) {
    return {
      kind: "validation",
      type: "min_length",
      reference: minLength,
      async: false,
      expects: `>=${requirement}`,
      requirement,
      message: message$1,
      "~run"(dataset, config$1) {
        if (dataset.typed && dataset.value.length < this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
        return dataset;
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function minValue(requirement, message$1) {
    return {
      kind: "validation",
      type: "min_value",
      reference: minValue,
      async: false,
      expects: `>=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
      requirement,
      message: message$1,
      "~run"(dataset, config$1) {
        if (dataset.typed && !(dataset.value >= this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
        return dataset;
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function regex(requirement, message$1) {
    return {
      kind: "validation",
      type: "regex",
      reference: regex,
      async: false,
      expects: `${requirement}`,
      requirement,
      message: message$1,
      "~run"(dataset, config$1) {
        if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "format", dataset, config$1);
        return dataset;
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function uuid(message$1) {
    return {
      kind: "validation",
      type: "uuid",
      reference: uuid,
      async: false,
      expects: null,
      requirement: UUID_REGEX,
      message: message$1,
      "~run"(dataset, config$1) {
        if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "UUID", dataset, config$1);
        return dataset;
      }
    };
  }
  var ABORT_EARLY_CONFIG = { abortEarly: true };
  // @__NO_SIDE_EFFECTS__
  function getFallback(schema, dataset, config$1) {
    return typeof schema.fallback === "function" ? schema.fallback(dataset, config$1) : schema.fallback;
  }
  // @__NO_SIDE_EFFECTS__
  function getDefault(schema, dataset, config$1) {
    return typeof schema.default === "function" ? schema.default(dataset, config$1) : schema.default;
  }
  // @__NO_SIDE_EFFECTS__
  function array(item, message$1) {
    return _standardSchema({
      kind: "schema",
      type: "array",
      reference: array,
      expects: "Array",
      async: false,
      item,
      message: message$1,
      "~run"(dataset, config$1) {
        const input = dataset.value;
        if (Array.isArray(input)) {
          dataset.typed = true;
          dataset.value = [];
          for (let key = 0; key < input.length; key++) {
            const value$1 = input[key];
            const itemDataset = this.item["~run"]({ value: value$1 }, config$1);
            if (itemDataset.issues) {
              const pathItem = {
                type: "array",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of itemDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = itemDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!itemDataset.typed) dataset.typed = false;
            dataset.value.push(itemDataset.value);
          }
        } else _addIssue(this, "type", dataset, config$1);
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function boolean(message$1) {
    return _standardSchema({
      kind: "schema",
      type: "boolean",
      reference: boolean,
      expects: "boolean",
      async: false,
      message: message$1,
      "~run"(dataset, config$1) {
        if (typeof dataset.value === "boolean") dataset.typed = true;
        else _addIssue(this, "type", dataset, config$1);
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function literal(literal_, message$1) {
    return _standardSchema({
      kind: "schema",
      type: "literal",
      reference: literal,
      expects: /* @__PURE__ */ _stringify(literal_),
      async: false,
      literal: literal_,
      message: message$1,
      "~run"(dataset, config$1) {
        if (/* @__PURE__ */ _isSameValueZero(dataset.value, this.literal)) dataset.typed = true;
        else _addIssue(this, "type", dataset, config$1);
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function nullable(wrapped, default_) {
    return _standardSchema({
      kind: "schema",
      type: "nullable",
      reference: nullable,
      expects: `(${wrapped.expects} | null)`,
      async: false,
      wrapped,
      default: default_,
      "~run"(dataset, config$1) {
        if (dataset.value === null) {
          if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
          if (dataset.value === null) {
            dataset.typed = true;
            return dataset;
          }
        }
        return this.wrapped["~run"](dataset, config$1);
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function number(message$1) {
    return _standardSchema({
      kind: "schema",
      type: "number",
      reference: number,
      expects: "number",
      async: false,
      message: message$1,
      "~run"(dataset, config$1) {
        if (typeof dataset.value === "number" && !isNaN(dataset.value)) dataset.typed = true;
        else _addIssue(this, "type", dataset, config$1);
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function optional(wrapped, default_) {
    return _standardSchema({
      kind: "schema",
      type: "optional",
      reference: optional,
      expects: `(${wrapped.expects} | undefined)`,
      async: false,
      wrapped,
      default: default_,
      "~run"(dataset, config$1) {
        if (dataset.value === void 0) {
          if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
          if (dataset.value === void 0) {
            dataset.typed = true;
            return dataset;
          }
        }
        return this.wrapped["~run"](dataset, config$1);
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function picklist(options, message$1) {
    return _standardSchema({
      kind: "schema",
      type: "picklist",
      reference: picklist,
      expects: /* @__PURE__ */ _joinExpects(options.map(_stringify), "|"),
      async: false,
      options,
      message: message$1,
      "~run"(dataset, config$1) {
        if (this.options.includes(dataset.value)) dataset.typed = true;
        else _addIssue(this, "type", dataset, config$1);
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function record(key, value$1, message$1) {
    return _standardSchema({
      kind: "schema",
      type: "record",
      reference: record,
      expects: "Object",
      async: false,
      key,
      value: value$1,
      message: message$1,
      "~run"(dataset, config$1) {
        const input = dataset.value;
        if (input && typeof input === "object") {
          dataset.typed = true;
          dataset.value = {};
          for (const entryKey in input) if (/* @__PURE__ */ _isValidObjectKey(input, entryKey)) {
            const entryValue = input[entryKey];
            const keyDataset = this.key["~run"]({ value: entryKey }, config$1);
            if (keyDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "key",
                input,
                key: entryKey,
                value: entryValue
              };
              for (const issue of keyDataset.issues) {
                issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = keyDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            const valueDataset = this.value["~run"]({ value: entryValue }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key: entryKey,
                value: entryValue
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;
            if (keyDataset.typed) dataset.value[keyDataset.value] = valueDataset.value;
          }
        } else _addIssue(this, "type", dataset, config$1);
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function strictObject(entries$1, message$1) {
    return _standardSchema({
      kind: "schema",
      type: "strict_object",
      reference: strictObject,
      expects: "Object",
      async: false,
      entries: entries$1,
      message: message$1,
      "~run"(dataset, config$1) {
        const input = dataset.value;
        if (input && typeof input === "object") {
          dataset.typed = true;
          dataset.value = {};
          for (const key in this.entries) {
            const valueSchema2 = this.entries[key];
            if (key in input || (valueSchema2.type === "exact_optional" || valueSchema2.type === "optional" || valueSchema2.type === "nullish") && valueSchema2.default !== void 0) {
              const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema2);
              const valueDataset = valueSchema2["~run"]({ value: value$1 }, config$1);
              if (valueDataset.issues) {
                const pathItem = {
                  type: "object",
                  origin: "value",
                  input,
                  key,
                  value: value$1
                };
                for (const issue of valueDataset.issues) {
                  if (issue.path) issue.path.unshift(pathItem);
                  else issue.path = [pathItem];
                  dataset.issues?.push(issue);
                }
                if (!dataset.issues) dataset.issues = valueDataset.issues;
                if (config$1.abortEarly) {
                  dataset.typed = false;
                  break;
                }
              }
              if (!valueDataset.typed) dataset.typed = false;
              dataset.value[key] = valueDataset.value;
            } else if (valueSchema2.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema2);
            else if (valueSchema2.type !== "exact_optional" && valueSchema2.type !== "optional" && valueSchema2.type !== "nullish") {
              _addIssue(this, "key", dataset, config$1, {
                input: void 0,
                expected: `"${key}"`,
                path: [{
                  type: "object",
                  origin: "key",
                  input,
                  key,
                  value: input[key]
                }]
              });
              if (config$1.abortEarly) break;
            }
          }
          if (!dataset.issues || !config$1.abortEarly) {
            for (const key in input) if (!Object.prototype.hasOwnProperty.call(this.entries, key)) {
              _addIssue(this, "key", dataset, config$1, {
                input: key,
                expected: "never",
                path: [{
                  type: "object",
                  origin: "key",
                  input,
                  key,
                  value: input[key]
                }]
              });
              break;
            }
          }
        } else _addIssue(this, "type", dataset, config$1);
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function string(message$1) {
    return _standardSchema({
      kind: "schema",
      type: "string",
      reference: string,
      expects: "string",
      async: false,
      message: message$1,
      "~run"(dataset, config$1) {
        if (typeof dataset.value === "string") dataset.typed = true;
        else _addIssue(this, "type", dataset, config$1);
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function _subIssues(datasets) {
    let issues;
    if (datasets) for (const dataset of datasets) if (issues) for (const issue of dataset.issues) issues.push(issue);
    else issues = dataset.issues;
    return issues;
  }
  // @__NO_SIDE_EFFECTS__
  function union(options, message$1) {
    return _standardSchema({
      kind: "schema",
      type: "union",
      reference: union,
      expects: /* @__PURE__ */ _joinExpects(options.map((option) => option.expects), "|"),
      async: false,
      options,
      message: message$1,
      "~run"(dataset, config$1) {
        let validDataset;
        let typedDatasets;
        let untypedDatasets;
        for (const schema of this.options) {
          const optionDataset = schema["~run"]({ value: dataset.value }, config$1);
          if (optionDataset.typed) if (optionDataset.issues) if (typedDatasets) typedDatasets.push(optionDataset);
          else typedDatasets = [optionDataset];
          else {
            validDataset = optionDataset;
            break;
          }
          else if (untypedDatasets) untypedDatasets.push(optionDataset);
          else untypedDatasets = [optionDataset];
        }
        if (validDataset) return validDataset;
        if (typedDatasets) {
          if (typedDatasets.length === 1) return typedDatasets[0];
          _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(typedDatasets) });
          dataset.typed = true;
        } else if (untypedDatasets?.length === 1) return untypedDatasets[0];
        else _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(untypedDatasets) });
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function unknown() {
    return _standardSchema({
      kind: "schema",
      type: "unknown",
      reference: unknown,
      expects: "unknown",
      async: false,
      "~run"(dataset) {
        dataset.typed = true;
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function variant(key, options, message$1) {
    return _standardSchema({
      kind: "schema",
      type: "variant",
      reference: variant,
      expects: "Object",
      async: false,
      key,
      options,
      message: message$1,
      "~run"(dataset, config$1) {
        const input = dataset.value;
        if (input && typeof input === "object") {
          let outputDataset;
          let maxDiscriminatorPriority = 0;
          let invalidDiscriminatorKey = this.key;
          let expectedDiscriminators = [];
          const parseOptions = (variant$1, allKeys) => {
            for (const schema of variant$1.options) {
              if (schema.type === "variant") parseOptions(schema, new Set(allKeys).add(schema.key));
              else {
                let keysAreValid = true;
                let currentPriority = 0;
                for (const currentKey of allKeys) {
                  const discriminatorSchema = schema.entries[currentKey];
                  if (currentKey in input ? discriminatorSchema["~run"]({
                    typed: false,
                    value: input[currentKey]
                  }, ABORT_EARLY_CONFIG).issues : discriminatorSchema.type !== "exact_optional" && discriminatorSchema.type !== "optional" && discriminatorSchema.type !== "nullish") {
                    keysAreValid = false;
                    if (invalidDiscriminatorKey !== currentKey && (maxDiscriminatorPriority < currentPriority || maxDiscriminatorPriority === currentPriority && currentKey in input && !(invalidDiscriminatorKey in input))) {
                      maxDiscriminatorPriority = currentPriority;
                      invalidDiscriminatorKey = currentKey;
                      expectedDiscriminators = [];
                    }
                    if (invalidDiscriminatorKey === currentKey) expectedDiscriminators.push(schema.entries[currentKey].expects);
                    break;
                  }
                  currentPriority++;
                }
                if (keysAreValid) {
                  const optionDataset = schema["~run"]({ value: input }, config$1);
                  if (!outputDataset || !outputDataset.typed && optionDataset.typed) outputDataset = optionDataset;
                }
              }
              if (outputDataset && !outputDataset.issues) break;
            }
          };
          parseOptions(this, /* @__PURE__ */ new Set([this.key]));
          if (outputDataset) return outputDataset;
          _addIssue(this, "type", dataset, config$1, {
            input: input[invalidDiscriminatorKey],
            expected: /* @__PURE__ */ _joinExpects(expectedDiscriminators, "|"),
            path: [{
              type: "object",
              origin: "value",
              input,
              key: invalidDiscriminatorKey,
              value: input[invalidDiscriminatorKey]
            }]
          });
        } else _addIssue(this, "type", dataset, config$1);
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function pipe(...pipe$1) {
    return _standardSchema({
      ...pipe$1[0],
      pipe: pipe$1,
      "~run"(dataset, config$1) {
        for (const item of pipe$1) if (item.kind !== "metadata") {
          if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
            dataset.typed = false;
            break;
          }
          if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly) dataset = item["~run"](dataset, config$1);
        }
        return dataset;
      }
    });
  }
  // @__NO_SIDE_EFFECTS__
  function safeParse(schema, input, config$1) {
    const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
    return {
      typed: dataset.typed,
      success: !dataset.issues,
      output: dataset.value,
      issues: dataset.issues
    };
  }

  // src/protocol/prototype.ts
  var id = pipe(string(), minLength(1), maxLength(200));
  var realId = pipe(id, regex(/^[^$]/, "Use confirmed node IDs"));
  var index = pipe(number(), integer(), minValue(0), maxValue(999));
  var guarded = { nodeId: realId, expectedFingerprint: id };
  var seconds = pipe(number(), minValue(0), maxValue(10));
  var triggerSeconds = pipe(
    number(),
    minValue(0),
    maxValue(60),
    description(
      "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor"
    )
  );
  var transition = nullable(
    strictObject({
      type: picklist(["DISSOLVE", "SMART_ANIMATE"]),
      duration: seconds,
      easing: strictObject({
        type: picklist([
          "LINEAR",
          "EASE_IN",
          "EASE_OUT",
          "EASE_IN_AND_OUT",
          "EASE_IN_BACK",
          "EASE_OUT_BACK",
          "EASE_IN_AND_OUT_BACK",
          "GENTLE",
          "QUICK",
          "BOUNCY",
          "SLOW"
        ])
      })
    })
  );
  var triggerSchema = variant("type", [
    strictObject({
      type: picklist(["ON_CLICK", "ON_HOVER", "ON_PRESS", "ON_DRAG"])
    }),
    strictObject({ type: literal("AFTER_TIMEOUT"), timeout: triggerSeconds }),
    strictObject({
      type: picklist(["MOUSE_UP", "MOUSE_DOWN"]),
      delay: triggerSeconds
    }),
    strictObject({
      type: picklist(["MOUSE_ENTER", "MOUSE_LEAVE"]),
      delay: triggerSeconds,
      deprecatedVersion: optional(literal(false), false)
    }),
    strictObject({
      type: literal("ON_KEY_DOWN"),
      device: literal("KEYBOARD"),
      keyCodes: pipe(
        array(pipe(number(), integer(), minValue(0), maxValue(255))),
        minLength(1),
        maxLength(4),
        check((keys) => new Set(keys).size === keys.length, "Duplicate keys")
      )
    })
  ]);
  var resolved = picklist(["BOOLEAN", "FLOAT", "STRING", "COLOR"]);
  var channel = pipe(number(), minValue(0), maxValue(1));
  function valueSchema(depth) {
    const literals = [
      strictObject({
        type: literal("BOOLEAN"),
        resolvedType: literal("BOOLEAN"),
        value: boolean()
      }),
      strictObject({
        type: literal("FLOAT"),
        resolvedType: literal("FLOAT"),
        value: pipe(number(), minValue(-1e12), maxValue(1e12))
      }),
      strictObject({
        type: literal("STRING"),
        resolvedType: literal("STRING"),
        value: pipe(string(), maxLength(4096))
      }),
      strictObject({
        type: literal("COLOR"),
        resolvedType: literal("COLOR"),
        value: strictObject({
          r: channel,
          g: channel,
          b: channel,
          a: optional(channel)
        })
      }),
      strictObject({
        type: literal("VARIABLE_ALIAS"),
        resolvedType: resolved,
        value: strictObject({ type: literal("VARIABLE_ALIAS"), id: realId })
      })
    ];
    if (!depth) return union(literals);
    return union([
      ...literals,
      strictObject({
        type: literal("EXPRESSION"),
        resolvedType: resolved,
        value: strictObject({
          expressionFunction: picklist([
            "ADDITION",
            "SUBTRACTION",
            "MULTIPLICATION",
            "DIVISION",
            "EQUALS",
            "NOT_EQUAL",
            "LESS_THAN",
            "LESS_THAN_OR_EQUAL",
            "GREATER_THAN",
            "GREATER_THAN_OR_EQUAL",
            "AND",
            "OR",
            "NEGATE",
            "NOT"
          ]),
          expressionArguments: pipe(
            array(valueSchema(depth - 1)),
            minLength(1),
            maxLength(2)
          )
        })
      })
    ]);
  }
  var prototypeValueSchema = valueSchema(4);
  function actionSchema(depth) {
    const leaves = [
      strictObject({ type: picklist(["BACK", "CLOSE"]) }),
      strictObject({
        type: literal("NODE"),
        destinationId: realId,
        navigation: picklist(["NAVIGATE", "OVERLAY", "CHANGE_TO"]),
        transition,
        resetScrollPosition: optional(boolean(), true),
        resetVideoPosition: optional(boolean(), false)
      }),
      strictObject({
        type: literal("SET_VARIABLE"),
        variableId: realId,
        variableValue: prototypeValueSchema
      }),
      strictObject({
        type: literal("SET_VARIABLE_MODE"),
        variableCollectionId: realId,
        variableModeId: realId
      })
    ];
    if (!depth) return union(leaves);
    return union([
      ...leaves,
      strictObject({
        type: literal("CONDITIONAL"),
        conditionalBlocks: pipe(
          array(
            strictObject({
              condition: optional(prototypeValueSchema),
              actions: pipe(
                array(actionSchema(depth - 1)),
                minLength(1),
                maxLength(16)
              )
            })
          ),
          minLength(1),
          maxLength(8),
          check(
            (blocks) => blocks.every(
              (block, i) => block.condition !== void 0 || i === blocks.length - 1
            ),
            "Else must be last"
          )
        )
      })
    ]);
  }
  var prototypeActionSchema = actionSchema(3);
  function actionCount(actions2) {
    return actions2.reduce(
      (count, action) => count + 1 + (action.type === "CONDITIONAL" ? action.conditionalBlocks.reduce(
        (n, b) => n + actionCount(b.actions),
        0
      ) : 0),
      0
    );
  }
  var reactionSchema = pipe(
    strictObject({
      trigger: triggerSchema,
      actions: pipe(
        array(prototypeActionSchema),
        minLength(1),
        maxLength(16)
      )
    }),
    check(
      (reaction) => actionCount(reaction.actions) <= 64,
      "At most 64 actions per reaction"
    )
  );
  var PROTOTYPE_FEATURES = [
    "advanced_triggers",
    "smart_animate",
    "change_to",
    "multiple_actions",
    "variable_actions",
    "expressions",
    "conditionals"
  ];
  var prototypeOperations = [
    strictObject({
      type: literal("upsert_reaction"),
      ...guarded,
      index: optional(index),
      reaction: reactionSchema
    }),
    strictObject({ type: literal("remove_reaction"), ...guarded, index }),
    strictObject({
      type: literal("upsert_flow_start"),
      ...guarded,
      startNodeId: realId,
      name: pipe(string(), minLength(1), maxLength(200))
    }),
    strictObject({
      type: literal("remove_flow_start"),
      ...guarded,
      startNodeId: realId
    }),
    strictObject({
      type: literal("update_prototype_settings"),
      ...guarded,
      patch: strictObject({
        overflowDirection: picklist(["NONE", "HORIZONTAL", "VERTICAL", "BOTH"])
      })
    })
  ];
  var prototypeOperationSchema = variant("type", prototypeOperations);
  var scenarioSchema = strictObject({
    startNodeId: realId,
    expectedScreenIds: optional(pipe(array(realId), maxLength(100)), []),
    requireExitNodeIds: optional(pipe(array(realId), maxLength(100)), [])
  });
  var prototypeReadEntries = {
    scenario: optional(scenarioSchema),
    sessionId: id,
    pageId: realId,
    nodeIds: pipe(array(realId), minLength(1), maxLength(24)),
    traverseDestinations: optional(boolean(), false),
    maxNodes: optional(
      pipe(number(), integer(), minValue(1), maxValue(500)),
      100
    ),
    maxEdges: optional(
      pipe(number(), integer(), minValue(1), maxValue(1e3)),
      200
    )
  };
  var prototypeReadSchema = strictObject(prototypeReadEntries);
  var prototypePlaybackSchema = strictObject({
    ...prototypeReadEntries,
    startNodeId: realId,
    // A supplied URL is a routing hint, never proof of document identity.
    prototypeUrl: optional(
      pipe(
        string(),
        maxLength(2048),
        regex(
          /^https:\/\/(?:www\.)?figma\.com\/proto\/[A-Za-z0-9]+(?:\/[^\s?#]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?$/
        )
      )
    )
  });
  var PROTOTYPE_OPERATIONS = prototypeOperations.map(
    (schema) => schema.entries.type.literal
  );

  // src/protocol/index.ts
  var VERSION = 3;
  var MAX_MESSAGE = 512 * 1024;
  var MAX_RESULT = 256 * 1024;
  var MAX_OPERATIONS = 500;
  var id2 = pipe(string(), minLength(1), maxLength(200));
  var finite2 = pipe(number(), finite());
  var size = pipe(finite2, minValue(0), maxValue(1e5));
  var text = pipe(string(), maxLength(16384));
  var fontSchema = strictObject({ family: id2, style: id2 });
  var color = strictObject({
    r: pipe(finite2, minValue(0), maxValue(1)),
    g: pipe(finite2, minValue(0), maxValue(1)),
    b: pipe(finite2, minValue(0), maxValue(1))
  });
  var patchSchema = strictObject({
    name: optional(pipe(string(), maxLength(512))),
    x: optional(finite2),
    y: optional(finite2),
    width: optional(size),
    height: optional(size),
    visible: optional(boolean()),
    opacity: optional(pipe(finite2, minValue(0), maxValue(1))),
    cornerRadius: optional(size),
    clipsContent: optional(boolean()),
    layoutMode: optional(picklist(["NONE", "HORIZONTAL", "VERTICAL"])),
    layoutSizingHorizontal: optional(picklist(["FIXED", "HUG", "FILL"])),
    layoutSizingVertical: optional(picklist(["FIXED", "HUG", "FILL"])),
    primaryAxisAlignItems: optional(
      picklist(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"])
    ),
    counterAxisAlignItems: optional(
      picklist(["MIN", "MAX", "CENTER", "BASELINE"])
    ),
    paddingTop: optional(size),
    paddingBottom: optional(size),
    paddingLeft: optional(size),
    paddingRight: optional(size),
    itemSpacing: optional(size),
    fontSize: optional(pipe(size, minValue(1))),
    fills: optional(
      pipe(
        array(
          strictObject({
            type: literal("SOLID"),
            color,
            opacity: optional(pipe(finite2, minValue(0), maxValue(1)))
          })
        ),
        maxLength(8)
      )
    )
  });
  var guarded2 = { nodeId: id2, expectedFingerprint: id2 };
  var operationSchema = variant("type", [
    ...prototypeOperations,
    strictObject({
      type: literal("create"),
      key: pipe(string(), regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)),
      parentId: id2,
      expectedFingerprint: id2,
      kind: picklist(["FRAME", "TEXT", "RECTANGLE", "INSTANCE"]),
      componentId: optional(id2),
      patch: optional(patchSchema),
      characters: optional(text),
      font: optional(fontSchema)
    }),
    strictObject({ type: literal("update"), ...guarded2, patch: patchSchema }),
    strictObject({
      type: literal("instance_properties"),
      ...guarded2,
      properties: record(id2, union([string(), boolean()]))
    }),
    strictObject({
      type: literal("bind_variable"),
      ...guarded2,
      field: picklist([
        "width",
        "height",
        "itemSpacing",
        "paddingTop",
        "paddingBottom",
        "paddingLeft",
        "paddingRight",
        "opacity",
        "cornerRadius",
        "fontSize",
        "fills"
      ]),
      variableId: id2
    }),
    strictObject({
      type: literal("move"),
      ...guarded2,
      parentId: id2,
      parentFingerprint: id2,
      index: pipe(number(), integer(), minValue(0), maxValue(1e4))
    }),
    strictObject({
      type: literal("set_text"),
      ...guarded2,
      characters: text,
      font: optional(fontSchema)
    })
  ]);
  var SUPPORTED_OPERATIONS = operationSchema.options.map(
    (schema) => schema.entries.type.literal
  );
  var tools = {
    read_prototype: {
      description: "Read an explicit page and bounded node/flow graph, including reactions, starts, fingerprints and incomplete/unsupported paths.",
      schema: prototypeReadSchema,
      readOnly: true
    },
    validate_prototype: {
      description: "Statically validate a scoped prototype graph. Valid structure is not proof of playback.",
      schema: prototypeReadSchema,
      readOnly: true
    },
    prepare_prototype_playback: {
      description: "Prepare a prototype flow and candidate interaction checks for the agent browser/desktop controller. Does not open or play Figma; supplied URLs require document confirmation.",
      schema: prototypePlaybackSchema,
      readOnly: true
    },
    sessions: {
      description: "List connected local Figma plugin sessions. Always target an explicit session; file names and foreground tabs are not routing authority.",
      schema: strictObject({}),
      readOnly: true
    },
    selection: {
      description: "Read the current page and selected node IDs in an explicit plugin session.",
      schema: strictObject({ sessionId: id2 }),
      readOnly: true
    },
    read_nodes: {
      description: "Read bounded design data and mutation fingerprints for explicit nodes. Follow omitted child IDs with another scoped read. Never assume an incomplete response is a complete design.",
      schema: strictObject({
        sessionId: id2,
        nodeIds: pipe(array(id2), minLength(1), maxLength(24)),
        depth: optional(
          pipe(number(), integer(), minValue(0), maxValue(8)),
          2
        ),
        maxNodes: optional(
          pipe(number(), integer(), minValue(1), maxValue(500)),
          100
        )
      }),
      readOnly: true
    },
    read_text: {
      description: "Read a bounded text range and styled runs. Continue with nextOffset; expectedTextHash rejects a changed text snapshot.",
      schema: strictObject({
        sessionId: id2,
        nodeId: id2,
        offset: optional(pipe(number(), integer(), minValue(0)), 0),
        length: optional(
          pipe(number(), integer(), minValue(1), maxValue(8192)),
          4096
        ),
        expectedTextHash: optional(id2)
      }),
      readOnly: true
    },
    read_resources: {
      description: "Resolve explicit local variable/collection/style/component IDs; aliases are preserved with bounded continuation IDs. Remote resources are unavailable.",
      schema: strictObject({
        sessionId: id2,
        variableIds: optional(pipe(array(id2), maxLength(50)), []),
        styleIds: optional(pipe(array(id2), maxLength(50)), []),
        componentIds: optional(pipe(array(id2), maxLength(20)), [])
      }),
      readOnly: true
    },
    export: {
      description: "Export an explicit node as PNG/SVG, or original image bytes by imageHash. Saves a bounded artifact locally; no remote URLs.",
      schema: strictObject({
        sessionId: id2,
        nodeId: id2,
        format: picklist(["PNG", "SVG", "IMAGE"]),
        imageHash: optional(id2),
        scale: optional(pipe(number(), minValue(0.1), maxValue(4)), 1)
      }),
      readOnly: true
    },
    design_context: {
      description: "Read a scoped design subtree. The project MCP adapter adds configured framework and source references for an optional target. Resolve resource IDs and export a preview separately.",
      schema: strictObject({
        sessionId: id2,
        nodeId: id2,
        target: optional(id2)
      }),
      readOnly: true
    },
    write_scope: {
      description: "Acquire or release the sole writer lease for an explicit page/frame. Use the returned generation and leaseId for apply. A lease does not lock out human editors.",
      schema: strictObject({
        sessionId: id2,
        rootId: id2,
        action: picklist(["acquire", "release"])
      }),
      readOnly: false
    },
    apply: {
      description: "Preflight or apply supported operations inside a leased root. Use fresh fingerprints from read_nodes. Results can be partial or unknown; never blindly replay a lost write. Reuse operationId only with the identical payload.",
      schema: strictObject({
        sessionId: id2,
        generation: id2,
        leaseId: id2,
        operationId: pipe(string(), uuid()),
        dryRun: optional(boolean(), false),
        operations: pipe(
          array(operationSchema),
          minLength(1),
          maxLength(50)
        )
      }),
      readOnly: false
    },
    cancel_operation: {
      description: "Request cancellation at the next safe operation boundary. Inspect operation_status afterward; native calls may finish first.",
      schema: strictObject({ sessionId: id2, operationId: id2 }),
      readOnly: false
    },
    operation_status: {
      description: "Read a write receipt without replaying the write. Unknown means inspect the canvas before any new operation.",
      schema: strictObject({ sessionId: id2, operationId: id2 }),
      readOnly: true
    }
  };
  var commandSchema = strictObject({
    type: literal("command"),
    version: literal(VERSION),
    requestId: id2,
    method: picklist([
      "read_prototype",
      "validate_prototype",
      "prepare_prototype_playback",
      "selection",
      "read_nodes",
      "scope",
      "apply",
      "operation_status",
      "read_resources",
      "export_begin",
      "export_chunk",
      "export_release",
      "cancel_operation",
      "read_text"
    ]),
    params: record(string(), unknown())
  });
  var replySchema = strictObject({
    type: literal("result"),
    version: literal(VERSION),
    requestId: id2,
    ok: boolean(),
    result: optional(unknown()),
    error: optional(string())
  });
  var helloSchema = strictObject({
    type: literal("hello"),
    version: literal(VERSION),
    token: pipe(string(), length(64)),
    nonce: id2,
    documentName: pipe(string(), maxLength(512)),
    capabilities: pipe(
      array(picklist(Object.keys(tools))),
      maxLength(32)
    ),
    operations: pipe(array(string()), maxLength(32)),
    prototypeFeatures: optional(
      pipe(array(picklist(PROTOTYPE_FEATURES)), maxLength(16)),
      []
    )
  });
  function canonical(value) {
    if (value === void 0) return "null";
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    if (value && typeof value === "object")
      return `{${Object.entries(value).filter(([, val]) => val !== void 0).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, val]) => `${JSON.stringify(key)}:${canonical(val)}`).join(",")}}`;
    return JSON.stringify(value);
  }
  function utf8(value) {
    const bytes = [];
    for (const char of value) {
      let n = char.codePointAt(0);
      if (n >= 55296 && n <= 57343) n = 65533;
      if (n < 128) bytes.push(n);
      else if (n < 2048) bytes.push(192 | n >> 6, 128 | n & 63);
      else if (n < 65536)
        bytes.push(224 | n >> 12, 128 | n >> 6 & 63, 128 | n & 63);
      else
        bytes.push(
          240 | n >> 18,
          128 | n >> 12 & 63,
          128 | n >> 6 & 63,
          128 | n & 63
        );
    }
    return new Uint8Array(bytes);
  }
  var fingerprint = (value) => Array.from(
    sha256(utf8(canonical(value))),
    (b) => b.toString(16).padStart(2, "0")
  ).join("");
  var BridgeError = class extends Error {
    constructor(code) {
      super(code);
      this.code = code;
    }
  };
  var parse = (schema, input) => {
    const r = safeParse(schema, input);
    if (!r.success) throw new BridgeError("INVALID_ARGUMENTS");
    return r.output;
  };
  var bytesHash = (bytes) => Array.from(sha256(bytes), (b) => b.toString(16).padStart(2, "0")).join("");

  // src/figma/prototype-actions.ts
  function variantOwner(node) {
    let current = node;
    while (current && current.type !== "PAGE") {
      if (current.type === "COMPONENT" || current.type === "INSTANCE")
        return current;
      current = current.parent;
    }
    return null;
  }
  async function checkVariant(api, source, destination) {
    let owner = variantOwner(source);
    if (owner?.type === "INSTANCE") owner = await owner.getMainComponentAsync();
    if (!owner || owner.type !== "COMPONENT" || owner.parent?.type !== "COMPONENT_SET" || destination.type !== "COMPONENT" || destination.parent?.id !== owner.parent.id || destination.id === owner.id)
      throw new BridgeError("CHANGE_TO_REQUIRES_SIBLING_VARIANT");
  }
  var PrototypeDependencies = class {
    constructor(api) {
      this.api = api;
      __publicField(this, "entries", /* @__PURE__ */ new Map());
      __publicField(this, "expanding", /* @__PURE__ */ new Set());
    }
    track(key, current) {
      const data = JSON.parse(JSON.stringify(current()));
      const previous = this.entries.get(key);
      if (previous && fingerprint(previous.data) !== fingerprint(data))
        throw new BridgeError("PROTOTYPE_RESOURCE_CHANGED");
      if (this.entries.size >= 50 && !previous)
        throw new BridgeError("PROTOTYPE_RESOURCE_BUDGET");
      const bytes = utf8(JSON.stringify(data)).length + [...this.entries].filter(([id3]) => id3 !== key).reduce(
        (n, [, entry]) => n + utf8(JSON.stringify(entry.data)).length,
        0
      );
      if (bytes > 24e3) throw new BridgeError("PROTOTYPE_RESOURCE_BUDGET");
      this.entries.set(key, { data, current });
    }
    async variable(id3) {
      const item = await this.api.variables?.getVariableByIdAsync(id3);
      if (!item || item.remote)
        throw new BridgeError("PROTOTYPE_VARIABLE_UNAVAILABLE");
      const alreadyRead = this.entries.has(`variable:${id3}`);
      this.track(`variable:${id3}`, () => ({
        id: id3,
        name: item.name,
        resolvedType: item.resolvedType,
        variableCollectionId: item.variableCollectionId,
        valuesByMode: item.valuesByMode
      }));
      if (this.expanding.has(id3))
        throw new BridgeError("PROTOTYPE_VARIABLE_ALIAS_CYCLE");
      if (!alreadyRead) {
        this.expanding.add(id3);
        try {
          await this.collection(item.variableCollectionId);
          for (const value of Object.values(item.valuesByMode)) {
            if (typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS") {
              const alias = await this.variable(value.id);
              if (alias.resolvedType !== item.resolvedType)
                throw new BridgeError("PROTOTYPE_VALUE_TYPE_MISMATCH");
            }
          }
        } finally {
          this.expanding.delete(id3);
        }
      }
      return item;
    }
    async collection(id3) {
      const item = await this.api.variables?.getVariableCollectionByIdAsync(id3);
      if (!item || item.remote)
        throw new BridgeError("PROTOTYPE_COLLECTION_UNAVAILABLE");
      this.track(`collection:${id3}`, () => ({
        id: id3,
        name: item.name,
        modes: item.modes,
        defaultModeId: item.defaultModeId
      }));
      return item;
    }
    async value(data) {
      if (data.type === "VARIABLE_ALIAS") {
        const alias = data.value;
        const variable = await this.variable(alias.id);
        if (variable.resolvedType !== data.resolvedType)
          throw new BridgeError("PROTOTYPE_VALUE_TYPE_MISMATCH");
      } else if (data.type === "EXPRESSION") {
        const value = data.value;
        const types = [];
        for (const arg of value.expressionArguments)
          types.push(await this.value(arg));
        const op = value.expressionFunction;
        const unary = op === "NOT" || op === "NEGATE";
        if (types.length !== (unary ? 1 : 2))
          throw new BridgeError("EXPRESSION_ARITY_MISMATCH");
        let output;
        if (["AND", "OR", "NOT"].includes(op)) {
          if (types.some((t) => t !== "BOOLEAN"))
            throw new BridgeError("EXPRESSION_TYPE_MISMATCH");
          output = "BOOLEAN";
        } else if (["EQUALS", "NOT_EQUAL"].includes(op)) {
          if (types[0] !== types[1])
            throw new BridgeError("EXPRESSION_TYPE_MISMATCH");
          output = "BOOLEAN";
        } else if (op === "ADDITION" && types.every((t) => t === "STRING"))
          output = "STRING";
        else {
          if (types.some((t) => t !== "FLOAT"))
            throw new BridgeError("EXPRESSION_TYPE_MISMATCH");
          output = [
            "LESS_THAN",
            "LESS_THAN_OR_EQUAL",
            "GREATER_THAN",
            "GREATER_THAN_OR_EQUAL"
          ].includes(op) ? "BOOLEAN" : "FLOAT";
          if (op === "DIVISION" && value.expressionArguments[1].type === "FLOAT" && value.expressionArguments[1].value === 0)
            throw new BridgeError("EXPRESSION_DIVISION_BY_ZERO");
        }
        if (output !== data.resolvedType)
          throw new BridgeError("EXPRESSION_TYPE_MISMATCH");
      }
      return data.resolvedType;
    }
    verify() {
      for (const { data, current } of this.entries.values())
        if (fingerprint(data) !== fingerprint(current()))
          throw new BridgeError("PROTOTYPE_RESOURCE_CHANGED");
    }
    snapshots() {
      return [...this.entries.values()].map(({ data }) => data);
    }
  };
  async function checkActions(api, node, actions2, deps, checkDestination) {
    for (const action of actions2) {
      if (action.type === "NODE") {
        const destination = await api.getNodeByIdAsync(action.destinationId);
        if (!destination || destination.removed)
          throw new BridgeError("PROTOTYPE_NODE_NOT_FOUND");
        await checkDestination(node, destination, action.navigation);
      } else if (action.type === "SET_VARIABLE") {
        const target = await deps.variable(action.variableId);
        if (await deps.value(action.variableValue) !== target.resolvedType)
          throw new BridgeError("PROTOTYPE_VALUE_TYPE_MISMATCH");
      } else if (action.type === "SET_VARIABLE_MODE") {
        const collection = await deps.collection(action.variableCollectionId);
        if (!collection.modes.some((mode) => mode.modeId === action.variableModeId))
          throw new BridgeError("PROTOTYPE_MODE_NOT_FOUND");
      } else if (action.type === "CONDITIONAL") {
        for (const block of action.conditionalBlocks) {
          if (block.condition && await deps.value(block.condition) !== "BOOLEAN")
            throw new BridgeError("CONDITION_MUST_BE_BOOLEAN");
          await checkActions(api, node, block.actions, deps, checkDestination);
        }
      }
    }
  }
  function flattenActions(actions2) {
    const entries = [];
    let truncated = false;
    const visit = (list, prefix, rootIndex, conditional, depth) => {
      for (const [index2, action] of list.entries()) {
        if (entries.length >= 128 || depth > 4) {
          truncated = true;
          return;
        }
        const path = prefix ? `${prefix}/${index2}` : String(index2);
        const actionIndex = prefix ? rootIndex : index2;
        entries.push({ action, actionIndex, actionPath: path, conditional });
        if (action?.type === "CONDITIONAL" && Array.isArray(action.conditionalBlocks)) {
          for (const [blockIndex, block] of action.conditionalBlocks.entries()) {
            if (entries.length >= 128) {
              truncated = true;
              return;
            }
            const branchPath = `${path}/branch/${blockIndex}`;
            entries.push({
              action: {
                type: "CONDITIONAL_BRANCH",
                condition: block.condition ?? null
              },
              actionIndex,
              actionPath: branchPath,
              conditional: true
            });
            if (Array.isArray(block.actions))
              visit(block.actions, branchPath, actionIndex, true, depth + 1);
          }
          if (action.conditionalBlocks.every((b) => b.condition !== void 0)) {
            if (entries.length >= 128) {
              truncated = true;
              return;
            }
            entries.push({
              action: { type: "CONDITIONAL_BRANCH", condition: null },
              actionIndex,
              actionPath: `${path}/else`,
              conditional: true
            });
          }
        }
      }
    };
    visit(actions2, "", 0, false, 0);
    return { entries, truncated };
  }

  // src/figma/prototype.ts
  function prototypeState(node) {
    const state = {};
    if ("reactions" in node) state.reactions = node.reactions;
    if (node.type === "PAGE") state.flowStartingPoints = node.flowStartingPoints;
    for (const key of [
      "overflowDirection",
      "overlayPositionType",
      "overlayBackground",
      "overlayBackgroundInteraction"
    ]) {
      if (key in node) state[key] = node[key];
    }
    return state;
  }
  function isPrototypeOperation(op) {
    return [
      "upsert_reaction",
      "remove_reaction",
      "upsert_flow_start",
      "remove_flow_start",
      "update_prototype_settings"
    ].includes(op.type);
  }
  function pageOf(node) {
    let current = node;
    while (current && current.type !== "PAGE") current = current.parent;
    return current;
  }
  async function find(api, id3) {
    const node = await api.getNodeByIdAsync(id3);
    if (!node || node.removed) throw new BridgeError("PROTOTYPE_NODE_NOT_FOUND");
    return node;
  }
  function screen(node) {
    return ["FRAME", "COMPONENT", "INSTANCE"].includes(node.type) && (node.parent?.type === "PAGE" || node.parent?.type === "SECTION");
  }
  function containingScreen(node) {
    let current = node;
    while (current && current.type !== "PAGE") {
      if (screen(current)) return current.id;
      current = current.parent;
    }
    return null;
  }
  function actions(reaction) {
    return Array.isArray(reaction.actions) ? reaction.actions : reaction.action ? [reaction.action] : [];
  }
  async function checkPrototypeOperation(api, node, op, root) {
    parse(prototypeOperationSchema, op);
    if (op.type === "upsert_reaction" || op.type === "remove_reaction") {
      if (!("setReactionsAsync" in node))
        throw new BridgeError("REACTIONS_UNSUPPORTED");
      if (node.reactions.length > 1e3)
        throw new BridgeError("TOO_MANY_REACTIONS");
      if (op.index !== void 0 && op.index >= node.reactions.length)
        throw new BridgeError("REACTION_INDEX_NOT_FOUND");
      if (op.type === "upsert_reaction") {
        const deps = new PrototypeDependencies(api);
        await checkActions(
          api,
          node,
          op.reaction.actions,
          deps,
          async (source, destination, navigation) => {
            if (pageOf(destination)?.id !== pageOf(source)?.id)
              throw new BridgeError("PROTOTYPE_CROSS_PAGE");
            if (navigation === "CHANGE_TO")
              await checkVariant(api, source, destination);
            else if (!screen(destination))
              throw new BridgeError("PROTOTYPE_DESTINATION_NOT_SCREEN");
          }
        );
        deps.verify();
      }
    } else if (op.type === "upsert_flow_start" || op.type === "remove_flow_start") {
      if (node.type !== "PAGE" || root.id !== node.id)
        throw new BridgeError("FLOW_REQUIRES_PAGE_LEASE");
      if (node.flowStartingPoints.length > 1e3)
        throw new BridgeError("TOO_MANY_FLOWS");
      if (op.type === "upsert_flow_start") {
        const destination = await find(api, op.startNodeId);
        if (pageOf(destination)?.id !== node.id || !screen(destination))
          throw new BridgeError("INVALID_FLOW_START");
      } else if (!node.flowStartingPoints.some((flow) => flow.nodeId === op.startNodeId))
        throw new BridgeError("FLOW_START_NOT_FOUND");
    } else if (!("overflowDirection" in node))
      throw new BridgeError("PROTOTYPE_SETTINGS_UNSUPPORTED");
  }
  async function writePrototypeOperation(node, op) {
    if (op.type === "upsert_reaction" || op.type === "remove_reaction") {
      const target = node;
      const next = JSON.parse(JSON.stringify(target.reactions));
      if (op.type === "remove_reaction") next.splice(op.index, 1);
      else if (op.index === void 0) next.push(op.reaction);
      else next[op.index] = op.reaction;
      await target.setReactionsAsync(next);
    } else if (op.type === "upsert_flow_start" || op.type === "remove_flow_start") {
      const page = node;
      const next = page.flowStartingPoints.map((flow) => ({ ...flow }));
      const index2 = next.findIndex((flow) => flow.nodeId === op.startNodeId);
      if (op.type === "remove_flow_start") next.splice(index2, 1);
      else if (index2 < 0) next.push({ nodeId: op.startNodeId, name: op.name });
      else next[index2] = { nodeId: op.startNodeId, name: op.name };
      page.flowStartingPoints = next;
    } else node.overflowDirection = op.patch.overflowDirection;
  }
  async function readPrototype(api, input, snapshot2) {
    const args = parse(prototypeReadSchema, input);
    const page = await find(api, args.pageId);
    if (page.type !== "PAGE") throw new BridgeError("PROTOTYPE_PAGE_REQUIRED");
    const pageFingerprint = snapshot2(page).fingerprint;
    const dependencies = new PrototypeDependencies(api);
    if (utf8(JSON.stringify(page.flowStartingPoints)).length > 16e3)
      throw new BridgeError("FLOW_LIST_TOO_LARGE");
    const queue = [...args.nodeIds], visited = /* @__PURE__ */ new Set(), pending = /* @__PURE__ */ new Set(), edgeLimited = /* @__PURE__ */ new Set();
    const scheduled = new Set(args.nodeIds);
    let queueTruncated = false;
    const enqueue = (ids) => {
      for (const id3 of ids) {
        if (scheduled.has(id3)) continue;
        if (scheduled.size >= 2e3) {
          queueTruncated = true;
          pending.add(id3);
          break;
        }
        scheduled.add(id3);
        queue.push(id3);
      }
    };
    const nodes = [];
    const edges = [];
    const issues = [];
    let bytes = 2e4, complete = true;
    const issue = (severity, code, nodeId, reactionIndex) => {
      if (issues.length < 100)
        issues.push({
          severity,
          code,
          nodeId,
          ...reactionIndex === void 0 ? {} : { reactionIndex }
        });
      else complete = false;
    };
    while (queue.length) {
      const id3 = queue.shift();
      if (visited.has(id3)) continue;
      if (nodes.length >= args.maxNodes) {
        pending.add(id3);
        complete = false;
        continue;
      }
      visited.add(id3);
      const node = await api.getNodeByIdAsync(id3);
      if (!node || node.removed) {
        issue("error", "MISSING_NODE", id3);
        continue;
      }
      if (pageOf(node)?.id !== page.id || node.type === "PAGE") {
        issue("error", "OUTSIDE_PROTOTYPE_PAGE", id3);
        continue;
      }
      const state = prototypeState(node);
      const entry = {
        id: id3,
        name: node.name,
        type: node.type,
        parentId: node.parent?.id ?? null,
        screenId: containingScreen(node),
        fingerprint: snapshot2(node).fingerprint,
        prototype: state
      };
      const size2 = utf8(JSON.stringify(entry)).length;
      if (bytes + size2 > MAX_RESULT - 96e3) {
        pending.add(id3);
        complete = false;
        issue("warning", "READ_BUDGET_EXCEEDED", id3);
        continue;
      }
      bytes += size2;
      nodes.push(entry);
      if ("children" in node) {
        if (node.children.length > 1e4) throw new BridgeError("NODE_TOO_WIDE");
        enqueue(node.children.map((child) => child.id));
      }
      if (!("reactions" in node)) continue;
      for (const [reactionIndex, reaction] of node.reactions.entries()) {
        const canonical2 = {
          trigger: reaction.trigger,
          actions: actions(reaction)
        };
        const parsed = safeParse(reactionSchema, canonical2);
        if (!parsed.success)
          issue("warning", "UNSUPPORTED_REACTION", id3, reactionIndex);
        else {
          try {
            await checkActions(
              api,
              node,
              parsed.output.actions,
              dependencies,
              async (source, destination, navigation) => {
                if (pageOf(destination)?.id !== page.id)
                  throw new BridgeError("CROSS_PAGE_DESTINATION");
                if (navigation === "CHANGE_TO")
                  await checkVariant(api, source, destination);
                else if (!screen(destination))
                  throw new BridgeError("DESTINATION_NOT_SCREEN");
              }
            );
          } catch (error) {
            issue(
              "error",
              error instanceof BridgeError ? error.code : "PROTOTYPE_DEPENDENCY_UNAVAILABLE",
              id3,
              reactionIndex
            );
          }
        }
        const flattened = flattenActions(actions(reaction));
        if (flattened.truncated) {
          complete = false;
          issue("warning", "ACTION_TRAVERSAL_TRUNCATED", id3, reactionIndex);
        }
        for (const {
          actionIndex,
          actionPath,
          conditional,
          action
        } of flattened.entries) {
          if (edges.length >= args.maxEdges) {
            complete = false;
            pending.add(id3);
            edgeLimited.add(id3);
            continue;
          }
          const edge = {
            sourceId: id3,
            reactionIndex,
            actionIndex,
            actionPath,
            conditional,
            trigger: reaction.trigger,
            action,
            type: String(action.type),
            supported: parsed.success,
            ...typeof action.destinationId === "string" ? { destinationId: action.destinationId } : {},
            ...action.navigation ? { navigation: String(action.navigation) } : {}
          };
          const edgeSize = utf8(JSON.stringify(edge)).length;
          if (bytes + edgeSize > MAX_RESULT - 96e3) {
            complete = false;
            pending.add(id3);
            edgeLimited.add(id3);
            continue;
          }
          bytes += edgeSize;
          edges.push(edge);
          if (action.type === "CONDITIONAL")
            issue("warning", "CONDITIONAL_PATH_INDETERMINATE", id3, reactionIndex);
          if (action.type === "NODE") {
            const destination = typeof action.destinationId === "string" ? await api.getNodeByIdAsync(action.destinationId) : null;
            if (!destination || destination.removed)
              issue("error", "MISSING_DESTINATION", id3, reactionIndex);
            else if (pageOf(destination)?.id !== page.id)
              issue("error", "CROSS_PAGE_DESTINATION", id3, reactionIndex);
            else {
              if (["NAVIGATE", "OVERLAY"].includes(action.navigation) && !screen(destination))
                issue("error", "DESTINATION_NOT_SCREEN", id3, reactionIndex);
              if (args.traverseDestinations) enqueue([destination.id]);
              else if (!visited.has(destination.id) && !queue.includes(destination.id)) {
                pending.add(destination.id);
              }
            }
          }
        }
      }
    }
    for (const id3 of visited)
      if (nodes.some((n) => n.id === id3) && !issues.some((i) => i.nodeId === id3 && i.code === "READ_BUDGET_EXCEEDED")) {
        if (!edgeLimited.has(id3)) pending.delete(id3);
      }
    if (pending.size || queueTruncated) complete = false;
    if (!page.flowStartingPoints.length)
      issue("warning", "NO_FLOW_STARTS", page.id);
    for (const node of nodes) {
      const live = await api.getNodeByIdAsync(node.id);
      if (!live || live.removed || snapshot2(live).fingerprint !== node.fingerprint) {
        complete = false;
        issue("warning", "NODE_CHANGED_DURING_READ", node.id);
      }
    }
    for (const flow of page.flowStartingPoints) {
      const start = await api.getNodeByIdAsync(flow.nodeId);
      if (!start || start.removed || pageOf(start)?.id !== page.id || !screen(start))
        issue("error", "INVALID_FLOW_START", flow.nodeId);
    }
    try {
      dependencies.verify();
    } catch {
      complete = false;
      issue("warning", "PROTOTYPE_RESOURCE_CHANGED", page.id);
    }
    if (snapshot2(page).fingerprint !== pageFingerprint) {
      complete = false;
      issue("warning", "FLOW_CHANGED_DURING_READ", page.id);
    }
    const scenario = args.scenario;
    let scenarioStatus = "not_requested";
    if (scenario) {
      const screens = new Set(
        nodes.filter((n) => n.screenId === n.id).map((n) => n.id)
      );
      const requested = [
        scenario.startNodeId,
        ...scenario.expectedScreenIds,
        ...scenario.requireExitNodeIds
      ];
      const missing = [...new Set(requested)].filter((id3) => !screens.has(id3));
      if (!complete || issues.some(
        (i) => i.severity === "error" || i.code === "UNSUPPORTED_REACTION"
      ) || missing.length) {
        scenarioStatus = "inconclusive";
        for (const id3 of missing)
          issue("warning", "SCENARIO_SCREEN_NOT_INSPECTED", id3);
        issue("warning", "SCENARIO_COVERAGE_INCOMPLETE", scenario.startNodeId);
      } else if (edges.some(
        (edge) => edge.type === "CONDITIONAL" || edge.navigation === "CHANGE_TO"
      )) {
        scenarioStatus = "requires_playback";
        issue("warning", "SCENARIO_REQUIRES_RUNTIME_STATE", scenario.startNodeId);
      } else {
        scenarioStatus = "satisfied";
        const reachable = /* @__PURE__ */ new Set([scenario.startNodeId]);
        const adjacency = /* @__PURE__ */ new Map();
        for (const edge of edges) {
          const source = nodes.find((n) => n.id === edge.sourceId)?.screenId;
          if (!source || !edge.supported || !edge.destinationId) continue;
          const destinations = adjacency.get(source) ?? /* @__PURE__ */ new Set();
          destinations.add(edge.destinationId);
          adjacency.set(source, destinations);
        }
        const todo = [scenario.startNodeId];
        while (todo.length)
          for (const target of adjacency.get(todo.shift()) ?? []) {
            if (!reachable.has(target)) {
              reachable.add(target);
              todo.push(target);
            }
          }
        for (const id3 of scenario.expectedScreenIds)
          if (!reachable.has(id3)) {
            issue("warning", "UNREACHABLE_SCREEN", id3);
            scenarioStatus = "warnings";
          }
        for (const id3 of scenario.requireExitNodeIds) {
          const exits = edges.filter(
            (e) => e.supported && nodes.find((n) => n.id === e.sourceId)?.screenId === id3
          );
          if (exits.some(
            (e) => e.type === "NODE" && e.navigation === "NAVIGATE" && e.destinationId !== id3
          ))
            continue;
          if (exits.some((e) => e.type === "BACK" || e.type === "CLOSE")) {
            issue("warning", "EXIT_REQUIRES_PLAYBACK_HISTORY", id3);
            if (scenarioStatus === "satisfied")
              scenarioStatus = "requires_playback";
          } else {
            issue("warning", "MISSING_EXIT_PATH", id3);
            scenarioStatus = "warnings";
          }
        }
      }
    }
    const result = {
      scenario: scenario ?? null,
      scenarioStatus,
      pageId: page.id,
      pageFingerprint,
      dependencies: dependencies.snapshots(),
      flowStartingPoints: page.flowStartingPoints,
      nodes,
      edges,
      issues,
      complete,
      pendingNodeIds: [...pending].slice(0, 100),
      pendingTruncated: pending.size > 100 || queueTruncated
    };
    return { ...result, flowFingerprint: fingerprint(result) };
  }
  async function prototypeTool(api, method, input, snapshot2) {
    const playback = method === "prepare_prototype_playback" ? parse(prototypePlaybackSchema, input) : void 0;
    const {
      startNodeId: _start,
      prototypeUrl: _url,
      ...readArgs
    } = playback ?? input;
    if (playback?.scenario && playback.scenario.startNodeId !== playback.startNodeId)
      throw new BridgeError("SCENARIO_START_MISMATCH");
    const graph = await readPrototype(api, readArgs, snapshot2);
    if (method === "read_prototype") return graph;
    const structuralStatus = graph.issues.some((i) => i.severity === "error") ? "invalid" : !graph.complete || graph.scenarioStatus === "inconclusive" || graph.issues.some((i) => i.code === "UNSUPPORTED_REACTION") ? "inconclusive" : "valid";
    if (!playback)
      return { ...graph, structuralStatus, playbackStatus: "not_run" };
    const start = await find(api, playback.startNodeId);
    if (!screen(start) || pageOf(start)?.id !== graph.pageId || !graph.nodes.some((node) => node.id === start.id))
      throw new BridgeError("START_NOT_IN_INSPECTED_FLOW");
    const candidates = graph.edges.map((edge) => ({
      ...edge,
      targetName: graph.nodes.find((node) => node.id === edge.sourceId)?.name ?? null,
      expected: edge.type === "CONDITIONAL_BRANCH" ? "Exercise this branch with documented variable inputs; observe its effects or no-op" : edge.type === "CONDITIONAL" ? "Evaluate conditional using documented starting variable values" : edge.type === "SET_VARIABLE" ? "Observe the assigned runtime variable through a bound layer or subsequent branch" : edge.type === "SET_VARIABLE_MODE" ? "Observe the selected variable mode in bound layers" : edge.navigation === "CHANGE_TO" ? "The target component variant is visible" : edge.type === "BACK" ? "Previous screen is visible" : edge.type === "CLOSE" ? "Top overlay closes" : edge.navigation === "OVERLAY" ? "Destination overlay is visible" : edge.navigation === "NAVIGATE" ? "Destination screen is visible" : "Unsupported action: inspect manually",
      status: "not_run"
    }));
    const steps = [];
    let stepBytes = 0;
    for (const step of candidates) {
      stepBytes += utf8(JSON.stringify(step)).length;
      if (stepBytes > 64e3) break;
      steps.push(step);
    }
    const stepsComplete = steps.length === candidates.length;
    return {
      scenario: graph.scenario,
      scenarioStatus: graph.scenarioStatus,
      pageId: graph.pageId,
      flowFingerprint: graph.flowFingerprint,
      complete: graph.complete,
      pendingNodeIds: graph.pendingNodeIds,
      pendingTruncated: graph.pendingTruncated,
      issues: graph.issues,
      stepsComplete,
      structuralStatus,
      playbackStatus: "not_run",
      readyForPlayback: structuralStatus === "valid" && stepsComplete && graph.scenarioStatus !== "warnings",
      startNodeId: start.id,
      startName: start.name,
      prototypeUrl: playback.prototypeUrl ?? null,
      documentIdentity: "requires_player_confirmation",
      requiredController: "agent_browser_or_desktop",
      steps,
      evidence: {
        format: "figma-bridge.prototype-run",
        version: 1,
        flowFingerprint: graph.flowFingerprint,
        status: "not_run",
        steps: [],
        viewport: null
      },
      instructions: [
        "Confirm this player is the requested document and starting frame; a supplied URL is not proof.",
        "Restart at the confirmed starting frame before each independent scenario.",
        "Use current screenshots or accessible targets; editor coordinates are not player coordinates.",
        "Record actions, expected outcomes, observations and screenshot paths. Graph edges are candidates, not an ordered test script.",
        "If tools, login or document identity are unavailable, report blocked. Static exports do not prove playback.",
        "Re-read the flow after playback. A changed fingerprint invalidates the run; retain partial/unsupported coverage."
      ]
    };
  }

  // src/figma/resources.ts
  async function readResources(api, input) {
    const args = parse(tools.read_resources.schema, input), variables = [], collections = [], styles = [], components = [];
    const seen = /* @__PURE__ */ new Set(), collectionIds = /* @__PURE__ */ new Set(), queue = [...args.variableIds];
    for (let i = 0; i < queue.length && seen.size < 50; i++) {
      const id3 = queue[i];
      if (seen.has(id3)) continue;
      seen.add(id3);
      const item = await api.variables.getVariableByIdAsync(id3);
      if (!item || item.remote) {
        variables.push({ id: id3, unavailable: true });
        continue;
      }
      variables.push({
        id: id3,
        name: item.name,
        resolvedType: item.resolvedType,
        variableCollectionId: item.variableCollectionId,
        valuesByMode: item.valuesByMode,
        scopes: item.scopes,
        codeSyntax: item.codeSyntax
      });
      collectionIds.add(item.variableCollectionId);
      for (const value of Object.values(item.valuesByMode))
        if (typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS" && !seen.has(value.id))
          queue.push(value.id);
    }
    for (const id3 of collectionIds) {
      const c = await api.variables.getVariableCollectionByIdAsync(id3);
      collections.push(
        c ? { id: id3, name: c.name, modes: c.modes, defaultModeId: c.defaultModeId } : { id: id3, unavailable: true }
      );
    }
    for (const id3 of args.styleIds) {
      const s = await api.getStyleByIdAsync(id3);
      if (!s || s.remote) {
        styles.push({ id: id3, unavailable: true });
        continue;
      }
      const data = { id: id3, name: s.name, type: s.type };
      for (const field of [
        "paints",
        "effects",
        "layoutGrids",
        "fontName",
        "fontSize",
        "lineHeight",
        "letterSpacing",
        "paragraphSpacing",
        "textCase",
        "textDecoration",
        "boundVariables"
      ])
        if (field in s)
          data[field] = s[field];
      styles.push(data);
    }
    for (const id3 of args.componentIds) {
      const c = await api.getNodeByIdAsync(id3);
      components.push(
        (c?.type === "COMPONENT" || c?.type === "COMPONENT_SET") && !c.remote ? {
          id: id3,
          name: c.name,
          componentPropertyDefinitions: (c.parent?.type === "COMPONENT_SET" ? c.parent : c).componentPropertyDefinitions,
          componentSetId: c.parent?.type === "COMPONENT_SET" ? c.parent.id : null,
          children: c.children.map((n) => n.id)
        } : { id: id3, unavailable: true }
      );
    }
    const pendingVariableIds = [...new Set(queue.filter((id3) => !seen.has(id3)))];
    return {
      variables,
      collections,
      styles,
      components,
      complete: pendingVariableIds.length === 0,
      pendingVariableIds
    };
  }
  var Exports = class {
    constructor(api) {
      this.api = api;
      __publicField(this, "bytes");
      __publicField(this, "id", 0);
    }
    async dispatch(method, input) {
      if (method === "export_release") {
        this.bytes = void 0;
        return { released: true };
      }
      if (method === "export_chunk") {
        if (input.exportId !== String(this.id) || !this.bytes)
          throw new BridgeError("EXPORT_EXPIRED");
        const index2 = Number(input.index);
        if (!Number.isInteger(index2) || index2 < 0 || index2 * 65536 >= this.bytes.length)
          throw new BridgeError("INVALID_CHUNK");
        return {
          index: index2,
          data: this.api.base64Encode(
            this.bytes.slice(index2 * 65536, (index2 + 1) * 65536)
          )
        };
      }
      const args = parse(tools.export.schema, input), node = await this.api.getNodeByIdAsync(args.nodeId);
      if (!node || !("exportAsync" in node))
        throw new BridgeError("NOT_EXPORTABLE");
      let bytes, mime;
      if (args.format === "IMAGE") {
        if (!args.imageHash) throw new BridgeError("IMAGE_HASH_REQUIRED");
        const paints = [
          ..."fills" in node && Array.isArray(node.fills) ? node.fills : [],
          ..."strokes" in node ? node.strokes : []
        ];
        if (!paints.some(
          (p) => p.type === "IMAGE" && p.imageHash === args.imageHash
        ))
          throw new BridgeError("IMAGE_NOT_ON_NODE");
        const image = this.api.getImageByHash(args.imageHash);
        if (!image) throw new BridgeError("IMAGE_NOT_FOUND");
        bytes = await image.getBytesAsync();
        mime = "application/octet-stream";
      } else {
        const bounds = ("absoluteRenderBounds" in node ? node.absoluteRenderBounds : null) ?? ("absoluteBoundingBox" in node ? node.absoluteBoundingBox : null);
        if (!bounds || bounds.width * args.scale > 16e3 || bounds.height * args.scale > 16e3 || bounds.width * bounds.height * args.scale ** 2 > 16e6)
          throw new BridgeError("EXPORT_DIMENSION_LIMIT");
        bytes = await node.exportAsync(
          args.format === "PNG" ? { format: "PNG", constraint: { type: "SCALE", value: args.scale } } : { format: "SVG" }
        );
        mime = args.format === "PNG" ? "image/png" : "image/svg+xml";
      }
      if (bytes.length > 10 * 1024 * 1024)
        throw new BridgeError("EXPORT_TOO_LARGE");
      this.bytes = bytes;
      this.id++;
      return {
        exportId: String(this.id),
        bytes: bytes.length,
        chunks: Math.ceil(bytes.length / 65536),
        sha256: bytesHash(bytes),
        mime
      };
    }
  };

  // src/figma/serialize.ts
  var GEOMETRY_FIELDS = [
    "x",
    "y",
    "width",
    "height",
    "rotation",
    "relativeTransform",
    "absoluteTransform",
    "absoluteBoundingBox",
    "absoluteRenderBounds",
    "targetAspectRatio",
    "constraints",
    "minWidth",
    "maxWidth",
    "minHeight",
    "maxHeight"
  ];
  var LAYOUT_FIELDS = [
    "layoutMode",
    "layoutWrap",
    "layoutSizingHorizontal",
    "layoutSizingVertical",
    "layoutAlign",
    "layoutGrow",
    "layoutPositioning",
    "primaryAxisSizingMode",
    "counterAxisSizingMode",
    "primaryAxisAlignItems",
    "counterAxisAlignItems",
    "counterAxisAlignContent",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "itemSpacing",
    "counterAxisSpacing",
    "itemReverseZIndex",
    "strokesIncludedInLayout",
    "clipsContent",
    "overflowDirection",
    "gridRowCount",
    "gridColumnCount",
    "gridRowGap",
    "gridColumnGap",
    "gridColumnsSizing",
    "gridRowsSizing",
    "gridColumnAnchorIndex",
    "gridRowAnchorIndex",
    "gridColumnSpan",
    "gridRowSpan"
  ];
  var APPEARANCE_FIELDS = [
    "opacity",
    "blendMode",
    "isMask",
    "maskType",
    "fills",
    "strokes",
    "strokeWeight",
    "strokeTopWeight",
    "strokeRightWeight",
    "strokeBottomWeight",
    "strokeLeftWeight",
    "strokeAlign",
    "strokeCap",
    "strokeJoin",
    "dashPattern",
    "miterLimit",
    "cornerRadius",
    "topLeftRadius",
    "topRightRadius",
    "bottomRightRadius",
    "bottomLeftRadius",
    "cornerSmoothing",
    "effects",
    "backgrounds",
    "layoutGrids",
    "fillStyleId",
    "strokeStyleId",
    "effectStyleId",
    "gridStyleId"
  ];
  var TEXT_FIELDS = [
    "characters",
    "fontName",
    "fontSize",
    "fontWeight",
    "textCase",
    "textDecoration",
    "textAlignHorizontal",
    "textAlignVertical",
    "textAutoResize",
    "textTruncation",
    "maxLines",
    "paragraphIndent",
    "paragraphSpacing",
    "listSpacing",
    "hangingPunctuation",
    "hangingList",
    "lineHeight",
    "letterSpacing",
    "leadingTrim",
    "textWrap",
    "autoRename",
    "hyperlink",
    "textStyleId"
  ];
  var VECTOR_ASSET_TYPES = /* @__PURE__ */ new Set([
    "BOOLEAN_OPERATION",
    "ELLIPSE",
    "LINE",
    "POLYGON",
    "STAR",
    "VECTOR"
  ]);
  function normalized(value, state, key, seen = /* @__PURE__ */ new WeakSet()) {
    if (value === null || typeof value === "boolean" || typeof value === "number")
      return value;
    if (typeof value === "string") {
      if (key?.endsWith("StyleId") && value.length > 0) state.styleIds.add(value);
      return value;
    }
    if (typeof value === "symbol") return { $figma: "mixed" };
    if (typeof value === "bigint") return String(value);
    if (typeof value !== "object") return void 0;
    if (seen.has(value)) return { $figma: "circular" };
    seen.add(value);
    if (Array.isArray(value)) {
      const items = [];
      for (const item of value) {
        const result2 = normalized(item, state, void 0, seen);
        if (result2 !== void 0) items.push(result2);
      }
      seen.delete(value);
      return items;
    }
    const record2 = value;
    if (record2.type === "VARIABLE_ALIAS" && typeof record2.id === "string")
      state.variableIds.add(record2.id);
    const result = {};
    for (const [childKey, childValue] of Object.entries(record2)) {
      const child = normalized(childValue, state, childKey, seen);
      if (child !== void 0) result[childKey] = child;
    }
    seen.delete(value);
    return result;
  }
  function readGroup(node, fields2, state) {
    const record2 = node;
    const result = {};
    for (const field of fields2) {
      if (!(field in record2)) continue;
      let value;
      try {
        value = record2[field];
      } catch {
        continue;
      }
      const next = normalized(value, state, field);
      if (next !== void 0) result[field] = next;
    }
    return Object.keys(result).length > 0 ? result : void 0;
  }
  function imageAssetReferences(node, property, state) {
    const value = node[property];
    if (!Array.isArray(value)) return [];
    const references = [];
    for (const [index2, paint] of value.entries()) {
      if (!paint || typeof paint !== "object") continue;
      const image = paint;
      if (image.type !== "IMAGE" || typeof image.imageHash !== "string") continue;
      const reference = {
        kind: "image-fill",
        property,
        index: index2,
        imageHash: image.imageHash
      };
      const scaleMode = normalized(image.scaleMode, state);
      if (scaleMode !== void 0) reference.scaleMode = scaleMode;
      references.push(reference);
    }
    return references;
  }
  function assetReferences(node, state) {
    const references = [
      ...imageAssetReferences(node, "fills", state),
      ...imageAssetReferences(node, "strokes", state)
    ];
    const record2 = node;
    if ("exportSettings" in record2 && Array.isArray(record2.exportSettings)) {
      for (const [index2, setting] of record2.exportSettings.entries()) {
        const value = normalized(setting, state);
        if (value !== void 0)
          references.push({ kind: "export-setting", index: index2, setting: value });
      }
    }
    if (VECTOR_ASSET_TYPES.has(node.type) && references.every((reference) => reference.kind !== "export-setting")) {
      references.push({ kind: "suggested-export", format: "SVG" });
    }
    for (const reference of references) {
      state.assets.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        ...reference
      });
    }
    return references;
  }
  async function componentData(node, state) {
    if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET" && node.type !== "INSTANCE" && node.componentPropertyReferences === null)
      return void 0;
    const data = readGroup(
      node,
      [
        "key",
        "remote",
        "description",
        "documentationLinks",
        "variantProperties",
        "componentPropertyDefinitions",
        "componentProperties",
        "componentPropertyReferences",
        "overrides",
        "scaleFactor"
      ],
      state
    );
    if (node.type !== "INSTANCE") return data;
    let main = null;
    try {
      main = await node.getMainComponentAsync();
    } catch {
      main = null;
    }
    if (!main) return data;
    const mainComponent = {
      id: main.id,
      name: main.name,
      key: main.key,
      remote: main.remote
    };
    if (main.parent?.type === "COMPONENT_SET") {
      mainComponent.componentSet = {
        id: main.parent.id,
        name: main.parent.name,
        key: main.parent.key,
        remote: main.parent.remote
      };
    }
    return { ...data ?? {}, mainComponent };
  }
  function textData(node, state, maxText) {
    const data = readGroup(node, TEXT_FIELDS, state) ?? {};
    const segments = node.getStyledTextSegments(
      [
        "fontName",
        "fontSize",
        "fontWeight",
        "textDecoration",
        "textCase",
        "lineHeight",
        "letterSpacing",
        "fills",
        "textStyleId",
        "fillStyleId",
        "listOptions",
        "listSpacing",
        "indentation",
        "paragraphIndent",
        "paragraphSpacing",
        "hyperlink",
        "boundVariables"
      ],
      0,
      maxText === void 0 ? node.characters.length : Math.min(maxText, node.characters.length)
    );
    if (maxText !== void 0 && node.characters.length > maxText) {
      data.characters = node.characters.slice(0, maxText);
      data.textTruncated = true;
      data.nextOffset = maxText;
    }
    const normalizedSegments = normalized(segments, state);
    if (normalizedSegments !== void 0) data.segments = normalizedSegments;
    return data;
  }
  async function serializeNode(node, state, recursive = true) {
    state.nodeCount += 1;
    const result = {
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible,
      locked: node.locked
    };
    const geometry = readGroup(node, GEOMETRY_FIELDS, state);
    const layout = readGroup(node, LAYOUT_FIELDS, state);
    const appearance = readGroup(node, APPEARANCE_FIELDS, state);
    const bindings = normalized(node.boundVariables, state);
    const variableModes = normalized(node.explicitVariableModes, state);
    const component = await componentData(node, state);
    const assets = assetReferences(node, state);
    if (geometry) result.geometry = geometry;
    if (layout) result.layout = layout;
    if (appearance) result.appearance = appearance;
    if (bindings && typeof bindings === "object" && !Array.isArray(bindings) && Object.keys(bindings).length > 0)
      result.boundVariables = bindings;
    if (variableModes && typeof variableModes === "object" && !Array.isArray(variableModes) && Object.keys(variableModes).length > 0)
      result.explicitVariableModes = variableModes;
    if (node.type === "TEXT")
      result.text = textData(node, state, recursive ? void 0 : 8192);
    if (component && Object.keys(component).length > 0)
      result.component = component;
    if (assets.length > 0) result.assetReferences = assets;
    if (recursive && "children" in node && node.children.length > 0)
      result.children = await Promise.all(
        node.children.map((child) => serializeNode(child, state))
      );
    return result;
  }
  async function serializeBridgeNode(node) {
    const state = {
      assets: [],
      nodeCount: 0,
      styleIds: /* @__PURE__ */ new Set(),
      variableIds: /* @__PURE__ */ new Set()
    };
    const data = await serializeNode(node, state, false);
    return {
      data,
      variableIds: [...state.variableIds],
      styleIds: [...state.styleIds]
    };
  }

  // src/figma/engine.ts
  var fields = [
    "name",
    "visible",
    "locked",
    "x",
    "y",
    "width",
    "height",
    "rotation",
    "relativeTransform",
    "opacity",
    "fills",
    "strokes",
    "strokeWeight",
    "effects",
    "cornerRadius",
    "clipsContent",
    "layoutMode",
    "layoutSizingHorizontal",
    "layoutSizingVertical",
    "primaryAxisAlignItems",
    "counterAxisAlignItems",
    "paddingTop",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
    "itemSpacing",
    "fontSize",
    "fontName",
    "characters",
    "textAutoResize",
    "textAlignHorizontal",
    "lineHeight",
    "letterSpacing",
    "boundVariables",
    "componentProperties"
  ];
  function normalized2(value) {
    if (typeof value === "symbol") return { $figma: "mixed" };
    if (value === void 0) return void 0;
    return JSON.parse(
      JSON.stringify(
        value,
        (_, v) => typeof v === "symbol" ? { $figma: "mixed" } : v
      )
    );
  }
  function snapshot(node) {
    const properties = {};
    const source = node;
    for (const field of fields) {
      if (!(field in node)) continue;
      try {
        properties[field] = normalized2(source[field]);
      } catch {
        properties[field] = { unavailable: true };
      }
    }
    if (node.type === "TEXT" && node.characters.length > 8192) {
      properties.characters = node.characters.slice(0, 8192);
      properties.textTruncated = true;
      properties.textLength = node.characters.length;
      properties.textHash = fingerprint(node.characters);
      properties.nextOffset = 8192;
    }
    const children = "children" in node ? node.children.map((child) => child.id) : [];
    if (children.length > 1e4) throw new BridgeError("NODE_TOO_WIDE");
    if (JSON.stringify(properties).length > 96e3)
      throw new BridgeError("NODE_TOO_LARGE");
    const state = {
      id: node.id,
      type: node.type,
      parentId: node.parent?.id ?? null,
      properties,
      prototypeFingerprint: fingerprint(prototypeState(node)),
      children
    };
    return { ...state, fingerprint: fingerprint(state) };
  }
  var lookup = async (api, id3) => {
    const node = await api.getNodeByIdAsync(id3);
    if (!node || node.removed) throw new BridgeError("NODE_NOT_FOUND");
    return node;
  };
  function inScope(node, root) {
    let at = node, inside = false;
    while (at) {
      if ("locked" in at && at.locked) throw new BridgeError("NODE_LOCKED");
      if (at.id === root.id) inside = true;
      at = at.parent;
    }
    if (!inside) throw new BridgeError("OUTSIDE_WRITE_SCOPE");
  }
  function checkPatch(node, patch) {
    for (const field of Object.keys(patch))
      if (!(field in node))
        throw new BridgeError(`UNSUPPORTED_PROPERTY:${field}`);
    if ("width" in patch && Number(patch.width) <= 0)
      throw new BridgeError("INVALID_WIDTH");
    if ("height" in patch && Number(patch.height) <= 0)
      throw new BridgeError("INVALID_HEIGHT");
  }
  function patchNode(node, patch) {
    checkPatch(node, patch);
    const { width, height, ...rest } = patch;
    const target = node;
    for (const [key, value] of Object.entries(rest)) target[key] = value;
    if (width !== void 0 || height !== void 0) {
      if (!("resize" in node)) throw new BridgeError("NOT_RESIZABLE");
      node.resize(Number(width ?? node.width), Number(height ?? node.height));
    }
  }
  var BridgeEngine = class {
    constructor(api) {
      this.api = api;
      __publicField(this, "cancelled", /* @__PURE__ */ new Set());
      __publicField(this, "receipts", /* @__PURE__ */ new Map());
      __publicField(this, "exports");
      this.exports = new Exports(api);
    }
    async dispatch(method, input) {
      if (method === "cancel_operation") {
        if (this.cancelled.size >= 500)
          throw new BridgeError("SESSION_OPERATION_LIMIT");
        this.cancelled.add(String(input.operationId));
        return { requested: true, operationId: input.operationId };
      }
      if ([
        "read_prototype",
        "validate_prototype",
        "prepare_prototype_playback"
      ].includes(method))
        return prototypeTool(this.api, method, input, snapshot);
      if (method === "read_text") {
        const args = parse(tools.read_text.schema, input), node = await lookup(this.api, args.nodeId);
        if (node.type !== "TEXT") throw new BridgeError("NOT_TEXT");
        const hash = fingerprint(node.characters);
        if (args.expectedTextHash && args.expectedTextHash !== hash)
          throw new BridgeError("TEXT_CHANGED");
        if (args.offset > node.characters.length)
          throw new BridgeError("INVALID_OFFSET");
        const end = Math.min(node.characters.length, args.offset + args.length);
        return {
          nodeId: node.id,
          text: node.characters.slice(args.offset, end),
          segments: node.getStyledTextSegments(
            ["fontName", "fontSize", "fills", "lineHeight", "letterSpacing"],
            args.offset,
            end
          ),
          textHash: hash,
          nextOffset: end < node.characters.length ? end : null,
          complete: end === node.characters.length
        };
      }
      if (method === "read_resources") return readResources(this.api, input);
      if (method.startsWith("export_"))
        return this.exports.dispatch(method, input);
      if (method === "selection")
        return {
          page: { id: this.api.currentPage.id, name: this.api.currentPage.name },
          selection: this.api.currentPage.selection.map((n) => ({
            id: n.id,
            name: n.name,
            type: n.type
          })),
          documentName: this.api.root.name
        };
      if (method === "scope") {
        const root = await lookup(this.api, String(input.rootId));
        if (!["PAGE", "FRAME", "SECTION"].includes(root.type))
          throw new BridgeError("INVALID_SCOPE_ROOT");
        inScope(root, root);
        return { rootId: root.id, fingerprint: snapshot(root).fingerprint };
      }
      if (method === "operation_status")
        return this.receipts.get(String(input.operationId))?.result ?? {
          operationId: input.operationId,
          status: "unknown"
        };
      if (method === "read_nodes") {
        const args = parse(tools.read_nodes.schema, input);
        let count = 0, bytes = 0;
        const output = [];
        const pending = [];
        const walk = async (node, depth) => {
          if (count >= args.maxNodes) {
            pending.push(node.id);
            return { id: node.id, truncated: true };
          }
          const base = snapshot(node);
          const rich = node.type !== "DOCUMENT" && node.type !== "PAGE" ? await serializeBridgeNode(node) : void 0;
          const state = {
            ...base,
            ...rich ? {
              design: rich.data,
              resourceIds: {
                variables: rich.variableIds,
                styles: rich.styleIds
              }
            } : {}
          }, length2 = JSON.stringify(state).length * 3;
          if (bytes + length2 > MAX_RESULT - 8192) {
            pending.push(node.id);
            return { id: node.id, truncated: true };
          }
          bytes += length2;
          count++;
          const descendants = [];
          if (depth === 0) pending.push(...state.children);
          if (depth > 0 && "children" in node)
            for (const child of node.children) {
              if (count >= args.maxNodes || bytes > MAX_RESULT - 8192) {
                pending.push(child.id);
                continue;
              }
              descendants.push(await walk(child, depth - 1));
            }
          if (snapshot(node).fingerprint !== base.fingerprint)
            throw new BridgeError("READ_CHANGED_RETRY");
          return {
            ...state,
            nodes: descendants,
            childrenTruncated: state.children.length > descendants.length
          };
        };
        for (const id3 of args.nodeIds)
          output.push(await walk(await lookup(this.api, id3), args.depth));
        return {
          schema: "figma-bridge.nodes",
          version: 1,
          nodes: output,
          nodeCount: count,
          complete: pending.length === 0,
          pendingNodeIds: pending.slice(0, 500),
          pendingTruncated: pending.length > 500
        };
      }
      if (method === "apply") return this.apply(input);
      throw new BridgeError("UNSUPPORTED_COMMAND");
    }
    async fonts(node, font) {
      if (node.type !== "TEXT") return;
      const fonts = font ? [font] : node.characters.length ? node.getRangeAllFontNames(0, node.characters.length) : node.fontName === this.api.mixed ? [] : [node.fontName];
      if (fonts.length === 0) throw new BridgeError("FONT_REQUIRED");
      for (const f of fonts) await this.api.loadFontAsync(f);
    }
    async apply(input) {
      const { rootId, ...payload } = input;
      const args = parse(tools.apply.schema, payload);
      const hash = fingerprint(input);
      const cached = this.receipts.get(args.operationId);
      if (cached) {
        if (cached.hash !== hash) throw new BridgeError("OPERATION_ID_REUSED");
        return cached.result;
      }
      if (this.receipts.size >= MAX_OPERATIONS)
        throw new BridgeError("SESSION_OPERATION_LIMIT");
      const result = {
        operationId: args.operationId,
        status: "rejected_before_write",
        steps: [],
        created: {}
      };
      if (!args.dryRun) this.receipts.set(args.operationId, { hash, result });
      let started = false;
      try {
        const root = await lookup(this.api, String(rootId));
        inScope(root, root);
        const baselines = /* @__PURE__ */ new Map();
        const creations = /* @__PURE__ */ new Map();
        for (const op of args.operations) {
          const id3 = op.type === "create" ? op.parentId : op.nodeId;
          if (id3.startsWith("$")) {
            const creator = creations.get(id3.slice(1));
            if (!creator || creator.type !== "create")
              throw new BridgeError("INVALID_LOCAL_REFERENCE");
            if (op.expectedFingerprint !== "created")
              throw new BridgeError("LOCAL_REFERENCE_FINGERPRINT");
            if (op.type === "create" && creator.kind !== "FRAME")
              throw new BridgeError("INVALID_PARENT");
            if (op.type !== "create" && op.type !== "update" && op.type !== "set_text")
              throw new BridgeError("LOCAL_REFERENCE_UNSUPPORTED");
            if (op.type === "set_text" && creator.kind !== "TEXT")
              throw new BridgeError("NOT_TEXT");
          } else {
            const node = await lookup(this.api, id3);
            inScope(node, root);
            const fp = snapshot(node).fingerprint;
            if (fp !== op.expectedFingerprint)
              throw new BridgeError("STALE_FINGERPRINT");
            baselines.set(id3, fp);
            if (op.type === "create" && !["PAGE", "FRAME", "SECTION"].includes(node.type))
              throw new BridgeError("INVALID_PARENT");
            if (op.type === "update") {
              checkPatch(node, op.patch);
              if (node.type === "TEXT") await this.fonts(node);
            }
            if (op.type === "set_text") {
              if (node.type !== "TEXT") throw new BridgeError("NOT_TEXT");
              await this.fonts(node, op.font);
            }
          }
          if (op.type === "create") {
            if (op.patch) {
              if (op.patch.width !== void 0 && op.patch.width <= 0)
                throw new BridgeError("INVALID_WIDTH");
              if (op.patch.height !== void 0 && op.patch.height <= 0)
                throw new BridgeError("INVALID_HEIGHT");
              if (op.kind !== "TEXT" && op.patch.fontSize !== void 0)
                throw new BridgeError("NOT_TEXT");
              if ((op.kind === "TEXT" || op.kind === "RECTANGLE") && [
                "layoutMode",
                "paddingTop",
                "paddingBottom",
                "paddingLeft",
                "paddingRight",
                "itemSpacing",
                "clipsContent"
              ].some((k) => k in op.patch))
                throw new BridgeError("UNSUPPORTED_LAYOUT_PROPERTY");
            }
            if (creations.has(op.key))
              throw new BridgeError("DUPLICATE_CREATE_KEY");
            creations.set(op.key, op);
            if (op.kind === "INSTANCE") {
              const component = op.componentId ? await lookup(this.api, op.componentId) : null;
              if (!component || component.type !== "COMPONENT" || component.remote)
                throw new BridgeError("LOCAL_COMPONENT_REQUIRED");
            }
            if (op.kind === "TEXT") {
              if (!op.font) throw new BridgeError("FONT_REQUIRED");
              await this.api.loadFontAsync(op.font);
            } else if (op.characters !== void 0 || op.font !== void 0)
              throw new BridgeError("TEXT_PROPERTIES_REQUIRE_TEXT");
          }
        }
        for (const op of args.operations) {
          if (isPrototypeOperation(op))
            await checkPrototypeOperation(
              this.api,
              await lookup(this.api, op.nodeId),
              op,
              root
            );
          if (op.type === "move") {
            const node = await lookup(this.api, op.nodeId), parent = await lookup(this.api, op.parentId);
            inScope(parent, root);
            if (!["PAGE", "FRAME", "SECTION"].includes(parent.type))
              throw new BridgeError("INVALID_PARENT");
            let at = parent;
            while (at) {
              if (at.id === node.id) throw new BridgeError("CYCLIC_MOVE");
              at = at.parent;
            }
            if (snapshot(parent).fingerprint !== op.parentFingerprint)
              throw new BridgeError("STALE_PARENT");
            baselines.set(parent.id, op.parentFingerprint);
          }
          if (op.type === "instance_properties") {
            const n = await lookup(this.api, op.nodeId);
            if (n.type !== "INSTANCE") throw new BridgeError("NOT_INSTANCE");
            const queue = [n];
            let checked = 0;
            while (queue.length) {
              if (++checked > 500) throw new BridgeError("INSTANCE_TOO_LARGE");
              const child = queue.pop();
              if (child.type === "TEXT") await this.fonts(child);
              if ("children" in child) queue.push(...child.children);
            }
            for (const key of Object.keys(op.properties))
              if (!Object.prototype.hasOwnProperty.call(n.componentProperties, key))
                throw new BridgeError("UNKNOWN_INSTANCE_PROPERTY");
          }
          if (op.type === "bind_variable") {
            const target = await lookup(this.api, op.nodeId);
            if (target.type === "TEXT") await this.fonts(target);
            const variable = await this.api.variables.getVariableByIdAsync(
              op.variableId
            );
            if (!variable || variable.remote)
              throw new BridgeError("LOCAL_VARIABLE_REQUIRED");
            if (variable.resolvedType !== (op.field === "fills" ? "COLOR" : "FLOAT"))
              throw new BridgeError("VARIABLE_TYPE_MISMATCH");
          }
        }
        if (args.dryRun) return { ...result, status: "preflight" };
        if (this.cancelled.has(args.operationId))
          throw new BridgeError("CANCELLED");
        this.api.commitUndo();
        for (const [index2, op] of args.operations.entries()) {
          if (this.cancelled.has(args.operationId))
            throw new BridgeError("CANCELLED");
          const id3 = op.type === "create" ? op.parentId : op.nodeId;
          const node = await lookup(
            this.api,
            id3.startsWith("$") ? result.created[id3.slice(1)] : id3
          );
          inScope(node, root);
          if (!id3.startsWith("$") && snapshot(node).fingerprint !== baselines.get(id3))
            throw new BridgeError("STALE_FINGERPRINT");
          if (isPrototypeOperation(op)) {
            await checkPrototypeOperation(this.api, node, op, root);
            if (snapshot(node).fingerprint !== baselines.get(id3))
              throw new BridgeError("STALE_FINGERPRINT");
          }
          let changed = node;
          started = true;
          if (op.type === "create") {
            const created = op.kind === "FRAME" ? this.api.createFrame() : op.kind === "TEXT" ? this.api.createText() : op.kind === "INSTANCE" ? (await lookup(this.api, op.componentId)).createInstance() : this.api.createRectangle();
            result.created[op.key] = created.id;
            changed = created;
            if (!("appendChild" in node)) throw new BridgeError("INVALID_PARENT");
            node.appendChild(created);
            if (created.type === "TEXT") {
              created.fontName = op.font;
              created.characters = op.characters ?? "";
            }
            patchNode(created, op.patch ?? {});
          } else if (op.type === "move") {
            const parent = await lookup(this.api, op.parentId);
            inScope(parent, root);
            if (snapshot(parent).fingerprint !== baselines.get(parent.id))
              throw new BridgeError("STALE_PARENT");
            parent.insertChild(op.index, node);
            baselines.set(parent.id, snapshot(parent).fingerprint);
          } else if (op.type === "instance_properties") {
            node.setProperties(op.properties);
          } else if (op.type === "bind_variable") {
            const variable = await this.api.variables.getVariableByIdAsync(
              op.variableId
            );
            if (!variable) throw new BridgeError("VARIABLE_NOT_FOUND");
            if (op.field === "fills") {
              const target = node;
              if (!Array.isArray(target.fills) || target.fills.length !== 1 || target.fills[0].type !== "SOLID")
                throw new BridgeError("SINGLE_SOLID_FILL_REQUIRED");
              target.fills = [
                this.api.variables.setBoundVariableForPaint(
                  target.fills[0],
                  "color",
                  variable
                )
              ];
            } else
              node.setBoundVariable(
                op.field,
                variable
              );
          } else if (op.type === "set_text") {
            if (node.type !== "TEXT") throw new BridgeError("NOT_TEXT");
            if (op.font) node.fontName = op.font;
            node.characters = op.characters;
          } else if (isPrototypeOperation(op))
            await writePrototypeOperation(node, op);
          else patchNode(node, op.patch);
          result.steps.push({ index: index2, nodeId: changed.id });
          baselines.set(id3, snapshot(node).fingerprint);
        }
        result.status = "complete";
      } catch (error) {
        result.status = started ? "partial" : "rejected_before_write";
        result.error = error instanceof BridgeError ? error.code : "FIGMA_OPERATION_FAILED";
      } finally {
        if (started) this.api.commitUndo();
      }
      return result;
    }
  };

  // src/figma/panel.html
  var panel_default = '<!doctype html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <style>\n      body {\n        margin: 0;\n        padding: 20px;\n        font: 13px/1.5 system-ui;\n        color: var(--figma-color-text, #222);\n        background: var(--figma-color-bg, #fff);\n      }\n      h1 {\n        font-size: 16px;\n        margin: 0 0 12px;\n      }\n      p {\n        margin: 12px 0;\n      }\n      label {\n        display: block;\n        margin-bottom: 6px;\n      }\n      input {\n        box-sizing: border-box;\n        width: 100%;\n        padding: 9px;\n        border: 1px solid #999;\n        border-radius: 6px;\n      }\n      button {\n        padding: 8px 12px;\n        border: 1px solid #999;\n        border-radius: 6px;\n        cursor: pointer;\n        margin: 10px 4px 0 0;\n      }\n      #status {\n        font-weight: 600;\n      }\n      #activity {\n        overflow-wrap: anywhere;\n        font-size: 11px;\n      }\n      small {\n        display: block;\n        margin-top: 16px;\n        opacity: 0.8;\n      }\n    </style>\n  </head>\n  <body>\n    <h1>Figma Bridge</h1>\n    <label for="token">Pairing token</label\n    ><input\n      id="token"\n      type="password"\n      autocomplete="off"\n      spellcheck="false"\n    /><button id="connect">Connect</button><button id="stop">Disconnect</button\n    ><button id="close">Close</button>\n    <p id="status" role="status">\n      Start the local bridge, then paste its pairing token.\n    </p>\n    <p id="activity"></p>\n    <small\n      >Only the paired local service can access this open file. Keep the plugin\n      running while working with your coding agent.</small\n    >\n    <script>\n      "use strict";\n(() => {\n  // node_modules/@noble/hashes/utils.js\n  function isBytes(a) {\n    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;\n  }\n  var atitle = (title) => title ? `"${title}" ` : "";\n  function anumber(n, title = "") {\n    if (typeof n !== "number")\n      throw new TypeError(atitle(title) + "expected number, got " + typeof n);\n    if (!Number.isSafeInteger(n) || n < 0)\n      throw new RangeError(atitle(title) + "expected integer >= 0, got " + n);\n    return n;\n  }\n  function abytes(value, length2, title = "") {\n    if (isBytes(value) && (length2 === void 0 || value.length === length2))\n      return value;\n    if (length2 !== void 0)\n      anumber(length2, "length");\n    const bytes = isBytes(value);\n    const ofLen = length2 !== void 0 ? ` of length ${length2}` : "";\n    const got = bytes ? `length=${value.length}` : `type=${typeof value}`;\n    const message = atitle(title) + "expected Uint8Array" + ofLen + ", got " + got;\n    if (!bytes)\n      throw new TypeError(message);\n    throw new RangeError(message);\n  }\n  function ahash(h) {\n    if (typeof h !== "function" || typeof h.create !== "function")\n      throw new TypeError("expected hash wrapped by utils.createHasher");\n    anumber(h.outputLen);\n    anumber(h.blockLen);\n    if (h.outputLen < 1 || h.blockLen < 1)\n      throw new Error("hash blockLen / outputLen must be >= 1");\n  }\n  var aobject = (value, label) => {\n    if (value === null || typeof value !== "object" || Array.isArray(value))\n      throw new TypeError((label === "object" ? "" : `"${label}" `) + "expected object, got type=" + typeof value);\n  };\n  var aopts = (value, label) => {\n    aobject(value, label);\n    const proto = Object.getPrototypeOf(value);\n    if (proto !== Object.prototype && proto !== null)\n      throw new TypeError(`"${label}" expected plain object`);\n    if (Object.hasOwn(value, "__proto__"))\n      throw new TypeError(`"${label}.__proto__" is not allowed`);\n  };\n  function aexists(instance, checkFinished = true) {\n    if (instance.destroyed)\n      throw new Error("hash was destroyed");\n    if (checkFinished && instance.finished)\n      throw new Error("digest() was already called");\n  }\n  function aoutput(out, instance) {\n    abytes(out, void 0, "output");\n    const min = instance.outputLen;\n    if (!(out.length >= min)) {\n      throw new RangeError(\'"output" expected length >= \' + min);\n    }\n  }\n  function clean(...arrays) {\n    for (let i = 0; i < arrays.length; i++) {\n      arrays[i].fill(0);\n    }\n  }\n  function createView(arr) {\n    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);\n  }\n  function rotr(word, shift) {\n    return word << 32 - shift | word >>> shift;\n  }\n  function checkOpts(defaults, opts, title = "opts") {\n    aopts(defaults, "defaults");\n    if (opts !== void 0)\n      aopts(opts, title);\n    const merged = Object.assign(/* @__PURE__ */ Object.create(null), defaults, opts);\n    return merged;\n  }\n  function createHasher(hashCons, info = {}) {\n    if (typeof hashCons !== "function")\n      throw new TypeError(\'"hashCons" expected function, got type=\' + typeof hashCons);\n    info = checkOpts({}, info, "info");\n    const hashC = (msg, opts) => hashCons(opts).update(msg).digest();\n    const tmp = hashCons(void 0);\n    hashC.outputLen = tmp.outputLen;\n    hashC.blockLen = tmp.blockLen;\n    hashC.canXOF = tmp.canXOF;\n    hashC.create = (opts) => hashCons(opts);\n    Object.assign(hashC, info);\n    return Object.freeze(hashC);\n  }\n  var oidNist = (suffix) => ({\n    // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.\n    // Larger suffix values would need base-128 OID encoding and a different length byte.\n    oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])\n  });\n\n  // node_modules/@noble/hashes/hmac.js\n  var _HMAC = class {\n    oHash;\n    iHash;\n    blockLen;\n    outputLen;\n    canXOF = false;\n    finished = false;\n    destroyed = false;\n    constructor(hash, key) {\n      ahash(hash);\n      abytes(key, void 0, "key");\n      this.iHash = hash.create();\n      if (typeof this.iHash.update !== "function")\n        throw new Error("expected Hash instance");\n      this.blockLen = this.iHash.blockLen;\n      this.outputLen = this.iHash.outputLen;\n      const blockLen = this.blockLen;\n      const pad = new Uint8Array(blockLen);\n      pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);\n      for (let i = 0; i < pad.length; i++)\n        pad[i] ^= 54;\n      this.iHash.update(pad);\n      this.oHash = hash.create();\n      for (let i = 0; i < pad.length; i++)\n        pad[i] ^= 54 ^ 92;\n      this.oHash.update(pad);\n      clean(pad);\n    }\n    update(buf) {\n      aexists(this);\n      this.iHash.update(buf);\n      return this;\n    }\n    digestInto(out) {\n      aexists(this);\n      aoutput(out, this);\n      this.finished = true;\n      const buf = out.subarray(0, this.outputLen);\n      this.iHash.digestInto(buf);\n      this.oHash.update(buf);\n      this.oHash.digestInto(buf);\n      this.destroy();\n    }\n    digest() {\n      const out = new Uint8Array(this.oHash.outputLen);\n      this.digestInto(out);\n      return out;\n    }\n    _cloneInto(to) {\n      to ||= Object.create(Object.getPrototypeOf(this), {});\n      const { oHash, iHash, finished, destroyed, blockLen, outputLen, canXOF } = this;\n      to = to;\n      to.finished = finished;\n      to.destroyed = destroyed;\n      to.blockLen = blockLen;\n      to.outputLen = outputLen;\n      to.canXOF = canXOF;\n      to.oHash = oHash._cloneInto(to.oHash);\n      to.iHash = iHash._cloneInto(to.iHash);\n      return to;\n    }\n    clone() {\n      return this._cloneInto();\n    }\n    destroy() {\n      this.destroyed = true;\n      this.oHash.destroy();\n      this.iHash.destroy();\n    }\n  };\n  var hmac = /* @__PURE__ */ (() => {\n    const hmac_ = ((hash, key, message) => new _HMAC(hash, key).update(message).digest());\n    hmac_.create = (hash, key) => new _HMAC(hash, key);\n    return hmac_;\n  })();\n\n  // node_modules/@noble/hashes/_u64.js\n  var fromNumH = (n) => n / 2 ** 32 | 0;\n  var fromNumL = (n) => n >>> 0;\n  function setU64FromNum(view, byteOffset, n, isLE) {\n    const h = fromNumH(n);\n    const l = fromNumL(n);\n    view.setUint32(byteOffset, isLE ? l : h, isLE);\n    view.setUint32(byteOffset + 4, isLE ? h : l, isLE);\n  }\n\n  // node_modules/@noble/hashes/_md.js\n  function Chi(a, b, c) {\n    return a & b ^ ~a & c;\n  }\n  function Maj(a, b, c) {\n    return a & b ^ a & c ^ b & c;\n  }\n  var HashMD = class {\n    blockLen;\n    outputLen;\n    canXOF = false;\n    padOffset;\n    isLE;\n    // For partial updates less than block size\n    buffer;\n    view;\n    finished = false;\n    length = 0;\n    pos = 0;\n    destroyed = false;\n    constructor(blockLen, outputLen, padOffset, isLE) {\n      this.blockLen = blockLen;\n      this.outputLen = outputLen;\n      this.padOffset = padOffset;\n      this.isLE = isLE;\n      this.buffer = new Uint8Array(blockLen);\n      this.view = createView(this.buffer);\n    }\n    update(data) {\n      aexists(this);\n      abytes(data);\n      const { view, buffer, blockLen } = this;\n      const len = data.length;\n      let processed = false;\n      for (let pos = 0; pos < len; ) {\n        const take = Math.min(blockLen - this.pos, len - pos);\n        if (take === blockLen) {\n          const dataView = createView(data);\n          for (; blockLen <= len - pos; pos += blockLen)\n            this.process(dataView, pos);\n          processed = true;\n          continue;\n        }\n        buffer.set(pos === 0 && take === len ? data : data.subarray(pos, pos + take), this.pos);\n        this.pos += take;\n        pos += take;\n        if (this.pos === blockLen) {\n          this.process(view, 0);\n          this.pos = 0;\n          processed = true;\n        }\n      }\n      this.length += data.length;\n      if (processed)\n        this.roundClean();\n      return this;\n    }\n    digestInto(out) {\n      aexists(this);\n      aoutput(out, this);\n      this.finished = true;\n      const { buffer, view, blockLen, isLE } = this;\n      let { pos } = this;\n      buffer[pos++] = 128;\n      buffer.fill(0, pos);\n      if (this.padOffset > blockLen - pos) {\n        this.process(view, 0);\n        buffer.fill(0);\n      }\n      setU64FromNum(view, blockLen - 8, this.length * 8, isLE);\n      this.process(view, 0);\n      this.roundClean();\n      const oview = out === buffer ? view : createView(out);\n      const len = this.outputLen;\n      const outLen = len / 4;\n      const state = this.get();\n      if (len % 4 || outLen > state.length)\n        throw new Error("invalid outputLen");\n      for (let i = 0; i < outLen; i++)\n        oview.setUint32(4 * i, state[i], isLE);\n    }\n    digest() {\n      const { buffer, outputLen } = this;\n      this.digestInto(buffer);\n      const res = buffer.slice(0, outputLen);\n      this.destroy();\n      return res;\n    }\n    _cloneIntoMeta(to) {\n      const { buffer, length: length2, finished, destroyed, pos } = this;\n      to.destroyed = destroyed;\n      to.finished = finished;\n      to.length = length2;\n      to.pos = pos;\n      if (pos)\n        to.buffer.set(buffer);\n      return to;\n    }\n    clone() {\n      return this._cloneInto();\n    }\n  };\n  var SHA256_IV = /* @__PURE__ */ Uint32Array.from([\n    1779033703,\n    3144134277,\n    1013904242,\n    2773480762,\n    1359893119,\n    2600822924,\n    528734635,\n    1541459225\n  ]);\n\n  // node_modules/@noble/hashes/sha2.js\n  var SHA256_K = /* @__PURE__ */ Uint32Array.from([\n    1116352408,\n    1899447441,\n    3049323471,\n    3921009573,\n    961987163,\n    1508970993,\n    2453635748,\n    2870763221,\n    3624381080,\n    310598401,\n    607225278,\n    1426881987,\n    1925078388,\n    2162078206,\n    2614888103,\n    3248222580,\n    3835390401,\n    4022224774,\n    264347078,\n    604807628,\n    770255983,\n    1249150122,\n    1555081692,\n    1996064986,\n    2554220882,\n    2821834349,\n    2952996808,\n    3210313671,\n    3336571891,\n    3584528711,\n    113926993,\n    338241895,\n    666307205,\n    773529912,\n    1294757372,\n    1396182291,\n    1695183700,\n    1986661051,\n    2177026350,\n    2456956037,\n    2730485921,\n    2820302411,\n    3259730800,\n    3345764771,\n    3516065817,\n    3600352804,\n    4094571909,\n    275423344,\n    430227734,\n    506948616,\n    659060556,\n    883997877,\n    958139571,\n    1322822218,\n    1537002063,\n    1747873779,\n    1955562222,\n    2024104815,\n    2227730452,\n    2361852424,\n    2428436474,\n    2756734187,\n    3204031479,\n    3329325298\n  ]);\n  var SHA256_W = /* @__PURE__ */ new Uint32Array(64);\n  var SHA2_32B = class extends HashMD {\n    // We cannot use array here since array allows indexing by variable\n    // which means optimizer/compiler cannot use registers.\n    // Numeric initializers matter: starting the fields as `undefined` changes\n    // V8\'s field representation and makes sha256 3x slower (measured).\n    A = 0;\n    B = 0;\n    C = 0;\n    D = 0;\n    E = 0;\n    F = 0;\n    G = 0;\n    H = 0;\n    constructor(outputLen, IV) {\n      super(64, outputLen, 8, false);\n      this.A = IV[0] | 0;\n      this.B = IV[1] | 0;\n      this.C = IV[2] | 0;\n      this.D = IV[3] | 0;\n      this.E = IV[4] | 0;\n      this.F = IV[5] | 0;\n      this.G = IV[6] | 0;\n      this.H = IV[7] | 0;\n    }\n    get() {\n      const { A, B, C, D, E, F, G, H } = this;\n      return [A, B, C, D, E, F, G, H];\n    }\n    // prettier-ignore\n    set(A, B, C, D, E, F, G, H) {\n      this.A = A | 0;\n      this.B = B | 0;\n      this.C = C | 0;\n      this.D = D | 0;\n      this.E = E | 0;\n      this.F = F | 0;\n      this.G = G | 0;\n      this.H = H | 0;\n    }\n    _cloneInto(to) {\n      (to ||= new this.constructor()).set(...this.get());\n      return this._cloneIntoMeta(to);\n    }\n    process(view, offset) {\n      for (let i = 0; i < 16; i++, offset += 4)\n        SHA256_W[i] = view.getUint32(offset, false);\n      for (let i = 16; i < 64; i++) {\n        const W15 = SHA256_W[i - 15];\n        const W2 = SHA256_W[i - 2];\n        const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;\n        const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;\n        SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;\n      }\n      let { A, B, C, D, E, F, G, H } = this;\n      for (let i = 0; i < 64; i++) {\n        const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);\n        const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;\n        const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);\n        const T2 = sigma0 + Maj(A, B, C) | 0;\n        H = G;\n        G = F;\n        F = E;\n        E = D + T1 | 0;\n        D = C;\n        C = B;\n        B = A;\n        A = T1 + T2 | 0;\n      }\n      A = A + this.A | 0;\n      B = B + this.B | 0;\n      C = C + this.C | 0;\n      D = D + this.D | 0;\n      E = E + this.E | 0;\n      F = F + this.F | 0;\n      G = G + this.G | 0;\n      H = H + this.H | 0;\n      this.set(A, B, C, D, E, F, G, H);\n    }\n    roundClean() {\n      clean(SHA256_W);\n    }\n    destroy() {\n      this.destroyed = true;\n      this.set(0, 0, 0, 0, 0, 0, 0, 0);\n      clean(this.buffer);\n    }\n  };\n  var _SHA256 = class extends SHA2_32B {\n    constructor() {\n      super(32, SHA256_IV);\n    }\n  };\n  var sha256 = /* @__PURE__ */ createHasher(\n    () => new _SHA256(),\n    /* @__PURE__ */ oidNist(1)\n  );\n\n  // node_modules/valibot/dist/index.mjs\n  var store$4;\n  var DEFAULT_CONFIG = {\n    lang: void 0,\n    message: void 0,\n    abortEarly: void 0,\n    abortPipeEarly: void 0\n  };\n  // @__NO_SIDE_EFFECTS__\n  function getGlobalConfig(config$1) {\n    if (!config$1 && !store$4) return DEFAULT_CONFIG;\n    return {\n      lang: config$1?.lang ?? store$4?.lang,\n      message: config$1?.message,\n      abortEarly: config$1?.abortEarly ?? store$4?.abortEarly,\n      abortPipeEarly: config$1?.abortPipeEarly ?? store$4?.abortPipeEarly\n    };\n  }\n  var store$3;\n  // @__NO_SIDE_EFFECTS__\n  function getGlobalMessage(lang) {\n    return store$3?.get(lang);\n  }\n  var store$2;\n  // @__NO_SIDE_EFFECTS__\n  function getSchemaMessage(lang) {\n    return store$2?.get(lang);\n  }\n  var store$1;\n  // @__NO_SIDE_EFFECTS__\n  function getSpecificMessage(reference, lang) {\n    return store$1?.get(reference)?.get(lang);\n  }\n  // @__NO_SIDE_EFFECTS__\n  function _stringify(input) {\n    const type = typeof input;\n    if (type === "string") return `"${input}"`;\n    if (type === "number" || type === "bigint" || type === "boolean") return `${input}`;\n    if (type === "object" || type === "function") return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";\n    return type;\n  }\n  function _addIssue(context, label, dataset, config$1, other) {\n    const input = other && "input" in other ? other.input : dataset.value;\n    const expected = other?.expected ?? context.expects ?? null;\n    const received = other?.received ?? /* @__PURE__ */ _stringify(input);\n    const issue = {\n      kind: context.kind,\n      type: context.type,\n      input,\n      expected,\n      received,\n      message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,\n      requirement: context.requirement,\n      path: other?.path,\n      issues: other?.issues,\n      lang: config$1.lang,\n      abortEarly: config$1.abortEarly,\n      abortPipeEarly: config$1.abortPipeEarly\n    };\n    const isSchema = context.kind === "schema";\n    const message$1 = other?.message ?? context.message ?? /* @__PURE__ */ getSpecificMessage(context.reference, issue.lang) ?? (isSchema ? /* @__PURE__ */ getSchemaMessage(issue.lang) : null) ?? config$1.message ?? /* @__PURE__ */ getGlobalMessage(issue.lang);\n    if (message$1 !== void 0) issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;\n    if (isSchema) dataset.typed = false;\n    if (dataset.issues) dataset.issues.push(issue);\n    else dataset.issues = [issue];\n  }\n  // @__NO_SIDE_EFFECTS__\n  function _isSameValueZero(value1, value2) {\n    return value1 === value2 || Number.isNaN(value1) && Number.isNaN(value2);\n  }\n  // @__NO_SIDE_EFFECTS__\n  function _isValidObjectKey(object$1, key) {\n    return Object.prototype.hasOwnProperty.call(object$1, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";\n  }\n  // @__NO_SIDE_EFFECTS__\n  function _joinExpects(values$1, separator) {\n    const list = [...new Set(values$1)];\n    if (list.length > 1) return `(${list.join(` ${separator} `)})`;\n    return list[0] ?? "never";\n  }\n  function _standardSchema(schema) {\n    schema["~standard"] = {\n      version: 1,\n      vendor: "valibot",\n      validate: (value$1) => schema["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig())\n    };\n    return schema;\n  }\n  var UUID_REGEX = /^[\\da-f]{8}(?:-[\\da-f]{4}){3}-[\\da-f]{12}$/iu;\n  // @__NO_SIDE_EFFECTS__\n  function check(requirement, message$1) {\n    return {\n      kind: "validation",\n      type: "check",\n      reference: check,\n      async: false,\n      expects: null,\n      requirement,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "input", dataset, config$1);\n        return dataset;\n      }\n    };\n  }\n  // @__NO_SIDE_EFFECTS__\n  function description(description_) {\n    return {\n      kind: "metadata",\n      type: "description",\n      reference: description,\n      description: description_\n    };\n  }\n  // @__NO_SIDE_EFFECTS__\n  function finite(message$1) {\n    return {\n      kind: "validation",\n      type: "finite",\n      reference: finite,\n      async: false,\n      expects: null,\n      requirement: Number.isFinite,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "finite", dataset, config$1);\n        return dataset;\n      }\n    };\n  }\n  // @__NO_SIDE_EFFECTS__\n  function integer(message$1) {\n    return {\n      kind: "validation",\n      type: "integer",\n      reference: integer,\n      async: false,\n      expects: null,\n      requirement: Number.isInteger,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "integer", dataset, config$1);\n        return dataset;\n      }\n    };\n  }\n  // @__NO_SIDE_EFFECTS__\n  function length(requirement, message$1) {\n    return {\n      kind: "validation",\n      type: "length",\n      reference: length,\n      async: false,\n      expects: `${requirement}`,\n      requirement,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (dataset.typed && dataset.value.length !== this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });\n        return dataset;\n      }\n    };\n  }\n  // @__NO_SIDE_EFFECTS__\n  function maxLength(requirement, message$1) {\n    return {\n      kind: "validation",\n      type: "max_length",\n      reference: maxLength,\n      async: false,\n      expects: `<=${requirement}`,\n      requirement,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (dataset.typed && dataset.value.length > this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });\n        return dataset;\n      }\n    };\n  }\n  // @__NO_SIDE_EFFECTS__\n  function maxValue(requirement, message$1) {\n    return {\n      kind: "validation",\n      type: "max_value",\n      reference: maxValue,\n      async: false,\n      expects: `<=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,\n      requirement,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (dataset.typed && !(dataset.value <= this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });\n        return dataset;\n      }\n    };\n  }\n  // @__NO_SIDE_EFFECTS__\n  function minLength(requirement, message$1) {\n    return {\n      kind: "validation",\n      type: "min_length",\n      reference: minLength,\n      async: false,\n      expects: `>=${requirement}`,\n      requirement,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (dataset.typed && dataset.value.length < this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });\n        return dataset;\n      }\n    };\n  }\n  // @__NO_SIDE_EFFECTS__\n  function minValue(requirement, message$1) {\n    return {\n      kind: "validation",\n      type: "min_value",\n      reference: minValue,\n      async: false,\n      expects: `>=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,\n      requirement,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (dataset.typed && !(dataset.value >= this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });\n        return dataset;\n      }\n    };\n  }\n  // @__NO_SIDE_EFFECTS__\n  function regex(requirement, message$1) {\n    return {\n      kind: "validation",\n      type: "regex",\n      reference: regex,\n      async: false,\n      expects: `${requirement}`,\n      requirement,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "format", dataset, config$1);\n        return dataset;\n      }\n    };\n  }\n  // @__NO_SIDE_EFFECTS__\n  function uuid(message$1) {\n    return {\n      kind: "validation",\n      type: "uuid",\n      reference: uuid,\n      async: false,\n      expects: null,\n      requirement: UUID_REGEX,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "UUID", dataset, config$1);\n        return dataset;\n      }\n    };\n  }\n  var ABORT_EARLY_CONFIG = { abortEarly: true };\n  // @__NO_SIDE_EFFECTS__\n  function getFallback(schema, dataset, config$1) {\n    return typeof schema.fallback === "function" ? schema.fallback(dataset, config$1) : schema.fallback;\n  }\n  // @__NO_SIDE_EFFECTS__\n  function getDefault(schema, dataset, config$1) {\n    return typeof schema.default === "function" ? schema.default(dataset, config$1) : schema.default;\n  }\n  // @__NO_SIDE_EFFECTS__\n  function array(item, message$1) {\n    return _standardSchema({\n      kind: "schema",\n      type: "array",\n      reference: array,\n      expects: "Array",\n      async: false,\n      item,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        const input = dataset.value;\n        if (Array.isArray(input)) {\n          dataset.typed = true;\n          dataset.value = [];\n          for (let key = 0; key < input.length; key++) {\n            const value$1 = input[key];\n            const itemDataset = this.item["~run"]({ value: value$1 }, config$1);\n            if (itemDataset.issues) {\n              const pathItem = {\n                type: "array",\n                origin: "value",\n                input,\n                key,\n                value: value$1\n              };\n              for (const issue of itemDataset.issues) {\n                if (issue.path) issue.path.unshift(pathItem);\n                else issue.path = [pathItem];\n                dataset.issues?.push(issue);\n              }\n              if (!dataset.issues) dataset.issues = itemDataset.issues;\n              if (config$1.abortEarly) {\n                dataset.typed = false;\n                break;\n              }\n            }\n            if (!itemDataset.typed) dataset.typed = false;\n            dataset.value.push(itemDataset.value);\n          }\n        } else _addIssue(this, "type", dataset, config$1);\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function boolean(message$1) {\n    return _standardSchema({\n      kind: "schema",\n      type: "boolean",\n      reference: boolean,\n      expects: "boolean",\n      async: false,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (typeof dataset.value === "boolean") dataset.typed = true;\n        else _addIssue(this, "type", dataset, config$1);\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function literal(literal_, message$1) {\n    return _standardSchema({\n      kind: "schema",\n      type: "literal",\n      reference: literal,\n      expects: /* @__PURE__ */ _stringify(literal_),\n      async: false,\n      literal: literal_,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (/* @__PURE__ */ _isSameValueZero(dataset.value, this.literal)) dataset.typed = true;\n        else _addIssue(this, "type", dataset, config$1);\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function nullable(wrapped, default_) {\n    return _standardSchema({\n      kind: "schema",\n      type: "nullable",\n      reference: nullable,\n      expects: `(${wrapped.expects} | null)`,\n      async: false,\n      wrapped,\n      default: default_,\n      "~run"(dataset, config$1) {\n        if (dataset.value === null) {\n          if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);\n          if (dataset.value === null) {\n            dataset.typed = true;\n            return dataset;\n          }\n        }\n        return this.wrapped["~run"](dataset, config$1);\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function number(message$1) {\n    return _standardSchema({\n      kind: "schema",\n      type: "number",\n      reference: number,\n      expects: "number",\n      async: false,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (typeof dataset.value === "number" && !isNaN(dataset.value)) dataset.typed = true;\n        else _addIssue(this, "type", dataset, config$1);\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function optional(wrapped, default_) {\n    return _standardSchema({\n      kind: "schema",\n      type: "optional",\n      reference: optional,\n      expects: `(${wrapped.expects} | undefined)`,\n      async: false,\n      wrapped,\n      default: default_,\n      "~run"(dataset, config$1) {\n        if (dataset.value === void 0) {\n          if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);\n          if (dataset.value === void 0) {\n            dataset.typed = true;\n            return dataset;\n          }\n        }\n        return this.wrapped["~run"](dataset, config$1);\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function picklist(options, message$1) {\n    return _standardSchema({\n      kind: "schema",\n      type: "picklist",\n      reference: picklist,\n      expects: /* @__PURE__ */ _joinExpects(options.map(_stringify), "|"),\n      async: false,\n      options,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (this.options.includes(dataset.value)) dataset.typed = true;\n        else _addIssue(this, "type", dataset, config$1);\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function record(key, value$1, message$1) {\n    return _standardSchema({\n      kind: "schema",\n      type: "record",\n      reference: record,\n      expects: "Object",\n      async: false,\n      key,\n      value: value$1,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        const input = dataset.value;\n        if (input && typeof input === "object") {\n          dataset.typed = true;\n          dataset.value = {};\n          for (const entryKey in input) if (/* @__PURE__ */ _isValidObjectKey(input, entryKey)) {\n            const entryValue = input[entryKey];\n            const keyDataset = this.key["~run"]({ value: entryKey }, config$1);\n            if (keyDataset.issues) {\n              const pathItem = {\n                type: "object",\n                origin: "key",\n                input,\n                key: entryKey,\n                value: entryValue\n              };\n              for (const issue of keyDataset.issues) {\n                issue.path = [pathItem];\n                dataset.issues?.push(issue);\n              }\n              if (!dataset.issues) dataset.issues = keyDataset.issues;\n              if (config$1.abortEarly) {\n                dataset.typed = false;\n                break;\n              }\n            }\n            const valueDataset = this.value["~run"]({ value: entryValue }, config$1);\n            if (valueDataset.issues) {\n              const pathItem = {\n                type: "object",\n                origin: "value",\n                input,\n                key: entryKey,\n                value: entryValue\n              };\n              for (const issue of valueDataset.issues) {\n                if (issue.path) issue.path.unshift(pathItem);\n                else issue.path = [pathItem];\n                dataset.issues?.push(issue);\n              }\n              if (!dataset.issues) dataset.issues = valueDataset.issues;\n              if (config$1.abortEarly) {\n                dataset.typed = false;\n                break;\n              }\n            }\n            if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;\n            if (keyDataset.typed) dataset.value[keyDataset.value] = valueDataset.value;\n          }\n        } else _addIssue(this, "type", dataset, config$1);\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function strictObject(entries$1, message$1) {\n    return _standardSchema({\n      kind: "schema",\n      type: "strict_object",\n      reference: strictObject,\n      expects: "Object",\n      async: false,\n      entries: entries$1,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        const input = dataset.value;\n        if (input && typeof input === "object") {\n          dataset.typed = true;\n          dataset.value = {};\n          for (const key in this.entries) {\n            const valueSchema2 = this.entries[key];\n            if (key in input || (valueSchema2.type === "exact_optional" || valueSchema2.type === "optional" || valueSchema2.type === "nullish") && valueSchema2.default !== void 0) {\n              const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema2);\n              const valueDataset = valueSchema2["~run"]({ value: value$1 }, config$1);\n              if (valueDataset.issues) {\n                const pathItem = {\n                  type: "object",\n                  origin: "value",\n                  input,\n                  key,\n                  value: value$1\n                };\n                for (const issue of valueDataset.issues) {\n                  if (issue.path) issue.path.unshift(pathItem);\n                  else issue.path = [pathItem];\n                  dataset.issues?.push(issue);\n                }\n                if (!dataset.issues) dataset.issues = valueDataset.issues;\n                if (config$1.abortEarly) {\n                  dataset.typed = false;\n                  break;\n                }\n              }\n              if (!valueDataset.typed) dataset.typed = false;\n              dataset.value[key] = valueDataset.value;\n            } else if (valueSchema2.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema2);\n            else if (valueSchema2.type !== "exact_optional" && valueSchema2.type !== "optional" && valueSchema2.type !== "nullish") {\n              _addIssue(this, "key", dataset, config$1, {\n                input: void 0,\n                expected: `"${key}"`,\n                path: [{\n                  type: "object",\n                  origin: "key",\n                  input,\n                  key,\n                  value: input[key]\n                }]\n              });\n              if (config$1.abortEarly) break;\n            }\n          }\n          if (!dataset.issues || !config$1.abortEarly) {\n            for (const key in input) if (!Object.prototype.hasOwnProperty.call(this.entries, key)) {\n              _addIssue(this, "key", dataset, config$1, {\n                input: key,\n                expected: "never",\n                path: [{\n                  type: "object",\n                  origin: "key",\n                  input,\n                  key,\n                  value: input[key]\n                }]\n              });\n              break;\n            }\n          }\n        } else _addIssue(this, "type", dataset, config$1);\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function string(message$1) {\n    return _standardSchema({\n      kind: "schema",\n      type: "string",\n      reference: string,\n      expects: "string",\n      async: false,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        if (typeof dataset.value === "string") dataset.typed = true;\n        else _addIssue(this, "type", dataset, config$1);\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function _subIssues(datasets) {\n    let issues;\n    if (datasets) for (const dataset of datasets) if (issues) for (const issue of dataset.issues) issues.push(issue);\n    else issues = dataset.issues;\n    return issues;\n  }\n  // @__NO_SIDE_EFFECTS__\n  function union(options, message$1) {\n    return _standardSchema({\n      kind: "schema",\n      type: "union",\n      reference: union,\n      expects: /* @__PURE__ */ _joinExpects(options.map((option) => option.expects), "|"),\n      async: false,\n      options,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        let validDataset;\n        let typedDatasets;\n        let untypedDatasets;\n        for (const schema of this.options) {\n          const optionDataset = schema["~run"]({ value: dataset.value }, config$1);\n          if (optionDataset.typed) if (optionDataset.issues) if (typedDatasets) typedDatasets.push(optionDataset);\n          else typedDatasets = [optionDataset];\n          else {\n            validDataset = optionDataset;\n            break;\n          }\n          else if (untypedDatasets) untypedDatasets.push(optionDataset);\n          else untypedDatasets = [optionDataset];\n        }\n        if (validDataset) return validDataset;\n        if (typedDatasets) {\n          if (typedDatasets.length === 1) return typedDatasets[0];\n          _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(typedDatasets) });\n          dataset.typed = true;\n        } else if (untypedDatasets?.length === 1) return untypedDatasets[0];\n        else _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(untypedDatasets) });\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function unknown() {\n    return _standardSchema({\n      kind: "schema",\n      type: "unknown",\n      reference: unknown,\n      expects: "unknown",\n      async: false,\n      "~run"(dataset) {\n        dataset.typed = true;\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function variant(key, options, message$1) {\n    return _standardSchema({\n      kind: "schema",\n      type: "variant",\n      reference: variant,\n      expects: "Object",\n      async: false,\n      key,\n      options,\n      message: message$1,\n      "~run"(dataset, config$1) {\n        const input = dataset.value;\n        if (input && typeof input === "object") {\n          let outputDataset;\n          let maxDiscriminatorPriority = 0;\n          let invalidDiscriminatorKey = this.key;\n          let expectedDiscriminators = [];\n          const parseOptions = (variant$1, allKeys) => {\n            for (const schema of variant$1.options) {\n              if (schema.type === "variant") parseOptions(schema, new Set(allKeys).add(schema.key));\n              else {\n                let keysAreValid = true;\n                let currentPriority = 0;\n                for (const currentKey of allKeys) {\n                  const discriminatorSchema = schema.entries[currentKey];\n                  if (currentKey in input ? discriminatorSchema["~run"]({\n                    typed: false,\n                    value: input[currentKey]\n                  }, ABORT_EARLY_CONFIG).issues : discriminatorSchema.type !== "exact_optional" && discriminatorSchema.type !== "optional" && discriminatorSchema.type !== "nullish") {\n                    keysAreValid = false;\n                    if (invalidDiscriminatorKey !== currentKey && (maxDiscriminatorPriority < currentPriority || maxDiscriminatorPriority === currentPriority && currentKey in input && !(invalidDiscriminatorKey in input))) {\n                      maxDiscriminatorPriority = currentPriority;\n                      invalidDiscriminatorKey = currentKey;\n                      expectedDiscriminators = [];\n                    }\n                    if (invalidDiscriminatorKey === currentKey) expectedDiscriminators.push(schema.entries[currentKey].expects);\n                    break;\n                  }\n                  currentPriority++;\n                }\n                if (keysAreValid) {\n                  const optionDataset = schema["~run"]({ value: input }, config$1);\n                  if (!outputDataset || !outputDataset.typed && optionDataset.typed) outputDataset = optionDataset;\n                }\n              }\n              if (outputDataset && !outputDataset.issues) break;\n            }\n          };\n          parseOptions(this, /* @__PURE__ */ new Set([this.key]));\n          if (outputDataset) return outputDataset;\n          _addIssue(this, "type", dataset, config$1, {\n            input: input[invalidDiscriminatorKey],\n            expected: /* @__PURE__ */ _joinExpects(expectedDiscriminators, "|"),\n            path: [{\n              type: "object",\n              origin: "value",\n              input,\n              key: invalidDiscriminatorKey,\n              value: input[invalidDiscriminatorKey]\n            }]\n          });\n        } else _addIssue(this, "type", dataset, config$1);\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function pipe(...pipe$1) {\n    return _standardSchema({\n      ...pipe$1[0],\n      pipe: pipe$1,\n      "~run"(dataset, config$1) {\n        for (const item of pipe$1) if (item.kind !== "metadata") {\n          if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {\n            dataset.typed = false;\n            break;\n          }\n          if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly) dataset = item["~run"](dataset, config$1);\n        }\n        return dataset;\n      }\n    });\n  }\n  // @__NO_SIDE_EFFECTS__\n  function safeParse(schema, input, config$1) {\n    const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));\n    return {\n      typed: dataset.typed,\n      success: !dataset.issues,\n      output: dataset.value,\n      issues: dataset.issues\n    };\n  }\n\n  // src/protocol/prototype.ts\n  var id = pipe(string(), minLength(1), maxLength(200));\n  var realId = pipe(id, regex(/^[^$]/, "Use confirmed node IDs"));\n  var index = pipe(number(), integer(), minValue(0), maxValue(999));\n  var guarded = { nodeId: realId, expectedFingerprint: id };\n  var seconds = pipe(number(), minValue(0), maxValue(10));\n  var triggerSeconds = pipe(\n    number(),\n    minValue(0),\n    maxValue(60),\n    description(\n      "Seconds in the native Plugin API; 1.5 is 1500ms in the Figma editor"\n    )\n  );\n  var transition = nullable(\n    strictObject({\n      type: picklist(["DISSOLVE", "SMART_ANIMATE"]),\n      duration: seconds,\n      easing: strictObject({\n        type: picklist([\n          "LINEAR",\n          "EASE_IN",\n          "EASE_OUT",\n          "EASE_IN_AND_OUT",\n          "EASE_IN_BACK",\n          "EASE_OUT_BACK",\n          "EASE_IN_AND_OUT_BACK",\n          "GENTLE",\n          "QUICK",\n          "BOUNCY",\n          "SLOW"\n        ])\n      })\n    })\n  );\n  var triggerSchema = variant("type", [\n    strictObject({\n      type: picklist(["ON_CLICK", "ON_HOVER", "ON_PRESS", "ON_DRAG"])\n    }),\n    strictObject({ type: literal("AFTER_TIMEOUT"), timeout: triggerSeconds }),\n    strictObject({\n      type: picklist(["MOUSE_UP", "MOUSE_DOWN"]),\n      delay: triggerSeconds\n    }),\n    strictObject({\n      type: picklist(["MOUSE_ENTER", "MOUSE_LEAVE"]),\n      delay: triggerSeconds,\n      deprecatedVersion: optional(literal(false), false)\n    }),\n    strictObject({\n      type: literal("ON_KEY_DOWN"),\n      device: literal("KEYBOARD"),\n      keyCodes: pipe(\n        array(pipe(number(), integer(), minValue(0), maxValue(255))),\n        minLength(1),\n        maxLength(4),\n        check((keys) => new Set(keys).size === keys.length, "Duplicate keys")\n      )\n    })\n  ]);\n  var resolved = picklist(["BOOLEAN", "FLOAT", "STRING", "COLOR"]);\n  var channel = pipe(number(), minValue(0), maxValue(1));\n  function valueSchema(depth) {\n    const literals = [\n      strictObject({\n        type: literal("BOOLEAN"),\n        resolvedType: literal("BOOLEAN"),\n        value: boolean()\n      }),\n      strictObject({\n        type: literal("FLOAT"),\n        resolvedType: literal("FLOAT"),\n        value: pipe(number(), minValue(-1e12), maxValue(1e12))\n      }),\n      strictObject({\n        type: literal("STRING"),\n        resolvedType: literal("STRING"),\n        value: pipe(string(), maxLength(4096))\n      }),\n      strictObject({\n        type: literal("COLOR"),\n        resolvedType: literal("COLOR"),\n        value: strictObject({\n          r: channel,\n          g: channel,\n          b: channel,\n          a: optional(channel)\n        })\n      }),\n      strictObject({\n        type: literal("VARIABLE_ALIAS"),\n        resolvedType: resolved,\n        value: strictObject({ type: literal("VARIABLE_ALIAS"), id: realId })\n      })\n    ];\n    if (!depth) return union(literals);\n    return union([\n      ...literals,\n      strictObject({\n        type: literal("EXPRESSION"),\n        resolvedType: resolved,\n        value: strictObject({\n          expressionFunction: picklist([\n            "ADDITION",\n            "SUBTRACTION",\n            "MULTIPLICATION",\n            "DIVISION",\n            "EQUALS",\n            "NOT_EQUAL",\n            "LESS_THAN",\n            "LESS_THAN_OR_EQUAL",\n            "GREATER_THAN",\n            "GREATER_THAN_OR_EQUAL",\n            "AND",\n            "OR",\n            "NEGATE",\n            "NOT"\n          ]),\n          expressionArguments: pipe(\n            array(valueSchema(depth - 1)),\n            minLength(1),\n            maxLength(2)\n          )\n        })\n      })\n    ]);\n  }\n  var prototypeValueSchema = valueSchema(4);\n  function actionSchema(depth) {\n    const leaves = [\n      strictObject({ type: picklist(["BACK", "CLOSE"]) }),\n      strictObject({\n        type: literal("NODE"),\n        destinationId: realId,\n        navigation: picklist(["NAVIGATE", "OVERLAY", "CHANGE_TO"]),\n        transition,\n        resetScrollPosition: optional(boolean(), true),\n        resetVideoPosition: optional(boolean(), false)\n      }),\n      strictObject({\n        type: literal("SET_VARIABLE"),\n        variableId: realId,\n        variableValue: prototypeValueSchema\n      }),\n      strictObject({\n        type: literal("SET_VARIABLE_MODE"),\n        variableCollectionId: realId,\n        variableModeId: realId\n      })\n    ];\n    if (!depth) return union(leaves);\n    return union([\n      ...leaves,\n      strictObject({\n        type: literal("CONDITIONAL"),\n        conditionalBlocks: pipe(\n          array(\n            strictObject({\n              condition: optional(prototypeValueSchema),\n              actions: pipe(\n                array(actionSchema(depth - 1)),\n                minLength(1),\n                maxLength(16)\n              )\n            })\n          ),\n          minLength(1),\n          maxLength(8),\n          check(\n            (blocks) => blocks.every(\n              (block, i) => block.condition !== void 0 || i === blocks.length - 1\n            ),\n            "Else must be last"\n          )\n        )\n      })\n    ]);\n  }\n  var prototypeActionSchema = actionSchema(3);\n  function actionCount(actions) {\n    return actions.reduce(\n      (count, action) => count + 1 + (action.type === "CONDITIONAL" ? action.conditionalBlocks.reduce(\n        (n, b) => n + actionCount(b.actions),\n        0\n      ) : 0),\n      0\n    );\n  }\n  var reactionSchema = pipe(\n    strictObject({\n      trigger: triggerSchema,\n      actions: pipe(\n        array(prototypeActionSchema),\n        minLength(1),\n        maxLength(16)\n      )\n    }),\n    check(\n      (reaction) => actionCount(reaction.actions) <= 64,\n      "At most 64 actions per reaction"\n    )\n  );\n  var PROTOTYPE_FEATURES = [\n    "advanced_triggers",\n    "smart_animate",\n    "change_to",\n    "multiple_actions",\n    "variable_actions",\n    "expressions",\n    "conditionals"\n  ];\n  var prototypeOperations = [\n    strictObject({\n      type: literal("upsert_reaction"),\n      ...guarded,\n      index: optional(index),\n      reaction: reactionSchema\n    }),\n    strictObject({ type: literal("remove_reaction"), ...guarded, index }),\n    strictObject({\n      type: literal("upsert_flow_start"),\n      ...guarded,\n      startNodeId: realId,\n      name: pipe(string(), minLength(1), maxLength(200))\n    }),\n    strictObject({\n      type: literal("remove_flow_start"),\n      ...guarded,\n      startNodeId: realId\n    }),\n    strictObject({\n      type: literal("update_prototype_settings"),\n      ...guarded,\n      patch: strictObject({\n        overflowDirection: picklist(["NONE", "HORIZONTAL", "VERTICAL", "BOTH"])\n      })\n    })\n  ];\n  var prototypeOperationSchema = variant("type", prototypeOperations);\n  var scenarioSchema = strictObject({\n    startNodeId: realId,\n    expectedScreenIds: optional(pipe(array(realId), maxLength(100)), []),\n    requireExitNodeIds: optional(pipe(array(realId), maxLength(100)), [])\n  });\n  var prototypeReadEntries = {\n    scenario: optional(scenarioSchema),\n    sessionId: id,\n    pageId: realId,\n    nodeIds: pipe(array(realId), minLength(1), maxLength(24)),\n    traverseDestinations: optional(boolean(), false),\n    maxNodes: optional(\n      pipe(number(), integer(), minValue(1), maxValue(500)),\n      100\n    ),\n    maxEdges: optional(\n      pipe(number(), integer(), minValue(1), maxValue(1e3)),\n      200\n    )\n  };\n  var prototypeReadSchema = strictObject(prototypeReadEntries);\n  var prototypePlaybackSchema = strictObject({\n    ...prototypeReadEntries,\n    startNodeId: realId,\n    // A supplied URL is a routing hint, never proof of document identity.\n    prototypeUrl: optional(\n      pipe(\n        string(),\n        maxLength(2048),\n        regex(\n          /^https:\\/\\/(?:www\\.)?figma\\.com\\/proto\\/[A-Za-z0-9]+(?:\\/[^\\s?#]*)?(?:\\?[^\\s#]*)?(?:#[^\\s]*)?$/\n        )\n      )\n    )\n  });\n  var PROTOTYPE_OPERATIONS = prototypeOperations.map(\n    (schema) => schema.entries.type.literal\n  );\n\n  // src/protocol/index.ts\n  var VERSION = 3;\n  var PORT = 3846;\n  var MAX_MESSAGE = 512 * 1024;\n  var MAX_RESULT = 256 * 1024;\n  var id2 = pipe(string(), minLength(1), maxLength(200));\n  var finite2 = pipe(number(), finite());\n  var size = pipe(finite2, minValue(0), maxValue(1e5));\n  var text = pipe(string(), maxLength(16384));\n  var fontSchema = strictObject({ family: id2, style: id2 });\n  var color = strictObject({\n    r: pipe(finite2, minValue(0), maxValue(1)),\n    g: pipe(finite2, minValue(0), maxValue(1)),\n    b: pipe(finite2, minValue(0), maxValue(1))\n  });\n  var patchSchema = strictObject({\n    name: optional(pipe(string(), maxLength(512))),\n    x: optional(finite2),\n    y: optional(finite2),\n    width: optional(size),\n    height: optional(size),\n    visible: optional(boolean()),\n    opacity: optional(pipe(finite2, minValue(0), maxValue(1))),\n    cornerRadius: optional(size),\n    clipsContent: optional(boolean()),\n    layoutMode: optional(picklist(["NONE", "HORIZONTAL", "VERTICAL"])),\n    layoutSizingHorizontal: optional(picklist(["FIXED", "HUG", "FILL"])),\n    layoutSizingVertical: optional(picklist(["FIXED", "HUG", "FILL"])),\n    primaryAxisAlignItems: optional(\n      picklist(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"])\n    ),\n    counterAxisAlignItems: optional(\n      picklist(["MIN", "MAX", "CENTER", "BASELINE"])\n    ),\n    paddingTop: optional(size),\n    paddingBottom: optional(size),\n    paddingLeft: optional(size),\n    paddingRight: optional(size),\n    itemSpacing: optional(size),\n    fontSize: optional(pipe(size, minValue(1))),\n    fills: optional(\n      pipe(\n        array(\n          strictObject({\n            type: literal("SOLID"),\n            color,\n            opacity: optional(pipe(finite2, minValue(0), maxValue(1)))\n          })\n        ),\n        maxLength(8)\n      )\n    )\n  });\n  var guarded2 = { nodeId: id2, expectedFingerprint: id2 };\n  var operationSchema = variant("type", [\n    ...prototypeOperations,\n    strictObject({\n      type: literal("create"),\n      key: pipe(string(), regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)),\n      parentId: id2,\n      expectedFingerprint: id2,\n      kind: picklist(["FRAME", "TEXT", "RECTANGLE", "INSTANCE"]),\n      componentId: optional(id2),\n      patch: optional(patchSchema),\n      characters: optional(text),\n      font: optional(fontSchema)\n    }),\n    strictObject({ type: literal("update"), ...guarded2, patch: patchSchema }),\n    strictObject({\n      type: literal("instance_properties"),\n      ...guarded2,\n      properties: record(id2, union([string(), boolean()]))\n    }),\n    strictObject({\n      type: literal("bind_variable"),\n      ...guarded2,\n      field: picklist([\n        "width",\n        "height",\n        "itemSpacing",\n        "paddingTop",\n        "paddingBottom",\n        "paddingLeft",\n        "paddingRight",\n        "opacity",\n        "cornerRadius",\n        "fontSize",\n        "fills"\n      ]),\n      variableId: id2\n    }),\n    strictObject({\n      type: literal("move"),\n      ...guarded2,\n      parentId: id2,\n      parentFingerprint: id2,\n      index: pipe(number(), integer(), minValue(0), maxValue(1e4))\n    }),\n    strictObject({\n      type: literal("set_text"),\n      ...guarded2,\n      characters: text,\n      font: optional(fontSchema)\n    })\n  ]);\n  var SUPPORTED_OPERATIONS = operationSchema.options.map(\n    (schema) => schema.entries.type.literal\n  );\n  var tools = {\n    read_prototype: {\n      description: "Read an explicit page and bounded node/flow graph, including reactions, starts, fingerprints and incomplete/unsupported paths.",\n      schema: prototypeReadSchema,\n      readOnly: true\n    },\n    validate_prototype: {\n      description: "Statically validate a scoped prototype graph. Valid structure is not proof of playback.",\n      schema: prototypeReadSchema,\n      readOnly: true\n    },\n    prepare_prototype_playback: {\n      description: "Prepare a prototype flow and candidate interaction checks for the agent browser/desktop controller. Does not open or play Figma; supplied URLs require document confirmation.",\n      schema: prototypePlaybackSchema,\n      readOnly: true\n    },\n    sessions: {\n      description: "List connected local Figma plugin sessions. Always target an explicit session; file names and foreground tabs are not routing authority.",\n      schema: strictObject({}),\n      readOnly: true\n    },\n    selection: {\n      description: "Read the current page and selected node IDs in an explicit plugin session.",\n      schema: strictObject({ sessionId: id2 }),\n      readOnly: true\n    },\n    read_nodes: {\n      description: "Read bounded design data and mutation fingerprints for explicit nodes. Follow omitted child IDs with another scoped read. Never assume an incomplete response is a complete design.",\n      schema: strictObject({\n        sessionId: id2,\n        nodeIds: pipe(array(id2), minLength(1), maxLength(24)),\n        depth: optional(\n          pipe(number(), integer(), minValue(0), maxValue(8)),\n          2\n        ),\n        maxNodes: optional(\n          pipe(number(), integer(), minValue(1), maxValue(500)),\n          100\n        )\n      }),\n      readOnly: true\n    },\n    read_text: {\n      description: "Read a bounded text range and styled runs. Continue with nextOffset; expectedTextHash rejects a changed text snapshot.",\n      schema: strictObject({\n        sessionId: id2,\n        nodeId: id2,\n        offset: optional(pipe(number(), integer(), minValue(0)), 0),\n        length: optional(\n          pipe(number(), integer(), minValue(1), maxValue(8192)),\n          4096\n        ),\n        expectedTextHash: optional(id2)\n      }),\n      readOnly: true\n    },\n    read_resources: {\n      description: "Resolve explicit local variable/collection/style/component IDs; aliases are preserved with bounded continuation IDs. Remote resources are unavailable.",\n      schema: strictObject({\n        sessionId: id2,\n        variableIds: optional(pipe(array(id2), maxLength(50)), []),\n        styleIds: optional(pipe(array(id2), maxLength(50)), []),\n        componentIds: optional(pipe(array(id2), maxLength(20)), [])\n      }),\n      readOnly: true\n    },\n    export: {\n      description: "Export an explicit node as PNG/SVG, or original image bytes by imageHash. Saves a bounded artifact locally; no remote URLs.",\n      schema: strictObject({\n        sessionId: id2,\n        nodeId: id2,\n        format: picklist(["PNG", "SVG", "IMAGE"]),\n        imageHash: optional(id2),\n        scale: optional(pipe(number(), minValue(0.1), maxValue(4)), 1)\n      }),\n      readOnly: true\n    },\n    design_context: {\n      description: "Read a scoped design subtree. The project MCP adapter adds configured framework and source references for an optional target. Resolve resource IDs and export a preview separately.",\n      schema: strictObject({\n        sessionId: id2,\n        nodeId: id2,\n        target: optional(id2)\n      }),\n      readOnly: true\n    },\n    write_scope: {\n      description: "Acquire or release the sole writer lease for an explicit page/frame. Use the returned generation and leaseId for apply. A lease does not lock out human editors.",\n      schema: strictObject({\n        sessionId: id2,\n        rootId: id2,\n        action: picklist(["acquire", "release"])\n      }),\n      readOnly: false\n    },\n    apply: {\n      description: "Preflight or apply supported operations inside a leased root. Use fresh fingerprints from read_nodes. Results can be partial or unknown; never blindly replay a lost write. Reuse operationId only with the identical payload.",\n      schema: strictObject({\n        sessionId: id2,\n        generation: id2,\n        leaseId: id2,\n        operationId: pipe(string(), uuid()),\n        dryRun: optional(boolean(), false),\n        operations: pipe(\n          array(operationSchema),\n          minLength(1),\n          maxLength(50)\n        )\n      }),\n      readOnly: false\n    },\n    cancel_operation: {\n      description: "Request cancellation at the next safe operation boundary. Inspect operation_status afterward; native calls may finish first.",\n      schema: strictObject({ sessionId: id2, operationId: id2 }),\n      readOnly: false\n    },\n    operation_status: {\n      description: "Read a write receipt without replaying the write. Unknown means inspect the canvas before any new operation.",\n      schema: strictObject({ sessionId: id2, operationId: id2 }),\n      readOnly: true\n    }\n  };\n  var commandSchema = strictObject({\n    type: literal("command"),\n    version: literal(VERSION),\n    requestId: id2,\n    method: picklist([\n      "read_prototype",\n      "validate_prototype",\n      "prepare_prototype_playback",\n      "selection",\n      "read_nodes",\n      "scope",\n      "apply",\n      "operation_status",\n      "read_resources",\n      "export_begin",\n      "export_chunk",\n      "export_release",\n      "cancel_operation",\n      "read_text"\n    ]),\n    params: record(string(), unknown())\n  });\n  var replySchema = strictObject({\n    type: literal("result"),\n    version: literal(VERSION),\n    requestId: id2,\n    ok: boolean(),\n    result: optional(unknown()),\n    error: optional(string())\n  });\n  var helloSchema = strictObject({\n    type: literal("hello"),\n    version: literal(VERSION),\n    token: pipe(string(), length(64)),\n    nonce: id2,\n    documentName: pipe(string(), maxLength(512)),\n    capabilities: pipe(\n      array(picklist(Object.keys(tools))),\n      maxLength(32)\n    ),\n    operations: pipe(array(string()), maxLength(32)),\n    prototypeFeatures: optional(\n      pipe(array(picklist(PROTOTYPE_FEATURES)), maxLength(16)),\n      []\n    )\n  });\n  function utf8(value) {\n    const bytes = [];\n    for (const char of value) {\n      let n = char.codePointAt(0);\n      if (n >= 55296 && n <= 57343) n = 65533;\n      if (n < 128) bytes.push(n);\n      else if (n < 2048) bytes.push(192 | n >> 6, 128 | n & 63);\n      else if (n < 65536)\n        bytes.push(224 | n >> 12, 128 | n >> 6 & 63, 128 | n & 63);\n      else\n        bytes.push(\n          240 | n >> 18,\n          128 | n >> 12 & 63,\n          128 | n >> 6 & 63,\n          128 | n & 63\n        );\n    }\n    return new Uint8Array(bytes);\n  }\n  var BridgeError = class extends Error {\n    constructor(code) {\n      super(code);\n      this.code = code;\n    }\n  };\n  var parse = (schema, input) => {\n    const r = safeParse(schema, input);\n    if (!r.success) throw new BridgeError("INVALID_ARGUMENTS");\n    return r.output;\n  };\n  var proof = (secret, nonce2) => Array.from(\n    hmac(sha256, utf8(secret), utf8(nonce2)),\n    (b) => b.toString(16).padStart(2, "0")\n  ).join("");\n\n  // src/figma/ui.ts\n  var awaiting = /* @__PURE__ */ new Set();\n  var status = document.querySelector("#status");\n  var activity = document.querySelector("#activity");\n  var tokenInput = document.querySelector("#token");\n  var connect = document.querySelector("#connect");\n  var stop = document.querySelector("#stop");\n  var socket;\n  var token = "";\n  var nonce = "";\n  var name = "";\n  var connected = false;\n  var stopped = true;\n  var retry;\n  var note = (message) => {\n    status.textContent = message;\n  };\n  var post = (value) => parent.postMessage({ pluginMessage: value }, "*");\n  var verify = (secret, challenge, value) => proof(secret, challenge) === value;\n  function open() {\n    if (stopped) return;\n    connected = false;\n    nonce = Array.from(\n      crypto.getRandomValues(new Uint8Array(24)),\n      (b) => b.toString(16).padStart(2, "0")\n    ).join("");\n    note("Connecting\\u2026");\n    const port = Number("__FIGMA_BRIDGE_PORT__") || PORT;\n    const ws = new WebSocket(`ws://localhost:${port}/plugin`);\n    socket = ws;\n    ws.onopen = () => {\n      if (socket !== ws) return;\n      ws.send(\n        JSON.stringify({\n          type: "hello",\n          version: VERSION,\n          token,\n          nonce,\n          documentName: name,\n          capabilities: Object.keys(tools),\n          operations: SUPPORTED_OPERATIONS,\n          prototypeFeatures: PROTOTYPE_FEATURES\n        })\n      );\n    };\n    ws.onmessage = async (event) => {\n      if (socket !== ws) return;\n      try {\n        if (typeof event.data !== "string" || event.data.length > MAX_MESSAGE)\n          throw new Error();\n        const data = JSON.parse(event.data);\n        if (data.type === "ready") {\n          if (data.version !== VERSION || typeof data.token !== "string" || !await verify(token, nonce, data.proof))\n            throw new Error();\n          token = data.token;\n          connected = true;\n          tokenInput.value = "";\n          note(`Connected \\xB7 ${name}`);\n          activity.textContent = `Session ${data.sessionId}`;\n          return;\n        }\n        if (!connected) throw new Error();\n        if (data.type === "ping") {\n          ws.send(\'{"type":"pong"}\');\n          return;\n        }\n        const command = parse(commandSchema, data);\n        if (awaiting.size >= 32) throw new Error();\n        awaiting.add(command.requestId);\n        activity.textContent = `Working: ${command.method}`;\n        post(command);\n      } catch {\n        stopped = true;\n        note("Connection rejected. Generate a new pairing token.");\n        ws.close();\n      }\n    };\n    ws.onclose = (event) => {\n      if (socket !== ws) return;\n      if (event.code === 1008) {\n        stopped = true;\n        note(\n          event.reason || "Connection rejected. Refresh plugin and pair again."\n        );\n      }\n      connected = false;\n      if (stopped) return;\n      note("Disconnected \\xB7 reconnecting\\u2026");\n      retry = setTimeout(open, 2e3);\n    };\n    ws.onerror = () => note("Cannot reach the bridge. Check that the local service is running.");\n  }\n  window.onmessage = (event) => {\n    const data = event.data?.pluginMessage;\n    if (!data) return;\n    if (data.type === "metadata") {\n      name = data.documentName;\n      return;\n    }\n    if (data.type === "notice") {\n      note(data.message);\n      return;\n    }\n    if (data.type === "result" && !awaiting.has(data.requestId)) return;\n    if (data.type === "result") {\n      try {\n        parse(replySchema, data);\n      } catch {\n        return;\n      }\n      awaiting.delete(data.requestId);\n    }\n    if (data.type === "result" && connected && socket?.readyState === WebSocket.OPEN) {\n      const message = JSON.stringify(data);\n      if (message.length > MAX_MESSAGE) {\n        socket.send(\n          JSON.stringify({\n            type: "result",\n            version: VERSION,\n            requestId: data.requestId,\n            ok: false,\n            error: "RESULT_TOO_LARGE"\n          })\n        );\n      } else socket.send(message);\n      activity.textContent = data.ok ? `Finished \\xB7 ${data.result?.status ?? "read"}` : `Error \\xB7 ${data.error}`;\n    }\n  };\n  connect.onclick = () => {\n    const value = tokenInput.value.trim();\n    if (!/^[a-f0-9]{64}$/.test(value)) {\n      note("Paste the pairing token from the local bridge.");\n      return;\n    }\n    stopped = true;\n    clearTimeout(retry);\n    socket?.close();\n    token = value;\n    stopped = false;\n    open();\n  };\n  stop.onclick = () => {\n    stopped = true;\n    clearTimeout(retry);\n    socket?.close();\n    note(\n      "Disconnected. A running operation may still finish; inspect its receipt before retrying."\n    );\n  };\n  document.querySelector("#close").onclick = () => {\n    stopped = true;\n    socket?.close();\n    post({ type: "close" });\n  };\n  post({ type: "metadata" });\n})();\n\n    <\/script>\n  </body>\n</html>\n';

  // src/figma/runtime.ts
  async function runBridge() {
    const engine = new BridgeEngine(figma);
    let queue = Promise.resolve();
    let queued = 0;
    figma.showUI(panel_default, {
      width: 360,
      height: 380,
      title: "Figma Bridge",
      themeColors: true
    });
    await new Promise((resolve) => {
      figma.ui.onmessage = (message) => {
        if (!message || typeof message !== "object") return;
        const input = message;
        if (input.type === "close") {
          resolve();
          return;
        }
        if (input.type === "metadata") {
          figma.ui.postMessage({
            type: "metadata",
            documentName: figma.root.name
          });
          return;
        }
        try {
          if (JSON.stringify(message).length > MAX_MESSAGE)
            throw new BridgeError("MESSAGE_TOO_LARGE");
          const command = parse(commandSchema, message);
          if (command.method === "cancel_operation") {
            void engine.dispatch(command.method, command.params).then(
              (result) => figma.ui.postMessage({
                type: "result",
                version: VERSION,
                requestId: command.requestId,
                ok: true,
                result
              })
            );
            return;
          }
          if (queued >= 16) throw new BridgeError("PLUGIN_BUSY");
          queued++;
          queue = queue.then(async () => {
            try {
              const result = await engine.dispatch(
                command.method,
                command.params
              );
              figma.ui.postMessage({
                type: "result",
                version: VERSION,
                requestId: command.requestId,
                ok: true,
                result
              });
            } catch (error) {
              figma.ui.postMessage({
                type: "result",
                version: VERSION,
                requestId: command.requestId,
                ok: false,
                error: error instanceof BridgeError ? error.code : "PLUGIN_ERROR"
              });
            } finally {
              queued--;
            }
          });
        } catch {
          figma.ui.postMessage({
            type: "notice",
            message: "Rejected invalid or oversized command."
          });
        }
      };
    });
    await queue;
  }

  // src/figma/main.ts
  void runBridge().then(() => figma.closePlugin()).catch((error) => figma.closePlugin(String(error)));
})();
