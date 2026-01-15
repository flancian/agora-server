import {
  __esm
} from "./chunk-MBB4SMMY.js";

// node_modules/d3-selection/src/namespaces.js
var xhtml, namespaces_default;
var init_namespaces = __esm({
  "node_modules/d3-selection/src/namespaces.js"() {
    xhtml = "http://www.w3.org/1999/xhtml";
    namespaces_default = {
      svg: "http://www.w3.org/2000/svg",
      xhtml,
      xlink: "http://www.w3.org/1999/xlink",
      xml: "http://www.w3.org/XML/1998/namespace",
      xmlns: "http://www.w3.org/2000/xmlns/"
    };
  }
});

// node_modules/d3-selection/src/namespace.js
function namespace_default(name) {
  var prefix = name += "", i2 = prefix.indexOf(":");
  if (i2 >= 0 && (prefix = name.slice(0, i2)) !== "xmlns")
    name = name.slice(i2 + 1);
  return namespaces_default.hasOwnProperty(prefix) ? { space: namespaces_default[prefix], local: name } : name;
}
var init_namespace = __esm({
  "node_modules/d3-selection/src/namespace.js"() {
    init_namespaces();
  }
});

// node_modules/d3-selection/src/creator.js
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
var init_creator = __esm({
  "node_modules/d3-selection/src/creator.js"() {
    init_namespace();
    init_namespaces();
  }
});

// node_modules/d3-selection/src/selector.js
function none() {
}
function selector_default(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}
var init_selector = __esm({
  "node_modules/d3-selection/src/selector.js"() {
  }
});

// node_modules/d3-selection/src/selection/select.js
function select_default(select) {
  if (typeof select !== "function")
    select = selector_default(select);
  for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j2 = 0; j2 < m3; ++j2) {
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
var init_select = __esm({
  "node_modules/d3-selection/src/selection/select.js"() {
    init_selection();
    init_selector();
  }
});

// node_modules/d3-selection/src/array.js
function array(x3) {
  return x3 == null ? [] : Array.isArray(x3) ? x3 : Array.from(x3);
}
var init_array = __esm({
  "node_modules/d3-selection/src/array.js"() {
  }
});

// node_modules/d3-selection/src/selectorAll.js
function empty() {
  return [];
}
function selectorAll_default(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}
var init_selectorAll = __esm({
  "node_modules/d3-selection/src/selectorAll.js"() {
  }
});

// node_modules/d3-selection/src/selection/selectAll.js
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
  for (var groups = this._groups, m3 = groups.length, subgroups = [], parents = [], j2 = 0; j2 < m3; ++j2) {
    for (var group = groups[j2], n2 = group.length, node, i2 = 0; i2 < n2; ++i2) {
      if (node = group[i2]) {
        subgroups.push(select.call(node, node.__data__, i2, group));
        parents.push(node);
      }
    }
  }
  return new Selection(subgroups, parents);
}
var init_selectAll = __esm({
  "node_modules/d3-selection/src/selection/selectAll.js"() {
    init_selection();
    init_array();
    init_selectorAll();
  }
});

// node_modules/d3-selection/src/matcher.js
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
var init_matcher = __esm({
  "node_modules/d3-selection/src/matcher.js"() {
  }
});

// node_modules/d3-selection/src/selection/selectChild.js
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
var find;
var init_selectChild = __esm({
  "node_modules/d3-selection/src/selection/selectChild.js"() {
    init_matcher();
    find = Array.prototype.find;
  }
});

// node_modules/d3-selection/src/selection/selectChildren.js
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
var filter;
var init_selectChildren = __esm({
  "node_modules/d3-selection/src/selection/selectChildren.js"() {
    init_matcher();
    filter = Array.prototype.filter;
  }
});

// node_modules/d3-selection/src/selection/filter.js
function filter_default(match) {
  if (typeof match !== "function")
    match = matcher_default(match);
  for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j2 = 0; j2 < m3; ++j2) {
    for (var group = groups[j2], n2 = group.length, subgroup = subgroups[j2] = [], node, i2 = 0; i2 < n2; ++i2) {
      if ((node = group[i2]) && match.call(node, node.__data__, i2, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Selection(subgroups, this._parents);
}
var init_filter = __esm({
  "node_modules/d3-selection/src/selection/filter.js"() {
    init_selection();
    init_matcher();
  }
});

// node_modules/d3-selection/src/selection/sparse.js
function sparse_default(update4) {
  return new Array(update4.length);
}
var init_sparse = __esm({
  "node_modules/d3-selection/src/selection/sparse.js"() {
  }
});

// node_modules/d3-selection/src/selection/enter.js
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
var init_enter = __esm({
  "node_modules/d3-selection/src/selection/enter.js"() {
    init_sparse();
    init_selection();
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
  }
});

// node_modules/d3-selection/src/constant.js
function constant_default(x3) {
  return function() {
    return x3;
  };
}
var init_constant = __esm({
  "node_modules/d3-selection/src/constant.js"() {
  }
});

// node_modules/d3-selection/src/selection/data.js
function bindIndex(parent, group, enter, update4, exit, data) {
  var i2 = 0, node, groupLength = group.length, dataLength = data.length;
  for (; i2 < dataLength; ++i2) {
    if (node = group[i2]) {
      node.__data__ = data[i2];
      update4[i2] = node;
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
function bindKey(parent, group, enter, update4, exit, data, key) {
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
      update4[i2] = node;
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
  for (var m3 = groups.length, update4 = new Array(m3), enter = new Array(m3), exit = new Array(m3), j2 = 0; j2 < m3; ++j2) {
    var parent = parents[j2], group = groups[j2], groupLength = group.length, data = arraylike(value.call(parent, parent && parent.__data__, j2, parents)), dataLength = data.length, enterGroup = enter[j2] = new Array(dataLength), updateGroup = update4[j2] = new Array(dataLength), exitGroup = exit[j2] = new Array(groupLength);
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
  update4 = new Selection(update4, parents);
  update4._enter = enter;
  update4._exit = exit;
  return update4;
}
function arraylike(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data);
}
var init_data = __esm({
  "node_modules/d3-selection/src/selection/data.js"() {
    init_selection();
    init_enter();
    init_constant();
  }
});

// node_modules/d3-selection/src/selection/exit.js
function exit_default() {
  return new Selection(this._exit || this._groups.map(sparse_default), this._parents);
}
var init_exit = __esm({
  "node_modules/d3-selection/src/selection/exit.js"() {
    init_sparse();
    init_selection();
  }
});

// node_modules/d3-selection/src/selection/join.js
function join_default(onenter, onupdate, onexit) {
  var enter = this.enter(), update4 = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter)
      enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update4 = onupdate(update4);
    if (update4)
      update4 = update4.selection();
  }
  if (onexit == null)
    exit.remove();
  else
    onexit(exit);
  return enter && update4 ? enter.merge(update4).order() : update4;
}
var init_join = __esm({
  "node_modules/d3-selection/src/selection/join.js"() {
  }
});

// node_modules/d3-selection/src/selection/merge.js
function merge_default(context) {
  var selection2 = context.selection ? context.selection() : context;
  for (var groups0 = this._groups, groups1 = selection2._groups, m0 = groups0.length, m1 = groups1.length, m3 = Math.min(m0, m1), merges = new Array(m0), j2 = 0; j2 < m3; ++j2) {
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
var init_merge = __esm({
  "node_modules/d3-selection/src/selection/merge.js"() {
    init_selection();
  }
});

// node_modules/d3-selection/src/selection/order.js
function order_default() {
  for (var groups = this._groups, j2 = -1, m3 = groups.length; ++j2 < m3; ) {
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
var init_order = __esm({
  "node_modules/d3-selection/src/selection/order.js"() {
  }
});

// node_modules/d3-selection/src/selection/sort.js
function sort_default(compare) {
  if (!compare)
    compare = ascending;
  function compareNode(a3, b) {
    return a3 && b ? compare(a3.__data__, b.__data__) : !a3 - !b;
  }
  for (var groups = this._groups, m3 = groups.length, sortgroups = new Array(m3), j2 = 0; j2 < m3; ++j2) {
    for (var group = groups[j2], n2 = group.length, sortgroup = sortgroups[j2] = new Array(n2), node, i2 = 0; i2 < n2; ++i2) {
      if (node = group[i2]) {
        sortgroup[i2] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new Selection(sortgroups, this._parents).order();
}
function ascending(a3, b) {
  return a3 < b ? -1 : a3 > b ? 1 : a3 >= b ? 0 : NaN;
}
var init_sort = __esm({
  "node_modules/d3-selection/src/selection/sort.js"() {
    init_selection();
  }
});

// node_modules/d3-selection/src/selection/call.js
function call_default() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}
var init_call = __esm({
  "node_modules/d3-selection/src/selection/call.js"() {
  }
});

// node_modules/d3-selection/src/selection/nodes.js
function nodes_default() {
  return Array.from(this);
}
var init_nodes = __esm({
  "node_modules/d3-selection/src/selection/nodes.js"() {
  }
});

// node_modules/d3-selection/src/selection/node.js
function node_default() {
  for (var groups = this._groups, j2 = 0, m3 = groups.length; j2 < m3; ++j2) {
    for (var group = groups[j2], i2 = 0, n2 = group.length; i2 < n2; ++i2) {
      var node = group[i2];
      if (node)
        return node;
    }
  }
  return null;
}
var init_node = __esm({
  "node_modules/d3-selection/src/selection/node.js"() {
  }
});

// node_modules/d3-selection/src/selection/size.js
function size_default() {
  let size = 0;
  for (const node of this)
    ++size;
  return size;
}
var init_size = __esm({
  "node_modules/d3-selection/src/selection/size.js"() {
  }
});

// node_modules/d3-selection/src/selection/empty.js
function empty_default() {
  return !this.node();
}
var init_empty = __esm({
  "node_modules/d3-selection/src/selection/empty.js"() {
  }
});

// node_modules/d3-selection/src/selection/each.js
function each_default(callback) {
  for (var groups = this._groups, j2 = 0, m3 = groups.length; j2 < m3; ++j2) {
    for (var group = groups[j2], i2 = 0, n2 = group.length, node; i2 < n2; ++i2) {
      if (node = group[i2])
        callback.call(node, node.__data__, i2, group);
    }
  }
  return this;
}
var init_each = __esm({
  "node_modules/d3-selection/src/selection/each.js"() {
  }
});

// node_modules/d3-selection/src/selection/attr.js
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
var init_attr = __esm({
  "node_modules/d3-selection/src/selection/attr.js"() {
    init_namespace();
  }
});

// node_modules/d3-selection/src/window.js
function window_default(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
}
var init_window = __esm({
  "node_modules/d3-selection/src/window.js"() {
  }
});

// node_modules/d3-selection/src/selection/style.js
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
var init_style = __esm({
  "node_modules/d3-selection/src/selection/style.js"() {
    init_window();
  }
});

// node_modules/d3-selection/src/selection/property.js
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
var init_property = __esm({
  "node_modules/d3-selection/src/selection/property.js"() {
  }
});

// node_modules/d3-selection/src/selection/classed.js
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
function classedAdd(node, names2) {
  var list = classList(node), i2 = -1, n2 = names2.length;
  while (++i2 < n2)
    list.add(names2[i2]);
}
function classedRemove(node, names2) {
  var list = classList(node), i2 = -1, n2 = names2.length;
  while (++i2 < n2)
    list.remove(names2[i2]);
}
function classedTrue(names2) {
  return function() {
    classedAdd(this, names2);
  };
}
function classedFalse(names2) {
  return function() {
    classedRemove(this, names2);
  };
}
function classedFunction(names2, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names2);
  };
}
function classed_default(name, value) {
  var names2 = classArray(name + "");
  if (arguments.length < 2) {
    var list = classList(this.node()), i2 = -1, n2 = names2.length;
    while (++i2 < n2)
      if (!list.contains(names2[i2]))
        return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names2, value));
}
var init_classed = __esm({
  "node_modules/d3-selection/src/selection/classed.js"() {
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
  }
});

// node_modules/d3-selection/src/selection/text.js
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
var init_text = __esm({
  "node_modules/d3-selection/src/selection/text.js"() {
  }
});

// node_modules/d3-selection/src/selection/html.js
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
var init_html = __esm({
  "node_modules/d3-selection/src/selection/html.js"() {
  }
});

// node_modules/d3-selection/src/selection/raise.js
function raise() {
  if (this.nextSibling)
    this.parentNode.appendChild(this);
}
function raise_default() {
  return this.each(raise);
}
var init_raise = __esm({
  "node_modules/d3-selection/src/selection/raise.js"() {
  }
});

// node_modules/d3-selection/src/selection/lower.js
function lower() {
  if (this.previousSibling)
    this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function lower_default() {
  return this.each(lower);
}
var init_lower = __esm({
  "node_modules/d3-selection/src/selection/lower.js"() {
  }
});

// node_modules/d3-selection/src/selection/append.js
function append_default(name) {
  var create2 = typeof name === "function" ? name : creator_default(name);
  return this.select(function() {
    return this.appendChild(create2.apply(this, arguments));
  });
}
var init_append = __esm({
  "node_modules/d3-selection/src/selection/append.js"() {
    init_creator();
  }
});

// node_modules/d3-selection/src/selection/insert.js
function constantNull() {
  return null;
}
function insert_default(name, before) {
  var create2 = typeof name === "function" ? name : creator_default(name), select = before == null ? constantNull : typeof before === "function" ? before : selector_default(before);
  return this.select(function() {
    return this.insertBefore(create2.apply(this, arguments), select.apply(this, arguments) || null);
  });
}
var init_insert = __esm({
  "node_modules/d3-selection/src/selection/insert.js"() {
    init_creator();
    init_selector();
  }
});

// node_modules/d3-selection/src/selection/remove.js
function remove() {
  var parent = this.parentNode;
  if (parent)
    parent.removeChild(this);
}
function remove_default() {
  return this.each(remove);
}
var init_remove = __esm({
  "node_modules/d3-selection/src/selection/remove.js"() {
  }
});

// node_modules/d3-selection/src/selection/clone.js
function selection_cloneShallow() {
  var clone2 = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone2, this.nextSibling) : clone2;
}
function selection_cloneDeep() {
  var clone2 = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone2, this.nextSibling) : clone2;
}
function clone_default(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}
var init_clone = __esm({
  "node_modules/d3-selection/src/selection/clone.js"() {
  }
});

// node_modules/d3-selection/src/selection/datum.js
function datum_default(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}
var init_datum = __esm({
  "node_modules/d3-selection/src/selection/datum.js"() {
  }
});

// node_modules/d3-selection/src/selection/on.js
function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t3) {
    var name = "", i2 = t3.indexOf(".");
    if (i2 >= 0)
      name = t3.slice(i2 + 1), t3 = t3.slice(0, i2);
    return { type: t3, name };
  });
}
function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on)
      return;
    for (var j2 = 0, i2 = -1, m3 = on.length, o2; j2 < m3; ++j2) {
      if (o2 = on[j2], (!typename.type || o2.type === typename.type) && o2.name === typename.name) {
        this.removeEventListener(o2.type, o2.listener, o2.options);
      } else {
        on[++i2] = o2;
      }
    }
    if (++i2)
      on.length = i2;
    else
      delete this.__on;
  };
}
function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o2, listener = contextListener(value);
    if (on)
      for (var j2 = 0, m3 = on.length; j2 < m3; ++j2) {
        if ((o2 = on[j2]).type === typename.type && o2.name === typename.name) {
          this.removeEventListener(o2.type, o2.listener, o2.options);
          this.addEventListener(o2.type, o2.listener = listener, o2.options = options);
          o2.value = value;
          return;
        }
      }
    this.addEventListener(typename.type, listener, options);
    o2 = { type: typename.type, name: typename.name, value, listener, options };
    if (!on)
      this.__on = [o2];
    else
      on.push(o2);
  };
}
function on_default(typename, value, options) {
  var typenames = parseTypenames(typename + ""), i2, n2 = typenames.length, t3;
  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on)
      for (var j2 = 0, m3 = on.length, o2; j2 < m3; ++j2) {
        for (i2 = 0, o2 = on[j2]; i2 < n2; ++i2) {
          if ((t3 = typenames[i2]).type === o2.type && t3.name === o2.name) {
            return o2.value;
          }
        }
      }
    return;
  }
  on = value ? onAdd : onRemove;
  for (i2 = 0; i2 < n2; ++i2)
    this.each(on(typenames[i2], value, options));
  return this;
}
var init_on = __esm({
  "node_modules/d3-selection/src/selection/on.js"() {
  }
});

// node_modules/d3-selection/src/selection/dispatch.js
function dispatchEvent(node, type, params) {
  var window2 = window_default(node), event = window2.CustomEvent;
  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window2.document.createEvent("Event");
    if (params)
      event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else
      event.initEvent(type, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}
function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}
function dispatch_default(type, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params));
}
var init_dispatch = __esm({
  "node_modules/d3-selection/src/selection/dispatch.js"() {
    init_window();
  }
});

// node_modules/d3-selection/src/selection/iterator.js
function* iterator_default() {
  for (var groups = this._groups, j2 = 0, m3 = groups.length; j2 < m3; ++j2) {
    for (var group = groups[j2], i2 = 0, n2 = group.length, node; i2 < n2; ++i2) {
      if (node = group[i2])
        yield node;
    }
  }
}
var init_iterator = __esm({
  "node_modules/d3-selection/src/selection/iterator.js"() {
  }
});

// node_modules/d3-selection/src/selection/index.js
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
var root, selection_default;
var init_selection = __esm({
  "node_modules/d3-selection/src/selection/index.js"() {
    init_select();
    init_selectAll();
    init_selectChild();
    init_selectChildren();
    init_filter();
    init_data();
    init_enter();
    init_exit();
    init_join();
    init_merge();
    init_order();
    init_sort();
    init_call();
    init_nodes();
    init_node();
    init_size();
    init_empty();
    init_each();
    init_attr();
    init_style();
    init_property();
    init_classed();
    init_text();
    init_html();
    init_raise();
    init_lower();
    init_append();
    init_insert();
    init_remove();
    init_clone();
    init_datum();
    init_on();
    init_dispatch();
    init_iterator();
    root = [null];
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
      dispatch: dispatch_default,
      [Symbol.iterator]: iterator_default
    };
    selection_default = selection;
  }
});

// node_modules/d3-selection/src/select.js
function select_default2(selector) {
  return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
}
var init_select2 = __esm({
  "node_modules/d3-selection/src/select.js"() {
    init_selection();
  }
});

// node_modules/d3-selection/src/sourceEvent.js
function sourceEvent_default(event) {
  let sourceEvent;
  while (sourceEvent = event.sourceEvent)
    event = sourceEvent;
  return event;
}
var init_sourceEvent = __esm({
  "node_modules/d3-selection/src/sourceEvent.js"() {
  }
});

// node_modules/d3-selection/src/pointer.js
function pointer_default(event, node) {
  event = sourceEvent_default(event);
  if (node === void 0)
    node = event.currentTarget;
  if (node) {
    var svg = node.ownerSVGElement || node;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = event.clientX, point.y = event.clientY;
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }
    if (node.getBoundingClientRect) {
      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}
var init_pointer = __esm({
  "node_modules/d3-selection/src/pointer.js"() {
    init_sourceEvent();
  }
});

// node_modules/d3-selection/src/index.js
var init_src = __esm({
  "node_modules/d3-selection/src/index.js"() {
    init_matcher();
    init_namespace();
    init_pointer();
    init_select2();
    init_selection();
    init_selector();
    init_selectorAll();
    init_style();
  }
});

// node_modules/d3-dispatch/src/dispatch.js
function dispatch() {
  for (var i2 = 0, n2 = arguments.length, _2 = {}, t3; i2 < n2; ++i2) {
    if (!(t3 = arguments[i2] + "") || t3 in _2 || /[\s.]/.test(t3))
      throw new Error("illegal type: " + t3);
    _2[t3] = [];
  }
  return new Dispatch(_2);
}
function Dispatch(_2) {
  this._ = _2;
}
function parseTypenames2(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t3) {
    var name = "", i2 = t3.indexOf(".");
    if (i2 >= 0)
      name = t3.slice(i2 + 1), t3 = t3.slice(0, i2);
    if (t3 && !types.hasOwnProperty(t3))
      throw new Error("unknown type: " + t3);
    return { type: t3, name };
  });
}
function get(type, name) {
  for (var i2 = 0, n2 = type.length, c3; i2 < n2; ++i2) {
    if ((c3 = type[i2]).name === name) {
      return c3.value;
    }
  }
}
function set(type, name, callback) {
  for (var i2 = 0, n2 = type.length; i2 < n2; ++i2) {
    if (type[i2].name === name) {
      type[i2] = noop, type = type.slice(0, i2).concat(type.slice(i2 + 1));
      break;
    }
  }
  if (callback != null)
    type.push({ name, value: callback });
  return type;
}
var noop, dispatch_default2;
var init_dispatch2 = __esm({
  "node_modules/d3-dispatch/src/dispatch.js"() {
    noop = { value: () => {
    } };
    Dispatch.prototype = dispatch.prototype = {
      constructor: Dispatch,
      on: function(typename, callback) {
        var _2 = this._, T2 = parseTypenames2(typename + "", _2), t3, i2 = -1, n2 = T2.length;
        if (arguments.length < 2) {
          while (++i2 < n2)
            if ((t3 = (typename = T2[i2]).type) && (t3 = get(_2[t3], typename.name)))
              return t3;
          return;
        }
        if (callback != null && typeof callback !== "function")
          throw new Error("invalid callback: " + callback);
        while (++i2 < n2) {
          if (t3 = (typename = T2[i2]).type)
            _2[t3] = set(_2[t3], typename.name, callback);
          else if (callback == null)
            for (t3 in _2)
              _2[t3] = set(_2[t3], typename.name, null);
        }
        return this;
      },
      copy: function() {
        var copy = {}, _2 = this._;
        for (var t3 in _2)
          copy[t3] = _2[t3].slice();
        return new Dispatch(copy);
      },
      call: function(type, that) {
        if ((n2 = arguments.length - 2) > 0)
          for (var args = new Array(n2), i2 = 0, n2, t3; i2 < n2; ++i2)
            args[i2] = arguments[i2 + 2];
        if (!this._.hasOwnProperty(type))
          throw new Error("unknown type: " + type);
        for (t3 = this._[type], i2 = 0, n2 = t3.length; i2 < n2; ++i2)
          t3[i2].value.apply(that, args);
      },
      apply: function(type, that, args) {
        if (!this._.hasOwnProperty(type))
          throw new Error("unknown type: " + type);
        for (var t3 = this._[type], i2 = 0, n2 = t3.length; i2 < n2; ++i2)
          t3[i2].value.apply(that, args);
      }
    };
    dispatch_default2 = dispatch;
  }
});

// node_modules/d3-dispatch/src/index.js
var init_src2 = __esm({
  "node_modules/d3-dispatch/src/index.js"() {
    init_dispatch2();
  }
});

// node_modules/d3-drag/src/noevent.js
function nopropagation(event) {
  event.stopImmediatePropagation();
}
function noevent_default(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}
var nonpassive, nonpassivecapture;
var init_noevent = __esm({
  "node_modules/d3-drag/src/noevent.js"() {
    nonpassive = { passive: false };
    nonpassivecapture = { capture: true, passive: false };
  }
});

// node_modules/d3-drag/src/nodrag.js
function nodrag_default(view) {
  var root3 = view.document.documentElement, selection2 = select_default2(view).on("dragstart.drag", noevent_default, nonpassivecapture);
  if ("onselectstart" in root3) {
    selection2.on("selectstart.drag", noevent_default, nonpassivecapture);
  } else {
    root3.__noselect = root3.style.MozUserSelect;
    root3.style.MozUserSelect = "none";
  }
}
function yesdrag(view, noclick) {
  var root3 = view.document.documentElement, selection2 = select_default2(view).on("dragstart.drag", null);
  if (noclick) {
    selection2.on("click.drag", noevent_default, nonpassivecapture);
    setTimeout(function() {
      selection2.on("click.drag", null);
    }, 0);
  }
  if ("onselectstart" in root3) {
    selection2.on("selectstart.drag", null);
  } else {
    root3.style.MozUserSelect = root3.__noselect;
    delete root3.__noselect;
  }
}
var init_nodrag = __esm({
  "node_modules/d3-drag/src/nodrag.js"() {
    init_src();
    init_noevent();
  }
});

// node_modules/d3-drag/src/constant.js
var constant_default2;
var init_constant2 = __esm({
  "node_modules/d3-drag/src/constant.js"() {
    constant_default2 = (x3) => () => x3;
  }
});

// node_modules/d3-drag/src/event.js
function DragEvent(type, {
  sourceEvent,
  subject,
  target,
  identifier,
  active,
  x: x3,
  y: y3,
  dx,
  dy,
  dispatch: dispatch2
}) {
  Object.defineProperties(this, {
    type: { value: type, enumerable: true, configurable: true },
    sourceEvent: { value: sourceEvent, enumerable: true, configurable: true },
    subject: { value: subject, enumerable: true, configurable: true },
    target: { value: target, enumerable: true, configurable: true },
    identifier: { value: identifier, enumerable: true, configurable: true },
    active: { value: active, enumerable: true, configurable: true },
    x: { value: x3, enumerable: true, configurable: true },
    y: { value: y3, enumerable: true, configurable: true },
    dx: { value: dx, enumerable: true, configurable: true },
    dy: { value: dy, enumerable: true, configurable: true },
    _: { value: dispatch2 }
  });
}
var init_event = __esm({
  "node_modules/d3-drag/src/event.js"() {
    DragEvent.prototype.on = function() {
      var value = this._.on.apply(this._, arguments);
      return value === this._ ? this : value;
    };
  }
});

// node_modules/d3-drag/src/drag.js
function defaultFilter(event) {
  return !event.ctrlKey && !event.button;
}
function defaultContainer() {
  return this.parentNode;
}
function defaultSubject(event, d2) {
  return d2 == null ? { x: event.x, y: event.y } : d2;
}
function defaultTouchable() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function drag_default() {
  var filter2 = defaultFilter, container = defaultContainer, subject = defaultSubject, touchable = defaultTouchable, gestures = {}, listeners = dispatch_default2("start", "drag", "end"), active = 0, mousedownx, mousedowny, mousemoving, touchending, clickDistance2 = 0;
  function drag(selection2) {
    selection2.on("mousedown.drag", mousedowned).filter(touchable).on("touchstart.drag", touchstarted).on("touchmove.drag", touchmoved, nonpassive).on("touchend.drag touchcancel.drag", touchended).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  function mousedowned(event, d2) {
    if (touchending || !filter2.call(this, event, d2))
      return;
    var gesture = beforestart(this, container.call(this, event, d2), event, d2, "mouse");
    if (!gesture)
      return;
    select_default2(event.view).on("mousemove.drag", mousemoved, nonpassivecapture).on("mouseup.drag", mouseupped, nonpassivecapture);
    nodrag_default(event.view);
    nopropagation(event);
    mousemoving = false;
    mousedownx = event.clientX;
    mousedowny = event.clientY;
    gesture("start", event);
  }
  function mousemoved(event) {
    noevent_default(event);
    if (!mousemoving) {
      var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
      mousemoving = dx * dx + dy * dy > clickDistance2;
    }
    gestures.mouse("drag", event);
  }
  function mouseupped(event) {
    select_default2(event.view).on("mousemove.drag mouseup.drag", null);
    yesdrag(event.view, mousemoving);
    noevent_default(event);
    gestures.mouse("end", event);
  }
  function touchstarted(event, d2) {
    if (!filter2.call(this, event, d2))
      return;
    var touches = event.changedTouches, c3 = container.call(this, event, d2), n2 = touches.length, i2, gesture;
    for (i2 = 0; i2 < n2; ++i2) {
      if (gesture = beforestart(this, c3, event, d2, touches[i2].identifier, touches[i2])) {
        nopropagation(event);
        gesture("start", event, touches[i2]);
      }
    }
  }
  function touchmoved(event) {
    var touches = event.changedTouches, n2 = touches.length, i2, gesture;
    for (i2 = 0; i2 < n2; ++i2) {
      if (gesture = gestures[touches[i2].identifier]) {
        noevent_default(event);
        gesture("drag", event, touches[i2]);
      }
    }
  }
  function touchended(event) {
    var touches = event.changedTouches, n2 = touches.length, i2, gesture;
    if (touchending)
      clearTimeout(touchending);
    touchending = setTimeout(function() {
      touchending = null;
    }, 500);
    for (i2 = 0; i2 < n2; ++i2) {
      if (gesture = gestures[touches[i2].identifier]) {
        nopropagation(event);
        gesture("end", event, touches[i2]);
      }
    }
  }
  function beforestart(that, container2, event, d2, identifier, touch) {
    var dispatch2 = listeners.copy(), p2 = pointer_default(touch || event, container2), dx, dy, s2;
    if ((s2 = subject.call(that, new DragEvent("beforestart", {
      sourceEvent: event,
      target: drag,
      identifier,
      active,
      x: p2[0],
      y: p2[1],
      dx: 0,
      dy: 0,
      dispatch: dispatch2
    }), d2)) == null)
      return;
    dx = s2.x - p2[0] || 0;
    dy = s2.y - p2[1] || 0;
    return function gesture(type, event2, touch2) {
      var p0 = p2, n2;
      switch (type) {
        case "start":
          gestures[identifier] = gesture, n2 = active++;
          break;
        case "end":
          delete gestures[identifier], --active;
        case "drag":
          p2 = pointer_default(touch2 || event2, container2), n2 = active;
          break;
      }
      dispatch2.call(type, that, new DragEvent(type, {
        sourceEvent: event2,
        subject: s2,
        target: drag,
        identifier,
        active: n2,
        x: p2[0] + dx,
        y: p2[1] + dy,
        dx: p2[0] - p0[0],
        dy: p2[1] - p0[1],
        dispatch: dispatch2
      }), d2);
    };
  }
  drag.filter = function(_2) {
    return arguments.length ? (filter2 = typeof _2 === "function" ? _2 : constant_default2(!!_2), drag) : filter2;
  };
  drag.container = function(_2) {
    return arguments.length ? (container = typeof _2 === "function" ? _2 : constant_default2(_2), drag) : container;
  };
  drag.subject = function(_2) {
    return arguments.length ? (subject = typeof _2 === "function" ? _2 : constant_default2(_2), drag) : subject;
  };
  drag.touchable = function(_2) {
    return arguments.length ? (touchable = typeof _2 === "function" ? _2 : constant_default2(!!_2), drag) : touchable;
  };
  drag.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? drag : value;
  };
  drag.clickDistance = function(_2) {
    return arguments.length ? (clickDistance2 = (_2 = +_2) * _2, drag) : Math.sqrt(clickDistance2);
  };
  return drag;
}
var init_drag = __esm({
  "node_modules/d3-drag/src/drag.js"() {
    init_src2();
    init_src();
    init_nodrag();
    init_noevent();
    init_constant2();
    init_event();
  }
});

// node_modules/d3-drag/src/index.js
var init_src3 = __esm({
  "node_modules/d3-drag/src/index.js"() {
    init_drag();
    init_nodrag();
  }
});

// node_modules/d3-color/src/define.js
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
var init_define = __esm({
  "node_modules/d3-color/src/define.js"() {
  }
});

// node_modules/d3-color/src/color.js
function Color() {
}
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
  var m3, l2;
  format = (format + "").trim().toLowerCase();
  return (m3 = reHex.exec(format)) ? (l2 = m3[1].length, m3 = parseInt(m3[1], 16), l2 === 6 ? rgbn(m3) : l2 === 3 ? new Rgb(m3 >> 8 & 15 | m3 >> 4 & 240, m3 >> 4 & 15 | m3 & 240, (m3 & 15) << 4 | m3 & 15, 1) : l2 === 8 ? rgba(m3 >> 24 & 255, m3 >> 16 & 255, m3 >> 8 & 255, (m3 & 255) / 255) : l2 === 4 ? rgba(m3 >> 12 & 15 | m3 >> 8 & 240, m3 >> 8 & 15 | m3 >> 4 & 240, m3 >> 4 & 15 | m3 & 240, ((m3 & 15) << 4 | m3 & 15) / 255) : null) : (m3 = reRgbInteger.exec(format)) ? new Rgb(m3[1], m3[2], m3[3], 1) : (m3 = reRgbPercent.exec(format)) ? new Rgb(m3[1] * 255 / 100, m3[2] * 255 / 100, m3[3] * 255 / 100, 1) : (m3 = reRgbaInteger.exec(format)) ? rgba(m3[1], m3[2], m3[3], m3[4]) : (m3 = reRgbaPercent.exec(format)) ? rgba(m3[1] * 255 / 100, m3[2] * 255 / 100, m3[3] * 255 / 100, m3[4]) : (m3 = reHslPercent.exec(format)) ? hsla(m3[1], m3[2] / 100, m3[3] / 100, 1) : (m3 = reHslaPercent.exec(format)) ? hsla(m3[1], m3[2] / 100, m3[3] / 100, m3[4]) : named.hasOwnProperty(format) ? rgbn(named[format]) : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n2) {
  return new Rgb(n2 >> 16 & 255, n2 >> 8 & 255, n2 & 255, 1);
}
function rgba(r2, g2, b, a3) {
  if (a3 <= 0)
    r2 = g2 = b = NaN;
  return new Rgb(r2, g2, b, a3);
}
function rgbConvert(o2) {
  if (!(o2 instanceof Color))
    o2 = color(o2);
  if (!o2)
    return new Rgb();
  o2 = o2.rgb();
  return new Rgb(o2.r, o2.g, o2.b, o2.opacity);
}
function rgb(r2, g2, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r2) : new Rgb(r2, g2, b, opacity == null ? 1 : opacity);
}
function Rgb(r2, g2, b, opacity) {
  this.r = +r2;
  this.g = +g2;
  this.b = +b;
  this.opacity = +opacity;
}
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a3 = clampa(this.opacity);
  return `${a3 === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a3 === 1 ? ")" : `, ${a3})`}`;
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
function hsla(h2, s2, l2, a3) {
  if (a3 <= 0)
    h2 = s2 = l2 = NaN;
  else if (l2 <= 0 || l2 >= 1)
    h2 = s2 = NaN;
  else if (s2 <= 0)
    h2 = NaN;
  return new Hsl(h2, s2, l2, a3);
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
  var r2 = o2.r / 255, g2 = o2.g / 255, b = o2.b / 255, min3 = Math.min(r2, g2, b), max3 = Math.max(r2, g2, b), h2 = NaN, s2 = max3 - min3, l2 = (max3 + min3) / 2;
  if (s2) {
    if (r2 === max3)
      h2 = (g2 - b) / s2 + (g2 < b) * 6;
    else if (g2 === max3)
      h2 = (b - r2) / s2 + 2;
    else
      h2 = (r2 - g2) / s2 + 4;
    s2 /= l2 < 0.5 ? max3 + min3 : 2 - max3 - min3;
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
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h2, m1, m22) {
  return (h2 < 60 ? m1 + (m22 - m1) * h2 / 60 : h2 < 180 ? m22 : h2 < 240 ? m1 + (m22 - m1) * (240 - h2) / 60 : m1) * 255;
}
var darker, brighter, reI, reN, reP, reHex, reRgbInteger, reRgbPercent, reRgbaInteger, reRgbaPercent, reHslPercent, reHslaPercent, named;
var init_color = __esm({
  "node_modules/d3-color/src/color.js"() {
    init_define();
    darker = 0.7;
    brighter = 1 / darker;
    reI = "\\s*([+-]?\\d+)\\s*";
    reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
    reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
    reHex = /^#([0-9a-f]{3,8})$/;
    reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
    reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
    reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
    reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
    reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
    reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
    named = {
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
      formatHex: color_formatHex,
      formatHex8: color_formatHex8,
      formatHsl: color_formatHsl,
      formatRgb: color_formatRgb,
      toString: color_formatRgb
    });
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
      formatHex: rgb_formatHex,
      formatHex8: rgb_formatHex8,
      formatRgb: rgb_formatRgb,
      toString: rgb_formatRgb
    }));
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
        var h2 = this.h % 360 + (this.h < 0) * 360, s2 = isNaN(h2) || isNaN(this.s) ? 0 : this.s, l2 = this.l, m22 = l2 + (l2 < 0.5 ? l2 : 1 - l2) * s2, m1 = 2 * l2 - m22;
        return new Rgb(hsl2rgb(h2 >= 240 ? h2 - 240 : h2 + 120, m1, m22), hsl2rgb(h2, m1, m22), hsl2rgb(h2 < 120 ? h2 + 240 : h2 - 120, m1, m22), this.opacity);
      },
      clamp() {
        return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
      },
      displayable() {
        return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
      },
      formatHsl() {
        const a3 = clampa(this.opacity);
        return `${a3 === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a3 === 1 ? ")" : `, ${a3})`}`;
      }
    }));
  }
});

// node_modules/d3-color/src/index.js
var init_src4 = __esm({
  "node_modules/d3-color/src/index.js"() {
    init_color();
  }
});

// node_modules/d3-interpolate/src/basis.js
function basis(t1, v0, v1, v2, v3) {
  var t22 = t1 * t1, t3 = t22 * t1;
  return ((1 - 3 * t1 + 3 * t22 - t3) * v0 + (4 - 6 * t22 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t22 - 3 * t3) * v2 + t3 * v3) / 6;
}
function basis_default(values) {
  var n2 = values.length - 1;
  return function(t3) {
    var i2 = t3 <= 0 ? t3 = 0 : t3 >= 1 ? (t3 = 1, n2 - 1) : Math.floor(t3 * n2), v1 = values[i2], v2 = values[i2 + 1], v0 = i2 > 0 ? values[i2 - 1] : 2 * v1 - v2, v3 = i2 < n2 - 1 ? values[i2 + 2] : 2 * v2 - v1;
    return basis((t3 - i2 / n2) * n2, v0, v1, v2, v3);
  };
}
var init_basis = __esm({
  "node_modules/d3-interpolate/src/basis.js"() {
  }
});

// node_modules/d3-interpolate/src/basisClosed.js
function basisClosed_default(values) {
  var n2 = values.length;
  return function(t3) {
    var i2 = Math.floor(((t3 %= 1) < 0 ? ++t3 : t3) * n2), v0 = values[(i2 + n2 - 1) % n2], v1 = values[i2 % n2], v2 = values[(i2 + 1) % n2], v3 = values[(i2 + 2) % n2];
    return basis((t3 - i2 / n2) * n2, v0, v1, v2, v3);
  };
}
var init_basisClosed = __esm({
  "node_modules/d3-interpolate/src/basisClosed.js"() {
    init_basis();
  }
});

// node_modules/d3-interpolate/src/constant.js
var constant_default3;
var init_constant3 = __esm({
  "node_modules/d3-interpolate/src/constant.js"() {
    constant_default3 = (x3) => () => x3;
  }
});

// node_modules/d3-interpolate/src/color.js
function linear(a3, d2) {
  return function(t3) {
    return a3 + t3 * d2;
  };
}
function exponential(a3, b, y3) {
  return a3 = Math.pow(a3, y3), b = Math.pow(b, y3) - a3, y3 = 1 / y3, function(t3) {
    return Math.pow(a3 + t3 * b, y3);
  };
}
function gamma(y3) {
  return (y3 = +y3) === 1 ? nogamma : function(a3, b) {
    return b - a3 ? exponential(a3, b, y3) : constant_default3(isNaN(a3) ? b : a3);
  };
}
function nogamma(a3, b) {
  var d2 = b - a3;
  return d2 ? linear(a3, d2) : constant_default3(isNaN(a3) ? b : a3);
}
var init_color2 = __esm({
  "node_modules/d3-interpolate/src/color.js"() {
    init_constant3();
  }
});

// node_modules/d3-interpolate/src/rgb.js
function rgbSpline(spline) {
  return function(colors) {
    var n2 = colors.length, r2 = new Array(n2), g2 = new Array(n2), b = new Array(n2), i2, color2;
    for (i2 = 0; i2 < n2; ++i2) {
      color2 = rgb(colors[i2]);
      r2[i2] = color2.r || 0;
      g2[i2] = color2.g || 0;
      b[i2] = color2.b || 0;
    }
    r2 = spline(r2);
    g2 = spline(g2);
    b = spline(b);
    color2.opacity = 1;
    return function(t3) {
      color2.r = r2(t3);
      color2.g = g2(t3);
      color2.b = b(t3);
      return color2 + "";
    };
  };
}
var rgb_default, rgbBasis, rgbBasisClosed;
var init_rgb = __esm({
  "node_modules/d3-interpolate/src/rgb.js"() {
    init_src4();
    init_basis();
    init_basisClosed();
    init_color2();
    rgb_default = function rgbGamma(y3) {
      var color2 = gamma(y3);
      function rgb2(start2, end) {
        var r2 = color2((start2 = rgb(start2)).r, (end = rgb(end)).r), g2 = color2(start2.g, end.g), b = color2(start2.b, end.b), opacity = nogamma(start2.opacity, end.opacity);
        return function(t3) {
          start2.r = r2(t3);
          start2.g = g2(t3);
          start2.b = b(t3);
          start2.opacity = opacity(t3);
          return start2 + "";
        };
      }
      rgb2.gamma = rgbGamma;
      return rgb2;
    }(1);
    rgbBasis = rgbSpline(basis_default);
    rgbBasisClosed = rgbSpline(basisClosed_default);
  }
});

// node_modules/d3-interpolate/src/number.js
function number_default(a3, b) {
  return a3 = +a3, b = +b, function(t3) {
    return a3 * (1 - t3) + b * t3;
  };
}
var init_number = __esm({
  "node_modules/d3-interpolate/src/number.js"() {
  }
});

// node_modules/d3-interpolate/src/string.js
function zero(b) {
  return function() {
    return b;
  };
}
function one(b) {
  return function(t3) {
    return b(t3) + "";
  };
}
function string_default(a3, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i2 = -1, s2 = [], q2 = [];
  a3 = a3 + "", b = b + "";
  while ((am = reA.exec(a3)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      bs = b.slice(bi, bs);
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
    bi = reB.lastIndex;
  }
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s2[i2])
      s2[i2] += bs;
    else
      s2[++i2] = bs;
  }
  return s2.length < 2 ? q2[0] ? one(q2[0].x) : zero(b) : (b = q2.length, function(t3) {
    for (var i3 = 0, o2; i3 < b; ++i3)
      s2[(o2 = q2[i3]).i] = o2.x(t3);
    return s2.join("");
  });
}
var reA, reB;
var init_string = __esm({
  "node_modules/d3-interpolate/src/string.js"() {
    init_number();
    reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
    reB = new RegExp(reA.source, "g");
  }
});

// node_modules/d3-interpolate/src/transform/decompose.js
function decompose_default(a3, b, c3, d2, e2, f2) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a3 * a3 + b * b))
    a3 /= scaleX, b /= scaleX;
  if (skewX = a3 * c3 + b * d2)
    c3 -= a3 * skewX, d2 -= b * skewX;
  if (scaleY = Math.sqrt(c3 * c3 + d2 * d2))
    c3 /= scaleY, d2 /= scaleY, skewX /= scaleY;
  if (a3 * d2 < b * c3)
    a3 = -a3, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e2,
    translateY: f2,
    rotate: Math.atan2(b, a3) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX,
    scaleY
  };
}
var degrees, identity;
var init_decompose = __esm({
  "node_modules/d3-interpolate/src/transform/decompose.js"() {
    degrees = 180 / Math.PI;
    identity = {
      translateX: 0,
      translateY: 0,
      rotate: 0,
      skewX: 0,
      scaleX: 1,
      scaleY: 1
    };
  }
});

// node_modules/d3-interpolate/src/transform/parse.js
function parseCss(value) {
  const m3 = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m3.isIdentity ? identity : decompose_default(m3.a, m3.b, m3.c, m3.d, m3.e, m3.f);
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
var svgNode;
var init_parse = __esm({
  "node_modules/d3-interpolate/src/transform/parse.js"() {
    init_decompose();
  }
});

// node_modules/d3-interpolate/src/transform/index.js
function interpolateTransform(parse, pxComma, pxParen, degParen) {
  function pop(s2) {
    return s2.length ? s2.pop() + " " : "";
  }
  function translate(xa, ya, xb, yb, s2, q2) {
    if (xa !== xb || ya !== yb) {
      var i2 = s2.push("translate(", null, pxComma, null, pxParen);
      q2.push({ i: i2 - 4, x: number_default(xa, xb) }, { i: i2 - 2, x: number_default(ya, yb) });
    } else if (xb || yb) {
      s2.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a3, b, s2, q2) {
    if (a3 !== b) {
      if (a3 - b > 180)
        b += 360;
      else if (b - a3 > 180)
        a3 += 360;
      q2.push({ i: s2.push(pop(s2) + "rotate(", null, degParen) - 2, x: number_default(a3, b) });
    } else if (b) {
      s2.push(pop(s2) + "rotate(" + b + degParen);
    }
  }
  function skewX(a3, b, s2, q2) {
    if (a3 !== b) {
      q2.push({ i: s2.push(pop(s2) + "skewX(", null, degParen) - 2, x: number_default(a3, b) });
    } else if (b) {
      s2.push(pop(s2) + "skewX(" + b + degParen);
    }
  }
  function scale(xa, ya, xb, yb, s2, q2) {
    if (xa !== xb || ya !== yb) {
      var i2 = s2.push(pop(s2) + "scale(", null, ",", null, ")");
      q2.push({ i: i2 - 4, x: number_default(xa, xb) }, { i: i2 - 2, x: number_default(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s2.push(pop(s2) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function(a3, b) {
    var s2 = [], q2 = [];
    a3 = parse(a3), b = parse(b);
    translate(a3.translateX, a3.translateY, b.translateX, b.translateY, s2, q2);
    rotate(a3.rotate, b.rotate, s2, q2);
    skewX(a3.skewX, b.skewX, s2, q2);
    scale(a3.scaleX, a3.scaleY, b.scaleX, b.scaleY, s2, q2);
    a3 = b = null;
    return function(t3) {
      var i2 = -1, n2 = q2.length, o2;
      while (++i2 < n2)
        s2[(o2 = q2[i2]).i] = o2.x(t3);
      return s2.join("");
    };
  };
}
var interpolateTransformCss, interpolateTransformSvg;
var init_transform = __esm({
  "node_modules/d3-interpolate/src/transform/index.js"() {
    init_number();
    init_parse();
    interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
    interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");
  }
});

// node_modules/d3-interpolate/src/zoom.js
function cosh(x3) {
  return ((x3 = Math.exp(x3)) + 1 / x3) / 2;
}
function sinh(x3) {
  return ((x3 = Math.exp(x3)) - 1 / x3) / 2;
}
function tanh(x3) {
  return ((x3 = Math.exp(2 * x3)) - 1) / (x3 + 1);
}
var epsilon2, zoom_default;
var init_zoom = __esm({
  "node_modules/d3-interpolate/src/zoom.js"() {
    epsilon2 = 1e-12;
    zoom_default = function zoomRho(rho, rho2, rho4) {
      function zoom2(p0, p1) {
        var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2], dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, i2, S2;
        if (d2 < epsilon2) {
          S2 = Math.log(w1 / w0) / rho;
          i2 = function(t3) {
            return [
              ux0 + t3 * dx,
              uy0 + t3 * dy,
              w0 * Math.exp(rho * t3 * S2)
            ];
          };
        } else {
          var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1), b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
          S2 = (r1 - r0) / rho;
          i2 = function(t3) {
            var s2 = t3 * S2, coshr0 = cosh(r0), u2 = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s2 + r0) - sinh(r0));
            return [
              ux0 + u2 * dx,
              uy0 + u2 * dy,
              w0 * coshr0 / cosh(rho * s2 + r0)
            ];
          };
        }
        i2.duration = S2 * 1e3 * rho / Math.SQRT2;
        return i2;
      }
      zoom2.rho = function(_2) {
        var _1 = Math.max(1e-3, +_2), _22 = _1 * _1, _4 = _22 * _22;
        return zoomRho(_1, _22, _4);
      };
      return zoom2;
    }(Math.SQRT2, 2, 4);
  }
});

// node_modules/d3-interpolate/src/index.js
var init_src5 = __esm({
  "node_modules/d3-interpolate/src/index.js"() {
    init_number();
    init_string();
    init_transform();
    init_zoom();
    init_rgb();
  }
});

// node_modules/d3-timer/src/timer.js
function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}
function clearNow() {
  clockNow = 0;
}
function Timer() {
  this._call = this._time = this._next = null;
}
function timer(callback, delay, time) {
  var t3 = new Timer();
  t3.restart(callback, delay, time);
  return t3;
}
function timerFlush() {
  now();
  ++frame;
  var t3 = taskHead, e2;
  while (t3) {
    if ((e2 = clockNow - t3._time) >= 0)
      t3._call.call(void 0, e2);
    t3 = t3._next;
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
  var now4 = clock.now(), delay = now4 - clockLast;
  if (delay > pokeDelay)
    clockSkew -= delay, clockLast = now4;
}
function nap() {
  var t0, t1 = taskHead, t22, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time)
        time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t22 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t22 : taskHead = t22;
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
var frame, timeout, interval, pokeDelay, taskHead, taskTail, clockLast, clockNow, clockSkew, clock, setFrame;
var init_timer = __esm({
  "node_modules/d3-timer/src/timer.js"() {
    frame = 0;
    timeout = 0;
    interval = 0;
    pokeDelay = 1e3;
    clockLast = 0;
    clockNow = 0;
    clockSkew = 0;
    clock = typeof performance === "object" && performance.now ? performance : Date;
    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f2) {
      setTimeout(f2, 17);
    };
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
  }
});

// node_modules/d3-timer/src/timeout.js
function timeout_default(callback, delay, time) {
  var t3 = new Timer();
  delay = delay == null ? 0 : +delay;
  t3.restart((elapsed) => {
    t3.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t3;
}
var init_timeout = __esm({
  "node_modules/d3-timer/src/timeout.js"() {
    init_timer();
  }
});

// node_modules/d3-timer/src/index.js
var init_src6 = __esm({
  "node_modules/d3-timer/src/index.js"() {
    init_timer();
    init_timeout();
  }
});

// node_modules/d3-transition/src/transition/schedule.js
function schedule_default(node, name, id2, index6, group, timing) {
  var schedules = node.__transition;
  if (!schedules)
    node.__transition = {};
  else if (id2 in schedules)
    return;
  create(node, id2, {
    name,
    index: index6,
    group,
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
function create(node, id2, self2) {
  var schedules = node.__transition, tween;
  schedules[id2] = self2;
  self2.timer = timer(schedule, 0, self2.time);
  function schedule(elapsed) {
    self2.state = SCHEDULED;
    self2.timer.restart(start2, self2.delay, self2.time);
    if (self2.delay <= elapsed)
      start2(elapsed - self2.delay);
  }
  function start2(elapsed) {
    var i2, j2, n2, o2;
    if (self2.state !== SCHEDULED)
      return stop();
    for (i2 in schedules) {
      o2 = schedules[i2];
      if (o2.name !== self2.name)
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
      if (self2.state === STARTED) {
        self2.state = RUNNING;
        self2.timer.restart(tick, self2.delay, self2.time);
        tick(elapsed);
      }
    });
    self2.state = STARTING;
    self2.on.call("start", node, node.__data__, self2.index, self2.group);
    if (self2.state !== STARTING)
      return;
    self2.state = STARTED;
    tween = new Array(n2 = self2.tween.length);
    for (i2 = 0, j2 = -1; i2 < n2; ++i2) {
      if (o2 = self2.tween[i2].value.call(node, node.__data__, self2.index, self2.group)) {
        tween[++j2] = o2;
      }
    }
    tween.length = j2 + 1;
  }
  function tick(elapsed) {
    var t3 = elapsed < self2.duration ? self2.ease.call(null, elapsed / self2.duration) : (self2.timer.restart(stop), self2.state = ENDING, 1), i2 = -1, n2 = tween.length;
    while (++i2 < n2) {
      tween[i2].call(node, t3);
    }
    if (self2.state === ENDING) {
      self2.on.call("end", node, node.__data__, self2.index, self2.group);
      stop();
    }
  }
  function stop() {
    self2.state = ENDED;
    self2.timer.stop();
    delete schedules[id2];
    for (var i2 in schedules)
      return;
    delete node.__transition;
  }
}
var emptyOn, emptyTween, CREATED, SCHEDULED, STARTING, STARTED, RUNNING, ENDING, ENDED;
var init_schedule = __esm({
  "node_modules/d3-transition/src/transition/schedule.js"() {
    init_src2();
    init_src6();
    emptyOn = dispatch_default2("start", "end", "cancel", "interrupt");
    emptyTween = [];
    CREATED = 0;
    SCHEDULED = 1;
    STARTING = 2;
    STARTED = 3;
    RUNNING = 4;
    ENDING = 5;
    ENDED = 6;
  }
});

// node_modules/d3-transition/src/interrupt.js
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
var init_interrupt = __esm({
  "node_modules/d3-transition/src/interrupt.js"() {
    init_schedule();
  }
});

// node_modules/d3-transition/src/selection/interrupt.js
function interrupt_default2(name) {
  return this.each(function() {
    interrupt_default(this, name);
  });
}
var init_interrupt2 = __esm({
  "node_modules/d3-transition/src/selection/interrupt.js"() {
    init_interrupt();
  }
});

// node_modules/d3-transition/src/transition/tween.js
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
      for (var t3 = { name, value }, i2 = 0, n2 = tween1.length; i2 < n2; ++i2) {
        if (tween1[i2].name === name) {
          tween1[i2] = t3;
          break;
        }
      }
      if (i2 === n2)
        tween1.push(t3);
    }
    schedule.tween = tween1;
  };
}
function tween_default(name, value) {
  var id2 = this._id;
  name += "";
  if (arguments.length < 2) {
    var tween = get2(this.node(), id2).tween;
    for (var i2 = 0, n2 = tween.length, t3; i2 < n2; ++i2) {
      if ((t3 = tween[i2]).name === name) {
        return t3.value;
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
var init_tween = __esm({
  "node_modules/d3-transition/src/transition/tween.js"() {
    init_schedule();
  }
});

// node_modules/d3-transition/src/transition/interpolate.js
function interpolate_default(a3, b) {
  var c3;
  return (typeof b === "number" ? number_default : b instanceof color ? rgb_default : (c3 = color(b)) ? (b = c3, rgb_default) : string_default)(a3, b);
}
var init_interpolate = __esm({
  "node_modules/d3-transition/src/transition/interpolate.js"() {
    init_src4();
    init_src5();
  }
});

// node_modules/d3-transition/src/transition/attr.js
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
var init_attr2 = __esm({
  "node_modules/d3-transition/src/transition/attr.js"() {
    init_src5();
    init_src();
    init_tween();
    init_interpolate();
  }
});

// node_modules/d3-transition/src/transition/attrTween.js
function attrInterpolate(name, i2) {
  return function(t3) {
    this.setAttribute(name, i2.call(this, t3));
  };
}
function attrInterpolateNS(fullname, i2) {
  return function(t3) {
    this.setAttributeNS(fullname.space, fullname.local, i2.call(this, t3));
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
var init_attrTween = __esm({
  "node_modules/d3-transition/src/transition/attrTween.js"() {
    init_src();
  }
});

// node_modules/d3-transition/src/transition/delay.js
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
var init_delay = __esm({
  "node_modules/d3-transition/src/transition/delay.js"() {
    init_schedule();
  }
});

// node_modules/d3-transition/src/transition/duration.js
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
var init_duration = __esm({
  "node_modules/d3-transition/src/transition/duration.js"() {
    init_schedule();
  }
});

// node_modules/d3-transition/src/transition/ease.js
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
var init_ease = __esm({
  "node_modules/d3-transition/src/transition/ease.js"() {
    init_schedule();
  }
});

// node_modules/d3-transition/src/transition/easeVarying.js
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
var init_easeVarying = __esm({
  "node_modules/d3-transition/src/transition/easeVarying.js"() {
    init_schedule();
  }
});

// node_modules/d3-transition/src/transition/filter.js
function filter_default2(match) {
  if (typeof match !== "function")
    match = matcher_default(match);
  for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j2 = 0; j2 < m3; ++j2) {
    for (var group = groups[j2], n2 = group.length, subgroup = subgroups[j2] = [], node, i2 = 0; i2 < n2; ++i2) {
      if ((node = group[i2]) && match.call(node, node.__data__, i2, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Transition(subgroups, this._parents, this._name, this._id);
}
var init_filter2 = __esm({
  "node_modules/d3-transition/src/transition/filter.js"() {
    init_src();
    init_transition2();
  }
});

// node_modules/d3-transition/src/transition/merge.js
function merge_default2(transition2) {
  if (transition2._id !== this._id)
    throw new Error();
  for (var groups0 = this._groups, groups1 = transition2._groups, m0 = groups0.length, m1 = groups1.length, m3 = Math.min(m0, m1), merges = new Array(m0), j2 = 0; j2 < m3; ++j2) {
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
var init_merge2 = __esm({
  "node_modules/d3-transition/src/transition/merge.js"() {
    init_transition2();
  }
});

// node_modules/d3-transition/src/transition/on.js
function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t3) {
    var i2 = t3.indexOf(".");
    if (i2 >= 0)
      t3 = t3.slice(0, i2);
    return !t3 || t3 === "start";
  });
}
function onFunction(id2, name, listener) {
  var on0, on1, sit = start(name) ? init : set2;
  return function() {
    var schedule = sit(this, id2), on = schedule.on;
    if (on !== on0)
      (on1 = (on0 = on).copy()).on(name, listener);
    schedule.on = on1;
  };
}
function on_default2(name, listener) {
  var id2 = this._id;
  return arguments.length < 2 ? get2(this.node(), id2).on.on(name) : this.each(onFunction(id2, name, listener));
}
var init_on2 = __esm({
  "node_modules/d3-transition/src/transition/on.js"() {
    init_schedule();
  }
});

// node_modules/d3-transition/src/transition/remove.js
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
var init_remove2 = __esm({
  "node_modules/d3-transition/src/transition/remove.js"() {
  }
});

// node_modules/d3-transition/src/transition/select.js
function select_default3(select) {
  var name = this._name, id2 = this._id;
  if (typeof select !== "function")
    select = selector_default(select);
  for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j2 = 0; j2 < m3; ++j2) {
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
var init_select3 = __esm({
  "node_modules/d3-transition/src/transition/select.js"() {
    init_src();
    init_transition2();
    init_schedule();
  }
});

// node_modules/d3-transition/src/transition/selectAll.js
function selectAll_default2(select) {
  var name = this._name, id2 = this._id;
  if (typeof select !== "function")
    select = selectorAll_default(select);
  for (var groups = this._groups, m3 = groups.length, subgroups = [], parents = [], j2 = 0; j2 < m3; ++j2) {
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
var init_selectAll2 = __esm({
  "node_modules/d3-transition/src/transition/selectAll.js"() {
    init_src();
    init_transition2();
    init_schedule();
  }
});

// node_modules/d3-transition/src/transition/selection.js
function selection_default2() {
  return new Selection2(this._groups, this._parents);
}
var Selection2;
var init_selection2 = __esm({
  "node_modules/d3-transition/src/transition/selection.js"() {
    init_src();
    Selection2 = selection_default.prototype.constructor;
  }
});

// node_modules/d3-transition/src/transition/style.js
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
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove3;
  return function() {
    var schedule = set2(this, id2), on = schedule.on, listener = schedule.value[key] == null ? remove3 || (remove3 = styleRemove2(name)) : void 0;
    if (on !== on0 || listener0 !== listener)
      (on1 = (on0 = on).copy()).on(event, listener0 = listener);
    schedule.on = on1;
  };
}
function style_default2(name, value, priority) {
  var i2 = (name += "") === "transform" ? interpolateTransformCss : interpolate_default;
  return value == null ? this.styleTween(name, styleNull(name, i2)).on("end.style." + name, styleRemove2(name)) : typeof value === "function" ? this.styleTween(name, styleFunction2(name, i2, tweenValue(this, "style." + name, value))).each(styleMaybeRemove(this._id, name)) : this.styleTween(name, styleConstant2(name, i2, value), priority).on("end.style." + name, null);
}
var init_style2 = __esm({
  "node_modules/d3-transition/src/transition/style.js"() {
    init_src5();
    init_src();
    init_schedule();
    init_tween();
    init_interpolate();
  }
});

// node_modules/d3-transition/src/transition/styleTween.js
function styleInterpolate(name, i2, priority) {
  return function(t3) {
    this.style.setProperty(name, i2.call(this, t3), priority);
  };
}
function styleTween(name, value, priority) {
  var t3, i0;
  function tween() {
    var i2 = value.apply(this, arguments);
    if (i2 !== i0)
      t3 = (i0 = i2) && styleInterpolate(name, i2, priority);
    return t3;
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
var init_styleTween = __esm({
  "node_modules/d3-transition/src/transition/styleTween.js"() {
  }
});

// node_modules/d3-transition/src/transition/text.js
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
var init_text2 = __esm({
  "node_modules/d3-transition/src/transition/text.js"() {
    init_tween();
  }
});

// node_modules/d3-transition/src/transition/textTween.js
function textInterpolate(i2) {
  return function(t3) {
    this.textContent = i2.call(this, t3);
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
var init_textTween = __esm({
  "node_modules/d3-transition/src/transition/textTween.js"() {
  }
});

// node_modules/d3-transition/src/transition/transition.js
function transition_default() {
  var name = this._name, id0 = this._id, id1 = newId();
  for (var groups = this._groups, m3 = groups.length, j2 = 0; j2 < m3; ++j2) {
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
var init_transition = __esm({
  "node_modules/d3-transition/src/transition/transition.js"() {
    init_transition2();
    init_schedule();
  }
});

// node_modules/d3-transition/src/transition/end.js
function end_default() {
  var on0, on1, that = this, id2 = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = { value: reject }, end = { value: function() {
      if (--size === 0)
        resolve();
    } };
    that.each(function() {
      var schedule = set2(this, id2), on = schedule.on;
      if (on !== on0) {
        on1 = (on0 = on).copy();
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
var init_end = __esm({
  "node_modules/d3-transition/src/transition/end.js"() {
    init_schedule();
  }
});

// node_modules/d3-transition/src/transition/index.js
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
var id, selection_prototype;
var init_transition2 = __esm({
  "node_modules/d3-transition/src/transition/index.js"() {
    init_src();
    init_attr2();
    init_attrTween();
    init_delay();
    init_duration();
    init_ease();
    init_easeVarying();
    init_filter2();
    init_merge2();
    init_on2();
    init_remove2();
    init_select3();
    init_selectAll2();
    init_selection2();
    init_style2();
    init_styleTween();
    init_text2();
    init_textTween();
    init_transition();
    init_tween();
    init_end();
    id = 0;
    selection_prototype = selection_default.prototype;
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
  }
});

// node_modules/d3-ease/src/cubic.js
function cubicInOut(t3) {
  return ((t3 *= 2) <= 1 ? t3 * t3 * t3 : (t3 -= 2) * t3 * t3 + 2) / 2;
}
var init_cubic = __esm({
  "node_modules/d3-ease/src/cubic.js"() {
  }
});

// node_modules/d3-ease/src/index.js
var init_src7 = __esm({
  "node_modules/d3-ease/src/index.js"() {
    init_cubic();
  }
});

// node_modules/d3-transition/src/selection/transition.js
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
  for (var groups = this._groups, m3 = groups.length, j2 = 0; j2 < m3; ++j2) {
    for (var group = groups[j2], n2 = group.length, node, i2 = 0; i2 < n2; ++i2) {
      if (node = group[i2]) {
        schedule_default(node, name, id2, i2, group, timing || inherit(node, id2));
      }
    }
  }
  return new Transition(groups, this._parents, name, id2);
}
var defaultTiming;
var init_transition3 = __esm({
  "node_modules/d3-transition/src/selection/transition.js"() {
    init_transition2();
    init_schedule();
    init_src7();
    init_src6();
    defaultTiming = {
      time: null,
      delay: 0,
      duration: 250,
      ease: cubicInOut
    };
  }
});

// node_modules/d3-transition/src/selection/index.js
var init_selection3 = __esm({
  "node_modules/d3-transition/src/selection/index.js"() {
    init_src();
    init_interrupt2();
    init_transition3();
    selection_default.prototype.interrupt = interrupt_default2;
    selection_default.prototype.transition = transition_default2;
  }
});

// node_modules/d3-transition/src/index.js
var init_src8 = __esm({
  "node_modules/d3-transition/src/index.js"() {
    init_selection3();
    init_interrupt();
  }
});

// node_modules/d3-zoom/src/constant.js
var constant_default4;
var init_constant4 = __esm({
  "node_modules/d3-zoom/src/constant.js"() {
    constant_default4 = (x3) => () => x3;
  }
});

// node_modules/d3-zoom/src/event.js
function ZoomEvent(type, {
  sourceEvent,
  target,
  transform: transform2,
  dispatch: dispatch2
}) {
  Object.defineProperties(this, {
    type: { value: type, enumerable: true, configurable: true },
    sourceEvent: { value: sourceEvent, enumerable: true, configurable: true },
    target: { value: target, enumerable: true, configurable: true },
    transform: { value: transform2, enumerable: true, configurable: true },
    _: { value: dispatch2 }
  });
}
var init_event2 = __esm({
  "node_modules/d3-zoom/src/event.js"() {
  }
});

// node_modules/d3-zoom/src/transform.js
function Transform(k2, x3, y3) {
  this.k = k2;
  this.x = x3;
  this.y = y3;
}
function transform(node) {
  while (!node.__zoom)
    if (!(node = node.parentNode))
      return identity2;
  return node.__zoom;
}
var identity2;
var init_transform2 = __esm({
  "node_modules/d3-zoom/src/transform.js"() {
    Transform.prototype = {
      constructor: Transform,
      scale: function(k2) {
        return k2 === 1 ? this : new Transform(this.k * k2, this.x, this.y);
      },
      translate: function(x3, y3) {
        return x3 === 0 & y3 === 0 ? this : new Transform(this.k, this.x + this.k * x3, this.y + this.k * y3);
      },
      apply: function(point) {
        return [point[0] * this.k + this.x, point[1] * this.k + this.y];
      },
      applyX: function(x3) {
        return x3 * this.k + this.x;
      },
      applyY: function(y3) {
        return y3 * this.k + this.y;
      },
      invert: function(location) {
        return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
      },
      invertX: function(x3) {
        return (x3 - this.x) / this.k;
      },
      invertY: function(y3) {
        return (y3 - this.y) / this.k;
      },
      rescaleX: function(x3) {
        return x3.copy().domain(x3.range().map(this.invertX, this).map(x3.invert, x3));
      },
      rescaleY: function(y3) {
        return y3.copy().domain(y3.range().map(this.invertY, this).map(y3.invert, y3));
      },
      toString: function() {
        return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
      }
    };
    identity2 = new Transform(1, 0, 0);
    transform.prototype = Transform.prototype;
  }
});

// node_modules/d3-zoom/src/noevent.js
function nopropagation2(event) {
  event.stopImmediatePropagation();
}
function noevent_default2(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}
var init_noevent2 = __esm({
  "node_modules/d3-zoom/src/noevent.js"() {
  }
});

// node_modules/d3-zoom/src/zoom.js
function defaultFilter2(event) {
  return (!event.ctrlKey || event.type === "wheel") && !event.button;
}
function defaultExtent() {
  var e2 = this;
  if (e2 instanceof SVGElement) {
    e2 = e2.ownerSVGElement || e2;
    if (e2.hasAttribute("viewBox")) {
      e2 = e2.viewBox.baseVal;
      return [[e2.x, e2.y], [e2.x + e2.width, e2.y + e2.height]];
    }
    return [[0, 0], [e2.width.baseVal.value, e2.height.baseVal.value]];
  }
  return [[0, 0], [e2.clientWidth, e2.clientHeight]];
}
function defaultTransform() {
  return this.__zoom || identity2;
}
function defaultWheelDelta(event) {
  return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 2e-3) * (event.ctrlKey ? 10 : 1);
}
function defaultTouchable2() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function defaultConstrain(transform2, extent, translateExtent) {
  var dx0 = transform2.invertX(extent[0][0]) - translateExtent[0][0], dx1 = transform2.invertX(extent[1][0]) - translateExtent[1][0], dy0 = transform2.invertY(extent[0][1]) - translateExtent[0][1], dy1 = transform2.invertY(extent[1][1]) - translateExtent[1][1];
  return transform2.translate(dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1), dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1));
}
function zoom_default2() {
  var filter2 = defaultFilter2, extent = defaultExtent, constrain = defaultConstrain, wheelDelta = defaultWheelDelta, touchable = defaultTouchable2, scaleExtent = [0, Infinity], translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]], duration = 250, interpolate = zoom_default, listeners = dispatch_default2("start", "zoom", "end"), touchstarting, touchfirst, touchending, touchDelay = 500, wheelDelay = 150, clickDistance2 = 0, tapDistance = 10;
  function zoom2(selection2) {
    selection2.property("__zoom", defaultTransform).on("wheel.zoom", wheeled, { passive: false }).on("mousedown.zoom", mousedowned).on("dblclick.zoom", dblclicked).filter(touchable).on("touchstart.zoom", touchstarted).on("touchmove.zoom", touchmoved).on("touchend.zoom touchcancel.zoom", touchended).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  zoom2.transform = function(collection, transform2, point, event) {
    var selection2 = collection.selection ? collection.selection() : collection;
    selection2.property("__zoom", defaultTransform);
    if (collection !== selection2) {
      schedule(collection, transform2, point, event);
    } else {
      selection2.interrupt().each(function() {
        gesture(this, arguments).event(event).start().zoom(null, typeof transform2 === "function" ? transform2.apply(this, arguments) : transform2).end();
      });
    }
  };
  zoom2.scaleBy = function(selection2, k2, p2, event) {
    zoom2.scaleTo(selection2, function() {
      var k0 = this.__zoom.k, k1 = typeof k2 === "function" ? k2.apply(this, arguments) : k2;
      return k0 * k1;
    }, p2, event);
  };
  zoom2.scaleTo = function(selection2, k2, p2, event) {
    zoom2.transform(selection2, function() {
      var e2 = extent.apply(this, arguments), t0 = this.__zoom, p0 = p2 == null ? centroid(e2) : typeof p2 === "function" ? p2.apply(this, arguments) : p2, p1 = t0.invert(p0), k1 = typeof k2 === "function" ? k2.apply(this, arguments) : k2;
      return constrain(translate(scale(t0, k1), p0, p1), e2, translateExtent);
    }, p2, event);
  };
  zoom2.translateBy = function(selection2, x3, y3, event) {
    zoom2.transform(selection2, function() {
      return constrain(this.__zoom.translate(typeof x3 === "function" ? x3.apply(this, arguments) : x3, typeof y3 === "function" ? y3.apply(this, arguments) : y3), extent.apply(this, arguments), translateExtent);
    }, null, event);
  };
  zoom2.translateTo = function(selection2, x3, y3, p2, event) {
    zoom2.transform(selection2, function() {
      var e2 = extent.apply(this, arguments), t3 = this.__zoom, p0 = p2 == null ? centroid(e2) : typeof p2 === "function" ? p2.apply(this, arguments) : p2;
      return constrain(identity2.translate(p0[0], p0[1]).scale(t3.k).translate(typeof x3 === "function" ? -x3.apply(this, arguments) : -x3, typeof y3 === "function" ? -y3.apply(this, arguments) : -y3), e2, translateExtent);
    }, p2, event);
  };
  function scale(transform2, k2) {
    k2 = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k2));
    return k2 === transform2.k ? transform2 : new Transform(k2, transform2.x, transform2.y);
  }
  function translate(transform2, p0, p1) {
    var x3 = p0[0] - p1[0] * transform2.k, y3 = p0[1] - p1[1] * transform2.k;
    return x3 === transform2.x && y3 === transform2.y ? transform2 : new Transform(transform2.k, x3, y3);
  }
  function centroid(extent2) {
    return [(+extent2[0][0] + +extent2[1][0]) / 2, (+extent2[0][1] + +extent2[1][1]) / 2];
  }
  function schedule(transition2, transform2, point, event) {
    transition2.on("start.zoom", function() {
      gesture(this, arguments).event(event).start();
    }).on("interrupt.zoom end.zoom", function() {
      gesture(this, arguments).event(event).end();
    }).tween("zoom", function() {
      var that = this, args = arguments, g2 = gesture(that, args).event(event), e2 = extent.apply(that, args), p2 = point == null ? centroid(e2) : typeof point === "function" ? point.apply(that, args) : point, w2 = Math.max(e2[1][0] - e2[0][0], e2[1][1] - e2[0][1]), a3 = that.__zoom, b = typeof transform2 === "function" ? transform2.apply(that, args) : transform2, i2 = interpolate(a3.invert(p2).concat(w2 / a3.k), b.invert(p2).concat(w2 / b.k));
      return function(t3) {
        if (t3 === 1)
          t3 = b;
        else {
          var l2 = i2(t3), k2 = w2 / l2[2];
          t3 = new Transform(k2, p2[0] - l2[0] * k2, p2[1] - l2[1] * k2);
        }
        g2.zoom(null, t3);
      };
    });
  }
  function gesture(that, args, clean) {
    return !clean && that.__zooming || new Gesture(that, args);
  }
  function Gesture(that, args) {
    this.that = that;
    this.args = args;
    this.active = 0;
    this.sourceEvent = null;
    this.extent = extent.apply(that, args);
    this.taps = 0;
  }
  Gesture.prototype = {
    event: function(event) {
      if (event)
        this.sourceEvent = event;
      return this;
    },
    start: function() {
      if (++this.active === 1) {
        this.that.__zooming = this;
        this.emit("start");
      }
      return this;
    },
    zoom: function(key, transform2) {
      if (this.mouse && key !== "mouse")
        this.mouse[1] = transform2.invert(this.mouse[0]);
      if (this.touch0 && key !== "touch")
        this.touch0[1] = transform2.invert(this.touch0[0]);
      if (this.touch1 && key !== "touch")
        this.touch1[1] = transform2.invert(this.touch1[0]);
      this.that.__zoom = transform2;
      this.emit("zoom");
      return this;
    },
    end: function() {
      if (--this.active === 0) {
        delete this.that.__zooming;
        this.emit("end");
      }
      return this;
    },
    emit: function(type) {
      var d2 = select_default2(this.that).datum();
      listeners.call(type, this.that, new ZoomEvent(type, {
        sourceEvent: this.sourceEvent,
        target: zoom2,
        type,
        transform: this.that.__zoom,
        dispatch: listeners
      }), d2);
    }
  };
  function wheeled(event, ...args) {
    if (!filter2.apply(this, arguments))
      return;
    var g2 = gesture(this, args).event(event), t3 = this.__zoom, k2 = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t3.k * Math.pow(2, wheelDelta.apply(this, arguments)))), p2 = pointer_default(event);
    if (g2.wheel) {
      if (g2.mouse[0][0] !== p2[0] || g2.mouse[0][1] !== p2[1]) {
        g2.mouse[1] = t3.invert(g2.mouse[0] = p2);
      }
      clearTimeout(g2.wheel);
    } else if (t3.k === k2)
      return;
    else {
      g2.mouse = [p2, t3.invert(p2)];
      interrupt_default(this);
      g2.start();
    }
    noevent_default2(event);
    g2.wheel = setTimeout(wheelidled, wheelDelay);
    g2.zoom("mouse", constrain(translate(scale(t3, k2), g2.mouse[0], g2.mouse[1]), g2.extent, translateExtent));
    function wheelidled() {
      g2.wheel = null;
      g2.end();
    }
  }
  function mousedowned(event, ...args) {
    if (touchending || !filter2.apply(this, arguments))
      return;
    var currentTarget = event.currentTarget, g2 = gesture(this, args, true).event(event), v2 = select_default2(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true), p2 = pointer_default(event, currentTarget), x0 = event.clientX, y0 = event.clientY;
    nodrag_default(event.view);
    nopropagation2(event);
    g2.mouse = [p2, this.__zoom.invert(p2)];
    interrupt_default(this);
    g2.start();
    function mousemoved(event2) {
      noevent_default2(event2);
      if (!g2.moved) {
        var dx = event2.clientX - x0, dy = event2.clientY - y0;
        g2.moved = dx * dx + dy * dy > clickDistance2;
      }
      g2.event(event2).zoom("mouse", constrain(translate(g2.that.__zoom, g2.mouse[0] = pointer_default(event2, currentTarget), g2.mouse[1]), g2.extent, translateExtent));
    }
    function mouseupped(event2) {
      v2.on("mousemove.zoom mouseup.zoom", null);
      yesdrag(event2.view, g2.moved);
      noevent_default2(event2);
      g2.event(event2).end();
    }
  }
  function dblclicked(event, ...args) {
    if (!filter2.apply(this, arguments))
      return;
    var t0 = this.__zoom, p0 = pointer_default(event.changedTouches ? event.changedTouches[0] : event, this), p1 = t0.invert(p0), k1 = t0.k * (event.shiftKey ? 0.5 : 2), t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, args), translateExtent);
    noevent_default2(event);
    if (duration > 0)
      select_default2(this).transition().duration(duration).call(schedule, t1, p0, event);
    else
      select_default2(this).call(zoom2.transform, t1, p0, event);
  }
  function touchstarted(event, ...args) {
    if (!filter2.apply(this, arguments))
      return;
    var touches = event.touches, n2 = touches.length, g2 = gesture(this, args, event.changedTouches.length === n2).event(event), started, i2, t3, p2;
    nopropagation2(event);
    for (i2 = 0; i2 < n2; ++i2) {
      t3 = touches[i2], p2 = pointer_default(t3, this);
      p2 = [p2, this.__zoom.invert(p2), t3.identifier];
      if (!g2.touch0)
        g2.touch0 = p2, started = true, g2.taps = 1 + !!touchstarting;
      else if (!g2.touch1 && g2.touch0[2] !== p2[2])
        g2.touch1 = p2, g2.taps = 0;
    }
    if (touchstarting)
      touchstarting = clearTimeout(touchstarting);
    if (started) {
      if (g2.taps < 2)
        touchfirst = p2[0], touchstarting = setTimeout(function() {
          touchstarting = null;
        }, touchDelay);
      interrupt_default(this);
      g2.start();
    }
  }
  function touchmoved(event, ...args) {
    if (!this.__zooming)
      return;
    var g2 = gesture(this, args).event(event), touches = event.changedTouches, n2 = touches.length, i2, t3, p2, l2;
    noevent_default2(event);
    for (i2 = 0; i2 < n2; ++i2) {
      t3 = touches[i2], p2 = pointer_default(t3, this);
      if (g2.touch0 && g2.touch0[2] === t3.identifier)
        g2.touch0[0] = p2;
      else if (g2.touch1 && g2.touch1[2] === t3.identifier)
        g2.touch1[0] = p2;
    }
    t3 = g2.that.__zoom;
    if (g2.touch1) {
      var p0 = g2.touch0[0], l0 = g2.touch0[1], p1 = g2.touch1[0], l1 = g2.touch1[1], dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp, dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
      t3 = scale(t3, Math.sqrt(dp / dl));
      p2 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      l2 = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
    } else if (g2.touch0)
      p2 = g2.touch0[0], l2 = g2.touch0[1];
    else
      return;
    g2.zoom("touch", constrain(translate(t3, p2, l2), g2.extent, translateExtent));
  }
  function touchended(event, ...args) {
    if (!this.__zooming)
      return;
    var g2 = gesture(this, args).event(event), touches = event.changedTouches, n2 = touches.length, i2, t3;
    nopropagation2(event);
    if (touchending)
      clearTimeout(touchending);
    touchending = setTimeout(function() {
      touchending = null;
    }, touchDelay);
    for (i2 = 0; i2 < n2; ++i2) {
      t3 = touches[i2];
      if (g2.touch0 && g2.touch0[2] === t3.identifier)
        delete g2.touch0;
      else if (g2.touch1 && g2.touch1[2] === t3.identifier)
        delete g2.touch1;
    }
    if (g2.touch1 && !g2.touch0)
      g2.touch0 = g2.touch1, delete g2.touch1;
    if (g2.touch0)
      g2.touch0[1] = this.__zoom.invert(g2.touch0[0]);
    else {
      g2.end();
      if (g2.taps === 2) {
        t3 = pointer_default(t3, this);
        if (Math.hypot(touchfirst[0] - t3[0], touchfirst[1] - t3[1]) < tapDistance) {
          var p2 = select_default2(this).on("dblclick.zoom");
          if (p2)
            p2.apply(this, arguments);
        }
      }
    }
  }
  zoom2.wheelDelta = function(_2) {
    return arguments.length ? (wheelDelta = typeof _2 === "function" ? _2 : constant_default4(+_2), zoom2) : wheelDelta;
  };
  zoom2.filter = function(_2) {
    return arguments.length ? (filter2 = typeof _2 === "function" ? _2 : constant_default4(!!_2), zoom2) : filter2;
  };
  zoom2.touchable = function(_2) {
    return arguments.length ? (touchable = typeof _2 === "function" ? _2 : constant_default4(!!_2), zoom2) : touchable;
  };
  zoom2.extent = function(_2) {
    return arguments.length ? (extent = typeof _2 === "function" ? _2 : constant_default4([[+_2[0][0], +_2[0][1]], [+_2[1][0], +_2[1][1]]]), zoom2) : extent;
  };
  zoom2.scaleExtent = function(_2) {
    return arguments.length ? (scaleExtent[0] = +_2[0], scaleExtent[1] = +_2[1], zoom2) : [scaleExtent[0], scaleExtent[1]];
  };
  zoom2.translateExtent = function(_2) {
    return arguments.length ? (translateExtent[0][0] = +_2[0][0], translateExtent[1][0] = +_2[1][0], translateExtent[0][1] = +_2[0][1], translateExtent[1][1] = +_2[1][1], zoom2) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
  };
  zoom2.constrain = function(_2) {
    return arguments.length ? (constrain = _2, zoom2) : constrain;
  };
  zoom2.duration = function(_2) {
    return arguments.length ? (duration = +_2, zoom2) : duration;
  };
  zoom2.interpolate = function(_2) {
    return arguments.length ? (interpolate = _2, zoom2) : interpolate;
  };
  zoom2.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? zoom2 : value;
  };
  zoom2.clickDistance = function(_2) {
    return arguments.length ? (clickDistance2 = (_2 = +_2) * _2, zoom2) : Math.sqrt(clickDistance2);
  };
  zoom2.tapDistance = function(_2) {
    return arguments.length ? (tapDistance = +_2, zoom2) : tapDistance;
  };
  return zoom2;
}
var init_zoom2 = __esm({
  "node_modules/d3-zoom/src/zoom.js"() {
    init_src2();
    init_src3();
    init_src5();
    init_src();
    init_src8();
    init_constant4();
    init_event2();
    init_transform2();
    init_noevent2();
  }
});

// node_modules/d3-zoom/src/index.js
var init_src9 = __esm({
  "node_modules/d3-zoom/src/index.js"() {
    init_zoom2();
    init_transform2();
  }
});

// node_modules/internmap/src/index.js
function intern_get({ _intern, _key }, value) {
  const key = _key(value);
  return _intern.has(key) ? _intern.get(key) : value;
}
function intern_set({ _intern, _key }, value) {
  const key = _key(value);
  if (_intern.has(key))
    return _intern.get(key);
  _intern.set(key, value);
  return value;
}
function intern_delete({ _intern, _key }, value) {
  const key = _key(value);
  if (_intern.has(key)) {
    value = _intern.get(key);
    _intern.delete(key);
  }
  return value;
}
function keyof(value) {
  return value !== null && typeof value === "object" ? value.valueOf() : value;
}
var InternMap;
var init_src10 = __esm({
  "node_modules/internmap/src/index.js"() {
    InternMap = class extends Map {
      constructor(entries, key = keyof) {
        super();
        Object.defineProperties(this, { _intern: { value: /* @__PURE__ */ new Map() }, _key: { value: key } });
        if (entries != null)
          for (const [key2, value] of entries)
            this.set(key2, value);
      }
      get(key) {
        return super.get(intern_get(this, key));
      }
      has(key) {
        return super.has(intern_get(this, key));
      }
      set(key, value) {
        return super.set(intern_set(this, key), value);
      }
      delete(key) {
        return super.delete(intern_delete(this, key));
      }
    };
  }
});

// node_modules/d3-array/src/max.js
function max(values, valueof) {
  let max3;
  if (valueof === void 0) {
    for (const value of values) {
      if (value != null && (max3 < value || max3 === void 0 && value >= value)) {
        max3 = value;
      }
    }
  } else {
    let index6 = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index6, values)) != null && (max3 < value || max3 === void 0 && value >= value)) {
        max3 = value;
      }
    }
  }
  return max3;
}
var init_max = __esm({
  "node_modules/d3-array/src/max.js"() {
  }
});

// node_modules/d3-array/src/min.js
function min(values, valueof) {
  let min3;
  if (valueof === void 0) {
    for (const value of values) {
      if (value != null && (min3 > value || min3 === void 0 && value >= value)) {
        min3 = value;
      }
    }
  } else {
    let index6 = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index6, values)) != null && (min3 > value || min3 === void 0 && value >= value)) {
        min3 = value;
      }
    }
  }
  return min3;
}
var init_min = __esm({
  "node_modules/d3-array/src/min.js"() {
  }
});

// node_modules/d3-array/src/sum.js
function sum(values, valueof) {
  let sum2 = 0;
  if (valueof === void 0) {
    for (let value of values) {
      if (value = +value) {
        sum2 += value;
      }
    }
  } else {
    let index6 = -1;
    for (let value of values) {
      if (value = +valueof(value, ++index6, values)) {
        sum2 += value;
      }
    }
  }
  return sum2;
}
var init_sum = __esm({
  "node_modules/d3-array/src/sum.js"() {
  }
});

// node_modules/d3-array/src/index.js
var init_src11 = __esm({
  "node_modules/d3-array/src/index.js"() {
    init_max();
    init_min();
    init_sum();
    init_src10();
  }
});

// node_modules/lodash-es/_freeGlobal.js
var freeGlobal, freeGlobal_default;
var init_freeGlobal = __esm({
  "node_modules/lodash-es/_freeGlobal.js"() {
    freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    freeGlobal_default = freeGlobal;
  }
});

// node_modules/lodash-es/_root.js
var freeSelf, root2, root_default;
var init_root = __esm({
  "node_modules/lodash-es/_root.js"() {
    init_freeGlobal();
    freeSelf = typeof self == "object" && self && self.Object === Object && self;
    root2 = freeGlobal_default || freeSelf || Function("return this")();
    root_default = root2;
  }
});

// node_modules/lodash-es/_Symbol.js
var Symbol2, Symbol_default;
var init_Symbol = __esm({
  "node_modules/lodash-es/_Symbol.js"() {
    init_root();
    Symbol2 = root_default.Symbol;
    Symbol_default = Symbol2;
  }
});

// node_modules/lodash-es/_getRawTag.js
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
  try {
    value[symToStringTag] = void 0;
    var unmasked = true;
  } catch (e2) {
  }
  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
var objectProto, hasOwnProperty, nativeObjectToString, symToStringTag, getRawTag_default;
var init_getRawTag = __esm({
  "node_modules/lodash-es/_getRawTag.js"() {
    init_Symbol();
    objectProto = Object.prototype;
    hasOwnProperty = objectProto.hasOwnProperty;
    nativeObjectToString = objectProto.toString;
    symToStringTag = Symbol_default ? Symbol_default.toStringTag : void 0;
    getRawTag_default = getRawTag;
  }
});

// node_modules/lodash-es/_objectToString.js
function objectToString(value) {
  return nativeObjectToString2.call(value);
}
var objectProto2, nativeObjectToString2, objectToString_default;
var init_objectToString = __esm({
  "node_modules/lodash-es/_objectToString.js"() {
    objectProto2 = Object.prototype;
    nativeObjectToString2 = objectProto2.toString;
    objectToString_default = objectToString;
  }
});

// node_modules/lodash-es/_baseGetTag.js
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag2 && symToStringTag2 in Object(value) ? getRawTag_default(value) : objectToString_default(value);
}
var nullTag, undefinedTag, symToStringTag2, baseGetTag_default;
var init_baseGetTag = __esm({
  "node_modules/lodash-es/_baseGetTag.js"() {
    init_Symbol();
    init_getRawTag();
    init_objectToString();
    nullTag = "[object Null]";
    undefinedTag = "[object Undefined]";
    symToStringTag2 = Symbol_default ? Symbol_default.toStringTag : void 0;
    baseGetTag_default = baseGetTag;
  }
});

// node_modules/lodash-es/isObjectLike.js
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
var isObjectLike_default;
var init_isObjectLike = __esm({
  "node_modules/lodash-es/isObjectLike.js"() {
    isObjectLike_default = isObjectLike;
  }
});

// node_modules/lodash-es/isSymbol.js
function isSymbol(value) {
  return typeof value == "symbol" || isObjectLike_default(value) && baseGetTag_default(value) == symbolTag;
}
var symbolTag, isSymbol_default;
var init_isSymbol = __esm({
  "node_modules/lodash-es/isSymbol.js"() {
    init_baseGetTag();
    init_isObjectLike();
    symbolTag = "[object Symbol]";
    isSymbol_default = isSymbol;
  }
});

// node_modules/lodash-es/_trimmedEndIndex.js
function trimmedEndIndex(string) {
  var index6 = string.length;
  while (index6-- && reWhitespace.test(string.charAt(index6))) {
  }
  return index6;
}
var reWhitespace, trimmedEndIndex_default;
var init_trimmedEndIndex = __esm({
  "node_modules/lodash-es/_trimmedEndIndex.js"() {
    reWhitespace = /\s/;
    trimmedEndIndex_default = trimmedEndIndex;
  }
});

// node_modules/lodash-es/_baseTrim.js
function baseTrim(string) {
  return string ? string.slice(0, trimmedEndIndex_default(string) + 1).replace(reTrimStart, "") : string;
}
var reTrimStart, baseTrim_default;
var init_baseTrim = __esm({
  "node_modules/lodash-es/_baseTrim.js"() {
    init_trimmedEndIndex();
    reTrimStart = /^\s+/;
    baseTrim_default = baseTrim;
  }
});

// node_modules/lodash-es/isObject.js
function isObject(value) {
  var type = typeof value;
  return value != null && (type == "object" || type == "function");
}
var isObject_default;
var init_isObject = __esm({
  "node_modules/lodash-es/isObject.js"() {
    isObject_default = isObject;
  }
});

// node_modules/lodash-es/toNumber.js
function toNumber(value) {
  if (typeof value == "number") {
    return value;
  }
  if (isSymbol_default(value)) {
    return NAN;
  }
  if (isObject_default(value)) {
    var other = typeof value.valueOf == "function" ? value.valueOf() : value;
    value = isObject_default(other) ? other + "" : other;
  }
  if (typeof value != "string") {
    return value === 0 ? value : +value;
  }
  value = baseTrim_default(value);
  var isBinary = reIsBinary.test(value);
  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}
var NAN, reIsBadHex, reIsBinary, reIsOctal, freeParseInt, toNumber_default;
var init_toNumber = __esm({
  "node_modules/lodash-es/toNumber.js"() {
    init_baseTrim();
    init_isObject();
    init_isSymbol();
    NAN = 0 / 0;
    reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    reIsBinary = /^0b[01]+$/i;
    reIsOctal = /^0o[0-7]+$/i;
    freeParseInt = parseInt;
    toNumber_default = toNumber;
  }
});

// node_modules/lodash-es/now.js
var now2, now_default;
var init_now = __esm({
  "node_modules/lodash-es/now.js"() {
    init_root();
    now2 = function() {
      return root_default.Date.now();
    };
    now_default = now2;
  }
});

// node_modules/lodash-es/debounce.js
function debounce(func, wait, options) {
  var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
  if (typeof func != "function") {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber_default(wait) || 0;
  if (isObject_default(options)) {
    leading = !!options.leading;
    maxing = "maxWait" in options;
    maxWait = maxing ? nativeMax(toNumber_default(options.maxWait) || 0, wait) : maxWait;
    trailing = "trailing" in options ? !!options.trailing : trailing;
  }
  function invokeFunc(time) {
    var args = lastArgs, thisArg = lastThis;
    lastArgs = lastThis = void 0;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }
  function leadingEdge(time) {
    lastInvokeTime = time;
    timerId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }
  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
    return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
  }
  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
    return lastCallTime === void 0 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
  }
  function timerExpired() {
    var time = now_default();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = setTimeout(timerExpired, remainingWait(time));
  }
  function trailingEdge(time) {
    timerId = void 0;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = void 0;
    return result;
  }
  function cancel() {
    if (timerId !== void 0) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = void 0;
  }
  function flush() {
    return timerId === void 0 ? result : trailingEdge(now_default());
  }
  function debounced() {
    var time = now_default(), isInvoking = shouldInvoke(time);
    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;
    if (isInvoking) {
      if (timerId === void 0) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === void 0) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}
var FUNC_ERROR_TEXT, nativeMax, nativeMin, debounce_default;
var init_debounce = __esm({
  "node_modules/lodash-es/debounce.js"() {
    init_isObject();
    init_now();
    init_toNumber();
    FUNC_ERROR_TEXT = "Expected a function";
    nativeMax = Math.max;
    nativeMin = Math.min;
    debounce_default = debounce;
  }
});

// node_modules/lodash-es/throttle.js
function throttle(func, wait, options) {
  var leading = true, trailing = true;
  if (typeof func != "function") {
    throw new TypeError(FUNC_ERROR_TEXT2);
  }
  if (isObject_default(options)) {
    leading = "leading" in options ? !!options.leading : leading;
    trailing = "trailing" in options ? !!options.trailing : trailing;
  }
  return debounce_default(func, wait, {
    "leading": leading,
    "maxWait": wait,
    "trailing": trailing
  });
}
var FUNC_ERROR_TEXT2, throttle_default;
var init_throttle = __esm({
  "node_modules/lodash-es/throttle.js"() {
    init_debounce();
    init_isObject();
    FUNC_ERROR_TEXT2 = "Expected a function";
    throttle_default = throttle;
  }
});

// node_modules/lodash-es/lodash.js
var init_lodash = __esm({
  "node_modules/lodash-es/lodash.js"() {
    init_throttle();
  }
});

// node_modules/@tweenjs/tween.js/dist/tween.esm.js
var Easing, now3, Group, Interpolation, Sequence, mainGroup, Tween, nextId, TWEEN, getAll, removeAll, add, remove2, update;
var init_tween_esm = __esm({
  "node_modules/@tweenjs/tween.js/dist/tween.esm.js"() {
    Easing = Object.freeze({
      Linear: Object.freeze({
        None: function(amount) {
          return amount;
        },
        In: function(amount) {
          return amount;
        },
        Out: function(amount) {
          return amount;
        },
        InOut: function(amount) {
          return amount;
        }
      }),
      Quadratic: Object.freeze({
        In: function(amount) {
          return amount * amount;
        },
        Out: function(amount) {
          return amount * (2 - amount);
        },
        InOut: function(amount) {
          if ((amount *= 2) < 1) {
            return 0.5 * amount * amount;
          }
          return -0.5 * (--amount * (amount - 2) - 1);
        }
      }),
      Cubic: Object.freeze({
        In: function(amount) {
          return amount * amount * amount;
        },
        Out: function(amount) {
          return --amount * amount * amount + 1;
        },
        InOut: function(amount) {
          if ((amount *= 2) < 1) {
            return 0.5 * amount * amount * amount;
          }
          return 0.5 * ((amount -= 2) * amount * amount + 2);
        }
      }),
      Quartic: Object.freeze({
        In: function(amount) {
          return amount * amount * amount * amount;
        },
        Out: function(amount) {
          return 1 - --amount * amount * amount * amount;
        },
        InOut: function(amount) {
          if ((amount *= 2) < 1) {
            return 0.5 * amount * amount * amount * amount;
          }
          return -0.5 * ((amount -= 2) * amount * amount * amount - 2);
        }
      }),
      Quintic: Object.freeze({
        In: function(amount) {
          return amount * amount * amount * amount * amount;
        },
        Out: function(amount) {
          return --amount * amount * amount * amount * amount + 1;
        },
        InOut: function(amount) {
          if ((amount *= 2) < 1) {
            return 0.5 * amount * amount * amount * amount * amount;
          }
          return 0.5 * ((amount -= 2) * amount * amount * amount * amount + 2);
        }
      }),
      Sinusoidal: Object.freeze({
        In: function(amount) {
          return 1 - Math.sin((1 - amount) * Math.PI / 2);
        },
        Out: function(amount) {
          return Math.sin(amount * Math.PI / 2);
        },
        InOut: function(amount) {
          return 0.5 * (1 - Math.sin(Math.PI * (0.5 - amount)));
        }
      }),
      Exponential: Object.freeze({
        In: function(amount) {
          return amount === 0 ? 0 : Math.pow(1024, amount - 1);
        },
        Out: function(amount) {
          return amount === 1 ? 1 : 1 - Math.pow(2, -10 * amount);
        },
        InOut: function(amount) {
          if (amount === 0) {
            return 0;
          }
          if (amount === 1) {
            return 1;
          }
          if ((amount *= 2) < 1) {
            return 0.5 * Math.pow(1024, amount - 1);
          }
          return 0.5 * (-Math.pow(2, -10 * (amount - 1)) + 2);
        }
      }),
      Circular: Object.freeze({
        In: function(amount) {
          return 1 - Math.sqrt(1 - amount * amount);
        },
        Out: function(amount) {
          return Math.sqrt(1 - --amount * amount);
        },
        InOut: function(amount) {
          if ((amount *= 2) < 1) {
            return -0.5 * (Math.sqrt(1 - amount * amount) - 1);
          }
          return 0.5 * (Math.sqrt(1 - (amount -= 2) * amount) + 1);
        }
      }),
      Elastic: Object.freeze({
        In: function(amount) {
          if (amount === 0) {
            return 0;
          }
          if (amount === 1) {
            return 1;
          }
          return -Math.pow(2, 10 * (amount - 1)) * Math.sin((amount - 1.1) * 5 * Math.PI);
        },
        Out: function(amount) {
          if (amount === 0) {
            return 0;
          }
          if (amount === 1) {
            return 1;
          }
          return Math.pow(2, -10 * amount) * Math.sin((amount - 0.1) * 5 * Math.PI) + 1;
        },
        InOut: function(amount) {
          if (amount === 0) {
            return 0;
          }
          if (amount === 1) {
            return 1;
          }
          amount *= 2;
          if (amount < 1) {
            return -0.5 * Math.pow(2, 10 * (amount - 1)) * Math.sin((amount - 1.1) * 5 * Math.PI);
          }
          return 0.5 * Math.pow(2, -10 * (amount - 1)) * Math.sin((amount - 1.1) * 5 * Math.PI) + 1;
        }
      }),
      Back: Object.freeze({
        In: function(amount) {
          var s2 = 1.70158;
          return amount === 1 ? 1 : amount * amount * ((s2 + 1) * amount - s2);
        },
        Out: function(amount) {
          var s2 = 1.70158;
          return amount === 0 ? 0 : --amount * amount * ((s2 + 1) * amount + s2) + 1;
        },
        InOut: function(amount) {
          var s2 = 1.70158 * 1.525;
          if ((amount *= 2) < 1) {
            return 0.5 * (amount * amount * ((s2 + 1) * amount - s2));
          }
          return 0.5 * ((amount -= 2) * amount * ((s2 + 1) * amount + s2) + 2);
        }
      }),
      Bounce: Object.freeze({
        In: function(amount) {
          return 1 - Easing.Bounce.Out(1 - amount);
        },
        Out: function(amount) {
          if (amount < 1 / 2.75) {
            return 7.5625 * amount * amount;
          } else if (amount < 2 / 2.75) {
            return 7.5625 * (amount -= 1.5 / 2.75) * amount + 0.75;
          } else if (amount < 2.5 / 2.75) {
            return 7.5625 * (amount -= 2.25 / 2.75) * amount + 0.9375;
          } else {
            return 7.5625 * (amount -= 2.625 / 2.75) * amount + 0.984375;
          }
        },
        InOut: function(amount) {
          if (amount < 0.5) {
            return Easing.Bounce.In(amount * 2) * 0.5;
          }
          return Easing.Bounce.Out(amount * 2 - 1) * 0.5 + 0.5;
        }
      }),
      generatePow: function(power) {
        if (power === void 0) {
          power = 4;
        }
        power = power < Number.EPSILON ? Number.EPSILON : power;
        power = power > 1e4 ? 1e4 : power;
        return {
          In: function(amount) {
            return Math.pow(amount, power);
          },
          Out: function(amount) {
            return 1 - Math.pow(1 - amount, power);
          },
          InOut: function(amount) {
            if (amount < 0.5) {
              return Math.pow(amount * 2, power) / 2;
            }
            return (1 - Math.pow(2 - amount * 2, power)) / 2 + 0.5;
          }
        };
      }
    });
    now3 = function() {
      return performance.now();
    };
    Group = function() {
      function Group2() {
        var tweens = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          tweens[_i] = arguments[_i];
        }
        this._tweens = {};
        this._tweensAddedDuringUpdate = {};
        this.add.apply(this, tweens);
      }
      Group2.prototype.getAll = function() {
        var _this = this;
        return Object.keys(this._tweens).map(function(tweenId) {
          return _this._tweens[tweenId];
        });
      };
      Group2.prototype.removeAll = function() {
        this._tweens = {};
      };
      Group2.prototype.add = function() {
        var _a;
        var tweens = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          tweens[_i] = arguments[_i];
        }
        for (var _b = 0, tweens_1 = tweens; _b < tweens_1.length; _b++) {
          var tween = tweens_1[_b];
          (_a = tween._group) === null || _a === void 0 ? void 0 : _a.remove(tween);
          tween._group = this;
          this._tweens[tween.getId()] = tween;
          this._tweensAddedDuringUpdate[tween.getId()] = tween;
        }
      };
      Group2.prototype.remove = function() {
        var tweens = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          tweens[_i] = arguments[_i];
        }
        for (var _a = 0, tweens_2 = tweens; _a < tweens_2.length; _a++) {
          var tween = tweens_2[_a];
          tween._group = void 0;
          delete this._tweens[tween.getId()];
          delete this._tweensAddedDuringUpdate[tween.getId()];
        }
      };
      Group2.prototype.allStopped = function() {
        return this.getAll().every(function(tween) {
          return !tween.isPlaying();
        });
      };
      Group2.prototype.update = function(time, preserve) {
        if (time === void 0) {
          time = now3();
        }
        if (preserve === void 0) {
          preserve = true;
        }
        var tweenIds = Object.keys(this._tweens);
        if (tweenIds.length === 0)
          return;
        while (tweenIds.length > 0) {
          this._tweensAddedDuringUpdate = {};
          for (var i2 = 0; i2 < tweenIds.length; i2++) {
            var tween = this._tweens[tweenIds[i2]];
            var autoStart = !preserve;
            if (tween && tween.update(time, autoStart) === false && !preserve)
              this.remove(tween);
          }
          tweenIds = Object.keys(this._tweensAddedDuringUpdate);
        }
      };
      return Group2;
    }();
    Interpolation = {
      Linear: function(v2, k2) {
        var m3 = v2.length - 1;
        var f2 = m3 * k2;
        var i2 = Math.floor(f2);
        var fn = Interpolation.Utils.Linear;
        if (k2 < 0) {
          return fn(v2[0], v2[1], f2);
        }
        if (k2 > 1) {
          return fn(v2[m3], v2[m3 - 1], m3 - f2);
        }
        return fn(v2[i2], v2[i2 + 1 > m3 ? m3 : i2 + 1], f2 - i2);
      },
      Bezier: function(v2, k2) {
        var b = 0;
        var n2 = v2.length - 1;
        var pw = Math.pow;
        var bn = Interpolation.Utils.Bernstein;
        for (var i2 = 0; i2 <= n2; i2++) {
          b += pw(1 - k2, n2 - i2) * pw(k2, i2) * v2[i2] * bn(n2, i2);
        }
        return b;
      },
      CatmullRom: function(v2, k2) {
        var m3 = v2.length - 1;
        var f2 = m3 * k2;
        var i2 = Math.floor(f2);
        var fn = Interpolation.Utils.CatmullRom;
        if (v2[0] === v2[m3]) {
          if (k2 < 0) {
            i2 = Math.floor(f2 = m3 * (1 + k2));
          }
          return fn(v2[(i2 - 1 + m3) % m3], v2[i2], v2[(i2 + 1) % m3], v2[(i2 + 2) % m3], f2 - i2);
        } else {
          if (k2 < 0) {
            return v2[0] - (fn(v2[0], v2[0], v2[1], v2[1], -f2) - v2[0]);
          }
          if (k2 > 1) {
            return v2[m3] - (fn(v2[m3], v2[m3], v2[m3 - 1], v2[m3 - 1], f2 - m3) - v2[m3]);
          }
          return fn(v2[i2 ? i2 - 1 : 0], v2[i2], v2[m3 < i2 + 1 ? m3 : i2 + 1], v2[m3 < i2 + 2 ? m3 : i2 + 2], f2 - i2);
        }
      },
      Utils: {
        Linear: function(p0, p1, t3) {
          return (p1 - p0) * t3 + p0;
        },
        Bernstein: function(n2, i2) {
          var fc = Interpolation.Utils.Factorial;
          return fc(n2) / fc(i2) / fc(n2 - i2);
        },
        Factorial: function() {
          var a3 = [1];
          return function(n2) {
            var s2 = 1;
            if (a3[n2]) {
              return a3[n2];
            }
            for (var i2 = n2; i2 > 1; i2--) {
              s2 *= i2;
            }
            a3[n2] = s2;
            return s2;
          };
        }(),
        CatmullRom: function(p0, p1, p2, p3, t3) {
          var v0 = (p2 - p0) * 0.5;
          var v1 = (p3 - p1) * 0.5;
          var t22 = t3 * t3;
          var t32 = t3 * t22;
          return (2 * p1 - 2 * p2 + v0 + v1) * t32 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t22 + v0 * t3 + p1;
        }
      }
    };
    Sequence = function() {
      function Sequence2() {
      }
      Sequence2.nextId = function() {
        return Sequence2._nextId++;
      };
      Sequence2._nextId = 0;
      return Sequence2;
    }();
    mainGroup = new Group();
    Tween = function() {
      function Tween2(object, group) {
        this._isPaused = false;
        this._pauseStart = 0;
        this._valuesStart = {};
        this._valuesEnd = {};
        this._valuesStartRepeat = {};
        this._duration = 1e3;
        this._isDynamic = false;
        this._initialRepeat = 0;
        this._repeat = 0;
        this._yoyo = false;
        this._isPlaying = false;
        this._reversed = false;
        this._delayTime = 0;
        this._startTime = 0;
        this._easingFunction = Easing.Linear.None;
        this._interpolationFunction = Interpolation.Linear;
        this._chainedTweens = [];
        this._onStartCallbackFired = false;
        this._onEveryStartCallbackFired = false;
        this._id = Sequence.nextId();
        this._isChainStopped = false;
        this._propertiesAreSetUp = false;
        this._goToEnd = false;
        this._object = object;
        if (typeof group === "object") {
          this._group = group;
          group.add(this);
        } else if (group === true) {
          this._group = mainGroup;
          mainGroup.add(this);
        }
      }
      Tween2.prototype.getId = function() {
        return this._id;
      };
      Tween2.prototype.isPlaying = function() {
        return this._isPlaying;
      };
      Tween2.prototype.isPaused = function() {
        return this._isPaused;
      };
      Tween2.prototype.getDuration = function() {
        return this._duration;
      };
      Tween2.prototype.to = function(target, duration) {
        if (duration === void 0) {
          duration = 1e3;
        }
        if (this._isPlaying)
          throw new Error("Can not call Tween.to() while Tween is already started or paused. Stop the Tween first.");
        this._valuesEnd = target;
        this._propertiesAreSetUp = false;
        this._duration = duration < 0 ? 0 : duration;
        return this;
      };
      Tween2.prototype.duration = function(duration) {
        if (duration === void 0) {
          duration = 1e3;
        }
        this._duration = duration < 0 ? 0 : duration;
        return this;
      };
      Tween2.prototype.dynamic = function(dynamic) {
        if (dynamic === void 0) {
          dynamic = false;
        }
        this._isDynamic = dynamic;
        return this;
      };
      Tween2.prototype.start = function(time, overrideStartingValues) {
        if (time === void 0) {
          time = now3();
        }
        if (overrideStartingValues === void 0) {
          overrideStartingValues = false;
        }
        if (this._isPlaying) {
          return this;
        }
        this._repeat = this._initialRepeat;
        if (this._reversed) {
          this._reversed = false;
          for (var property in this._valuesStartRepeat) {
            this._swapEndStartRepeatValues(property);
            this._valuesStart[property] = this._valuesStartRepeat[property];
          }
        }
        this._isPlaying = true;
        this._isPaused = false;
        this._onStartCallbackFired = false;
        this._onEveryStartCallbackFired = false;
        this._isChainStopped = false;
        this._startTime = time;
        this._startTime += this._delayTime;
        if (!this._propertiesAreSetUp || overrideStartingValues) {
          this._propertiesAreSetUp = true;
          if (!this._isDynamic) {
            var tmp = {};
            for (var prop in this._valuesEnd)
              tmp[prop] = this._valuesEnd[prop];
            this._valuesEnd = tmp;
          }
          this._setupProperties(this._object, this._valuesStart, this._valuesEnd, this._valuesStartRepeat, overrideStartingValues);
        }
        return this;
      };
      Tween2.prototype.startFromCurrentValues = function(time) {
        return this.start(time, true);
      };
      Tween2.prototype._setupProperties = function(_object, _valuesStart, _valuesEnd, _valuesStartRepeat, overrideStartingValues) {
        for (var property in _valuesEnd) {
          var startValue = _object[property];
          var startValueIsArray = Array.isArray(startValue);
          var propType = startValueIsArray ? "array" : typeof startValue;
          var isInterpolationList = !startValueIsArray && Array.isArray(_valuesEnd[property]);
          if (propType === "undefined" || propType === "function") {
            continue;
          }
          if (isInterpolationList) {
            var endValues = _valuesEnd[property];
            if (endValues.length === 0) {
              continue;
            }
            var temp = [startValue];
            for (var i2 = 0, l2 = endValues.length; i2 < l2; i2 += 1) {
              var value = this._handleRelativeValue(startValue, endValues[i2]);
              if (isNaN(value)) {
                isInterpolationList = false;
                console.warn("Found invalid interpolation list. Skipping.");
                break;
              }
              temp.push(value);
            }
            if (isInterpolationList) {
              _valuesEnd[property] = temp;
            }
          }
          if ((propType === "object" || startValueIsArray) && startValue && !isInterpolationList) {
            _valuesStart[property] = startValueIsArray ? [] : {};
            var nestedObject = startValue;
            for (var prop in nestedObject) {
              _valuesStart[property][prop] = nestedObject[prop];
            }
            _valuesStartRepeat[property] = startValueIsArray ? [] : {};
            var endValues = _valuesEnd[property];
            if (!this._isDynamic) {
              var tmp = {};
              for (var prop in endValues)
                tmp[prop] = endValues[prop];
              _valuesEnd[property] = endValues = tmp;
            }
            this._setupProperties(nestedObject, _valuesStart[property], endValues, _valuesStartRepeat[property], overrideStartingValues);
          } else {
            if (typeof _valuesStart[property] === "undefined" || overrideStartingValues) {
              _valuesStart[property] = startValue;
            }
            if (!startValueIsArray) {
              _valuesStart[property] *= 1;
            }
            if (isInterpolationList) {
              _valuesStartRepeat[property] = _valuesEnd[property].slice().reverse();
            } else {
              _valuesStartRepeat[property] = _valuesStart[property] || 0;
            }
          }
        }
      };
      Tween2.prototype.stop = function() {
        if (!this._isChainStopped) {
          this._isChainStopped = true;
          this.stopChainedTweens();
        }
        if (!this._isPlaying) {
          return this;
        }
        this._isPlaying = false;
        this._isPaused = false;
        if (this._onStopCallback) {
          this._onStopCallback(this._object);
        }
        return this;
      };
      Tween2.prototype.end = function() {
        this._goToEnd = true;
        this.update(this._startTime + this._duration);
        return this;
      };
      Tween2.prototype.pause = function(time) {
        if (time === void 0) {
          time = now3();
        }
        if (this._isPaused || !this._isPlaying) {
          return this;
        }
        this._isPaused = true;
        this._pauseStart = time;
        return this;
      };
      Tween2.prototype.resume = function(time) {
        if (time === void 0) {
          time = now3();
        }
        if (!this._isPaused || !this._isPlaying) {
          return this;
        }
        this._isPaused = false;
        this._startTime += time - this._pauseStart;
        this._pauseStart = 0;
        return this;
      };
      Tween2.prototype.stopChainedTweens = function() {
        for (var i2 = 0, numChainedTweens = this._chainedTweens.length; i2 < numChainedTweens; i2++) {
          this._chainedTweens[i2].stop();
        }
        return this;
      };
      Tween2.prototype.group = function(group) {
        if (!group) {
          console.warn("tween.group() without args has been removed, use group.add(tween) instead.");
          return this;
        }
        group.add(this);
        return this;
      };
      Tween2.prototype.remove = function() {
        var _a;
        (_a = this._group) === null || _a === void 0 ? void 0 : _a.remove(this);
        return this;
      };
      Tween2.prototype.delay = function(amount) {
        if (amount === void 0) {
          amount = 0;
        }
        this._delayTime = amount;
        return this;
      };
      Tween2.prototype.repeat = function(times) {
        if (times === void 0) {
          times = 0;
        }
        this._initialRepeat = times;
        this._repeat = times;
        return this;
      };
      Tween2.prototype.repeatDelay = function(amount) {
        this._repeatDelayTime = amount;
        return this;
      };
      Tween2.prototype.yoyo = function(yoyo) {
        if (yoyo === void 0) {
          yoyo = false;
        }
        this._yoyo = yoyo;
        return this;
      };
      Tween2.prototype.easing = function(easingFunction) {
        if (easingFunction === void 0) {
          easingFunction = Easing.Linear.None;
        }
        this._easingFunction = easingFunction;
        return this;
      };
      Tween2.prototype.interpolation = function(interpolationFunction) {
        if (interpolationFunction === void 0) {
          interpolationFunction = Interpolation.Linear;
        }
        this._interpolationFunction = interpolationFunction;
        return this;
      };
      Tween2.prototype.chain = function() {
        var tweens = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          tweens[_i] = arguments[_i];
        }
        this._chainedTweens = tweens;
        return this;
      };
      Tween2.prototype.onStart = function(callback) {
        this._onStartCallback = callback;
        return this;
      };
      Tween2.prototype.onEveryStart = function(callback) {
        this._onEveryStartCallback = callback;
        return this;
      };
      Tween2.prototype.onUpdate = function(callback) {
        this._onUpdateCallback = callback;
        return this;
      };
      Tween2.prototype.onRepeat = function(callback) {
        this._onRepeatCallback = callback;
        return this;
      };
      Tween2.prototype.onComplete = function(callback) {
        this._onCompleteCallback = callback;
        return this;
      };
      Tween2.prototype.onStop = function(callback) {
        this._onStopCallback = callback;
        return this;
      };
      Tween2.prototype.update = function(time, autoStart) {
        var _this = this;
        var _a;
        if (time === void 0) {
          time = now3();
        }
        if (autoStart === void 0) {
          autoStart = Tween2.autoStartOnUpdate;
        }
        if (this._isPaused)
          return true;
        var property;
        if (!this._goToEnd && !this._isPlaying) {
          if (autoStart)
            this.start(time, true);
          else
            return false;
        }
        this._goToEnd = false;
        if (time < this._startTime) {
          return true;
        }
        if (this._onStartCallbackFired === false) {
          if (this._onStartCallback) {
            this._onStartCallback(this._object);
          }
          this._onStartCallbackFired = true;
        }
        if (this._onEveryStartCallbackFired === false) {
          if (this._onEveryStartCallback) {
            this._onEveryStartCallback(this._object);
          }
          this._onEveryStartCallbackFired = true;
        }
        var elapsedTime = time - this._startTime;
        var durationAndDelay = this._duration + ((_a = this._repeatDelayTime) !== null && _a !== void 0 ? _a : this._delayTime);
        var totalTime = this._duration + this._repeat * durationAndDelay;
        var calculateElapsedPortion = function() {
          if (_this._duration === 0)
            return 1;
          if (elapsedTime > totalTime) {
            return 1;
          }
          var timesRepeated = Math.trunc(elapsedTime / durationAndDelay);
          var timeIntoCurrentRepeat = elapsedTime - timesRepeated * durationAndDelay;
          var portion = Math.min(timeIntoCurrentRepeat / _this._duration, 1);
          if (portion === 0 && elapsedTime === _this._duration) {
            return 1;
          }
          return portion;
        };
        var elapsed = calculateElapsedPortion();
        var value = this._easingFunction(elapsed);
        this._updateProperties(this._object, this._valuesStart, this._valuesEnd, value);
        if (this._onUpdateCallback) {
          this._onUpdateCallback(this._object, elapsed);
        }
        if (this._duration === 0 || elapsedTime >= this._duration) {
          if (this._repeat > 0) {
            var completeCount = Math.min(Math.trunc((elapsedTime - this._duration) / durationAndDelay) + 1, this._repeat);
            if (isFinite(this._repeat)) {
              this._repeat -= completeCount;
            }
            for (property in this._valuesStartRepeat) {
              if (!this._yoyo && typeof this._valuesEnd[property] === "string") {
                this._valuesStartRepeat[property] = this._valuesStartRepeat[property] + parseFloat(this._valuesEnd[property]);
              }
              if (this._yoyo) {
                this._swapEndStartRepeatValues(property);
              }
              this._valuesStart[property] = this._valuesStartRepeat[property];
            }
            if (this._yoyo) {
              this._reversed = !this._reversed;
            }
            this._startTime += durationAndDelay * completeCount;
            if (this._onRepeatCallback) {
              this._onRepeatCallback(this._object);
            }
            this._onEveryStartCallbackFired = false;
            return true;
          } else {
            if (this._onCompleteCallback) {
              this._onCompleteCallback(this._object);
            }
            for (var i2 = 0, numChainedTweens = this._chainedTweens.length; i2 < numChainedTweens; i2++) {
              this._chainedTweens[i2].start(this._startTime + this._duration, false);
            }
            this._isPlaying = false;
            return false;
          }
        }
        return true;
      };
      Tween2.prototype._updateProperties = function(_object, _valuesStart, _valuesEnd, value) {
        for (var property in _valuesEnd) {
          if (_valuesStart[property] === void 0) {
            continue;
          }
          var start2 = _valuesStart[property] || 0;
          var end = _valuesEnd[property];
          var startIsArray = Array.isArray(_object[property]);
          var endIsArray = Array.isArray(end);
          var isInterpolationList = !startIsArray && endIsArray;
          if (isInterpolationList) {
            _object[property] = this._interpolationFunction(end, value);
          } else if (typeof end === "object" && end) {
            this._updateProperties(_object[property], start2, end, value);
          } else {
            end = this._handleRelativeValue(start2, end);
            if (typeof end === "number") {
              _object[property] = start2 + (end - start2) * value;
            }
          }
        }
      };
      Tween2.prototype._handleRelativeValue = function(start2, end) {
        if (typeof end !== "string") {
          return end;
        }
        if (end.charAt(0) === "+" || end.charAt(0) === "-") {
          return start2 + parseFloat(end);
        }
        return parseFloat(end);
      };
      Tween2.prototype._swapEndStartRepeatValues = function(property) {
        var tmp = this._valuesStartRepeat[property];
        var endValue = this._valuesEnd[property];
        if (typeof endValue === "string") {
          this._valuesStartRepeat[property] = this._valuesStartRepeat[property] + parseFloat(endValue);
        } else {
          this._valuesStartRepeat[property] = this._valuesEnd[property];
        }
        this._valuesEnd[property] = tmp;
      };
      Tween2.autoStartOnUpdate = false;
      return Tween2;
    }();
    nextId = Sequence.nextId;
    TWEEN = mainGroup;
    getAll = TWEEN.getAll.bind(TWEEN);
    removeAll = TWEEN.removeAll.bind(TWEEN);
    add = TWEEN.add.bind(TWEEN);
    remove2 = TWEEN.remove.bind(TWEEN);
    update = TWEEN.update.bind(TWEEN);
  }
});

// node_modules/kapsule/dist/kapsule.mjs
function _arrayLikeToArray(r2, a3) {
  (null == a3 || a3 > r2.length) && (a3 = r2.length);
  for (var e2 = 0, n2 = Array(a3); e2 < a3; e2++)
    n2[e2] = r2[e2];
  return n2;
}
function _arrayWithHoles(r2) {
  if (Array.isArray(r2))
    return r2;
}
function _classCallCheck(a3, n2) {
  if (!(a3 instanceof n2))
    throw new TypeError("Cannot call a class as a function");
}
function _createClass(e2, r2, t3) {
  return Object.defineProperty(e2, "prototype", {
    writable: false
  }), e2;
}
function _iterableToArrayLimit(r2, l2) {
  var t3 = null == r2 ? null : "undefined" != typeof Symbol && r2[Symbol.iterator] || r2["@@iterator"];
  if (null != t3) {
    var e2, n2, i2, u2, a3 = [], f2 = true, o2 = false;
    try {
      if (i2 = (t3 = t3.call(r2)).next, 0 === l2)
        ;
      else
        for (; !(f2 = (e2 = i2.call(t3)).done) && (a3.push(e2.value), a3.length !== l2); f2 = true)
          ;
    } catch (r3) {
      o2 = true, n2 = r3;
    } finally {
      try {
        if (!f2 && null != t3.return && (u2 = t3.return(), Object(u2) !== u2))
          return;
      } finally {
        if (o2)
          throw n2;
      }
    }
    return a3;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r2, e2) {
  return _arrayWithHoles(r2) || _iterableToArrayLimit(r2, e2) || _unsupportedIterableToArray(r2, e2) || _nonIterableRest();
}
function _unsupportedIterableToArray(r2, a3) {
  if (r2) {
    if ("string" == typeof r2)
      return _arrayLikeToArray(r2, a3);
    var t3 = {}.toString.call(r2).slice(8, -1);
    return "Object" === t3 && r2.constructor && (t3 = r2.constructor.name), "Map" === t3 || "Set" === t3 ? Array.from(r2) : "Arguments" === t3 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t3) ? _arrayLikeToArray(r2, a3) : void 0;
  }
}
function index(_ref2) {
  var _ref2$stateInit = _ref2.stateInit, stateInit3 = _ref2$stateInit === void 0 ? function() {
    return {};
  } : _ref2$stateInit, _ref2$props = _ref2.props, rawProps = _ref2$props === void 0 ? {} : _ref2$props, _ref2$methods = _ref2.methods, methods = _ref2$methods === void 0 ? {} : _ref2$methods, _ref2$aliases = _ref2.aliases, aliases = _ref2$aliases === void 0 ? {} : _ref2$aliases, _ref2$init = _ref2.init, initFn = _ref2$init === void 0 ? function() {
  } : _ref2$init, _ref2$update = _ref2.update, updateFn2 = _ref2$update === void 0 ? function() {
  } : _ref2$update;
  var props = Object.keys(rawProps).map(function(propName) {
    return new Prop(propName, rawProps[propName]);
  });
  return function KapsuleComp() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    var classMode = !!(this instanceof KapsuleComp ? this.constructor : void 0);
    var nodeElement = classMode ? args.shift() : void 0;
    var _args$ = args[0], options = _args$ === void 0 ? {} : _args$;
    var state = Object.assign({}, stateInit3 instanceof Function ? stateInit3(options) : stateInit3, {
      initialised: false
    });
    var changedProps = {};
    function comp(nodeElement2) {
      initStatic(nodeElement2, options);
      digest();
      return comp;
    }
    var initStatic = function initStatic2(nodeElement2, options2) {
      initFn.call(comp, nodeElement2, state, options2);
      state.initialised = true;
    };
    var digest = debounce_default(function() {
      if (!state.initialised) {
        return;
      }
      updateFn2.call(comp, state, changedProps);
      changedProps = {};
    }, 1);
    props.forEach(function(prop) {
      comp[prop.name] = getSetProp(prop);
      function getSetProp(_ref3) {
        var prop2 = _ref3.name, _ref3$triggerUpdate = _ref3.triggerUpdate, redigest = _ref3$triggerUpdate === void 0 ? false : _ref3$triggerUpdate, _ref3$onChange = _ref3.onChange, onChange15 = _ref3$onChange === void 0 ? function(newVal, state2) {
        } : _ref3$onChange, _ref3$defaultVal = _ref3.defaultVal, defaultVal = _ref3$defaultVal === void 0 ? null : _ref3$defaultVal;
        return function(_2) {
          var curVal = state[prop2];
          if (!arguments.length) {
            return curVal;
          }
          var val = _2 === void 0 ? defaultVal : _2;
          state[prop2] = val;
          onChange15.call(comp, val, state, curVal);
          !changedProps.hasOwnProperty(prop2) && (changedProps[prop2] = curVal);
          if (redigest) {
            digest();
          }
          return comp;
        };
      }
    });
    Object.keys(methods).forEach(function(methodName) {
      comp[methodName] = function() {
        var _methods$methodName;
        for (var _len2 = arguments.length, args2 = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args2[_key2] = arguments[_key2];
        }
        return (_methods$methodName = methods[methodName]).call.apply(_methods$methodName, [comp, state].concat(args2));
      };
    });
    Object.entries(aliases).forEach(function(_ref4) {
      var _ref5 = _slicedToArray(_ref4, 2), alias = _ref5[0], target = _ref5[1];
      return comp[alias] = comp[target];
    });
    comp.resetProps = function() {
      props.forEach(function(prop) {
        comp[prop.name](prop.defaultVal);
      });
      return comp;
    };
    comp.resetProps();
    state._rerender = digest;
    classMode && nodeElement && comp(nodeElement);
    return comp;
  };
}
var Prop;
var init_kapsule = __esm({
  "node_modules/kapsule/dist/kapsule.mjs"() {
    init_debounce();
    Prop = /* @__PURE__ */ _createClass(function Prop2(name, _ref) {
      var _ref$default = _ref["default"], defaultVal = _ref$default === void 0 ? null : _ref$default, _ref$triggerUpdate = _ref.triggerUpdate, triggerUpdate = _ref$triggerUpdate === void 0 ? true : _ref$triggerUpdate, _ref$onChange = _ref.onChange, onChange15 = _ref$onChange === void 0 ? function(newVal, state) {
      } : _ref$onChange;
      _classCallCheck(this, Prop2);
      this.name = name;
      this.defaultVal = defaultVal;
      this.triggerUpdate = triggerUpdate;
      this.onChange = onChange15;
    });
  }
});

// node_modules/accessor-fn/dist/accessor-fn.mjs
var index2;
var init_accessor_fn = __esm({
  "node_modules/accessor-fn/dist/accessor-fn.mjs"() {
    index2 = function(p2) {
      return typeof p2 === "function" ? p2 : typeof p2 === "string" ? function(obj) {
        return obj[p2];
      } : function(obj) {
        return p2;
      };
    };
  }
});

// node_modules/tinycolor2/esm/tinycolor.js
function _typeof(obj) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj2) {
    return typeof obj2;
  } : function(obj2) {
    return obj2 && "function" == typeof Symbol && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
  }, _typeof(obj);
}
function tinycolor(color2, opts) {
  color2 = color2 ? color2 : "";
  opts = opts || {};
  if (color2 instanceof tinycolor) {
    return color2;
  }
  if (!(this instanceof tinycolor)) {
    return new tinycolor(color2, opts);
  }
  var rgb2 = inputToRGB(color2);
  this._originalInput = color2, this._r = rgb2.r, this._g = rgb2.g, this._b = rgb2.b, this._a = rgb2.a, this._roundA = Math.round(100 * this._a) / 100, this._format = opts.format || rgb2.format;
  this._gradientType = opts.gradientType;
  if (this._r < 1)
    this._r = Math.round(this._r);
  if (this._g < 1)
    this._g = Math.round(this._g);
  if (this._b < 1)
    this._b = Math.round(this._b);
  this._ok = rgb2.ok;
}
function inputToRGB(color2) {
  var rgb2 = {
    r: 0,
    g: 0,
    b: 0
  };
  var a3 = 1;
  var s2 = null;
  var v2 = null;
  var l2 = null;
  var ok = false;
  var format = false;
  if (typeof color2 == "string") {
    color2 = stringInputToObject(color2);
  }
  if (_typeof(color2) == "object") {
    if (isValidCSSUnit(color2.r) && isValidCSSUnit(color2.g) && isValidCSSUnit(color2.b)) {
      rgb2 = rgbToRgb(color2.r, color2.g, color2.b);
      ok = true;
      format = String(color2.r).substr(-1) === "%" ? "prgb" : "rgb";
    } else if (isValidCSSUnit(color2.h) && isValidCSSUnit(color2.s) && isValidCSSUnit(color2.v)) {
      s2 = convertToPercentage(color2.s);
      v2 = convertToPercentage(color2.v);
      rgb2 = hsvToRgb(color2.h, s2, v2);
      ok = true;
      format = "hsv";
    } else if (isValidCSSUnit(color2.h) && isValidCSSUnit(color2.s) && isValidCSSUnit(color2.l)) {
      s2 = convertToPercentage(color2.s);
      l2 = convertToPercentage(color2.l);
      rgb2 = hslToRgb(color2.h, s2, l2);
      ok = true;
      format = "hsl";
    }
    if (color2.hasOwnProperty("a")) {
      a3 = color2.a;
    }
  }
  a3 = boundAlpha(a3);
  return {
    ok,
    format: color2.format || format,
    r: Math.min(255, Math.max(rgb2.r, 0)),
    g: Math.min(255, Math.max(rgb2.g, 0)),
    b: Math.min(255, Math.max(rgb2.b, 0)),
    a: a3
  };
}
function rgbToRgb(r2, g2, b) {
  return {
    r: bound01(r2, 255) * 255,
    g: bound01(g2, 255) * 255,
    b: bound01(b, 255) * 255
  };
}
function rgbToHsl(r2, g2, b) {
  r2 = bound01(r2, 255);
  g2 = bound01(g2, 255);
  b = bound01(b, 255);
  var max3 = Math.max(r2, g2, b), min3 = Math.min(r2, g2, b);
  var h2, s2, l2 = (max3 + min3) / 2;
  if (max3 == min3) {
    h2 = s2 = 0;
  } else {
    var d2 = max3 - min3;
    s2 = l2 > 0.5 ? d2 / (2 - max3 - min3) : d2 / (max3 + min3);
    switch (max3) {
      case r2:
        h2 = (g2 - b) / d2 + (g2 < b ? 6 : 0);
        break;
      case g2:
        h2 = (b - r2) / d2 + 2;
        break;
      case b:
        h2 = (r2 - g2) / d2 + 4;
        break;
    }
    h2 /= 6;
  }
  return {
    h: h2,
    s: s2,
    l: l2
  };
}
function hslToRgb(h2, s2, l2) {
  var r2, g2, b;
  h2 = bound01(h2, 360);
  s2 = bound01(s2, 100);
  l2 = bound01(l2, 100);
  function hue2rgb(p3, q3, t3) {
    if (t3 < 0)
      t3 += 1;
    if (t3 > 1)
      t3 -= 1;
    if (t3 < 1 / 6)
      return p3 + (q3 - p3) * 6 * t3;
    if (t3 < 1 / 2)
      return q3;
    if (t3 < 2 / 3)
      return p3 + (q3 - p3) * (2 / 3 - t3) * 6;
    return p3;
  }
  if (s2 === 0) {
    r2 = g2 = b = l2;
  } else {
    var q2 = l2 < 0.5 ? l2 * (1 + s2) : l2 + s2 - l2 * s2;
    var p2 = 2 * l2 - q2;
    r2 = hue2rgb(p2, q2, h2 + 1 / 3);
    g2 = hue2rgb(p2, q2, h2);
    b = hue2rgb(p2, q2, h2 - 1 / 3);
  }
  return {
    r: r2 * 255,
    g: g2 * 255,
    b: b * 255
  };
}
function rgbToHsv(r2, g2, b) {
  r2 = bound01(r2, 255);
  g2 = bound01(g2, 255);
  b = bound01(b, 255);
  var max3 = Math.max(r2, g2, b), min3 = Math.min(r2, g2, b);
  var h2, s2, v2 = max3;
  var d2 = max3 - min3;
  s2 = max3 === 0 ? 0 : d2 / max3;
  if (max3 == min3) {
    h2 = 0;
  } else {
    switch (max3) {
      case r2:
        h2 = (g2 - b) / d2 + (g2 < b ? 6 : 0);
        break;
      case g2:
        h2 = (b - r2) / d2 + 2;
        break;
      case b:
        h2 = (r2 - g2) / d2 + 4;
        break;
    }
    h2 /= 6;
  }
  return {
    h: h2,
    s: s2,
    v: v2
  };
}
function hsvToRgb(h2, s2, v2) {
  h2 = bound01(h2, 360) * 6;
  s2 = bound01(s2, 100);
  v2 = bound01(v2, 100);
  var i2 = Math.floor(h2), f2 = h2 - i2, p2 = v2 * (1 - s2), q2 = v2 * (1 - f2 * s2), t3 = v2 * (1 - (1 - f2) * s2), mod = i2 % 6, r2 = [v2, q2, p2, p2, t3, v2][mod], g2 = [t3, v2, v2, q2, p2, p2][mod], b = [p2, p2, t3, v2, v2, q2][mod];
  return {
    r: r2 * 255,
    g: g2 * 255,
    b: b * 255
  };
}
function rgbToHex(r2, g2, b, allow3Char) {
  var hex2 = [pad2(Math.round(r2).toString(16)), pad2(Math.round(g2).toString(16)), pad2(Math.round(b).toString(16))];
  if (allow3Char && hex2[0].charAt(0) == hex2[0].charAt(1) && hex2[1].charAt(0) == hex2[1].charAt(1) && hex2[2].charAt(0) == hex2[2].charAt(1)) {
    return hex2[0].charAt(0) + hex2[1].charAt(0) + hex2[2].charAt(0);
  }
  return hex2.join("");
}
function rgbaToHex(r2, g2, b, a3, allow4Char) {
  var hex2 = [pad2(Math.round(r2).toString(16)), pad2(Math.round(g2).toString(16)), pad2(Math.round(b).toString(16)), pad2(convertDecimalToHex(a3))];
  if (allow4Char && hex2[0].charAt(0) == hex2[0].charAt(1) && hex2[1].charAt(0) == hex2[1].charAt(1) && hex2[2].charAt(0) == hex2[2].charAt(1) && hex2[3].charAt(0) == hex2[3].charAt(1)) {
    return hex2[0].charAt(0) + hex2[1].charAt(0) + hex2[2].charAt(0) + hex2[3].charAt(0);
  }
  return hex2.join("");
}
function rgbaToArgbHex(r2, g2, b, a3) {
  var hex2 = [pad2(convertDecimalToHex(a3)), pad2(Math.round(r2).toString(16)), pad2(Math.round(g2).toString(16)), pad2(Math.round(b).toString(16))];
  return hex2.join("");
}
function _desaturate(color2, amount) {
  amount = amount === 0 ? 0 : amount || 10;
  var hsl2 = tinycolor(color2).toHsl();
  hsl2.s -= amount / 100;
  hsl2.s = clamp01(hsl2.s);
  return tinycolor(hsl2);
}
function _saturate(color2, amount) {
  amount = amount === 0 ? 0 : amount || 10;
  var hsl2 = tinycolor(color2).toHsl();
  hsl2.s += amount / 100;
  hsl2.s = clamp01(hsl2.s);
  return tinycolor(hsl2);
}
function _greyscale(color2) {
  return tinycolor(color2).desaturate(100);
}
function _lighten(color2, amount) {
  amount = amount === 0 ? 0 : amount || 10;
  var hsl2 = tinycolor(color2).toHsl();
  hsl2.l += amount / 100;
  hsl2.l = clamp01(hsl2.l);
  return tinycolor(hsl2);
}
function _brighten(color2, amount) {
  amount = amount === 0 ? 0 : amount || 10;
  var rgb2 = tinycolor(color2).toRgb();
  rgb2.r = Math.max(0, Math.min(255, rgb2.r - Math.round(255 * -(amount / 100))));
  rgb2.g = Math.max(0, Math.min(255, rgb2.g - Math.round(255 * -(amount / 100))));
  rgb2.b = Math.max(0, Math.min(255, rgb2.b - Math.round(255 * -(amount / 100))));
  return tinycolor(rgb2);
}
function _darken(color2, amount) {
  amount = amount === 0 ? 0 : amount || 10;
  var hsl2 = tinycolor(color2).toHsl();
  hsl2.l -= amount / 100;
  hsl2.l = clamp01(hsl2.l);
  return tinycolor(hsl2);
}
function _spin(color2, amount) {
  var hsl2 = tinycolor(color2).toHsl();
  var hue = (hsl2.h + amount) % 360;
  hsl2.h = hue < 0 ? 360 + hue : hue;
  return tinycolor(hsl2);
}
function _complement(color2) {
  var hsl2 = tinycolor(color2).toHsl();
  hsl2.h = (hsl2.h + 180) % 360;
  return tinycolor(hsl2);
}
function polyad(color2, number) {
  if (isNaN(number) || number <= 0) {
    throw new Error("Argument to polyad must be a positive number");
  }
  var hsl2 = tinycolor(color2).toHsl();
  var result = [tinycolor(color2)];
  var step = 360 / number;
  for (var i2 = 1; i2 < number; i2++) {
    result.push(tinycolor({
      h: (hsl2.h + i2 * step) % 360,
      s: hsl2.s,
      l: hsl2.l
    }));
  }
  return result;
}
function _splitcomplement(color2) {
  var hsl2 = tinycolor(color2).toHsl();
  var h2 = hsl2.h;
  return [tinycolor(color2), tinycolor({
    h: (h2 + 72) % 360,
    s: hsl2.s,
    l: hsl2.l
  }), tinycolor({
    h: (h2 + 216) % 360,
    s: hsl2.s,
    l: hsl2.l
  })];
}
function _analogous(color2, results, slices) {
  results = results || 6;
  slices = slices || 30;
  var hsl2 = tinycolor(color2).toHsl();
  var part = 360 / slices;
  var ret = [tinycolor(color2)];
  for (hsl2.h = (hsl2.h - (part * results >> 1) + 720) % 360; --results; ) {
    hsl2.h = (hsl2.h + part) % 360;
    ret.push(tinycolor(hsl2));
  }
  return ret;
}
function _monochromatic(color2, results) {
  results = results || 6;
  var hsv = tinycolor(color2).toHsv();
  var h2 = hsv.h, s2 = hsv.s, v2 = hsv.v;
  var ret = [];
  var modification = 1 / results;
  while (results--) {
    ret.push(tinycolor({
      h: h2,
      s: s2,
      v: v2
    }));
    v2 = (v2 + modification) % 1;
  }
  return ret;
}
function flip(o2) {
  var flipped = {};
  for (var i2 in o2) {
    if (o2.hasOwnProperty(i2)) {
      flipped[o2[i2]] = i2;
    }
  }
  return flipped;
}
function boundAlpha(a3) {
  a3 = parseFloat(a3);
  if (isNaN(a3) || a3 < 0 || a3 > 1) {
    a3 = 1;
  }
  return a3;
}
function bound01(n2, max3) {
  if (isOnePointZero(n2))
    n2 = "100%";
  var processPercent = isPercentage(n2);
  n2 = Math.min(max3, Math.max(0, parseFloat(n2)));
  if (processPercent) {
    n2 = parseInt(n2 * max3, 10) / 100;
  }
  if (Math.abs(n2 - max3) < 1e-6) {
    return 1;
  }
  return n2 % max3 / parseFloat(max3);
}
function clamp01(val) {
  return Math.min(1, Math.max(0, val));
}
function parseIntFromHex(val) {
  return parseInt(val, 16);
}
function isOnePointZero(n2) {
  return typeof n2 == "string" && n2.indexOf(".") != -1 && parseFloat(n2) === 1;
}
function isPercentage(n2) {
  return typeof n2 === "string" && n2.indexOf("%") != -1;
}
function pad2(c3) {
  return c3.length == 1 ? "0" + c3 : "" + c3;
}
function convertToPercentage(n2) {
  if (n2 <= 1) {
    n2 = n2 * 100 + "%";
  }
  return n2;
}
function convertDecimalToHex(d2) {
  return Math.round(parseFloat(d2) * 255).toString(16);
}
function convertHexToDecimal(h2) {
  return parseIntFromHex(h2) / 255;
}
function isValidCSSUnit(color2) {
  return !!matchers.CSS_UNIT.exec(color2);
}
function stringInputToObject(color2) {
  color2 = color2.replace(trimLeft, "").replace(trimRight, "").toLowerCase();
  var named2 = false;
  if (names[color2]) {
    color2 = names[color2];
    named2 = true;
  } else if (color2 == "transparent") {
    return {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
      format: "name"
    };
  }
  var match;
  if (match = matchers.rgb.exec(color2)) {
    return {
      r: match[1],
      g: match[2],
      b: match[3]
    };
  }
  if (match = matchers.rgba.exec(color2)) {
    return {
      r: match[1],
      g: match[2],
      b: match[3],
      a: match[4]
    };
  }
  if (match = matchers.hsl.exec(color2)) {
    return {
      h: match[1],
      s: match[2],
      l: match[3]
    };
  }
  if (match = matchers.hsla.exec(color2)) {
    return {
      h: match[1],
      s: match[2],
      l: match[3],
      a: match[4]
    };
  }
  if (match = matchers.hsv.exec(color2)) {
    return {
      h: match[1],
      s: match[2],
      v: match[3]
    };
  }
  if (match = matchers.hsva.exec(color2)) {
    return {
      h: match[1],
      s: match[2],
      v: match[3],
      a: match[4]
    };
  }
  if (match = matchers.hex8.exec(color2)) {
    return {
      r: parseIntFromHex(match[1]),
      g: parseIntFromHex(match[2]),
      b: parseIntFromHex(match[3]),
      a: convertHexToDecimal(match[4]),
      format: named2 ? "name" : "hex8"
    };
  }
  if (match = matchers.hex6.exec(color2)) {
    return {
      r: parseIntFromHex(match[1]),
      g: parseIntFromHex(match[2]),
      b: parseIntFromHex(match[3]),
      format: named2 ? "name" : "hex"
    };
  }
  if (match = matchers.hex4.exec(color2)) {
    return {
      r: parseIntFromHex(match[1] + "" + match[1]),
      g: parseIntFromHex(match[2] + "" + match[2]),
      b: parseIntFromHex(match[3] + "" + match[3]),
      a: convertHexToDecimal(match[4] + "" + match[4]),
      format: named2 ? "name" : "hex8"
    };
  }
  if (match = matchers.hex3.exec(color2)) {
    return {
      r: parseIntFromHex(match[1] + "" + match[1]),
      g: parseIntFromHex(match[2] + "" + match[2]),
      b: parseIntFromHex(match[3] + "" + match[3]),
      format: named2 ? "name" : "hex"
    };
  }
  return false;
}
function validateWCAG2Parms(parms) {
  var level, size;
  parms = parms || {
    level: "AA",
    size: "small"
  };
  level = (parms.level || "AA").toUpperCase();
  size = (parms.size || "small").toLowerCase();
  if (level !== "AA" && level !== "AAA") {
    level = "AA";
  }
  if (size !== "small" && size !== "large") {
    size = "small";
  }
  return {
    level,
    size
  };
}
var trimLeft, trimRight, names, hexNames, matchers;
var init_tinycolor = __esm({
  "node_modules/tinycolor2/esm/tinycolor.js"() {
    trimLeft = /^\s+/;
    trimRight = /\s+$/;
    tinycolor.prototype = {
      isDark: function isDark() {
        return this.getBrightness() < 128;
      },
      isLight: function isLight() {
        return !this.isDark();
      },
      isValid: function isValid() {
        return this._ok;
      },
      getOriginalInput: function getOriginalInput() {
        return this._originalInput;
      },
      getFormat: function getFormat() {
        return this._format;
      },
      getAlpha: function getAlpha() {
        return this._a;
      },
      getBrightness: function getBrightness() {
        var rgb2 = this.toRgb();
        return (rgb2.r * 299 + rgb2.g * 587 + rgb2.b * 114) / 1e3;
      },
      getLuminance: function getLuminance() {
        var rgb2 = this.toRgb();
        var RsRGB, GsRGB, BsRGB, R, G2, B2;
        RsRGB = rgb2.r / 255;
        GsRGB = rgb2.g / 255;
        BsRGB = rgb2.b / 255;
        if (RsRGB <= 0.03928)
          R = RsRGB / 12.92;
        else
          R = Math.pow((RsRGB + 0.055) / 1.055, 2.4);
        if (GsRGB <= 0.03928)
          G2 = GsRGB / 12.92;
        else
          G2 = Math.pow((GsRGB + 0.055) / 1.055, 2.4);
        if (BsRGB <= 0.03928)
          B2 = BsRGB / 12.92;
        else
          B2 = Math.pow((BsRGB + 0.055) / 1.055, 2.4);
        return 0.2126 * R + 0.7152 * G2 + 0.0722 * B2;
      },
      setAlpha: function setAlpha(value) {
        this._a = boundAlpha(value);
        this._roundA = Math.round(100 * this._a) / 100;
        return this;
      },
      toHsv: function toHsv() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        return {
          h: hsv.h * 360,
          s: hsv.s,
          v: hsv.v,
          a: this._a
        };
      },
      toHsvString: function toHsvString() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        var h2 = Math.round(hsv.h * 360), s2 = Math.round(hsv.s * 100), v2 = Math.round(hsv.v * 100);
        return this._a == 1 ? "hsv(" + h2 + ", " + s2 + "%, " + v2 + "%)" : "hsva(" + h2 + ", " + s2 + "%, " + v2 + "%, " + this._roundA + ")";
      },
      toHsl: function toHsl() {
        var hsl2 = rgbToHsl(this._r, this._g, this._b);
        return {
          h: hsl2.h * 360,
          s: hsl2.s,
          l: hsl2.l,
          a: this._a
        };
      },
      toHslString: function toHslString() {
        var hsl2 = rgbToHsl(this._r, this._g, this._b);
        var h2 = Math.round(hsl2.h * 360), s2 = Math.round(hsl2.s * 100), l2 = Math.round(hsl2.l * 100);
        return this._a == 1 ? "hsl(" + h2 + ", " + s2 + "%, " + l2 + "%)" : "hsla(" + h2 + ", " + s2 + "%, " + l2 + "%, " + this._roundA + ")";
      },
      toHex: function toHex(allow3Char) {
        return rgbToHex(this._r, this._g, this._b, allow3Char);
      },
      toHexString: function toHexString(allow3Char) {
        return "#" + this.toHex(allow3Char);
      },
      toHex8: function toHex8(allow4Char) {
        return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
      },
      toHex8String: function toHex8String(allow4Char) {
        return "#" + this.toHex8(allow4Char);
      },
      toRgb: function toRgb() {
        return {
          r: Math.round(this._r),
          g: Math.round(this._g),
          b: Math.round(this._b),
          a: this._a
        };
      },
      toRgbString: function toRgbString() {
        return this._a == 1 ? "rgb(" + Math.round(this._r) + ", " + Math.round(this._g) + ", " + Math.round(this._b) + ")" : "rgba(" + Math.round(this._r) + ", " + Math.round(this._g) + ", " + Math.round(this._b) + ", " + this._roundA + ")";
      },
      toPercentageRgb: function toPercentageRgb() {
        return {
          r: Math.round(bound01(this._r, 255) * 100) + "%",
          g: Math.round(bound01(this._g, 255) * 100) + "%",
          b: Math.round(bound01(this._b, 255) * 100) + "%",
          a: this._a
        };
      },
      toPercentageRgbString: function toPercentageRgbString() {
        return this._a == 1 ? "rgb(" + Math.round(bound01(this._r, 255) * 100) + "%, " + Math.round(bound01(this._g, 255) * 100) + "%, " + Math.round(bound01(this._b, 255) * 100) + "%)" : "rgba(" + Math.round(bound01(this._r, 255) * 100) + "%, " + Math.round(bound01(this._g, 255) * 100) + "%, " + Math.round(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
      },
      toName: function toName() {
        if (this._a === 0) {
          return "transparent";
        }
        if (this._a < 1) {
          return false;
        }
        return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
      },
      toFilter: function toFilter(secondColor) {
        var hex8String = "#" + rgbaToArgbHex(this._r, this._g, this._b, this._a);
        var secondHex8String = hex8String;
        var gradientType = this._gradientType ? "GradientType = 1, " : "";
        if (secondColor) {
          var s2 = tinycolor(secondColor);
          secondHex8String = "#" + rgbaToArgbHex(s2._r, s2._g, s2._b, s2._a);
        }
        return "progid:DXImageTransform.Microsoft.gradient(" + gradientType + "startColorstr=" + hex8String + ",endColorstr=" + secondHex8String + ")";
      },
      toString: function toString(format) {
        var formatSet = !!format;
        format = format || this._format;
        var formattedString = false;
        var hasAlpha = this._a < 1 && this._a >= 0;
        var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name");
        if (needsAlphaFormat) {
          if (format === "name" && this._a === 0) {
            return this.toName();
          }
          return this.toRgbString();
        }
        if (format === "rgb") {
          formattedString = this.toRgbString();
        }
        if (format === "prgb") {
          formattedString = this.toPercentageRgbString();
        }
        if (format === "hex" || format === "hex6") {
          formattedString = this.toHexString();
        }
        if (format === "hex3") {
          formattedString = this.toHexString(true);
        }
        if (format === "hex4") {
          formattedString = this.toHex8String(true);
        }
        if (format === "hex8") {
          formattedString = this.toHex8String();
        }
        if (format === "name") {
          formattedString = this.toName();
        }
        if (format === "hsl") {
          formattedString = this.toHslString();
        }
        if (format === "hsv") {
          formattedString = this.toHsvString();
        }
        return formattedString || this.toHexString();
      },
      clone: function clone() {
        return tinycolor(this.toString());
      },
      _applyModification: function _applyModification(fn, args) {
        var color2 = fn.apply(null, [this].concat([].slice.call(args)));
        this._r = color2._r;
        this._g = color2._g;
        this._b = color2._b;
        this.setAlpha(color2._a);
        return this;
      },
      lighten: function lighten() {
        return this._applyModification(_lighten, arguments);
      },
      brighten: function brighten() {
        return this._applyModification(_brighten, arguments);
      },
      darken: function darken() {
        return this._applyModification(_darken, arguments);
      },
      desaturate: function desaturate() {
        return this._applyModification(_desaturate, arguments);
      },
      saturate: function saturate() {
        return this._applyModification(_saturate, arguments);
      },
      greyscale: function greyscale() {
        return this._applyModification(_greyscale, arguments);
      },
      spin: function spin() {
        return this._applyModification(_spin, arguments);
      },
      _applyCombination: function _applyCombination(fn, args) {
        return fn.apply(null, [this].concat([].slice.call(args)));
      },
      analogous: function analogous() {
        return this._applyCombination(_analogous, arguments);
      },
      complement: function complement() {
        return this._applyCombination(_complement, arguments);
      },
      monochromatic: function monochromatic() {
        return this._applyCombination(_monochromatic, arguments);
      },
      splitcomplement: function splitcomplement() {
        return this._applyCombination(_splitcomplement, arguments);
      },
      triad: function triad() {
        return this._applyCombination(polyad, [3]);
      },
      tetrad: function tetrad() {
        return this._applyCombination(polyad, [4]);
      }
    };
    tinycolor.fromRatio = function(color2, opts) {
      if (_typeof(color2) == "object") {
        var newColor = {};
        for (var i2 in color2) {
          if (color2.hasOwnProperty(i2)) {
            if (i2 === "a") {
              newColor[i2] = color2[i2];
            } else {
              newColor[i2] = convertToPercentage(color2[i2]);
            }
          }
        }
        color2 = newColor;
      }
      return tinycolor(color2, opts);
    };
    tinycolor.equals = function(color1, color2) {
      if (!color1 || !color2)
        return false;
      return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    };
    tinycolor.random = function() {
      return tinycolor.fromRatio({
        r: Math.random(),
        g: Math.random(),
        b: Math.random()
      });
    };
    tinycolor.mix = function(color1, color2, amount) {
      amount = amount === 0 ? 0 : amount || 50;
      var rgb1 = tinycolor(color1).toRgb();
      var rgb2 = tinycolor(color2).toRgb();
      var p2 = amount / 100;
      var rgba2 = {
        r: (rgb2.r - rgb1.r) * p2 + rgb1.r,
        g: (rgb2.g - rgb1.g) * p2 + rgb1.g,
        b: (rgb2.b - rgb1.b) * p2 + rgb1.b,
        a: (rgb2.a - rgb1.a) * p2 + rgb1.a
      };
      return tinycolor(rgba2);
    };
    tinycolor.readability = function(color1, color2) {
      var c1 = tinycolor(color1);
      var c22 = tinycolor(color2);
      return (Math.max(c1.getLuminance(), c22.getLuminance()) + 0.05) / (Math.min(c1.getLuminance(), c22.getLuminance()) + 0.05);
    };
    tinycolor.isReadable = function(color1, color2, wcag2) {
      var readability = tinycolor.readability(color1, color2);
      var wcag2Parms, out;
      out = false;
      wcag2Parms = validateWCAG2Parms(wcag2);
      switch (wcag2Parms.level + wcag2Parms.size) {
        case "AAsmall":
        case "AAAlarge":
          out = readability >= 4.5;
          break;
        case "AAlarge":
          out = readability >= 3;
          break;
        case "AAAsmall":
          out = readability >= 7;
          break;
      }
      return out;
    };
    tinycolor.mostReadable = function(baseColor, colorList, args) {
      var bestColor = null;
      var bestScore = 0;
      var readability;
      var includeFallbackColors, level, size;
      args = args || {};
      includeFallbackColors = args.includeFallbackColors;
      level = args.level;
      size = args.size;
      for (var i2 = 0; i2 < colorList.length; i2++) {
        readability = tinycolor.readability(baseColor, colorList[i2]);
        if (readability > bestScore) {
          bestScore = readability;
          bestColor = tinycolor(colorList[i2]);
        }
      }
      if (tinycolor.isReadable(baseColor, bestColor, {
        level,
        size
      }) || !includeFallbackColors) {
        return bestColor;
      } else {
        args.includeFallbackColors = false;
        return tinycolor.mostReadable(baseColor, ["#fff", "#000"], args);
      }
    };
    names = tinycolor.names = {
      aliceblue: "f0f8ff",
      antiquewhite: "faebd7",
      aqua: "0ff",
      aquamarine: "7fffd4",
      azure: "f0ffff",
      beige: "f5f5dc",
      bisque: "ffe4c4",
      black: "000",
      blanchedalmond: "ffebcd",
      blue: "00f",
      blueviolet: "8a2be2",
      brown: "a52a2a",
      burlywood: "deb887",
      burntsienna: "ea7e5d",
      cadetblue: "5f9ea0",
      chartreuse: "7fff00",
      chocolate: "d2691e",
      coral: "ff7f50",
      cornflowerblue: "6495ed",
      cornsilk: "fff8dc",
      crimson: "dc143c",
      cyan: "0ff",
      darkblue: "00008b",
      darkcyan: "008b8b",
      darkgoldenrod: "b8860b",
      darkgray: "a9a9a9",
      darkgreen: "006400",
      darkgrey: "a9a9a9",
      darkkhaki: "bdb76b",
      darkmagenta: "8b008b",
      darkolivegreen: "556b2f",
      darkorange: "ff8c00",
      darkorchid: "9932cc",
      darkred: "8b0000",
      darksalmon: "e9967a",
      darkseagreen: "8fbc8f",
      darkslateblue: "483d8b",
      darkslategray: "2f4f4f",
      darkslategrey: "2f4f4f",
      darkturquoise: "00ced1",
      darkviolet: "9400d3",
      deeppink: "ff1493",
      deepskyblue: "00bfff",
      dimgray: "696969",
      dimgrey: "696969",
      dodgerblue: "1e90ff",
      firebrick: "b22222",
      floralwhite: "fffaf0",
      forestgreen: "228b22",
      fuchsia: "f0f",
      gainsboro: "dcdcdc",
      ghostwhite: "f8f8ff",
      gold: "ffd700",
      goldenrod: "daa520",
      gray: "808080",
      green: "008000",
      greenyellow: "adff2f",
      grey: "808080",
      honeydew: "f0fff0",
      hotpink: "ff69b4",
      indianred: "cd5c5c",
      indigo: "4b0082",
      ivory: "fffff0",
      khaki: "f0e68c",
      lavender: "e6e6fa",
      lavenderblush: "fff0f5",
      lawngreen: "7cfc00",
      lemonchiffon: "fffacd",
      lightblue: "add8e6",
      lightcoral: "f08080",
      lightcyan: "e0ffff",
      lightgoldenrodyellow: "fafad2",
      lightgray: "d3d3d3",
      lightgreen: "90ee90",
      lightgrey: "d3d3d3",
      lightpink: "ffb6c1",
      lightsalmon: "ffa07a",
      lightseagreen: "20b2aa",
      lightskyblue: "87cefa",
      lightslategray: "789",
      lightslategrey: "789",
      lightsteelblue: "b0c4de",
      lightyellow: "ffffe0",
      lime: "0f0",
      limegreen: "32cd32",
      linen: "faf0e6",
      magenta: "f0f",
      maroon: "800000",
      mediumaquamarine: "66cdaa",
      mediumblue: "0000cd",
      mediumorchid: "ba55d3",
      mediumpurple: "9370db",
      mediumseagreen: "3cb371",
      mediumslateblue: "7b68ee",
      mediumspringgreen: "00fa9a",
      mediumturquoise: "48d1cc",
      mediumvioletred: "c71585",
      midnightblue: "191970",
      mintcream: "f5fffa",
      mistyrose: "ffe4e1",
      moccasin: "ffe4b5",
      navajowhite: "ffdead",
      navy: "000080",
      oldlace: "fdf5e6",
      olive: "808000",
      olivedrab: "6b8e23",
      orange: "ffa500",
      orangered: "ff4500",
      orchid: "da70d6",
      palegoldenrod: "eee8aa",
      palegreen: "98fb98",
      paleturquoise: "afeeee",
      palevioletred: "db7093",
      papayawhip: "ffefd5",
      peachpuff: "ffdab9",
      peru: "cd853f",
      pink: "ffc0cb",
      plum: "dda0dd",
      powderblue: "b0e0e6",
      purple: "800080",
      rebeccapurple: "663399",
      red: "f00",
      rosybrown: "bc8f8f",
      royalblue: "4169e1",
      saddlebrown: "8b4513",
      salmon: "fa8072",
      sandybrown: "f4a460",
      seagreen: "2e8b57",
      seashell: "fff5ee",
      sienna: "a0522d",
      silver: "c0c0c0",
      skyblue: "87ceeb",
      slateblue: "6a5acd",
      slategray: "708090",
      slategrey: "708090",
      snow: "fffafa",
      springgreen: "00ff7f",
      steelblue: "4682b4",
      tan: "d2b48c",
      teal: "008080",
      thistle: "d8bfd8",
      tomato: "ff6347",
      turquoise: "40e0d0",
      violet: "ee82ee",
      wheat: "f5deb3",
      white: "fff",
      whitesmoke: "f5f5f5",
      yellow: "ff0",
      yellowgreen: "9acd32"
    };
    hexNames = tinycolor.hexNames = flip(names);
    matchers = function() {
      var CSS_INTEGER = "[-\\+]?\\d+%?";
      var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";
      var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";
      var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
      var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
      return {
        CSS_UNIT: new RegExp(CSS_UNIT),
        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
        hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
        hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
      };
    }();
  }
});

// node_modules/canvas-color-tracker/dist/canvas-color-tracker.mjs
function _arrayLikeToArray2(r2, a3) {
  (null == a3 || a3 > r2.length) && (a3 = r2.length);
  for (var e2 = 0, n2 = Array(a3); e2 < a3; e2++)
    n2[e2] = r2[e2];
  return n2;
}
function _arrayWithoutHoles(r2) {
  if (Array.isArray(r2))
    return _arrayLikeToArray2(r2);
}
function _assertClassBrand(e2, t3, n2) {
  if ("function" == typeof e2 ? e2 === t3 : e2.has(t3))
    return arguments.length < 3 ? t3 : n2;
  throw new TypeError("Private element is not present on this object");
}
function _checkPrivateRedeclaration(e2, t3) {
  if (t3.has(e2))
    throw new TypeError("Cannot initialize the same private elements twice on an object");
}
function _classCallCheck2(a3, n2) {
  if (!(a3 instanceof n2))
    throw new TypeError("Cannot call a class as a function");
}
function _classPrivateFieldGet2(s2, a3) {
  return s2.get(_assertClassBrand(s2, a3));
}
function _classPrivateFieldInitSpec(e2, t3, a3) {
  _checkPrivateRedeclaration(e2, t3), t3.set(e2, a3);
}
function _classPrivateFieldSet2(s2, a3, r2) {
  return s2.set(_assertClassBrand(s2, a3), r2), r2;
}
function _defineProperties(e2, r2) {
  for (var t3 = 0; t3 < r2.length; t3++) {
    var o2 = r2[t3];
    o2.enumerable = o2.enumerable || false, o2.configurable = true, "value" in o2 && (o2.writable = true), Object.defineProperty(e2, _toPropertyKey(o2.key), o2);
  }
}
function _createClass2(e2, r2, t3) {
  return r2 && _defineProperties(e2.prototype, r2), Object.defineProperty(e2, "prototype", {
    writable: false
  }), e2;
}
function _iterableToArray(r2) {
  if ("undefined" != typeof Symbol && null != r2[Symbol.iterator] || null != r2["@@iterator"])
    return Array.from(r2);
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _toConsumableArray(r2) {
  return _arrayWithoutHoles(r2) || _iterableToArray(r2) || _unsupportedIterableToArray2(r2) || _nonIterableSpread();
}
function _toPrimitive(t3, r2) {
  if ("object" != typeof t3 || !t3)
    return t3;
  var e2 = t3[Symbol.toPrimitive];
  if (void 0 !== e2) {
    var i2 = e2.call(t3, r2);
    if ("object" != typeof i2)
      return i2;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return String(t3);
}
function _toPropertyKey(t3) {
  var i2 = _toPrimitive(t3, "string");
  return "symbol" == typeof i2 ? i2 : i2 + "";
}
function _unsupportedIterableToArray2(r2, a3) {
  if (r2) {
    if ("string" == typeof r2)
      return _arrayLikeToArray2(r2, a3);
    var t3 = {}.toString.call(r2).slice(8, -1);
    return "Object" === t3 && r2.constructor && (t3 = r2.constructor.name), "Map" === t3 || "Set" === t3 ? Array.from(r2) : "Arguments" === t3 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t3) ? _arrayLikeToArray2(r2, a3) : void 0;
  }
}
var ENTROPY, int2HexColor, rgb2Int, colorStr2Int, checksum, _registry, _csBits, _default;
var init_canvas_color_tracker = __esm({
  "node_modules/canvas-color-tracker/dist/canvas-color-tracker.mjs"() {
    init_tinycolor();
    ENTROPY = 123;
    int2HexColor = function int2HexColor2(num) {
      return "#".concat(Math.min(num, Math.pow(2, 24)).toString(16).padStart(6, "0"));
    };
    rgb2Int = function rgb2Int2(r2, g2, b) {
      return (r2 << 16) + (g2 << 8) + b;
    };
    colorStr2Int = function colorStr2Int2(str) {
      var _tinyColor$toRgb = tinycolor(str).toRgb(), r2 = _tinyColor$toRgb.r, g2 = _tinyColor$toRgb.g, b = _tinyColor$toRgb.b;
      return rgb2Int(r2, g2, b);
    };
    checksum = function checksum2(n2, csBits) {
      return n2 * ENTROPY % Math.pow(2, csBits);
    };
    _registry = /* @__PURE__ */ new WeakMap();
    _csBits = /* @__PURE__ */ new WeakMap();
    _default = /* @__PURE__ */ function() {
      function _default11() {
        var csBits = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 6;
        _classCallCheck2(this, _default11);
        _classPrivateFieldInitSpec(this, _registry, void 0);
        _classPrivateFieldInitSpec(this, _csBits, void 0);
        _classPrivateFieldSet2(_csBits, this, csBits);
        this.reset();
      }
      return _createClass2(_default11, [{
        key: "reset",
        value: function reset() {
          _classPrivateFieldSet2(_registry, this, ["__reserved for background__"]);
        }
      }, {
        key: "register",
        value: function register(obj) {
          if (_classPrivateFieldGet2(_registry, this).length >= Math.pow(2, 24 - _classPrivateFieldGet2(_csBits, this))) {
            return null;
          }
          var idx = _classPrivateFieldGet2(_registry, this).length;
          var cs = checksum(idx, _classPrivateFieldGet2(_csBits, this));
          var color2 = int2HexColor(idx + (cs << 24 - _classPrivateFieldGet2(_csBits, this)));
          _classPrivateFieldGet2(_registry, this).push(obj);
          return color2;
        }
      }, {
        key: "lookup",
        value: function lookup(color2) {
          if (!color2)
            return null;
          var n2 = typeof color2 === "string" ? colorStr2Int(color2) : rgb2Int.apply(void 0, _toConsumableArray(color2));
          if (!n2)
            return null;
          var idx = n2 & Math.pow(2, 24 - _classPrivateFieldGet2(_csBits, this)) - 1;
          var cs = n2 >> 24 - _classPrivateFieldGet2(_csBits, this) & Math.pow(2, _classPrivateFieldGet2(_csBits, this)) - 1;
          if (checksum(idx, _classPrivateFieldGet2(_csBits, this)) !== cs || idx >= _classPrivateFieldGet2(_registry, this).length)
            return null;
          return _classPrivateFieldGet2(_registry, this)[idx];
        }
      }]);
    }();
  }
});

// node_modules/preact/dist/preact.module.js
function d(n2, l2) {
  for (var u2 in l2)
    n2[u2] = l2[u2];
  return n2;
}
function g(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function _(l2, u2, t3) {
  var i2, r2, o2, e2 = {};
  for (o2 in u2)
    "key" == o2 ? i2 = u2[o2] : "ref" == o2 ? r2 = u2[o2] : e2[o2] = u2[o2];
  if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l2 && null != l2.defaultProps)
    for (o2 in l2.defaultProps)
      void 0 === e2[o2] && (e2[o2] = l2.defaultProps[o2]);
  return m(l2, e2, i2, r2, null);
}
function m(n2, t3, i2, r2, o2) {
  var e2 = { type: n2, props: t3, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o2 ? ++u : o2, __i: -1, __u: 0 };
  return null == o2 && null != l.vnode && l.vnode(e2), e2;
}
function k(n2) {
  return n2.children;
}
function x(n2, l2) {
  this.props = n2, this.context = l2;
}
function S(n2, l2) {
  if (null == l2)
    return n2.__ ? S(n2.__, n2.__i + 1) : null;
  for (var u2; l2 < n2.__k.length; l2++)
    if (null != (u2 = n2.__k[l2]) && null != u2.__e)
      return u2.__e;
  return "function" == typeof n2.type ? S(n2) : null;
}
function C(n2) {
  var l2, u2;
  if (null != (n2 = n2.__) && null != n2.__c) {
    for (n2.__e = n2.__c.base = null, l2 = 0; l2 < n2.__k.length; l2++)
      if (null != (u2 = n2.__k[l2]) && null != u2.__e) {
        n2.__e = n2.__c.base = u2.__e;
        break;
      }
    return C(n2);
  }
}
function M(n2) {
  (!n2.__d && (n2.__d = true) && i.push(n2) && !$.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)($);
}
function $() {
  for (var n2, u2, t3, r2, o2, f2, c3, s2 = 1; i.length; )
    i.length > s2 && i.sort(e), n2 = i.shift(), s2 = i.length, n2.__d && (t3 = void 0, r2 = void 0, o2 = (r2 = (u2 = n2).__v).__e, f2 = [], c3 = [], u2.__P && ((t3 = d({}, r2)).__v = r2.__v + 1, l.vnode && l.vnode(t3), O(u2.__P, t3, r2, u2.__n, u2.__P.namespaceURI, 32 & r2.__u ? [o2] : null, f2, null == o2 ? S(r2) : o2, !!(32 & r2.__u), c3), t3.__v = r2.__v, t3.__.__k[t3.__i] = t3, N(f2, t3, c3), r2.__e = r2.__ = null, t3.__e != o2 && C(t3)));
  $.__r = 0;
}
function I(n2, l2, u2, t3, i2, r2, o2, e2, f2, c3, s2) {
  var a3, h2, y3, w2, d2, g2, _2, m3 = t3 && t3.__k || v, b = l2.length;
  for (f2 = P(u2, l2, m3, f2, b), a3 = 0; a3 < b; a3++)
    null != (y3 = u2.__k[a3]) && (h2 = -1 == y3.__i ? p : m3[y3.__i] || p, y3.__i = a3, g2 = O(n2, y3, h2, i2, r2, o2, e2, f2, c3, s2), w2 = y3.__e, y3.ref && h2.ref != y3.ref && (h2.ref && B(h2.ref, null, y3), s2.push(y3.ref, y3.__c || w2, y3)), null == d2 && null != w2 && (d2 = w2), (_2 = !!(4 & y3.__u)) || h2.__k === y3.__k ? f2 = A(y3, f2, n2, _2) : "function" == typeof y3.type && void 0 !== g2 ? f2 = g2 : w2 && (f2 = w2.nextSibling), y3.__u &= -7);
  return u2.__e = d2, f2;
}
function P(n2, l2, u2, t3, i2) {
  var r2, o2, e2, f2, c3, s2 = u2.length, a3 = s2, h2 = 0;
  for (n2.__k = new Array(i2), r2 = 0; r2 < i2; r2++)
    null != (o2 = l2[r2]) && "boolean" != typeof o2 && "function" != typeof o2 ? ("string" == typeof o2 || "number" == typeof o2 || "bigint" == typeof o2 || o2.constructor == String ? o2 = n2.__k[r2] = m(null, o2, null, null, null) : w(o2) ? o2 = n2.__k[r2] = m(k, { children: o2 }, null, null, null) : null == o2.constructor && o2.__b > 0 ? o2 = n2.__k[r2] = m(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : n2.__k[r2] = o2, f2 = r2 + h2, o2.__ = n2, o2.__b = n2.__b + 1, e2 = null, -1 != (c3 = o2.__i = L(o2, u2, f2, a3)) && (a3--, (e2 = u2[c3]) && (e2.__u |= 2)), null == e2 || null == e2.__v ? (-1 == c3 && (i2 > s2 ? h2-- : i2 < s2 && h2++), "function" != typeof o2.type && (o2.__u |= 4)) : c3 != f2 && (c3 == f2 - 1 ? h2-- : c3 == f2 + 1 ? h2++ : (c3 > f2 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r2] = null;
  if (a3)
    for (r2 = 0; r2 < s2; r2++)
      null != (e2 = u2[r2]) && 0 == (2 & e2.__u) && (e2.__e == t3 && (t3 = S(e2)), D(e2, e2));
  return t3;
}
function A(n2, l2, u2, t3) {
  var i2, r2;
  if ("function" == typeof n2.type) {
    for (i2 = n2.__k, r2 = 0; i2 && r2 < i2.length; r2++)
      i2[r2] && (i2[r2].__ = n2, l2 = A(i2[r2], l2, u2, t3));
    return l2;
  }
  n2.__e != l2 && (t3 && (l2 && n2.type && !l2.parentNode && (l2 = S(n2)), u2.insertBefore(n2.__e, l2 || null)), l2 = n2.__e);
  do {
    l2 = l2 && l2.nextSibling;
  } while (null != l2 && 8 == l2.nodeType);
  return l2;
}
function L(n2, l2, u2, t3) {
  var i2, r2, o2, e2 = n2.key, f2 = n2.type, c3 = l2[u2], s2 = null != c3 && 0 == (2 & c3.__u);
  if (null === c3 && null == e2 || s2 && e2 == c3.key && f2 == c3.type)
    return u2;
  if (t3 > (s2 ? 1 : 0)) {
    for (i2 = u2 - 1, r2 = u2 + 1; i2 >= 0 || r2 < l2.length; )
      if (null != (c3 = l2[o2 = i2 >= 0 ? i2-- : r2++]) && 0 == (2 & c3.__u) && e2 == c3.key && f2 == c3.type)
        return o2;
  }
  return -1;
}
function T(n2, l2, u2) {
  "-" == l2[0] ? n2.setProperty(l2, null == u2 ? "" : u2) : n2[l2] = null == u2 ? "" : "number" != typeof u2 || y.test(l2) ? u2 : u2 + "px";
}
function j(n2, l2, u2, t3, i2) {
  var r2, o2;
  n:
    if ("style" == l2)
      if ("string" == typeof u2)
        n2.style.cssText = u2;
      else {
        if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3)
          for (l2 in t3)
            u2 && l2 in u2 || T(n2.style, l2, "");
        if (u2)
          for (l2 in u2)
            t3 && u2[l2] == t3[l2] || T(n2.style, l2, u2[l2]);
      }
    else if ("o" == l2[0] && "n" == l2[1])
      r2 = l2 != (l2 = l2.replace(f, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 || "onFocusOut" == l2 || "onFocusIn" == l2 ? o2.slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = u2, u2 ? t3 ? u2.u = t3.u : (u2.u = c, n2.addEventListener(l2, r2 ? a : s, r2)) : n2.removeEventListener(l2, r2 ? a : s, r2);
    else {
      if ("http://www.w3.org/2000/svg" == i2)
        l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l2 && "height" != l2 && "href" != l2 && "list" != l2 && "form" != l2 && "tabIndex" != l2 && "download" != l2 && "rowSpan" != l2 && "colSpan" != l2 && "role" != l2 && "popover" != l2 && l2 in n2)
        try {
          n2[l2] = null == u2 ? "" : u2;
          break n;
        } catch (n3) {
        }
      "function" == typeof u2 || (null == u2 || false === u2 && "-" != l2[4] ? n2.removeAttribute(l2) : n2.setAttribute(l2, "popover" == l2 && 1 == u2 ? "" : u2));
    }
}
function F(n2) {
  return function(u2) {
    if (this.l) {
      var t3 = this.l[u2.type + n2];
      if (null == u2.t)
        u2.t = c++;
      else if (u2.t < t3.u)
        return;
      return t3(l.event ? l.event(u2) : u2);
    }
  };
}
function O(n2, u2, t3, i2, r2, o2, e2, f2, c3, s2) {
  var a3, h2, p2, v2, y3, _2, m3, b, S2, C2, M2, $2, P2, A2, H, L2, T2, j2 = u2.type;
  if (null != u2.constructor)
    return null;
  128 & t3.__u && (c3 = !!(32 & t3.__u), o2 = [f2 = u2.__e = t3.__e]), (a3 = l.__b) && a3(u2);
  n:
    if ("function" == typeof j2)
      try {
        if (b = u2.props, S2 = "prototype" in j2 && j2.prototype.render, C2 = (a3 = j2.contextType) && i2[a3.__c], M2 = a3 ? C2 ? C2.props.value : a3.__ : i2, t3.__c ? m3 = (h2 = u2.__c = t3.__c).__ = h2.__E : (S2 ? u2.__c = h2 = new j2(b, M2) : (u2.__c = h2 = new x(b, M2), h2.constructor = j2, h2.render = E), C2 && C2.sub(h2), h2.state || (h2.state = {}), h2.__n = i2, p2 = h2.__d = true, h2.__h = [], h2._sb = []), S2 && null == h2.__s && (h2.__s = h2.state), S2 && null != j2.getDerivedStateFromProps && (h2.__s == h2.state && (h2.__s = d({}, h2.__s)), d(h2.__s, j2.getDerivedStateFromProps(b, h2.__s))), v2 = h2.props, y3 = h2.state, h2.__v = u2, p2)
          S2 && null == j2.getDerivedStateFromProps && null != h2.componentWillMount && h2.componentWillMount(), S2 && null != h2.componentDidMount && h2.__h.push(h2.componentDidMount);
        else {
          if (S2 && null == j2.getDerivedStateFromProps && b !== v2 && null != h2.componentWillReceiveProps && h2.componentWillReceiveProps(b, M2), u2.__v == t3.__v || !h2.__e && null != h2.shouldComponentUpdate && false === h2.shouldComponentUpdate(b, h2.__s, M2)) {
            for (u2.__v != t3.__v && (h2.props = b, h2.state = h2.__s, h2.__d = false), u2.__e = t3.__e, u2.__k = t3.__k, u2.__k.some(function(n3) {
              n3 && (n3.__ = u2);
            }), $2 = 0; $2 < h2._sb.length; $2++)
              h2.__h.push(h2._sb[$2]);
            h2._sb = [], h2.__h.length && e2.push(h2);
            break n;
          }
          null != h2.componentWillUpdate && h2.componentWillUpdate(b, h2.__s, M2), S2 && null != h2.componentDidUpdate && h2.__h.push(function() {
            h2.componentDidUpdate(v2, y3, _2);
          });
        }
        if (h2.context = M2, h2.props = b, h2.__P = n2, h2.__e = false, P2 = l.__r, A2 = 0, S2) {
          for (h2.state = h2.__s, h2.__d = false, P2 && P2(u2), a3 = h2.render(h2.props, h2.state, h2.context), H = 0; H < h2._sb.length; H++)
            h2.__h.push(h2._sb[H]);
          h2._sb = [];
        } else
          do {
            h2.__d = false, P2 && P2(u2), a3 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
          } while (h2.__d && ++A2 < 25);
        h2.state = h2.__s, null != h2.getChildContext && (i2 = d(d({}, i2), h2.getChildContext())), S2 && !p2 && null != h2.getSnapshotBeforeUpdate && (_2 = h2.getSnapshotBeforeUpdate(v2, y3)), L2 = a3, null != a3 && a3.type === k && null == a3.key && (L2 = V(a3.props.children)), f2 = I(n2, w(L2) ? L2 : [L2], u2, t3, i2, r2, o2, e2, f2, c3, s2), h2.base = u2.__e, u2.__u &= -161, h2.__h.length && e2.push(h2), m3 && (h2.__E = h2.__ = null);
      } catch (n3) {
        if (u2.__v = null, c3 || null != o2)
          if (n3.then) {
            for (u2.__u |= c3 ? 160 : 128; f2 && 8 == f2.nodeType && f2.nextSibling; )
              f2 = f2.nextSibling;
            o2[o2.indexOf(f2)] = null, u2.__e = f2;
          } else {
            for (T2 = o2.length; T2--; )
              g(o2[T2]);
            z(u2);
          }
        else
          u2.__e = t3.__e, u2.__k = t3.__k, n3.then || z(u2);
        l.__e(n3, u2, t3);
      }
    else
      null == o2 && u2.__v == t3.__v ? (u2.__k = t3.__k, u2.__e = t3.__e) : f2 = u2.__e = q(t3.__e, u2, t3, i2, r2, o2, e2, c3, s2);
  return (a3 = l.diffed) && a3(u2), 128 & u2.__u ? void 0 : f2;
}
function z(n2) {
  n2 && n2.__c && (n2.__c.__e = true), n2 && n2.__k && n2.__k.forEach(z);
}
function N(n2, u2, t3) {
  for (var i2 = 0; i2 < t3.length; i2++)
    B(t3[i2], t3[++i2], t3[++i2]);
  l.__c && l.__c(u2, n2), n2.some(function(u3) {
    try {
      n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
        n3.call(u3);
      });
    } catch (n3) {
      l.__e(n3, u3.__v);
    }
  });
}
function V(n2) {
  return "object" != typeof n2 || null == n2 || n2.__b && n2.__b > 0 ? n2 : w(n2) ? n2.map(V) : d({}, n2);
}
function q(u2, t3, i2, r2, o2, e2, f2, c3, s2) {
  var a3, h2, v2, y3, d2, _2, m3, b = i2.props || p, k2 = t3.props, x3 = t3.type;
  if ("svg" == x3 ? o2 = "http://www.w3.org/2000/svg" : "math" == x3 ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), null != e2) {
    for (a3 = 0; a3 < e2.length; a3++)
      if ((d2 = e2[a3]) && "setAttribute" in d2 == !!x3 && (x3 ? d2.localName == x3 : 3 == d2.nodeType)) {
        u2 = d2, e2[a3] = null;
        break;
      }
  }
  if (null == u2) {
    if (null == x3)
      return document.createTextNode(k2);
    u2 = document.createElementNS(o2, x3, k2.is && k2), c3 && (l.__m && l.__m(t3, e2), c3 = false), e2 = null;
  }
  if (null == x3)
    b === k2 || c3 && u2.data == k2 || (u2.data = k2);
  else {
    if (e2 = e2 && n.call(u2.childNodes), !c3 && null != e2)
      for (b = {}, a3 = 0; a3 < u2.attributes.length; a3++)
        b[(d2 = u2.attributes[a3]).name] = d2.value;
    for (a3 in b)
      if (d2 = b[a3], "children" == a3)
        ;
      else if ("dangerouslySetInnerHTML" == a3)
        v2 = d2;
      else if (!(a3 in k2)) {
        if ("value" == a3 && "defaultValue" in k2 || "checked" == a3 && "defaultChecked" in k2)
          continue;
        j(u2, a3, null, d2, o2);
      }
    for (a3 in k2)
      d2 = k2[a3], "children" == a3 ? y3 = d2 : "dangerouslySetInnerHTML" == a3 ? h2 = d2 : "value" == a3 ? _2 = d2 : "checked" == a3 ? m3 = d2 : c3 && "function" != typeof d2 || b[a3] === d2 || j(u2, a3, d2, b[a3], o2);
    if (h2)
      c3 || v2 && (h2.__html == v2.__html || h2.__html == u2.innerHTML) || (u2.innerHTML = h2.__html), t3.__k = [];
    else if (v2 && (u2.innerHTML = ""), I("template" == t3.type ? u2.content : u2, w(y3) ? y3 : [y3], t3, i2, r2, "foreignObject" == x3 ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && S(i2, 0), c3, s2), null != e2)
      for (a3 = e2.length; a3--; )
        g(e2[a3]);
    c3 || (a3 = "value", "progress" == x3 && null == _2 ? u2.removeAttribute("value") : null != _2 && (_2 !== u2[a3] || "progress" == x3 && !_2 || "option" == x3 && _2 != b[a3]) && j(u2, a3, _2, b[a3], o2), a3 = "checked", null != m3 && m3 != u2[a3] && j(u2, a3, m3, b[a3], o2));
  }
  return u2;
}
function B(n2, u2, t3) {
  try {
    if ("function" == typeof n2) {
      var i2 = "function" == typeof n2.__u;
      i2 && n2.__u(), i2 && null == u2 || (n2.__u = n2(u2));
    } else
      n2.current = u2;
  } catch (n3) {
    l.__e(n3, t3);
  }
}
function D(n2, u2, t3) {
  var i2, r2;
  if (l.unmount && l.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || B(i2, null, u2)), null != (i2 = n2.__c)) {
    if (i2.componentWillUnmount)
      try {
        i2.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u2);
      }
    i2.base = i2.__P = null;
  }
  if (i2 = n2.__k)
    for (r2 = 0; r2 < i2.length; r2++)
      i2[r2] && D(i2[r2], u2, t3 || "function" != typeof n2.type);
  t3 || g(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
}
function E(n2, l2, u2) {
  return this.constructor(n2, u2);
}
function G(u2, t3, i2) {
  var r2, o2, e2, f2;
  t3 == document && (t3 = document.documentElement), l.__ && l.__(u2, t3), o2 = (r2 = "function" == typeof i2) ? null : i2 && i2.__k || t3.__k, e2 = [], f2 = [], O(t3, u2 = (!r2 && i2 || t3).__k = _(k, null, [u2]), o2 || p, p, t3.namespaceURI, !r2 && i2 ? [i2] : o2 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e2, !r2 && i2 ? i2 : o2 ? o2.__e : t3.firstChild, r2, f2), N(e2, u2, f2);
}
function K(l2, u2, t3) {
  var i2, r2, o2, e2, f2 = d({}, l2.props);
  for (o2 in l2.type && l2.type.defaultProps && (e2 = l2.type.defaultProps), u2)
    "key" == o2 ? i2 = u2[o2] : "ref" == o2 ? r2 = u2[o2] : f2[o2] = void 0 === u2[o2] && null != e2 ? e2[o2] : u2[o2];
  return arguments.length > 2 && (f2.children = arguments.length > 3 ? n.call(arguments, 2) : t3), m(l2.type, f2, i2 || l2.key, r2 || l2.ref, null);
}
var n, l, u, t2, i, r, o, e, f, c, s, a, h, p, v, y, w;
var init_preact_module = __esm({
  "node_modules/preact/dist/preact.module.js"() {
    p = {};
    v = [];
    y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
    w = Array.isArray;
    n = v.slice, l = { __e: function(n2, l2, u2, t3) {
      for (var i2, r2, o2; l2 = l2.__; )
        if ((i2 = l2.__c) && !i2.__)
          try {
            if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t3 || {}), o2 = i2.__d), o2)
              return i2.__E = i2;
          } catch (l3) {
            n2 = l3;
          }
      throw n2;
    } }, u = 0, t2 = function(n2) {
      return null != n2 && null == n2.constructor;
    }, x.prototype.setState = function(n2, l2) {
      var u2;
      u2 = null != this.__s && this.__s != this.state ? this.__s : this.__s = d({}, this.state), "function" == typeof n2 && (n2 = n2(d({}, u2), this.props)), n2 && d(u2, n2), null != n2 && this.__v && (l2 && this._sb.push(l2), M(this));
    }, x.prototype.forceUpdate = function(n2) {
      this.__v && (this.__e = true, n2 && this.__h.push(n2), M(this));
    }, x.prototype.render = k, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l2) {
      return n2.__v.__b - l2.__v.__b;
    }, $.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = F(false), a = F(true), h = 0;
  }
});

// node_modules/float-tooltip/dist/float-tooltip.mjs
function _arrayLikeToArray3(r2, a3) {
  (null == a3 || a3 > r2.length) && (a3 = r2.length);
  for (var e2 = 0, n2 = Array(a3); e2 < a3; e2++)
    n2[e2] = r2[e2];
  return n2;
}
function _arrayWithHoles2(r2) {
  if (Array.isArray(r2))
    return r2;
}
function _defineProperty(e2, r2, t3) {
  return (r2 = _toPropertyKey2(r2)) in e2 ? Object.defineProperty(e2, r2, {
    value: t3,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e2[r2] = t3, e2;
}
function _iterableToArrayLimit2(r2, l2) {
  var t3 = null == r2 ? null : "undefined" != typeof Symbol && r2[Symbol.iterator] || r2["@@iterator"];
  if (null != t3) {
    var e2, n2, i2, u2, a3 = [], f2 = true, o2 = false;
    try {
      if (i2 = (t3 = t3.call(r2)).next, 0 === l2)
        ;
      else
        for (; !(f2 = (e2 = i2.call(t3)).done) && (a3.push(e2.value), a3.length !== l2); f2 = true)
          ;
    } catch (r3) {
      o2 = true, n2 = r3;
    } finally {
      try {
        if (!f2 && null != t3.return && (u2 = t3.return(), Object(u2) !== u2))
          return;
      } finally {
        if (o2)
          throw n2;
      }
    }
    return a3;
  }
}
function _nonIterableRest2() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys(e2, r2) {
  var t3 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var o2 = Object.getOwnPropertySymbols(e2);
    r2 && (o2 = o2.filter(function(r3) {
      return Object.getOwnPropertyDescriptor(e2, r3).enumerable;
    })), t3.push.apply(t3, o2);
  }
  return t3;
}
function _objectSpread2(e2) {
  for (var r2 = 1; r2 < arguments.length; r2++) {
    var t3 = null != arguments[r2] ? arguments[r2] : {};
    r2 % 2 ? ownKeys(Object(t3), true).forEach(function(r3) {
      _defineProperty(e2, r3, t3[r3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(t3)) : ownKeys(Object(t3)).forEach(function(r3) {
      Object.defineProperty(e2, r3, Object.getOwnPropertyDescriptor(t3, r3));
    });
  }
  return e2;
}
function _slicedToArray2(r2, e2) {
  return _arrayWithHoles2(r2) || _iterableToArrayLimit2(r2, e2) || _unsupportedIterableToArray3(r2, e2) || _nonIterableRest2();
}
function _toPrimitive2(t3, r2) {
  if ("object" != typeof t3 || !t3)
    return t3;
  var e2 = t3[Symbol.toPrimitive];
  if (void 0 !== e2) {
    var i2 = e2.call(t3, r2);
    if ("object" != typeof i2)
      return i2;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r2 ? String : Number)(t3);
}
function _toPropertyKey2(t3) {
  var i2 = _toPrimitive2(t3, "string");
  return "symbol" == typeof i2 ? i2 : i2 + "";
}
function _typeof2(o2) {
  "@babel/helpers - typeof";
  return _typeof2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o3) {
    return typeof o3;
  } : function(o3) {
    return o3 && "function" == typeof Symbol && o3.constructor === Symbol && o3 !== Symbol.prototype ? "symbol" : typeof o3;
  }, _typeof2(o2);
}
function _unsupportedIterableToArray3(r2, a3) {
  if (r2) {
    if ("string" == typeof r2)
      return _arrayLikeToArray3(r2, a3);
    var t3 = {}.toString.call(r2).slice(8, -1);
    return "Object" === t3 && r2.constructor && (t3 = r2.constructor.name), "Map" === t3 || "Set" === t3 ? Array.from(r2) : "Arguments" === t3 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t3) ? _arrayLikeToArray3(r2, a3) : void 0;
  }
}
function styleInject(css, ref) {
  if (ref === void 0)
    ref = {};
  var insertAt = ref.insertAt;
  if (typeof document === "undefined") {
    return;
  }
  var head = document.head || document.getElementsByTagName("head")[0];
  var style = document.createElement("style");
  style.type = "text/css";
  if (insertAt === "top") {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}
var _reactElement2VNode, isReactRenderable, render, css_248z, index3;
var init_float_tooltip = __esm({
  "node_modules/float-tooltip/dist/float-tooltip.mjs"() {
    init_src();
    init_kapsule();
    init_preact_module();
    _reactElement2VNode = function reactElement2VNode(el) {
      if (!(_typeof2(el) === "object"))
        return el;
      var res = K(el);
      if (res.props) {
        var _res$props;
        res.props = _objectSpread2({}, res.props);
        if (res !== null && res !== void 0 && (_res$props = res.props) !== null && _res$props !== void 0 && _res$props.children) {
          res.props.children = Array.isArray(res.props.children) ? res.props.children.map(_reactElement2VNode) : _reactElement2VNode(res.props.children);
        }
      }
      return res;
    };
    isReactRenderable = function isReactRenderable2(o2) {
      return t2(K(o2));
    };
    render = function render2(jsx, domEl) {
      delete domEl.__k;
      G(_reactElement2VNode(jsx), domEl);
    };
    css_248z = ".float-tooltip-kap {\n  position: absolute;\n  width: max-content; /* prevent shrinking near right edge */\n  max-width: max(50%, 150px);\n  padding: 3px 5px;\n  border-radius: 3px;\n  font: 12px sans-serif;\n  color: #eee;\n  background: rgba(0,0,0,0.6);\n  pointer-events: none;\n}\n";
    styleInject(css_248z);
    index3 = index({
      props: {
        content: {
          "default": false
        },
        offsetX: {
          triggerUpdate: false
        },
        offsetY: {
          triggerUpdate: false
        }
      },
      init: function init2(domNode, state) {
        var _ref = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, _ref$style = _ref.style, style = _ref$style === void 0 ? {} : _ref$style;
        var isD3Selection = !!domNode && _typeof2(domNode) === "object" && !!domNode.node && typeof domNode.node === "function";
        var el = select_default2(isD3Selection ? domNode.node() : domNode);
        el.style("position") === "static" && el.style("position", "relative");
        state.tooltipEl = el.append("div").attr("class", "float-tooltip-kap");
        Object.entries(style).forEach(function(_ref2) {
          var _ref3 = _slicedToArray2(_ref2, 2), k2 = _ref3[0], v2 = _ref3[1];
          return state.tooltipEl.style(k2, v2);
        });
        state.tooltipEl.style("left", "-10000px").style("display", "none");
        var evSuffix = "tooltip-".concat(Math.round(Math.random() * 1e12));
        state.mouseInside = false;
        el.on("mousemove.".concat(evSuffix), function(ev) {
          state.mouseInside = true;
          var mousePos = pointer_default(ev);
          var domNode2 = el.node();
          var canvasWidth = domNode2.offsetWidth;
          var canvasHeight = domNode2.offsetHeight;
          var translate = [state.offsetX === null || state.offsetX === void 0 ? "-".concat(mousePos[0] / canvasWidth * 100, "%") : typeof state.offsetX === "number" ? "calc(-50% + ".concat(state.offsetX, "px)") : state.offsetX, state.offsetY === null || state.offsetY === void 0 ? canvasHeight > 130 && canvasHeight - mousePos[1] < 100 ? "calc(-100% - 6px)" : "21px" : typeof state.offsetY === "number" ? state.offsetY < 0 ? "calc(-100% - ".concat(Math.abs(state.offsetY), "px)") : "".concat(state.offsetY, "px") : state.offsetY];
          state.tooltipEl.style("left", mousePos[0] + "px").style("top", mousePos[1] + "px").style("transform", "translate(".concat(translate.join(","), ")"));
          state.content && state.tooltipEl.style("display", "inline");
        });
        el.on("mouseover.".concat(evSuffix), function() {
          state.mouseInside = true;
          state.content && state.tooltipEl.style("display", "inline");
        });
        el.on("mouseout.".concat(evSuffix), function() {
          state.mouseInside = false;
          state.tooltipEl.style("display", "none");
        });
      },
      update: function update2(state) {
        state.tooltipEl.style("display", !!state.content && state.mouseInside ? "inline" : "none");
        if (!state.content) {
          state.tooltipEl.text("");
        } else if (state.content instanceof HTMLElement) {
          state.tooltipEl.text("");
          state.tooltipEl.append(function() {
            return state.content;
          });
        } else if (typeof state.content === "string") {
          state.tooltipEl.html(state.content);
        } else if (isReactRenderable(state.content)) {
          state.tooltipEl.text("");
          render(state.content, state.tooltipEl.node());
        } else {
          state.tooltipEl.style("display", "none");
          console.warn("Tooltip content is invalid, skipping.", state.content, state.content.toString());
        }
      }
    });
  }
});

// node_modules/d3-force-3d/src/center.js
function center_default(x3, y3, z3) {
  var nodes, strength = 1;
  if (x3 == null)
    x3 = 0;
  if (y3 == null)
    y3 = 0;
  if (z3 == null)
    z3 = 0;
  function force() {
    var i2, n2 = nodes.length, node, sx = 0, sy = 0, sz = 0;
    for (i2 = 0; i2 < n2; ++i2) {
      node = nodes[i2], sx += node.x || 0, sy += node.y || 0, sz += node.z || 0;
    }
    for (sx = (sx / n2 - x3) * strength, sy = (sy / n2 - y3) * strength, sz = (sz / n2 - z3) * strength, i2 = 0; i2 < n2; ++i2) {
      node = nodes[i2];
      if (sx) {
        node.x -= sx;
      }
      if (sy) {
        node.y -= sy;
      }
      if (sz) {
        node.z -= sz;
      }
    }
  }
  force.initialize = function(_2) {
    nodes = _2;
  };
  force.x = function(_2) {
    return arguments.length ? (x3 = +_2, force) : x3;
  };
  force.y = function(_2) {
    return arguments.length ? (y3 = +_2, force) : y3;
  };
  force.z = function(_2) {
    return arguments.length ? (z3 = +_2, force) : z3;
  };
  force.strength = function(_2) {
    return arguments.length ? (strength = +_2, force) : strength;
  };
  return force;
}
var init_center = __esm({
  "node_modules/d3-force-3d/src/center.js"() {
  }
});

// node_modules/d3-binarytree/src/add.js
function add_default(d2) {
  const x3 = +this._x.call(null, d2);
  return add2(this.cover(x3), x3, d2);
}
function add2(tree, x3, d2) {
  if (isNaN(x3))
    return tree;
  var parent, node = tree._root, leaf = { data: d2 }, x0 = tree._x0, x1 = tree._x1, xm, xp, right, i2, j2;
  if (!node)
    return tree._root = leaf, tree;
  while (node.length) {
    if (right = x3 >= (xm = (x0 + x1) / 2))
      x0 = xm;
    else
      x1 = xm;
    if (parent = node, !(node = node[i2 = +right]))
      return parent[i2] = leaf, tree;
  }
  xp = +tree._x.call(null, node.data);
  if (x3 === xp)
    return leaf.next = node, parent ? parent[i2] = leaf : tree._root = leaf, tree;
  do {
    parent = parent ? parent[i2] = new Array(2) : tree._root = new Array(2);
    if (right = x3 >= (xm = (x0 + x1) / 2))
      x0 = xm;
    else
      x1 = xm;
  } while ((i2 = +right) === (j2 = +(xp >= xm)));
  return parent[j2] = node, parent[i2] = leaf, tree;
}
function addAll(data) {
  if (!Array.isArray(data))
    data = Array.from(data);
  const n2 = data.length;
  const xz = new Float64Array(n2);
  let x0 = Infinity, x1 = -Infinity;
  for (let i2 = 0, x3; i2 < n2; ++i2) {
    if (isNaN(x3 = +this._x.call(null, data[i2])))
      continue;
    xz[i2] = x3;
    if (x3 < x0)
      x0 = x3;
    if (x3 > x1)
      x1 = x3;
  }
  if (x0 > x1)
    return this;
  this.cover(x0).cover(x1);
  for (let i2 = 0; i2 < n2; ++i2) {
    add2(this, xz[i2], data[i2]);
  }
  return this;
}
var init_add = __esm({
  "node_modules/d3-binarytree/src/add.js"() {
  }
});

// node_modules/d3-binarytree/src/cover.js
function cover_default(x3) {
  if (isNaN(x3 = +x3))
    return this;
  var x0 = this._x0, x1 = this._x1;
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x3)) + 1;
  } else {
    var z3 = x1 - x0 || 1, node = this._root, parent, i2;
    while (x0 > x3 || x3 >= x1) {
      i2 = +(x3 < x0);
      parent = new Array(2), parent[i2] = node, node = parent, z3 *= 2;
      switch (i2) {
        case 0:
          x1 = x0 + z3;
          break;
        case 1:
          x0 = x1 - z3;
          break;
      }
    }
    if (this._root && this._root.length)
      this._root = node;
  }
  this._x0 = x0;
  this._x1 = x1;
  return this;
}
var init_cover = __esm({
  "node_modules/d3-binarytree/src/cover.js"() {
  }
});

// node_modules/d3-binarytree/src/data.js
function data_default2() {
  var data = [];
  this.visit(function(node) {
    if (!node.length)
      do
        data.push(node.data);
      while (node = node.next);
  });
  return data;
}
var init_data2 = __esm({
  "node_modules/d3-binarytree/src/data.js"() {
  }
});

// node_modules/d3-binarytree/src/extent.js
function extent_default(_2) {
  return arguments.length ? this.cover(+_2[0][0]).cover(+_2[1][0]) : isNaN(this._x0) ? void 0 : [[this._x0], [this._x1]];
}
var init_extent = __esm({
  "node_modules/d3-binarytree/src/extent.js"() {
  }
});

// node_modules/d3-binarytree/src/half.js
function half_default(node, x0, x1) {
  this.node = node;
  this.x0 = x0;
  this.x1 = x1;
}
var init_half = __esm({
  "node_modules/d3-binarytree/src/half.js"() {
  }
});

// node_modules/d3-binarytree/src/find.js
function find_default(x3, radius) {
  var data, x0 = this._x0, x1, x22, x32 = this._x1, halves = [], node = this._root, q2, i2;
  if (node)
    halves.push(new half_default(node, x0, x32));
  if (radius == null)
    radius = Infinity;
  else {
    x0 = x3 - radius;
    x32 = x3 + radius;
  }
  while (q2 = halves.pop()) {
    if (!(node = q2.node) || (x1 = q2.x0) > x32 || (x22 = q2.x1) < x0)
      continue;
    if (node.length) {
      var xm = (x1 + x22) / 2;
      halves.push(new half_default(node[1], xm, x22), new half_default(node[0], x1, xm));
      if (i2 = +(x3 >= xm)) {
        q2 = halves[halves.length - 1];
        halves[halves.length - 1] = halves[halves.length - 1 - i2];
        halves[halves.length - 1 - i2] = q2;
      }
    } else {
      var d2 = Math.abs(x3 - +this._x.call(null, node.data));
      if (d2 < radius) {
        radius = d2;
        x0 = x3 - d2;
        x32 = x3 + d2;
        data = node.data;
      }
    }
  }
  return data;
}
var init_find = __esm({
  "node_modules/d3-binarytree/src/find.js"() {
    init_half();
  }
});

// node_modules/d3-binarytree/src/remove.js
function remove_default3(d2) {
  if (isNaN(x3 = +this._x.call(null, d2)))
    return this;
  var parent, node = this._root, retainer, previous, next, x0 = this._x0, x1 = this._x1, x3, xm, right, i2, j2;
  if (!node)
    return this;
  if (node.length)
    while (true) {
      if (right = x3 >= (xm = (x0 + x1) / 2))
        x0 = xm;
      else
        x1 = xm;
      if (!(parent = node, node = node[i2 = +right]))
        return this;
      if (!node.length)
        break;
      if (parent[i2 + 1 & 1])
        retainer = parent, j2 = i2;
    }
  while (node.data !== d2)
    if (!(previous = node, node = node.next))
      return this;
  if (next = node.next)
    delete node.next;
  if (previous)
    return next ? previous.next = next : delete previous.next, this;
  if (!parent)
    return this._root = next, this;
  next ? parent[i2] = next : delete parent[i2];
  if ((node = parent[0] || parent[1]) && node === (parent[1] || parent[0]) && !node.length) {
    if (retainer)
      retainer[j2] = node;
    else
      this._root = node;
  }
  return this;
}
function removeAll2(data) {
  for (var i2 = 0, n2 = data.length; i2 < n2; ++i2)
    this.remove(data[i2]);
  return this;
}
var init_remove3 = __esm({
  "node_modules/d3-binarytree/src/remove.js"() {
  }
});

// node_modules/d3-binarytree/src/root.js
function root_default2() {
  return this._root;
}
var init_root2 = __esm({
  "node_modules/d3-binarytree/src/root.js"() {
  }
});

// node_modules/d3-binarytree/src/size.js
function size_default2() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length)
      do
        ++size;
      while (node = node.next);
  });
  return size;
}
var init_size2 = __esm({
  "node_modules/d3-binarytree/src/size.js"() {
  }
});

// node_modules/d3-binarytree/src/visit.js
function visit_default(callback) {
  var halves = [], q2, node = this._root, child, x0, x1;
  if (node)
    halves.push(new half_default(node, this._x0, this._x1));
  while (q2 = halves.pop()) {
    if (!callback(node = q2.node, x0 = q2.x0, x1 = q2.x1) && node.length) {
      var xm = (x0 + x1) / 2;
      if (child = node[1])
        halves.push(new half_default(child, xm, x1));
      if (child = node[0])
        halves.push(new half_default(child, x0, xm));
    }
  }
  return this;
}
var init_visit = __esm({
  "node_modules/d3-binarytree/src/visit.js"() {
    init_half();
  }
});

// node_modules/d3-binarytree/src/visitAfter.js
function visitAfter_default(callback) {
  var halves = [], next = [], q2;
  if (this._root)
    halves.push(new half_default(this._root, this._x0, this._x1));
  while (q2 = halves.pop()) {
    var node = q2.node;
    if (node.length) {
      var child, x0 = q2.x0, x1 = q2.x1, xm = (x0 + x1) / 2;
      if (child = node[0])
        halves.push(new half_default(child, x0, xm));
      if (child = node[1])
        halves.push(new half_default(child, xm, x1));
    }
    next.push(q2);
  }
  while (q2 = next.pop()) {
    callback(q2.node, q2.x0, q2.x1);
  }
  return this;
}
var init_visitAfter = __esm({
  "node_modules/d3-binarytree/src/visitAfter.js"() {
    init_half();
  }
});

// node_modules/d3-binarytree/src/x.js
function defaultX(d2) {
  return d2[0];
}
function x_default(_2) {
  return arguments.length ? (this._x = _2, this) : this._x;
}
var init_x = __esm({
  "node_modules/d3-binarytree/src/x.js"() {
  }
});

// node_modules/d3-binarytree/src/binarytree.js
function binarytree(nodes, x3) {
  var tree = new Binarytree(x3 == null ? defaultX : x3, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}
function Binarytree(x3, x0, x1) {
  this._x = x3;
  this._x0 = x0;
  this._x1 = x1;
  this._root = void 0;
}
function leaf_copy(leaf) {
  var copy = { data: leaf.data }, next = copy;
  while (leaf = leaf.next)
    next = next.next = { data: leaf.data };
  return copy;
}
var treeProto;
var init_binarytree = __esm({
  "node_modules/d3-binarytree/src/binarytree.js"() {
    init_add();
    init_cover();
    init_data2();
    init_extent();
    init_find();
    init_remove3();
    init_root2();
    init_size2();
    init_visit();
    init_visitAfter();
    init_x();
    treeProto = binarytree.prototype = Binarytree.prototype;
    treeProto.copy = function() {
      var copy = new Binarytree(this._x, this._x0, this._x1), node = this._root, nodes, child;
      if (!node)
        return copy;
      if (!node.length)
        return copy._root = leaf_copy(node), copy;
      nodes = [{ source: node, target: copy._root = new Array(2) }];
      while (node = nodes.pop()) {
        for (var i2 = 0; i2 < 2; ++i2) {
          if (child = node.source[i2]) {
            if (child.length)
              nodes.push({ source: child, target: node.target[i2] = new Array(2) });
            else
              node.target[i2] = leaf_copy(child);
          }
        }
      }
      return copy;
    };
    treeProto.add = add_default;
    treeProto.addAll = addAll;
    treeProto.cover = cover_default;
    treeProto.data = data_default2;
    treeProto.extent = extent_default;
    treeProto.find = find_default;
    treeProto.remove = remove_default3;
    treeProto.removeAll = removeAll2;
    treeProto.root = root_default2;
    treeProto.size = size_default2;
    treeProto.visit = visit_default;
    treeProto.visitAfter = visitAfter_default;
    treeProto.x = x_default;
  }
});

// node_modules/d3-binarytree/src/index.js
var init_src12 = __esm({
  "node_modules/d3-binarytree/src/index.js"() {
    init_binarytree();
  }
});

// node_modules/d3-quadtree/src/add.js
function add_default2(d2) {
  const x3 = +this._x.call(null, d2), y3 = +this._y.call(null, d2);
  return add3(this.cover(x3, y3), x3, y3, d2);
}
function add3(tree, x3, y3, d2) {
  if (isNaN(x3) || isNaN(y3))
    return tree;
  var parent, node = tree._root, leaf = { data: d2 }, x0 = tree._x0, y0 = tree._y0, x1 = tree._x1, y1 = tree._y1, xm, ym, xp, yp, right, bottom, i2, j2;
  if (!node)
    return tree._root = leaf, tree;
  while (node.length) {
    if (right = x3 >= (xm = (x0 + x1) / 2))
      x0 = xm;
    else
      x1 = xm;
    if (bottom = y3 >= (ym = (y0 + y1) / 2))
      y0 = ym;
    else
      y1 = ym;
    if (parent = node, !(node = node[i2 = bottom << 1 | right]))
      return parent[i2] = leaf, tree;
  }
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x3 === xp && y3 === yp)
    return leaf.next = node, parent ? parent[i2] = leaf : tree._root = leaf, tree;
  do {
    parent = parent ? parent[i2] = new Array(4) : tree._root = new Array(4);
    if (right = x3 >= (xm = (x0 + x1) / 2))
      x0 = xm;
    else
      x1 = xm;
    if (bottom = y3 >= (ym = (y0 + y1) / 2))
      y0 = ym;
    else
      y1 = ym;
  } while ((i2 = bottom << 1 | right) === (j2 = (yp >= ym) << 1 | xp >= xm));
  return parent[j2] = node, parent[i2] = leaf, tree;
}
function addAll2(data) {
  var d2, i2, n2 = data.length, x3, y3, xz = new Array(n2), yz = new Array(n2), x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (i2 = 0; i2 < n2; ++i2) {
    if (isNaN(x3 = +this._x.call(null, d2 = data[i2])) || isNaN(y3 = +this._y.call(null, d2)))
      continue;
    xz[i2] = x3;
    yz[i2] = y3;
    if (x3 < x0)
      x0 = x3;
    if (x3 > x1)
      x1 = x3;
    if (y3 < y0)
      y0 = y3;
    if (y3 > y1)
      y1 = y3;
  }
  if (x0 > x1 || y0 > y1)
    return this;
  this.cover(x0, y0).cover(x1, y1);
  for (i2 = 0; i2 < n2; ++i2) {
    add3(this, xz[i2], yz[i2], data[i2]);
  }
  return this;
}
var init_add2 = __esm({
  "node_modules/d3-quadtree/src/add.js"() {
  }
});

// node_modules/d3-quadtree/src/cover.js
function cover_default2(x3, y3) {
  if (isNaN(x3 = +x3) || isNaN(y3 = +y3))
    return this;
  var x0 = this._x0, y0 = this._y0, x1 = this._x1, y1 = this._y1;
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x3)) + 1;
    y1 = (y0 = Math.floor(y3)) + 1;
  } else {
    var z3 = x1 - x0 || 1, node = this._root, parent, i2;
    while (x0 > x3 || x3 >= x1 || y0 > y3 || y3 >= y1) {
      i2 = (y3 < y0) << 1 | x3 < x0;
      parent = new Array(4), parent[i2] = node, node = parent, z3 *= 2;
      switch (i2) {
        case 0:
          x1 = x0 + z3, y1 = y0 + z3;
          break;
        case 1:
          x0 = x1 - z3, y1 = y0 + z3;
          break;
        case 2:
          x1 = x0 + z3, y0 = y1 - z3;
          break;
        case 3:
          x0 = x1 - z3, y0 = y1 - z3;
          break;
      }
    }
    if (this._root && this._root.length)
      this._root = node;
  }
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  return this;
}
var init_cover2 = __esm({
  "node_modules/d3-quadtree/src/cover.js"() {
  }
});

// node_modules/d3-quadtree/src/data.js
function data_default3() {
  var data = [];
  this.visit(function(node) {
    if (!node.length)
      do
        data.push(node.data);
      while (node = node.next);
  });
  return data;
}
var init_data3 = __esm({
  "node_modules/d3-quadtree/src/data.js"() {
  }
});

// node_modules/d3-quadtree/src/extent.js
function extent_default2(_2) {
  return arguments.length ? this.cover(+_2[0][0], +_2[0][1]).cover(+_2[1][0], +_2[1][1]) : isNaN(this._x0) ? void 0 : [[this._x0, this._y0], [this._x1, this._y1]];
}
var init_extent2 = __esm({
  "node_modules/d3-quadtree/src/extent.js"() {
  }
});

// node_modules/d3-quadtree/src/quad.js
function quad_default(node, x0, y0, x1, y1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
}
var init_quad = __esm({
  "node_modules/d3-quadtree/src/quad.js"() {
  }
});

// node_modules/d3-quadtree/src/find.js
function find_default2(x3, y3, radius) {
  var data, x0 = this._x0, y0 = this._y0, x1, y1, x22, y22, x32 = this._x1, y32 = this._y1, quads = [], node = this._root, q2, i2;
  if (node)
    quads.push(new quad_default(node, x0, y0, x32, y32));
  if (radius == null)
    radius = Infinity;
  else {
    x0 = x3 - radius, y0 = y3 - radius;
    x32 = x3 + radius, y32 = y3 + radius;
    radius *= radius;
  }
  while (q2 = quads.pop()) {
    if (!(node = q2.node) || (x1 = q2.x0) > x32 || (y1 = q2.y0) > y32 || (x22 = q2.x1) < x0 || (y22 = q2.y1) < y0)
      continue;
    if (node.length) {
      var xm = (x1 + x22) / 2, ym = (y1 + y22) / 2;
      quads.push(new quad_default(node[3], xm, ym, x22, y22), new quad_default(node[2], x1, ym, xm, y22), new quad_default(node[1], xm, y1, x22, ym), new quad_default(node[0], x1, y1, xm, ym));
      if (i2 = (y3 >= ym) << 1 | x3 >= xm) {
        q2 = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i2];
        quads[quads.length - 1 - i2] = q2;
      }
    } else {
      var dx = x3 - +this._x.call(null, node.data), dy = y3 - +this._y.call(null, node.data), d2 = dx * dx + dy * dy;
      if (d2 < radius) {
        var d3 = Math.sqrt(radius = d2);
        x0 = x3 - d3, y0 = y3 - d3;
        x32 = x3 + d3, y32 = y3 + d3;
        data = node.data;
      }
    }
  }
  return data;
}
var init_find2 = __esm({
  "node_modules/d3-quadtree/src/find.js"() {
    init_quad();
  }
});

// node_modules/d3-quadtree/src/remove.js
function remove_default4(d2) {
  if (isNaN(x3 = +this._x.call(null, d2)) || isNaN(y3 = +this._y.call(null, d2)))
    return this;
  var parent, node = this._root, retainer, previous, next, x0 = this._x0, y0 = this._y0, x1 = this._x1, y1 = this._y1, x3, y3, xm, ym, right, bottom, i2, j2;
  if (!node)
    return this;
  if (node.length)
    while (true) {
      if (right = x3 >= (xm = (x0 + x1) / 2))
        x0 = xm;
      else
        x1 = xm;
      if (bottom = y3 >= (ym = (y0 + y1) / 2))
        y0 = ym;
      else
        y1 = ym;
      if (!(parent = node, node = node[i2 = bottom << 1 | right]))
        return this;
      if (!node.length)
        break;
      if (parent[i2 + 1 & 3] || parent[i2 + 2 & 3] || parent[i2 + 3 & 3])
        retainer = parent, j2 = i2;
    }
  while (node.data !== d2)
    if (!(previous = node, node = node.next))
      return this;
  if (next = node.next)
    delete node.next;
  if (previous)
    return next ? previous.next = next : delete previous.next, this;
  if (!parent)
    return this._root = next, this;
  next ? parent[i2] = next : delete parent[i2];
  if ((node = parent[0] || parent[1] || parent[2] || parent[3]) && node === (parent[3] || parent[2] || parent[1] || parent[0]) && !node.length) {
    if (retainer)
      retainer[j2] = node;
    else
      this._root = node;
  }
  return this;
}
function removeAll3(data) {
  for (var i2 = 0, n2 = data.length; i2 < n2; ++i2)
    this.remove(data[i2]);
  return this;
}
var init_remove4 = __esm({
  "node_modules/d3-quadtree/src/remove.js"() {
  }
});

// node_modules/d3-quadtree/src/root.js
function root_default3() {
  return this._root;
}
var init_root3 = __esm({
  "node_modules/d3-quadtree/src/root.js"() {
  }
});

// node_modules/d3-quadtree/src/size.js
function size_default3() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length)
      do
        ++size;
      while (node = node.next);
  });
  return size;
}
var init_size3 = __esm({
  "node_modules/d3-quadtree/src/size.js"() {
  }
});

// node_modules/d3-quadtree/src/visit.js
function visit_default2(callback) {
  var quads = [], q2, node = this._root, child, x0, y0, x1, y1;
  if (node)
    quads.push(new quad_default(node, this._x0, this._y0, this._x1, this._y1));
  while (q2 = quads.pop()) {
    if (!callback(node = q2.node, x0 = q2.x0, y0 = q2.y0, x1 = q2.x1, y1 = q2.y1) && node.length) {
      var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[3])
        quads.push(new quad_default(child, xm, ym, x1, y1));
      if (child = node[2])
        quads.push(new quad_default(child, x0, ym, xm, y1));
      if (child = node[1])
        quads.push(new quad_default(child, xm, y0, x1, ym));
      if (child = node[0])
        quads.push(new quad_default(child, x0, y0, xm, ym));
    }
  }
  return this;
}
var init_visit2 = __esm({
  "node_modules/d3-quadtree/src/visit.js"() {
    init_quad();
  }
});

// node_modules/d3-quadtree/src/visitAfter.js
function visitAfter_default2(callback) {
  var quads = [], next = [], q2;
  if (this._root)
    quads.push(new quad_default(this._root, this._x0, this._y0, this._x1, this._y1));
  while (q2 = quads.pop()) {
    var node = q2.node;
    if (node.length) {
      var child, x0 = q2.x0, y0 = q2.y0, x1 = q2.x1, y1 = q2.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[0])
        quads.push(new quad_default(child, x0, y0, xm, ym));
      if (child = node[1])
        quads.push(new quad_default(child, xm, y0, x1, ym));
      if (child = node[2])
        quads.push(new quad_default(child, x0, ym, xm, y1));
      if (child = node[3])
        quads.push(new quad_default(child, xm, ym, x1, y1));
    }
    next.push(q2);
  }
  while (q2 = next.pop()) {
    callback(q2.node, q2.x0, q2.y0, q2.x1, q2.y1);
  }
  return this;
}
var init_visitAfter2 = __esm({
  "node_modules/d3-quadtree/src/visitAfter.js"() {
    init_quad();
  }
});

// node_modules/d3-quadtree/src/x.js
function defaultX2(d2) {
  return d2[0];
}
function x_default2(_2) {
  return arguments.length ? (this._x = _2, this) : this._x;
}
var init_x2 = __esm({
  "node_modules/d3-quadtree/src/x.js"() {
  }
});

// node_modules/d3-quadtree/src/y.js
function defaultY(d2) {
  return d2[1];
}
function y_default(_2) {
  return arguments.length ? (this._y = _2, this) : this._y;
}
var init_y = __esm({
  "node_modules/d3-quadtree/src/y.js"() {
  }
});

// node_modules/d3-quadtree/src/quadtree.js
function quadtree(nodes, x3, y3) {
  var tree = new Quadtree(x3 == null ? defaultX2 : x3, y3 == null ? defaultY : y3, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}
function Quadtree(x3, y3, x0, y0, x1, y1) {
  this._x = x3;
  this._y = y3;
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this._root = void 0;
}
function leaf_copy2(leaf) {
  var copy = { data: leaf.data }, next = copy;
  while (leaf = leaf.next)
    next = next.next = { data: leaf.data };
  return copy;
}
var treeProto2;
var init_quadtree = __esm({
  "node_modules/d3-quadtree/src/quadtree.js"() {
    init_add2();
    init_cover2();
    init_data3();
    init_extent2();
    init_find2();
    init_remove4();
    init_root3();
    init_size3();
    init_visit2();
    init_visitAfter2();
    init_x2();
    init_y();
    treeProto2 = quadtree.prototype = Quadtree.prototype;
    treeProto2.copy = function() {
      var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1), node = this._root, nodes, child;
      if (!node)
        return copy;
      if (!node.length)
        return copy._root = leaf_copy2(node), copy;
      nodes = [{ source: node, target: copy._root = new Array(4) }];
      while (node = nodes.pop()) {
        for (var i2 = 0; i2 < 4; ++i2) {
          if (child = node.source[i2]) {
            if (child.length)
              nodes.push({ source: child, target: node.target[i2] = new Array(4) });
            else
              node.target[i2] = leaf_copy2(child);
          }
        }
      }
      return copy;
    };
    treeProto2.add = add_default2;
    treeProto2.addAll = addAll2;
    treeProto2.cover = cover_default2;
    treeProto2.data = data_default3;
    treeProto2.extent = extent_default2;
    treeProto2.find = find_default2;
    treeProto2.remove = remove_default4;
    treeProto2.removeAll = removeAll3;
    treeProto2.root = root_default3;
    treeProto2.size = size_default3;
    treeProto2.visit = visit_default2;
    treeProto2.visitAfter = visitAfter_default2;
    treeProto2.x = x_default2;
    treeProto2.y = y_default;
  }
});

// node_modules/d3-quadtree/src/index.js
var init_src13 = __esm({
  "node_modules/d3-quadtree/src/index.js"() {
    init_quadtree();
  }
});

// node_modules/d3-octree/src/add.js
function add_default3(d2) {
  const x3 = +this._x.call(null, d2), y3 = +this._y.call(null, d2), z3 = +this._z.call(null, d2);
  return add4(this.cover(x3, y3, z3), x3, y3, z3, d2);
}
function add4(tree, x3, y3, z3, d2) {
  if (isNaN(x3) || isNaN(y3) || isNaN(z3))
    return tree;
  var parent, node = tree._root, leaf = { data: d2 }, x0 = tree._x0, y0 = tree._y0, z0 = tree._z0, x1 = tree._x1, y1 = tree._y1, z1 = tree._z1, xm, ym, zm, xp, yp, zp, right, bottom, deep, i2, j2;
  if (!node)
    return tree._root = leaf, tree;
  while (node.length) {
    if (right = x3 >= (xm = (x0 + x1) / 2))
      x0 = xm;
    else
      x1 = xm;
    if (bottom = y3 >= (ym = (y0 + y1) / 2))
      y0 = ym;
    else
      y1 = ym;
    if (deep = z3 >= (zm = (z0 + z1) / 2))
      z0 = zm;
    else
      z1 = zm;
    if (parent = node, !(node = node[i2 = deep << 2 | bottom << 1 | right]))
      return parent[i2] = leaf, tree;
  }
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  zp = +tree._z.call(null, node.data);
  if (x3 === xp && y3 === yp && z3 === zp)
    return leaf.next = node, parent ? parent[i2] = leaf : tree._root = leaf, tree;
  do {
    parent = parent ? parent[i2] = new Array(8) : tree._root = new Array(8);
    if (right = x3 >= (xm = (x0 + x1) / 2))
      x0 = xm;
    else
      x1 = xm;
    if (bottom = y3 >= (ym = (y0 + y1) / 2))
      y0 = ym;
    else
      y1 = ym;
    if (deep = z3 >= (zm = (z0 + z1) / 2))
      z0 = zm;
    else
      z1 = zm;
  } while ((i2 = deep << 2 | bottom << 1 | right) === (j2 = (zp >= zm) << 2 | (yp >= ym) << 1 | xp >= xm));
  return parent[j2] = node, parent[i2] = leaf, tree;
}
function addAll3(data) {
  if (!Array.isArray(data))
    data = Array.from(data);
  const n2 = data.length;
  const xz = new Float64Array(n2);
  const yz = new Float64Array(n2);
  const zz = new Float64Array(n2);
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i2 = 0, d2, x3, y3, z3; i2 < n2; ++i2) {
    if (isNaN(x3 = +this._x.call(null, d2 = data[i2])) || isNaN(y3 = +this._y.call(null, d2)) || isNaN(z3 = +this._z.call(null, d2)))
      continue;
    xz[i2] = x3;
    yz[i2] = y3;
    zz[i2] = z3;
    if (x3 < x0)
      x0 = x3;
    if (x3 > x1)
      x1 = x3;
    if (y3 < y0)
      y0 = y3;
    if (y3 > y1)
      y1 = y3;
    if (z3 < z0)
      z0 = z3;
    if (z3 > z1)
      z1 = z3;
  }
  if (x0 > x1 || y0 > y1 || z0 > z1)
    return this;
  this.cover(x0, y0, z0).cover(x1, y1, z1);
  for (let i2 = 0; i2 < n2; ++i2) {
    add4(this, xz[i2], yz[i2], zz[i2], data[i2]);
  }
  return this;
}
var init_add3 = __esm({
  "node_modules/d3-octree/src/add.js"() {
  }
});

// node_modules/d3-octree/src/cover.js
function cover_default3(x3, y3, z3) {
  if (isNaN(x3 = +x3) || isNaN(y3 = +y3) || isNaN(z3 = +z3))
    return this;
  var x0 = this._x0, y0 = this._y0, z0 = this._z0, x1 = this._x1, y1 = this._y1, z1 = this._z1;
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x3)) + 1;
    y1 = (y0 = Math.floor(y3)) + 1;
    z1 = (z0 = Math.floor(z3)) + 1;
  } else {
    var t3 = x1 - x0 || 1, node = this._root, parent, i2;
    while (x0 > x3 || x3 >= x1 || y0 > y3 || y3 >= y1 || z0 > z3 || z3 >= z1) {
      i2 = (z3 < z0) << 2 | (y3 < y0) << 1 | x3 < x0;
      parent = new Array(8), parent[i2] = node, node = parent, t3 *= 2;
      switch (i2) {
        case 0:
          x1 = x0 + t3, y1 = y0 + t3, z1 = z0 + t3;
          break;
        case 1:
          x0 = x1 - t3, y1 = y0 + t3, z1 = z0 + t3;
          break;
        case 2:
          x1 = x0 + t3, y0 = y1 - t3, z1 = z0 + t3;
          break;
        case 3:
          x0 = x1 - t3, y0 = y1 - t3, z1 = z0 + t3;
          break;
        case 4:
          x1 = x0 + t3, y1 = y0 + t3, z0 = z1 - t3;
          break;
        case 5:
          x0 = x1 - t3, y1 = y0 + t3, z0 = z1 - t3;
          break;
        case 6:
          x1 = x0 + t3, y0 = y1 - t3, z0 = z1 - t3;
          break;
        case 7:
          x0 = x1 - t3, y0 = y1 - t3, z0 = z1 - t3;
          break;
      }
    }
    if (this._root && this._root.length)
      this._root = node;
  }
  this._x0 = x0;
  this._y0 = y0;
  this._z0 = z0;
  this._x1 = x1;
  this._y1 = y1;
  this._z1 = z1;
  return this;
}
var init_cover3 = __esm({
  "node_modules/d3-octree/src/cover.js"() {
  }
});

// node_modules/d3-octree/src/data.js
function data_default4() {
  var data = [];
  this.visit(function(node) {
    if (!node.length)
      do
        data.push(node.data);
      while (node = node.next);
  });
  return data;
}
var init_data4 = __esm({
  "node_modules/d3-octree/src/data.js"() {
  }
});

// node_modules/d3-octree/src/extent.js
function extent_default3(_2) {
  return arguments.length ? this.cover(+_2[0][0], +_2[0][1], +_2[0][2]).cover(+_2[1][0], +_2[1][1], +_2[1][2]) : isNaN(this._x0) ? void 0 : [[this._x0, this._y0, this._z0], [this._x1, this._y1, this._z1]];
}
var init_extent3 = __esm({
  "node_modules/d3-octree/src/extent.js"() {
  }
});

// node_modules/d3-octree/src/octant.js
function octant_default(node, x0, y0, z0, x1, y1, z1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.z0 = z0;
  this.x1 = x1;
  this.y1 = y1;
  this.z1 = z1;
}
var init_octant = __esm({
  "node_modules/d3-octree/src/octant.js"() {
  }
});

// node_modules/d3-octree/src/find.js
function find_default3(x3, y3, z3, radius) {
  var data, x0 = this._x0, y0 = this._y0, z0 = this._z0, x1, y1, z1, x22, y22, z22, x32 = this._x1, y32 = this._y1, z32 = this._z1, octs = [], node = this._root, q2, i2;
  if (node)
    octs.push(new octant_default(node, x0, y0, z0, x32, y32, z32));
  if (radius == null)
    radius = Infinity;
  else {
    x0 = x3 - radius, y0 = y3 - radius, z0 = z3 - radius;
    x32 = x3 + radius, y32 = y3 + radius, z32 = z3 + radius;
    radius *= radius;
  }
  while (q2 = octs.pop()) {
    if (!(node = q2.node) || (x1 = q2.x0) > x32 || (y1 = q2.y0) > y32 || (z1 = q2.z0) > z32 || (x22 = q2.x1) < x0 || (y22 = q2.y1) < y0 || (z22 = q2.z1) < z0)
      continue;
    if (node.length) {
      var xm = (x1 + x22) / 2, ym = (y1 + y22) / 2, zm = (z1 + z22) / 2;
      octs.push(new octant_default(node[7], xm, ym, zm, x22, y22, z22), new octant_default(node[6], x1, ym, zm, xm, y22, z22), new octant_default(node[5], xm, y1, zm, x22, ym, z22), new octant_default(node[4], x1, y1, zm, xm, ym, z22), new octant_default(node[3], xm, ym, z1, x22, y22, zm), new octant_default(node[2], x1, ym, z1, xm, y22, zm), new octant_default(node[1], xm, y1, z1, x22, ym, zm), new octant_default(node[0], x1, y1, z1, xm, ym, zm));
      if (i2 = (z3 >= zm) << 2 | (y3 >= ym) << 1 | x3 >= xm) {
        q2 = octs[octs.length - 1];
        octs[octs.length - 1] = octs[octs.length - 1 - i2];
        octs[octs.length - 1 - i2] = q2;
      }
    } else {
      var dx = x3 - +this._x.call(null, node.data), dy = y3 - +this._y.call(null, node.data), dz = z3 - +this._z.call(null, node.data), d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < radius) {
        var d3 = Math.sqrt(radius = d2);
        x0 = x3 - d3, y0 = y3 - d3, z0 = z3 - d3;
        x32 = x3 + d3, y32 = y3 + d3, z32 = z3 + d3;
        data = node.data;
      }
    }
  }
  return data;
}
var init_find3 = __esm({
  "node_modules/d3-octree/src/find.js"() {
    init_octant();
  }
});

// node_modules/d3-octree/src/findAll.js
function findAllWithinRadius(x3, y3, z3, radius) {
  const result = [];
  const xMin = x3 - radius;
  const yMin = y3 - radius;
  const zMin = z3 - radius;
  const xMax = x3 + radius;
  const yMax = y3 + radius;
  const zMax = z3 + radius;
  this.visit((node, x1, y1, z1, x22, y22, z22) => {
    if (!node.length) {
      do {
        const d2 = node.data;
        if (distance(x3, y3, z3, this._x(d2), this._y(d2), this._z(d2)) <= radius) {
          result.push(d2);
        }
      } while (node = node.next);
    }
    return x1 > xMax || y1 > yMax || z1 > zMax || x22 < xMin || y22 < yMin || z22 < zMin;
  });
  return result;
}
var distance;
var init_findAll = __esm({
  "node_modules/d3-octree/src/findAll.js"() {
    distance = (x1, y1, z1, x22, y22, z22) => Math.sqrt((x1 - x22) ** 2 + (y1 - y22) ** 2 + (z1 - z22) ** 2);
  }
});

// node_modules/d3-octree/src/remove.js
function remove_default5(d2) {
  if (isNaN(x3 = +this._x.call(null, d2)) || isNaN(y3 = +this._y.call(null, d2)) || isNaN(z3 = +this._z.call(null, d2)))
    return this;
  var parent, node = this._root, retainer, previous, next, x0 = this._x0, y0 = this._y0, z0 = this._z0, x1 = this._x1, y1 = this._y1, z1 = this._z1, x3, y3, z3, xm, ym, zm, right, bottom, deep, i2, j2;
  if (!node)
    return this;
  if (node.length)
    while (true) {
      if (right = x3 >= (xm = (x0 + x1) / 2))
        x0 = xm;
      else
        x1 = xm;
      if (bottom = y3 >= (ym = (y0 + y1) / 2))
        y0 = ym;
      else
        y1 = ym;
      if (deep = z3 >= (zm = (z0 + z1) / 2))
        z0 = zm;
      else
        z1 = zm;
      if (!(parent = node, node = node[i2 = deep << 2 | bottom << 1 | right]))
        return this;
      if (!node.length)
        break;
      if (parent[i2 + 1 & 7] || parent[i2 + 2 & 7] || parent[i2 + 3 & 7] || parent[i2 + 4 & 7] || parent[i2 + 5 & 7] || parent[i2 + 6 & 7] || parent[i2 + 7 & 7])
        retainer = parent, j2 = i2;
    }
  while (node.data !== d2)
    if (!(previous = node, node = node.next))
      return this;
  if (next = node.next)
    delete node.next;
  if (previous)
    return next ? previous.next = next : delete previous.next, this;
  if (!parent)
    return this._root = next, this;
  next ? parent[i2] = next : delete parent[i2];
  if ((node = parent[0] || parent[1] || parent[2] || parent[3] || parent[4] || parent[5] || parent[6] || parent[7]) && node === (parent[7] || parent[6] || parent[5] || parent[4] || parent[3] || parent[2] || parent[1] || parent[0]) && !node.length) {
    if (retainer)
      retainer[j2] = node;
    else
      this._root = node;
  }
  return this;
}
function removeAll4(data) {
  for (var i2 = 0, n2 = data.length; i2 < n2; ++i2)
    this.remove(data[i2]);
  return this;
}
var init_remove5 = __esm({
  "node_modules/d3-octree/src/remove.js"() {
  }
});

// node_modules/d3-octree/src/root.js
function root_default4() {
  return this._root;
}
var init_root4 = __esm({
  "node_modules/d3-octree/src/root.js"() {
  }
});

// node_modules/d3-octree/src/size.js
function size_default4() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length)
      do
        ++size;
      while (node = node.next);
  });
  return size;
}
var init_size4 = __esm({
  "node_modules/d3-octree/src/size.js"() {
  }
});

// node_modules/d3-octree/src/visit.js
function visit_default3(callback) {
  var octs = [], q2, node = this._root, child, x0, y0, z0, x1, y1, z1;
  if (node)
    octs.push(new octant_default(node, this._x0, this._y0, this._z0, this._x1, this._y1, this._z1));
  while (q2 = octs.pop()) {
    if (!callback(node = q2.node, x0 = q2.x0, y0 = q2.y0, z0 = q2.z0, x1 = q2.x1, y1 = q2.y1, z1 = q2.z1) && node.length) {
      var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2, zm = (z0 + z1) / 2;
      if (child = node[7])
        octs.push(new octant_default(child, xm, ym, zm, x1, y1, z1));
      if (child = node[6])
        octs.push(new octant_default(child, x0, ym, zm, xm, y1, z1));
      if (child = node[5])
        octs.push(new octant_default(child, xm, y0, zm, x1, ym, z1));
      if (child = node[4])
        octs.push(new octant_default(child, x0, y0, zm, xm, ym, z1));
      if (child = node[3])
        octs.push(new octant_default(child, xm, ym, z0, x1, y1, zm));
      if (child = node[2])
        octs.push(new octant_default(child, x0, ym, z0, xm, y1, zm));
      if (child = node[1])
        octs.push(new octant_default(child, xm, y0, z0, x1, ym, zm));
      if (child = node[0])
        octs.push(new octant_default(child, x0, y0, z0, xm, ym, zm));
    }
  }
  return this;
}
var init_visit3 = __esm({
  "node_modules/d3-octree/src/visit.js"() {
    init_octant();
  }
});

// node_modules/d3-octree/src/visitAfter.js
function visitAfter_default3(callback) {
  var octs = [], next = [], q2;
  if (this._root)
    octs.push(new octant_default(this._root, this._x0, this._y0, this._z0, this._x1, this._y1, this._z1));
  while (q2 = octs.pop()) {
    var node = q2.node;
    if (node.length) {
      var child, x0 = q2.x0, y0 = q2.y0, z0 = q2.z0, x1 = q2.x1, y1 = q2.y1, z1 = q2.z1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2, zm = (z0 + z1) / 2;
      if (child = node[0])
        octs.push(new octant_default(child, x0, y0, z0, xm, ym, zm));
      if (child = node[1])
        octs.push(new octant_default(child, xm, y0, z0, x1, ym, zm));
      if (child = node[2])
        octs.push(new octant_default(child, x0, ym, z0, xm, y1, zm));
      if (child = node[3])
        octs.push(new octant_default(child, xm, ym, z0, x1, y1, zm));
      if (child = node[4])
        octs.push(new octant_default(child, x0, y0, zm, xm, ym, z1));
      if (child = node[5])
        octs.push(new octant_default(child, xm, y0, zm, x1, ym, z1));
      if (child = node[6])
        octs.push(new octant_default(child, x0, ym, zm, xm, y1, z1));
      if (child = node[7])
        octs.push(new octant_default(child, xm, ym, zm, x1, y1, z1));
    }
    next.push(q2);
  }
  while (q2 = next.pop()) {
    callback(q2.node, q2.x0, q2.y0, q2.z0, q2.x1, q2.y1, q2.z1);
  }
  return this;
}
var init_visitAfter3 = __esm({
  "node_modules/d3-octree/src/visitAfter.js"() {
    init_octant();
  }
});

// node_modules/d3-octree/src/x.js
function defaultX3(d2) {
  return d2[0];
}
function x_default3(_2) {
  return arguments.length ? (this._x = _2, this) : this._x;
}
var init_x3 = __esm({
  "node_modules/d3-octree/src/x.js"() {
  }
});

// node_modules/d3-octree/src/y.js
function defaultY2(d2) {
  return d2[1];
}
function y_default2(_2) {
  return arguments.length ? (this._y = _2, this) : this._y;
}
var init_y2 = __esm({
  "node_modules/d3-octree/src/y.js"() {
  }
});

// node_modules/d3-octree/src/z.js
function defaultZ(d2) {
  return d2[2];
}
function z_default(_2) {
  return arguments.length ? (this._z = _2, this) : this._z;
}
var init_z = __esm({
  "node_modules/d3-octree/src/z.js"() {
  }
});

// node_modules/d3-octree/src/octree.js
function octree(nodes, x3, y3, z3) {
  var tree = new Octree(x3 == null ? defaultX3 : x3, y3 == null ? defaultY2 : y3, z3 == null ? defaultZ : z3, NaN, NaN, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}
function Octree(x3, y3, z3, x0, y0, z0, x1, y1, z1) {
  this._x = x3;
  this._y = y3;
  this._z = z3;
  this._x0 = x0;
  this._y0 = y0;
  this._z0 = z0;
  this._x1 = x1;
  this._y1 = y1;
  this._z1 = z1;
  this._root = void 0;
}
function leaf_copy3(leaf) {
  var copy = { data: leaf.data }, next = copy;
  while (leaf = leaf.next)
    next = next.next = { data: leaf.data };
  return copy;
}
var treeProto3;
var init_octree = __esm({
  "node_modules/d3-octree/src/octree.js"() {
    init_add3();
    init_cover3();
    init_data4();
    init_extent3();
    init_find3();
    init_findAll();
    init_remove5();
    init_root4();
    init_size4();
    init_visit3();
    init_visitAfter3();
    init_x3();
    init_y2();
    init_z();
    treeProto3 = octree.prototype = Octree.prototype;
    treeProto3.copy = function() {
      var copy = new Octree(this._x, this._y, this._z, this._x0, this._y0, this._z0, this._x1, this._y1, this._z1), node = this._root, nodes, child;
      if (!node)
        return copy;
      if (!node.length)
        return copy._root = leaf_copy3(node), copy;
      nodes = [{ source: node, target: copy._root = new Array(8) }];
      while (node = nodes.pop()) {
        for (var i2 = 0; i2 < 8; ++i2) {
          if (child = node.source[i2]) {
            if (child.length)
              nodes.push({ source: child, target: node.target[i2] = new Array(8) });
            else
              node.target[i2] = leaf_copy3(child);
          }
        }
      }
      return copy;
    };
    treeProto3.add = add_default3;
    treeProto3.addAll = addAll3;
    treeProto3.cover = cover_default3;
    treeProto3.data = data_default4;
    treeProto3.extent = extent_default3;
    treeProto3.find = find_default3;
    treeProto3.findAllWithinRadius = findAllWithinRadius;
    treeProto3.remove = remove_default5;
    treeProto3.removeAll = removeAll4;
    treeProto3.root = root_default4;
    treeProto3.size = size_default4;
    treeProto3.visit = visit_default3;
    treeProto3.visitAfter = visitAfter_default3;
    treeProto3.x = x_default3;
    treeProto3.y = y_default2;
    treeProto3.z = z_default;
  }
});

// node_modules/d3-octree/src/index.js
var init_src14 = __esm({
  "node_modules/d3-octree/src/index.js"() {
    init_octree();
  }
});

// node_modules/d3-force-3d/src/constant.js
function constant_default5(x3) {
  return function() {
    return x3;
  };
}
var init_constant5 = __esm({
  "node_modules/d3-force-3d/src/constant.js"() {
  }
});

// node_modules/d3-force-3d/src/jiggle.js
function jiggle_default(random) {
  return (random() - 0.5) * 1e-6;
}
var init_jiggle = __esm({
  "node_modules/d3-force-3d/src/jiggle.js"() {
  }
});

// node_modules/d3-force-3d/src/link.js
function index4(d2) {
  return d2.index;
}
function find2(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node)
    throw new Error("node not found: " + nodeId);
  return node;
}
function link_default(links) {
  var id2 = index4, strength = defaultStrength, strengths, distance2 = constant_default5(30), distances, nodes, nDim, count, bias, random, iterations = 1;
  if (links == null)
    links = [];
  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }
  function force(alpha) {
    for (var k2 = 0, n2 = links.length; k2 < iterations; ++k2) {
      for (var i2 = 0, link, source, target, x3 = 0, y3 = 0, z3 = 0, l2, b; i2 < n2; ++i2) {
        link = links[i2], source = link.source, target = link.target;
        x3 = target.x + target.vx - source.x - source.vx || jiggle_default(random);
        if (nDim > 1) {
          y3 = target.y + target.vy - source.y - source.vy || jiggle_default(random);
        }
        if (nDim > 2) {
          z3 = target.z + target.vz - source.z - source.vz || jiggle_default(random);
        }
        l2 = Math.sqrt(x3 * x3 + y3 * y3 + z3 * z3);
        l2 = (l2 - distances[i2]) / l2 * alpha * strengths[i2];
        x3 *= l2, y3 *= l2, z3 *= l2;
        target.vx -= x3 * (b = bias[i2]);
        if (nDim > 1) {
          target.vy -= y3 * b;
        }
        if (nDim > 2) {
          target.vz -= z3 * b;
        }
        source.vx += x3 * (b = 1 - b);
        if (nDim > 1) {
          source.vy += y3 * b;
        }
        if (nDim > 2) {
          source.vz += z3 * b;
        }
      }
    }
  }
  function initialize() {
    if (!nodes)
      return;
    var i2, n2 = nodes.length, m3 = links.length, nodeById = new Map(nodes.map((d2, i3) => [id2(d2, i3, nodes), d2])), link;
    for (i2 = 0, count = new Array(n2); i2 < m3; ++i2) {
      link = links[i2], link.index = i2;
      if (typeof link.source !== "object")
        link.source = find2(nodeById, link.source);
      if (typeof link.target !== "object")
        link.target = find2(nodeById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }
    for (i2 = 0, bias = new Array(m3); i2 < m3; ++i2) {
      link = links[i2], bias[i2] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }
    strengths = new Array(m3), initializeStrength();
    distances = new Array(m3), initializeDistance();
  }
  function initializeStrength() {
    if (!nodes)
      return;
    for (var i2 = 0, n2 = links.length; i2 < n2; ++i2) {
      strengths[i2] = +strength(links[i2], i2, links);
    }
  }
  function initializeDistance() {
    if (!nodes)
      return;
    for (var i2 = 0, n2 = links.length; i2 < n2; ++i2) {
      distances[i2] = +distance2(links[i2], i2, links);
    }
  }
  force.initialize = function(_nodes, ...args) {
    nodes = _nodes;
    random = args.find((arg) => typeof arg === "function") || Math.random;
    nDim = args.find((arg) => [1, 2, 3].includes(arg)) || 2;
    initialize();
  };
  force.links = function(_2) {
    return arguments.length ? (links = _2, initialize(), force) : links;
  };
  force.id = function(_2) {
    return arguments.length ? (id2 = _2, force) : id2;
  };
  force.iterations = function(_2) {
    return arguments.length ? (iterations = +_2, force) : iterations;
  };
  force.strength = function(_2) {
    return arguments.length ? (strength = typeof _2 === "function" ? _2 : constant_default5(+_2), initializeStrength(), force) : strength;
  };
  force.distance = function(_2) {
    return arguments.length ? (distance2 = typeof _2 === "function" ? _2 : constant_default5(+_2), initializeDistance(), force) : distance2;
  };
  return force;
}
var init_link = __esm({
  "node_modules/d3-force-3d/src/link.js"() {
    init_constant5();
    init_jiggle();
  }
});

// node_modules/d3-force-3d/src/lcg.js
function lcg_default() {
  let s2 = 1;
  return () => (s2 = (a2 * s2 + c2) % m2) / m2;
}
var a2, c2, m2;
var init_lcg = __esm({
  "node_modules/d3-force-3d/src/lcg.js"() {
    a2 = 1664525;
    c2 = 1013904223;
    m2 = 4294967296;
  }
});

// node_modules/d3-force-3d/src/simulation.js
function x2(d2) {
  return d2.x;
}
function y2(d2) {
  return d2.y;
}
function z2(d2) {
  return d2.z;
}
function simulation_default(nodes, numDimensions) {
  numDimensions = numDimensions || 2;
  var nDim = Math.min(MAX_DIMENSIONS, Math.max(1, Math.round(numDimensions))), simulation, alpha = 1, alphaMin = 1e-3, alphaDecay = 1 - Math.pow(alphaMin, 1 / 300), alphaTarget = 0, velocityDecay = 0.6, forces = /* @__PURE__ */ new Map(), stepper = timer(step), event = dispatch_default2("tick", "end"), random = lcg_default();
  if (nodes == null)
    nodes = [];
  function step() {
    tick();
    event.call("tick", simulation);
    if (alpha < alphaMin) {
      stepper.stop();
      event.call("end", simulation);
    }
  }
  function tick(iterations) {
    var i2, n2 = nodes.length, node;
    if (iterations === void 0)
      iterations = 1;
    for (var k2 = 0; k2 < iterations; ++k2) {
      alpha += (alphaTarget - alpha) * alphaDecay;
      forces.forEach(function(force) {
        force(alpha);
      });
      for (i2 = 0; i2 < n2; ++i2) {
        node = nodes[i2];
        if (node.fx == null)
          node.x += node.vx *= velocityDecay;
        else
          node.x = node.fx, node.vx = 0;
        if (nDim > 1) {
          if (node.fy == null)
            node.y += node.vy *= velocityDecay;
          else
            node.y = node.fy, node.vy = 0;
        }
        if (nDim > 2) {
          if (node.fz == null)
            node.z += node.vz *= velocityDecay;
          else
            node.z = node.fz, node.vz = 0;
        }
      }
    }
    return simulation;
  }
  function initializeNodes() {
    for (var i2 = 0, n2 = nodes.length, node; i2 < n2; ++i2) {
      node = nodes[i2], node.index = i2;
      if (node.fx != null)
        node.x = node.fx;
      if (node.fy != null)
        node.y = node.fy;
      if (node.fz != null)
        node.z = node.fz;
      if (isNaN(node.x) || nDim > 1 && isNaN(node.y) || nDim > 2 && isNaN(node.z)) {
        var radius = initialRadius * (nDim > 2 ? Math.cbrt(0.5 + i2) : nDim > 1 ? Math.sqrt(0.5 + i2) : i2), rollAngle = i2 * initialAngleRoll, yawAngle = i2 * initialAngleYaw;
        if (nDim === 1) {
          node.x = radius;
        } else if (nDim === 2) {
          node.x = radius * Math.cos(rollAngle);
          node.y = radius * Math.sin(rollAngle);
        } else {
          node.x = radius * Math.sin(rollAngle) * Math.cos(yawAngle);
          node.y = radius * Math.cos(rollAngle);
          node.z = radius * Math.sin(rollAngle) * Math.sin(yawAngle);
        }
      }
      if (isNaN(node.vx) || nDim > 1 && isNaN(node.vy) || nDim > 2 && isNaN(node.vz)) {
        node.vx = 0;
        if (nDim > 1) {
          node.vy = 0;
        }
        if (nDim > 2) {
          node.vz = 0;
        }
      }
    }
  }
  function initializeForce(force) {
    if (force.initialize)
      force.initialize(nodes, random, nDim);
    return force;
  }
  initializeNodes();
  return simulation = {
    tick,
    restart: function() {
      return stepper.restart(step), simulation;
    },
    stop: function() {
      return stepper.stop(), simulation;
    },
    numDimensions: function(_2) {
      return arguments.length ? (nDim = Math.min(MAX_DIMENSIONS, Math.max(1, Math.round(_2))), forces.forEach(initializeForce), simulation) : nDim;
    },
    nodes: function(_2) {
      return arguments.length ? (nodes = _2, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
    },
    alpha: function(_2) {
      return arguments.length ? (alpha = +_2, simulation) : alpha;
    },
    alphaMin: function(_2) {
      return arguments.length ? (alphaMin = +_2, simulation) : alphaMin;
    },
    alphaDecay: function(_2) {
      return arguments.length ? (alphaDecay = +_2, simulation) : +alphaDecay;
    },
    alphaTarget: function(_2) {
      return arguments.length ? (alphaTarget = +_2, simulation) : alphaTarget;
    },
    velocityDecay: function(_2) {
      return arguments.length ? (velocityDecay = 1 - _2, simulation) : 1 - velocityDecay;
    },
    randomSource: function(_2) {
      return arguments.length ? (random = _2, forces.forEach(initializeForce), simulation) : random;
    },
    force: function(name, _2) {
      return arguments.length > 1 ? (_2 == null ? forces.delete(name) : forces.set(name, initializeForce(_2)), simulation) : forces.get(name);
    },
    find: function() {
      var args = Array.prototype.slice.call(arguments);
      var x3 = args.shift() || 0, y3 = (nDim > 1 ? args.shift() : null) || 0, z3 = (nDim > 2 ? args.shift() : null) || 0, radius = args.shift() || Infinity;
      var i2 = 0, n2 = nodes.length, dx, dy, dz, d2, node, closest;
      radius *= radius;
      for (i2 = 0; i2 < n2; ++i2) {
        node = nodes[i2];
        dx = x3 - node.x;
        dy = y3 - (node.y || 0);
        dz = z3 - (node.z || 0);
        d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < radius)
          closest = node, radius = d2;
      }
      return closest;
    },
    on: function(name, _2) {
      return arguments.length > 1 ? (event.on(name, _2), simulation) : event.on(name);
    }
  };
}
var MAX_DIMENSIONS, initialRadius, initialAngleRoll, initialAngleYaw;
var init_simulation = __esm({
  "node_modules/d3-force-3d/src/simulation.js"() {
    init_src2();
    init_src6();
    init_lcg();
    MAX_DIMENSIONS = 3;
    initialRadius = 10;
    initialAngleRoll = Math.PI * (3 - Math.sqrt(5));
    initialAngleYaw = Math.PI * 20 / (9 + Math.sqrt(221));
  }
});

// node_modules/d3-force-3d/src/manyBody.js
function manyBody_default() {
  var nodes, nDim, node, random, alpha, strength = constant_default5(-30), strengths, distanceMin2 = 1, distanceMax2 = Infinity, theta2 = 0.81;
  function force(_2) {
    var i2, n2 = nodes.length, tree = (nDim === 1 ? binarytree(nodes, x2) : nDim === 2 ? quadtree(nodes, x2, y2) : nDim === 3 ? octree(nodes, x2, y2, z2) : null).visitAfter(accumulate);
    for (alpha = _2, i2 = 0; i2 < n2; ++i2)
      node = nodes[i2], tree.visit(apply);
  }
  function initialize() {
    if (!nodes)
      return;
    var i2, n2 = nodes.length, node2;
    strengths = new Array(n2);
    for (i2 = 0; i2 < n2; ++i2)
      node2 = nodes[i2], strengths[node2.index] = +strength(node2, i2, nodes);
  }
  function accumulate(treeNode) {
    var strength2 = 0, q2, c3, weight = 0, x3, y3, z3, i2;
    var numChildren = treeNode.length;
    if (numChildren) {
      for (x3 = y3 = z3 = i2 = 0; i2 < numChildren; ++i2) {
        if ((q2 = treeNode[i2]) && (c3 = Math.abs(q2.value))) {
          strength2 += q2.value, weight += c3, x3 += c3 * (q2.x || 0), y3 += c3 * (q2.y || 0), z3 += c3 * (q2.z || 0);
        }
      }
      strength2 *= Math.sqrt(4 / numChildren);
      treeNode.x = x3 / weight;
      if (nDim > 1) {
        treeNode.y = y3 / weight;
      }
      if (nDim > 2) {
        treeNode.z = z3 / weight;
      }
    } else {
      q2 = treeNode;
      q2.x = q2.data.x;
      if (nDim > 1) {
        q2.y = q2.data.y;
      }
      if (nDim > 2) {
        q2.z = q2.data.z;
      }
      do
        strength2 += strengths[q2.data.index];
      while (q2 = q2.next);
    }
    treeNode.value = strength2;
  }
  function apply(treeNode, x1, arg1, arg2, arg3) {
    if (!treeNode.value)
      return true;
    var x22 = [arg1, arg2, arg3][nDim - 1];
    var x3 = treeNode.x - node.x, y3 = nDim > 1 ? treeNode.y - node.y : 0, z3 = nDim > 2 ? treeNode.z - node.z : 0, w2 = x22 - x1, l2 = x3 * x3 + y3 * y3 + z3 * z3;
    if (w2 * w2 / theta2 < l2) {
      if (l2 < distanceMax2) {
        if (x3 === 0)
          x3 = jiggle_default(random), l2 += x3 * x3;
        if (nDim > 1 && y3 === 0)
          y3 = jiggle_default(random), l2 += y3 * y3;
        if (nDim > 2 && z3 === 0)
          z3 = jiggle_default(random), l2 += z3 * z3;
        if (l2 < distanceMin2)
          l2 = Math.sqrt(distanceMin2 * l2);
        node.vx += x3 * treeNode.value * alpha / l2;
        if (nDim > 1) {
          node.vy += y3 * treeNode.value * alpha / l2;
        }
        if (nDim > 2) {
          node.vz += z3 * treeNode.value * alpha / l2;
        }
      }
      return true;
    } else if (treeNode.length || l2 >= distanceMax2)
      return;
    if (treeNode.data !== node || treeNode.next) {
      if (x3 === 0)
        x3 = jiggle_default(random), l2 += x3 * x3;
      if (nDim > 1 && y3 === 0)
        y3 = jiggle_default(random), l2 += y3 * y3;
      if (nDim > 2 && z3 === 0)
        z3 = jiggle_default(random), l2 += z3 * z3;
      if (l2 < distanceMin2)
        l2 = Math.sqrt(distanceMin2 * l2);
    }
    do
      if (treeNode.data !== node) {
        w2 = strengths[treeNode.data.index] * alpha / l2;
        node.vx += x3 * w2;
        if (nDim > 1) {
          node.vy += y3 * w2;
        }
        if (nDim > 2) {
          node.vz += z3 * w2;
        }
      }
    while (treeNode = treeNode.next);
  }
  force.initialize = function(_nodes, ...args) {
    nodes = _nodes;
    random = args.find((arg) => typeof arg === "function") || Math.random;
    nDim = args.find((arg) => [1, 2, 3].includes(arg)) || 2;
    initialize();
  };
  force.strength = function(_2) {
    return arguments.length ? (strength = typeof _2 === "function" ? _2 : constant_default5(+_2), initialize(), force) : strength;
  };
  force.distanceMin = function(_2) {
    return arguments.length ? (distanceMin2 = _2 * _2, force) : Math.sqrt(distanceMin2);
  };
  force.distanceMax = function(_2) {
    return arguments.length ? (distanceMax2 = _2 * _2, force) : Math.sqrt(distanceMax2);
  };
  force.theta = function(_2) {
    return arguments.length ? (theta2 = _2 * _2, force) : Math.sqrt(theta2);
  };
  return force;
}
var init_manyBody = __esm({
  "node_modules/d3-force-3d/src/manyBody.js"() {
    init_src12();
    init_src13();
    init_src14();
    init_constant5();
    init_jiggle();
    init_simulation();
  }
});

// node_modules/d3-force-3d/src/radial.js
function radial_default(radius, x3, y3, z3) {
  var nodes, nDim, strength = constant_default5(0.1), strengths, radiuses;
  if (typeof radius !== "function")
    radius = constant_default5(+radius);
  if (x3 == null)
    x3 = 0;
  if (y3 == null)
    y3 = 0;
  if (z3 == null)
    z3 = 0;
  function force(alpha) {
    for (var i2 = 0, n2 = nodes.length; i2 < n2; ++i2) {
      var node = nodes[i2], dx = node.x - x3 || 1e-6, dy = (node.y || 0) - y3 || 1e-6, dz = (node.z || 0) - z3 || 1e-6, r2 = Math.sqrt(dx * dx + dy * dy + dz * dz), k2 = (radiuses[i2] - r2) * strengths[i2] * alpha / r2;
      node.vx += dx * k2;
      if (nDim > 1) {
        node.vy += dy * k2;
      }
      if (nDim > 2) {
        node.vz += dz * k2;
      }
    }
  }
  function initialize() {
    if (!nodes)
      return;
    var i2, n2 = nodes.length;
    strengths = new Array(n2);
    radiuses = new Array(n2);
    for (i2 = 0; i2 < n2; ++i2) {
      radiuses[i2] = +radius(nodes[i2], i2, nodes);
      strengths[i2] = isNaN(radiuses[i2]) ? 0 : +strength(nodes[i2], i2, nodes);
    }
  }
  force.initialize = function(initNodes, ...args) {
    nodes = initNodes;
    nDim = args.find((arg) => [1, 2, 3].includes(arg)) || 2;
    initialize();
  };
  force.strength = function(_2) {
    return arguments.length ? (strength = typeof _2 === "function" ? _2 : constant_default5(+_2), initialize(), force) : strength;
  };
  force.radius = function(_2) {
    return arguments.length ? (radius = typeof _2 === "function" ? _2 : constant_default5(+_2), initialize(), force) : radius;
  };
  force.x = function(_2) {
    return arguments.length ? (x3 = +_2, force) : x3;
  };
  force.y = function(_2) {
    return arguments.length ? (y3 = +_2, force) : y3;
  };
  force.z = function(_2) {
    return arguments.length ? (z3 = +_2, force) : z3;
  };
  return force;
}
var init_radial = __esm({
  "node_modules/d3-force-3d/src/radial.js"() {
    init_constant5();
  }
});

// node_modules/d3-force-3d/src/index.js
var init_src15 = __esm({
  "node_modules/d3-force-3d/src/index.js"() {
    init_center();
    init_link();
    init_manyBody();
    init_radial();
    init_simulation();
  }
});

// node_modules/bezier-js/src/utils.js
function crt(v2) {
  return v2 < 0 ? -pow(-v2, 1 / 3) : pow(v2, 1 / 3);
}
var abs, cos, sin, acos, atan2, sqrt, pow, pi, tau, quart, epsilon, nMax, nMin, ZERO, utils;
var init_utils = __esm({
  "node_modules/bezier-js/src/utils.js"() {
    init_bezier();
    ({ abs, cos, sin, acos, atan2, sqrt, pow } = Math);
    pi = Math.PI;
    tau = 2 * pi;
    quart = pi / 2;
    epsilon = 1e-6;
    nMax = Number.MAX_SAFE_INTEGER || 9007199254740991;
    nMin = Number.MIN_SAFE_INTEGER || -9007199254740991;
    ZERO = { x: 0, y: 0, z: 0 };
    utils = {
      Tvalues: [
        -0.06405689286260563,
        0.06405689286260563,
        -0.1911188674736163,
        0.1911188674736163,
        -0.3150426796961634,
        0.3150426796961634,
        -0.4337935076260451,
        0.4337935076260451,
        -0.5454214713888396,
        0.5454214713888396,
        -0.6480936519369755,
        0.6480936519369755,
        -0.7401241915785544,
        0.7401241915785544,
        -0.820001985973903,
        0.820001985973903,
        -0.8864155270044011,
        0.8864155270044011,
        -0.9382745520027328,
        0.9382745520027328,
        -0.9747285559713095,
        0.9747285559713095,
        -0.9951872199970213,
        0.9951872199970213
      ],
      Cvalues: [
        0.12793819534675216,
        0.12793819534675216,
        0.1258374563468283,
        0.1258374563468283,
        0.12167047292780339,
        0.12167047292780339,
        0.1155056680537256,
        0.1155056680537256,
        0.10744427011596563,
        0.10744427011596563,
        0.09761865210411388,
        0.09761865210411388,
        0.08619016153195327,
        0.08619016153195327,
        0.0733464814110803,
        0.0733464814110803,
        0.05929858491543678,
        0.05929858491543678,
        0.04427743881741981,
        0.04427743881741981,
        0.028531388628933663,
        0.028531388628933663,
        0.0123412297999872,
        0.0123412297999872
      ],
      arcfn: function(t3, derivativeFn) {
        const d2 = derivativeFn(t3);
        let l2 = d2.x * d2.x + d2.y * d2.y;
        if (typeof d2.z !== "undefined") {
          l2 += d2.z * d2.z;
        }
        return sqrt(l2);
      },
      compute: function(t3, points, _3d) {
        if (t3 === 0) {
          points[0].t = 0;
          return points[0];
        }
        const order = points.length - 1;
        if (t3 === 1) {
          points[order].t = 1;
          return points[order];
        }
        const mt = 1 - t3;
        let p2 = points;
        if (order === 0) {
          points[0].t = t3;
          return points[0];
        }
        if (order === 1) {
          const ret = {
            x: mt * p2[0].x + t3 * p2[1].x,
            y: mt * p2[0].y + t3 * p2[1].y,
            t: t3
          };
          if (_3d) {
            ret.z = mt * p2[0].z + t3 * p2[1].z;
          }
          return ret;
        }
        if (order < 4) {
          let mt2 = mt * mt, t22 = t3 * t3, a3, b, c3, d2 = 0;
          if (order === 2) {
            p2 = [p2[0], p2[1], p2[2], ZERO];
            a3 = mt2;
            b = mt * t3 * 2;
            c3 = t22;
          } else if (order === 3) {
            a3 = mt2 * mt;
            b = mt2 * t3 * 3;
            c3 = mt * t22 * 3;
            d2 = t3 * t22;
          }
          const ret = {
            x: a3 * p2[0].x + b * p2[1].x + c3 * p2[2].x + d2 * p2[3].x,
            y: a3 * p2[0].y + b * p2[1].y + c3 * p2[2].y + d2 * p2[3].y,
            t: t3
          };
          if (_3d) {
            ret.z = a3 * p2[0].z + b * p2[1].z + c3 * p2[2].z + d2 * p2[3].z;
          }
          return ret;
        }
        const dCpts = JSON.parse(JSON.stringify(points));
        while (dCpts.length > 1) {
          for (let i2 = 0; i2 < dCpts.length - 1; i2++) {
            dCpts[i2] = {
              x: dCpts[i2].x + (dCpts[i2 + 1].x - dCpts[i2].x) * t3,
              y: dCpts[i2].y + (dCpts[i2 + 1].y - dCpts[i2].y) * t3
            };
            if (typeof dCpts[i2].z !== "undefined") {
              dCpts[i2].z = dCpts[i2].z + (dCpts[i2 + 1].z - dCpts[i2].z) * t3;
            }
          }
          dCpts.splice(dCpts.length - 1, 1);
        }
        dCpts[0].t = t3;
        return dCpts[0];
      },
      computeWithRatios: function(t3, points, ratios, _3d) {
        const mt = 1 - t3, r2 = ratios, p2 = points;
        let f1 = r2[0], f2 = r2[1], f3 = r2[2], f4 = r2[3], d2;
        f1 *= mt;
        f2 *= t3;
        if (p2.length === 2) {
          d2 = f1 + f2;
          return {
            x: (f1 * p2[0].x + f2 * p2[1].x) / d2,
            y: (f1 * p2[0].y + f2 * p2[1].y) / d2,
            z: !_3d ? false : (f1 * p2[0].z + f2 * p2[1].z) / d2,
            t: t3
          };
        }
        f1 *= mt;
        f2 *= 2 * mt;
        f3 *= t3 * t3;
        if (p2.length === 3) {
          d2 = f1 + f2 + f3;
          return {
            x: (f1 * p2[0].x + f2 * p2[1].x + f3 * p2[2].x) / d2,
            y: (f1 * p2[0].y + f2 * p2[1].y + f3 * p2[2].y) / d2,
            z: !_3d ? false : (f1 * p2[0].z + f2 * p2[1].z + f3 * p2[2].z) / d2,
            t: t3
          };
        }
        f1 *= mt;
        f2 *= 1.5 * mt;
        f3 *= 3 * mt;
        f4 *= t3 * t3 * t3;
        if (p2.length === 4) {
          d2 = f1 + f2 + f3 + f4;
          return {
            x: (f1 * p2[0].x + f2 * p2[1].x + f3 * p2[2].x + f4 * p2[3].x) / d2,
            y: (f1 * p2[0].y + f2 * p2[1].y + f3 * p2[2].y + f4 * p2[3].y) / d2,
            z: !_3d ? false : (f1 * p2[0].z + f2 * p2[1].z + f3 * p2[2].z + f4 * p2[3].z) / d2,
            t: t3
          };
        }
      },
      derive: function(points, _3d) {
        const dpoints = [];
        for (let p2 = points, d2 = p2.length, c3 = d2 - 1; d2 > 1; d2--, c3--) {
          const list = [];
          for (let j2 = 0, dpt; j2 < c3; j2++) {
            dpt = {
              x: c3 * (p2[j2 + 1].x - p2[j2].x),
              y: c3 * (p2[j2 + 1].y - p2[j2].y)
            };
            if (_3d) {
              dpt.z = c3 * (p2[j2 + 1].z - p2[j2].z);
            }
            list.push(dpt);
          }
          dpoints.push(list);
          p2 = list;
        }
        return dpoints;
      },
      between: function(v2, m3, M2) {
        return m3 <= v2 && v2 <= M2 || utils.approximately(v2, m3) || utils.approximately(v2, M2);
      },
      approximately: function(a3, b, precision) {
        return abs(a3 - b) <= (precision || epsilon);
      },
      length: function(derivativeFn) {
        const z3 = 0.5, len = utils.Tvalues.length;
        let sum2 = 0;
        for (let i2 = 0, t3; i2 < len; i2++) {
          t3 = z3 * utils.Tvalues[i2] + z3;
          sum2 += utils.Cvalues[i2] * utils.arcfn(t3, derivativeFn);
        }
        return z3 * sum2;
      },
      map: function(v2, ds, de, ts, te) {
        const d1 = de - ds, d2 = te - ts, v22 = v2 - ds, r2 = v22 / d1;
        return ts + d2 * r2;
      },
      lerp: function(r2, v1, v2) {
        const ret = {
          x: v1.x + r2 * (v2.x - v1.x),
          y: v1.y + r2 * (v2.y - v1.y)
        };
        if (v1.z !== void 0 && v2.z !== void 0) {
          ret.z = v1.z + r2 * (v2.z - v1.z);
        }
        return ret;
      },
      pointToString: function(p2) {
        let s2 = p2.x + "/" + p2.y;
        if (typeof p2.z !== "undefined") {
          s2 += "/" + p2.z;
        }
        return s2;
      },
      pointsToString: function(points) {
        return "[" + points.map(utils.pointToString).join(", ") + "]";
      },
      copy: function(obj) {
        return JSON.parse(JSON.stringify(obj));
      },
      angle: function(o2, v1, v2) {
        const dx1 = v1.x - o2.x, dy1 = v1.y - o2.y, dx2 = v2.x - o2.x, dy2 = v2.y - o2.y, cross = dx1 * dy2 - dy1 * dx2, dot = dx1 * dx2 + dy1 * dy2;
        return atan2(cross, dot);
      },
      round: function(v2, d2) {
        const s2 = "" + v2;
        const pos = s2.indexOf(".");
        return parseFloat(s2.substring(0, pos + 1 + d2));
      },
      dist: function(p1, p2) {
        const dx = p1.x - p2.x, dy = p1.y - p2.y;
        return sqrt(dx * dx + dy * dy);
      },
      closest: function(LUT, point) {
        let mdist = pow(2, 63), mpos, d2;
        LUT.forEach(function(p2, idx) {
          d2 = utils.dist(point, p2);
          if (d2 < mdist) {
            mdist = d2;
            mpos = idx;
          }
        });
        return { mdist, mpos };
      },
      abcratio: function(t3, n2) {
        if (n2 !== 2 && n2 !== 3) {
          return false;
        }
        if (typeof t3 === "undefined") {
          t3 = 0.5;
        } else if (t3 === 0 || t3 === 1) {
          return t3;
        }
        const bottom = pow(t3, n2) + pow(1 - t3, n2), top = bottom - 1;
        return abs(top / bottom);
      },
      projectionratio: function(t3, n2) {
        if (n2 !== 2 && n2 !== 3) {
          return false;
        }
        if (typeof t3 === "undefined") {
          t3 = 0.5;
        } else if (t3 === 0 || t3 === 1) {
          return t3;
        }
        const top = pow(1 - t3, n2), bottom = pow(t3, n2) + top;
        return top / bottom;
      },
      lli8: function(x1, y1, x22, y22, x3, y3, x4, y4) {
        const nx = (x1 * y22 - y1 * x22) * (x3 - x4) - (x1 - x22) * (x3 * y4 - y3 * x4), ny = (x1 * y22 - y1 * x22) * (y3 - y4) - (y1 - y22) * (x3 * y4 - y3 * x4), d2 = (x1 - x22) * (y3 - y4) - (y1 - y22) * (x3 - x4);
        if (d2 == 0) {
          return false;
        }
        return { x: nx / d2, y: ny / d2 };
      },
      lli4: function(p1, p2, p3, p4) {
        const x1 = p1.x, y1 = p1.y, x22 = p2.x, y22 = p2.y, x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;
        return utils.lli8(x1, y1, x22, y22, x3, y3, x4, y4);
      },
      lli: function(v1, v2) {
        return utils.lli4(v1, v1.c, v2, v2.c);
      },
      makeline: function(p1, p2) {
        return new Bezier(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2, p2.x, p2.y);
      },
      findbbox: function(sections) {
        let mx = nMax, my = nMax, MX = nMin, MY = nMin;
        sections.forEach(function(s2) {
          const bbox = s2.bbox();
          if (mx > bbox.x.min)
            mx = bbox.x.min;
          if (my > bbox.y.min)
            my = bbox.y.min;
          if (MX < bbox.x.max)
            MX = bbox.x.max;
          if (MY < bbox.y.max)
            MY = bbox.y.max;
        });
        return {
          x: { min: mx, mid: (mx + MX) / 2, max: MX, size: MX - mx },
          y: { min: my, mid: (my + MY) / 2, max: MY, size: MY - my }
        };
      },
      shapeintersections: function(s1, bbox1, s2, bbox2, curveIntersectionThreshold) {
        if (!utils.bboxoverlap(bbox1, bbox2))
          return [];
        const intersections = [];
        const a1 = [s1.startcap, s1.forward, s1.back, s1.endcap];
        const a22 = [s2.startcap, s2.forward, s2.back, s2.endcap];
        a1.forEach(function(l1) {
          if (l1.virtual)
            return;
          a22.forEach(function(l2) {
            if (l2.virtual)
              return;
            const iss = l1.intersects(l2, curveIntersectionThreshold);
            if (iss.length > 0) {
              iss.c1 = l1;
              iss.c2 = l2;
              iss.s1 = s1;
              iss.s2 = s2;
              intersections.push(iss);
            }
          });
        });
        return intersections;
      },
      makeshape: function(forward, back, curveIntersectionThreshold) {
        const bpl = back.points.length;
        const fpl = forward.points.length;
        const start2 = utils.makeline(back.points[bpl - 1], forward.points[0]);
        const end = utils.makeline(forward.points[fpl - 1], back.points[0]);
        const shape = {
          startcap: start2,
          forward,
          back,
          endcap: end,
          bbox: utils.findbbox([start2, forward, back, end])
        };
        shape.intersections = function(s2) {
          return utils.shapeintersections(shape, shape.bbox, s2, s2.bbox, curveIntersectionThreshold);
        };
        return shape;
      },
      getminmax: function(curve, d2, list) {
        if (!list)
          return { min: 0, max: 0 };
        let min3 = nMax, max3 = nMin, t3, c3;
        if (list.indexOf(0) === -1) {
          list = [0].concat(list);
        }
        if (list.indexOf(1) === -1) {
          list.push(1);
        }
        for (let i2 = 0, len = list.length; i2 < len; i2++) {
          t3 = list[i2];
          c3 = curve.get(t3);
          if (c3[d2] < min3) {
            min3 = c3[d2];
          }
          if (c3[d2] > max3) {
            max3 = c3[d2];
          }
        }
        return { min: min3, mid: (min3 + max3) / 2, max: max3, size: max3 - min3 };
      },
      align: function(points, line) {
        const tx = line.p1.x, ty = line.p1.y, a3 = -atan2(line.p2.y - ty, line.p2.x - tx), d2 = function(v2) {
          return {
            x: (v2.x - tx) * cos(a3) - (v2.y - ty) * sin(a3),
            y: (v2.x - tx) * sin(a3) + (v2.y - ty) * cos(a3)
          };
        };
        return points.map(d2);
      },
      roots: function(points, line) {
        line = line || { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } };
        const order = points.length - 1;
        const aligned = utils.align(points, line);
        const reduce = function(t3) {
          return 0 <= t3 && t3 <= 1;
        };
        if (order === 2) {
          const a4 = aligned[0].y, b2 = aligned[1].y, c4 = aligned[2].y, d3 = a4 - 2 * b2 + c4;
          if (d3 !== 0) {
            const m1 = -sqrt(b2 * b2 - a4 * c4), m22 = -a4 + b2, v12 = -(m1 + m22) / d3, v2 = -(-m1 + m22) / d3;
            return [v12, v2].filter(reduce);
          } else if (b2 !== c4 && d3 === 0) {
            return [(2 * b2 - c4) / (2 * b2 - 2 * c4)].filter(reduce);
          }
          return [];
        }
        const pa = aligned[0].y, pb = aligned[1].y, pc = aligned[2].y, pd = aligned[3].y;
        let d2 = -pa + 3 * pb - 3 * pc + pd, a3 = 3 * pa - 6 * pb + 3 * pc, b = -3 * pa + 3 * pb, c3 = pa;
        if (utils.approximately(d2, 0)) {
          if (utils.approximately(a3, 0)) {
            if (utils.approximately(b, 0)) {
              return [];
            }
            return [-c3 / b].filter(reduce);
          }
          const q3 = sqrt(b * b - 4 * a3 * c3), a22 = 2 * a3;
          return [(q3 - b) / a22, (-b - q3) / a22].filter(reduce);
        }
        a3 /= d2;
        b /= d2;
        c3 /= d2;
        const p2 = (3 * b - a3 * a3) / 3, p3 = p2 / 3, q2 = (2 * a3 * a3 * a3 - 9 * a3 * b + 27 * c3) / 27, q22 = q2 / 2, discriminant = q22 * q22 + p3 * p3 * p3;
        let u1, v1, x1, x22, x3;
        if (discriminant < 0) {
          const mp3 = -p2 / 3, mp33 = mp3 * mp3 * mp3, r2 = sqrt(mp33), t3 = -q2 / (2 * r2), cosphi = t3 < -1 ? -1 : t3 > 1 ? 1 : t3, phi = acos(cosphi), crtr = crt(r2), t1 = 2 * crtr;
          x1 = t1 * cos(phi / 3) - a3 / 3;
          x22 = t1 * cos((phi + tau) / 3) - a3 / 3;
          x3 = t1 * cos((phi + 2 * tau) / 3) - a3 / 3;
          return [x1, x22, x3].filter(reduce);
        } else if (discriminant === 0) {
          u1 = q22 < 0 ? crt(-q22) : -crt(q22);
          x1 = 2 * u1 - a3 / 3;
          x22 = -u1 - a3 / 3;
          return [x1, x22].filter(reduce);
        } else {
          const sd = sqrt(discriminant);
          u1 = crt(-q22 + sd);
          v1 = crt(q22 + sd);
          return [u1 - v1 - a3 / 3].filter(reduce);
        }
      },
      droots: function(p2) {
        if (p2.length === 3) {
          const a3 = p2[0], b = p2[1], c3 = p2[2], d2 = a3 - 2 * b + c3;
          if (d2 !== 0) {
            const m1 = -sqrt(b * b - a3 * c3), m22 = -a3 + b, v1 = -(m1 + m22) / d2, v2 = -(-m1 + m22) / d2;
            return [v1, v2];
          } else if (b !== c3 && d2 === 0) {
            return [(2 * b - c3) / (2 * (b - c3))];
          }
          return [];
        }
        if (p2.length === 2) {
          const a3 = p2[0], b = p2[1];
          if (a3 !== b) {
            return [a3 / (a3 - b)];
          }
          return [];
        }
        return [];
      },
      curvature: function(t3, d1, d2, _3d, kOnly) {
        let num, dnm, adk, dk, k2 = 0, r2 = 0;
        const d3 = utils.compute(t3, d1);
        const dd = utils.compute(t3, d2);
        const qdsum = d3.x * d3.x + d3.y * d3.y;
        if (_3d) {
          num = sqrt(pow(d3.y * dd.z - dd.y * d3.z, 2) + pow(d3.z * dd.x - dd.z * d3.x, 2) + pow(d3.x * dd.y - dd.x * d3.y, 2));
          dnm = pow(qdsum + d3.z * d3.z, 3 / 2);
        } else {
          num = d3.x * dd.y - d3.y * dd.x;
          dnm = pow(qdsum, 3 / 2);
        }
        if (num === 0 || dnm === 0) {
          return { k: 0, r: 0 };
        }
        k2 = num / dnm;
        r2 = dnm / num;
        if (!kOnly) {
          const pk = utils.curvature(t3 - 1e-3, d1, d2, _3d, true).k;
          const nk = utils.curvature(t3 + 1e-3, d1, d2, _3d, true).k;
          dk = (nk - k2 + (k2 - pk)) / 2;
          adk = (abs(nk - k2) + abs(k2 - pk)) / 2;
        }
        return { k: k2, r: r2, dk, adk };
      },
      inflections: function(points) {
        if (points.length < 4)
          return [];
        const p2 = utils.align(points, { p1: points[0], p2: points.slice(-1)[0] }), a3 = p2[2].x * p2[1].y, b = p2[3].x * p2[1].y, c3 = p2[1].x * p2[2].y, d2 = p2[3].x * p2[2].y, v1 = 18 * (-3 * a3 + 2 * b + 3 * c3 - d2), v2 = 18 * (3 * a3 - b - 3 * c3), v3 = 18 * (c3 - a3);
        if (utils.approximately(v1, 0)) {
          if (!utils.approximately(v2, 0)) {
            let t3 = -v3 / v2;
            if (0 <= t3 && t3 <= 1)
              return [t3];
          }
          return [];
        }
        const d22 = 2 * v1;
        if (utils.approximately(d22, 0))
          return [];
        const trm = v2 * v2 - 4 * v1 * v3;
        if (trm < 0)
          return [];
        const sq = Math.sqrt(trm);
        return [(sq - v2) / d22, -(v2 + sq) / d22].filter(function(r2) {
          return 0 <= r2 && r2 <= 1;
        });
      },
      bboxoverlap: function(b1, b2) {
        const dims = ["x", "y"], len = dims.length;
        for (let i2 = 0, dim, l2, t3, d2; i2 < len; i2++) {
          dim = dims[i2];
          l2 = b1[dim].mid;
          t3 = b2[dim].mid;
          d2 = (b1[dim].size + b2[dim].size) / 2;
          if (abs(l2 - t3) >= d2)
            return false;
        }
        return true;
      },
      expandbox: function(bbox, _bbox) {
        if (_bbox.x.min < bbox.x.min) {
          bbox.x.min = _bbox.x.min;
        }
        if (_bbox.y.min < bbox.y.min) {
          bbox.y.min = _bbox.y.min;
        }
        if (_bbox.z && _bbox.z.min < bbox.z.min) {
          bbox.z.min = _bbox.z.min;
        }
        if (_bbox.x.max > bbox.x.max) {
          bbox.x.max = _bbox.x.max;
        }
        if (_bbox.y.max > bbox.y.max) {
          bbox.y.max = _bbox.y.max;
        }
        if (_bbox.z && _bbox.z.max > bbox.z.max) {
          bbox.z.max = _bbox.z.max;
        }
        bbox.x.mid = (bbox.x.min + bbox.x.max) / 2;
        bbox.y.mid = (bbox.y.min + bbox.y.max) / 2;
        if (bbox.z) {
          bbox.z.mid = (bbox.z.min + bbox.z.max) / 2;
        }
        bbox.x.size = bbox.x.max - bbox.x.min;
        bbox.y.size = bbox.y.max - bbox.y.min;
        if (bbox.z) {
          bbox.z.size = bbox.z.max - bbox.z.min;
        }
      },
      pairiteration: function(c1, c22, curveIntersectionThreshold) {
        const c1b = c1.bbox(), c2b = c22.bbox(), r2 = 1e5, threshold = curveIntersectionThreshold || 0.5;
        if (c1b.x.size + c1b.y.size < threshold && c2b.x.size + c2b.y.size < threshold) {
          return [
            (r2 * (c1._t1 + c1._t2) / 2 | 0) / r2 + "/" + (r2 * (c22._t1 + c22._t2) / 2 | 0) / r2
          ];
        }
        let cc1 = c1.split(0.5), cc2 = c22.split(0.5), pairs = [
          { left: cc1.left, right: cc2.left },
          { left: cc1.left, right: cc2.right },
          { left: cc1.right, right: cc2.right },
          { left: cc1.right, right: cc2.left }
        ];
        pairs = pairs.filter(function(pair) {
          return utils.bboxoverlap(pair.left.bbox(), pair.right.bbox());
        });
        let results = [];
        if (pairs.length === 0)
          return results;
        pairs.forEach(function(pair) {
          results = results.concat(utils.pairiteration(pair.left, pair.right, threshold));
        });
        results = results.filter(function(v2, i2) {
          return results.indexOf(v2) === i2;
        });
        return results;
      },
      getccenter: function(p1, p2, p3) {
        const dx1 = p2.x - p1.x, dy1 = p2.y - p1.y, dx2 = p3.x - p2.x, dy2 = p3.y - p2.y, dx1p = dx1 * cos(quart) - dy1 * sin(quart), dy1p = dx1 * sin(quart) + dy1 * cos(quart), dx2p = dx2 * cos(quart) - dy2 * sin(quart), dy2p = dx2 * sin(quart) + dy2 * cos(quart), mx1 = (p1.x + p2.x) / 2, my1 = (p1.y + p2.y) / 2, mx2 = (p2.x + p3.x) / 2, my2 = (p2.y + p3.y) / 2, mx1n = mx1 + dx1p, my1n = my1 + dy1p, mx2n = mx2 + dx2p, my2n = my2 + dy2p, arc = utils.lli8(mx1, my1, mx1n, my1n, mx2, my2, mx2n, my2n), r2 = utils.dist(arc, p1);
        let s2 = atan2(p1.y - arc.y, p1.x - arc.x), m3 = atan2(p2.y - arc.y, p2.x - arc.x), e2 = atan2(p3.y - arc.y, p3.x - arc.x), _2;
        if (s2 < e2) {
          if (s2 > m3 || m3 > e2) {
            s2 += tau;
          }
          if (s2 > e2) {
            _2 = e2;
            e2 = s2;
            s2 = _2;
          }
        } else {
          if (e2 < m3 && m3 < s2) {
            _2 = e2;
            e2 = s2;
            s2 = _2;
          } else {
            e2 += tau;
          }
        }
        arc.s = s2;
        arc.e = e2;
        arc.r = r2;
        return arc;
      },
      numberSort: function(a3, b) {
        return a3 - b;
      }
    };
  }
});

// node_modules/bezier-js/src/poly-bezier.js
var PolyBezier;
var init_poly_bezier = __esm({
  "node_modules/bezier-js/src/poly-bezier.js"() {
    init_utils();
    PolyBezier = class {
      constructor(curves) {
        this.curves = [];
        this._3d = false;
        if (!!curves) {
          this.curves = curves;
          this._3d = this.curves[0]._3d;
        }
      }
      valueOf() {
        return this.toString();
      }
      toString() {
        return "[" + this.curves.map(function(curve) {
          return utils.pointsToString(curve.points);
        }).join(", ") + "]";
      }
      addCurve(curve) {
        this.curves.push(curve);
        this._3d = this._3d || curve._3d;
      }
      length() {
        return this.curves.map(function(v2) {
          return v2.length();
        }).reduce(function(a3, b) {
          return a3 + b;
        });
      }
      curve(idx) {
        return this.curves[idx];
      }
      bbox() {
        const c3 = this.curves;
        var bbox = c3[0].bbox();
        for (var i2 = 1; i2 < c3.length; i2++) {
          utils.expandbox(bbox, c3[i2].bbox());
        }
        return bbox;
      }
      offset(d2) {
        const offset = [];
        this.curves.forEach(function(v2) {
          offset.push(...v2.offset(d2));
        });
        return new PolyBezier(offset);
      }
    };
  }
});

// node_modules/bezier-js/src/bezier.js
var abs2, min2, max2, cos2, sin2, acos2, sqrt2, pi2, Bezier;
var init_bezier = __esm({
  "node_modules/bezier-js/src/bezier.js"() {
    init_utils();
    init_poly_bezier();
    ({ abs: abs2, min: min2, max: max2, cos: cos2, sin: sin2, acos: acos2, sqrt: sqrt2 } = Math);
    pi2 = Math.PI;
    Bezier = class {
      constructor(coords) {
        let args = coords && coords.forEach ? coords : Array.from(arguments).slice();
        let coordlen = false;
        if (typeof args[0] === "object") {
          coordlen = args.length;
          const newargs = [];
          args.forEach(function(point2) {
            ["x", "y", "z"].forEach(function(d2) {
              if (typeof point2[d2] !== "undefined") {
                newargs.push(point2[d2]);
              }
            });
          });
          args = newargs;
        }
        let higher = false;
        const len = args.length;
        if (coordlen) {
          if (coordlen > 4) {
            if (arguments.length !== 1) {
              throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");
            }
            higher = true;
          }
        } else {
          if (len !== 6 && len !== 8 && len !== 9 && len !== 12) {
            if (arguments.length !== 1) {
              throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");
            }
          }
        }
        const _3d = this._3d = !higher && (len === 9 || len === 12) || coords && coords[0] && typeof coords[0].z !== "undefined";
        const points = this.points = [];
        for (let idx = 0, step = _3d ? 3 : 2; idx < len; idx += step) {
          var point = {
            x: args[idx],
            y: args[idx + 1]
          };
          if (_3d) {
            point.z = args[idx + 2];
          }
          points.push(point);
        }
        const order = this.order = points.length - 1;
        const dims = this.dims = ["x", "y"];
        if (_3d)
          dims.push("z");
        this.dimlen = dims.length;
        const aligned = utils.align(points, { p1: points[0], p2: points[order] });
        const baselength = utils.dist(points[0], points[order]);
        this._linear = aligned.reduce((t3, p2) => t3 + abs2(p2.y), 0) < baselength / 50;
        this._lut = [];
        this._t1 = 0;
        this._t2 = 1;
        this.update();
      }
      static quadraticFromPoints(p1, p2, p3, t3) {
        if (typeof t3 === "undefined") {
          t3 = 0.5;
        }
        if (t3 === 0) {
          return new Bezier(p2, p2, p3);
        }
        if (t3 === 1) {
          return new Bezier(p1, p2, p2);
        }
        const abc = Bezier.getABC(2, p1, p2, p3, t3);
        return new Bezier(p1, abc.A, p3);
      }
      static cubicFromPoints(S2, B2, E2, t3, d1) {
        if (typeof t3 === "undefined") {
          t3 = 0.5;
        }
        const abc = Bezier.getABC(3, S2, B2, E2, t3);
        if (typeof d1 === "undefined") {
          d1 = utils.dist(B2, abc.C);
        }
        const d2 = d1 * (1 - t3) / t3;
        const selen = utils.dist(S2, E2), lx = (E2.x - S2.x) / selen, ly = (E2.y - S2.y) / selen, bx1 = d1 * lx, by1 = d1 * ly, bx2 = d2 * lx, by2 = d2 * ly;
        const e1 = { x: B2.x - bx1, y: B2.y - by1 }, e2 = { x: B2.x + bx2, y: B2.y + by2 }, A2 = abc.A, v1 = { x: A2.x + (e1.x - A2.x) / (1 - t3), y: A2.y + (e1.y - A2.y) / (1 - t3) }, v2 = { x: A2.x + (e2.x - A2.x) / t3, y: A2.y + (e2.y - A2.y) / t3 }, nc1 = { x: S2.x + (v1.x - S2.x) / t3, y: S2.y + (v1.y - S2.y) / t3 }, nc2 = {
          x: E2.x + (v2.x - E2.x) / (1 - t3),
          y: E2.y + (v2.y - E2.y) / (1 - t3)
        };
        return new Bezier(S2, nc1, nc2, E2);
      }
      static getUtils() {
        return utils;
      }
      getUtils() {
        return Bezier.getUtils();
      }
      static get PolyBezier() {
        return PolyBezier;
      }
      valueOf() {
        return this.toString();
      }
      toString() {
        return utils.pointsToString(this.points);
      }
      toSVG() {
        if (this._3d)
          return false;
        const p2 = this.points, x3 = p2[0].x, y3 = p2[0].y, s2 = ["M", x3, y3, this.order === 2 ? "Q" : "C"];
        for (let i2 = 1, last = p2.length; i2 < last; i2++) {
          s2.push(p2[i2].x);
          s2.push(p2[i2].y);
        }
        return s2.join(" ");
      }
      setRatios(ratios) {
        if (ratios.length !== this.points.length) {
          throw new Error("incorrect number of ratio values");
        }
        this.ratios = ratios;
        this._lut = [];
      }
      verify() {
        const print = this.coordDigest();
        if (print !== this._print) {
          this._print = print;
          this.update();
        }
      }
      coordDigest() {
        return this.points.map(function(c3, pos) {
          return "" + pos + c3.x + c3.y + (c3.z ? c3.z : 0);
        }).join("");
      }
      update() {
        this._lut = [];
        this.dpoints = utils.derive(this.points, this._3d);
        this.computedirection();
      }
      computedirection() {
        const points = this.points;
        const angle = utils.angle(points[0], points[this.order], points[1]);
        this.clockwise = angle > 0;
      }
      length() {
        return utils.length(this.derivative.bind(this));
      }
      static getABC(order = 2, S2, B2, E2, t3 = 0.5) {
        const u2 = utils.projectionratio(t3, order), um = 1 - u2, C2 = {
          x: u2 * S2.x + um * E2.x,
          y: u2 * S2.y + um * E2.y
        }, s2 = utils.abcratio(t3, order), A2 = {
          x: B2.x + (B2.x - C2.x) / s2,
          y: B2.y + (B2.y - C2.y) / s2
        };
        return { A: A2, B: B2, C: C2, S: S2, E: E2 };
      }
      getABC(t3, B2) {
        B2 = B2 || this.get(t3);
        let S2 = this.points[0];
        let E2 = this.points[this.order];
        return Bezier.getABC(this.order, S2, B2, E2, t3);
      }
      getLUT(steps) {
        this.verify();
        steps = steps || 100;
        if (this._lut.length === steps + 1) {
          return this._lut;
        }
        this._lut = [];
        steps++;
        this._lut = [];
        for (let i2 = 0, p2, t3; i2 < steps; i2++) {
          t3 = i2 / (steps - 1);
          p2 = this.compute(t3);
          p2.t = t3;
          this._lut.push(p2);
        }
        return this._lut;
      }
      on(point, error) {
        error = error || 5;
        const lut = this.getLUT(), hits = [];
        for (let i2 = 0, c3, t3 = 0; i2 < lut.length; i2++) {
          c3 = lut[i2];
          if (utils.dist(c3, point) < error) {
            hits.push(c3);
            t3 += i2 / lut.length;
          }
        }
        if (!hits.length)
          return false;
        return t /= hits.length;
      }
      project(point) {
        const LUT = this.getLUT(), l2 = LUT.length - 1, closest = utils.closest(LUT, point), mpos = closest.mpos, t1 = (mpos - 1) / l2, t22 = (mpos + 1) / l2, step = 0.1 / l2;
        let mdist = closest.mdist, t3 = t1, ft = t3, p2;
        mdist += 1;
        for (let d2; t3 < t22 + step; t3 += step) {
          p2 = this.compute(t3);
          d2 = utils.dist(point, p2);
          if (d2 < mdist) {
            mdist = d2;
            ft = t3;
          }
        }
        ft = ft < 0 ? 0 : ft > 1 ? 1 : ft;
        p2 = this.compute(ft);
        p2.t = ft;
        p2.d = mdist;
        return p2;
      }
      get(t3) {
        return this.compute(t3);
      }
      point(idx) {
        return this.points[idx];
      }
      compute(t3) {
        if (this.ratios) {
          return utils.computeWithRatios(t3, this.points, this.ratios, this._3d);
        }
        return utils.compute(t3, this.points, this._3d, this.ratios);
      }
      raise() {
        const p2 = this.points, np = [p2[0]], k2 = p2.length;
        for (let i2 = 1, pi3, pim; i2 < k2; i2++) {
          pi3 = p2[i2];
          pim = p2[i2 - 1];
          np[i2] = {
            x: (k2 - i2) / k2 * pi3.x + i2 / k2 * pim.x,
            y: (k2 - i2) / k2 * pi3.y + i2 / k2 * pim.y
          };
        }
        np[k2] = p2[k2 - 1];
        return new Bezier(np);
      }
      derivative(t3) {
        return utils.compute(t3, this.dpoints[0], this._3d);
      }
      dderivative(t3) {
        return utils.compute(t3, this.dpoints[1], this._3d);
      }
      align() {
        let p2 = this.points;
        return new Bezier(utils.align(p2, { p1: p2[0], p2: p2[p2.length - 1] }));
      }
      curvature(t3) {
        return utils.curvature(t3, this.dpoints[0], this.dpoints[1], this._3d);
      }
      inflections() {
        return utils.inflections(this.points);
      }
      normal(t3) {
        return this._3d ? this.__normal3(t3) : this.__normal2(t3);
      }
      __normal2(t3) {
        const d2 = this.derivative(t3);
        const q2 = sqrt2(d2.x * d2.x + d2.y * d2.y);
        return { t: t3, x: -d2.y / q2, y: d2.x / q2 };
      }
      __normal3(t3) {
        const r1 = this.derivative(t3), r2 = this.derivative(t3 + 0.01), q1 = sqrt2(r1.x * r1.x + r1.y * r1.y + r1.z * r1.z), q2 = sqrt2(r2.x * r2.x + r2.y * r2.y + r2.z * r2.z);
        r1.x /= q1;
        r1.y /= q1;
        r1.z /= q1;
        r2.x /= q2;
        r2.y /= q2;
        r2.z /= q2;
        const c3 = {
          x: r2.y * r1.z - r2.z * r1.y,
          y: r2.z * r1.x - r2.x * r1.z,
          z: r2.x * r1.y - r2.y * r1.x
        };
        const m3 = sqrt2(c3.x * c3.x + c3.y * c3.y + c3.z * c3.z);
        c3.x /= m3;
        c3.y /= m3;
        c3.z /= m3;
        const R = [
          c3.x * c3.x,
          c3.x * c3.y - c3.z,
          c3.x * c3.z + c3.y,
          c3.x * c3.y + c3.z,
          c3.y * c3.y,
          c3.y * c3.z - c3.x,
          c3.x * c3.z - c3.y,
          c3.y * c3.z + c3.x,
          c3.z * c3.z
        ];
        const n2 = {
          t: t3,
          x: R[0] * r1.x + R[1] * r1.y + R[2] * r1.z,
          y: R[3] * r1.x + R[4] * r1.y + R[5] * r1.z,
          z: R[6] * r1.x + R[7] * r1.y + R[8] * r1.z
        };
        return n2;
      }
      hull(t3) {
        let p2 = this.points, _p = [], q2 = [], idx = 0;
        q2[idx++] = p2[0];
        q2[idx++] = p2[1];
        q2[idx++] = p2[2];
        if (this.order === 3) {
          q2[idx++] = p2[3];
        }
        while (p2.length > 1) {
          _p = [];
          for (let i2 = 0, pt, l2 = p2.length - 1; i2 < l2; i2++) {
            pt = utils.lerp(t3, p2[i2], p2[i2 + 1]);
            q2[idx++] = pt;
            _p.push(pt);
          }
          p2 = _p;
        }
        return q2;
      }
      split(t1, t22) {
        if (t1 === 0 && !!t22) {
          return this.split(t22).left;
        }
        if (t22 === 1) {
          return this.split(t1).right;
        }
        const q2 = this.hull(t1);
        const result = {
          left: this.order === 2 ? new Bezier([q2[0], q2[3], q2[5]]) : new Bezier([q2[0], q2[4], q2[7], q2[9]]),
          right: this.order === 2 ? new Bezier([q2[5], q2[4], q2[2]]) : new Bezier([q2[9], q2[8], q2[6], q2[3]]),
          span: q2
        };
        result.left._t1 = utils.map(0, 0, 1, this._t1, this._t2);
        result.left._t2 = utils.map(t1, 0, 1, this._t1, this._t2);
        result.right._t1 = utils.map(t1, 0, 1, this._t1, this._t2);
        result.right._t2 = utils.map(1, 0, 1, this._t1, this._t2);
        if (!t22) {
          return result;
        }
        t22 = utils.map(t22, t1, 1, 0, 1);
        return result.right.split(t22).left;
      }
      extrema() {
        const result = {};
        let roots = [];
        this.dims.forEach(function(dim) {
          let mfn = function(v2) {
            return v2[dim];
          };
          let p2 = this.dpoints[0].map(mfn);
          result[dim] = utils.droots(p2);
          if (this.order === 3) {
            p2 = this.dpoints[1].map(mfn);
            result[dim] = result[dim].concat(utils.droots(p2));
          }
          result[dim] = result[dim].filter(function(t3) {
            return t3 >= 0 && t3 <= 1;
          });
          roots = roots.concat(result[dim].sort(utils.numberSort));
        }.bind(this));
        result.values = roots.sort(utils.numberSort).filter(function(v2, idx) {
          return roots.indexOf(v2) === idx;
        });
        return result;
      }
      bbox() {
        const extrema = this.extrema(), result = {};
        this.dims.forEach(function(d2) {
          result[d2] = utils.getminmax(this, d2, extrema[d2]);
        }.bind(this));
        return result;
      }
      overlaps(curve) {
        const lbbox = this.bbox(), tbbox = curve.bbox();
        return utils.bboxoverlap(lbbox, tbbox);
      }
      offset(t3, d2) {
        if (typeof d2 !== "undefined") {
          const c3 = this.get(t3), n2 = this.normal(t3);
          const ret = {
            c: c3,
            n: n2,
            x: c3.x + n2.x * d2,
            y: c3.y + n2.y * d2
          };
          if (this._3d) {
            ret.z = c3.z + n2.z * d2;
          }
          return ret;
        }
        if (this._linear) {
          const nv = this.normal(0), coords = this.points.map(function(p2) {
            const ret = {
              x: p2.x + t3 * nv.x,
              y: p2.y + t3 * nv.y
            };
            if (p2.z && nv.z) {
              ret.z = p2.z + t3 * nv.z;
            }
            return ret;
          });
          return [new Bezier(coords)];
        }
        return this.reduce().map(function(s2) {
          if (s2._linear) {
            return s2.offset(t3)[0];
          }
          return s2.scale(t3);
        });
      }
      simple() {
        if (this.order === 3) {
          const a1 = utils.angle(this.points[0], this.points[3], this.points[1]);
          const a22 = utils.angle(this.points[0], this.points[3], this.points[2]);
          if (a1 > 0 && a22 < 0 || a1 < 0 && a22 > 0)
            return false;
        }
        const n1 = this.normal(0);
        const n2 = this.normal(1);
        let s2 = n1.x * n2.x + n1.y * n2.y;
        if (this._3d) {
          s2 += n1.z * n2.z;
        }
        return abs2(acos2(s2)) < pi2 / 3;
      }
      reduce() {
        let i2, t1 = 0, t22 = 0, step = 0.01, segment, pass1 = [], pass2 = [];
        let extrema = this.extrema().values;
        if (extrema.indexOf(0) === -1) {
          extrema = [0].concat(extrema);
        }
        if (extrema.indexOf(1) === -1) {
          extrema.push(1);
        }
        for (t1 = extrema[0], i2 = 1; i2 < extrema.length; i2++) {
          t22 = extrema[i2];
          segment = this.split(t1, t22);
          segment._t1 = t1;
          segment._t2 = t22;
          pass1.push(segment);
          t1 = t22;
        }
        pass1.forEach(function(p1) {
          t1 = 0;
          t22 = 0;
          while (t22 <= 1) {
            for (t22 = t1 + step; t22 <= 1 + step; t22 += step) {
              segment = p1.split(t1, t22);
              if (!segment.simple()) {
                t22 -= step;
                if (abs2(t1 - t22) < step) {
                  return [];
                }
                segment = p1.split(t1, t22);
                segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
                segment._t2 = utils.map(t22, 0, 1, p1._t1, p1._t2);
                pass2.push(segment);
                t1 = t22;
                break;
              }
            }
          }
          if (t1 < 1) {
            segment = p1.split(t1, 1);
            segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
            segment._t2 = p1._t2;
            pass2.push(segment);
          }
        });
        return pass2;
      }
      translate(v2, d1, d2) {
        d2 = typeof d2 === "number" ? d2 : d1;
        const o2 = this.order;
        let d3 = this.points.map((_2, i2) => (1 - i2 / o2) * d1 + i2 / o2 * d2);
        return new Bezier(this.points.map((p2, i2) => ({
          x: p2.x + v2.x * d3[i2],
          y: p2.y + v2.y * d3[i2]
        })));
      }
      scale(d2) {
        const order = this.order;
        let distanceFn = false;
        if (typeof d2 === "function") {
          distanceFn = d2;
        }
        if (distanceFn && order === 2) {
          return this.raise().scale(distanceFn);
        }
        const clockwise = this.clockwise;
        const points = this.points;
        if (this._linear) {
          return this.translate(this.normal(0), distanceFn ? distanceFn(0) : d2, distanceFn ? distanceFn(1) : d2);
        }
        const r1 = distanceFn ? distanceFn(0) : d2;
        const r2 = distanceFn ? distanceFn(1) : d2;
        const v2 = [this.offset(0, 10), this.offset(1, 10)];
        const np = [];
        const o2 = utils.lli4(v2[0], v2[0].c, v2[1], v2[1].c);
        if (!o2) {
          throw new Error("cannot scale this curve. Try reducing it first.");
        }
        [0, 1].forEach(function(t3) {
          const p2 = np[t3 * order] = utils.copy(points[t3 * order]);
          p2.x += (t3 ? r2 : r1) * v2[t3].n.x;
          p2.y += (t3 ? r2 : r1) * v2[t3].n.y;
        });
        if (!distanceFn) {
          [0, 1].forEach((t3) => {
            if (order === 2 && !!t3)
              return;
            const p2 = np[t3 * order];
            const d3 = this.derivative(t3);
            const p22 = { x: p2.x + d3.x, y: p2.y + d3.y };
            np[t3 + 1] = utils.lli4(p2, p22, o2, points[t3 + 1]);
          });
          return new Bezier(np);
        }
        [0, 1].forEach(function(t3) {
          if (order === 2 && !!t3)
            return;
          var p2 = points[t3 + 1];
          var ov = {
            x: p2.x - o2.x,
            y: p2.y - o2.y
          };
          var rc = distanceFn ? distanceFn((t3 + 1) / order) : d2;
          if (distanceFn && !clockwise)
            rc = -rc;
          var m3 = sqrt2(ov.x * ov.x + ov.y * ov.y);
          ov.x /= m3;
          ov.y /= m3;
          np[t3 + 1] = {
            x: p2.x + rc * ov.x,
            y: p2.y + rc * ov.y
          };
        });
        return new Bezier(np);
      }
      outline(d1, d2, d3, d4) {
        d2 = d2 === void 0 ? d1 : d2;
        if (this._linear) {
          const n2 = this.normal(0);
          const start2 = this.points[0];
          const end = this.points[this.points.length - 1];
          let s2, mid, e2;
          if (d3 === void 0) {
            d3 = d1;
            d4 = d2;
          }
          s2 = { x: start2.x + n2.x * d1, y: start2.y + n2.y * d1 };
          e2 = { x: end.x + n2.x * d3, y: end.y + n2.y * d3 };
          mid = { x: (s2.x + e2.x) / 2, y: (s2.y + e2.y) / 2 };
          const fline = [s2, mid, e2];
          s2 = { x: start2.x - n2.x * d2, y: start2.y - n2.y * d2 };
          e2 = { x: end.x - n2.x * d4, y: end.y - n2.y * d4 };
          mid = { x: (s2.x + e2.x) / 2, y: (s2.y + e2.y) / 2 };
          const bline = [e2, mid, s2];
          const ls2 = utils.makeline(bline[2], fline[0]);
          const le2 = utils.makeline(fline[2], bline[0]);
          const segments2 = [ls2, new Bezier(fline), le2, new Bezier(bline)];
          return new PolyBezier(segments2);
        }
        const reduced = this.reduce(), len = reduced.length, fcurves = [];
        let bcurves = [], p2, alen = 0, tlen = this.length();
        const graduated = typeof d3 !== "undefined" && typeof d4 !== "undefined";
        function linearDistanceFunction(s2, e2, tlen2, alen2, slen) {
          return function(v2) {
            const f1 = alen2 / tlen2, f2 = (alen2 + slen) / tlen2, d5 = e2 - s2;
            return utils.map(v2, 0, 1, s2 + f1 * d5, s2 + f2 * d5);
          };
        }
        reduced.forEach(function(segment) {
          const slen = segment.length();
          if (graduated) {
            fcurves.push(segment.scale(linearDistanceFunction(d1, d3, tlen, alen, slen)));
            bcurves.push(segment.scale(linearDistanceFunction(-d2, -d4, tlen, alen, slen)));
          } else {
            fcurves.push(segment.scale(d1));
            bcurves.push(segment.scale(-d2));
          }
          alen += slen;
        });
        bcurves = bcurves.map(function(s2) {
          p2 = s2.points;
          if (p2[3]) {
            s2.points = [p2[3], p2[2], p2[1], p2[0]];
          } else {
            s2.points = [p2[2], p2[1], p2[0]];
          }
          return s2;
        }).reverse();
        const fs = fcurves[0].points[0], fe = fcurves[len - 1].points[fcurves[len - 1].points.length - 1], bs = bcurves[len - 1].points[bcurves[len - 1].points.length - 1], be = bcurves[0].points[0], ls = utils.makeline(bs, fs), le = utils.makeline(fe, be), segments = [ls].concat(fcurves).concat([le]).concat(bcurves);
        return new PolyBezier(segments);
      }
      outlineshapes(d1, d2, curveIntersectionThreshold) {
        d2 = d2 || d1;
        const outline = this.outline(d1, d2).curves;
        const shapes = [];
        for (let i2 = 1, len = outline.length; i2 < len / 2; i2++) {
          const shape = utils.makeshape(outline[i2], outline[len - i2], curveIntersectionThreshold);
          shape.startcap.virtual = i2 > 1;
          shape.endcap.virtual = i2 < len / 2 - 1;
          shapes.push(shape);
        }
        return shapes;
      }
      intersects(curve, curveIntersectionThreshold) {
        if (!curve)
          return this.selfintersects(curveIntersectionThreshold);
        if (curve.p1 && curve.p2) {
          return this.lineIntersects(curve);
        }
        if (curve instanceof Bezier) {
          curve = curve.reduce();
        }
        return this.curveintersects(this.reduce(), curve, curveIntersectionThreshold);
      }
      lineIntersects(line) {
        const mx = min2(line.p1.x, line.p2.x), my = min2(line.p1.y, line.p2.y), MX = max2(line.p1.x, line.p2.x), MY = max2(line.p1.y, line.p2.y);
        return utils.roots(this.points, line).filter((t3) => {
          var p2 = this.get(t3);
          return utils.between(p2.x, mx, MX) && utils.between(p2.y, my, MY);
        });
      }
      selfintersects(curveIntersectionThreshold) {
        const reduced = this.reduce(), len = reduced.length - 2, results = [];
        for (let i2 = 0, result, left, right; i2 < len; i2++) {
          left = reduced.slice(i2, i2 + 1);
          right = reduced.slice(i2 + 2);
          result = this.curveintersects(left, right, curveIntersectionThreshold);
          results.push(...result);
        }
        return results;
      }
      curveintersects(c1, c22, curveIntersectionThreshold) {
        const pairs = [];
        c1.forEach(function(l2) {
          c22.forEach(function(r2) {
            if (l2.overlaps(r2)) {
              pairs.push({ left: l2, right: r2 });
            }
          });
        });
        let intersections = [];
        pairs.forEach(function(pair) {
          const result = utils.pairiteration(pair.left, pair.right, curveIntersectionThreshold);
          if (result.length > 0) {
            intersections = intersections.concat(result);
          }
        });
        return intersections;
      }
      arcs(errorThreshold) {
        errorThreshold = errorThreshold || 0.5;
        return this._iterate(errorThreshold, []);
      }
      _error(pc, np1, s2, e2) {
        const q2 = (e2 - s2) / 4, c1 = this.get(s2 + q2), c22 = this.get(e2 - q2), ref = utils.dist(pc, np1), d1 = utils.dist(pc, c1), d2 = utils.dist(pc, c22);
        return abs2(d1 - ref) + abs2(d2 - ref);
      }
      _iterate(errorThreshold, circles) {
        let t_s = 0, t_e = 1, safety;
        do {
          safety = 0;
          t_e = 1;
          let np1 = this.get(t_s), np2, np3, arc, prev_arc;
          let curr_good = false, prev_good = false, done;
          let t_m = t_e, prev_e = 1, step = 0;
          do {
            prev_good = curr_good;
            prev_arc = arc;
            t_m = (t_s + t_e) / 2;
            step++;
            np2 = this.get(t_m);
            np3 = this.get(t_e);
            arc = utils.getccenter(np1, np2, np3);
            arc.interval = {
              start: t_s,
              end: t_e
            };
            let error = this._error(arc, np1, t_s, t_e);
            curr_good = error <= errorThreshold;
            done = prev_good && !curr_good;
            if (!done)
              prev_e = t_e;
            if (curr_good) {
              if (t_e >= 1) {
                arc.interval.end = prev_e = 1;
                prev_arc = arc;
                if (t_e > 1) {
                  let d2 = {
                    x: arc.x + arc.r * cos2(arc.e),
                    y: arc.y + arc.r * sin2(arc.e)
                  };
                  arc.e += utils.angle({ x: arc.x, y: arc.y }, d2, this.get(1));
                }
                break;
              }
              t_e = t_e + (t_e - t_s) / 2;
            } else {
              t_e = t_m;
            }
          } while (!done && safety++ < 100);
          if (safety >= 100) {
            break;
          }
          prev_arc = prev_arc ? prev_arc : arc;
          circles.push(prev_arc);
          t_s = prev_e;
        } while (t_e < 1);
        return circles;
      }
    };
  }
});

// node_modules/index-array-by/dist/index-array-by.mjs
function _arrayLikeToArray4(r2, a3) {
  (null == a3 || a3 > r2.length) && (a3 = r2.length);
  for (var e2 = 0, n2 = Array(a3); e2 < a3; e2++)
    n2[e2] = r2[e2];
  return n2;
}
function _arrayWithHoles3(r2) {
  if (Array.isArray(r2))
    return r2;
}
function _arrayWithoutHoles2(r2) {
  if (Array.isArray(r2))
    return _arrayLikeToArray4(r2);
}
function _iterableToArray2(r2) {
  if ("undefined" != typeof Symbol && null != r2[Symbol.iterator] || null != r2["@@iterator"])
    return Array.from(r2);
}
function _iterableToArrayLimit3(r2, l2) {
  var t3 = null == r2 ? null : "undefined" != typeof Symbol && r2[Symbol.iterator] || r2["@@iterator"];
  if (null != t3) {
    var e2, n2, i2, u2, a3 = [], f2 = true, o2 = false;
    try {
      if (i2 = (t3 = t3.call(r2)).next, 0 === l2)
        ;
      else
        for (; !(f2 = (e2 = i2.call(t3)).done) && (a3.push(e2.value), a3.length !== l2); f2 = true)
          ;
    } catch (r3) {
      o2 = true, n2 = r3;
    } finally {
      try {
        if (!f2 && null != t3.return && (u2 = t3.return(), Object(u2) !== u2))
          return;
      } finally {
        if (o2)
          throw n2;
      }
    }
    return a3;
  }
}
function _nonIterableRest3() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _nonIterableSpread2() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _objectWithoutProperties(e2, t3) {
  if (null == e2)
    return {};
  var o2, r2, i2 = _objectWithoutPropertiesLoose(e2, t3);
  if (Object.getOwnPropertySymbols) {
    var s2 = Object.getOwnPropertySymbols(e2);
    for (r2 = 0; r2 < s2.length; r2++)
      o2 = s2[r2], t3.includes(o2) || {}.propertyIsEnumerable.call(e2, o2) && (i2[o2] = e2[o2]);
  }
  return i2;
}
function _objectWithoutPropertiesLoose(r2, e2) {
  if (null == r2)
    return {};
  var t3 = {};
  for (var n2 in r2)
    if ({}.hasOwnProperty.call(r2, n2)) {
      if (e2.includes(n2))
        continue;
      t3[n2] = r2[n2];
    }
  return t3;
}
function _slicedToArray3(r2, e2) {
  return _arrayWithHoles3(r2) || _iterableToArrayLimit3(r2, e2) || _unsupportedIterableToArray4(r2, e2) || _nonIterableRest3();
}
function _toConsumableArray2(r2) {
  return _arrayWithoutHoles2(r2) || _iterableToArray2(r2) || _unsupportedIterableToArray4(r2) || _nonIterableSpread2();
}
function _toPrimitive3(t3, r2) {
  if ("object" != typeof t3 || !t3)
    return t3;
  var e2 = t3[Symbol.toPrimitive];
  if (void 0 !== e2) {
    var i2 = e2.call(t3, r2);
    if ("object" != typeof i2)
      return i2;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return String(t3);
}
function _toPropertyKey3(t3) {
  var i2 = _toPrimitive3(t3, "string");
  return "symbol" == typeof i2 ? i2 : i2 + "";
}
function _unsupportedIterableToArray4(r2, a3) {
  if (r2) {
    if ("string" == typeof r2)
      return _arrayLikeToArray4(r2, a3);
    var t3 = {}.toString.call(r2).slice(8, -1);
    return "Object" === t3 && r2.constructor && (t3 = r2.constructor.name), "Map" === t3 || "Set" === t3 ? Array.from(r2) : "Arguments" === t3 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t3) ? _arrayLikeToArray4(r2, a3) : void 0;
  }
}
var index5;
var init_index_array_by = __esm({
  "node_modules/index-array-by/dist/index-array-by.mjs"() {
    index5 = function() {
      var list = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
      var keyAccessors = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
      var multiItem = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
      var flattenKeys = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
      var keys = (keyAccessors instanceof Array ? keyAccessors.length ? keyAccessors : [void 0] : [keyAccessors]).map(function(key) {
        return {
          keyAccessor: key,
          isProp: !(key instanceof Function)
        };
      });
      var indexedResult = list.reduce(function(res, item) {
        var iterObj = res;
        var itemVal = item;
        keys.forEach(function(_ref, idx) {
          var keyAccessor = _ref.keyAccessor, isProp = _ref.isProp;
          var key;
          if (isProp) {
            var _itemVal = itemVal, propVal = _itemVal[keyAccessor], rest = _objectWithoutProperties(_itemVal, [keyAccessor].map(_toPropertyKey3));
            key = propVal;
            itemVal = rest;
          } else {
            key = keyAccessor(itemVal, idx);
          }
          if (idx + 1 < keys.length) {
            if (!iterObj.hasOwnProperty(key)) {
              iterObj[key] = {};
            }
            iterObj = iterObj[key];
          } else {
            if (multiItem) {
              if (!iterObj.hasOwnProperty(key)) {
                iterObj[key] = [];
              }
              iterObj[key].push(itemVal);
            } else {
              iterObj[key] = itemVal;
            }
          }
        });
        return res;
      }, {});
      if (multiItem instanceof Function) {
        (function reduce(node) {
          var level = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
          if (level === keys.length) {
            Object.keys(node).forEach(function(k2) {
              return node[k2] = multiItem(node[k2]);
            });
          } else {
            Object.values(node).forEach(function(child) {
              return reduce(child, level + 1);
            });
          }
        })(indexedResult);
      }
      var result = indexedResult;
      if (flattenKeys) {
        result = [];
        (function flatten(node) {
          var accKeys = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
          if (accKeys.length === keys.length) {
            result.push({
              keys: accKeys,
              vals: node
            });
          } else {
            Object.entries(node).forEach(function(_ref2) {
              var _ref3 = _slicedToArray3(_ref2, 2), key = _ref3[0], val = _ref3[1];
              return flatten(val, [].concat(_toConsumableArray2(accKeys), [key]));
            });
          }
        })(indexedResult);
        if (keyAccessors instanceof Array && keyAccessors.length === 0 && result.length === 1) {
          result[0].keys = [];
        }
      }
      return result;
    };
  }
});

// node_modules/d3-scale/src/init.js
function initRange(domain, range) {
  switch (arguments.length) {
    case 0:
      break;
    case 1:
      this.range(domain);
      break;
    default:
      this.range(range).domain(domain);
      break;
  }
  return this;
}
var init_init = __esm({
  "node_modules/d3-scale/src/init.js"() {
  }
});

// node_modules/d3-scale/src/ordinal.js
function ordinal() {
  var index6 = new InternMap(), domain = [], range = [], unknown = implicit;
  function scale(d2) {
    let i2 = index6.get(d2);
    if (i2 === void 0) {
      if (unknown !== implicit)
        return unknown;
      index6.set(d2, i2 = domain.push(d2) - 1);
    }
    return range[i2 % range.length];
  }
  scale.domain = function(_2) {
    if (!arguments.length)
      return domain.slice();
    domain = [], index6 = new InternMap();
    for (const value of _2) {
      if (index6.has(value))
        continue;
      index6.set(value, domain.push(value) - 1);
    }
    return scale;
  };
  scale.range = function(_2) {
    return arguments.length ? (range = Array.from(_2), scale) : range.slice();
  };
  scale.unknown = function(_2) {
    return arguments.length ? (unknown = _2, scale) : unknown;
  };
  scale.copy = function() {
    return ordinal(domain, range).unknown(unknown);
  };
  initRange.apply(scale, arguments);
  return scale;
}
var implicit;
var init_ordinal = __esm({
  "node_modules/d3-scale/src/ordinal.js"() {
    init_src11();
    init_init();
    implicit = Symbol("implicit");
  }
});

// node_modules/d3-scale/src/index.js
var init_src16 = __esm({
  "node_modules/d3-scale/src/index.js"() {
    init_ordinal();
  }
});

// node_modules/d3-scale-chromatic/src/colors.js
function colors_default(specifier) {
  var n2 = specifier.length / 6 | 0, colors = new Array(n2), i2 = 0;
  while (i2 < n2)
    colors[i2] = "#" + specifier.slice(i2 * 6, ++i2 * 6);
  return colors;
}
var init_colors = __esm({
  "node_modules/d3-scale-chromatic/src/colors.js"() {
  }
});

// node_modules/d3-scale-chromatic/src/categorical/Paired.js
var Paired_default;
var init_Paired = __esm({
  "node_modules/d3-scale-chromatic/src/categorical/Paired.js"() {
    init_colors();
    Paired_default = colors_default("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928");
  }
});

// node_modules/d3-scale-chromatic/src/index.js
var init_src17 = __esm({
  "node_modules/d3-scale-chromatic/src/index.js"() {
    init_Paired();
  }
});

// node_modules/force-graph/dist/force-graph.mjs
function styleInject2(css, ref) {
  if (ref === void 0)
    ref = {};
  var insertAt = ref.insertAt;
  if (typeof document === "undefined") {
    return;
  }
  var head = document.head || document.getElementsByTagName("head")[0];
  var style = document.createElement("style");
  style.type = "text/css";
  if (insertAt === "top") {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}
function _arrayLikeToArray5(r2, a3) {
  (null == a3 || a3 > r2.length) && (a3 = r2.length);
  for (var e2 = 0, n2 = Array(a3); e2 < a3; e2++)
    n2[e2] = r2[e2];
  return n2;
}
function _arrayWithHoles4(r2) {
  if (Array.isArray(r2))
    return r2;
}
function _arrayWithoutHoles3(r2) {
  if (Array.isArray(r2))
    return _arrayLikeToArray5(r2);
}
function _construct(t3, e2, r2) {
  if (_isNativeReflectConstruct())
    return Reflect.construct.apply(null, arguments);
  var o2 = [null];
  o2.push.apply(o2, e2);
  var p2 = new (t3.bind.apply(t3, o2))();
  return p2;
}
function _defineProperty2(e2, r2, t3) {
  return (r2 = _toPropertyKey4(r2)) in e2 ? Object.defineProperty(e2, r2, {
    value: t3,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e2[r2] = t3, e2;
}
function _isNativeReflectConstruct() {
  try {
    var t3 = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
  } catch (t4) {
  }
  return (_isNativeReflectConstruct = function() {
    return !!t3;
  })();
}
function _iterableToArray3(r2) {
  if ("undefined" != typeof Symbol && null != r2[Symbol.iterator] || null != r2["@@iterator"])
    return Array.from(r2);
}
function _iterableToArrayLimit4(r2, l2) {
  var t3 = null == r2 ? null : "undefined" != typeof Symbol && r2[Symbol.iterator] || r2["@@iterator"];
  if (null != t3) {
    var e2, n2, i2, u2, a3 = [], f2 = true, o2 = false;
    try {
      if (i2 = (t3 = t3.call(r2)).next, 0 === l2)
        ;
      else
        for (; !(f2 = (e2 = i2.call(t3)).done) && (a3.push(e2.value), a3.length !== l2); f2 = true)
          ;
    } catch (r3) {
      o2 = true, n2 = r3;
    } finally {
      try {
        if (!f2 && null != t3.return && (u2 = t3.return(), Object(u2) !== u2))
          return;
      } finally {
        if (o2)
          throw n2;
      }
    }
    return a3;
  }
}
function _nonIterableRest4() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _nonIterableSpread3() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys2(e2, r2) {
  var t3 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var o2 = Object.getOwnPropertySymbols(e2);
    r2 && (o2 = o2.filter(function(r3) {
      return Object.getOwnPropertyDescriptor(e2, r3).enumerable;
    })), t3.push.apply(t3, o2);
  }
  return t3;
}
function _objectSpread22(e2) {
  for (var r2 = 1; r2 < arguments.length; r2++) {
    var t3 = null != arguments[r2] ? arguments[r2] : {};
    r2 % 2 ? ownKeys2(Object(t3), true).forEach(function(r3) {
      _defineProperty2(e2, r3, t3[r3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(t3)) : ownKeys2(Object(t3)).forEach(function(r3) {
      Object.defineProperty(e2, r3, Object.getOwnPropertyDescriptor(t3, r3));
    });
  }
  return e2;
}
function _slicedToArray4(r2, e2) {
  return _arrayWithHoles4(r2) || _iterableToArrayLimit4(r2, e2) || _unsupportedIterableToArray5(r2, e2) || _nonIterableRest4();
}
function _toConsumableArray3(r2) {
  return _arrayWithoutHoles3(r2) || _iterableToArray3(r2) || _unsupportedIterableToArray5(r2) || _nonIterableSpread3();
}
function _toPrimitive4(t3, r2) {
  if ("object" != typeof t3 || !t3)
    return t3;
  var e2 = t3[Symbol.toPrimitive];
  if (void 0 !== e2) {
    var i2 = e2.call(t3, r2);
    if ("object" != typeof i2)
      return i2;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r2 ? String : Number)(t3);
}
function _toPropertyKey4(t3) {
  var i2 = _toPrimitive4(t3, "string");
  return "symbol" == typeof i2 ? i2 : i2 + "";
}
function _typeof3(o2) {
  "@babel/helpers - typeof";
  return _typeof3 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o3) {
    return typeof o3;
  } : function(o3) {
    return o3 && "function" == typeof Symbol && o3.constructor === Symbol && o3 !== Symbol.prototype ? "symbol" : typeof o3;
  }, _typeof3(o2);
}
function _unsupportedIterableToArray5(r2, a3) {
  if (r2) {
    if ("string" == typeof r2)
      return _arrayLikeToArray5(r2, a3);
    var t3 = {}.toString.call(r2).slice(8, -1);
    return "Object" === t3 && r2.constructor && (t3 = r2.constructor.name), "Map" === t3 || "Set" === t3 ? Array.from(r2) : "Arguments" === t3 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t3) ? _arrayLikeToArray5(r2, a3) : void 0;
  }
}
function autoColorObjects(objects, colorByAccessor, colorField) {
  if (!colorByAccessor || typeof colorField !== "string")
    return;
  objects.filter(function(obj) {
    return !obj[colorField];
  }).forEach(function(obj) {
    obj[colorField] = autoColorScale(colorByAccessor(obj));
  });
}
function getDagDepths(_ref, idAccessor) {
  var nodes = _ref.nodes, links = _ref.links;
  var _ref2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, _ref2$nodeFilter = _ref2.nodeFilter, nodeFilter = _ref2$nodeFilter === void 0 ? function() {
    return true;
  } : _ref2$nodeFilter, _ref2$onLoopError = _ref2.onLoopError, onLoopError = _ref2$onLoopError === void 0 ? function(loopIds) {
    throw "Invalid DAG structure! Found cycle in node path: ".concat(loopIds.join(" -> "), ".");
  } : _ref2$onLoopError;
  var graph = {};
  nodes.forEach(function(node) {
    return graph[idAccessor(node)] = {
      data: node,
      out: [],
      depth: -1,
      skip: !nodeFilter(node)
    };
  });
  links.forEach(function(_ref3) {
    var source = _ref3.source, target = _ref3.target;
    var sourceId = getNodeId(source);
    var targetId = getNodeId(target);
    if (!graph.hasOwnProperty(sourceId))
      throw "Missing source node with id: ".concat(sourceId);
    if (!graph.hasOwnProperty(targetId))
      throw "Missing target node with id: ".concat(targetId);
    var sourceNode = graph[sourceId];
    var targetNode = graph[targetId];
    sourceNode.out.push(targetNode);
    function getNodeId(node) {
      return _typeof3(node) === "object" ? idAccessor(node) : node;
    }
  });
  var foundLoops = [];
  traverse(Object.values(graph));
  var nodeDepths = Object.assign.apply(Object, [{}].concat(_toConsumableArray3(Object.entries(graph).filter(function(_ref4) {
    var _ref5 = _slicedToArray4(_ref4, 2), node = _ref5[1];
    return !node.skip;
  }).map(function(_ref6) {
    var _ref7 = _slicedToArray4(_ref6, 2), id2 = _ref7[0], node = _ref7[1];
    return _defineProperty2({}, id2, node.depth);
  }))));
  return nodeDepths;
  function traverse(nodes2) {
    var nodeStack = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
    var currentDepth = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
    var _loop = function _loop2() {
      var node = nodes2[i2];
      if (nodeStack.indexOf(node) !== -1) {
        var loop = [].concat(_toConsumableArray3(nodeStack.slice(nodeStack.indexOf(node))), [node]).map(function(d2) {
          return idAccessor(d2.data);
        });
        if (!foundLoops.some(function(foundLoop) {
          return foundLoop.length === loop.length && foundLoop.every(function(id2, idx) {
            return id2 === loop[idx];
          });
        })) {
          foundLoops.push(loop);
          onLoopError(loop);
        }
        return 1;
      }
      if (currentDepth > node.depth) {
        node.depth = currentDepth;
        traverse(node.out, [].concat(_toConsumableArray3(nodeStack), [node]), currentDepth + (node.skip ? 0 : 1));
      }
    };
    for (var i2 = 0, l2 = nodes2.length; i2 < l2; i2++) {
      if (_loop())
        continue;
    }
  }
}
function linkKapsule(kapsulePropNames, kapsuleType) {
  var propNames = kapsulePropNames instanceof Array ? kapsulePropNames : [kapsulePropNames];
  var dummyK = new kapsuleType();
  dummyK._destructor && dummyK._destructor();
  return {
    linkProp: function linkProp(prop) {
      return {
        "default": dummyK[prop](),
        onChange: function onChange15(v2, state) {
          propNames.forEach(function(propName) {
            return state[propName][prop](v2);
          });
        },
        triggerUpdate: false
      };
    },
    linkMethod: function linkMethod(method) {
      return function(state) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }
        var returnVals = [];
        propNames.forEach(function(propName) {
          var kapsuleInstance = state[propName];
          var returnVal = kapsuleInstance[method].apply(kapsuleInstance, args);
          if (returnVal !== kapsuleInstance) {
            returnVals.push(returnVal);
          }
        });
        return returnVals.length ? returnVals[0] : this;
      };
    }
  };
}
function adjustCanvasSize(state) {
  if (state.canvas) {
    var curWidth = state.canvas.width;
    var curHeight = state.canvas.height;
    if (curWidth === 300 && curHeight === 150) {
      curWidth = curHeight = 0;
    }
    var pxScale = window.devicePixelRatio;
    curWidth /= pxScale;
    curHeight /= pxScale;
    [state.canvas, state.shadowCanvas].forEach(function(canvas) {
      canvas.style.width = "".concat(state.width, "px");
      canvas.style.height = "".concat(state.height, "px");
      canvas.width = state.width * pxScale;
      canvas.height = state.height * pxScale;
      if (!curWidth && !curHeight) {
        canvas.getContext("2d").scale(pxScale, pxScale);
      }
    });
    var k2 = transform(state.canvas).k;
    state.zoom.translateBy(state.zoom.__baseElem, (state.width - curWidth) / 2 / k2, (state.height - curHeight) / 2 / k2);
    state.needsRedraw = true;
  }
}
function resetTransform(ctx) {
  var pxRatio = window.devicePixelRatio;
  ctx.setTransform(pxRatio, 0, 0, pxRatio, 0, 0);
}
function clearCanvas(ctx, width, height) {
  ctx.save();
  resetTransform(ctx);
  ctx.clearRect(0, 0, width, height);
  ctx.restore();
}
var css_248z2, autoColorScale, DAG_LEVEL_NODE_RATIO, notifyRedraw, updDataPhotons, CanvasForceGraph, HOVER_CANVAS_THROTTLE_DELAY, ZOOM2NODES_FACTOR, DRAG_CLICK_TOLERANCE_PX, bindFG, bindBoth, linkedProps, linkedMethods, forceGraph;
var init_force_graph = __esm({
  "node_modules/force-graph/dist/force-graph.mjs"() {
    init_src();
    init_src9();
    init_src3();
    init_src11();
    init_lodash();
    init_tween_esm();
    init_kapsule();
    init_accessor_fn();
    init_canvas_color_tracker();
    init_float_tooltip();
    init_src15();
    init_bezier();
    init_index_array_by();
    init_src16();
    init_src17();
    css_248z2 = ".force-graph-container canvas {\n  display: block;\n  user-select: none;\n  outline: none;\n  -webkit-tap-highlight-color: transparent;\n}\n\n.force-graph-container .clickable {\n  cursor: pointer;\n}\n\n.force-graph-container .grabbable {\n  cursor: move;\n  cursor: grab;\n  cursor: -moz-grab;\n  cursor: -webkit-grab;\n}\n\n.force-graph-container .grabbable:active {\n  cursor: grabbing;\n  cursor: -moz-grabbing;\n  cursor: -webkit-grabbing;\n}\n";
    styleInject2(css_248z2);
    autoColorScale = ordinal(Paired_default);
    DAG_LEVEL_NODE_RATIO = 2;
    notifyRedraw = function notifyRedraw2(_2, state) {
      return state.onNeedsRedraw && state.onNeedsRedraw();
    };
    updDataPhotons = function updDataPhotons2(_2, state) {
      if (!state.isShadow) {
        var linkParticlesAccessor = index2(state.linkDirectionalParticles);
        state.graphData.links.forEach(function(link) {
          var numPhotons = Math.round(Math.abs(linkParticlesAccessor(link)));
          if (numPhotons) {
            link.__photons = _toConsumableArray3(Array(numPhotons)).map(function() {
              return {};
            });
          } else {
            delete link.__photons;
          }
        });
      }
    };
    CanvasForceGraph = index({
      props: {
        graphData: {
          "default": {
            nodes: [],
            links: []
          },
          onChange: function onChange(_2, state) {
            state.engineRunning = false;
            updDataPhotons(_2, state);
          }
        },
        dagMode: {
          onChange: function onChange2(dagMode, state) {
            !dagMode && (state.graphData.nodes || []).forEach(function(n2) {
              return n2.fx = n2.fy = void 0;
            });
          }
        },
        dagLevelDistance: {},
        dagNodeFilter: {
          "default": function _default2(node) {
            return true;
          }
        },
        onDagError: {
          triggerUpdate: false
        },
        nodeRelSize: {
          "default": 4,
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        nodeId: {
          "default": "id"
        },
        nodeVal: {
          "default": "val",
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        nodeColor: {
          "default": "color",
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        nodeAutoColorBy: {},
        nodeCanvasObject: {
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        nodeCanvasObjectMode: {
          "default": function _default3() {
            return "replace";
          },
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        nodeVisibility: {
          "default": true,
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        linkSource: {
          "default": "source"
        },
        linkTarget: {
          "default": "target"
        },
        linkVisibility: {
          "default": true,
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        linkColor: {
          "default": "color",
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        linkAutoColorBy: {},
        linkLineDash: {
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        linkWidth: {
          "default": 1,
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        linkCurvature: {
          "default": 0,
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        linkCanvasObject: {
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        linkCanvasObjectMode: {
          "default": function _default4() {
            return "replace";
          },
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        linkDirectionalArrowLength: {
          "default": 0,
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        linkDirectionalArrowColor: {
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        linkDirectionalArrowRelPos: {
          "default": 0.5,
          triggerUpdate: false,
          onChange: notifyRedraw
        },
        linkDirectionalParticles: {
          "default": 0,
          triggerUpdate: false,
          onChange: updDataPhotons
        },
        linkDirectionalParticleSpeed: {
          "default": 0.01,
          triggerUpdate: false
        },
        linkDirectionalParticleOffset: {
          "default": 0,
          triggerUpdate: false
        },
        linkDirectionalParticleWidth: {
          "default": 4,
          triggerUpdate: false
        },
        linkDirectionalParticleColor: {
          triggerUpdate: false
        },
        linkDirectionalParticleCanvasObject: {
          triggerUpdate: false
        },
        globalScale: {
          "default": 1,
          triggerUpdate: false
        },
        d3AlphaMin: {
          "default": 0,
          triggerUpdate: false
        },
        d3AlphaDecay: {
          "default": 0.0228,
          triggerUpdate: false,
          onChange: function onChange3(alphaDecay, state) {
            state.forceLayout.alphaDecay(alphaDecay);
          }
        },
        d3AlphaTarget: {
          "default": 0,
          triggerUpdate: false,
          onChange: function onChange4(alphaTarget, state) {
            state.forceLayout.alphaTarget(alphaTarget);
          }
        },
        d3VelocityDecay: {
          "default": 0.4,
          triggerUpdate: false,
          onChange: function onChange5(velocityDecay, state) {
            state.forceLayout.velocityDecay(velocityDecay);
          }
        },
        warmupTicks: {
          "default": 0,
          triggerUpdate: false
        },
        cooldownTicks: {
          "default": Infinity,
          triggerUpdate: false
        },
        cooldownTime: {
          "default": 15e3,
          triggerUpdate: false
        },
        onUpdate: {
          "default": function _default5() {
          },
          triggerUpdate: false
        },
        onFinishUpdate: {
          "default": function _default6() {
          },
          triggerUpdate: false
        },
        onEngineTick: {
          "default": function _default7() {
          },
          triggerUpdate: false
        },
        onEngineStop: {
          "default": function _default8() {
          },
          triggerUpdate: false
        },
        onNeedsRedraw: {
          triggerUpdate: false
        },
        isShadow: {
          "default": false,
          triggerUpdate: false
        }
      },
      methods: {
        d3Force: function d3Force(state, forceName, forceFn) {
          if (forceFn === void 0) {
            return state.forceLayout.force(forceName);
          }
          state.forceLayout.force(forceName, forceFn);
          return this;
        },
        d3ReheatSimulation: function d3ReheatSimulation(state) {
          state.forceLayout.alpha(1);
          this.resetCountdown();
          return this;
        },
        resetCountdown: function resetCountdown(state) {
          state.cntTicks = 0;
          state.startTickTime = new Date();
          state.engineRunning = true;
          return this;
        },
        isEngineRunning: function isEngineRunning(state) {
          return !!state.engineRunning;
        },
        tickFrame: function tickFrame(state) {
          !state.isShadow && layoutTick();
          paintLinks();
          !state.isShadow && paintArrows();
          !state.isShadow && paintPhotons();
          paintNodes();
          return this;
          function layoutTick() {
            if (state.engineRunning) {
              if (++state.cntTicks > state.cooldownTicks || new Date() - state.startTickTime > state.cooldownTime || state.d3AlphaMin > 0 && state.forceLayout.alpha() < state.d3AlphaMin) {
                state.engineRunning = false;
                state.onEngineStop();
              } else {
                state.forceLayout.tick();
                state.onEngineTick();
              }
            }
          }
          function paintNodes() {
            var getVisibility = index2(state.nodeVisibility);
            var getVal = index2(state.nodeVal);
            var getColor = index2(state.nodeColor);
            var getNodeCanvasObjectMode = index2(state.nodeCanvasObjectMode);
            var ctx = state.ctx;
            var padAmount = state.isShadow / state.globalScale;
            var visibleNodes = state.graphData.nodes.filter(getVisibility);
            ctx.save();
            visibleNodes.forEach(function(node) {
              var nodeCanvasObjectMode = getNodeCanvasObjectMode(node);
              if (state.nodeCanvasObject && (nodeCanvasObjectMode === "before" || nodeCanvasObjectMode === "replace")) {
                state.nodeCanvasObject(node, ctx, state.globalScale);
                if (nodeCanvasObjectMode === "replace") {
                  ctx.restore();
                  return;
                }
              }
              var r2 = Math.sqrt(Math.max(0, getVal(node) || 1)) * state.nodeRelSize + padAmount;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r2, 0, 2 * Math.PI, false);
              ctx.fillStyle = getColor(node) || "rgba(31, 120, 180, 0.92)";
              ctx.fill();
              if (state.nodeCanvasObject && nodeCanvasObjectMode === "after") {
                state.nodeCanvasObject(node, state.ctx, state.globalScale);
              }
            });
            ctx.restore();
          }
          function paintLinks() {
            var getVisibility = index2(state.linkVisibility);
            var getColor = index2(state.linkColor);
            var getWidth = index2(state.linkWidth);
            var getLineDash = index2(state.linkLineDash);
            var getCurvature = index2(state.linkCurvature);
            var getLinkCanvasObjectMode = index2(state.linkCanvasObjectMode);
            var ctx = state.ctx;
            var padAmount = state.isShadow * 2;
            var visibleLinks = state.graphData.links.filter(getVisibility);
            visibleLinks.forEach(calcLinkControlPoints);
            var beforeCustomLinks = [], afterCustomLinks = [], defaultPaintLinks = visibleLinks;
            if (state.linkCanvasObject) {
              var replaceCustomLinks = [], otherCustomLinks = [];
              visibleLinks.forEach(function(d2) {
                return ({
                  before: beforeCustomLinks,
                  after: afterCustomLinks,
                  replace: replaceCustomLinks
                }[getLinkCanvasObjectMode(d2)] || otherCustomLinks).push(d2);
              });
              defaultPaintLinks = [].concat(_toConsumableArray3(beforeCustomLinks), afterCustomLinks, otherCustomLinks);
              beforeCustomLinks = beforeCustomLinks.concat(replaceCustomLinks);
            }
            ctx.save();
            beforeCustomLinks.forEach(function(link) {
              return state.linkCanvasObject(link, ctx, state.globalScale);
            });
            ctx.restore();
            var linksPerColor = index5(defaultPaintLinks, [getColor, getWidth, getLineDash]);
            ctx.save();
            Object.entries(linksPerColor).forEach(function(_ref) {
              var _ref2 = _slicedToArray4(_ref, 2), color2 = _ref2[0], linksPerWidth = _ref2[1];
              var lineColor = !color2 || color2 === "undefined" ? "rgba(0,0,0,0.15)" : color2;
              Object.entries(linksPerWidth).forEach(function(_ref3) {
                var _ref4 = _slicedToArray4(_ref3, 2), width = _ref4[0], linesPerLineDash = _ref4[1];
                var lineWidth = (width || 1) / state.globalScale + padAmount;
                Object.entries(linesPerLineDash).forEach(function(_ref5) {
                  var _ref6 = _slicedToArray4(_ref5, 2);
                  _ref6[0];
                  var links = _ref6[1];
                  var lineDashSegments = getLineDash(links[0]);
                  ctx.beginPath();
                  links.forEach(function(link) {
                    var start2 = link.source;
                    var end = link.target;
                    if (!start2 || !end || !start2.hasOwnProperty("x") || !end.hasOwnProperty("x"))
                      return;
                    ctx.moveTo(start2.x, start2.y);
                    var controlPoints = link.__controlPoints;
                    if (!controlPoints) {
                      ctx.lineTo(end.x, end.y);
                    } else {
                      ctx[controlPoints.length === 2 ? "quadraticCurveTo" : "bezierCurveTo"].apply(ctx, _toConsumableArray3(controlPoints).concat([end.x, end.y]));
                    }
                  });
                  ctx.strokeStyle = lineColor;
                  ctx.lineWidth = lineWidth;
                  ctx.setLineDash(lineDashSegments || []);
                  ctx.stroke();
                });
              });
            });
            ctx.restore();
            ctx.save();
            afterCustomLinks.forEach(function(link) {
              return state.linkCanvasObject(link, ctx, state.globalScale);
            });
            ctx.restore();
            function calcLinkControlPoints(link) {
              var curvature = getCurvature(link);
              if (!curvature) {
                link.__controlPoints = null;
                return;
              }
              var start2 = link.source;
              var end = link.target;
              if (!start2 || !end || !start2.hasOwnProperty("x") || !end.hasOwnProperty("x"))
                return;
              var l2 = Math.sqrt(Math.pow(end.x - start2.x, 2) + Math.pow(end.y - start2.y, 2));
              if (l2 > 0) {
                var a3 = Math.atan2(end.y - start2.y, end.x - start2.x);
                var d2 = l2 * curvature;
                var cp = {
                  x: (start2.x + end.x) / 2 + d2 * Math.cos(a3 - Math.PI / 2),
                  y: (start2.y + end.y) / 2 + d2 * Math.sin(a3 - Math.PI / 2)
                };
                link.__controlPoints = [cp.x, cp.y];
              } else {
                var _d = curvature * 70;
                link.__controlPoints = [end.x, end.y - _d, end.x + _d, end.y];
              }
            }
          }
          function paintArrows() {
            var ARROW_WH_RATIO = 1.6;
            var ARROW_VLEN_RATIO = 0.2;
            var getLength = index2(state.linkDirectionalArrowLength);
            var getRelPos = index2(state.linkDirectionalArrowRelPos);
            var getVisibility = index2(state.linkVisibility);
            var getColor = index2(state.linkDirectionalArrowColor || state.linkColor);
            var getNodeVal = index2(state.nodeVal);
            var ctx = state.ctx;
            ctx.save();
            state.graphData.links.filter(getVisibility).forEach(function(link) {
              var arrowLength = getLength(link);
              if (!arrowLength || arrowLength < 0)
                return;
              var start2 = link.source;
              var end = link.target;
              if (!start2 || !end || !start2.hasOwnProperty("x") || !end.hasOwnProperty("x"))
                return;
              var startR = Math.sqrt(Math.max(0, getNodeVal(start2) || 1)) * state.nodeRelSize;
              var endR = Math.sqrt(Math.max(0, getNodeVal(end) || 1)) * state.nodeRelSize;
              var arrowRelPos = Math.min(1, Math.max(0, getRelPos(link)));
              var arrowColor = getColor(link) || "rgba(0,0,0,0.28)";
              var arrowHalfWidth = arrowLength / ARROW_WH_RATIO / 2;
              var bzLine = link.__controlPoints && _construct(Bezier, [start2.x, start2.y].concat(_toConsumableArray3(link.__controlPoints), [end.x, end.y]));
              var getCoordsAlongLine = bzLine ? function(t3) {
                return bzLine.get(t3);
              } : function(t3) {
                return {
                  x: start2.x + (end.x - start2.x) * t3 || 0,
                  y: start2.y + (end.y - start2.y) * t3 || 0
                };
              };
              var lineLen = bzLine ? bzLine.length() : Math.sqrt(Math.pow(end.x - start2.x, 2) + Math.pow(end.y - start2.y, 2));
              var posAlongLine = startR + arrowLength + (lineLen - startR - endR - arrowLength) * arrowRelPos;
              var arrowHead = getCoordsAlongLine(posAlongLine / lineLen);
              var arrowTail = getCoordsAlongLine((posAlongLine - arrowLength) / lineLen);
              var arrowTailVertex = getCoordsAlongLine((posAlongLine - arrowLength * (1 - ARROW_VLEN_RATIO)) / lineLen);
              var arrowTailAngle = Math.atan2(arrowHead.y - arrowTail.y, arrowHead.x - arrowTail.x) - Math.PI / 2;
              ctx.beginPath();
              ctx.moveTo(arrowHead.x, arrowHead.y);
              ctx.lineTo(arrowTail.x + arrowHalfWidth * Math.cos(arrowTailAngle), arrowTail.y + arrowHalfWidth * Math.sin(arrowTailAngle));
              ctx.lineTo(arrowTailVertex.x, arrowTailVertex.y);
              ctx.lineTo(arrowTail.x - arrowHalfWidth * Math.cos(arrowTailAngle), arrowTail.y - arrowHalfWidth * Math.sin(arrowTailAngle));
              ctx.fillStyle = arrowColor;
              ctx.fill();
            });
            ctx.restore();
          }
          function paintPhotons() {
            var getNumPhotons = index2(state.linkDirectionalParticles);
            var getSpeed = index2(state.linkDirectionalParticleSpeed);
            var getOffset = index2(state.linkDirectionalParticleOffset);
            var getDiameter = index2(state.linkDirectionalParticleWidth);
            var getVisibility = index2(state.linkVisibility);
            var getColor = index2(state.linkDirectionalParticleColor || state.linkColor);
            var ctx = state.ctx;
            ctx.save();
            state.graphData.links.filter(getVisibility).forEach(function(link) {
              var numCyclePhotons = getNumPhotons(link);
              if (!link.hasOwnProperty("__photons") || !link.__photons.length)
                return;
              var start2 = link.source;
              var end = link.target;
              if (!start2 || !end || !start2.hasOwnProperty("x") || !end.hasOwnProperty("x"))
                return;
              var particleSpeed = getSpeed(link);
              var particleOffset = Math.abs(getOffset(link));
              var photons = link.__photons || [];
              var photonR = Math.max(0, getDiameter(link) / 2) / Math.sqrt(state.globalScale);
              var photonColor = getColor(link) || "rgba(0,0,0,0.28)";
              ctx.fillStyle = photonColor;
              var bzLine = link.__controlPoints ? _construct(Bezier, [start2.x, start2.y].concat(_toConsumableArray3(link.__controlPoints), [end.x, end.y])) : null;
              var cyclePhotonIdx = 0;
              var needsCleanup = false;
              photons.forEach(function(photon) {
                var singleHop = !!photon.__singleHop;
                if (!photon.hasOwnProperty("__progressRatio")) {
                  photon.__progressRatio = singleHop ? 0 : (cyclePhotonIdx + particleOffset) / numCyclePhotons;
                }
                !singleHop && cyclePhotonIdx++;
                photon.__progressRatio += particleSpeed;
                if (photon.__progressRatio >= 1) {
                  if (!singleHop) {
                    photon.__progressRatio = photon.__progressRatio % 1;
                  } else {
                    needsCleanup = true;
                    return;
                  }
                }
                var photonPosRatio = photon.__progressRatio;
                var coords = bzLine ? bzLine.get(photonPosRatio) : {
                  x: start2.x + (end.x - start2.x) * photonPosRatio || 0,
                  y: start2.y + (end.y - start2.y) * photonPosRatio || 0
                };
                if (state.linkDirectionalParticleCanvasObject) {
                  state.linkDirectionalParticleCanvasObject(coords.x, coords.y, link, ctx, state.globalScale);
                } else {
                  ctx.beginPath();
                  ctx.arc(coords.x, coords.y, photonR, 0, 2 * Math.PI, false);
                  ctx.fill();
                }
              });
              if (needsCleanup) {
                link.__photons = link.__photons.filter(function(photon) {
                  return !photon.__singleHop || photon.__progressRatio <= 1;
                });
              }
            });
            ctx.restore();
          }
        },
        emitParticle: function emitParticle(state, link) {
          if (link) {
            !link.__photons && (link.__photons = []);
            link.__photons.push({
              __singleHop: true
            });
          }
          return this;
        }
      },
      stateInit: function stateInit() {
        return {
          forceLayout: simulation_default().force("link", link_default()).force("charge", manyBody_default()).force("center", center_default()).force("dagRadial", null).stop(),
          engineRunning: false
        };
      },
      init: function init3(canvasCtx, state) {
        state.ctx = canvasCtx;
      },
      update: function update3(state, changedProps) {
        state.engineRunning = false;
        state.onUpdate();
        if (state.nodeAutoColorBy !== null) {
          autoColorObjects(state.graphData.nodes, index2(state.nodeAutoColorBy), state.nodeColor);
        }
        if (state.linkAutoColorBy !== null) {
          autoColorObjects(state.graphData.links, index2(state.linkAutoColorBy), state.linkColor);
        }
        state.graphData.links.forEach(function(link) {
          link.source = link[state.linkSource];
          link.target = link[state.linkTarget];
        });
        state.forceLayout.stop().alpha(1).nodes(state.graphData.nodes);
        var linkForce = state.forceLayout.force("link");
        if (linkForce) {
          linkForce.id(function(d2) {
            return d2[state.nodeId];
          }).links(state.graphData.links);
        }
        var nodeDepths = state.dagMode && getDagDepths(state.graphData, function(node) {
          return node[state.nodeId];
        }, {
          nodeFilter: state.dagNodeFilter,
          onLoopError: state.onDagError || void 0
        });
        var maxDepth = Math.max.apply(Math, _toConsumableArray3(Object.values(nodeDepths || [])));
        var dagLevelDistance = state.dagLevelDistance || state.graphData.nodes.length / (maxDepth || 1) * DAG_LEVEL_NODE_RATIO * (["radialin", "radialout"].indexOf(state.dagMode) !== -1 ? 0.7 : 1);
        if (["lr", "rl", "td", "bu"].includes(changedProps.dagMode)) {
          var resetProp = ["lr", "rl"].includes(changedProps.dagMode) ? "fx" : "fy";
          state.graphData.nodes.filter(state.dagNodeFilter).forEach(function(node) {
            return delete node[resetProp];
          });
        }
        if (["lr", "rl", "td", "bu"].includes(state.dagMode)) {
          var invert = ["rl", "bu"].includes(state.dagMode);
          var fixFn = function fixFn2(node) {
            return (nodeDepths[node[state.nodeId]] - maxDepth / 2) * dagLevelDistance * (invert ? -1 : 1);
          };
          var _resetProp = ["lr", "rl"].includes(state.dagMode) ? "fx" : "fy";
          state.graphData.nodes.filter(state.dagNodeFilter).forEach(function(node) {
            return node[_resetProp] = fixFn(node);
          });
        }
        state.forceLayout.force("dagRadial", ["radialin", "radialout"].indexOf(state.dagMode) !== -1 ? radial_default(function(node) {
          var nodeDepth = nodeDepths[node[state.nodeId]] || -1;
          return (state.dagMode === "radialin" ? maxDepth - nodeDepth : nodeDepth) * dagLevelDistance;
        }).strength(function(node) {
          return state.dagNodeFilter(node) ? 1 : 0;
        }) : null);
        for (var i2 = 0; i2 < state.warmupTicks && !(state.d3AlphaMin > 0 && state.forceLayout.alpha() < state.d3AlphaMin); i2++) {
          state.forceLayout.tick();
        }
        this.resetCountdown();
        state.onFinishUpdate();
      }
    });
    HOVER_CANVAS_THROTTLE_DELAY = 800;
    ZOOM2NODES_FACTOR = 4;
    DRAG_CLICK_TOLERANCE_PX = 5;
    bindFG = linkKapsule("forceGraph", CanvasForceGraph);
    bindBoth = linkKapsule(["forceGraph", "shadowGraph"], CanvasForceGraph);
    linkedProps = Object.assign.apply(Object, _toConsumableArray3(["nodeColor", "nodeAutoColorBy", "nodeCanvasObject", "nodeCanvasObjectMode", "linkColor", "linkAutoColorBy", "linkLineDash", "linkWidth", "linkCanvasObject", "linkCanvasObjectMode", "linkDirectionalArrowLength", "linkDirectionalArrowColor", "linkDirectionalArrowRelPos", "linkDirectionalParticles", "linkDirectionalParticleSpeed", "linkDirectionalParticleOffset", "linkDirectionalParticleWidth", "linkDirectionalParticleColor", "linkDirectionalParticleCanvasObject", "dagMode", "dagLevelDistance", "dagNodeFilter", "onDagError", "d3AlphaMin", "d3AlphaDecay", "d3VelocityDecay", "warmupTicks", "cooldownTicks", "cooldownTime", "onEngineTick", "onEngineStop"].map(function(p2) {
      return _defineProperty2({}, p2, bindFG.linkProp(p2));
    })).concat(_toConsumableArray3(["nodeRelSize", "nodeId", "nodeVal", "nodeVisibility", "linkSource", "linkTarget", "linkVisibility", "linkCurvature"].map(function(p2) {
      return _defineProperty2({}, p2, bindBoth.linkProp(p2));
    }))));
    linkedMethods = Object.assign.apply(Object, _toConsumableArray3(["d3Force", "d3ReheatSimulation", "emitParticle"].map(function(p2) {
      return _defineProperty2({}, p2, bindFG.linkMethod(p2));
    })));
    forceGraph = index({
      props: _objectSpread22({
        width: {
          "default": window.innerWidth,
          onChange: function onChange6(_2, state) {
            return adjustCanvasSize(state);
          },
          triggerUpdate: false
        },
        height: {
          "default": window.innerHeight,
          onChange: function onChange7(_2, state) {
            return adjustCanvasSize(state);
          },
          triggerUpdate: false
        },
        graphData: {
          "default": {
            nodes: [],
            links: []
          },
          onChange: function onChange8(d2, state) {
            [d2.nodes, d2.links].every(function(arr) {
              return (arr || []).every(function(d3) {
                return !d3.hasOwnProperty("__indexColor");
              });
            }) && state.colorTracker.reset();
            [{
              type: "Node",
              objs: d2.nodes
            }, {
              type: "Link",
              objs: d2.links
            }].forEach(hexIndex);
            state.forceGraph.graphData(d2);
            state.shadowGraph.graphData(d2);
            function hexIndex(_ref4) {
              var type = _ref4.type, objs = _ref4.objs;
              objs.filter(function(d3) {
                if (!d3.hasOwnProperty("__indexColor"))
                  return true;
                var cur = state.colorTracker.lookup(d3.__indexColor);
                return !cur || !cur.hasOwnProperty("d") || cur.d !== d3;
              }).forEach(function(d3) {
                d3.__indexColor = state.colorTracker.register({
                  type,
                  d: d3
                });
              });
            }
          },
          triggerUpdate: false
        },
        backgroundColor: {
          onChange: function onChange9(color2, state) {
            state.canvas && color2 && (state.canvas.style.background = color2);
          },
          triggerUpdate: false
        },
        nodeLabel: {
          "default": "name",
          triggerUpdate: false
        },
        nodePointerAreaPaint: {
          onChange: function onChange10(paintFn, state) {
            state.shadowGraph.nodeCanvasObject(!paintFn ? null : function(node, ctx, globalScale) {
              return paintFn(node, node.__indexColor, ctx, globalScale);
            });
            state.flushShadowCanvas && state.flushShadowCanvas();
          },
          triggerUpdate: false
        },
        linkPointerAreaPaint: {
          onChange: function onChange11(paintFn, state) {
            state.shadowGraph.linkCanvasObject(!paintFn ? null : function(link, ctx, globalScale) {
              return paintFn(link, link.__indexColor, ctx, globalScale);
            });
            state.flushShadowCanvas && state.flushShadowCanvas();
          },
          triggerUpdate: false
        },
        linkLabel: {
          "default": "name",
          triggerUpdate: false
        },
        linkHoverPrecision: {
          "default": 4,
          triggerUpdate: false
        },
        minZoom: {
          "default": 0.01,
          onChange: function onChange12(minZoom, state) {
            state.zoom.scaleExtent([minZoom, state.zoom.scaleExtent()[1]]);
          },
          triggerUpdate: false
        },
        maxZoom: {
          "default": 1e3,
          onChange: function onChange13(maxZoom, state) {
            state.zoom.scaleExtent([state.zoom.scaleExtent()[0], maxZoom]);
          },
          triggerUpdate: false
        },
        enableNodeDrag: {
          "default": true,
          triggerUpdate: false
        },
        enableZoomInteraction: {
          "default": true,
          triggerUpdate: false
        },
        enablePanInteraction: {
          "default": true,
          triggerUpdate: false
        },
        enableZoomPanInteraction: {
          "default": true,
          triggerUpdate: false
        },
        enablePointerInteraction: {
          "default": true,
          onChange: function onChange14(_2, state) {
            state.hoverObj = null;
          },
          triggerUpdate: false
        },
        autoPauseRedraw: {
          "default": true,
          triggerUpdate: false
        },
        onNodeDrag: {
          "default": function _default9() {
          },
          triggerUpdate: false
        },
        onNodeDragEnd: {
          "default": function _default10() {
          },
          triggerUpdate: false
        },
        onNodeClick: {
          triggerUpdate: false
        },
        onNodeRightClick: {
          triggerUpdate: false
        },
        onNodeHover: {
          triggerUpdate: false
        },
        onLinkClick: {
          triggerUpdate: false
        },
        onLinkRightClick: {
          triggerUpdate: false
        },
        onLinkHover: {
          triggerUpdate: false
        },
        onBackgroundClick: {
          triggerUpdate: false
        },
        onBackgroundRightClick: {
          triggerUpdate: false
        },
        showPointerCursor: {
          "default": true,
          triggerUpdate: false
        },
        onZoom: {
          triggerUpdate: false
        },
        onZoomEnd: {
          triggerUpdate: false
        },
        onRenderFramePre: {
          triggerUpdate: false
        },
        onRenderFramePost: {
          triggerUpdate: false
        }
      }, linkedProps),
      aliases: {
        stopAnimation: "pauseAnimation"
      },
      methods: _objectSpread22({
        graph2ScreenCoords: function graph2ScreenCoords(state, x3, y3) {
          var t3 = transform(state.canvas);
          return {
            x: x3 * t3.k + t3.x,
            y: y3 * t3.k + t3.y
          };
        },
        screen2GraphCoords: function screen2GraphCoords(state, x3, y3) {
          var t3 = transform(state.canvas);
          return {
            x: (x3 - t3.x) / t3.k,
            y: (y3 - t3.y) / t3.k
          };
        },
        centerAt: function centerAt(state, x3, y3, transitionDuration) {
          if (!state.canvas)
            return null;
          if (x3 !== void 0 || y3 !== void 0) {
            var finalPos = Object.assign({}, x3 !== void 0 ? {
              x: x3
            } : {}, y3 !== void 0 ? {
              y: y3
            } : {});
            if (!transitionDuration) {
              setCenter(finalPos);
            } else {
              state.tweenGroup.add(new Tween(getCenter()).to(finalPos, transitionDuration).easing(Easing.Quadratic.Out).onUpdate(setCenter).start());
            }
            return this;
          }
          return getCenter();
          function getCenter() {
            var t3 = transform(state.canvas);
            return {
              x: (state.width / 2 - t3.x) / t3.k,
              y: (state.height / 2 - t3.y) / t3.k
            };
          }
          function setCenter(_ref5) {
            var x4 = _ref5.x, y4 = _ref5.y;
            state.zoom.translateTo(state.zoom.__baseElem, x4 === void 0 ? getCenter().x : x4, y4 === void 0 ? getCenter().y : y4);
            state.needsRedraw = true;
          }
        },
        zoom: function zoom(state, k2, transitionDuration) {
          if (!state.canvas)
            return null;
          if (k2 !== void 0) {
            if (!transitionDuration) {
              setZoom(k2);
            } else {
              state.tweenGroup.add(new Tween({
                k: getZoom()
              }).to({
                k: k2
              }, transitionDuration).easing(Easing.Quadratic.Out).onUpdate(function(_ref6) {
                var k3 = _ref6.k;
                return setZoom(k3);
              }).start());
            }
            return this;
          }
          return getZoom();
          function getZoom() {
            return transform(state.canvas).k;
          }
          function setZoom(k3) {
            state.zoom.scaleTo(state.zoom.__baseElem, k3);
            state.needsRedraw = true;
          }
        },
        zoomToFit: function zoomToFit(state) {
          var transitionDuration = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
          var padding = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 10;
          for (var _len = arguments.length, bboxArgs = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
            bboxArgs[_key - 3] = arguments[_key];
          }
          var bbox = this.getGraphBbox.apply(this, bboxArgs);
          if (bbox) {
            var center = {
              x: (bbox.x[0] + bbox.x[1]) / 2,
              y: (bbox.y[0] + bbox.y[1]) / 2
            };
            var zoomK = Math.max(1e-12, Math.min(1e12, (state.width - padding * 2) / (bbox.x[1] - bbox.x[0]), (state.height - padding * 2) / (bbox.y[1] - bbox.y[0])));
            this.centerAt(center.x, center.y, transitionDuration);
            this.zoom(zoomK, transitionDuration);
          }
          return this;
        },
        getGraphBbox: function getGraphBbox(state) {
          var nodeFilter = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : function() {
            return true;
          };
          var getVal = index2(state.nodeVal);
          var getR = function getR2(node) {
            return Math.sqrt(Math.max(0, getVal(node) || 1)) * state.nodeRelSize;
          };
          var nodesPos = state.graphData.nodes.filter(nodeFilter).map(function(node) {
            return {
              x: node.x,
              y: node.y,
              r: getR(node)
            };
          });
          return !nodesPos.length ? null : {
            x: [min(nodesPos, function(node) {
              return node.x - node.r;
            }), max(nodesPos, function(node) {
              return node.x + node.r;
            })],
            y: [min(nodesPos, function(node) {
              return node.y - node.r;
            }), max(nodesPos, function(node) {
              return node.y + node.r;
            })]
          };
        },
        pauseAnimation: function pauseAnimation(state) {
          if (state.animationFrameRequestId) {
            cancelAnimationFrame(state.animationFrameRequestId);
            state.animationFrameRequestId = null;
          }
          return this;
        },
        resumeAnimation: function resumeAnimation(state) {
          if (!state.animationFrameRequestId) {
            this._animationCycle();
          }
          return this;
        },
        _destructor: function _destructor() {
          this.pauseAnimation();
          this.graphData({
            nodes: [],
            links: []
          });
        }
      }, linkedMethods),
      stateInit: function stateInit2() {
        return {
          lastSetZoom: 1,
          zoom: zoom_default2(),
          forceGraph: new CanvasForceGraph(),
          shadowGraph: new CanvasForceGraph().cooldownTicks(0).nodeColor("__indexColor").linkColor("__indexColor").isShadow(true),
          colorTracker: new _default(),
          tweenGroup: new Group()
        };
      },
      init: function init4(domNode, state) {
        var _this = this;
        domNode.innerHTML = "";
        var container = document.createElement("div");
        container.classList.add("force-graph-container");
        container.style.position = "relative";
        domNode.appendChild(container);
        state.canvas = document.createElement("canvas");
        if (state.backgroundColor)
          state.canvas.style.background = state.backgroundColor;
        container.appendChild(state.canvas);
        state.shadowCanvas = document.createElement("canvas");
        var ctx = state.canvas.getContext("2d");
        var shadowCtx = state.shadowCanvas.getContext("2d", {
          willReadFrequently: true
        });
        var pointerPos = {
          x: -1e12,
          y: -1e12
        };
        var getObjUnderPointer = function getObjUnderPointer2() {
          var obj = null;
          var pxScale = window.devicePixelRatio;
          var px = pointerPos.x > 0 && pointerPos.y > 0 ? shadowCtx.getImageData(pointerPos.x * pxScale, pointerPos.y * pxScale, 1, 1) : null;
          px && (obj = state.colorTracker.lookup(px.data));
          return obj;
        };
        select_default2(state.canvas).call(drag_default().subject(function() {
          if (!state.enableNodeDrag) {
            return null;
          }
          var obj = getObjUnderPointer();
          return obj && obj.type === "Node" ? obj.d : null;
        }).on("start", function(ev) {
          var obj = ev.subject;
          obj.__initialDragPos = {
            x: obj.x,
            y: obj.y,
            fx: obj.fx,
            fy: obj.fy
          };
          if (!ev.active) {
            obj.fx = obj.x;
            obj.fy = obj.y;
          }
          state.canvas.classList.add("grabbable");
        }).on("drag", function(ev) {
          var obj = ev.subject;
          var initPos = obj.__initialDragPos;
          var dragPos = ev;
          var k2 = transform(state.canvas).k;
          var translate = {
            x: initPos.x + (dragPos.x - initPos.x) / k2 - obj.x,
            y: initPos.y + (dragPos.y - initPos.y) / k2 - obj.y
          };
          ["x", "y"].forEach(function(c3) {
            return obj["f".concat(c3)] = obj[c3] = initPos[c3] + (dragPos[c3] - initPos[c3]) / k2;
          });
          if (!obj.__dragged && DRAG_CLICK_TOLERANCE_PX >= Math.sqrt(sum(["x", "y"].map(function(k3) {
            return Math.pow(ev[k3] - initPos[k3], 2);
          }))))
            return;
          state.forceGraph.d3AlphaTarget(0.3).resetCountdown();
          state.isPointerDragging = true;
          obj.__dragged = true;
          state.onNodeDrag(obj, translate);
        }).on("end", function(ev) {
          var obj = ev.subject;
          var initPos = obj.__initialDragPos;
          var translate = {
            x: obj.x - initPos.x,
            y: obj.y - initPos.y
          };
          if (initPos.fx === void 0) {
            obj.fx = void 0;
          }
          if (initPos.fy === void 0) {
            obj.fy = void 0;
          }
          delete obj.__initialDragPos;
          if (state.forceGraph.d3AlphaTarget()) {
            state.forceGraph.d3AlphaTarget(0).resetCountdown();
          }
          state.canvas.classList.remove("grabbable");
          state.isPointerDragging = false;
          if (obj.__dragged) {
            delete obj.__dragged;
            state.onNodeDragEnd(obj, translate);
          }
        }));
        state.zoom(state.zoom.__baseElem = select_default2(state.canvas));
        state.zoom.__baseElem.on("dblclick.zoom", null);
        state.zoom.filter(function(ev) {
          return !ev.button && state.enableZoomPanInteraction && (ev.type !== "wheel" || index2(state.enableZoomInteraction)(ev)) && (ev.type === "wheel" || index2(state.enablePanInteraction)(ev));
        }).on("zoom", function(ev) {
          var t3 = ev.transform;
          [ctx, shadowCtx].forEach(function(c3) {
            resetTransform(c3);
            c3.translate(t3.x, t3.y);
            c3.scale(t3.k, t3.k);
          });
          state.isPointerDragging = true;
          state.onZoom && state.onZoom(_objectSpread22(_objectSpread22({}, t3), _this.centerAt()));
          state.needsRedraw = true;
        }).on("end", function(ev) {
          state.isPointerDragging = false;
          state.onZoomEnd && state.onZoomEnd(_objectSpread22(_objectSpread22({}, ev.transform), _this.centerAt()));
        });
        adjustCanvasSize(state);
        state.forceGraph.onNeedsRedraw(function() {
          return state.needsRedraw = true;
        }).onFinishUpdate(function() {
          if (transform(state.canvas).k === state.lastSetZoom && state.graphData.nodes.length) {
            state.zoom.scaleTo(state.zoom.__baseElem, state.lastSetZoom = ZOOM2NODES_FACTOR / Math.cbrt(state.graphData.nodes.length));
            state.needsRedraw = true;
          }
        });
        state.tooltip = new index3(container);
        ["pointermove", "pointerdown"].forEach(function(evType) {
          return container.addEventListener(evType, function(ev) {
            if (evType === "pointerdown") {
              state.isPointerPressed = true;
              state.pointerDownEvent = ev;
            }
            !state.isPointerDragging && ev.type === "pointermove" && state.onBackgroundClick && (ev.pressure > 0 || state.isPointerPressed) && (ev.pointerType === "mouse" || ev.movementX === void 0 || [ev.movementX, ev.movementY].some(function(m3) {
              return Math.abs(m3) > 1;
            })) && (state.isPointerDragging = true);
            var offset = getOffset(container);
            pointerPos.x = ev.pageX - offset.left;
            pointerPos.y = ev.pageY - offset.top;
            function getOffset(el) {
              var rect = el.getBoundingClientRect(), scrollLeft = window.pageXOffset || document.documentElement.scrollLeft, scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              return {
                top: rect.top + scrollTop,
                left: rect.left + scrollLeft
              };
            }
          }, {
            passive: true
          });
        });
        container.addEventListener("pointerup", function(ev) {
          if (!state.isPointerPressed) {
            return;
          }
          state.isPointerPressed = false;
          if (state.isPointerDragging) {
            state.isPointerDragging = false;
            return;
          }
          var cbEvents = [ev, state.pointerDownEvent];
          requestAnimationFrame(function() {
            if (ev.button === 0) {
              if (state.hoverObj) {
                var fn = state["on".concat(state.hoverObj.type, "Click")];
                fn && fn.apply(void 0, [state.hoverObj.d].concat(cbEvents));
              } else {
                state.onBackgroundClick && state.onBackgroundClick.apply(state, cbEvents);
              }
            }
            if (ev.button === 2) {
              if (state.hoverObj) {
                var _fn = state["on".concat(state.hoverObj.type, "RightClick")];
                _fn && _fn.apply(void 0, [state.hoverObj.d].concat(cbEvents));
              } else {
                state.onBackgroundRightClick && state.onBackgroundRightClick.apply(state, cbEvents);
              }
            }
          });
        }, {
          passive: true
        });
        container.addEventListener("contextmenu", function(ev) {
          if (!state.onBackgroundRightClick && !state.onNodeRightClick && !state.onLinkRightClick)
            return true;
          ev.preventDefault();
          return false;
        });
        state.forceGraph(ctx);
        state.shadowGraph(shadowCtx);
        var refreshShadowCanvas = throttle_default(function() {
          clearCanvas(shadowCtx, state.width, state.height);
          state.shadowGraph.linkWidth(function(l2) {
            return index2(state.linkWidth)(l2) + state.linkHoverPrecision;
          });
          var t3 = transform(state.canvas);
          state.shadowGraph.globalScale(t3.k).tickFrame();
        }, HOVER_CANVAS_THROTTLE_DELAY);
        state.flushShadowCanvas = refreshShadowCanvas.flush;
        (this._animationCycle = function animate() {
          var doRedraw = !state.autoPauseRedraw || !!state.needsRedraw || state.forceGraph.isEngineRunning() || state.graphData.links.some(function(d2) {
            return d2.__photons && d2.__photons.length;
          });
          state.needsRedraw = false;
          if (state.enablePointerInteraction) {
            var obj = !state.isPointerDragging ? getObjUnderPointer() : null;
            if (obj !== state.hoverObj) {
              var prevObj = state.hoverObj;
              var prevObjType = prevObj ? prevObj.type : null;
              var objType = obj ? obj.type : null;
              if (prevObjType && prevObjType !== objType) {
                var fn = state["on".concat(prevObjType, "Hover")];
                fn && fn(null, prevObj.d);
              }
              if (objType) {
                var _fn2 = state["on".concat(objType, "Hover")];
                _fn2 && _fn2(obj.d, prevObjType === objType ? prevObj.d : null);
              }
              state.tooltip.content(obj ? index2(state["".concat(obj.type.toLowerCase(), "Label")])(obj.d) || null : null);
              state.canvas.classList[(obj && state["on".concat(objType, "Click")] || !obj && state.onBackgroundClick) && index2(state.showPointerCursor)(obj === null || obj === void 0 ? void 0 : obj.d) ? "add" : "remove"]("clickable");
              state.hoverObj = obj;
            }
            doRedraw && refreshShadowCanvas();
          }
          if (doRedraw) {
            clearCanvas(ctx, state.width, state.height);
            var globalScale = transform(state.canvas).k;
            state.onRenderFramePre && state.onRenderFramePre(ctx, globalScale);
            state.forceGraph.globalScale(globalScale).tickFrame();
            state.onRenderFramePost && state.onRenderFramePost(ctx, globalScale);
          }
          state.tweenGroup.update();
          state.animationFrameRequestId = requestAnimationFrame(animate);
        })();
      },
      update: function updateFn(state) {
      }
    });
  }
});
init_force_graph();
export {
  forceGraph as default
};
/**
 * @license
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="es" -o ./`
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
