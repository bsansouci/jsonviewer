import React, { Component } from 'react';
import TreeView from 'react-treeview';

const getType = obj => ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1];


/* Tree is of the form:
 * type rec Node = {val: Boolean, children: list Node};
 */
const drill = (tree, [firstElement, ...rest]) => !firstElement ? tree : drill(tree[firstElement].children, rest);

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
        val: false
      };
    case "Array":
      return {
        children: tree.map(makeCollapsedTree),
        val: false
      };
    case "Function":
    case "String":
    case "Boolean":
    case "Number":
      return {
        val: false,
        children: []
      };
    default:
      return;
  }
};

const diffAndMerg = (tree1, tree2) => {
  const type1 = getType(tree1);
  const type2 = getType(tree2);
  // Both being undefined
  if (!tree1 && !tree2) return tree2;

  // One of them is undefined. Or different types.
  if (type1 !== type2) return tree2;

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

    
  getTreeView(tree, prevTreeCollapsedState, path = []) {
    const type = getType(tree);
    const key = path.join("|");
    const label = <span className="node">{type}</span>;

    switch (type) {
      case "Object":
        return (
          <TreeView 
            key={key} 
            nodeLabel={label}
            defaultCollapsed={true}
            collapsed={prevTreeCollapsedState ? drill(prevTreeCollapsedState, path).val : false}
            onClick={this.updateCollapseState.bind(this, path)}>
              {Object.keys(tree).map((key, i) => 
                this.getTreeView(tree[key], prevTreeCollapsedState, [...path, key]))}
          </TreeView>
        );
      case "Array":
        return (
          <TreeView 
            key={key} 
            nodeLabel={label} 
            defaultCollapsed={true}
            collapsed={prevTreeCollapsedState ? drill(prevTreeCollapsedState, path).val : false}
            onClick={this.updateCollapseState.bind(this, path)}>
              {tree.map((val, i) => this.getTreeView(val, [...path, i]))}
          </TreeView>
        );
      case "Function":
      case "String":
      case "Boolean":
      case "Number":
        return <div className="node">{type}: {tree.toString()}</div>;
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
    let valToUpdate = drill(newTree, path);
    console.log(valToUpdate);
    if (valToUpdate) {
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
      prevTreeCollapsedState = diffAndMerg(prevTreeCollapsedState, makeCollapsedTree(tree).children);
    }
    this.setState({tree, prevTreeCollapsedState});
  }
}
