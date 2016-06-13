import React, { Component } from 'react';
import TreeView from 'react-treeview';

const getType = obj => ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1];


/* Tree is of the form:
 * type rec Node = {val: Boolean, children: list Node};
 */
const drill = (tree, [firstElement, ...rest]) => firstElement == null ? tree : drill(tree[firstElement], rest);

const makeCollapsedTree = tree => {
  const type = getType(tree);

  switch (type) {
    case "Object":
      let children = {};
      Object.keys(tree).forEach(k => {
        children[k] = makeCollapsedTree(tree[k]);
      });
      return {
        children,
        val: true
      };
    case "Array":
      return {
        children: tree.map(makeCollapsedTree),
        val: true
      };
    case "Function":
    case "String":
    case "Boolean":
    case "Number":
      return {
        val: true,
        children: []
      };
    default:
      return;
  }
};

const toCollapsedTreePath = path => path.reduce((acc, v) => [...acc, "children", v], []);

const diffAndMerg = (tree1, tree2) => {
  // Fast path
  if (tree1 === tree2) return tree2;

  const type1 = getType(tree1);
  const type2 = getType(tree2);
  
  // Both being undefined
  if (!tree1 && !tree2) return tree2;

  // One of them is undefined. Or different types.
  if (type1 !== type2) return tree1;
  
  switch (type1) {
    case "Object":
      let newObj = {...tree1};
      Object.keys(tree2).forEach(k => {
        newObj[k] = diffAndMerg(tree1[k], tree2[k]);
      });
      return newObj;
    case "Array":
      let newArr = [...tree1];
      tree2.forEach((v, i) => {
        if (i >= tree1.length) {
          newArr.push(v);
        } else {
          const newVal = diffAndMerg(tree1[i], v);
          newArr[i] = newVal;
        }
      });
      return newArr;
    case "Function":
    case "String":
    case "Boolean":
    case "Number":
      return tree2;
    default:
      return tree2;
  }
};

// console.log(diffAndMerg({a: 1}, {b: 2}));
// console.log(diffAndMerg({a: 1}, {a: 2}));
// console.log(diffAndMerg({a: {b: 10}}, {a: {c: 11}}));
// console.log(diffAndMerg({a: {b: 10}}, {a: {b: 11}}));
// console.log(diffAndMerg({a: {b: 10}}, {a: -1}));
// console.log(diffAndMerg({a: {b: [10, 2, 3, 4, 5]}}, {a: {b: [1, 2, 3, 4]}}));

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {tree: null, prevTreeCollapsedState: null};
    this.updateTree = this.updateTree.bind(this);
    this.updateCollapseState = this.updateCollapseState.bind(this);
    this.getTreeView = this.getTreeView.bind(this);
  }

    
  getTreeView(tree, prevTreeCollapsedState, path = [], name="") {
    const type = getType(tree);
    const key = path.join("|");
    const label = <span className="node">{name.length > 0 ? name + ": " : ""}{type}</span>;
    switch (type) {
      case "Object":
        return (
          <TreeView 
            key={key} 
            nodeLabel={label}
            defaultCollapsed={true}
            collapsed={prevTreeCollapsedState ? drill(prevTreeCollapsedState, toCollapsedTreePath(path)).val : false}
            onClick={this.updateCollapseState.bind(this, path)}>
              {Object.keys(tree).map((key, i) => 
                this.getTreeView(tree[key], prevTreeCollapsedState, [...path, key], key))}
          </TreeView>
        );
      case "Array":
        return (
          <TreeView 
            key={key} 
            nodeLabel={label} 
            defaultCollapsed={true}
            collapsed={prevTreeCollapsedState ? drill(prevTreeCollapsedState, toCollapsedTreePath(path)).val : false}
            onClick={this.updateCollapseState.bind(this, path)}>
              {tree.map((val, i) => this.getTreeView(val, prevTreeCollapsedState, [...path, i], i.toString()))}
          </TreeView>
        );
      case "Function":
      case "String":
      case "Boolean":
      case "Number":
        return <div className="node">{name} : {type} {tree.toString()}</div>;
      default:
        return;
    }
  }

  render() {
    const {tree} = this.state;
    const treeView = this.getTreeView(tree, this.state.prevTreeCollapsedState);
    return (
      <div>
        <textarea onChange={this.updateTree} />
        {treeView}
      </div>
    );
  }

  updateCollapseState(path) {
    let newTree = JSON.parse(JSON.stringify(this.state.prevTreeCollapsedState));
    let valToUpdate = drill(newTree, toCollapsedTreePath(path));
    if (valToUpdate != null) {
      // Dirty dirty mutations
      valToUpdate.val = !valToUpdate.val;
    }

    this.setState({prevTreeCollapsedState: newTree});
  }

  updateTree(e) {
    let tree = null;
    let thereWasAParsingError = false;
    try {
      tree = JSON.parse(e.target.value);
    } catch (e) {
      tree = e.toString();
      thereWasAParsingError = true;
    }

    let prevTreeCollapsedState = this.state.prevTreeCollapsedState;
    if (!thereWasAParsingError) {
      prevTreeCollapsedState = diffAndMerg(makeCollapsedTree(tree), prevTreeCollapsedState);
    }
    this.setState({tree, prevTreeCollapsedState});
  }
}
